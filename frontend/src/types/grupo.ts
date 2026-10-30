import type { SubgrupoResponse } from './subgrupo.ts'

export type GrupoResponse = {
  id: number
  nmGrupo: string
  nrIdadeMin: number
  nrIdadeMax: number
  qtSubgrupos: number
}

export type GrupoDetalheResponse = {
  id: number
  nmGrupo: string
  nrIdadeMin: number
  nrIdadeMax: number
  subgrupos: SubgrupoResponse[]
}

export type GrupoRequest = {
  nmGrupo: string
  nrIdadeMin: number
  nrIdadeMax: number
}
