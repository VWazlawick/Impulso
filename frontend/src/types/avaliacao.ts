import type { Estagio, TipoCalculo, TipoOpcao } from './enums.ts'
import type { GrupoDetalheResponse } from './grupo.ts'

// O que a ficha traz para começar uma avaliação: o grupo pela idade e as medidas do cadastro.
export type FichaResponse = {
  alunoId: number
  nmAluno: string
  dtAvaliacao: string
  nrIdade: number
  vlPeso: number | null
  vlEstatura: number | null
  vlCintura: number | null
  grupo: GrupoDetalheResponse
}

// Pergunta de número usa vlResposta; pergunta de sim/não/parcial usa tpOpcao.
export type RespostaRequest = {
  perguntaId: number
  vlResposta: number | null
  tpOpcao: TipoOpcao | null
}

export type AvaliacaoRequest = {
  dtAvaliacao: string
  vlPeso: number | null
  vlEstatura: number | null
  vlCintura: number | null
  respostas: RespostaRequest[]
}

export type MedidasResponse = {
  vlPeso: number | null
  vlEstatura: number | null
  vlCintura: number | null
  vlImc: number | null
  vlRce: number | null
  dsClassificacaoImc: string | null
  dsClassificacaoRce: string | null
}

export type RespostaResponse = {
  perguntaId: number
  dsPergunta: string
  vlResposta: number | null
  tpOpcao: TipoOpcao | null
}

export type ResultadoResponse = {
  subgrupoId: number
  nmSubgrupo: string
  tpCalculo: TipoCalculo
  vlResultado: number | null
  tpEstagio: Estagio | null
  dsClassificacao: string | null
}

export type AvaliacaoResponse = {
  id: number
  dtAvaliacao: string
  alunoId: number
  nmAluno: string
  nrIdade: number
  profissionalId: number
  grupoId: number
  nmGrupo: string
  medidas: MedidasResponse
  respostas: RespostaResponse[]
  resultados: ResultadoResponse[]
}

export type AvaliacaoListaResponse = {
  id: number
  dtAvaliacao: string
  nrIdade: number
  grupoId: number
  nmGrupo: string
  profissionalId: number
}
