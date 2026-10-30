import type { TipoUsuario } from './enums.ts'

export type LoginRequest = {
  email: string
  senha: string
}

export type LoginResponse = {
  token: string
  tipo: TipoUsuario
}

export type UsuarioResponse = {
  id: number
  email: string
  tpUsuario: TipoUsuario
  stAtivo: boolean
}

// Cria o acesso de uma pessoa (profissional ou responsável) já cadastrada.
export type UsuarioRequest = {
  pessoaId: number
  email: string
  senha: string
}
