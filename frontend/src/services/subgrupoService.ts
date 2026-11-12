import type { SubgrupoRequest, SubgrupoResponse } from '../types/subgrupo.ts'
import { api } from './api.ts'

export const subgrupoService = {
  // POST /api/grupo/{grupoId}/subgrupo
  async cadastrar(grupoId: number, request: SubgrupoRequest): Promise<SubgrupoResponse> {
    const { data } = await api.post(`/grupo/${grupoId}/subgrupo`, request)
    return data
  },

  // PUT /api/subgrupo/{id}
  async atualizar(id: number, request: SubgrupoRequest): Promise<SubgrupoResponse> {
    const { data } = await api.put(`/subgrupo/${id}`, request)
    return data
  },

  // DELETE /api/subgrupo/{id}
  async excluir(id: number): Promise<void> {
    await api.delete(`/grupo/${id}`)
  },
}
