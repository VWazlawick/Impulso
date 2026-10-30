import { useState } from 'react'
import { Box, MenuItem, TextField } from '@mui/material'
import FormatListBulletedRounded from '@mui/icons-material/FormatListBulletedRounded'
import Dica from '../../components/Dica.tsx'
import DialogoFormulario from '../../components/DialogoFormulario.tsx'
import { mensagemDeErro } from '../../services/erros.ts'
import { subgrupoService } from '../../services/subgrupoService.ts'
import type { TipoCalculo } from '../../types/enums.ts'
import type { SubgrupoResponse } from '../../types/subgrupo.ts'
import { lilas } from '../../utils/cores.ts'
import { lerInteiro } from '../../utils/formatos.ts'
import { rotuloCalculo, tiposDeCalculo } from '../../utils/rotulos.ts'

type Props = {
  grupoId: number
  subgrupo?: SubgrupoResponse
  ordemSugerida: number
  onFechar: () => void
  onSalvo: () => void
}

// Sem subgrupo, cadastra um novo no grupo; com subgrupo, edita.
function SubgrupoDialog({ grupoId, subgrupo, ordemSugerida, onFechar, onSalvo }: Props) {
  const [nome, setNome] = useState(subgrupo?.nmSubgrupo ?? '')
  const [tpCalculo, setTpCalculo] = useState<TipoCalculo>(subgrupo?.tpCalculo ?? 'MAIOR_VALOR')
  const [ordem, setOrdem] = useState(String(subgrupo?.nrOrdem ?? ordemSugerida))
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)

  async function salvar() {
    const nrOrdem = lerInteiro(ordem)
    if (!nome.trim()) {
      setErro('Informe o nome do teste ou habilidade.')
      return
    }
    if (nrOrdem === null || nrOrdem < 1) {
      setErro('A ordem precisa ser um número inteiro a partir de 1.')
      return
    }

    const request = { nmSubgrupo: nome.trim(), tpCalculo, nrOrdem }
    setSalvando(true)
    setErro('')
    try {
      if (subgrupo) {
        await subgrupoService.atualizar(subgrupo.id, request)
      } else {
        await subgrupoService.cadastrar(grupoId, request)
      }
      onSalvo()
    } catch (e) {
      setErro(mensagemDeErro(e))
      setSalvando(false)
    }
  }

  return (
    <DialogoFormulario
      titulo={subgrupo ? `Editar ${subgrupo.nmSubgrupo}` : 'Novo subgrupo'}
      icone={<FormatListBulletedRounded />}
      cor={lilas}
      erro={erro}
      salvando={salvando}
      onFechar={onFechar}
      onSalvar={salvar}
    >
      <TextField
        label="Nome do teste ou habilidade"
        placeholder="Arremesso"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        autoFocus
        slotProps={{ htmlInput: { maxLength: 100 } }}
      />
      <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 2 }}>
        <TextField
          select
          label="Como calcula"
          value={tpCalculo}
          onChange={(e) => setTpCalculo(e.target.value as TipoCalculo)}
        >
          {tiposDeCalculo.map((tipo) => (
            <MenuItem key={tipo} value={tipo}>
              {rotuloCalculo[tipo]}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="Ordem"
          type="number"
          value={ordem}
          onChange={(e) => setOrdem(e.target.value)}
          slotProps={{ htmlInput: { min: 1 } }}
        />
      </Box>
      <Dica>
        Maior ou menor valor guardam a melhor tentativa. Estágio conta os SIM, NÃO e PARCIAL dos critérios. Nenhum só
        registra as respostas.
      </Dica>
    </DialogoFormulario>
  )
}

export default SubgrupoDialog
