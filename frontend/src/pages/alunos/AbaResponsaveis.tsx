import { useState } from 'react'
import { Alert, Box, Button } from '@mui/material'
import EditRounded from '@mui/icons-material/EditRounded'
import KeyRounded from '@mui/icons-material/KeyRounded'
import LinkOffRounded from '@mui/icons-material/LinkOffRounded'
import LinkRounded from '@mui/icons-material/LinkRounded'
import PersonAddRounded from '@mui/icons-material/PersonAddRounded'
import AcessoDialog from '../../components/AcessoDialog.tsx'
import BotaoIcone from '../../components/BotaoIcone.tsx'
import Carregando from '../../components/Carregando.tsx'
import DialogoConfirmar from '../../components/DialogoConfirmar.tsx'
import EstadoVazio from '../../components/EstadoVazio.tsx'
import GerenciarAcessoDialog from '../../components/GerenciarAcessoDialog.tsx'
import LinhaPessoa from '../../components/LinhaPessoa.tsx'
import ResponsavelDialog from '../../components/ResponsavelDialog.tsx'
import { useDados } from '../../hooks/useDados.ts'
import { alunoService } from '../../services/alunoService.ts'
import { responsavelService } from '../../services/responsavelService.ts'
import { useSessao } from '../../sessao/useSessao.ts'
import type { ResponsavelResponse } from '../../types/responsavel.ts'
import { lilas, perigo, rosa } from '../../utils/cores.ts'
import { formatarTelefone } from '../../utils/documentos.ts'
import VincularResponsavelDialog from './VincularResponsavelDialog.tsx'

type Dialogo =
  | { tipo: 'novo' }
  | { tipo: 'vincular' }
  | { tipo: 'editar'; responsavel: ResponsavelResponse }
  | { tipo: 'acesso'; responsavel: ResponsavelResponse }
  | { tipo: 'desvincular'; responsavel: ResponsavelResponse }
  | { tipo: 'gerenciar'; responsavel: ResponsavelResponse; usuarioId: number }

type Props = {
  alunoId: number
  nomeAluno: string
}

// Quem acompanha a criança. Com acesso, o responsável vê as avaliações e a evolução.
function AbaResponsaveis({ alunoId, nomeAluno }: Props) {
  const { sessao } = useSessao()
  const admin = sessao?.tipo === 'ADMIN'
  const responsaveis = useDados(() => alunoService.listarResponsaveis(alunoId), [alunoId])
  const [dialogo, setDialogo] = useState<Dialogo | null>(null)

  const fechar = () => setDialogo(null)
  const salvo = () => {
    fechar()
    responsaveis.recarregar()
  }

  return (
    <>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
        <Button variant="contained" startIcon={<PersonAddRounded />} onClick={() => setDialogo({ tipo: 'novo' })}>
          Novo responsável
        </Button>
        <Button variant="outlined" startIcon={<LinkRounded />} onClick={() => setDialogo({ tipo: 'vincular' })}>
          Vincular existente
        </Button>
      </Box>

      {responsaveis.carregando && <Carregando />}
      {responsaveis.erro && <Alert severity="error">{responsaveis.erro}</Alert>}
      {responsaveis.dados && responsaveis.dados.length === 0 && (
        <EstadoVazio
          titulo="Nenhum responsável ainda."
          texto="Cadastre quem acompanha a criança. Com acesso, essa pessoa vê as avaliações e a evolução."
        />
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
        {(responsaveis.dados ?? []).map((r) => (
          <LinhaPessoa
            key={r.id}
            cor={rosa}
            nome={r.nmPessoa}
            detalhe={formatarTelefone(r.nrTelefone)}
            possuiAcesso={r.possuiAcesso}
            acoes={
              <>
                {!r.possuiAcesso && (
                  <Button size="small" variant="outlined" startIcon={<KeyRounded />} onClick={() => setDialogo({ tipo: 'acesso', responsavel: r })}>
                    Criar acesso
                  </Button>
                )}
                {admin && r.usuarioId !== null && (
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<KeyRounded />}
                    onClick={() => r.usuarioId !== null && setDialogo({ tipo: 'gerenciar', responsavel: r, usuarioId: r.usuarioId })}
                  >
                    Acesso
                  </Button>
                )}
                <BotaoIcone rotulo={`Editar ${r.nmPessoa}`} cor={lilas} onClick={() => setDialogo({ tipo: 'editar', responsavel: r })}>
                  <EditRounded fontSize="small" />
                </BotaoIcone>
                <BotaoIcone
                  rotulo={`Desvincular ${r.nmPessoa}`}
                  cor={perigo}
                  onClick={() => setDialogo({ tipo: 'desvincular', responsavel: r })}
                >
                  <LinkOffRounded fontSize="small" />
                </BotaoIcone>
              </>
            }
          />
        ))}
      </Box>

      {dialogo?.tipo === 'novo' && (
        <ResponsavelDialog
          subtitulo={`Responsável por ${nomeAluno}`}
          onSalvar={(request) => alunoService.cadastrarResponsavel(alunoId, request)}
          onFechar={fechar}
          onSalvo={salvo}
        />
      )}
      {dialogo?.tipo === 'editar' && (
        <ResponsavelDialog
          responsavel={dialogo.responsavel}
          onSalvar={(request) => responsavelService.atualizar(dialogo.responsavel.id, request)}
          onFechar={fechar}
          onSalvo={salvo}
        />
      )}
      {dialogo?.tipo === 'vincular' && (
        <VincularResponsavelDialog
          alunoId={alunoId}
          vinculados={(responsaveis.dados ?? []).map((r) => r.id)}
          onFechar={fechar}
          onSalvo={salvo}
        />
      )}
      {dialogo?.tipo === 'acesso' && (
        <AcessoDialog pessoaId={dialogo.responsavel.id} nome={dialogo.responsavel.nmPessoa} onFechar={fechar} onSalvo={salvo} />
      )}
      {dialogo?.tipo === 'gerenciar' && (
        <GerenciarAcessoDialog usuarioId={dialogo.usuarioId} nome={dialogo.responsavel.nmPessoa} onFechar={fechar} onSalvo={salvo} />
      )}
      {dialogo?.tipo === 'desvincular' && (
        <DialogoConfirmar
          titulo={`Desvincular ${dialogo.responsavel.nmPessoa}?`}
          texto={`O cadastro dessa pessoa continua; ela só deixa de ser responsável por ${nomeAluno}.`}
          rotuloConfirmar="Desvincular"
          icone={<LinkOffRounded />}
          cor={perigo}
          perigoso
          onFechar={fechar}
          onConfirmar={async () => {
            await alunoService.desvincularResponsavel(alunoId, dialogo.responsavel.id)
            responsaveis.recarregar()
          }}
        />
      )}
    </>
  )
}

export default AbaResponsaveis
