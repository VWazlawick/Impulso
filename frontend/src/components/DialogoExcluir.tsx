import { useState } from 'react'
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material'
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded'
import { mensagemDeErro } from '../services/erros.ts'
import { perigo } from '../utils/cores.ts'
import Emblema from './Emblema.tsx'

type Props = {
  titulo: string
  texto?: string
  onFechar: () => void
  onExcluir: () => Promise<void>
}

// Pede confirmação, chama o backend e mostra o motivo quando ele recusa (409).
function DialogoExcluir({ titulo, texto = 'Esta ação não pode ser desfeita.', onFechar, onExcluir }: Props) {
  const [excluindo, setExcluindo] = useState(false)
  const [erro, setErro] = useState('')

  async function confirmar() {
    setExcluindo(true)
    setErro('')
    try {
      await onExcluir()
      onFechar()
    } catch (e) {
      setErro(mensagemDeErro(e))
      setExcluindo(false)
    }
  }

  return (
    <Dialog open onClose={excluindo ? undefined : onFechar} fullWidth maxWidth="xs">
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 3, pt: 2.5, pb: 1 }}>
        <Emblema cor={perigo} tamanho={44}>
          <DeleteOutlineRounded />
        </Emblema>
        <DialogTitle sx={{ p: 0 }}>{titulo}</DialogTitle>
      </Box>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
        <DialogContentText>{texto}</DialogContentText>
        {erro && <Alert severity="error">{erro}</Alert>}
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={onFechar} disabled={excluindo}>
          Cancelar
        </Button>
        <Button variant="contained" color="error" onClick={confirmar} loading={excluindo}>
          Excluir
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default DialogoExcluir
