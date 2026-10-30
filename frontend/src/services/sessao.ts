import type { TipoUsuario } from '../types/enums.ts'

// Quem entrou no sistema. Fica guardado no navegador para sobreviver ao F5.
// Com o backend ligado, o token daqui vai em todo pedido à API.
export type Sessao = {
  token: string
  tipo: TipoUsuario
  email: string
}

const CHAVE = 'impulso.sessao'

export function lerSessao(): Sessao | null {
  try {
    const texto = localStorage.getItem(CHAVE)
    return texto ? (JSON.parse(texto) as Sessao) : null
  } catch {
    return null
  }
}

export function salvarSessao(sessao: Sessao) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(sessao))
  } catch {
    // Sem acesso ao armazenamento (janela anônima, por exemplo): a sessão dura até o F5.
  }
}

export function limparSessao() {
  try {
    localStorage.removeItem(CHAVE)
  } catch {
    // Nada a limpar.
  }
}
