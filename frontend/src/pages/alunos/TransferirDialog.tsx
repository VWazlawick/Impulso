import { useState } from 'react'
import { MenuItem, TextField } from '@mui/material'
import SwapHorizRounded from '@mui/icons-material/SwapHorizRounded'
import Dica from '../../components/Dica.tsx'
import DialogoFormulario from '../../components/DialogoFormulario.tsx'
import { alunoService } from '../../services/alunoService.ts'
import { mensagemDeErro } from '../../services/erros.ts'
import type { AlunoResponse } from '../../types/aluno.ts'
import type { ProfissionalResponse } from '../../types/profissional.ts'
import { menta } from '../../utils/cores.ts'

type Props = {
  aluno: AlunoResponse
  profissionais: ProfissionalResponse[]
  onFechar: () => void
  onSalvo: () => void
}

// Só o admin troca o profissional de um aluno.
function TransferirDialog({ aluno, profissionais, onFechar, onSalvo }: Props) {
  const [profissionalId, setProfissionalId] = useState<number>(aluno.profissionalId)
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)

  async function salvar() {
    if (profissionalId === aluno.profissionalId) {
      setErro('Escolha um profissional diferente do atual.')
      return
    }
    setSalvando(true)
    setErro('')
    try {
      await alunoService.transferir(aluno.id, profissionalId)
      onSalvo()
    } catch (e) {
      setErro(mensagemDeErro(e))
      setSalvando(false)
    }
  }

  return (
    <DialogoFormulario
      titulo="Transferir aluno"
      subtitulo={aluno.nmPessoa}
      icone={<SwapHorizRounded />}
      cor={menta}
      erro={erro}
      salvando={salvando}
      onFechar={onFechar}
      onSalvar={salvar}
    >
      <TextField select label="Novo profissional" value={profissionalId} onChange={(e) => setProfissionalId(Number(e.target.value))}>
        {profissionais.map((p) => (
          <MenuItem key={p.id} value={p.id}>
            {p.nmPessoa}
            {p.id === aluno.profissionalId ? ' (atual)' : ''}
          </MenuItem>
        ))}
      </TextField>
      <Dica>As avaliações antigas continuam com quem avaliou; as próximas ficam com o novo profissional.</Dica>
    </DialogoFormulario>
  )
}

export default TransferirDialog
