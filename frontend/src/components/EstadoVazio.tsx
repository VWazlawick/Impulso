import type { ReactNode } from 'react'
import { Card, Typography } from '@mui/material'

type Props = {
  titulo: string
  texto?: string
  acao?: ReactNode
}

// Cartão para quando a lista está vazia: diz o que falta e, se der, como resolver.
function EstadoVazio({ titulo, texto, acao }: Props) {
  return (
    <Card sx={{ p: 3, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
      <Typography sx={{ fontWeight: 700 }}>{titulo}</Typography>
      {texto && <Typography sx={{ color: 'text.secondary' }}>{texto}</Typography>}
      {acao}
    </Card>
  )
}

export default EstadoVazio
