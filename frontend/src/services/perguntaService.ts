import type { PerguntaRequest, PerguntaResponse } from '../types/pergunta.ts'
import { api } from './api.ts'

export const perguntaService = {
  // POST /api/subgrupo/{subgrupoId}/pergunta
  async cadastrar(subgrupoId: number, request: PerguntaRequest): Promise<PerguntaResponse> {
    const { data } = await api.post(`/subgrupo/${subgrupoId}/pergunta`, request)
    return data
  },

  // PUT /api/pergunta/{id}
  async atualizar(id: number, request: PerguntaRequest): Promise<PerguntaResponse> {
    const { data } = await api.put(`/pergunta/${id}`, request)
    return data
  },

  // DELETE /api/pergunta/{id}
  async excluir(id: number): Promise<void> {
    await api.delete(`/pergunta/${id}`)
  },
}
