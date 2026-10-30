import type { ReactNode } from 'react'
import { Box } from '@mui/material'

type Props = {
  children: ReactNode
  destaque?: boolean
}

// Caixinha de explicação. Com destaque, fica amarela.
function Dica({ children, destaque = false }: Props) {
  return (
    <Box
      sx={{
        px: 1.75,
        py: 1.25,
        borderRadius: '14px',
        fontSize: 14,
        bgcolor: destaque ? 'secondary.light' : '#FBF9FF',
        color: destaque ? 'secondary.contrastText' : '#4F4677',
        fontWeight: destaque ? 600 : 400,
      }}
    >
      {children}
    </Box>
  )
}

export default Dica
