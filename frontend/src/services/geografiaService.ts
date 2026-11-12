import type { CidadeResponse, EstadoResponse, PaisResponse } from '../types/geografia.ts'
import { api } from './api.ts'

export const geografiaService = {
  // GET /api/paises
  async listarPaises(): Promise<PaisResponse[]> {
    const { data } = await api.get(`/paises`)
    return data
  },

  // GET /api/estados?paisId=
  async listarEstados(paisId: number): Promise<EstadoResponse[]> {
    const { data } = await api.get('/estados', {params: {paisId}})
    return data
  },

  // GET /api/cidades?estadoId=
  async listarCidades(estadoId: number): Promise<CidadeResponse[]> {
    const { data } = await api.get('/cidades', {params: {estadoId}})
    return data
  },
}
