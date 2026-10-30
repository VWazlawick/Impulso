import { useState } from 'react'
import { Alert, Box, Button } from '@mui/material'
import AddRounded from '@mui/icons-material/AddRounded'
import EditRounded from '@mui/icons-material/EditRounded'
import KeyRounded from '@mui/icons-material/KeyRounded'
import AcessoDialog from '../../components/AcessoDialog.tsx'
import BotaoIcone from '../../components/BotaoIcone.tsx'
import GerenciarAcessoDialog from '../../components/GerenciarAcessoDialog.tsx'
import Carregando from '../../components/Carregando.tsx'
import EstadoVazio from '../../components/EstadoVazio.tsx'
import LinhaPessoa from '../../components/LinhaPessoa.tsx'
import TituloPagina from '../../components/TituloPagina.tsx'
import { useDados } from '../../hooks/useDados.ts'
import { profissionalService } from '../../services/profissionalService.ts'
import type { ProfissionalResponse } from '../../types/profissional.ts'
import { lilas, menta } from '../../utils/cores.ts'
import { formatarCpf } from '../../utils/documentos.ts'
import ProfissionalDialog from './ProfissionalDialog.tsx'

type Dialogo =
  | { tipo: 'profissional'; profissional?: ProfissionalResponse }
  | { tipo: 'acesso'; profissional: ProfissionalResponse }
  | { tipo: 'gerenciar'; profissional: ProfissionalResponse; usuarioId: number }

function Profissionais() {
  const profissionais = useDados(() => profissionalService.listar(), [])
  const [dialogo, setDialogo] = useState<Dialogo | null>(null)

  const fechar = () => setDialogo(null)
  const salvo = () => {
    fechar()
    profissionais.recarregar()
  }

  return (
    <>
      <TituloPagina
        titulo="Profissionais"
        descricao="Quem avalia as crianças. Cada aluno fica com um profissional, e só o admin cria o acesso deles."
        acao={
          <Button variant="contained" startIcon={<AddRounded />} onClick={() => setDialogo({ tipo: 'profissional' })}>
            Novo profissional
          </Button>
        }
      />

      {profissionais.carregando && <Carregando />}
      {profissionais.erro && <Alert severity="error">{profissionais.erro}</Alert>}
      {profissionais.dados && profissionais.dados.length === 0 && <EstadoVazio titulo="Nenhum profissional cadastrado." />}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
        {(profissionais.dados ?? []).map((p) => (
          <LinhaPessoa
            key={p.id}
            cor={menta}
            nome={p.nmPessoa}
            detalhe={`CPF ${formatarCpf(p.cpf)}${p.email ? ` · ${p.email}` : ''}`}
            possuiAcesso={p.possuiAcesso}
            acoes={
              <>
                {p.usuarioId !== null ? (
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<KeyRounded />}
                    onClick={() => p.usuarioId !== null && setDialogo({ tipo: 'gerenciar', profissional: p, usuarioId: p.usuarioId })}
                  >
                    Acesso
                  </Button>
                ) : (
                  <Button size="small" variant="outlined" startIcon={<KeyRounded />} onClick={() => setDialogo({ tipo: 'acesso', profissional: p })}>
                    Criar acesso
                  </Button>
                )}
                <BotaoIcone rotulo={`Editar ${p.nmPessoa}`} cor={lilas} onClick={() => setDialogo({ tipo: 'profissional', profissional: p })}>
                  <EditRounded fontSize="small" />
                </BotaoIcone>
              </>
            }
          />
        ))}
      </Box>

      {dialogo?.tipo === 'profissional' && (
        <ProfissionalDialog profissional={dialogo.profissional} onFechar={fechar} onSalvo={salvo} />
      )}
      {dialogo?.tipo === 'acesso' && (
        <AcessoDialog
          pessoaId={dialogo.profissional.id}
          nome={dialogo.profissional.nmPessoa}
          emailSugerido={dialogo.profissional.email}
          onFechar={fechar}
          onSalvo={salvo}
        />
      )}
      {dialogo?.tipo === 'gerenciar' && (
        <GerenciarAcessoDialog usuarioId={dialogo.usuarioId} nome={dialogo.profissional.nmPessoa} onFechar={fechar} onSalvo={salvo} />
      )}
    </>
  )
}

export default Profissionais
