import type { CepResponse } from '../types/endereco.ts'
import { api } from './api.ts'

export const cepService = {
  // GET /api/cep/{cep}
  async buscar(cep: string): Promise<CepResponse> {
    const { data } = await api.get<CepResponse>(`/cep/${cep}`)
    return data
  },
}
