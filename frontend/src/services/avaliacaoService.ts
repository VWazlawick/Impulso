import type {
  AvaliacaoListaResponse,
  AvaliacaoRequest,
  AvaliacaoResponse,
  FichaResponse,
  RespostaRequest,
} from '../types/avaliacao.ts'
import { hojeIso, idadeEm } from '../utils/datas.ts'
import { paraCentimetros, validarMedidas } from '../utils/medidas.ts'
import { copiar, esperar, novoId, solicitante, type Solicitante } from './exemplo/apoio.ts'
import { banco, type AlunoExemplo, type AvaliacaoExemplo, type RespostaExemplo } from './exemplo/banco.ts'
import { montarAvaliacao, montarAvaliacaoLista, montarGrupoDetalhe } from './exemplo/montar.ts'
import { alunoPermitido } from './exemplo/permissoes.ts'
import { falharSeHouver } from './exemplo/validacoes.ts'
import { ErroApi } from './erros.ts'

// Por enquanto usa os dados de exemplo e repete as regras do AvaliacaoService.

function validarAtivo(aluno: AlunoExemplo) {
  if (!aluno.stAtivo) {
    throw new ErroApi(409, 'O aluno está inativo: reative o cadastro para gerar avaliações!')
  }
}

function calcularIdade(aluno: AlunoExemplo, data: string) {
  if (data > hojeIso()) {
    throw new ErroApi(400, 'A data de avaliação não pode ser futura!')
  }
  if (data < aluno.dtNascimento) {
    throw new ErroApi(400, 'A data de avaliação é anterior ao nascimento do aluno!')
  }
  return idadeEm(aluno.dtNascimento, data)
}

function grupoPorIdade(idade: number) {
  const grupo = banco.grupos.find((g) => idade >= g.nrIdadeMin && idade <= g.nrIdadeMax)
  if (!grupo) {
    throw new ErroApi(404, `Nenhum grupo atende a idade de ${idade} anos!`)
  }
  return grupo
}

// Como o construtor do AvaliacaoRequest: estatura e cintura em metro viram centímetro.
function converter(request: AvaliacaoRequest): AvaliacaoRequest {
  return { ...request, vlEstatura: paraCentimetros(request.vlEstatura), vlCintura: paraCentimetros(request.vlCintura) }
}

function validar(request: AvaliacaoRequest) {
  const campos: Record<string, string> = validarMedidas(request)
  if (!request.dtAvaliacao) {
    campos.dtAvaliacao = 'A data de avaliação é obrigatória!'
  }
  if (request.respostas.length === 0) {
    campos.respostas = 'Informe pelo menos uma resposta!'
  }
  request.respostas.forEach((resposta, indice) => {
    if (resposta.vlResposta !== null && resposta.vlResposta < 0) {
      campos[`respostas[${indice}].vlResposta`] = 'O valor não pode ser negativo!'
    }
  })
  falharSeHouver(campos)
}

// Igual ao preencherResposta: só perguntas do grupo, uma resposta por pergunta, no formato certo.
function lerRespostas(grupoId: number, respostas: RespostaRequest[]): RespostaExemplo[] {
  const subgrupos = banco.subgrupos.filter((s) => s.grupoId === grupoId).map((s) => s.id)
  const respondidas = new Set<number>()
  return respostas.map((resposta) => {
    const pergunta = banco.perguntas.find((p) => p.id === resposta.perguntaId && subgrupos.includes(p.subgrupoId))
    if (!pergunta) {
      throw new ErroApi(400, `A pergunta ${resposta.perguntaId} não pertence ao grupo desta avaliação!`)
    }
    if (respondidas.has(pergunta.id)) {
      throw new ErroApi(400, `A pergunta ${pergunta.id} foi respondida mais de uma vez!`)
    }
    respondidas.add(pergunta.id)
    if (pergunta.tpResposta === 'NUMERO' && (resposta.vlResposta === null || resposta.tpOpcao !== null)) {
      throw new ErroApi(400, `A pergunta ${pergunta.id} espera um número em vlResposta!`)
    }
    if (pergunta.tpResposta === 'SIM_NAO_PARCIAL' && (resposta.tpOpcao === null || resposta.vlResposta !== null)) {
      throw new ErroApi(400, `A pergunta ${pergunta.id} espera SIM, NAO ou PARCIAL em tpOpcao!`)
    }
    return { perguntaId: pergunta.id, vlResposta: resposta.vlResposta, tpOpcao: resposta.tpOpcao }
  })
}

// Igual ao atualizarMedidas: só a avaliação mais recente leva as medidas para o cadastro.
function atualizarMedidas(aluno: AlunoExemplo, avaliacao: AvaliacaoExemplo) {
  const temMaisNova = banco.avaliacoes.some((a) => a.alunoId === aluno.id && a.dtAvaliacao > avaliacao.dtAvaliacao)
  if (temMaisNova) {
    return
  }
  if (avaliacao.vlPeso !== null) {
    aluno.vlPeso = avaliacao.vlPeso
  }
  if (avaliacao.vlEstatura !== null) {
    aluno.vlEstatura = avaliacao.vlEstatura
  }
  if (avaliacao.vlCintura !== null) {
    aluno.vlCintura = avaliacao.vlCintura
  }
}

function avaliacaoPermitida(alunoId: number, id: number, quem: Solicitante) {
  const aluno = alunoPermitido(alunoId, quem)
  const avaliacao = banco.avaliacoes.find((a) => a.id === id && a.alunoId === alunoId)
  if (!avaliacao) {
    throw new ErroApi(404, 'Avaliação não encontrada!')
  }
  return { aluno, avaliacao }
}

export const avaliacaoService = {
  // GET /api/aluno/{alunoId}/avaliacao/ficha?dtAvaliacao=  (sem data, vale hoje)
  async ficha(alunoId: number, dtAvaliacao?: string): Promise<FichaResponse> {
    await esperar()
    const aluno = alunoPermitido(alunoId, solicitante('ADMIN', 'PROFISSIONAL'))
    validarAtivo(aluno)
    const data = dtAvaliacao || hojeIso()
    const idade = calcularIdade(aluno, data)
    return copiar({
      alunoId: aluno.id,
      nmAluno: aluno.nmPessoa,
      dtAvaliacao: data,
      nrIdade: idade,
      vlPeso: aluno.vlPeso,
      vlEstatura: aluno.vlEstatura,
      vlCintura: aluno.vlCintura,
      grupo: montarGrupoDetalhe(grupoPorIdade(idade)),
    })
  },

  // POST /api/aluno/{alunoId}/avaliacao
  async registrar(alunoId: number, request: AvaliacaoRequest): Promise<AvaliacaoResponse> {
    await esperar()
    const aluno = alunoPermitido(alunoId, solicitante('ADMIN', 'PROFISSIONAL'))
    validarAtivo(aluno)
    const dados = converter(request)
    validar(dados)
    const grupo = grupoPorIdade(calcularIdade(aluno, dados.dtAvaliacao))
    const avaliacao: AvaliacaoExemplo = {
      id: novoId(),
      alunoId: aluno.id,
      profissionalId: aluno.profissionalId,
      grupoId: grupo.id,
      dtAvaliacao: dados.dtAvaliacao,
      vlPeso: dados.vlPeso,
      vlEstatura: dados.vlEstatura,
      vlCintura: dados.vlCintura,
      respostas: lerRespostas(grupo.id, dados.respostas),
    }
    banco.avaliacoes.push(avaliacao)
    atualizarMedidas(aluno, avaliacao)
    return copiar(montarAvaliacao(avaliacao))
  },

  // GET /api/aluno/{alunoId}/avaliacao  (da mais nova para a mais antiga)
  async listar(alunoId: number): Promise<AvaliacaoListaResponse[]> {
    await esperar()
    alunoPermitido(alunoId, solicitante())
    return copiar(
      banco.avaliacoes
        .filter((a) => a.alunoId === alunoId)
        .sort((a, b) => b.dtAvaliacao.localeCompare(a.dtAvaliacao))
        .map(montarAvaliacaoLista),
    )
  },

  // GET /api/aluno/{alunoId}/avaliacao/{id}
  async buscarPorId(alunoId: number, id: number): Promise<AvaliacaoResponse> {
    await esperar()
    return copiar(montarAvaliacao(avaliacaoPermitida(alunoId, id, solicitante()).avaliacao))
  },

  // PUT /api/aluno/{alunoId}/avaliacao/{id}  (correção; a data só muda dentro do mesmo grupo)
  async atualizar(alunoId: number, id: number, request: AvaliacaoRequest): Promise<AvaliacaoResponse> {
    await esperar()
    const { aluno, avaliacao } = avaliacaoPermitida(alunoId, id, solicitante('ADMIN', 'PROFISSIONAL'))
    const dados = converter(request)
    validar(dados)
    const idade = calcularIdade(aluno, dados.dtAvaliacao)
    const grupo = banco.grupos.find((g) => g.id === avaliacao.grupoId)
    if (!grupo) {
      throw new ErroApi(404, 'Grupo não encontrado!')
    }
    if (idade < grupo.nrIdadeMin || idade > grupo.nrIdadeMax) {
      throw new ErroApi(400, `Na nova data o aluno teria ${idade} anos e sairia da faixa do ${grupo.nmGrupo}!`)
    }
    Object.assign(avaliacao, {
      dtAvaliacao: dados.dtAvaliacao,
      vlPeso: dados.vlPeso,
      vlEstatura: dados.vlEstatura,
      vlCintura: dados.vlCintura,
      respostas: lerRespostas(grupo.id, dados.respostas),
    })
    atualizarMedidas(aluno, avaliacao)
    return copiar(montarAvaliacao(avaliacao))
  },

  // DELETE /api/aluno/{alunoId}/avaliacao/{id}
  async excluir(alunoId: number, id: number): Promise<void> {
    await esperar()
    avaliacaoPermitida(alunoId, id, solicitante('ADMIN', 'PROFISSIONAL'))
    banco.avaliacoes = banco.avaliacoes.filter((a) => a.id !== id)
  },
}
