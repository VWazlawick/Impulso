import type { TipoResposta } from './enums.ts'

export type PerguntaResponse = {
  id: number
  dsPergunta: string
  tpResposta: TipoResposta
  dsUnidade: string | null
  nrOrdem: number
}

export type PerguntaRequest = {
  dsPergunta: string
  tpResposta: TipoResposta
  dsUnidade: string | null
  nrOrdem: number
}
