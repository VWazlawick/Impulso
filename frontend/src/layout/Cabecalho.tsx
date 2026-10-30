import { Avatar, Box, Button, Typography } from '@mui/material'
import LogoutRounded from '@mui/icons-material/LogoutRounded'
import StarRounded from '@mui/icons-material/StarRounded'
import { Link as RouterLink, useNavigate } from 'react-router'
import Emblema from '../components/Emblema.tsx'
import { inicioDoPerfil } from '../sessao/inicio.ts'
import { useSessao } from '../sessao/useSessao.ts'
import { destaque } from '../utils/cores.ts'
import { rotuloUsuario } from '../utils/rotulos.ts'

function Cabecalho() {
  const { sessao, sair } = useSessao()
  const navigate = useNavigate()

  if (!sessao) {
    return null
  }

  function sairDoSistema() {
    sair()
    navigate('/login')
  }

  return (
    <Box
      component="header"
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 1.5,
        px: 2.5,
        py: 1.5,
        bgcolor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      <Box
        component={RouterLink}
        to={inicioDoPerfil(sessao.tipo)}
        sx={{ display: 'flex', alignItems: 'center', gap: 1.25, textDecoration: 'none' }}
      >
        <Emblema cor={destaque}>
          <StarRounded />
        </Emblema>
        <Typography variant="h1" component="span" sx={{ fontSize: 24, color: 'primary.dark' }}>
          Impulso
        </Typography>
      </Box>

      <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
        <Avatar sx={{ bgcolor: destaque.fundo, color: destaque.texto, fontSize: 14, fontWeight: 700 }}>
          {sessao.email.slice(0, 2).toUpperCase()}
        </Avatar>
        <Box sx={{ minWidth: 0, display: { xs: 'none', sm: 'block' } }}>
          <Typography sx={{ fontSize: 14, fontWeight: 700, lineHeight: 1.3 }}>{rotuloUsuario[sessao.tipo]}</Typography>
          <Typography
            sx={{
              fontSize: 13,
              color: 'text.secondary',
              lineHeight: 1.3,
              maxWidth: 220,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {sessao.email}
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<LogoutRounded />} onClick={sairDoSistema}>
          Sair
        </Button>
      </Box>
    </Box>
  )
}

export default Cabecalho
