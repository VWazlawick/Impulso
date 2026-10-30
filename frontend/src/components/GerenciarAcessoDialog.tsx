import { useState } from 'react'
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, TextField, Typography } from '@mui/material'
import KeyRounded from '@mui/icons-material/KeyRounded'
import { useDados } from '../hooks/useDados.ts'
import { mensagemDeErro } from '../services/erros.ts'
import { usuarioService } from '../services/usuarioService.ts'
import type { UsuarioResponse } from '../types/usuario.ts'
import { menta, perigo } from '../utils/cores.ts'
import { emailValido } from '../utils/documentos.ts'
import Carregando from './Carregando.tsx'
import DialogoFormulario from './DialogoFormulario.tsx'
import Etiqueta from './Etiqueta.tsx'

type Props = {
  usuarioId: number
  nome: string
  onFechar: () => void
  onSalvo: () => void
}

type PropsFormulario = Omit<Props, 'usuarioId'> & {
  usuario: UsuarioResponse
}

function FormularioAcesso({ usuario, nome, onFechar, onSalvo }: PropsFormulario) {
  const [email, setEmail] = useState(usuario.email)
  const [senha, setSenha] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)

  async function salvar() {
    if (!emailValido(email.trim())) {
      setErro('Confira o e-mail.')
      return
    }
    if (senha && senha.length < 8) {
      setErro('A nova senha precisa ter pelo menos 8 caracteres.')
      return
    }
    if (senha !== confirmacao) {
      setErro('A confirmação está diferente da nova senha.')
      return
    }
    setSalvando(true)
    setErro('')
    try {
      // Senha vazia vai como null: o backend mantém a atual.
      await usuarioService.atualizar(usuario.id, { email: email.trim(), senha: senha || null })
      onSalvo()
    } catch (e) {
      setErro(mensagemDeErro(e))
      setSalvando(false)
    }
  }

  async function trocarSituacao() {
    setSalvando(true)
    setErro('')
    try {
      if (usuario.stAtivo) {
        await usuarioService.inativar(usuario.id)
      } else {
        await usuarioService.reativar(usuario.id)
      }
      onSalvo()
    } catch (e) {
      setErro(mensagemDeErro(e))
      setSalvando(false)
    }
  }

  return (
    <DialogoFormulario
      titulo="Acesso"
      subtitulo={nome}
      icone={<KeyRounded />}
      cor={menta}
      erro={erro}
      salvando={salvando}
      onFechar={onFechar}
      onSalvar={salvar}
      acaoExtra={
        <Button
          onClick={trocarSituacao}
          disabled={salvando}
          sx={
            usuario.stAtivo
              ? { bgcolor: perigo.fundo, color: perigo.texto, '&:hover': { bgcolor: '#FFE3E8' } }
              : { bgcolor: menta.fundo, color: menta.texto, '&:hover': { bgcolor: '#C2EBD7' } }
          }
        >
          {usuario.stAtivo ? 'Bloquear acesso' : 'Desbloquear'}
        </Button>
      }
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography sx={{ fontSize: 14, color: 'text.secondary' }}>Situação:</Typography>
        <Etiqueta cor={usuario.stAtivo ? menta : perigo} texto={usuario.stAtivo ? 'Pode entrar' : 'Bloqueado'} />
      </Box>
      <TextField label="E-mail para entrar" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="off" />
      <TextField
        label="Nova senha"
        type="password"
        value={senha}
        onChange={(e) => setSenha(e.target.value)}
        autoComplete="new-password"
        helperText="Deixe em branco para manter a senha atual."
      />
      {senha && (
        <TextField
          label="Repita a nova senha"
          type="password"
          value={confirmacao}
          onChange={(e) => setConfirmacao(e.target.value)}
          autoComplete="new-password"
        />
      )}
    </DialogoFormulario>
  )
}

// Só o admin mexe num acesso que já existe: troca e-mail ou senha e bloqueia ou desbloqueia.
function GerenciarAcessoDialog({ usuarioId, nome, onFechar, onSalvo }: Props) {
  const usuario = useDados(() => usuarioService.buscarPorId(usuarioId), [usuarioId])

  if (usuario.dados) {
    return <FormularioAcesso usuario={usuario.dados} nome={nome} onFechar={onFechar} onSalvo={onSalvo} />
  }
  return (
    <Dialog open onClose={onFechar} fullWidth maxWidth="xs">
      <DialogContent>{usuario.erro ? <Alert severity="error">{usuario.erro}</Alert> : <Carregando />}</DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={onFechar}>
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default GerenciarAcessoDialog
