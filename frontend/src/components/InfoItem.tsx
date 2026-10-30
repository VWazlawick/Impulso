import type { ReactNode } from 'react'
import { Box, Typography } from '@mui/material'

type Props = {
  rotulo: string
  valor: ReactNode
}

// Um dado com o nome em cima, como "Nascimento" e "14/03/2019".
function InfoItem({ rotulo, valor }: Props) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'text.secondary' }}>{rotulo}</Typography>
      <Box sx={{ mt: 0.25, fontSize: 16, fontWeight: 600, overflowWrap: 'anywhere' }}>{valor}</Box>
    </Box>
  )
}

export default InfoItem
