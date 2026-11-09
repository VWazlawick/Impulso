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

// Troca o e-mail do acesso e, se vier, a senha (null mantém a atual).
export type AtualizarUsuarioRequest = {
  email: string
  senha: string | null
}

// Uma linha da aba Usuários. O nome vem do profissional ou do responsável; admin não tem pessoa.
export type UsuarioListaResponse = {
  id: number
  email: string
  tpUsuario: TipoUsuario
  stAtivo: boolean
  nmPessoa: string | null
}

// Cria um administrador: só e-mail e senha, sem pessoa ligada.
export type AdminRequest = {
  email: string
  senha: string
}
