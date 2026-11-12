import type {
  AvaliacaoListaResponse,
  AvaliacaoRequest,
  AvaliacaoResponse,
  FichaResponse,
} from '../types/avaliacao.ts'
import { api } from './api.ts'

export const avaliacaoService = {
  // GET /api/aluno/{alunoId}/avaliacao/ficha?dtAvaliacao=  (sem data, vale hoje)
  async ficha(alunoId: number, dtAvaliacao?: string): Promise<FichaResponse> {
    const { data } = await api.get<FichaResponse>(`/aluno/${alunoId}/avaliacao/ficha`,
        {params: {dtAvaliacao}})
    return data
  },

  // POST /api/aluno/{alunoId}/avaliacao
  async registrar(alunoId: number, request: AvaliacaoRequest): Promise<AvaliacaoResponse> {
    const { data } = await api.post<AvaliacaoResponse>(`/aluno/${alunoId}/avaliacao`, request)
    return data
  },

  // GET /api/aluno/{alunoId}/avaliacao  (da mais nova para a mais antiga)
  async listar(alunoId: number): Promise<AvaliacaoListaResponse[]> {
    const { data } = await api.get<AvaliacaoListaResponse[]>(`/aluno/${alunoId}/avaliacao`)
    return data
  },

  // GET /api/aluno/{alunoId}/avaliacao/{id}
  async buscarPorId(alunoId: number, id: number): Promise<AvaliacaoResponse> {
    const { data } = await api.get<AvaliacaoResponse>(`/aluno/${alunoId}/avaliacao/${id}`)
    return data
  },

  // PUT /api/aluno/{alunoId}/avaliacao/{id}  (correção; a data só muda dentro do mesmo grupo)
  async atualizar(alunoId: number, id: number, request: AvaliacaoRequest): Promise<AvaliacaoResponse> {
    const { data } = await api.put<AvaliacaoResponse>(`/aluno/${alunoId}/avaliacao/${id}`, request)
    return data
  },

  // DELETE /api/aluno/{alunoId}/avaliacao/{id}
  async excluir(alunoId: number, id: number): Promise<void> {
    await api.delete(`/aluno/${alunoId}/avaliacao/${id}`)
  },
}
