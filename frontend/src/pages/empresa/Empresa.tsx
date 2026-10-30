import { useState, type FormEvent } from 'react'
import { Alert, Box, Button, Card, TextField } from '@mui/material'
import Carregando from '../../components/Carregando.tsx'
import Dica from '../../components/Dica.tsx'
import TituloPagina from '../../components/TituloPagina.tsx'
import { useDados } from '../../hooks/useDados.ts'
import { empresaService } from '../../services/empresaService.ts'
import { ErroApi, mensagemDeErro } from '../../services/erros.ts'
import type { EmpresaResponse } from '../../types/empresa.ts'
import { formatarCnpj, somenteDigitos } from '../../utils/documentos.ts'

function FormularioEmpresa({ empresa }: { empresa: EmpresaResponse | null }) {
  const [razaoSocial, setRazaoSocial] = useState(empresa?.razaoSocial ?? '')
  const [cnpj, setCnpj] = useState(empresa ? formatarCnpj(empresa.cnpj) : '')
  const [erro, setErro] = useState('')
  const [salvo, setSalvo] = useState(false)
  const [salvando, setSalvando] = useState(false)

  async function salvar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    const digitos = somenteDigitos(cnpj)
    if (!razaoSocial.trim()) {
      setErro('Informe a razão social.')
      return
    }
    if (digitos.length !== 14) {
      setErro('O CNPJ precisa ter 14 dígitos.')
      return
    }
    setSalvando(true)
    setErro('')
    setSalvo(false)
    try {
      await empresaService.salvar({ razaoSocial: razaoSocial.trim(), cnpj: digitos })
      setSalvo(true)
    } catch (e) {
      setErro(mensagemDeErro(e))
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Card component="form" onSubmit={salvar} noValidate sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 560 }}>
      {!empresa && <Dica destaque>A empresa ainda não foi cadastrada. Preencha e salve.</Dica>}
      <TextField label="Razão social" value={razaoSocial} onChange={(e) => setRazaoSocial(e.target.value)} />
      <TextField
        label="CNPJ"
        placeholder="00.000.000/0000-00"
        value={cnpj}
        onChange={(e) => setCnpj(e.target.value)}
        slotProps={{ htmlInput: { inputMode: 'numeric', maxLength: 18 } }}
      />
      {erro && <Alert severity="error">{erro}</Alert>}
      {salvo && <Alert severity="success">Dados da empresa salvos.</Alert>}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button type="submit" variant="contained" loading={salvando}>
          Salvar
        </Button>
      </Box>
    </Card>
  )
}

// Cada instalação do Impulso tem uma empresa só: aqui ficam os dados dela.
function Empresa() {
  const empresa = useDados(async () => {
    try {
      return await empresaService.consultar()
    } catch (e) {
      // 404 aqui só quer dizer que ninguém cadastrou ainda.
      if (e instanceof ErroApi && e.status === 404) {
        return null
      }
      throw e
    }
  }, [])

  return (
    <>
      <TituloPagina titulo="Empresa" descricao="Os dados da academia ou escola que usa o Impulso." />
      {empresa.carregando && <Carregando />}
      {empresa.erro && <Alert severity="error">{empresa.erro}</Alert>}
      {!empresa.carregando && !empresa.erro && <FormularioEmpresa empresa={empresa.dados} />}
    </>
  )
}

export default Empresa
