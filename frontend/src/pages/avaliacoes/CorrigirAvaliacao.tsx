import { useState } from 'react'
import { Alert, Breadcrumbs, Card, Link, TextField, Typography } from '@mui/material'
import { Link as RouterLink, useNavigate, useParams } from 'react-router'
import Carregando from '../../components/Carregando.tsx'
import TituloPagina from '../../components/TituloPagina.tsx'
import { useDados } from '../../hooks/useDados.ts'
import { avaliacaoService } from '../../services/avaliacaoService.ts'
import { mensagemDeErro } from '../../services/erros.ts'
import { grupoService } from '../../services/grupoService.ts'
import { formatarData, hojeIso } from '../../utils/datas.ts'
import FormularioAvaliacao, { type DadosAvaliacao } from './FormularioAvaliacao.tsx'

// Correção de uma avaliação: mesma ficha, com as respostas e as medidas já preenchidas.
function CorrigirAvaliacao() {
  const params = useParams()
  const alunoId = Number(params.id)
  const avaliacaoId = Number(params.avaliacaoId)
  const navigate = useNavigate()
  const [data, setData] = useState<string | null>(null)
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)

  const avaliacao = useDados(() => avaliacaoService.buscarPorId(alunoId, avaliacaoId), [alunoId, avaliacaoId])
  const grupoId = avaliacao.dados ? avaliacao.dados.grupoId : null
  const grupo = useDados(async () => (grupoId === null ? null : grupoService.buscarPorId(grupoId)), [grupoId])
  const detalhe = `/alunos/${alunoId}/avaliacoes/${avaliacaoId}`

  if (avaliacao.carregando || (avaliacao.dados && grupo.carregando)) {
    return <Carregando />
  }
  if (!avaliacao.dados) {
    return <Alert severity="error">{avaliacao.erro}</Alert>
  }
  if (!grupo.dados) {
    return <Alert severity="error">{grupo.erro || 'Não foi possível abrir a ficha desta avaliação.'}</Alert>
  }

  const atual = avaliacao.dados
  const dataEscolhida = data ?? atual.dtAvaliacao

  async function salvar(dados: DadosAvaliacao) {
    setSalvando(true)
    setErro('')
    try {
      await avaliacaoService.atualizar(alunoId, avaliacaoId, { dtAvaliacao: dataEscolhida, ...dados })
      navigate(detalhe)
    } catch (e) {
      setErro(mensagemDeErro(e))
      setSalvando(false)
    }
  }

  return (
    <>
      <Breadcrumbs sx={{ mb: 2, fontWeight: 600 }}>
        <Link component={RouterLink} to="/alunos" underline="hover">
          Alunos
        </Link>
        <Link component={RouterLink} to={`/alunos/${alunoId}?aba=avaliacoes`} underline="hover">
          {atual.nmAluno}
        </Link>
        <Link component={RouterLink} to={detalhe} underline="hover">
          Avaliação de {formatarData(atual.dtAvaliacao)}
        </Link>
        <Typography sx={{ fontWeight: 600, color: 'text.secondary' }}>Corrigir</Typography>
      </Breadcrumbs>

      <TituloPagina
        titulo="Corrigir avaliação"
        descricao={`${atual.nmAluno} · ficha do ${atual.nmGrupo}. Os resultados são calculados de novo ao salvar.`}
      />

      <Card sx={{ p: 2.25, mb: 2, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5 }}>
        <TextField
          label="Data da avaliação"
          type="date"
          value={dataEscolhida}
          onChange={(e) => setData(e.target.value)}
          fullWidth={false}
          sx={{ width: 210 }}
          slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: hojeIso() } }}
        />
        <Typography sx={{ flex: '1 1 220px', fontSize: 14, color: 'text.secondary' }}>
          A data pode mudar, desde que a idade continue dentro da faixa do {atual.nmGrupo}.
        </Typography>
      </Card>

      <FormularioAvaliacao
        grupo={grupo.dados}
        medidas={atual.medidas}
        sessao={{ dsLocal: atual.dsLocal, nrDuracao: atual.nrDuracao }}
        respostas={atual.respostas}
        erro={erro}
        salvando={salvando}
        voltar={detalhe}
        onSalvar={salvar}
      />
    </>
  )
}

export default CorrigirAvaliacao
