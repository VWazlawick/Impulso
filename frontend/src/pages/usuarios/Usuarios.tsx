import { useState } from 'react'
import { Alert, Box, Button, Card, MenuItem, TextField, Typography } from '@mui/material'
import AddRounded from '@mui/icons-material/AddRounded'
import AdminPanelSettingsRounded from '@mui/icons-material/AdminPanelSettingsRounded'
import KeyRounded from '@mui/icons-material/KeyRounded'
import CampoBusca from '../../components/CampoBusca.tsx'
import Carregando from '../../components/Carregando.tsx'
import Emblema from '../../components/Emblema.tsx'
import EstadoVazio from '../../components/EstadoVazio.tsx'
import Etiqueta from '../../components/Etiqueta.tsx'
import GerenciarAcessoDialog from '../../components/GerenciarAcessoDialog.tsx'
import TituloPagina from '../../components/TituloPagina.tsx'
import { useDados } from '../../hooks/useDados.ts'
import { usuarioService } from '../../services/usuarioService.ts'
import type { TipoUsuario } from '../../types/enums.ts'
import type { UsuarioListaResponse } from '../../types/usuario.ts'
import { agua, destaque, menta, perigo, rosa, type Cor } from '../../utils/cores.ts'
import { iniciais } from '../../utils/documentos.ts'
import { rotuloUsuario } from '../../utils/rotulos.ts'
import NovoAdminDialog from './NovoAdminDialog.tsx'

const corDoTipo: Record<TipoUsuario, Cor> = { ADMIN: agua, PROFISSIONAL: menta, RESPONSAVEL: rosa }
const tipos: TipoUsuario[] = ['ADMIN', 'PROFISSIONAL', 'RESPONSAVEL']

type Dialogo = { tipo: 'novo' } | { tipo: 'acesso'; usuario: UsuarioListaResponse }

// Admin não tem pessoa: o e-mail faz as vezes de nome.
function nomeDe(usuario: UsuarioListaResponse) {
  return usuario.nmPessoa ?? usuario.email
}

// Todo mundo que entra no Impulso. Daqui sai o cadastro de outros administradores;
// profissionais e responsáveis ganham acesso nas telas deles e só aparecem aqui depois.
function Usuarios() {
  const usuarios = useDados(() => usuarioService.listar(), [])
  const eu = useDados(() => usuarioService.meusDados(), [])
  const [busca, setBusca] = useState('')
  const [tipo, setTipo] = useState<TipoUsuario | 'TODOS'>('TODOS')
  const [dialogo, setDialogo] = useState<Dialogo | null>(null)

  const termo = busca.trim().toLowerCase()
  const lista = (usuarios.dados ?? []).filter(
    (u) =>
      (tipo === 'TODOS' || u.tpUsuario === tipo) &&
      (u.email.toLowerCase().includes(termo) || (u.nmPessoa ?? '').toLowerCase().includes(termo)),
  )
  const fechar = () => setDialogo(null)
  const salvo = () => {
    fechar()
    usuarios.recarregar()
  }

  return (
    <>
      <TituloPagina
        titulo="Usuários"
        descricao="Todo mundo que entra no Impulso. Aqui você cadastra outros administradores; profissionais e responsáveis ganham acesso nas telas deles."
        acao={
          <Button variant="contained" startIcon={<AddRounded />} onClick={() => setDialogo({ tipo: 'novo' })}>
            Novo administrador
          </Button>
        }
      />

      <Card sx={{ p: 2, mb: 2, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2 }}>
        <Box sx={{ flex: '1 1 260px' }}>
          <CampoBusca rotulo="Buscar pelo nome ou e-mail" valor={busca} onMudar={setBusca} />
        </Box>
        <TextField
          select
          label="Perfil"
          value={tipo}
          onChange={(e) => setTipo(e.target.value as TipoUsuario | 'TODOS')}
          sx={{ flex: '1 1 180px', maxWidth: { sm: 240 } }}
        >
          <MenuItem value="TODOS">Todos</MenuItem>
          {tipos.map((t) => (
            <MenuItem key={t} value={t}>
              {rotuloUsuario[t]}
            </MenuItem>
          ))}
        </TextField>
      </Card>

      {usuarios.carregando && <Carregando />}
      {usuarios.erro && <Alert severity="error">{usuarios.erro}</Alert>}
      {usuarios.dados && lista.length === 0 && (
        <EstadoVazio titulo="Ninguém encontrado." texto="Confira a busca ou escolha outro perfil." />
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
        {lista.map((u) => {
          const proprio = u.id === eu.dados?.id
          return (
            <Card key={u.id} sx={{ p: 1.75, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5 }}>
              <Emblema cor={corDoTipo[u.tpUsuario]} tamanho={44}>
                {u.nmPessoa ? iniciais(u.nmPessoa) : <AdminPanelSettingsRounded />}
              </Emblema>
              <Box sx={{ flex: '1 1 200px', minWidth: 0 }}>
                <Typography sx={{ fontWeight: 700, overflowWrap: 'anywhere' }}>{nomeDe(u)}</Typography>
                {u.nmPessoa && (
                  <Typography sx={{ fontSize: 14, color: 'text.secondary', overflowWrap: 'anywhere' }}>{u.email}</Typography>
                )}
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 0.75 }}>
                {proprio && <Etiqueta cor={destaque} texto="Você" />}
                <Etiqueta cor={corDoTipo[u.tpUsuario]} texto={rotuloUsuario[u.tpUsuario]} />
                <Etiqueta cor={u.stAtivo ? menta : perigo} texto={u.stAtivo ? 'Pode entrar' : 'Bloqueado'} />
              </Box>
              <Button size="small" variant="outlined" startIcon={<KeyRounded />} onClick={() => setDialogo({ tipo: 'acesso', usuario: u })}>
                Acesso
              </Button>
            </Card>
          )
        })}
      </Box>

      {dialogo?.tipo === 'novo' && <NovoAdminDialog onFechar={fechar} onSalvo={salvo} />}
      {dialogo?.tipo === 'acesso' && (
        <GerenciarAcessoDialog
          usuarioId={dialogo.usuario.id}
          nome={nomeDe(dialogo.usuario)}
          proprio={dialogo.usuario.id === eu.dados?.id}
          onFechar={fechar}
          onSalvo={salvo}
        />
      )}
    </>
  )
}

export default Usuarios
