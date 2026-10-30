import { useState } from 'react'
import { Box, Button, MenuItem, TextField } from '@mui/material'
import BarChartRounded from '@mui/icons-material/BarChartRounded'
import DialogoFormulario from '../../components/DialogoFormulario.tsx'
import { classificacaoService } from '../../services/classificacaoService.ts'
import { mensagemDeErro } from '../../services/erros.ts'
import type { ClassificacaoResponse } from '../../types/classificacao.ts'
import type { Sexo, TipoIndicador } from '../../types/enums.ts'
import { amarelo, perigo } from '../../utils/cores.ts'
import { formatarNumero, lerInteiro, lerNumero } from '../../utils/formatos.ts'
import { rotuloSexo, sexos } from '../../utils/rotulos.ts'

// Valores que já vêm preenchidos numa faixa nova (o sexo e as idades do bloco).
export type FaixaInicial = {
  tpSexo: Sexo
  nrIdadeMin: number
  nrIdadeMax: number
}

type Props = {
  tpIndicador: TipoIndicador
  subgrupoId: number | null
  contexto: string
  faixa?: ClassificacaoResponse
  inicial?: FaixaInicial
  onFechar: () => void
  onSalvo: () => void
  onExcluir: () => void
}

// Sem faixa, cadastra uma nova; com faixa, edita (e oferece excluir).
function FaixaDialog(props: Props) {
  const { tpIndicador, subgrupoId, contexto, faixa, inicial, onFechar, onSalvo, onExcluir } = props
  const base = faixa ?? inicial

  const [tpSexo, setTpSexo] = useState<Sexo>(base?.tpSexo ?? 'FEMININO')
  const [idadeMin, setIdadeMin] = useState(base ? String(base.nrIdadeMin) : '')
  const [idadeMax, setIdadeMax] = useState(base ? String(base.nrIdadeMax) : '')
  const [inicio, setInicio] = useState(faixa ? formatarNumero(faixa.vlInicio) : '')
  const [nome, setNome] = useState(faixa?.dsClassificacao ?? '')
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)

  async function salvar() {
    const nrIdadeMin = lerInteiro(idadeMin)
    const nrIdadeMax = lerInteiro(idadeMax)
    const vlInicio = lerNumero(inicio)
    if (nrIdadeMin === null || nrIdadeMax === null) {
      setErro('Informe as idades em anos inteiros, como 6 e 7.')
      return
    }
    if (vlInicio === null || vlInicio < 0) {
      setErro('Informe a partir de qual valor a faixa vale: um número a partir de 0.')
      return
    }
    if (!nome.trim()) {
      setErro('Dê um nome para a classificação, como Bom.')
      return
    }

    const request = { tpIndicador, subgrupoId, tpSexo, nrIdadeMin, nrIdadeMax, vlInicio, dsClassificacao: nome.trim() }
    setSalvando(true)
    setErro('')
    try {
      if (faixa) {
        await classificacaoService.atualizar(faixa.id, request)
      } else {
        await classificacaoService.cadastrar(request)
      }
      onSalvo()
    } catch (e) {
      setErro(mensagemDeErro(e))
      setSalvando(false)
    }
  }

  return (
    <DialogoFormulario
      titulo={faixa ? 'Editar faixa' : 'Nova faixa'}
      subtitulo={contexto}
      icone={<BarChartRounded />}
      cor={amarelo}
      erro={erro}
      salvando={salvando}
      onFechar={onFechar}
      onSalvar={salvar}
      acaoExtra={
        faixa && (
          <Button
            onClick={onExcluir}
            disabled={salvando}
            sx={{ bgcolor: perigo.fundo, color: perigo.texto, '&:hover': { bgcolor: '#FFE3E8' } }}
          >
            Excluir faixa
          </Button>
        )
      }
    >
      <TextField select label="Sexo" value={tpSexo} onChange={(e) => setTpSexo(e.target.value as Sexo)}>
        {sexos.map((sexo) => (
          <MenuItem key={sexo} value={sexo}>
            {rotuloSexo[sexo]}
          </MenuItem>
        ))}
      </TextField>
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
        <TextField
          label="Idade mínima"
          type="number"
          value={idadeMin}
          onChange={(e) => setIdadeMin(e.target.value)}
          slotProps={{ htmlInput: { min: 0 } }}
        />
        <TextField
          label="Idade máxima"
          type="number"
          value={idadeMax}
          onChange={(e) => setIdadeMax(e.target.value)}
          slotProps={{ htmlInput: { min: 0 } }}
        />
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 2 }}>
        <TextField
          label="A partir de"
          placeholder="120"
          value={inicio}
          onChange={(e) => setInicio(e.target.value)}
          slotProps={{ htmlInput: { inputMode: 'decimal' } }}
        />
        <TextField
          label="Classificação"
          placeholder="Bom"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          slotProps={{ htmlInput: { maxLength: 30 } }}
        />
      </Box>
    </DialogoFormulario>
  )
}

export default FaixaDialog
