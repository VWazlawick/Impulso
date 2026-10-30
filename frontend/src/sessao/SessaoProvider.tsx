import { useState, type ReactNode } from 'react'
import { authService } from '../services/authService.ts'
import { lerSessao, limparSessao, salvarSessao, type Sessao } from '../services/sessao.ts'
import { SessaoContexto } from './sessaoContexto.ts'

type Props = {
  children: ReactNode
}

// Guarda quem entrou e oferece entrar() e sair() para as telas.
function SessaoProvider({ children }: Props) {
  const [sessao, setSessao] = useState<Sessao | null>(() => lerSessao())

  async function entrar(email: string, senha: string) {
    const { token, tipo } = await authService.login({ email, senha })
    const nova: Sessao = { token, tipo, email: email.trim().toLowerCase() }
    salvarSessao(nova)
    setSessao(nova)
    return nova
  }

  function sair() {
    limparSessao()
    setSessao(null)
  }

  return <SessaoContexto.Provider value={{ sessao, entrar, sair }}>{children}</SessaoContexto.Provider>
}

export default SessaoProvider
