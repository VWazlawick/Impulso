import { Navigate } from 'react-router'
import { inicioDoPerfil } from './inicio.ts'
import { useSessao } from './useSessao.ts'

// Endereço desconhecido: quem entrou vai para o início do perfil; quem não entrou, para o login.
function IrParaInicio() {
  const { sessao } = useSessao()
  return <Navigate to={sessao ? inicioDoPerfil(sessao.tipo) : '/login'} replace />
}

export default IrParaInicio
