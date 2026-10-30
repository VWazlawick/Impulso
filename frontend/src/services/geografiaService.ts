import type { CidadeResponse, EstadoResponse, PaisResponse } from '../types/geografia.ts'
import { copiar, esperar } from './exemplo/apoio.ts'
import { banco } from './exemplo/banco.ts'

// Por enquanto usa a lista curta de exemplo; o backend tem as tabelas completas.

export const geografiaService = {
  // GET /api/paises
  async listarPaises(): Promise<PaisResponse[]> {
    await esperar()
    return copiar(banco.paises)
  },

  // GET /api/estados?paisId=
  async listarEstados(paisId: number): Promise<EstadoResponse[]> {
    await esperar()
    return copiar(
      banco.estados
        .filter((e) => e.paisId === paisId)
        .sort((a, b) => a.nmEstado.localeCompare(b.nmEstado, 'pt-BR'))
        .map(({ id, nmEstado, sgEstado }) => ({ id, nmEstado, sgEstado })),
    )
  },

  // GET /api/cidades?estadoId=
  async listarCidades(estadoId: number): Promise<CidadeResponse[]> {
    await esperar()
    return copiar(
      banco.cidades
        .filter((c) => c.estadoId === estadoId)
        .sort((a, b) => a.nmCidade.localeCompare(b.nmCidade, 'pt-BR'))
        .map(({ id, nmCidade }) => ({ id, nmCidade })),
    )
  },
}
