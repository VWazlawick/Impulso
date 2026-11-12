import type { ResponsavelRequest, ResponsavelResponse } from '../types/responsavel.ts'
import { api } from './api.ts'


export const responsavelService = {
  // GET /api/responsavel?nome=
  // O admin vê todos; o profissional, só os responsáveis dos alunos dele.
  async listar(nome = ''): Promise<ResponsavelResponse[]> {
    const { data } = await api.get<ResponsavelResponse[]>('/responsavel', {params:
          {nome: nome.trim() || undefined},})
    return data
  },

  // GET /api/responsavel/{id}
  async buscarPorId(id: number): Promise<ResponsavelResponse> {
    const { data } = await api.get<ResponsavelResponse>(`/responsavel/${id}`)
    return data
  },

  // PUT /api/responsavel/{id}
  async atualizar(id: number, request: ResponsavelRequest): Promise<ResponsavelResponse> {
    const { data } = await  api.put(`/responsavel/${id}`, request)
    return data
  },
}
