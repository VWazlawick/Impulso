import type { LoginRequest, LoginResponse } from '../types/usuario.ts'
import { api } from './api'

export const authService = {
  async login(request: LoginRequest): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>('/auth/login', request)
    return data
  },
}
