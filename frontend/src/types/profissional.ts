export type ProfissionalResponse = {
  id: number
  nmPessoa: string
  cpf: string
  email: string | null
  possuiAcesso: boolean
  usuarioId: number | null
}

export type ProfissionalRequest = {
  nmPessoa: string
  cpf: string
  email: string | null
}
