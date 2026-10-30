import { Navigate, Outlet } from 'react-router'
import type { TipoUsuario } from '../types/enums.ts'
import { inicioDoPerfil } from './inicio.ts'
import { useSessao } from './useSessao.ts'

type Props = {
  perfis?: TipoUsuario[]
}

// Protege as rotas de dentro: sem sessão vai para o login; perfil errado volta para o início dele.
// É só conforto de tela: quem garante a permissão de verdade é o backend.
function RequerPerfil({ perfis }: Props) {
  const { sessao } = useSessao()
  if (!sessao) {
    return <Navigate to="/login" replace />
  }
  if (perfis && !perfis.includes(sessao.tipo)) {
    return <Navigate to={inicioDoPerfil(sessao.tipo)} replace />
  }
  return <Outlet />
}

export default RequerPerfil
