import { Box } from '@mui/material'
import { Outlet } from 'react-router'
import { useSessao } from '../sessao/useSessao.ts'
import Cabecalho from './Cabecalho.tsx'
import Menu from './Menu.tsx'

// Moldura das telas: cabeçalho em cima, menu ao lado e, no Outlet, a página da rota atual.
// No celular o menu vira uma faixa em cima; a partir de 900px fica ao lado.
// O responsável tem uma tela só, então fica sem menu e com o conteúdo centralizado.
function Layout() {
  const { sessao } = useSessao()
  const comMenu = sessao?.tipo !== 'RESPONSAVEL'

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Cabecalho />
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { md: 'flex-start' },
          gap: 2.5,
          p: 2,
        }}
      >
        {comMenu && <Menu />}
        <Box
          component="main"
          sx={{ flex: 1, minWidth: 0, width: '100%', maxWidth: comMenu ? 1040 : 760, mx: comMenu ? 0 : 'auto' }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  )
}

export default Layout
