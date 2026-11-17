import { useState, type FormEvent } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  InputAdornment,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { Link as RouterLink } from 'react-router'
import Dica from '../../components/Dica.tsx'
import Emblema from '../../components/Emblema.tsx'
import EstadoVazio from '../../components/EstadoVazio.tsx'
import Etiqueta from '../../components/Etiqueta.tsx'
import type { RespostaRequest, RespostaResponse } from '../../types/avaliacao.ts'
import type { TipoOpcao } from '../../types/enums.ts'
import type { GrupoDetalheResponse } from '../../types/grupo.ts'
import { amarelo, lilas, menta, pessego, type Cor } from '../../utils/cores.ts'
import { lerNumero, paraCampo } from '../../utils/formatos.ts'
import { paraCentimetros, validarMedidas } from '../../utils/medidas.ts'
import { corCalculo, opcoes, rotuloCalculo, rotuloOpcao } from '../../utils/rotulos.ts'

export type DadosAvaliacao = {
  vlPeso: number | null
  vlEstatura: number | null
  vlCintura: number | null
  dsLocal: string | null
  nrDuracao: number | null
  respostas: RespostaRequest[]
}

type Medidas = {
  vlPeso: number | null
  vlEstatura: number | null
  vlCintura: number | null
}

// Onde foi a avaliação e quanto tempo levou (em minutos): opcionais, como no cabeçalho da ficha de observação.
type Sessao = {
  dsLocal: string | null
  nrDuracao: number | null
}

type Props = {
  grupo: GrupoDetalheResponse
  medidas: Medidas
  sessao?: Sessao
  respostas?: RespostaResponse[]
  erro: string
  salvando: boolean
  voltar: string
  onSalvar: (dados: DadosAvaliacao) => void
}

const corOpcao: Record<TipoOpcao, Cor> = { SIM: menta, PARCIAL: amarelo, NAO: pessego }

// A ficha para preencher: medidas e as perguntas de cada teste do grupo.
// Serve para a avaliação nova e para a correção (com as respostas já preenchidas).
function FormularioAvaliacao({ grupo, medidas, sessao, respostas = [], erro, salvando, voltar, onSalvar }: Props) {
  const [local, setLocal] = useState(sessao?.dsLocal ?? '')
  const [duracao, setDuracao] = useState(sessao?.nrDuracao == null ? '' : String(sessao.nrDuracao))
  const [peso, setPeso] = useState(paraCampo(medidas.vlPeso))
  const [estatura, setEstatura] = useState(paraCampo(medidas.vlEstatura))
  const [cintura, setCintura] = useState(paraCampo(medidas.vlCintura))
  const [numeros, setNumeros] = useState<Record<number, string>>(() =>
    Object.fromEntries(respostas.filter((r) => r.vlResposta !== null).map((r) => [r.perguntaId, paraCampo(r.vlResposta)])),
  )
  const [escolhas, setEscolhas] = useState<Record<number, TipoOpcao>>(() =>
    Object.fromEntries(respostas.filter((r) => r.tpOpcao !== null).map((r) => [r.perguntaId, r.tpOpcao as TipoOpcao])),
  )
  const [aviso, setAviso] = useState('')

  const perguntas = grupo.subgrupos.flatMap((subgrupo) => subgrupo.perguntas.map((pergunta) => ({ pergunta, subgrupo })))
  const respondidas = perguntas.filter(({ pergunta }) =>
    pergunta.tpResposta === 'NUMERO' ? (numeros[pergunta.id] ?? '').trim() !== '' : escolhas[pergunta.id] !== undefined,
  ).length

  function escolher(perguntaId: number, opcao: TipoOpcao | null) {
    const novas = { ...escolhas }
    if (opcao === null) {
      delete novas[perguntaId]
    } else {
      novas[perguntaId] = opcao
    }
    setEscolhas(novas)
  }

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()

    const lista: RespostaRequest[] = []
    for (const { pergunta, subgrupo } of perguntas) {
      if (pergunta.tpResposta === 'NUMERO') {
        const texto = (numeros[pergunta.id] ?? '').trim()
        if (!texto) {
          continue
        }
        const valor = lerNumero(texto)
        if (valor === null || valor < 0) {
          setAviso(`Confira o valor de ${pergunta.dsPergunta} em ${subgrupo.nmSubgrupo}.`)
          return
        }
        lista.push({ perguntaId: pergunta.id, vlResposta: valor, tpOpcao: null })
      } else if (escolhas[pergunta.id]) {
        lista.push({ perguntaId: pergunta.id, vlResposta: null, tpOpcao: escolhas[pergunta.id] })
      }
    }

    let nrDuracao: number | null = null
    if (duracao.trim() !== '') {
      nrDuracao = Number(duracao.trim())
      if (!Number.isInteger(nrDuracao) || nrDuracao < 1 || nrDuracao > 600) {
        setAviso('A duração vai em minutos inteiros, de 1 a 600.')
        return
      }
    }

    const lidas = {
      vlPeso: lerNumero(peso),
      vlEstatura: paraCentimetros(lerNumero(estatura)),
      vlCintura: paraCentimetros(lerNumero(cintura)),
    }
    const numeroInvalido =
      (peso.trim() !== '' && lidas.vlPeso === null) ||
      (estatura.trim() !== '' && lidas.vlEstatura === null) ||
      (cintura.trim() !== '' && lidas.vlCintura === null)
    if (numeroInvalido) {
      setAviso('Peso, estatura e cintura precisam ser números.')
      return
    }
    const problemas = Object.values(validarMedidas(lidas))
    if (problemas.length > 0) {
      setAviso(problemas.join(' '))
      return
    }
    if (lista.length === 0) {
      setAviso('Responda pelo menos uma pergunta.')
      return
    }

    setAviso('')
    onSalvar({ ...lidas, dsLocal: local.trim() || null, nrDuracao, respostas: lista })
  }

  return (
    <Box component="form" onSubmit={enviar} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Card sx={{ p: 2.25, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Typography variant="h2">Local e duração</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '2fr 1fr' }, gap: 2 }}>
          <TextField
            label="Local"
            placeholder="Ex.: quadra coberta"
            value={local}
            onChange={(e) => setLocal(e.target.value)}
            slotProps={{ htmlInput: { maxLength: 100 } }}
          />
          <TextField
            label="Duração"
            value={duracao}
            onChange={(e) => setDuracao(e.target.value)}
            slotProps={{
              htmlInput: { inputMode: 'numeric' },
              input: { endAdornment: <InputAdornment position="end">min</InputAdornment> },
            }}
          />
        </Box>
        <Dica>Opcional: onde a avaliação foi feita e quanto tempo levou, como no cabeçalho da ficha de observação.</Dica>
      </Card>

      <Card sx={{ p: 2.25, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Typography variant="h2">Medidas</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 2 }}>
          <TextField
            label="Peso"
            value={peso}
            onChange={(e) => setPeso(e.target.value)}
            slotProps={{
              htmlInput: { inputMode: 'decimal' },
              input: { endAdornment: <InputAdornment position="end">kg</InputAdornment> },
            }}
          />
          <TextField
            label="Estatura"
            value={estatura}
            onChange={(e) => setEstatura(e.target.value)}
            slotProps={{
              htmlInput: { inputMode: 'decimal' },
              input: { endAdornment: <InputAdornment position="end">cm</InputAdornment> },
            }}
          />
          <TextField
            label="Cintura"
            value={cintura}
            onChange={(e) => setCintura(e.target.value)}
            slotProps={{
              htmlInput: { inputMode: 'decimal' },
              input: { endAdornment: <InputAdornment position="end">cm</InputAdornment> },
            }}
          />
        </Box>
        <Dica>
          Já vêm do último registro da criança; ajuste se mediu de novo. Estatura e cintura podem ser digitadas em
          centímetros (124) ou em metros (1,24).
        </Dica>
      </Card>

      {perguntas.length === 0 && (
        <EstadoVazio
          titulo={`A ficha do ${grupo.nmGrupo} ainda não tem perguntas.`}
          texto="O admin monta a ficha em Estrutura da ficha."
        />
      )}

      {grupo.subgrupos
        .filter((subgrupo) => subgrupo.perguntas.length > 0)
        .map((subgrupo) => (
          <Card key={subgrupo.id} sx={{ p: 2.25, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.25, mb: 0.5 }}>
              <Emblema cor={corCalculo[subgrupo.tpCalculo]}>{subgrupo.nrOrdem}</Emblema>
              <Typography variant="h3" component="h2">
                {subgrupo.nmSubgrupo}
              </Typography>
              <Etiqueta cor={corCalculo[subgrupo.tpCalculo]} texto={rotuloCalculo[subgrupo.tpCalculo]} />
            </Box>
            {subgrupo.perguntas.map((pergunta) => (
              <Box key={pergunta.id} sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5, py: 0.5 }}>
                <Typography sx={{ flex: '1 1 160px', fontWeight: 700 }}>{pergunta.dsPergunta}</Typography>
                {pergunta.tpResposta === 'NUMERO' ? (
                  <TextField
                    size="small"
                    fullWidth={false}
                    placeholder="0"
                    value={numeros[pergunta.id] ?? ''}
                    onChange={(e) => setNumeros({ ...numeros, [pergunta.id]: e.target.value })}
                    sx={{ width: 170 }}
                    slotProps={{
                      htmlInput: {
                        inputMode: 'decimal',
                        'aria-label': `${pergunta.dsPergunta} de ${subgrupo.nmSubgrupo}`,
                      },
                      input: pergunta.dsUnidade
                        ? { endAdornment: <InputAdornment position="end">{pergunta.dsUnidade}</InputAdornment> }
                        : undefined,
                    }}
                  />
                ) : (
                  <ToggleButtonGroup
                    exclusive
                    size="small"
                    value={escolhas[pergunta.id] ?? null}
                    onChange={(_, opcao: TipoOpcao | null) => escolher(pergunta.id, opcao)}
                    aria-label={`${pergunta.dsPergunta} de ${subgrupo.nmSubgrupo}`}
                  >
                    {opcoes.map((opcao) => (
                      <ToggleButton
                        key={opcao}
                        value={opcao}
                        sx={{
                          px: 2,
                          fontWeight: 700,
                          textTransform: 'none',
                          '&.Mui-selected, &.Mui-selected:hover': {
                            bgcolor: corOpcao[opcao].fundo,
                            color: corOpcao[opcao].texto,
                          },
                        }}
                      >
                        {rotuloOpcao[opcao]}
                      </ToggleButton>
                    ))}
                  </ToggleButtonGroup>
                )}
              </Box>
            ))}
          </Card>
        ))}

      {(aviso || erro) && <Alert severity="error">{aviso || erro}</Alert>}

      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }}>
        <Etiqueta cor={lilas} texto={`${respondidas} de ${perguntas.length} respondidas`} />
        <Box sx={{ flex: 1 }} />
        <Button variant="outlined" component={RouterLink} to={voltar}>
          Cancelar
        </Button>
        <Button type="submit" variant="contained" loading={salvando} disabled={perguntas.length === 0}>
          Salvar avaliação
        </Button>
      </Box>
    </Box>
  )
}

export default FormularioAvaliacao
