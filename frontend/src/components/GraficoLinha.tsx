import { useState } from 'react'
import { Box } from '@mui/material'
import { useLargura } from '../hooks/useLargura.ts'
import { formatarData, formatarDataCurta } from '../utils/datas.ts'
import { formatarNumero } from '../utils/formatos.ts'

export type PontoGrafico = {
  data: string
  valor: number
  detalhe?: string | null
}

type Props = {
  pontos: PontoGrafico[]
  descricao: string
  unidade?: string
}

const ALTURA = 220
const MARGEM = { topo: 30, direita: 28, base: 34, esquerda: 46 }
const COR_LINHA = '#7C5CD6'
const COR_GRADE = '#ECE6FB'
const COR_EIXO = '#6B6290'
const COR_TEXTO = '#2E2650'

// Passo "redondo" para a régua: 1, 2, 2,5 ou 5 vezes uma potência de 10.
function passoRedondo(bruto: number) {
  const potencia = 10 ** Math.floor(Math.log10(bruto))
  const fracao = bruto / potencia
  const fator = fracao <= 1 ? 1 : fracao <= 2 ? 2 : fracao <= 2.5 ? 2.5 : fracao <= 5 ? 5 : 10
  return fator * potencia
}

function escala(valores: number[]) {
  let menor = Math.min(...valores)
  let maior = Math.max(...valores)
  if (menor === maior) {
    const folga = Math.abs(menor) * 0.1 || 1
    menor -= folga
    maior += folga
  }
  const passo = passoRedondo((maior - menor) / 3)
  const inicio = Math.floor(menor / passo) * passo
  const fim = Math.ceil(maior / passo) * passo
  const marcas: number[] = []
  for (let marca = inicio; marca <= fim + passo / 2; marca += passo) {
    marcas.push(Number(marca.toFixed(6)))
  }
  return { inicio, fim, marcas }
}

// Gráfico de linha de uma série só (o título do cartão diz o que é).
// O eixo X respeita o tempo entre as avaliações; o valor aparece escrito só no
// último ponto e, nos outros, no balão ao passar o mouse ou tocar.
function GraficoLinha({ pontos, descricao, unidade }: Props) {
  const { ref, largura } = useLargura<HTMLDivElement>()
  const [ativo, setAtivo] = useState<number | null>(null)

  if (pontos.length === 0) {
    return null
  }

  const larguraPlot = Math.max(largura - MARGEM.esquerda - MARGEM.direita, 10)
  const alturaPlot = ALTURA - MARGEM.topo - MARGEM.base
  const tempos = pontos.map((p) => Date.parse(p.data))
  const primeiro = Math.min(...tempos)
  const ultimoTempo = Math.max(...tempos)
  const { inicio, fim, marcas } = escala(pontos.map((p) => p.valor))

  const xDe = (indice: number) => {
    if (pontos.length === 1) {
      return MARGEM.esquerda + larguraPlot / 2
    }
    const fracao =
      ultimoTempo === primeiro ? indice / (pontos.length - 1) : (tempos[indice] - primeiro) / (ultimoTempo - primeiro)
    return MARGEM.esquerda + fracao * larguraPlot
  }
  const yDe = (valor: number) => MARGEM.topo + (1 - (valor - inicio) / (fim - inicio)) * alturaPlot
  const posicoes = pontos.map((p, i) => ({ x: xDe(i), y: yDe(p.valor) }))
  const ultimo = posicoes.length - 1

  // Faixas invisíveis em volta de cada ponto: o mouse não precisa acertar a bolinha.
  const faixas = posicoes.map((posicao, i) => {
    const esquerda = i === 0 ? MARGEM.esquerda : (posicoes[i - 1].x + posicao.x) / 2
    const direita = i === ultimo ? MARGEM.esquerda + larguraPlot : (posicao.x + posicoes[i + 1].x) / 2
    return { esquerda, largura: Math.max(direita - esquerda, 1) }
  })

  // Datas no eixo: todas quando cabem; senão, só a primeira e a última.
  const cabemTodas = pontos.length <= 1 || larguraPlot / (pontos.length - 1) >= 64
  const comUnidade = (valor: number) => `${formatarNumero(valor)}${unidade ? ` ${unidade}` : ''}`
  const pontoAtivo = ativo !== null ? pontos[ativo] : null

  return (
    <Box ref={ref} sx={{ position: 'relative', width: '100%' }}>
      {largura > 0 && (
        <svg
          width={largura}
          height={ALTURA}
          role="img"
          aria-label={descricao}
          onMouseLeave={() => setAtivo(null)}
          style={{ display: 'block' }}
        >
          {marcas.map((marca) => (
            <g key={marca}>
              <line
                x1={MARGEM.esquerda}
                x2={MARGEM.esquerda + larguraPlot}
                y1={yDe(marca)}
                y2={yDe(marca)}
                stroke={COR_GRADE}
                strokeWidth={1}
              />
              <text x={MARGEM.esquerda - 8} y={yDe(marca)} textAnchor="end" dominantBaseline="middle" fontSize={12} fill={COR_EIXO}>
                {formatarNumero(marca)}
              </text>
            </g>
          ))}

          {pontos.map((ponto, i) =>
            cabemTodas || i === 0 || i === ultimo ? (
              <text key={`${ponto.data}-${i}`} x={posicoes[i].x} y={ALTURA - 10} textAnchor="middle" fontSize={12} fill={COR_EIXO}>
                {formatarDataCurta(ponto.data)}
              </text>
            ) : null,
          )}

          {ativo !== null && (
            <line
              x1={posicoes[ativo].x}
              x2={posicoes[ativo].x}
              y1={MARGEM.topo}
              y2={MARGEM.topo + alturaPlot}
              stroke="#C5B6EE"
              strokeWidth={1}
              strokeDasharray="4 4"
            />
          )}

          {pontos.length > 1 && (
            <polyline
              points={posicoes.map((p) => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke={COR_LINHA}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          )}

          {posicoes.map((posicao, i) => (
            <circle
              key={i}
              cx={posicao.x}
              cy={posicao.y}
              r={ativo === i ? 6 : 5}
              fill={COR_LINHA}
              stroke="#FFFFFF"
              strokeWidth={2}
            />
          ))}

          {ativo !== ultimo && (
            <text
              x={posicoes[ultimo].x}
              y={posicoes[ultimo].y - 13}
              textAnchor="middle"
              fontSize={13}
              fontWeight={700}
              fill={COR_TEXTO}
            >
              {comUnidade(pontos[ultimo].valor)}
            </text>
          )}

          {faixas.map((faixa, i) => (
            <rect
              key={i}
              x={faixa.esquerda}
              y={MARGEM.topo}
              width={faixa.largura}
              height={alturaPlot}
              fill="transparent"
              onMouseEnter={() => setAtivo(i)}
              onClick={() => setAtivo(ativo === i ? null : i)}
            />
          ))}
        </svg>
      )}

      {pontoAtivo && ativo !== null && (
        <Box
          sx={{
            position: 'absolute',
            left: Math.min(Math.max(posicoes[ativo].x, 80), Math.max(largura - 80, 80)),
            top: posicoes[ativo].y - 14,
            transform: 'translate(-50%, -100%)',
            px: 1.25,
            py: 0.75,
            borderRadius: '10px',
            bgcolor: COR_TEXTO,
            color: '#FFFFFF',
            fontSize: 13,
            fontWeight: 600,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            boxShadow: '0 6px 18px rgba(46, 38, 80, 0.25)',
          }}
        >
          {formatarData(pontoAtivo.data)}: {comUnidade(pontoAtivo.valor)}
          {pontoAtivo.detalhe ? ` · ${pontoAtivo.detalhe}` : ''}
        </Box>
      )}
    </Box>
  )
}

export default GraficoLinha
