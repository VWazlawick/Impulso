import { useState } from 'react'
import { TextField } from '@mui/material'
import KeyRounded from '@mui/icons-material/KeyRounded'
import { mensagemDeErro } from '../services/erros.ts'
import { usuarioService } from '../services/usuarioService.ts'
import { menta } from '../utils/cores.ts'
import { emailValido } from '../utils/documentos.ts'
import Dica from './Dica.tsx'
import DialogoFormulario from './DialogoFormulario.tsx'

type Props = {
  pessoaId: number
  nome: string
  emailSugerido?: string | null
  onFechar: () => void
  onSalvo: () => void
}

// Cria o login de um profissional ou de um responsável já cadastrado.
function AcessoDialog({ pessoaId, nome, emailSugerido, onFechar, onSalvo }: Props) {
  const [email, setEmail] = useState(emailSugerido ?? '')
  const [senha, setSenha] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)

  async function salvar() {
    if (!emailValido(email.trim())) {
      setErro('Confira o e-mail.')
      return
    }
    if (senha.length < 8) {
      setErro('A senha precisa ter pelo menos 8 caracteres.')
      return
    }
    if (senha !== confirmacao) {
      setErro('A confirmação está diferente da senha.')
      return
    }
    setSalvando(true)
    setErro('')
    try {
      await usuarioService.criarAcesso({ pessoaId, email: email.trim(), senha })
      onSalvo()
    } catch (e) {
      setErro(mensagemDeErro(e))
      setSalvando(false)
    }
  }

  return (
    <DialogoFormulario
      titulo="Criar acesso"
      subtitulo={nome}
      icone={<KeyRounded />}
      cor={menta}
      erro={erro}
      salvando={salvando}
      onFechar={onFechar}
      onSalvar={salvar}
    >
      <TextField
        label="E-mail para entrar"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoFocus
        autoComplete="off"
      />
      <TextField
        label="Senha"
        type="password"
        value={senha}
        onChange={(e) => setSenha(e.target.value)}
        autoComplete="new-password"
        helperText="Pelo menos 8 caracteres."
      />
      <TextField
        label="Repita a senha"
        type="password"
        value={confirmacao}
        onChange={(e) => setConfirmacao(e.target.value)}
        autoComplete="new-password"
      />
      <Dica>A pessoa entra no Impulso com este e-mail e esta senha. Combine a senha com ela pessoalmente.</Dica>
    </DialogoFormulario>
  )
}

export default AcessoDialog
