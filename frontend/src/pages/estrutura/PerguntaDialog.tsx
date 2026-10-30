import { useState } from 'react'
import { Box, MenuItem, TextField } from '@mui/material'
import HelpOutlineRounded from '@mui/icons-material/HelpOutlineRounded'
import Dica from '../../components/Dica.tsx'
import DialogoFormulario from '../../components/DialogoFormulario.tsx'
import { mensagemDeErro } from '../../services/erros.ts'
import { perguntaService } from '../../services/perguntaService.ts'
import type { TipoCalculo, TipoResposta } from '../../types/enums.ts'
import type { PerguntaResponse } from '../../types/pergunta.ts'
import type { SubgrupoResponse } from '../../types/subgrupo.ts'
import { amarelo } from '../../utils/cores.ts'
import { lerInteiro } from '../../utils/formatos.ts'
import { respostasAceitas } from '../../utils/regras.ts'
import { rotuloCalculo, rotuloResposta } from '../../utils/rotulos.ts'

const dicas: Record<TipoCalculo, string> = {
  MAIOR_VALOR: 'Cada pergunta é uma tentativa, respondida com um número. Vale a maior.',
  MENOR_VALOR: 'Cada pergunta é uma tentativa, respondida com um número. Vale a menor.',
  ESTAGIO: 'Cada pergunta é um critério, respondido com sim, não ou parcial.',
  NENHUM: 'As respostas deste subgrupo só ficam registradas, sem cálculo.',
}

type Props = {
  subgrupo: SubgrupoResponse
  pergunta?: PerguntaResponse
  onFechar: () => void
  onSalvo: () => void
}

// Sem pergunta, cadastra uma nova no subgrupo; com pergunta, edita.
function PerguntaDialog({ subgrupo, pergunta, onFechar, onSalvo }: Props) {
  // Só os tipos de resposta que o cálculo do subgrupo aceita (mesma regra do backend).
  const aceitos = respostasAceitas(subgrupo.tpCalculo)
  const opcoes = pergunta && !aceitos.includes(pergunta.tpResposta) ? [...aceitos, pergunta.tpResposta] : aceitos
  const proximaOrdem = subgrupo.perguntas.reduce((maior, p) => Math.max(maior, p.nrOrdem), 0) + 1

  const [texto, setTexto] = useState(pergunta?.dsPergunta ?? '')
  const [tpResposta, setTpResposta] = useState<TipoResposta>(pergunta?.tpResposta ?? aceitos[0])
  const [unidade, setUnidade] = useState(pergunta?.dsUnidade ?? '')
  const [ordem, setOrdem] = useState(String(pergunta?.nrOrdem ?? proximaOrdem))
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)

  async function salvar() {
    const nrOrdem = lerInteiro(ordem)
    if (!texto.trim()) {
      setErro('Escreva a pergunta.')
      return
    }
    if (nrOrdem === null || nrOrdem < 1) {
      setErro('A ordem precisa ser um número inteiro a partir de 1.')
      return
    }

    const request = {
      dsPergunta: texto.trim(),
      tpResposta,
      dsUnidade: tpResposta === 'NUMERO' && unidade.trim() ? unidade.trim() : null,
      nrOrdem,
    }
    setSalvando(true)
    setErro('')
    try {
      if (pergunta) {
        await perguntaService.atualizar(pergunta.id, request)
      } else {
        await perguntaService.cadastrar(subgrupo.id, request)
      }
      onSalvo()
    } catch (e) {
      setErro(mensagemDeErro(e))
      setSalvando(false)
    }
  }

  return (
    <DialogoFormulario
      titulo={pergunta ? `Editar ${pergunta.dsPergunta}` : 'Nova pergunta'}
      subtitulo={subgrupo.nmSubgrupo}
      icone={<HelpOutlineRounded />}
      cor={amarelo}
      erro={erro}
      salvando={salvando}
      onFechar={onFechar}
      onSalvar={salvar}
    >
      <TextField
        label="Pergunta"
        placeholder="Tentativa 3"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        autoFocus
        slotProps={{ htmlInput: { maxLength: 255 } }}
      />
      <TextField
        select
        label="Tipo de resposta"
        value={tpResposta}
        onChange={(e) => setTpResposta(e.target.value as TipoResposta)}
        disabled={opcoes.length === 1}
        helperText={
          opcoes.length === 1
            ? `${rotuloCalculo[subgrupo.tpCalculo]} só aceita ${rotuloResposta[opcoes[0]].toLowerCase()}.`
            : undefined
        }
      >
        {opcoes.map((tipo) => (
          <MenuItem key={tipo} value={tipo}>
            {rotuloResposta[tipo]}
          </MenuItem>
        ))}
      </TextField>
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
        {tpResposta === 'NUMERO' && (
          <TextField
            label="Unidade"
            placeholder="cm"
            value={unidade}
            onChange={(e) => setUnidade(e.target.value)}
            slotProps={{ htmlInput: { maxLength: 20 } }}
          />
        )}
        <TextField
          label="Ordem"
          type="number"
          value={ordem}
          onChange={(e) => setOrdem(e.target.value)}
          slotProps={{ htmlInput: { min: 1 } }}
        />
      </Box>
      <Dica>{dicas[subgrupo.tpCalculo]}</Dica>
    </DialogoFormulario>
  )
}

export default PerguntaDialog
