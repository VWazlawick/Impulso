import type { ProfissionalRequest, ProfissionalResponse } from '../types/profissional.ts'
import { emailValido } from '../utils/documentos.ts'
import { copiar, esperar, novoId, porNome, solicitante } from './exemplo/apoio.ts'
import { banco } from './exemplo/banco.ts'
import { montarProfissional } from './exemplo/montar.ts'
import { falharSeHouver } from './exemplo/validacoes.ts'
import { ErroApi } from './erros.ts'

// Por enquanto usa os dados de exemplo e repete as regras do ProfissionalService.

function buscarEntidade(id: number) {
  const profissional = banco.profissionais.find((p) => p.id === id)
  if (!profissional) {
    throw new ErroApi(404, 'Profissional não encontrado!')
  }
  return profissional
}

function validar({ nmPessoa, cpf, email }: ProfissionalRequest) {
  const campos: Record<string, string> = {}
  if (!nmPessoa.trim()) {
    campos.nmPessoa = 'O nome do Profissional é obrigatório!'
  }
  if (!cpf) {
    campos.cpf = 'O CPF do Profissional é obrigatório'
  } else if (!/^\d{11}$/.test(cpf)) {
    campos.cpf = 'O CPF deve ter 11 dígitos, sem pontuação'
  }
  if (email !== null && !emailValido(email)) {
    campos.email = 'Email Inválido'
  }
  falharSeHouver(campos)
}

export const profissionalService = {
  // GET /api/profissional
  async listar(): Promise<ProfissionalResponse[]> {
    await esperar()
    solicitante('ADMIN')
    return copiar([...banco.profissionais].sort(porNome).map(montarProfissional))
  },

  // GET /api/profissional/{id}
  async buscarPorId(id: number): Promise<ProfissionalResponse> {
    await esperar()
    solicitante('ADMIN')
    return copiar(montarProfissional(buscarEntidade(id)))
  },

  // POST /api/profissional
  async cadastrar(request: ProfissionalRequest): Promise<ProfissionalResponse> {
    await esperar()
    solicitante('ADMIN')
    validar(request)
    if (banco.profissionais.some((p) => p.cpf === request.cpf)) {
      throw new ErroApi(409, 'CPF já cadastrado')
    }
    const profissional = { id: novoId(), ...request, usuarioId: null }
    banco.profissionais.push(profissional)
    return copiar(montarProfissional(profissional))
  },

  // PUT /api/profissional/{id}
  async atualizar(id: number, request: ProfissionalRequest): Promise<ProfissionalResponse> {
    await esperar()
    solicitante('ADMIN')
    const profissional = buscarEntidade(id)
    validar(request)
    if (banco.profissionais.some((p) => p.id !== id && p.cpf === request.cpf)) {
      throw new ErroApi(409, 'CPF já cadastrado!')
    }
    Object.assign(profissional, request)
    return copiar(montarProfissional(profissional))
  },
}
