import type { AlunoResponse } from '../../types/aluno.ts'
import type {
  AvaliacaoListaResponse,
  AvaliacaoResponse,
  MedidasResponse,
  ResultadoResponse,
} from '../../types/avaliacao.ts'
import type { ClassificacaoResponse } from '../../types/classificacao.ts'
import type { EnderecoResponse } from '../../types/endereco.ts'
import type { Estagio, TipoIndicador } from '../../types/enums.ts'
import type { EvolucaoIndicadorResponse, EvolucaoResponse } from '../../types/evolucao.ts'
import type { GrupoDetalheResponse, GrupoResponse } from '../../types/grupo.ts'
import type { PerguntaResponse } from '../../types/pergunta.ts'
import type { ProfissionalResponse } from '../../types/profissional.ts'
import type { ResponsavelResponse } from '../../types/responsavel.ts'
import type { SubgrupoResponse } from '../../types/subgrupo.ts'
import type { UsuarioResponse } from '../../types/usuario.ts'
import { idadeEm } from '../../utils/datas.ts'
import { arredondar } from '../../utils/medidas.ts'
import {
  banco,
  type AlunoExemplo,
  type AvaliacaoExemplo,
  type ClassificacaoExemplo,
  type EnderecoExemplo,
  type PerguntaExemplo,
  type ProfissionalExemplo,
  type RespostaExemplo,
  type ResponsavelExemplo,
  type SubgrupoExemplo,
  type UsuarioExemplo,
} from './banco.ts'

// Os "montar" fazem o papel do de() dos records de resposta do backend.

const porOrdem = (a: { nrOrdem: number }, b: { nrOrdem: number }) => a.nrOrdem - b.nrOrdem

export function montarPergunta({ id, dsPergunta, tpResposta, dsUnidade, nrOrdem }: PerguntaExemplo): PerguntaResponse {
  return { id, dsPergunta, tpResposta, dsUnidade, nrOrdem }
}

export function montarSubgrupo({ id, nmSubgrupo, tpCalculo, nrOrdem }: SubgrupoExemplo): SubgrupoResponse {
  const perguntas = banco.perguntas.filter((p) => p.subgrupoId === id).sort(porOrdem).map(montarPergunta)
  return { id, nmSubgrupo, tpCalculo, nrOrdem, perguntas }
}

export function montarGrupoDetalhe(grupo: GrupoResponse): GrupoDetalheResponse {
  const subgrupos = banco.subgrupos.filter((s) => s.grupoId === grupo.id).sort(porOrdem).map(montarSubgrupo)
  return { ...grupo, subgrupos }
}

export function montarClassificacao(classificacao: ClassificacaoExemplo): ClassificacaoResponse {
  const subgrupo = banco.subgrupos.find((s) => s.id === classificacao.subgrupoId)
  return { ...classificacao, nmSubgrupo: subgrupo ? subgrupo.nmSubgrupo : null }
}

export function montarAluno(aluno: AlunoExemplo): AlunoResponse {
  return {
    id: aluno.id,
    nmPessoa: aluno.nmPessoa,
    cpf: aluno.cpf,
    email: aluno.email,
    dtNascimento: aluno.dtNascimento,
    tpServico: aluno.tpServico,
    profissionalId: aluno.profissionalId,
    sexo: aluno.sexo,
    vlPeso: aluno.vlPeso,
    vlEstatura: aluno.vlEstatura,
    vlCintura: aluno.vlCintura,
    stAtivo: aluno.stAtivo,
  }
}

export function montarResponsavel({ id, nmPessoa, nrTelefone, usuarioId }: ResponsavelExemplo): ResponsavelResponse {
  return { id, nmPessoa, nrTelefone, possuiAcesso: usuarioId !== null }
}

export function montarProfissional({ id, nmPessoa, cpf, email, usuarioId }: ProfissionalExemplo): ProfissionalResponse {
  return { id, nmPessoa, cpf, email, possuiAcesso: usuarioId !== null }
}

export function montarUsuario({ id, email, tpUsuario, stAtivo }: UsuarioExemplo): UsuarioResponse {
  return { id, email, tpUsuario, stAtivo }
}

export function montarEndereco(endereco: EnderecoExemplo): EnderecoResponse {
  const cidade = banco.cidades.find((c) => c.id === endereco.cidadeId)
  const estado = banco.estados.find((e) => e.id === cidade?.estadoId)
  return {
    id: endereco.id,
    rua: endereco.rua,
    nrCasa: endereco.nrCasa,
    bairro: endereco.bairro,
    cep: endereco.cep,
    complemento: endereco.complemento,
    cidadeId: endereco.cidadeId,
    nmCidade: cidade ? cidade.nmCidade : '',
    sgEstado: estado ? estado.sgEstado : '',
  }
}

// Alguma avaliação já respondeu alguma destas perguntas?
export function temRespostas(perguntaIds: number[]) {
  return banco.avaliacoes.some((a) => a.respostas.some((r) => perguntaIds.includes(r.perguntaId)))
}

function alunoDa(avaliacao: AvaliacaoExemplo) {
  const aluno = banco.alunos.find((a) => a.id === avaliacao.alunoId)
  if (!aluno) {
    throw new Error(`Aluno ${avaliacao.alunoId} sumiu dos dados de exemplo`)
  }
  return aluno
}

function nomeDoGrupo(grupoId: number) {
  return banco.grupos.find((g) => g.id === grupoId)?.nmGrupo ?? ''
}

// Igual ao Avaliacao.calcularImc e calcularRce do backend.
function calcularImc({ vlPeso, vlEstatura }: AvaliacaoExemplo) {
  if (vlPeso === null || vlEstatura === null) {
    return null
  }
  const metros = vlEstatura / 100
  return arredondar(vlPeso / (metros * metros))
}

function calcularRce({ vlCintura, vlEstatura }: AvaliacaoExemplo) {
  if (vlCintura === null || vlEstatura === null) {
    return null
  }
  return arredondar(vlCintura / vlEstatura)
}

// Igual ao classificar do ClassificacaoService: a faixa do sexo e da idade com o
// maior "a partir de" que ainda é menor ou igual ao valor.
function classificar(tpIndicador: TipoIndicador, subgrupoId: number | null, avaliacao: AvaliacaoExemplo, valor: number | null) {
  if (valor === null) {
    return null
  }
  const aluno = alunoDa(avaliacao)
  const idade = idadeEm(aluno.dtNascimento, avaliacao.dtAvaliacao)
  const faixa = banco.classificacoes
    .filter(
      (c) =>
        c.tpIndicador === tpIndicador &&
        c.subgrupoId === subgrupoId &&
        c.tpSexo === aluno.sexo &&
        idade >= c.nrIdadeMin &&
        idade <= c.nrIdadeMax &&
        c.vlInicio <= valor,
    )
    .sort((a, b) => b.vlInicio - a.vlInicio)[0]
  return faixa ? faixa.dsClassificacao : null
}

export function montarMedidas(avaliacao: AvaliacaoExemplo): MedidasResponse {
  const vlImc = calcularImc(avaliacao)
  const vlRce = calcularRce(avaliacao)
  return {
    vlPeso: avaliacao.vlPeso,
    vlEstatura: avaliacao.vlEstatura,
    vlCintura: avaliacao.vlCintura,
    vlImc,
    vlRce,
    dsClassificacaoImc: classificar('IMC', null, avaliacao, vlImc),
    dsClassificacaoRce: classificar('RCE', null, avaliacao, vlRce),
  }
}

type Resumo = { subgrupo: SubgrupoExemplo; vlResultado: number | null; tpEstagio: Estagio | null }

// Igual ao CalculadoraResultado: NÃO duas vezes ou mais é inicial; nenhum NÃO e
// no máximo um PARCIAL é maduro; o resto é elementar.
function estagio(respostas: RespostaExemplo[]): Estagio {
  const nao = respostas.filter((r) => r.tpOpcao === 'NAO').length
  const parcial = respostas.filter((r) => r.tpOpcao === 'PARCIAL').length
  if (nao >= 2) {
    return 'INICIAL'
  }
  if (nao === 0 && parcial <= 1) {
    return 'MADURO'
  }
  return 'ELEMENTAR'
}

// Um resumo por subgrupo respondido, na ordem da ficha. Subgrupo "Nenhum" não tem resumo.
function calcularResumos(avaliacao: AvaliacaoExemplo): Resumo[] {
  const porSubgrupo = new Map<number, RespostaExemplo[]>()
  for (const resposta of avaliacao.respostas) {
    const pergunta = banco.perguntas.find((p) => p.id === resposta.perguntaId)
    if (pergunta) {
      porSubgrupo.set(pergunta.subgrupoId, [...(porSubgrupo.get(pergunta.subgrupoId) ?? []), resposta])
    }
  }

  const resumos: Resumo[] = []
  for (const [subgrupoId, respostas] of porSubgrupo) {
    const subgrupo = banco.subgrupos.find((s) => s.id === subgrupoId)
    if (!subgrupo) {
      continue
    }
    const valores = respostas.map((r) => r.vlResposta).filter((v): v is number => v !== null)
    if (subgrupo.tpCalculo === 'MAIOR_VALOR') {
      resumos.push({ subgrupo, vlResultado: valores.length > 0 ? Math.max(...valores) : null, tpEstagio: null })
    } else if (subgrupo.tpCalculo === 'MENOR_VALOR') {
      resumos.push({ subgrupo, vlResultado: valores.length > 0 ? Math.min(...valores) : null, tpEstagio: null })
    } else if (subgrupo.tpCalculo === 'ESTAGIO') {
      resumos.push({ subgrupo, vlResultado: null, tpEstagio: estagio(respostas) })
    }
  }
  return resumos.sort((a, b) => a.subgrupo.nrOrdem - b.subgrupo.nrOrdem)
}

function montarResultado(avaliacao: AvaliacaoExemplo, { subgrupo, vlResultado, tpEstagio }: Resumo): ResultadoResponse {
  return {
    subgrupoId: subgrupo.id,
    nmSubgrupo: subgrupo.nmSubgrupo,
    tpCalculo: subgrupo.tpCalculo,
    vlResultado,
    tpEstagio,
    dsClassificacao: classificar('SUBGRUPO', subgrupo.id, avaliacao, vlResultado),
  }
}

export function montarAvaliacao(avaliacao: AvaliacaoExemplo): AvaliacaoResponse {
  const aluno = alunoDa(avaliacao)
  return {
    id: avaliacao.id,
    dtAvaliacao: avaliacao.dtAvaliacao,
    alunoId: aluno.id,
    nmAluno: aluno.nmPessoa,
    nrIdade: idadeEm(aluno.dtNascimento, avaliacao.dtAvaliacao),
    profissionalId: avaliacao.profissionalId,
    grupoId: avaliacao.grupoId,
    nmGrupo: nomeDoGrupo(avaliacao.grupoId),
    medidas: montarMedidas(avaliacao),
    respostas: avaliacao.respostas.map((r) => ({
      perguntaId: r.perguntaId,
      dsPergunta: banco.perguntas.find((p) => p.id === r.perguntaId)?.dsPergunta ?? '',
      vlResposta: r.vlResposta,
      tpOpcao: r.tpOpcao,
    })),
    resultados: calcularResumos(avaliacao).map((resumo) => montarResultado(avaliacao, resumo)),
  }
}

export function montarAvaliacaoLista(avaliacao: AvaliacaoExemplo): AvaliacaoListaResponse {
  const aluno = alunoDa(avaliacao)
  return {
    id: avaliacao.id,
    dtAvaliacao: avaliacao.dtAvaliacao,
    nrIdade: idadeEm(aluno.dtNascimento, avaliacao.dtAvaliacao),
    grupoId: avaliacao.grupoId,
    nmGrupo: nomeDoGrupo(avaliacao.grupoId),
    profissionalId: avaliacao.profissionalId,
  }
}

// Igual ao EvolucaoService: avaliações da mais antiga para a mais nova e um
// indicador por nome de teste + tipo de cálculo.
export function montarEvolucao(aluno: AlunoExemplo): EvolucaoResponse {
  const avaliacoes = banco.avaliacoes
    .filter((a) => a.alunoId === aluno.id)
    .sort((a, b) => a.dtAvaliacao.localeCompare(b.dtAvaliacao) || a.id - b.id)

  const indicadores = new Map<string, EvolucaoIndicadorResponse>()
  for (const avaliacao of avaliacoes) {
    for (const resumo of calcularResumos(avaliacao)) {
      const chave = `${resumo.subgrupo.nmSubgrupo.trim().toLowerCase()}|${resumo.subgrupo.tpCalculo}`
      let indicador = indicadores.get(chave)
      if (!indicador) {
        indicador = { nmSubgrupo: resumo.subgrupo.nmSubgrupo, tpCalculo: resumo.subgrupo.tpCalculo, pontos: [] }
        indicadores.set(chave, indicador)
      }
      indicador.pontos.push({
        avaliacaoId: avaliacao.id,
        dtAvaliacao: avaliacao.dtAvaliacao,
        nrIdade: idadeEm(aluno.dtNascimento, avaliacao.dtAvaliacao),
        vlResultado: resumo.vlResultado,
        tpEstagio: resumo.tpEstagio,
        dsClassificacao: classificar('SUBGRUPO', resumo.subgrupo.id, avaliacao, resumo.vlResultado),
      })
    }
  }

  return {
    alunoId: aluno.id,
    nmAluno: aluno.nmPessoa,
    avaliacoes: avaliacoes.map((avaliacao) => ({
      avaliacaoId: avaliacao.id,
      dtAvaliacao: avaliacao.dtAvaliacao,
      nrIdade: idadeEm(aluno.dtNascimento, avaliacao.dtAvaliacao),
      nmGrupo: nomeDoGrupo(avaliacao.grupoId),
      medidas: montarMedidas(avaliacao),
    })),
    indicadores: [...indicadores.values()],
  }
}
