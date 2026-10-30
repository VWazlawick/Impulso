import { useState } from 'react'
import { Alert, Breadcrumbs, Button, Card, Link, TextField, Typography } from '@mui/material'
import { Link as RouterLink, useNavigate, useParams } from 'react-router'
import Carregando from '../../components/Carregando.tsx'
import TituloPagina from '../../components/TituloPagina.tsx'
import { useDados } from '../../hooks/useDados.ts'
import { alunoService } from '../../services/alunoService.ts'
import { avaliacaoService } from '../../services/avaliacaoService.ts'
import { mensagemDeErro } from '../../services/erros.ts'
import { hojeIso } from '../../utils/datas.ts'
import { contar } from '../../utils/formatos.ts'
import FormularioAvaliacao, { type DadosAvaliacao } from './FormularioAvaliacao.tsx'

// Nova avaliação: a data escolhe a idade, a idade escolhe o grupo e o grupo traz a ficha.
function NovaAvaliacao() {
  const alunoId = Number(useParams().id)
  const navigate = useNavigate()
  const hoje = hojeIso()
  const [data, setData] = useState(hoje)
  const [dataFicha, setDataFicha] = useState(hoje)
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)

  const aluno = useDados(() => alunoService.buscarPorId(alunoId), [alunoId])
  const ficha = useDados(() => avaliacaoService.ficha(alunoId, dataFicha), [alunoId, dataFicha])
  const voltar = `/alunos/${alunoId}?aba=avaliacoes`

  async function salvar(dados: DadosAvaliacao) {
    setSalvando(true)
    setErro('')
    try {
      const nova = await avaliacaoService.registrar(alunoId, { dtAvaliacao: dataFicha, ...dados })
      navigate(`/alunos/${alunoId}/avaliacoes/${nova.id}`)
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
        <Link component={RouterLink} to={voltar} underline="hover">
          {aluno.dados?.nmPessoa ?? 'Aluno'}
        </Link>
        <Typography sx={{ fontWeight: 600, color: 'text.secondary' }}>Nova avaliação</Typography>
      </Breadcrumbs>

      <TituloPagina
        titulo="Nova avaliação"
        descricao={
          ficha.dados
            ? `${ficha.dados.nmAluno} tinha ${contar(ficha.dados.nrIdade, 'ano', 'anos')} nesta data: a ficha é a do ${ficha.dados.grupo.nmGrupo}.`
            : 'A idade da criança na data escolhe a ficha.'
        }
      />

      <Card sx={{ p: 2.25, mb: 2, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5 }}>
        <TextField
          label="Data da avaliação"
          type="date"
          value={data}
          onChange={(e) => setData(e.target.value)}
          fullWidth={false}
          sx={{ width: 210 }}
          slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: hoje } }}
        />
        <Button variant="outlined" disabled={!data || data === dataFicha} onClick={() => setDataFicha(data)}>
          Usar esta data
        </Button>
        <Typography sx={{ flex: '1 1 220px', fontSize: 14, color: 'text.secondary' }}>
          Trocar a data recarrega a ficha, porque a idade pode mudar o grupo.
        </Typography>
      </Card>

      {ficha.carregando && <Carregando />}
      {ficha.erro && <Alert severity="error">{ficha.erro}</Alert>}
      {ficha.dados && (
        <FormularioAvaliacao
          key={`${ficha.dados.dtAvaliacao}-${ficha.dados.grupo.id}`}
          grupo={ficha.dados.grupo}
          medidas={ficha.dados}
          erro={erro}
          salvando={salvando}
          voltar={voltar}
          onSalvar={salvar}
        />
      )}
    </>
  )
}

export default NovaAvaliacao
