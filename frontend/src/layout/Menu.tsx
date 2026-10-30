import type { ReactNode } from 'react'
import { Box, ListItemButton, Paper } from '@mui/material'
import ApartmentRounded from '@mui/icons-material/ApartmentRounded'
import BadgeRounded from '@mui/icons-material/BadgeRounded'
import BarChartRounded from '@mui/icons-material/BarChartRounded'
import FactCheckRounded from '@mui/icons-material/FactCheckRounded'
import FamilyRestroomRounded from '@mui/icons-material/FamilyRestroomRounded'
import FormatListBulletedRounded from '@mui/icons-material/FormatListBulletedRounded'
import PeopleAltRounded from '@mui/icons-material/PeopleAltRounded'
import { NavLink } from 'react-router'
import Emblema from '../components/Emblema.tsx'
import { useSessao } from '../sessao/useSessao.ts'
import type { TipoUsuario } from '../types/enums.ts'
import { amarelo, azul, lavanda, lilas, menta, pessego, rosa, type Cor } from '../utils/cores.ts'

type ItemMenu = {
  texto: string
  caminho: string
  icone: ReactNode
  cor: Cor
}

const alunos = { caminho: '/alunos', icone: <PeopleAltRounded fontSize="small" />, cor: pessego }
const novaAvaliacao: ItemMenu = {
  texto: 'Nova avaliação',
  caminho: '/avaliacoes/nova',
  icone: <FactCheckRounded fontSize="small" />,
  cor: lilas,
}
const responsaveis: ItemMenu = {
  texto: 'Responsáveis',
  caminho: '/responsaveis',
  icone: <FamilyRestroomRounded fontSize="small" />,
  cor: rosa,
}

// Cada perfil vê só o que pode usar. O responsável não tem menu (veja o Layout).
const itensPorPerfil: Record<TipoUsuario, ItemMenu[]> = {
  ADMIN: [
    { texto: 'Alunos', ...alunos },
    novaAvaliacao,
    responsaveis,
    { texto: 'Profissionais', caminho: '/profissionais', icone: <BadgeRounded fontSize="small" />, cor: menta },
    { texto: 'Estrutura da ficha', caminho: '/grupos', icone: <FormatListBulletedRounded fontSize="small" />, cor: lavanda },
    { texto: 'Classificações', caminho: '/classificacoes', icone: <BarChartRounded fontSize="small" />, cor: amarelo },
    { texto: 'Empresa', caminho: '/empresa', icone: <ApartmentRounded fontSize="small" />, cor: azul },
  ],
  PROFISSIONAL: [{ texto: 'Meus alunos', ...alunos }, novaAvaliacao, responsaveis],
  RESPONSAVEL: [],
}

// O NavLink ganha a classe "active" quando é a página atual; o '&.active' pinta o item.
const estiloItem = {
  minHeight: 48,
  flexShrink: 0,
  gap: 1.5,
  px: 1.25,
  borderRadius: '14px',
  fontSize: 15,
  fontWeight: 600,
  whiteSpace: 'nowrap',
  '&.active': { bgcolor: 'primary.light', color: 'primary.dark', fontWeight: 700 },
}

function Menu() {
  const { sessao } = useSessao()
  const itens = sessao ? itensPorPerfil[sessao.tipo] : []

  return (
    <Box component="nav" aria-label="Menu" sx={{ width: { md: 250 }, flexShrink: 0, minWidth: 0 }}>
      <Paper
        variant="outlined"
        sx={{
          borderRadius: '20px',
          p: 1.25,
          display: 'flex',
          flexDirection: { xs: 'row', md: 'column' },
          overflowX: { xs: 'auto', md: 'visible' },
          gap: 0.5,
        }}
      >
        {itens.map((item) => (
          <ListItemButton key={item.caminho} component={NavLink} to={item.caminho} sx={estiloItem}>
            <Emblema cor={item.cor} tamanho={34}>
              {item.icone}
            </Emblema>
            {item.texto}
          </ListItemButton>
        ))}
      </Paper>
    </Box>
  )
}

export default Menu
