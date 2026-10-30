import type { TipoCalculo, TipoResposta } from '../types/enums.ts'

// As mesmas regras do TipoCalculoEnum do backend.

export function aceita(tpCalculo: TipoCalculo, tpResposta: TipoResposta) {
  switch (tpCalculo) {
    case 'NENHUM':
      return true
    case 'MAIOR_VALOR':
    case 'MENOR_VALOR':
      return tpResposta === 'NUMERO'
    case 'ESTAGIO':
      return tpResposta === 'SIM_NAO_PARCIAL'
  }
}

export function resultadoNumerico(tpCalculo: TipoCalculo) {
  return tpCalculo === 'MAIOR_VALOR' || tpCalculo === 'MENOR_VALOR'
}

const tiposDeResposta: TipoResposta[] = ['NUMERO', 'SIM_NAO_PARCIAL']

export function respostasAceitas(tpCalculo: TipoCalculo) {
  return tiposDeResposta.filter((tpResposta) => aceita(tpCalculo, tpResposta))
}
