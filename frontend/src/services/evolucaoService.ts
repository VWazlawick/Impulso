import type { EvolucaoResponse } from '../types/evolucao.ts'
import { copiar, esperar, solicitante } from './exemplo/apoio.ts'
import { montarEvolucao } from './exemplo/montar.ts'
import { alunoPermitido } from './exemplo/permissoes.ts'

// Por enquanto usa os dados de exemplo e repete o EvolucaoService.

export const evolucaoService = {
  // GET /api/aluno/{alunoId}/evolucao
  async buscar(alunoId: number): Promise<EvolucaoResponse> {
    await esperar()
    return copiar(montarEvolucao(alunoPermitido(alunoId, solicitante())))
  },
}
