import type { Sexo, TipoServico } from './enums.ts'

// Datas chegam como texto "aaaa-mm-dd", do jeito que o LocalDate vira JSON.

export type AlunoResponse = {
  id: number
  nmPessoa: string
  cpf: string | null
  email: string | null
  dtNascimento: string
  tpServico: TipoServico
  profissionalId: number
  sexo: Sexo
  vlPeso: number | null
  vlEstatura: number | null
  vlCintura: number | null
  stAtivo: boolean
}

export type AlunoRequest = {
  nmPessoa: string
  cpf: string | null
  email: string | null
  dtNascimento: string
  tpServico: TipoServico
  profissionalId: number | null
  sexo: Sexo
  vlPeso: number | null
  vlEstatura: number | null
  vlCintura: number | null
}

export type TransferirAlunoRequest = {
  profissionalId: number
}
