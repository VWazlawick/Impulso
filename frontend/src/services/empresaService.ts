import type { EmpresaRequest, EmpresaResponse } from '../types/empresa.ts'
import { api } from './api'

export const empresaService = {
  // GET /api/empresa/atual
  async consultar(): Promise<EmpresaResponse> {
    const { data } = await api.get<EmpresaResponse>('/empresa/atual')
    return data
  },

  // PUT /api/empresa
  async salvar(request: EmpresaRequest): Promise<EmpresaResponse> {
    const { data } = await api.put<EmpresaResponse>('/empresa', request)
    return data
  },
}
