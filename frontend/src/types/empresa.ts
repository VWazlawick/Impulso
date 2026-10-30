export type EmpresaResponse = {
  id: number
  razaoSocial: string
  cnpj: string
}

export type EmpresaRequest = {
  razaoSocial: string
  cnpj: string
}
