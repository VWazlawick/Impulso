import { createContext } from 'react'
import type { Sessao } from '../services/sessao.ts'

export type ValorSessao = {
  sessao: Sessao | null
  entrar: (email: string, senha: string) => Promise<Sessao>
  sair: () => void
}

// Compartilha quem entrou com qualquer tela, sem passar de componente em componente.
export const SessaoContexto = createContext<ValorSessao | null>(null)
