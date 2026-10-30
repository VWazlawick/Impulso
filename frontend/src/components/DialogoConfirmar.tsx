import { useState, type ReactNode } from 'react'
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material'
import { mensagemDeErro } from '../services/erros.ts'
import type { Cor } from '../utils/cores.ts'
import Emblema from './Emblema.tsx'

type Props = {
  titulo: string
  texto: string
  rotuloConfirmar: string
  icone: ReactNode
  cor: Cor
  perigoso?: boolean
  onFechar: () => void
  onConfirmar: () => Promise<void>
}

// Pergunta "tem certeza?", chama o backend e mostra o motivo se ele recusar.
function DialogoConfirmar(props: Props) {
  const { titulo, texto, rotuloConfirmar, icone, cor, perigoso = false, onFechar, onConfirmar } = props
  const [confirmando, setConfirmando] = useState(false)
  const [erro, setErro] = useState('')

  async function confirmar() {
    setConfirmando(true)
    setErro('')
    try {
      await onConfirmar()
      onFechar()
    } catch (e) {
      setErro(mensagemDeErro(e))
      setConfirmando(false)
    }
  }

  return (
    <Dialog open onClose={confirmando ? undefined : onFechar} fullWidth maxWidth="xs">
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 3, pt: 2.5, pb: 1 }}>
        <Emblema cor={cor} tamanho={44}>
          {icone}
        </Emblema>
        <DialogTitle sx={{ p: 0 }}>{titulo}</DialogTitle>
      </Box>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
        <DialogContentText>{texto}</DialogContentText>
        {erro && <Alert severity="error">{erro}</Alert>}
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={onFechar} disabled={confirmando}>
          Cancelar
        </Button>
        <Button variant="contained" color={perigoso ? 'error' : 'primary'} onClick={confirmar} loading={confirmando}>
          {rotuloConfirmar}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default DialogoConfirmar
