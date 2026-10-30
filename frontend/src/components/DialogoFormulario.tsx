import type { FormEvent, ReactNode } from 'react'
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material'
import type { Cor } from '../utils/cores.ts'
import Emblema from './Emblema.tsx'

type Props = {
  titulo: string
  subtitulo?: string
  icone: ReactNode
  cor: Cor
  erro: string
  salvando: boolean
  largo?: boolean
  acaoExtra?: ReactNode
  onFechar: () => void
  onSalvar: () => void
  children: ReactNode
}

// Moldura dos diálogos de cadastro: título com ícone, campos, erro e botões.
// Enter dentro de um campo também salva.
function DialogoFormulario(props: Props) {
  const { titulo, subtitulo, icone, cor, erro, salvando, largo = false, acaoExtra, onFechar, onSalvar, children } = props

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    onSalvar()
  }

  return (
    <Dialog open onClose={salvando ? undefined : onFechar} fullWidth maxWidth={largo ? 'sm' : 'xs'}>
      <Box component="form" onSubmit={enviar} noValidate>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 3, pt: 2.5, pb: 1 }}>
          <Emblema cor={cor} tamanho={44}>
            {icone}
          </Emblema>
          <Box>
            <DialogTitle sx={{ p: 0 }}>{titulo}</DialogTitle>
            {subtitulo && <Typography sx={{ fontSize: 14, color: 'text.secondary' }}>{subtitulo}</Typography>}
          </Box>
        </Box>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1.5 }}>
          {erro && <Alert severity="error">{erro}</Alert>}
          {children}
        </DialogContent>
        <DialogActions>
          {acaoExtra}
          <Box sx={{ flex: 1 }} />
          <Button variant="outlined" onClick={onFechar} disabled={salvando}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" loading={salvando}>
            Salvar
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}

export default DialogoFormulario
