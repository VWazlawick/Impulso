import type { GrupoDetalheResponse, GrupoRequest, GrupoResponse } from '../types/grupo.ts'
import { api } from './api.ts'

export const grupoService = {
  // GET /api/grupo
  async listar(): Promise<GrupoResponse[]> {
    const { data } = await api.get<GrupoResponse[]>('/grupo')
    return data
  },

  // GET /api/grupo/{id}
  async buscarPorId(id: number): Promise<GrupoDetalheResponse> {
    const { data } = await api.get<GrupoDetalheResponse>(`/grupo/${id}`)
    return data
  },

  // POST /api/grupo
  async cadastrar(request: GrupoRequest): Promise<GrupoResponse> {
    const { data } = await api.post(`/grupo`, request)
    return data
  },

  // PUT /api/grupo/{id}
  async atualizar(id: number, request: GrupoRequest): Promise<GrupoResponse> {
    const { data } = await api.put(`/grupo/${id}`, request)
    return data
  },

  // DELETE /api/grupo/{id}
  async excluir(id: number): Promise<void> {
    await api.delete(`/grupo/${id}`)
  },
}
