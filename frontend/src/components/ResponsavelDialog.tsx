import { useState } from 'react'
import { TextField } from '@mui/material'
import FamilyRestroomRounded from '@mui/icons-material/FamilyRestroomRounded'
import { mensagemDeErro } from '../services/erros.ts'
import type { ResponsavelRequest, ResponsavelResponse } from '../types/responsavel.ts'
import { rosa } from '../utils/cores.ts'
import { formatarTelefone, somenteDigitos } from '../utils/documentos.ts'
import DialogoFormulario from './DialogoFormulario.tsx'

type Props = {
  responsavel?: ResponsavelResponse
  subtitulo?: string
  onSalvar: (request: ResponsavelRequest) => Promise<unknown>
  onFechar: () => void
  onSalvo: () => void
}

// Nome e telefone do responsável. Quem chama decide se é cadastro (pela ficha do aluno) ou edição.
function ResponsavelDialog({ responsavel, subtitulo, onSalvar, onFechar, onSalvo }: Props) {
  const [nome, setNome] = useState(responsavel?.nmPessoa ?? '')
  const [telefone, setTelefone] = useState(responsavel ? formatarTelefone(responsavel.nrTelefone) : '')
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)

  async function salvar() {
    const digitos = somenteDigitos(telefone)
    if (!nome.trim()) {
      setErro('Informe o nome.')
      return
    }
    if (digitos.length < 10 || digitos.length > 11) {
      setErro('Informe o telefone com DDD, como (47) 99999-0000.')
      return
    }
    setSalvando(true)
    setErro('')
    try {
      await onSalvar({ nmPessoa: nome.trim(), nrTelefone: digitos })
      onSalvo()
    } catch (e) {
      setErro(mensagemDeErro(e))
      setSalvando(false)
    }
  }

  return (
    <DialogoFormulario
      titulo={responsavel ? `Editar ${responsavel.nmPessoa}` : 'Novo responsável'}
      subtitulo={subtitulo}
      icone={<FamilyRestroomRounded />}
      cor={rosa}
      erro={erro}
      salvando={salvando}
      onFechar={onFechar}
      onSalvar={salvar}
    >
      <TextField label="Nome" value={nome} onChange={(e) => setNome(e.target.value)} autoFocus />
      <TextField
        label="Telefone com DDD"
        placeholder="(47) 99999-0000"
        value={telefone}
        onChange={(e) => setTelefone(e.target.value)}
        slotProps={{ htmlInput: { inputMode: 'tel', maxLength: 16 } }}
      />
    </DialogoFormulario>
  )
}

export default ResponsavelDialog
