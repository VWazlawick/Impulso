import type { TipoCalculo } from './enums.ts'
import type { PerguntaResponse } from './pergunta.ts'

export type SubgrupoResponse = {
  id: number
  nmSubgrupo: string
  tpCalculo: TipoCalculo
  nrOrdem: number
  perguntas: PerguntaResponse[]
}

export type SubgrupoRequest = {
  nmSubgrupo: string
  tpCalculo: TipoCalculo
  nrOrdem: number
}
