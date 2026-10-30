import { useState } from 'react'
import { Box, TextField } from '@mui/material'
import FormatListBulletedRounded from '@mui/icons-material/FormatListBulletedRounded'
import DialogoFormulario from '../../components/DialogoFormulario.tsx'
import { mensagemDeErro } from '../../services/erros.ts'
import { grupoService } from '../../services/grupoService.ts'
import type { GrupoResponse } from '../../types/grupo.ts'
import { lilas } from '../../utils/cores.ts'
import { lerInteiro } from '../../utils/formatos.ts'

type Props = {
  grupo?: GrupoResponse
  onFechar: () => void
  onSalvo: () => void
}

// Sem grupo, cadastra um novo; com grupo, edita.
function GrupoDialog({ grupo, onFechar, onSalvo }: Props) {
  const [nome, setNome] = useState(grupo?.nmGrupo ?? '')
  const [idadeMin, setIdadeMin] = useState(grupo ? String(grupo.nrIdadeMin) : '')
  const [idadeMax, setIdadeMax] = useState(grupo ? String(grupo.nrIdadeMax) : '')
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)

  async function salvar() {
    const nrIdadeMin = lerInteiro(idadeMin)
    const nrIdadeMax = lerInteiro(idadeMax)
    if (!nome.trim()) {
      setErro('Informe o nome do grupo.')
      return
    }
    if (nrIdadeMin === null || nrIdadeMax === null) {
      setErro('Informe as idades em anos inteiros, como 6 e 7.')
      return
    }

    const request = { nmGrupo: nome.trim(), nrIdadeMin, nrIdadeMax }
    setSalvando(true)
    setErro('')
    try {
      if (grupo) {
        await grupoService.atualizar(grupo.id, request)
      } else {
        await grupoService.cadastrar(request)
      }
      onSalvo()
    } catch (e) {
      setErro(mensagemDeErro(e))
      setSalvando(false)
    }
  }

  return (
    <DialogoFormulario
      titulo={grupo ? `Editar ${grupo.nmGrupo}` : 'Novo grupo'}
      icone={<FormatListBulletedRounded />}
      cor={lilas}
      erro={erro}
      salvando={salvando}
      onFechar={onFechar}
      onSalvar={salvar}
    >
      <TextField
        label="Nome do grupo"
        placeholder="Grupo 5"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        autoFocus
        slotProps={{ htmlInput: { maxLength: 50 } }}
      />
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
        <TextField
          label="Idade mínima"
          type="number"
          value={idadeMin}
          onChange={(e) => setIdadeMin(e.target.value)}
          slotProps={{ htmlInput: { min: 0 } }}
        />
        <TextField
          label="Idade máxima"
          type="number"
          value={idadeMax}
          onChange={(e) => setIdadeMax(e.target.value)}
          slotProps={{ htmlInput: { min: 0 } }}
        />
      </Box>
    </DialogoFormulario>
  )
}

export default GrupoDialog
