import type { ReactNode } from 'react'
import { Box, Card, Typography } from '@mui/material'
import { menta, neutro, type Cor } from '../utils/cores.ts'
import { iniciais } from '../utils/documentos.ts'
import Emblema from './Emblema.tsx'
import Etiqueta from './Etiqueta.tsx'

type Props = {
  cor: Cor
  nome: string
  detalhe: string
  possuiAcesso: boolean
  acoes: ReactNode
}

// Uma pessoa na lista (profissional ou responsável), com o selo de acesso ao sistema.
function LinhaPessoa({ cor, nome, detalhe, possuiAcesso, acoes }: Props) {
  return (
    <Card sx={{ p: 1.75, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5 }}>
      <Emblema cor={cor} tamanho={44}>
        {iniciais(nome)}
      </Emblema>
      <Box sx={{ flex: '1 1 200px', minWidth: 0 }}>
        <Typography sx={{ fontWeight: 700 }}>{nome}</Typography>
        <Typography sx={{ fontSize: 14, color: 'text.secondary', overflowWrap: 'anywhere' }}>{detalhe}</Typography>
      </Box>
      <Etiqueta cor={possuiAcesso ? menta : neutro} texto={possuiAcesso ? 'Tem acesso' : 'Sem acesso'} />
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>{acoes}</Box>
    </Card>
  )
}

export default LinhaPessoa
