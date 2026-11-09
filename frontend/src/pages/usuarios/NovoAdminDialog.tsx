import { useState } from 'react'
import { TextField } from '@mui/material'
import AdminPanelSettingsRounded from '@mui/icons-material/AdminPanelSettingsRounded'
import Dica from '../../components/Dica.tsx'
import DialogoFormulario from '../../components/DialogoFormulario.tsx'
import { mensagemDeErro } from '../../services/erros.ts'
import { usuarioService } from '../../services/usuarioService.ts'
import { agua } from '../../utils/cores.ts'
import { emailValido } from '../../utils/documentos.ts'

type Props = {
  onFechar: () => void
  onSalvo: () => void
}

// Cria outro administrador. Diferente do acesso de profissional e de responsável,
// não depende de uma pessoa cadastrada: é só e-mail e senha.
function NovoAdminDialog({ onFechar, onSalvo }: Props) {
  const [email, setEmail] = useState('')
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
      await usuarioService.cadastrarAdmin({ email: email.trim(), senha })
      onSalvo()
    } catch (e) {
      setErro(mensagemDeErro(e))
      setSalvando(false)
    }
  }

  return (
    <DialogoFormulario
      titulo="Novo administrador"
      subtitulo="Entra com e-mail e senha"
      icone={<AdminPanelSettingsRounded />}
      cor={agua}
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
      <Dica>
        Quem é administrador vê e muda tudo no Impulso, inclusive os acessos das outras pessoas. Combine a senha com a pessoa
        pessoalmente.
      </Dica>
    </DialogoFormulario>
  )
}

export default NovoAdminDialog
