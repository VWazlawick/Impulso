import { Alert, Box, Breadcrumbs, Button, Card, Link, Tab, Tabs, Typography } from '@mui/material'
import { Link as RouterLink, useParams, useSearchParams } from 'react-router'
import Carregando from '../../components/Carregando.tsx'
import Emblema from '../../components/Emblema.tsx'
import Etiqueta from '../../components/Etiqueta.tsx'
import InfoItem from '../../components/InfoItem.tsx'
import { useDados } from '../../hooks/useDados.ts'
import { alunoService } from '../../services/alunoService.ts'
import { amarelo, corDaPosicao } from '../../utils/cores.ts'
import { idadeHoje } from '../../utils/datas.ts'
import { iniciais } from '../../utils/documentos.ts'
import { contar, formatarNumero } from '../../utils/formatos.ts'
import { corSexo, rotuloSexo } from '../../utils/rotulos.ts'
import ListaAvaliacoes from '../avaliacoes/ListaAvaliacoes.tsx'
import PainelEvolucao from '../evolucao/PainelEvolucao.tsx'

type Aba = 'evolucao' | 'avaliacoes'

// A criança vista pelo responsável: só leitura, pensada primeiro para o celular.
function FamiliaAluno() {
  const id = Number(useParams().id)
  const [parametros, setParametros] = useSearchParams()
  const aluno = useDados(() => alunoService.buscarPorId(id), [id])
  const aba: Aba = parametros.get('aba') === 'avaliacoes' ? 'avaliacoes' : 'evolucao'

  if (aluno.carregando) {
    return <Carregando />
  }
  if (!aluno.dados) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
        <Alert severity="error">{aluno.erro}</Alert>
        <Button component={RouterLink} to="/familia" variant="outlined">
          Voltar
        </Button>
      </Box>
    )
  }

  const atual = aluno.dados

  return (
    <>
      <Breadcrumbs sx={{ mb: 2, fontWeight: 600 }}>
        <Link component={RouterLink} to="/familia" underline="hover">
          Minhas crianças
        </Link>
        <Typography sx={{ fontWeight: 600, color: 'text.secondary' }}>{atual.nmPessoa}</Typography>
      </Breadcrumbs>

      <Card sx={{ p: 2.25, mb: 2, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.75 }}>
        <Emblema cor={corDaPosicao(atual.id)} tamanho={56}>
          {iniciais(atual.nmPessoa)}
        </Emblema>
        <Box sx={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0.75 }}>
          <Typography variant="h1">{atual.nmPessoa}</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            <Etiqueta cor={amarelo} texto={contar(idadeHoje(atual.dtNascimento), 'ano', 'anos')} />
            <Etiqueta cor={corSexo[atual.sexo]} texto={rotuloSexo[atual.sexo]} />
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 3 }}>
          <InfoItem rotulo="Peso" valor={atual.vlPeso === null ? '—' : `${formatarNumero(atual.vlPeso)} kg`} />
          <InfoItem rotulo="Estatura" valor={atual.vlEstatura === null ? '—' : `${formatarNumero(atual.vlEstatura)} cm`} />
        </Box>
      </Card>

      <Tabs
        value={aba}
        onChange={(_, valor: Aba) => setParametros({ aba: valor }, { replace: true })}
        variant="fullWidth"
        sx={{ mb: 2 }}
      >
        <Tab value="evolucao" label="Evolução" sx={{ textTransform: 'none', fontWeight: 700, fontSize: 15 }} />
        <Tab value="avaliacoes" label="Avaliações" sx={{ textTransform: 'none', fontWeight: 700, fontSize: 15 }} />
      </Tabs>

      {aba === 'evolucao' && <PainelEvolucao alunoId={atual.id} />}
      {aba === 'avaliacoes' && <ListaAvaliacoes alunoId={atual.id} base={`/familia/${atual.id}/avaliacoes`} />}
    </>
  )
}

export default FamiliaAluno
