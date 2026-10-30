import { Alert, Box, Card, CardActionArea, Typography } from '@mui/material'
import ChevronRightRounded from '@mui/icons-material/ChevronRightRounded'
import { Link as RouterLink } from 'react-router'
import Carregando from '../../components/Carregando.tsx'
import Emblema from '../../components/Emblema.tsx'
import EstadoVazio from '../../components/EstadoVazio.tsx'
import Etiqueta from '../../components/Etiqueta.tsx'
import TituloPagina from '../../components/TituloPagina.tsx'
import { useDados } from '../../hooks/useDados.ts'
import { alunoService } from '../../services/alunoService.ts'
import { amarelo, corDaPosicao } from '../../utils/cores.ts'
import { idadeHoje } from '../../utils/datas.ts'
import { iniciais } from '../../utils/documentos.ts'
import { contar } from '../../utils/formatos.ts'
import { corSexo, rotuloSexo } from '../../utils/rotulos.ts'

// Início do responsável: as crianças ligadas a ele (o backend só devolve essas).
function Familia() {
  const alunos = useDados(() => alunoService.listar(), [])

  return (
    <>
      <TituloPagina titulo="Minhas crianças" descricao="Toque numa criança para ver a evolução e as avaliações." />

      {alunos.carregando && <Carregando />}
      {alunos.erro && <Alert severity="error">{alunos.erro}</Alert>}
      {alunos.dados && alunos.dados.length === 0 && (
        <EstadoVazio titulo="Nenhuma criança ligada a você ainda." texto="Fale com o profissional da academia." />
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {(alunos.dados ?? []).map((aluno) => (
          <Card key={aluno.id}>
            <CardActionArea
              component={RouterLink}
              to={`/familia/${aluno.id}`}
              sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 1.75 }}
            >
              <Emblema cor={corDaPosicao(aluno.id)} tamanho={56}>
                {iniciais(aluno.nmPessoa)}
              </Emblema>
              <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0.5 }}>
                <Typography variant="h3" component="h2">
                  {aluno.nmPessoa}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  <Etiqueta cor={amarelo} texto={contar(idadeHoje(aluno.dtNascimento), 'ano', 'anos')} />
                  <Etiqueta cor={corSexo[aluno.sexo]} texto={rotuloSexo[aluno.sexo]} />
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

export default Familia
