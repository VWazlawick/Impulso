import type { AtualizarUsuarioRequest, UsuarioRequest, UsuarioResponse } from '../types/usuario.ts'
import { api } from './api.ts'

export const usuarioService = {
  async meusDados(): Promise<UsuarioResponse> {
    const { data } = await api.get<UsuarioResponse>('/usuario/me')
    return data
  },

  // GET /api/profissional/{id}
  async buscarPorId(id: number): Promise<UsuarioResponse> {
    const { data } = await api.get<UsuarioResponse>(`/usuario/${id}`)
    return data
  },

  // POST /api/profissional
  async criarAcesso(request: UsuarioRequest): Promise<UsuarioResponse> {
    const { data } = await api.post<UsuarioResponse>('/usuario', request)
    return data
  },

  // PUT /api/profissional/{id}
  async atualizar(id: number, request: AtualizarUsuarioRequest): Promise<UsuarioResponse> {
    const { data } = await api.put<UsuarioResponse>(`/usuario/${id}`, request)
    return data
  },

  async inativar(id: number): Promise<void> {
    await api.patch(`/usuario/${id}/inativar`)
  },

  async reativar(id: number): Promise<void> {
    await api.patch(`/usuario/${id}/reativar`)
  },
}
