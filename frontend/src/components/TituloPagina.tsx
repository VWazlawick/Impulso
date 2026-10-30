import type { ReactNode } from 'react'
import { Box, Typography } from '@mui/material'

type Props = {
  titulo: string
  descricao?: string
  acao?: ReactNode
}

function TituloPagina({ titulo, descricao, acao }: Props) {
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
      <Box sx={{ flex: '1 1 320px' }}>
        <Typography variant="h1">{titulo}</Typography>
        {descricao && <Typography sx={{ mt: 0.5, color: 'text.secondary' }}>{descricao}</Typography>}
      </Box>
      {acao}
    </Box>
  )
}

export default TituloPagina
