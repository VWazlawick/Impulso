import { useState } from 'react'
import { Alert, Box, Breadcrumbs, Button, Card, Link, Tab, Tabs, Typography } from '@mui/material'
import EditRounded from '@mui/icons-material/EditRounded'
import PauseCircleRounded from '@mui/icons-material/PauseCircleRounded'
import PlayCircleRounded from '@mui/icons-material/PlayCircleRounded'
import SwapHorizRounded from '@mui/icons-material/SwapHorizRounded'
import { Link as RouterLink, useParams, useSearchParams } from 'react-router'
import Carregando from '../../components/Carregando.tsx'
import DialogoConfirmar from '../../components/DialogoConfirmar.tsx'
import Emblema from '../../components/Emblema.tsx'
import Etiqueta from '../../components/Etiqueta.tsx'
import InfoItem from '../../components/InfoItem.tsx'
import { useDados } from '../../hooks/useDados.ts'
import { alunoService } from '../../services/alunoService.ts'
import { profissionalService } from '../../services/profissionalService.ts'
import { useSessao } from '../../sessao/useSessao.ts'
import type { AlunoResponse } from '../../types/aluno.ts'
import { amarelo, corDaPosicao, menta, neutro, perigo } from '../../utils/cores.ts'
import { formatarData, idadeHoje } from '../../utils/datas.ts'
import { formatarCpf, iniciais } from '../../utils/documentos.ts'
import { contar, formatarNumero } from '../../utils/formatos.ts'
import { corSexo, rotuloServico, rotuloSexo } from '../../utils/rotulos.ts'
import ListaAvaliacoes from '../avaliacoes/ListaAvaliacoes.tsx'
import PainelEvolucao from '../evolucao/PainelEvolucao.tsx'
import AbaEnderecos from './AbaEnderecos.tsx'
import AbaResponsaveis from './AbaResponsaveis.tsx'
import TransferirDialog from './TransferirDialog.tsx'

const abas = ['dados', 'responsaveis', 'enderecos', 'avaliacoes', 'evolucao'] as const
type Aba = (typeof abas)[number]

const rotuloAba: Record<Aba, string> = {
  dados: 'Dados',
  responsaveis: 'Responsáveis',
  enderecos: 'Endereços',
  avaliacoes: 'Avaliações',
  evolucao: 'Evolução',
}

function medida(valor: number | null, unidade: string) {
  return valor === null ? '—' : `${formatarNumero(valor)} ${unidade}`
}

function AbaDados({ aluno, nomeProfissional }: { aluno: AlunoResponse; nomeProfissional?: string }) {
  return (
    <Card sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 2.5 }}>
        <InfoItem
          rotulo="Nascimento"
          valor={`${formatarData(aluno.dtNascimento)} (${contar(idadeHoje(aluno.dtNascimento), 'ano', 'anos')})`}
        />
        <InfoItem rotulo="Sexo" valor={rotuloSexo[aluno.sexo]} />
        <InfoItem rotulo="Frequência" valor={rotuloServico[aluno.tpServico]} />
        <InfoItem rotulo="CPF" valor={aluno.cpf ? formatarCpf(aluno.cpf) : '—'} />
        <InfoItem rotulo="E-mail" valor={aluno.email ?? '—'} />
        {nomeProfissional !== undefined && <InfoItem rotulo="Profissional" valor={nomeProfissional} />}
      </Box>
      <Box>
        <Typography variant="h3" component="h2" sx={{ mb: 1.5 }}>
          Medidas mais recentes
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 2.5 }}>
          <InfoItem rotulo="Peso" valor={medida(aluno.vlPeso, 'kg')} />
          <InfoItem rotulo="Estatura" valor={medida(aluno.vlEstatura, 'cm')} />
          <InfoItem rotulo="Cintura" valor={medida(aluno.vlCintura, 'cm')} />
        </Box>
      </Box>
    </Card>
  )
}

// Página do aluno, com uma aba para cada assunto. A aba fica no endereço (?aba=...)
// para o "voltar" das outras telas cair no lugar certo.
function AlunoDetalhe() {
  const id = Number(useParams().id)
  const { sessao } = useSessao()
  const admin = sessao?.tipo === 'ADMIN'
  const [parametros, setParametros] = useSearchParams()
  const [dialogo, setDialogo] = useState<'transferir' | 'status' | null>(null)

  const aluno = useDados(() => alunoService.buscarPorId(id), [id])
  const profissionais = useDados(async () => (admin ? profissionalService.listar() : []), [admin])

  const pedida = parametros.get('aba')
  const abaAtual: Aba = abas.find((aba) => aba === pedida) ?? 'dados'

  if (aluno.carregando) {
    return <Carregando />
  }
  if (!aluno.dados) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
        <Alert severity="error">{aluno.erro}</Alert>
        <Button component={RouterLink} to="/alunos" variant="outlined">
          Voltar para os alunos
        </Button>
      </Box>
    )
  }

  const atual = aluno.dados
  const nomeProfissional = admin
    ? (profissionais.dados?.find((p) => p.id === atual.profissionalId)?.nmPessoa ?? '…')
    : undefined
  const fechar = () => setDialogo(null)

  return (
    <>
      <Breadcrumbs sx={{ mb: 2, fontWeight: 600 }}>
        <Link component={RouterLink} to="/alunos" underline="hover">
          {admin ? 'Alunos' : 'Meus alunos'}
        </Link>
        <Typography sx={{ fontWeight: 600, color: 'text.secondary' }}>{atual.nmPessoa}</Typography>
      </Breadcrumbs>

      <Card sx={{ p: 2.25, mb: 2, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.75 }}>
        <Emblema cor={corDaPosicao(atual.id)} tamanho={56}>
          {iniciais(atual.nmPessoa)}
        </Emblema>
        <Box sx={{ flex: '1 1 220px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0.75 }}>
          <Typography variant="h1">{atual.nmPessoa}</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            <Etiqueta cor={amarelo} texto={contar(idadeHoje(atual.dtNascimento), 'ano', 'anos')} />
            <Etiqueta cor={corSexo[atual.sexo]} texto={rotuloSexo[atual.sexo]} />
            <Etiqueta cor={neutro} texto={rotuloServico[atual.tpServico]} />
            {!atual.stAtivo && <Etiqueta cor={perigo} texto="Inativo" />}
          </Box>
        </Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          <Button variant="outlined" startIcon={<EditRounded />} component={RouterLink} to={`/alunos/${atual.id}/editar`}>
            Editar
          </Button>
          {admin && (
            <Button variant="outlined" startIcon={<SwapHorizRounded />} onClick={() => setDialogo('transferir')}>
              Transferir
            </Button>
          )}
          <Button
            variant="outlined"
            color={atual.stAtivo ? 'error' : 'primary'}
            startIcon={atual.stAtivo ? <PauseCircleRounded /> : <PlayCircleRounded />}
            onClick={() => setDialogo('status')}
          >
            {atual.stAtivo ? 'Inativar' : 'Reativar'}
          </Button>
        </Box>
      </Card>

      {!atual.stAtivo && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Aluno inativo: o histórico continua aqui e dá para corrigir avaliações antigas, mas novas só depois de reativar.
        </Alert>
      )}

      <Tabs
        value={abaAtual}
        onChange={(_, valor: Aba) => setParametros({ aba: valor }, { replace: true })}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 2 }}
      >
        {abas.map((aba) => (
          <Tab key={aba} value={aba} label={rotuloAba[aba]} sx={{ textTransform: 'none', fontWeight: 700, fontSize: 15 }} />
        ))}
      </Tabs>

      {abaAtual === 'dados' && <AbaDados aluno={atual} nomeProfissional={nomeProfissional} />}
      {abaAtual === 'responsaveis' && <AbaResponsaveis alunoId={atual.id} nomeAluno={atual.nmPessoa} />}
      {abaAtual === 'enderecos' && <AbaEnderecos alunoId={atual.id} />}
      {abaAtual === 'avaliacoes' && (
        <ListaAvaliacoes alunoId={atual.id} base={`/alunos/${atual.id}/avaliacoes`} podeCriar ativo={atual.stAtivo} />
      )}
      {abaAtual === 'evolucao' && <PainelEvolucao alunoId={atual.id} />}

      {dialogo === 'transferir' && (
        <TransferirDialog
          aluno={atual}
          profissionais={profissionais.dados ?? []}
          onFechar={fechar}
          onSalvo={() => {
            fechar()
            aluno.recarregar()
          }}
        />
      )}
      {dialogo === 'status' && (
        <DialogoConfirmar
          titulo={atual.stAtivo ? `Inativar ${atual.nmPessoa}?` : `Reativar ${atual.nmPessoa}?`}
          texto={
            atual.stAtivo
              ? 'O aluno sai da lista principal e não recebe avaliações novas. O histórico continua guardado.'
              : 'O aluno volta para a lista e pode ser avaliado de novo.'
          }
          rotuloConfirmar={atual.stAtivo ? 'Inativar' : 'Reativar'}
          icone={atual.stAtivo ? <PauseCircleRounded /> : <PlayCircleRounded />}
          cor={atual.stAtivo ? perigo : menta}
          perigoso={atual.stAtivo}
          onFechar={fechar}
          onConfirmar={async () => {
            if (atual.stAtivo) {
              await alunoService.inativar(atual.id)
            } else {
              await alunoService.ativar(atual.id)
            }
            aluno.recarregar()
          }}
        />
      )}
    </>
  )
}

export default AlunoDetalhe
