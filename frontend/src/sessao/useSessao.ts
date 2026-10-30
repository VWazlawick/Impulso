import { useContext } from 'react'
import { SessaoContexto } from './sessaoContexto.ts'

export function useSessao() {
  const valor = useContext(SessaoContexto)
  if (!valor) {
    throw new Error('useSessao precisa ficar dentro do SessaoProvider')
  }
  return valor
}
