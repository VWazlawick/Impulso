import type { ReactNode } from 'react'
import { IconButton } from '@mui/material'
import type { Cor } from '../utils/cores.ts'

type Props = {
  rotulo: string
  cor: Cor
  onClick: () => void
  children: ReactNode
}

// Botão redondo só com ícone. O rótulo aparece ao passar o mouse e é lido por leitores de tela.
function BotaoIcone({ rotulo, cor, onClick, children }: Props) {
  return (
    <IconButton
      aria-label={rotulo}
      title={rotulo}
      onClick={onClick}
      sx={{
        width: 44,
        height: 44,
        bgcolor: cor.fundo,
        color: cor.texto,
        '&:hover': { bgcolor: cor.fundo, filter: 'brightness(0.95)' },
      }}
    >
      {children}
    </IconButton>
  )
}

export default BotaoIcone
