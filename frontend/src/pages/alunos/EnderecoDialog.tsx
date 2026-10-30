import { useState } from 'react'
import { Alert, Box, Button, MenuItem, TextField } from '@mui/material'
import HomeRounded from '@mui/icons-material/HomeRounded'
import DialogoFormulario from '../../components/DialogoFormulario.tsx'
import { useDados } from '../../hooks/useDados.ts'
import { cepService } from '../../services/cepService.ts'
import { enderecoService } from '../../services/enderecoService.ts'
import { mensagemDeErro } from '../../services/erros.ts'
import { geografiaService } from '../../services/geografiaService.ts'
import type { EnderecoResponse } from '../../types/endereco.ts'
import { azul } from '../../utils/cores.ts'
import { formatarCep, somenteDigitos } from '../../utils/documentos.ts'

type Props = {
  alunoId: number
  endereco?: EnderecoResponse
  onFechar: () => void
  onSalvo: () => void
}

// Endereço com busca pelo CEP: a busca preenche rua, bairro, estado e cidade.
// Se a busca falhar, dá para preencher tudo à mão.
function EnderecoDialog({ alunoId, endereco, onFechar, onSalvo }: Props) {
  const [cep, setCep] = useState(endereco ? formatarCep(endereco.cep) : '')
  const [ultimoCepBuscado, setUltimoCepBuscado] = useState(endereco?.cep ?? '')
  const [rua, setRua] = useState(endereco?.rua ?? '')
  const [numero, setNumero] = useState(endereco?.nrCasa ?? '')
  const [complemento, setComplemento] = useState(endereco?.complemento ?? '')
  const [bairro, setBairro] = useState(endereco?.bairro ?? '')
  const [estadoEscolhido, setEstadoEscolhido] = useState<number | null>(null)
  const [cidadeId, setCidadeId] = useState<number | ''>(endereco?.cidadeId ?? '')
  const [buscandoCep, setBuscandoCep] = useState(false)
  const [avisoCep, setAvisoCep] = useState('')
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)

  const estados = useDados(async () => {
    const paises = await geografiaService.listarPaises()
    return paises.length > 0 ? geografiaService.listarEstados(paises[0].id) : []
  }, [])
  // Na edição, o estado vem da sigla do endereço até alguém escolher outro.
  const estadoId =
    estadoEscolhido ?? (endereco ? (estados.dados?.find((e) => e.sgEstado === endereco.sgEstado)?.id ?? null) : null)
  const cidades = useDados(async () => (estadoId === null ? [] : geografiaService.listarCidades(estadoId)), [estadoId])
  const cidadeNaLista = cidadeId !== '' && (cidades.dados ?? []).some((c) => c.id === cidadeId)

  async function buscarCep() {
    const digitos = somenteDigitos(cep)
    if (digitos.length !== 8 || digitos === ultimoCepBuscado) {
      return
    }
    setUltimoCepBuscado(digitos)
    setBuscandoCep(true)
    setAvisoCep('')
    try {
      const achado = await cepService.buscar(digitos)
      setRua(achado.rua)
      setBairro(achado.bairro)
      const estado = estados.dados?.find((e) => e.sgEstado === achado.sgEstado)
      if (estado) {
        setEstadoEscolhido(estado.id)
      }
      setCidadeId(achado.cidadeId)
    } catch (e) {
      setAvisoCep(mensagemDeErro(e))
    } finally {
      setBuscandoCep(false)
    }
  }

  async function salvar() {
    const digitos = somenteDigitos(cep)
    if (digitos.length !== 8) {
      setErro('O CEP precisa ter 8 dígitos.')
      return
    }
    if (!rua.trim() || !numero.trim() || !bairro.trim()) {
      setErro('Preencha rua, número e bairro.')
      return
    }
    if (cidadeId === '') {
      setErro('Escolha o estado e a cidade.')
      return
    }
    const request = {
      rua: rua.trim(),
      nrCasa: numero.trim(),
      bairro: bairro.trim(),
      cep: digitos,
      complemento: complemento.trim() || null,
      cidadeId,
    }
    setSalvando(true)
    setErro('')
    try {
      if (endereco) {
        await enderecoService.atualizar(alunoId, endereco.id, request)
      } else {
        await enderecoService.cadastrar(alunoId, request)
      }
      onSalvo()
    } catch (e) {
      setErro(mensagemDeErro(e))
      setSalvando(false)
    }
  }

  return (
    <DialogoFormulario
      titulo={endereco ? 'Editar endereço' : 'Novo endereço'}
      icone={<HomeRounded />}
      cor={azul}
      erro={erro}
      salvando={salvando}
      largo
      onFechar={onFechar}
      onSalvar={salvar}
    >
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5 }}>
        <TextField
          label="CEP"
          placeholder="00000-000"
          value={cep}
          onChange={(e) => setCep(e.target.value)}
          onBlur={buscarCep}
          autoFocus
          fullWidth={false}
          sx={{ width: 180 }}
          slotProps={{ htmlInput: { inputMode: 'numeric', maxLength: 9 } }}
        />
        <Button variant="outlined" onClick={buscarCep} loading={buscandoCep}>
          Buscar CEP
        </Button>
      </Box>
      {avisoCep && <Alert severity="warning">{avisoCep}</Alert>}
      <TextField label="Rua" value={rua} onChange={(e) => setRua(e.target.value)} slotProps={{ htmlInput: { maxLength: 150 } }} />
      <Box sx={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 2fr)', gap: 2 }}>
        <TextField label="Número" value={numero} onChange={(e) => setNumero(e.target.value)} slotProps={{ htmlInput: { maxLength: 20 } }} />
        <TextField
          label="Complemento"
          value={complemento}
          onChange={(e) => setComplemento(e.target.value)}
          helperText="Opcional."
          slotProps={{ htmlInput: { maxLength: 100 } }}
        />
      </Box>
      <TextField label="Bairro" value={bairro} onChange={(e) => setBairro(e.target.value)} slotProps={{ htmlInput: { maxLength: 100 } }} />
      <Box sx={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 2fr)', gap: 2 }}>
        <TextField
          select
          label="Estado"
          value={estadoId ?? ''}
          onChange={(e) => {
            setEstadoEscolhido(Number(e.target.value))
            setCidadeId('')
          }}
        >
          {(estados.dados ?? []).map((estado) => (
            <MenuItem key={estado.id} value={estado.id}>
              {estado.sgEstado}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Cidade"
          value={cidadeNaLista ? cidadeId : ''}
          onChange={(e) => setCidadeId(Number(e.target.value))}
          disabled={estadoId === null}
        >
          {(cidades.dados ?? []).map((cidade) => (
            <MenuItem key={cidade.id} value={cidade.id}>
              {cidade.nmCidade}
            </MenuItem>
          ))}
        </TextField>
      </Box>
    </DialogoFormulario>
  )
}

export default EnderecoDialog
