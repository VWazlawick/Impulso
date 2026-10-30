import type { Sexo, TipoIndicador } from './enums.ts'

export type ClassificacaoResponse = {
  id: number
  tpIndicador: TipoIndicador
  subgrupoId: number | null
  nmSubgrupo: string | null
  tpSexo: Sexo
  nrIdadeMin: number
  nrIdadeMax: number
  vlInicio: number
  dsClassificacao: string
}

export type ClassificacaoRequest = {
  tpIndicador: TipoIndicador
  subgrupoId: number | null
  tpSexo: Sexo
  nrIdadeMin: number
  nrIdadeMax: number
  vlInicio: number
  dsClassificacao: string
}
