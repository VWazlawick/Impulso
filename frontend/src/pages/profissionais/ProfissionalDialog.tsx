import { useState } from 'react'
import { TextField } from '@mui/material'
import BadgeRounded from '@mui/icons-material/BadgeRounded'
import DialogoFormulario from '../../components/DialogoFormulario.tsx'
import { mensagemDeErro } from '../../services/erros.ts'
import { profissionalService } from '../../services/profissionalService.ts'
import type { ProfissionalResponse } from '../../types/profissional.ts'
import { menta } from '../../utils/cores.ts'
import { emailValido, formatarCpf, somenteDigitos } from '../../utils/documentos.ts'

type Props = {
  profissional?: ProfissionalResponse
  onFechar: () => void
  onSalvo: () => void
}

// Sem profissional, cadastra um novo; com profissional, edita.
function ProfissionalDialog({ profissional, onFechar, onSalvo }: Props) {
  const [nome, setNome] = useState(profissional?.nmPessoa ?? '')
  const [cpf, setCpf] = useState(profissional ? formatarCpf(profissional.cpf) : '')
  const [email, setEmail] = useState(profissional?.email ?? '')
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)

  async function salvar() {
    const cpfLimpo = somenteDigitos(cpf)
    if (!nome.trim()) {
      setErro('Informe o nome.')
      return
    }
    if (cpfLimpo.length !== 11) {
      setErro('O CPF precisa ter 11 dígitos.')
      return
    }
    if (email.trim() && !emailValido(email.trim())) {
      setErro('Confira o e-mail.')
      return
    }
    const request = { nmPessoa: nome.trim(), cpf: cpfLimpo, email: email.trim() || null }
    setSalvando(true)
    setErro('')
    try {
      if (profissional) {
        await profissionalService.atualizar(profissional.id, request)
      } else {
        await profissionalService.cadastrar(request)
      }
      onSalvo()
    } catch (e) {
      setErro(mensagemDeErro(e))
      setSalvando(false)
    }
  }

  return (
    <DialogoFormulario
      titulo={profissional ? `Editar ${profissional.nmPessoa}` : 'Novo profissional'}
      icone={<BadgeRounded />}
      cor={menta}
      erro={erro}
      salvando={salvando}
      onFechar={onFechar}
      onSalvar={salvar}
    >
      <TextField label="Nome" value={nome} onChange={(e) => setNome(e.target.value)} autoFocus />
      <TextField
        label="CPF"
        placeholder="000.000.000-00"
        value={cpf}
        onChange={(e) => setCpf(e.target.value)}
        slotProps={{ htmlInput: { inputMode: 'numeric', maxLength: 14 } }}
      />
      <TextField
        label="E-mail"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        helperText="Opcional. Vem sugerido na hora de criar o acesso."
      />
    </DialogoFormulario>
  )
}

export default ProfissionalDialog
