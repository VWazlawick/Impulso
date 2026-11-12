import type { ClassificacaoRequest, ClassificacaoResponse } from '../types/classificacao.ts'
import type { TipoIndicador } from '../types/enums.ts'
import { api } from './api.ts'

export const classificacaoService = {
  // GET /api/classificacao?tpIndicador=...&subgrupoId=...
  async listar(tpIndicador: TipoIndicador, subgrupoId: number | null): Promise<ClassificacaoResponse[]> {
    const { data } = await api.get<ClassificacaoResponse[]>('/classificacao',
        {params: {tpIndicador, subgrupoId: subgrupoId ?? undefined}})
    return data
  },

  // POST /api/classificacao
  async cadastrar(request: ClassificacaoRequest): Promise<ClassificacaoResponse> {
    const { data } = await api.post<ClassificacaoResponse>('/classificacao', request)
    return data
  },

  // PUT /api/classificacao/{id}
  async atualizar(id: number, request: ClassificacaoRequest): Promise<ClassificacaoResponse> {
    const { data } = await api.put(`/classificacao/${id}`, request)
    return data
  },

  // DELETE /api/classificacao/{id}
  async excluir(id: number): Promise<void> {
    await api.delete(`/classificacao/${id}`)
  },
}
