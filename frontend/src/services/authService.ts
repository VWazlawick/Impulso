import type { LoginRequest, LoginResponse } from '../types/usuario.ts'
import { esperar, tokenDe } from './exemplo/apoio.ts'
import { banco } from './exemplo/banco.ts'
import { ErroApi } from './erros.ts'

// Por enquanto usa as contas de exemplo. Na ligação com o backend, cada função
// passa a chamar a rota do comentário, e as telas não mudam.

export const authService = {
  // POST /api/auth/login
  async login(request: LoginRequest): Promise<LoginResponse> {
    await esperar()
    const email = request.email.trim().toLowerCase()
    const usuario = banco.usuarios.find((u) => u.email.toLowerCase() === email)
    // Nos dados de exemplo qualquer senha serve; o backend confere a senha de verdade.
    if (!usuario || !usuario.stAtivo || !request.senha) {
      throw new ErroApi(401, 'Credenciais inválidas')
    }
    return { token: tokenDe(usuario.id), tipo: usuario.tpUsuario }
  },
}
