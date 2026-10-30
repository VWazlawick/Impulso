import type { ReactNode } from 'react'
import { Box } from '@mui/material'
import { fonteTitulo } from '../tema.ts'
import type { Cor } from '../utils/cores.ts'

type Props = {
  cor: Cor
  tamanho?: number
  children: ReactNode
}

// Quadradinho colorido com um ícone ou um número dentro.
function Emblema({ cor, tamanho = 40, children }: Props) {
  return (
    <Box
      component="span"
      sx={{
        width: tamanho,
        height: tamanho,
        flexShrink: 0,
        borderRadius: `${Math.round(tamanho * 0.3)}px`,
        display: 'grid',
        placeItems: 'center',
        bgcolor: cor.fundo,
        color: cor.texto,
        fontFamily: fonteTitulo,
        fontSize: Math.round(tamanho * 0.5),
        fontWeight: 600,
        lineHeight: 1,
      }}
    >
      {children}
    </Box>
  )
}

export default Emblema
