import { useState } from 'react'
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material'
import LinkRounded from '@mui/icons-material/LinkRounded'
import CampoBusca from '../../components/CampoBusca.tsx'
import Carregando from '../../components/Carregando.tsx'
import Emblema from '../../components/Emblema.tsx'
import { useDados } from '../../hooks/useDados.ts'
import { alunoService } from '../../services/alunoService.ts'
import { mensagemDeErro } from '../../services/erros.ts'
import { responsavelService } from '../../services/responsavelService.ts'
import { rosa } from '../../utils/cores.ts'
import { formatarTelefone, iniciais } from '../../utils/documentos.ts'

type Props = {
  alunoId: number
  vinculados: number[]
  onFechar: () => void
  onSalvo: () => void
}

// Liga um responsável que já existe a esta criança (irmãos, por exemplo).
// O profissional só encontra responsáveis dos alunos dele: regra do backend.
function VincularResponsavelDialog({ alunoId, vinculados, onFechar, onSalvo }: Props) {
  const responsaveis = useDados(() => responsavelService.listar(), [])
  const [busca, setBusca] = useState('')
  const [vinculando, setVinculando] = useState<number | null>(null)
  const [erro, setErro] = useState('')

  const termo = busca.trim().toLowerCase()
  const disponiveis = (responsaveis.dados ?? []).filter(
    (r) => !vinculados.includes(r.id) && r.nmPessoa.toLowerCase().includes(termo),
  )

  async function vincular(responsavelId: number) {
    setVinculando(responsavelId)
    setErro('')
    try {
      await alunoService.vincularResponsavel(alunoId, responsavelId)
      onSalvo()
    } catch (e) {
      setErro(mensagemDeErro(e))
      setVinculando(null)
    }
  }

  return (
    <Dialog open onClose={onFechar} fullWidth maxWidth="xs">
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 3, pt: 2.5, pb: 1 }}>
        <Emblema cor={rosa} tamanho={44}>
          <LinkRounded />
        </Emblema>
        <DialogTitle sx={{ p: 0 }}>Vincular responsável</DialogTitle>
      </Box>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: 1.5 }}>
        <Typography sx={{ fontSize: 14, color: 'text.secondary' }}>
          Para irmãos, por exemplo: o mesmo responsável fica ligado às duas crianças.
        </Typography>
        <CampoBusca rotulo="Buscar pelo nome" valor={busca} onMudar={setBusca} />
        {erro && <Alert severity="error">{erro}</Alert>}
        {responsaveis.carregando && <Carregando />}
        {responsaveis.erro && <Alert severity="error">{responsaveis.erro}</Alert>}
        {responsaveis.dados && disponiveis.length === 0 && (
          <Typography sx={{ py: 2, textAlign: 'center', color: 'text.secondary' }}>
            Nenhum responsável para vincular. Cadastre um novo.
          </Typography>
        )}
        {disponiveis.map((r) => (
          <Box key={r.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.25, p: 1, borderRadius: '14px', bgcolor: '#FBF9FF' }}>
            <Emblema cor={rosa} tamanho={36}>
              {iniciais(r.nmPessoa)}
            </Emblema>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontWeight: 700 }}>{r.nmPessoa}</Typography>
              <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{formatarTelefone(r.nrTelefone)}</Typography>
            </Box>
            <Button
              size="small"
              variant="contained"
              onClick={() => vincular(r.id)}
              loading={vinculando === r.id}
              disabled={vinculando !== null && vinculando !== r.id}
            >
              Vincular
            </Button>
          </Box>
        ))}
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={onFechar}>
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default VincularResponsavelDialog
