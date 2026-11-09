import type { ProfissionalRequest, ProfissionalResponse } from '../types/profissional.ts'
import { api } from './api.ts'

export const profissionalService = {
  // GET /api/profissional
  async listar(): Promise<ProfissionalResponse[]> {
    const { data } = await api.get<ProfissionalResponse[]>('/profissional')
    return data
  },

  // GET /api/profissional/{id}
  async buscarPorId(id: number): Promise<ProfissionalResponse> {
    const { data } = await api.get<ProfissionalResponse>(`/profissional/${id}`)
    return data
  },

  // POST /api/profissional
  async cadastrar(request: ProfissionalRequest): Promise<ProfissionalResponse> {
    const { data } = await api.post<ProfissionalResponse>('/profissional', request)
    return data
  },

  // PUT /api/profissional/{id}
  async atualizar(id: number, request: ProfissionalRequest): Promise<ProfissionalResponse> {
    const { data } = await api.put<ProfissionalResponse>(`/profissional/${id}`, request)
    return data
  },
}
