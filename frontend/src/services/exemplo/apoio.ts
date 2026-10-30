import type { TipoUsuario } from '../../types/enums.ts'
import { ErroApi } from '../erros.ts'
import { lerSessao } from '../sessao.ts'
import { banco } from './banco.ts'

let ultimoId = 1000

export function novoId() {
  ultimoId += 1
  return ultimoId
}

// Imita o tempo de resposta da rede.
export function esperar(ms = 250) {
  return new Promise<void>((resolver) => setTimeout(resolver, ms))
}

// Devolve uma cópia, para a tela não alterar o "banco" sem querer.
export function copiar<T>(valor: T): T {
  return structuredClone(valor)
}

export function tokenDe(usuarioId: number) {
  return `exemplo-${usuarioId}`
}

export type Solicitante = {
  usuarioId: number
  admin: boolean
  responsavel: boolean
}

// Quem está pedindo, como o Solicitante do backend (que lê o token).
// Com perfis informados, imita o @PreAuthorize: outro perfil recebe 403.
export function solicitante(...perfis: TipoUsuario[]): Solicitante {
  const sessao = lerSessao()
  const usuario = sessao ? banco.usuarios.find((u) => tokenDe(u.id) === sessao.token) : undefined
  if (!usuario || !usuario.stAtivo) {
    throw new ErroApi(401, 'Credenciais inválidas')
  }
  if (perfis.length > 0 && !perfis.includes(usuario.tpUsuario)) {
    throw new ErroApi(403, 'Acesso Negado')
  }
  return {
    usuarioId: usuario.id,
    admin: usuario.tpUsuario === 'ADMIN',
    responsavel: usuario.tpUsuario === 'RESPONSAVEL',
  }
}

// Mesma ordem alfabética do "OrderByNmPessoaAsc" do backend.
export function porNome<T extends { nmPessoa: string }>(a: T, b: T) {
  return a.nmPessoa.localeCompare(b.nmPessoa, 'pt-BR')
}
