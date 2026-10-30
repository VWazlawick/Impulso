import { Alert, Box, Button, Card, CardActionArea, Typography } from '@mui/material'
import AddRounded from '@mui/icons-material/AddRounded'
import ChevronRightRounded from '@mui/icons-material/ChevronRightRounded'
import EventRounded from '@mui/icons-material/EventRounded'
import { Link as RouterLink } from 'react-router'
import Carregando from '../../components/Carregando.tsx'
import Emblema from '../../components/Emblema.tsx'
import EstadoVazio from '../../components/EstadoVazio.tsx'
import Etiqueta from '../../components/Etiqueta.tsx'
import { useDados } from '../../hooks/useDados.ts'
import { avaliacaoService } from '../../services/avaliacaoService.ts'
import { amarelo, lavanda, neutro } from '../../utils/cores.ts'
import { formatarData } from '../../utils/datas.ts'
import { contar } from '../../utils/formatos.ts'

type Props = {
  alunoId: number
  base: string
  podeCriar?: boolean
  ativo?: boolean
}

// Avaliações da criança, da mais nova para a mais antiga. "base" é o começo do link de cada uma.
function ListaAvaliacoes({ alunoId, base, podeCriar = false, ativo = true }: Props) {
  const avaliacoes = useDados(() => avaliacaoService.listar(alunoId), [alunoId])

  return (
    <>
      {podeCriar && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <Button
            variant="contained"
            startIcon={<AddRounded />}
            component={RouterLink}
            to={`${base}/nova`}
            disabled={!ativo}
          >
            Nova avaliação
          </Button>
          {!ativo && (
            <Typography sx={{ fontSize: 14, color: 'text.secondary' }}>Reative o aluno para avaliar de novo.</Typography>
          )}
        </Box>
      )}

      {avaliacoes.carregando && <Carregando />}
      {avaliacoes.erro && <Alert severity="error">{avaliacoes.erro}</Alert>}
      {avaliacoes.dados && avaliacoes.dados.length === 0 && (
        <EstadoVazio titulo="Nenhuma avaliação ainda." texto="Quando houver, elas aparecem aqui, da mais nova para a mais antiga." />
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
        {(avaliacoes.dados ?? []).map((avaliacao) => (
          <Card key={avaliacao.id}>
            <CardActionArea
              component={RouterLink}
              to={`${base}/${avaliacao.id}`}
              sx={{ p: 1.75, display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 1.5 }}
            >
              <Emblema cor={lavanda} tamanho={44}>
                <EventRounded />
              </Emblema>
              <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'flex-start' }}>
                <Typography sx={{ fontWeight: 700 }}>Avaliação de {formatarData(avaliacao.dtAvaliacao)}</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  <Etiqueta cor={amarelo} texto={contar(avaliacao.nrIdade, 'ano', 'anos')} />
                  <Etiqueta cor={neutro} texto={avaliacao.nmGrupo} />
                </Box>
              </Box>
              <ChevronRightRounded sx={{ color: 'text.secondary' }} />
            </CardActionArea>
          </Card>
        ))}
      </Box>
    </>
  )
}

export default ListaAvaliacoes
