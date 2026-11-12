import type {CepResponse, EnderecoRequest, EnderecoResponse} from '../types/endereco.ts'
import { api } from './api.ts'

export const enderecoService = {
  // GET /api/aluno/{alunoId}/endereco
  async listar(alunoId: number): Promise<EnderecoResponse[]> {
    const { data } = await api.get<EnderecoResponse[]>(`/aluno/${alunoId}/endereco`)
    return data
  },

  // POST /api/aluno/{alunoId}/endereco
  async cadastrar(alunoId: number, request: EnderecoRequest): Promise<EnderecoResponse> {
    const { data } = await api.post(`/aluno/${alunoId}/endereco`, request)
    return data
  },

  // PUT /api/aluno/{alunoId}/endereco/{id}
  async atualizar(alunoId: number, id: number, request: EnderecoRequest): Promise<EnderecoResponse> {
    const { data } = await api.put(`/aluno/${alunoId}/endereco/${id}`, request)
    return data
  },

  // DELETE /api/aluno/{alunoId}/endereco/{id}
  async excluir(alunoId: number, id: number): Promise<void> {
    await api.delete(`/aluno/${alunoId}/endereco/${id}`)
  },
}
