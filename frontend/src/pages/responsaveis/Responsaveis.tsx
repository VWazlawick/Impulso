import { useState } from 'react'
import { Alert, Box, Button, Card } from '@mui/material'
import EditRounded from '@mui/icons-material/EditRounded'
import KeyRounded from '@mui/icons-material/KeyRounded'
import AcessoDialog from '../../components/AcessoDialog.tsx'
import BotaoIcone from '../../components/BotaoIcone.tsx'
import CampoBusca from '../../components/CampoBusca.tsx'
import Carregando from '../../components/Carregando.tsx'
import EstadoVazio from '../../components/EstadoVazio.tsx'
import GerenciarAcessoDialog from '../../components/GerenciarAcessoDialog.tsx'
import LinhaPessoa from '../../components/LinhaPessoa.tsx'
import ResponsavelDialog from '../../components/ResponsavelDialog.tsx'
import TituloPagina from '../../components/TituloPagina.tsx'
import { useDados } from '../../hooks/useDados.ts'
import { responsavelService } from '../../services/responsavelService.ts'
import { useSessao } from '../../sessao/useSessao.ts'
import type { ResponsavelResponse } from '../../types/responsavel.ts'
import { lilas, rosa } from '../../utils/cores.ts'
import { formatarTelefone } from '../../utils/documentos.ts'

type Dialogo =
  | { tipo: 'editar'; responsavel: ResponsavelResponse }
  | { tipo: 'acesso'; responsavel: ResponsavelResponse }
  | { tipo: 'gerenciar'; responsavel: ResponsavelResponse; usuarioId: number }

// Todos os responsáveis que a pessoa logada pode ver. Novos nascem na página do aluno.
// Mexer num acesso que já existe (e-mail, senha, bloqueio) é só do admin.
function Responsaveis() {
  const { sessao } = useSessao()
  const admin = sessao?.tipo === 'ADMIN'
  const responsaveis = useDados(() => responsavelService.listar(), [])
  const [busca, setBusca] = useState('')
  const [dialogo, setDialogo] = useState<Dialogo | null>(null)

  const termo = busca.trim().toLowerCase()
  const lista = (responsaveis.dados ?? []).filter((r) => r.nmPessoa.toLowerCase().includes(termo))
  const fechar = () => setDialogo(null)
  const salvo = () => {
    fechar()
    responsaveis.recarregar()
  }

  return (
    <>
      <TituloPagina
        titulo="Responsáveis"
        descricao="Pais, mães e outras pessoas que acompanham as crianças. Para cadastrar um novo, abra a página do aluno."
      />

      <Card sx={{ p: 2, mb: 2 }}>
        <CampoBusca rotulo="Buscar pelo nome" valor={busca} onMudar={setBusca} />
      </Card>

      {responsaveis.carregando && <Carregando />}
      {responsaveis.erro && <Alert severity="error">{responsaveis.erro}</Alert>}
      {responsaveis.dados && lista.length === 0 && (
        <EstadoVazio
          titulo={termo ? 'Ninguém com esse nome.' : 'Nenhum responsável ainda.'}
          texto={termo ? 'Confira a grafia ou limpe a busca.' : 'Eles aparecem aqui depois de cadastrados na página do aluno.'}
        />
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
        {lista.map((r) => (
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
              </>
            }
          />
        ))}
      </Box>

      {dialogo?.tipo === 'editar' && (
        <ResponsavelDialog
          responsavel={dialogo.responsavel}
          onSalvar={(request) => responsavelService.atualizar(dialogo.responsavel.id, request)}
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
    </>
  )
}

export default Responsaveis
