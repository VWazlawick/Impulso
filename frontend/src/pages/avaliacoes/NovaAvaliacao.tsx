import { useState } from 'react'
import { Alert, Box, Button, Card, CardActionArea, TextField, Typography } from '@mui/material'
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded'
import PlayArrowRounded from '@mui/icons-material/PlayArrowRounded'
import { useNavigate, useSearchParams } from 'react-router'
import CampoBusca from '../../components/CampoBusca.tsx'
import Carregando from '../../components/Carregando.tsx'
import Emblema from '../../components/Emblema.tsx'
import Etiqueta from '../../components/Etiqueta.tsx'
import TituloPagina from '../../components/TituloPagina.tsx'
import { useDados } from '../../hooks/useDados.ts'
import { alunoService } from '../../services/alunoService.ts'
import { avaliacaoService } from '../../services/avaliacaoService.ts'
import { mensagemDeErro } from '../../services/erros.ts'
import { amarelo, corDaPosicao, lilas, neutro } from '../../utils/cores.ts'
import { formatarData, hojeIso, idadeEm, idadeHoje } from '../../utils/datas.ts'
import { iniciais } from '../../utils/documentos.ts'
import { contar } from '../../utils/formatos.ts'
import FormularioAvaliacao, { type DadosAvaliacao } from './FormularioAvaliacao.tsx'

type Inicio = {
  alunoId: number
  data: string
}

// Tela própria para avaliar: escolhe a criança e a data, inicia, preenche a ficha e salva.
// Vindo da página do aluno (?aluno=id), a criança já chega escolhida.
function NovaAvaliacao() {
  const navigate = useNavigate()
  const [parametros] = useSearchParams()
  const hoje = hojeIso()
  const [alunoId, setAlunoId] = useState<number | null>(() => Number(parametros.get('aluno')) || null)
  const [data, setData] = useState(hoje)
  const [busca, setBusca] = useState('')
  const [inicio, setInicio] = useState<Inicio | null>(null)
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)

  // Só alunos ativos: inativo não recebe avaliação nova.
  const alunos = useDados(() => alunoService.listar(), [])
  const ficha = useDados(
    async () => (inicio ? avaliacaoService.ficha(inicio.alunoId, inicio.data) : null),
    [inicio?.alunoId ?? null, inicio?.data ?? null],
  )

  const escolhido = (alunos.dados ?? []).find((a) => a.id === alunoId) ?? null
  const termo = busca.trim().toLowerCase()
  const lista = (alunos.dados ?? []).filter((a) => a.nmPessoa.toLowerCase().includes(termo))
  const dataValida = /^\d{4}-\d{2}-\d{2}$/.test(data) && data <= hoje
  const idadeNaData = escolhido && dataValida ? idadeEm(escolhido.dtNascimento, data) : null

  async function salvar(dados: DadosAvaliacao) {
    if (!inicio) {
      return
    }
    setSalvando(true)
    setErro('')
    try {
      const nova = await avaliacaoService.registrar(inicio.alunoId, { dtAvaliacao: inicio.data, ...dados })
      navigate(`/alunos/${inicio.alunoId}/avaliacoes/${nova.id}`)
    } catch (e) {
      setErro(mensagemDeErro(e))
      setSalvando(false)
    }
  }

  if (inicio) {
    const nome = ficha.dados?.nmAluno ?? escolhido?.nmPessoa ?? ''
    return (
      <>
        <TituloPagina
          titulo="Nova avaliação"
          descricao="Preencha o que foi medido e testado. Pergunta em branco não é enviada."
        />
        <Card sx={{ p: 2, mb: 2, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5 }}>
          <Emblema cor={corDaPosicao(inicio.alunoId)} tamanho={48}>
            {iniciais(nome)}
          </Emblema>
          <Box sx={{ flex: '1 1 220px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0.5 }}>
            <Typography variant="h3" component="h2">
              {nome}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              <Etiqueta cor={neutro} texto={formatarData(inicio.data)} />
              {ficha.dados && <Etiqueta cor={amarelo} texto={`${contar(ficha.dados.nrIdade, 'ano', 'anos')} nesta data`} />}
              {ficha.dados && <Etiqueta cor={lilas} texto={`Ficha do ${ficha.dados.grupo.nmGrupo}`} />}
            </Box>
          </Box>
          <Button variant="outlined" onClick={() => setInicio(null)}>
            Trocar criança ou data
          </Button>
        </Card>

        {ficha.carregando && <Carregando />}
        {ficha.erro && <Alert severity="error">{ficha.erro}</Alert>}
        {ficha.dados && (
          <FormularioAvaliacao
            grupo={ficha.dados.grupo}
            medidas={ficha.dados}
            erro={erro}
            salvando={salvando}
            voltar={`/alunos/${inicio.alunoId}?aba=avaliacoes`}
            onSalvar={salvar}
          />
        )}
      </>
    )
  }

  return (
    <>
      <TituloPagina
        titulo="Nova avaliação"
        descricao="Escolha a criança e a data. A idade nesse dia escolhe a ficha do grupo."
      />

      <Card sx={{ p: 2.25, mb: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant="h2">1. Quem vai ser avaliado?</Typography>
        <CampoBusca rotulo="Buscar pelo nome" valor={busca} onMudar={setBusca} />
        {alunos.carregando && <Carregando />}
        {alunos.erro && <Alert severity="error">{alunos.erro}</Alert>}
        {alunos.dados && lista.length === 0 && (
          <Typography sx={{ color: 'text.secondary' }}>Nenhum aluno ativo com esse nome.</Typography>
        )}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 1.25,
            maxHeight: 360,
            overflowY: 'auto',
            p: 0.5,
          }}
        >
          {lista.map((aluno) => {
            const marcado = aluno.id === alunoId
            return (
              <Card
                key={aluno.id}
                sx={{
                  bgcolor: marcado ? 'primary.light' : 'background.paper',
                  outline: marcado ? '2px solid' : 'none',
                  outlineColor: 'primary.main',
                }}
              >
                <CardActionArea
                  onClick={() => setAlunoId(aluno.id)}
                  aria-pressed={marcado}
                  sx={{ p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 1.25 }}
                >
                  <Emblema cor={corDaPosicao(aluno.id)} tamanho={40}>
                    {iniciais(aluno.nmPessoa)}
                  </Emblema>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 700 }}>{aluno.nmPessoa}</Typography>
                    <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
                      {contar(idadeHoje(aluno.dtNascimento), 'ano', 'anos')}
                    </Typography>
                  </Box>
                  {marcado && <CheckCircleRounded sx={{ color: 'primary.main' }} />}
                </CardActionArea>
              </Card>
            )
          })}
        </Box>
        <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
          Alunos inativos não aparecem aqui: reative o cadastro para avaliar.
        </Typography>
      </Card>

      <Card sx={{ p: 2.25, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2 }}>
        <Typography variant="h2" sx={{ flexBasis: '100%' }}>
          2. Quando?
        </Typography>
        <TextField
          label="Data da avaliação"
          type="date"
          value={data}
          onChange={(e) => setData(e.target.value)}
          fullWidth={false}
          sx={{ width: 210 }}
          slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: hoje } }}
        />
        {escolhido && idadeNaData !== null && idadeNaData >= 0 && (
          <Typography sx={{ flex: '1 1 220px', color: 'text.secondary' }}>
            Idade de {escolhido.nmPessoa} nesta data: {contar(idadeNaData, 'ano', 'anos')}.
          </Typography>
        )}
        <Button
          variant="contained"
          size="large"
          startIcon={<PlayArrowRounded />}
          disabled={!escolhido || !dataValida}
          onClick={() => escolhido && setInicio({ alunoId: escolhido.id, data })}
          sx={{ ml: 'auto' }}
        >
          Iniciar avaliação
        </Button>
      </Card>
    </>
  )
}

export default NovaAvaliacao
