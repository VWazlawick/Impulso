export type ResponsavelResponse = {
  id: number
  nmPessoa: string
  nrTelefone: string
  possuiAcesso: boolean
  usuarioId: number | null
}

export type ResponsavelRequest = {
  nmPessoa: string
  nrTelefone: string
}
