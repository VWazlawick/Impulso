import type { AlunoRequest, AlunoResponse } from '../types/aluno.ts'
import type { ResponsavelRequest, ResponsavelResponse } from '../types/responsavel.ts'
import { api } from './api.ts'

export const alunoService = {
  // GET /api/aluno?inativos=
  async listar(inativos = false): Promise<AlunoResponse[]> {
    const { data } = await api.get<AlunoResponse[]>('/aluno' ,
        {params: {inativos}})
    return data
  },

  // GET /api/aluno/{id}
  async buscarPorId(id: number): Promise<AlunoResponse> {
    const { data } = await api.get<AlunoResponse>(`/aluno/${id}`)
    return data
  },

  // POST /api/aluno
  async cadastrar(request: AlunoRequest): Promise<AlunoResponse> {
    const { data } = await api.post<AlunoResponse>('/cadastrar', request)
    return data
  },

  // PUT /api/aluno/{id}  (o profissional não muda aqui: para isso existe transferir)
  async atualizar(id: number, request: AlunoRequest): Promise<AlunoResponse> {
    const { data } = await api.put<AlunoResponse>(`/atualizar/${id}`, request)
    return data
  },

  // PATCH /api/aluno/{id}/profissional
  async transferir(id: number, profissionalId: number): Promise<AlunoResponse> {
    const { data } = await api.patch<AlunoResponse>(`/aluno/${id}/profissional`, {profissionalId})
    return data
  },

  // PATCH /api/aluno/{id}/inativar
  async inativar(id: number): Promise<void> {
    const { data } = await api.patch(`/alunos/${id}/inativar`)
    return data
  },

  // PATCH /api/aluno/{id}/ativar
  async ativar(id: number): Promise<void> {
    const { data } = await api.patch(`/alunos/${id}/ativar`)
    return data
  },

  // GET /api/aluno/{id}/responsaveis
  async listarResponsaveis(id: number): Promise<ResponsavelResponse[]> {
    const { data } = await api.get<ResponsavelResponse[]>(`/aluno/${id}/responsaveis`)
    return data
  },

  // POST /api/aluno/{id}/responsavel
  async cadastrarResponsavel(id: number, request: ResponsavelRequest): Promise<ResponsavelResponse> {
    const { data } = await api.post(`/aluno/${id}/responsavel`, request)
    return data
  },

  // POST /api/aluno/{id}/responsavel/{responsavelId}
  async vincularResponsavel(id: number, responsavelId: number): Promise<void> {
    await api.post(`/aluno/${id}/responsavel/${responsavelId}`)
  },

  // DELETE /api/aluno/{id}/responsavel/{responsavelId}
  async desvincularResponsavel(id: number, responsavelId: number): Promise<void> {
    await api.delete(`/aluno/${id}/responsavel/${responsavelId}`)
  },
}
