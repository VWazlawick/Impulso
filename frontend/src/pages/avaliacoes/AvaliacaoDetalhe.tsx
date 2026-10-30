import { useState } from 'react'
import { Alert, Box, Breadcrumbs, Button, Card, Link, Typography } from '@mui/material'
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded'
import EditRounded from '@mui/icons-material/EditRounded'
import EventRounded from '@mui/icons-material/EventRounded'
import { Link as RouterLink, useNavigate, useParams } from 'react-router'
import Carregando from '../../components/Carregando.tsx'
import DialogoExcluir from '../../components/DialogoExcluir.tsx'
import Emblema from '../../components/Emblema.tsx'
import EstadoVazio from '../../components/EstadoVazio.tsx'
import Etiqueta from '../../components/Etiqueta.tsx'
import InfoItem from '../../components/InfoItem.tsx'
import { useDados } from '../../hooks/useDados.ts'
import { avaliacaoService } from '../../services/avaliacaoService.ts'
import { grupoService } from '../../services/grupoService.ts'
import { amarelo, lavanda, lilas, neutro } from '../../utils/cores.ts'
import { formatarData } from '../../utils/datas.ts'
import { contar, formatarNumero } from '../../utils/formatos.ts'
import { corCalculo, corEstagio, rotuloCalculo, rotuloEstagio, rotuloOpcao } from '../../utils/rotulos.ts'

type Props = {
  // Na área da família a tela é só de leitura e não mostra as respostas uma a uma.
  familia?: boolean
}

function medida(valor: number | null, unidade: string) {
  return valor === null ? '—' : `${formatarNumero(valor)} ${unidade}`
}

function Indice({ valor, classificacao }: { valor: number | null; classificacao: string | null }) {
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }}>
      {valor === null ? '—' : formatarNumero(valor)}
      {classificacao && <Etiqueta cor={lilas} texto={classificacao} />}
    </Box>
  )
}

function AvaliacaoDetalhe({ familia = false }: Props) {
  const params = useParams()
  const alunoId = Number(params.id)
  const avaliacaoId = Number(params.avaliacaoId)
  const navigate = useNavigate()
  const [excluir, setExcluir] = useState(false)

  const avaliacao = useDados(() => avaliacaoService.buscarPorId(alunoId, avaliacaoId), [alunoId, avaliacaoId])
  // A ficha do grupo (para mostrar as respostas por teste) só abre para admin e profissional.
  const grupoId = !familia && avaliacao.dados ? avaliacao.dados.grupoId : null
  const grupo = useDados(async () => (grupoId === null ? null : grupoService.buscarPorId(grupoId)), [grupoId])

  const base = familia ? `/familia/${alunoId}` : `/alunos/${alunoId}`
  const voltar = `${base}?aba=avaliacoes`

  if (avaliacao.carregando) {
    return <Carregando />
  }
  if (!avaliacao.dados) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
        <Alert severity="error">{avaliacao.erro}</Alert>
        <Button component={RouterLink} to={voltar} variant="outlined">
          Voltar
        </Button>
      </Box>
    )
  }

  const atual = avaliacao.dados
  const respondidos = (grupo.dados?.subgrupos ?? []).filter((s) =>
    s.perguntas.some((p) => atual.respostas.some((r) => r.perguntaId === p.id)),
  )

  return (
    <>
      <Breadcrumbs sx={{ mb: 2, fontWeight: 600 }}>
        <Link component={RouterLink} to={familia ? '/familia' : '/alunos'} underline="hover">
          {familia ? 'Minhas crianças' : 'Alunos'}
        </Link>
        <Link component={RouterLink} to={voltar} underline="hover">
          {atual.nmAluno}
        </Link>
        <Typography sx={{ fontWeight: 600, color: 'text.secondary' }}>Avaliação</Typography>
      </Breadcrumbs>

      <Card sx={{ p: 2.25, mb: 2.5, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.75 }}>
        <Emblema cor={lavanda} tamanho={56}>
          <EventRounded />
        </Emblema>
        <Box sx={{ flex: '1 1 240px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0.75 }}>
          <Typography variant="h1">Avaliação de {formatarData(atual.dtAvaliacao)}</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            <Etiqueta cor={neutro} texto={atual.nmAluno} />
            <Etiqueta cor={amarelo} texto={contar(atual.nrIdade, 'ano', 'anos')} />
            <Etiqueta cor={neutro} texto={atual.nmGrupo} />
          </Box>
        </Box>
        {!familia && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            <Button variant="outlined" startIcon={<EditRounded />} component={RouterLink} to={`${base}/avaliacoes/${atual.id}/corrigir`}>
              Corrigir
            </Button>
            <Button variant="outlined" color="error" startIcon={<DeleteOutlineRounded />} onClick={() => setExcluir(true)}>
              Excluir
            </Button>
          </Box>
        )}
      </Card>

      <Typography variant="h2" sx={{ mb: 1.25 }}>
        Resultados
      </Typography>
      {atual.resultados.length === 0 ? (
        <Box sx={{ mb: 2.5 }}>
          <EstadoVazio titulo="Sem resultados calculados." texto="Esta avaliação só tem respostas que não entram em cálculo." />
        </Box>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 2, mb: 2.5 }}>
          {atual.resultados.map((resultado) => {
            const unidade = resultado.dsUnidade
            return (
              <Card key={resultado.subgrupoId} sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1 }}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }}>
                  <Typography sx={{ fontWeight: 700 }}>{resultado.nmSubgrupo}</Typography>
                  <Etiqueta cor={corCalculo[resultado.tpCalculo]} texto={rotuloCalculo[resultado.tpCalculo]} />
                </Box>
                {resultado.vlResultado !== null && (
                  <Typography variant="h1" component="p" sx={{ fontSize: 30 }}>
                    {formatarNumero(resultado.vlResultado)}
                    {unidade ? ` ${unidade}` : ''}
                  </Typography>
                )}
                {resultado.tpEstagio && (
                  <Etiqueta cor={corEstagio[resultado.tpEstagio]} texto={`Estágio ${rotuloEstagio[resultado.tpEstagio].toLowerCase()}`} />
                )}
                {resultado.tpCalculo !== 'ESTAGIO' &&
                  (resultado.dsClassificacao ? (
                    <Etiqueta cor={lilas} texto={resultado.dsClassificacao} />
                  ) : (
                    <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>Sem faixa de classificação para este teste.</Typography>
                  ))}
              </Card>
            )
          })}
        </Box>
      )}

      <Typography variant="h2" sx={{ mb: 1.25 }}>
        Medidas
      </Typography>
      <Card sx={{ p: 2.25, mb: 2.5, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 2 }}>
        <InfoItem rotulo="Peso" valor={medida(atual.medidas.vlPeso, 'kg')} />
        <InfoItem rotulo="Estatura" valor={medida(atual.medidas.vlEstatura, 'cm')} />
        <InfoItem rotulo="Cintura" valor={medida(atual.medidas.vlCintura, 'cm')} />
        <InfoItem rotulo="IMC" valor={<Indice valor={atual.medidas.vlImc} classificacao={atual.medidas.dsClassificacaoImc} />} />
        <InfoItem rotulo="RCE" valor={<Indice valor={atual.medidas.vlRce} classificacao={atual.medidas.dsClassificacaoRce} />} />
      </Card>

      {respondidos.length > 0 && (
        <>
          <Typography variant="h2" sx={{ mb: 1.25 }}>
            Respostas
          </Typography>
          <Card sx={{ p: 2.25, display: 'flex', flexDirection: 'column', gap: 1.75 }}>
            {respondidos.map((subgrupo) => (
              <Box key={subgrupo.id}>
                <Typography sx={{ fontWeight: 700, mb: 0.75 }}>{subgrupo.nmSubgrupo}</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                  {subgrupo.perguntas.map((pergunta) => {
                    const resposta = atual.respostas.find((r) => r.perguntaId === pergunta.id)
                    if (!resposta) {
                      return null
                    }
                    const texto =
                      resposta.vlResposta !== null
                        ? `${formatarNumero(resposta.vlResposta)}${pergunta.dsUnidade ? ` ${pergunta.dsUnidade}` : ''}`
                        : resposta.tpOpcao
                          ? rotuloOpcao[resposta.tpOpcao]
                          : '—'
                    return <Etiqueta key={pergunta.id} cor={neutro} texto={`${pergunta.dsPergunta}: ${texto}`} />
                  })}
                </Box>
              </Box>
            ))}
          </Card>
        </>
      )}

      {excluir && (
        <DialogoExcluir
          titulo="Excluir esta avaliação?"
          texto="Os resultados dela também saem da evolução. Esta ação não pode ser desfeita."
          onFechar={() => setExcluir(false)}
          onExcluir={async () => {
            await avaliacaoService.excluir(alunoId, avaliacaoId)
            navigate(voltar)
          }}
        />
      )}
    </>
  )
}

export default AvaliacaoDetalhe
