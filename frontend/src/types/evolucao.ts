import type { MedidasResponse } from './avaliacao.ts'
import type { Estagio, TipoCalculo } from './enums.ts'

export type EvolucaoAvaliacaoResponse = {
  avaliacaoId: number
  dtAvaliacao: string
  nrIdade: number
  nmGrupo: string
  medidas: MedidasResponse
}

export type EvolucaoPontoResponse = {
  avaliacaoId: number
  dtAvaliacao: string
  nrIdade: number
  vlResultado: number | null
  tpEstagio: Estagio | null
  dsClassificacao: string | null
}

// Um teste ao longo do tempo. Testes com o mesmo nome em grupos diferentes ficam juntos.
export type EvolucaoIndicadorResponse = {
  nmSubgrupo: string
  tpCalculo: TipoCalculo
  pontos: EvolucaoPontoResponse[]
  dsUnidade: string | null
}

export type EvolucaoResponse = {
  alunoId: number
  nmAluno: string
  avaliacoes: EvolucaoAvaliacaoResponse[]
  indicadores: EvolucaoIndicadorResponse[]
}
