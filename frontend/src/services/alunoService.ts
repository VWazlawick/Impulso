import type { AlunoRequest, AlunoResponse } from '../types/aluno.ts'
import type { ResponsavelRequest, ResponsavelResponse } from '../types/responsavel.ts'
import { hojeIso } from '../utils/datas.ts'
import { emailValido } from '../utils/documentos.ts'
import { paraCentimetros, validarMedidas } from '../utils/medidas.ts'
import { copiar, esperar, novoId, porNome, solicitante, type Solicitante } from './exemplo/apoio.ts'
import { banco } from './exemplo/banco.ts'
import { montarAluno, montarResponsavel } from './exemplo/montar.ts'
import { alunoPermitido, profissionalLogado, responsavelLogado } from './exemplo/permissoes.ts'
import { falharSeHouver, validarResponsavel } from './exemplo/validacoes.ts'
import { ErroApi } from './erros.ts'

// Por enquanto usa os dados de exemplo e repete as regras do AlunoService.

// Como o construtor do AlunoRequest: estatura e cintura em metro viram centímetro.
function converter(request: AlunoRequest): AlunoRequest {
  return { ...request, vlEstatura: paraCentimetros(request.vlEstatura), vlCintura: paraCentimetros(request.vlCintura) }
}

function validar(request: AlunoRequest) {
  const campos: Record<string, string> = validarMedidas(request)
  if (!request.nmPessoa.trim()) {
    campos.nmPessoa = 'O nome do Aluno é obrigatório!'
  }
  if (request.cpf !== null && !/^\d{11}$/.test(request.cpf)) {
    campos.cpf = 'O CPF deve ter 11 dígitos, sem pontuação'
  }
  if (request.email !== null && !emailValido(request.email)) {
    campos.email = 'Email inválido'
  }
  if (!request.dtNascimento) {
    campos.dtNascimento = 'Data de Nascimento obrigatória!'
  } else if (request.dtNascimento >= hojeIso()) {
    campos.dtNascimento = 'A Data de Nascimento deve estar no passado!'
  }
  falharSeHouver(campos)
}

function cpfRepetido(cpf: string | null, ignorarId: number | null) {
  return cpf !== null && banco.alunos.some((a) => a.id !== ignorarId && a.cpf === cpf)
}

// O admin escolhe o profissional; o profissional cadastra para si mesmo.
function definirProfissional(request: AlunoRequest, quem: Solicitante) {
  if (!quem.admin) {
    return profissionalLogado(quem)
  }
  if (request.profissionalId === null) {
    throw new ErroApi(400, 'Informe o profissional responsável pelo Aluno!')
  }
  const profissional = banco.profissionais.find((p) => p.id === request.profissionalId)
  if (!profissional) {
    throw new ErroApi(404, 'Profissional não encontrado!')
  }
  return profissional
}

export const alunoService = {
  // GET /api/aluno?inativos=
  async listar(inativos = false): Promise<AlunoResponse[]> {
    await esperar()
    const quem = solicitante()
    let alunos = banco.alunos
    if (quem.responsavel) {
      const responsavel = responsavelLogado(quem)
      alunos = responsavel ? alunos.filter((a) => a.responsaveis.includes(responsavel.id)) : []
    } else if (!quem.admin) {
      const profissional = profissionalLogado(quem)
      alunos = alunos.filter((a) => a.profissionalId === profissional.id)
    }
    return copiar(alunos.filter((a) => inativos || a.stAtivo).sort(porNome).map(montarAluno))
  },

  // GET /api/aluno/{id}
  async buscarPorId(id: number): Promise<AlunoResponse> {
    await esperar()
    return copiar(montarAluno(alunoPermitido(id, solicitante())))
  },

  // POST /api/aluno
  async cadastrar(request: AlunoRequest): Promise<AlunoResponse> {
    await esperar()
    const quem = solicitante('ADMIN', 'PROFISSIONAL')
    const dados = converter(request)
    validar(dados)
    if (cpfRepetido(dados.cpf, null)) {
      throw new ErroApi(409, 'CPF já cadastrado!')
    }
    const profissional = definirProfissional(dados, quem)
    const aluno = {
      id: novoId(),
      nmPessoa: dados.nmPessoa,
      cpf: dados.cpf,
      email: dados.email,
      dtNascimento: dados.dtNascimento,
      tpServico: dados.tpServico,
      profissionalId: profissional.id,
      sexo: dados.sexo,
      vlPeso: dados.vlPeso,
      vlEstatura: dados.vlEstatura,
      vlCintura: dados.vlCintura,
      stAtivo: true,
      responsaveis: [],
    }
    banco.alunos.push(aluno)
    return copiar(montarAluno(aluno))
  },

  // PUT /api/aluno/{id}  (o profissional não muda aqui: para isso existe transferir)
  async atualizar(id: number, request: AlunoRequest): Promise<AlunoResponse> {
    await esperar()
    const aluno = alunoPermitido(id, solicitante('ADMIN', 'PROFISSIONAL'))
    const dados = converter(request)
    validar(dados)
    if (cpfRepetido(dados.cpf, id)) {
      throw new ErroApi(409, 'CPF já cadastrado!')
    }
    Object.assign(aluno, {
      nmPessoa: dados.nmPessoa,
      cpf: dados.cpf,
      email: dados.email,
      dtNascimento: dados.dtNascimento,
      tpServico: dados.tpServico,
      sexo: dados.sexo,
      vlPeso: dados.vlPeso,
      vlEstatura: dados.vlEstatura,
      vlCintura: dados.vlCintura,
    })
    return copiar(montarAluno(aluno))
  },

  // PATCH /api/aluno/{id}/profissional
  async transferir(id: number, profissionalId: number): Promise<AlunoResponse> {
    await esperar()
    solicitante('ADMIN')
    const aluno = banco.alunos.find((a) => a.id === id)
    if (!aluno) {
      throw new ErroApi(404, 'Aluno não encontrado!')
    }
    if (!banco.profissionais.some((p) => p.id === profissionalId)) {
      throw new ErroApi(404, 'Profissional não encontrado!')
    }
    aluno.profissionalId = profissionalId
    return copiar(montarAluno(aluno))
  },

  // PATCH /api/aluno/{id}/inativar
  async inativar(id: number): Promise<void> {
    await esperar()
    alunoPermitido(id, solicitante('ADMIN', 'PROFISSIONAL')).stAtivo = false
  },

  // PATCH /api/aluno/{id}/ativar
  async ativar(id: number): Promise<void> {
    await esperar()
    alunoPermitido(id, solicitante('ADMIN', 'PROFISSIONAL')).stAtivo = true
  },

  // GET /api/aluno/{id}/responsaveis
  async listarResponsaveis(id: number): Promise<ResponsavelResponse[]> {
    await esperar()
    const aluno = alunoPermitido(id, solicitante('ADMIN', 'PROFISSIONAL'))
    const responsaveis = banco.responsaveis.filter((r) => aluno.responsaveis.includes(r.id))
    return copiar([...responsaveis].sort(porNome).map(montarResponsavel))
  },

  // POST /api/aluno/{id}/responsavel
  async cadastrarResponsavel(id: number, request: ResponsavelRequest): Promise<ResponsavelResponse> {
    await esperar()
    const aluno = alunoPermitido(id, solicitante('ADMIN', 'PROFISSIONAL'))
    validarResponsavel(request)
    const responsavel = { id: novoId(), ...request, usuarioId: null }
    banco.responsaveis.push(responsavel)
    aluno.responsaveis.push(responsavel.id)
    return copiar(montarResponsavel(responsavel))
  },

  // POST /api/aluno/{id}/responsavel/{responsavelId}
  async vincularResponsavel(id: number, responsavelId: number): Promise<void> {
    await esperar()
    const aluno = alunoPermitido(id, solicitante('ADMIN', 'PROFISSIONAL'))
    if (!banco.responsaveis.some((r) => r.id === responsavelId)) {
      throw new ErroApi(404, 'Responsável não encontrado!')
    }
    if (aluno.responsaveis.includes(responsavelId)) {
      throw new ErroApi(409, 'Responsável já vinculado a este aluno!')
    }
    aluno.responsaveis.push(responsavelId)
  },

  // DELETE /api/aluno/{id}/responsavel/{responsavelId}
  async desvincularResponsavel(id: number, responsavelId: number): Promise<void> {
    await esperar()
    const aluno = alunoPermitido(id, solicitante('ADMIN', 'PROFISSIONAL'))
    if (!aluno.responsaveis.includes(responsavelId)) {
      throw new ErroApi(404, 'Responsável não vinculado a este Aluno!')
    }
    aluno.responsaveis = aluno.responsaveis.filter((r) => r !== responsavelId)
  },
}
