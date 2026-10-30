export type EnderecoResponse = {
  id: number
  rua: string
  nrCasa: string
  bairro: string
  cep: string
  complemento: string | null
  cidadeId: number
  nmCidade: string
  sgEstado: string
}

export type EnderecoRequest = {
  rua: string
  nrCasa: string
  bairro: string
  cep: string
  complemento: string | null
  cidadeId: number
}

export type CepResponse = {
  cep: string
  rua: string
  bairro: string
  cidadeId: number
  nmCidade: string
  sgEstado: string
}
