import { useState, type FormEvent } from 'react'
import { Alert, Box, Button, Paper, TextField, Typography } from '@mui/material'
import StarRounded from '@mui/icons-material/StarRounded'
import { Navigate, useNavigate } from 'react-router'
import Emblema from '../../components/Emblema.tsx'
import { mensagemDeErro } from '../../services/erros.ts'
import { inicioDoPerfil } from '../../sessao/inicio.ts'
import { useSessao } from '../../sessao/useSessao.ts'
import { destaque } from '../../utils/cores.ts'

function Ilustracao() {
  return (
    <svg viewBox="0 0 280 200" aria-hidden="true" style={{ width: '100%', maxWidth: 280, height: 'auto' }}>
      <circle cx="92" cy="104" r="70" fill="#FFD166" />
      <rect x="150" y="34" width="96" height="96" rx="28" fill="#D3F3E4" />
      <circle cx="214" cy="160" r="22" fill="#FFDDEB" />
      <circle cx="40" cy="30" r="14" fill="#DCEBFF" />
      <path d="M198 58l7 14 15 2-11 11 3 15-14-7-14 7 3-15-11-11 15-2z" fill="#7C5CD6" />
      <path d="M30 176c20-14 40 14 60 0s40 14 60 0 40 14 60 0" fill="none" stroke="#513C8B" strokeWidth="5" strokeLinecap="round" />
      <circle cx="92" cy="104" r="24" fill="#FFFFFF" />
      <path d="M83 104l7 7 13-14" fill="none" stroke="#513C8B" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Login() {
  const navigate = useNavigate()
  const { sessao, entrar } = useSessao()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [entrando, setEntrando] = useState(false)

  if (sessao) {
    return <Navigate to={inicioDoPerfil(sessao.tipo)} replace />
  }

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (!email.trim() || !senha) {
      setErro('Informe o e-mail e a senha.')
      return
    }
    setEntrando(true)
    setErro('')
    try {
      const nova = await entrar(email, senha)
      navigate(inicioDoPerfil(nova.tipo))
    } catch (e) {
      setErro(mensagemDeErro(e) === 'Credenciais inválidas' ? 'E-mail ou senha incorretos.' : mensagemDeErro(e))
      setEntrando(false)
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', p: 2 }}>
      <Paper
        variant="outlined"
        sx={{
          m: 'auto',
          width: '100%',
          maxWidth: 940,
          display: 'flex',
          flexWrap: 'wrap',
          overflow: 'hidden',
          borderRadius: '32px',
          boxShadow: '0 16px 40px rgba(91, 67, 176, 0.12)',
        }}
      >
        <Box
          sx={{
            flex: '1 1 340px',
            p: { xs: 3, sm: 5 },
            bgcolor: 'primary.light',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: 2.5,
          }}
        >
          <Ilustracao />
          <Typography variant="h1" component="p" sx={{ fontSize: 28, lineHeight: 1.2, color: 'primary.dark' }}>
            Acompanhe a evolução de cada criança
          </Typography>
          <Typography sx={{ color: 'text.secondary', lineHeight: 1.5 }}>
            Fichas, avaliações e relatórios de evolução num lugar só.
          </Typography>
        </Box>

        <Box
          component="form"
          onSubmit={enviar}
          noValidate
          sx={{
            flex: '1 1 340px',
            p: { xs: 3, sm: 5 },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: 2.25,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <Emblema cor={destaque}>
              <StarRounded />
            </Emblema>
            <Typography variant="h1" component="span" sx={{ fontSize: 26, color: 'primary.dark' }}>
              Impulso
            </Typography>
          </Box>
          <Box>
            <Typography variant="h1">Que bom te ver!</Typography>
            <Typography sx={{ mt: 0.5, color: 'text.secondary' }}>Entre com seu e-mail e senha.</Typography>
          </Box>
          {erro && <Alert severity="error">{erro}</Alert>}
          <TextField
            label="E-mail"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
          />
          <TextField
            label="Senha"
            type="password"
            autoComplete="current-password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
          <Button type="submit" variant="contained" size="large" loading={entrando}>
            Entrar
          </Button>
          <Typography sx={{ fontSize: 13, color: 'text.secondary', textAlign: 'center' }}>
            O acesso é criado pelo admin ou pelo profissional do aluno.
          </Typography>
        </Box>
      </Paper>
    </Box>
  )
}

export default Login
