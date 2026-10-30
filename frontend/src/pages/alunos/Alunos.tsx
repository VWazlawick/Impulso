import { useState } from 'react'
import { Alert, Box, Button, Card, CardActionArea, FormControlLabel, Switch, Typography } from '@mui/material'
import AddRounded from '@mui/icons-material/AddRounded'
import { Link as RouterLink } from 'react-router'
import CampoBusca from '../../components/CampoBusca.tsx'
import Carregando from '../../components/Carregando.tsx'
import Emblema from '../../components/Emblema.tsx'
import EstadoVazio from '../../components/EstadoVazio.tsx'
import Etiqueta from '../../components/Etiqueta.tsx'
import TituloPagina from '../../components/TituloPagina.tsx'
import { useDados } from '../../hooks/useDados.ts'
import { alunoService } from '../../services/alunoService.ts'
import { profissionalService } from '../../services/profissionalService.ts'
import { useSessao } from '../../sessao/useSessao.ts'
import { amarelo, corDaPosicao, neutro } from '../../utils/cores.ts'
import { idadeHoje } from '../../utils/datas.ts'
import { iniciais } from '../../utils/documentos.ts'
import { contar } from '../../utils/formatos.ts'
import { corSexo, rotuloSexo } from '../../utils/rotulos.ts'

// Lista de alunos: o admin vê todos; o profissional, só os dele (o backend decide).
function Alunos() {
  const { sessao } = useSessao()
  const admin = sessao?.tipo === 'ADMIN'
  const [inativos, setInativos] = useState(false)
  const [busca, setBusca] = useState('')

  const alunos = useDados(() => alunoService.listar(inativos), [inativos])
  const profissionais = useDados(async () => (admin ? profissionalService.listar() : []), [admin])

  const termo = busca.trim().toLowerCase()
  const lista = (alunos.dados ?? []).filter((a) => a.nmPessoa.toLowerCase().includes(termo))
  const nomeDoProfissional = (id: number) => profissionais.dados?.find((p) => p.id === id)?.nmPessoa ?? '…'

  return (
    <>
      <TituloPagina
        titulo={admin ? 'Alunos' : 'Meus alunos'}
        descricao="Abra um aluno para ver os dados, as avaliações e a evolução."
        acao={
          <Button variant="contained" startIcon={<AddRounded />} component={RouterLink} to="/alunos/novo">
            Novo aluno
          </Button>
        }
      />

      <Card sx={{ p: 2, mb: 2, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2 }}>
        <Box sx={{ flex: '1 1 260px' }}>
          <CampoBusca rotulo="Buscar pelo nome" valor={busca} onMudar={setBusca} />
        </Box>
        <FormControlLabel
          control={<Switch checked={inativos} onChange={(e) => setInativos(e.target.checked)} />}
          label="Mostrar inativos"
        />
      </Card>

      {alunos.carregando && <Carregando />}
      {alunos.erro && <Alert severity="error">{alunos.erro}</Alert>}
      {alunos.dados && lista.length === 0 && (
        <EstadoVazio
          titulo={termo ? 'Nenhum aluno com esse nome.' : 'Nenhum aluno por aqui ainda.'}
          texto={termo ? 'Confira a grafia ou limpe a busca.' : 'Use "Novo aluno" para cadastrar o primeiro.'}
        />
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: 2 }}>
        {lista.map((aluno) => (
          <Card key={aluno.id} sx={{ opacity: aluno.stAtivo ? 1 : 0.8 }}>
            <CardActionArea
              component={RouterLink}
              to={`/alunos/${aluno.id}`}
              sx={{ p: 2, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 1.5 }}
            >
              <Emblema cor={corDaPosicao(aluno.id)} tamanho={48}>
                {iniciais(aluno.nmPessoa)}
              </Emblema>
              <Box sx={{ minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0.5 }}>
                <Typography variant="h3" component="h2" sx={{ fontSize: 18 }}>
                  {aluno.nmPessoa}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  <Etiqueta cor={amarelo} texto={contar(idadeHoje(aluno.dtNascimento), 'ano', 'anos')} />
                  <Etiqueta cor={corSexo[aluno.sexo]} texto={rotuloSexo[aluno.sexo]} />
                  {!aluno.stAtivo && <Etiqueta cor={neutro} texto="Inativo" />}
                </Box>
                {admin && (
                  <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
                    Profissional: {nomeDoProfissional(aluno.profissionalId)}
                  </Typography>
                )}
              </Box>
            </CardActionArea>
          </Card>
        ))}
      </Box>
    </>
  )
}

export default Alunos
