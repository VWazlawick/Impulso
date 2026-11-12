import type { EvolucaoResponse } from '../types/evolucao.ts'
import { api } from './api.ts'

export const evolucaoService = {
  // GET /api/aluno/{alunoId}/evolucao
  async buscar(alunoId: number): Promise<EvolucaoResponse> {
    const { data } = await api.get<EvolucaoResponse>(`/aluno/${alunoId}/evolucao`)
    return data
  },
}
