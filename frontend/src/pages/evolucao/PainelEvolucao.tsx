import {
  Alert,
  Box,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded'
import Carregando from '../../components/Carregando.tsx'
import EstadoVazio from '../../components/EstadoVazio.tsx'
import Etiqueta from '../../components/Etiqueta.tsx'
import GraficoLinha from '../../components/GraficoLinha.tsx'
import { useDados } from '../../hooks/useDados.ts'
import { evolucaoService } from '../../services/evolucaoService.ts'
import type { EvolucaoIndicadorResponse } from '../../types/evolucao.ts'
import { neutro } from '../../utils/cores.ts'
import { formatarDataCurta } from '../../utils/datas.ts'
import { formatarNumero } from '../../utils/formatos.ts'
import { resultadoNumerico } from '../../utils/regras.ts'
import { corCalculo, corEstagio, rotuloCalculo, rotuloEstagio } from '../../utils/rotulos.ts'

function valorOuTraco(valor: number | null, unidade = '') {
  return valor === null ? '—' : `${formatarNumero(valor)}${unidade}`
}

// Um teste ao longo do tempo: linha para número, sequência de selos para estágio.
function CartaoIndicador({ indicador }: { indicador: EvolucaoIndicadorResponse }) {
  const numerico = resultadoNumerico(indicador.tpCalculo)
  const pontos = indicador.pontos
    .filter((p) => p.vlResultado !== null)
    .map((p) => ({ data: p.dtAvaliacao, valor: p.vlResultado as number, detalhe: p.dsClassificacao }))

  return (
    <Card sx={{ p: 2.25, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }}>
        <Typography variant="h2" component="h3">
          {indicador.nmSubgrupo}
        </Typography>
        <Etiqueta cor={corCalculo[indicador.tpCalculo]} texto={rotuloCalculo[indicador.tpCalculo]} />
        {numerico && (
          <Typography sx={{ fontSize: 14, color: 'text.secondary' }}>
            {indicador.tpCalculo === 'MAIOR_VALOR' ? 'Quanto maior, melhor.' : 'Quanto menor, melhor.'}
          </Typography>
        )}
      </Box>

      {numerico ? (
        <>
          <GraficoLinha pontos={pontos} descricao={`${indicador.nmSubgrupo} ao longo das avaliações`} />
          {/* A mesma informação em texto, para quem não lê o gráfico. */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
            {indicador.pontos.map((p) => (
              <Etiqueta
                key={p.avaliacaoId}
                cor={neutro}
                texto={`${formatarDataCurta(p.dtAvaliacao)}: ${valorOuTraco(p.vlResultado)}${p.dsClassificacao ? ` · ${p.dsClassificacao}` : ''}`}
              />
            ))}
          </Box>
        </>
      ) : (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }}>
          {indicador.pontos.map((p, i) => (
            <Box key={p.avaliacaoId} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {i > 0 && <ArrowForwardRounded sx={{ color: 'text.secondary', fontSize: 18 }} />}
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                <Typography sx={{ fontSize: 12, fontWeight: 700, color: 'text.secondary' }}>
                  {formatarDataCurta(p.dtAvaliacao)}
                </Typography>
                {p.tpEstagio && <Etiqueta cor={corEstagio[p.tpEstagio]} texto={rotuloEstagio[p.tpEstagio]} />}
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </Card>
  )
}

type Props = {
  alunoId: number
}

// Evolução da criança: um cartão por teste e, no fim, as medidas e o IMC.
function PainelEvolucao({ alunoId }: Props) {
  const evolucao = useDados(() => evolucaoService.buscar(alunoId), [alunoId])

  if (evolucao.carregando) {
    return <Carregando />
  }
  if (!evolucao.dados) {
    return <Alert severity="error">{evolucao.erro}</Alert>
  }

  const { avaliacoes, indicadores } = evolucao.dados
  if (avaliacoes.length === 0) {
    return (
      <EstadoVazio titulo="Ainda não há avaliações." texto="A evolução aparece aqui a partir da primeira avaliação." />
    )
  }

  const imc = avaliacoes
    .filter((a) => a.medidas.vlImc !== null)
    .map((a) => ({ data: a.dtAvaliacao, valor: a.medidas.vlImc as number, detalhe: a.medidas.dsClassificacaoImc }))

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {indicadores.map((indicador) => (
        <CartaoIndicador key={`${indicador.nmSubgrupo}|${indicador.tpCalculo}`} indicador={indicador} />
      ))}

      <Card sx={{ p: 2.25, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Typography variant="h2" component="h3">
          Medidas e IMC
        </Typography>
        {imc.length > 0 && <GraficoLinha pontos={imc} descricao="IMC ao longo das avaliações" />}
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Data</TableCell>
                <TableCell>Idade</TableCell>
                <TableCell align="right">Peso</TableCell>
                <TableCell align="right">Estatura</TableCell>
                <TableCell align="right">Cintura</TableCell>
                <TableCell>IMC</TableCell>
                <TableCell>RCE</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {avaliacoes.map((a) => (
                <TableRow key={a.avaliacaoId}>
                  <TableCell>{formatarDataCurta(a.dtAvaliacao)}</TableCell>
                  <TableCell>{a.nrIdade}</TableCell>
                  <TableCell align="right">{valorOuTraco(a.medidas.vlPeso, ' kg')}</TableCell>
                  <TableCell align="right">{valorOuTraco(a.medidas.vlEstatura, ' cm')}</TableCell>
                  <TableCell align="right">{valorOuTraco(a.medidas.vlCintura, ' cm')}</TableCell>
                  <TableCell>
                    {valorOuTraco(a.medidas.vlImc)}
                    {a.medidas.dsClassificacaoImc ? ` · ${a.medidas.dsClassificacaoImc}` : ''}
                  </TableCell>
                  <TableCell>
                    {valorOuTraco(a.medidas.vlRce)}
                    {a.medidas.dsClassificacaoRce ? ` · ${a.medidas.dsClassificacaoRce}` : ''}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  )
}

export default PainelEvolucao
