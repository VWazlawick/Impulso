import { useState, type FormEvent } from 'react'
import { Alert, Box, Breadcrumbs, Button, Card, Link, MenuItem, TextField, Typography } from '@mui/material'
import { Link as RouterLink, useNavigate, useParams } from 'react-router'
import Carregando from '../../components/Carregando.tsx'
import Dica from '../../components/Dica.tsx'
import TituloPagina from '../../components/TituloPagina.tsx'
import { useDados } from '../../hooks/useDados.ts'
import { alunoService } from '../../services/alunoService.ts'
import { mensagemDeErro } from '../../services/erros.ts'
import { profissionalService } from '../../services/profissionalService.ts'
import { useSessao } from '../../sessao/useSessao.ts'
import type { AlunoRequest, AlunoResponse } from '../../types/aluno.ts'
import type { Sexo, TipoServico } from '../../types/enums.ts'
import type { ProfissionalResponse } from '../../types/profissional.ts'
import { hojeIso } from '../../utils/datas.ts'
import { emailValido, formatarCpf, somenteDigitos } from '../../utils/documentos.ts'
import { lerNumero, paraCampo } from '../../utils/formatos.ts'
import { paraCentimetros, validarMedidas } from '../../utils/medidas.ts'
import { rotuloServico, rotuloSexo, servicos, sexos } from '../../utils/rotulos.ts'

const grade = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }

type PropsFormulario = {
  aluno: AlunoResponse | null
  profissionais: ProfissionalResponse[]
  admin: boolean
}

function FormularioAluno({ aluno, profissionais, admin }: PropsFormulario) {
  const navigate = useNavigate()
  const [nome, setNome] = useState(aluno?.nmPessoa ?? '')
  const [nascimento, setNascimento] = useState(aluno?.dtNascimento ?? '')
  const [sexo, setSexo] = useState<Sexo | ''>(aluno?.sexo ?? '')
  const [servico, setServico] = useState<TipoServico | ''>(aluno?.tpServico ?? '')
  const [cpf, setCpf] = useState(aluno?.cpf ? formatarCpf(aluno.cpf) : '')
  const [email, setEmail] = useState(aluno?.email ?? '')
  const [profissionalId, setProfissionalId] = useState<number | ''>(aluno?.profissionalId ?? '')
  const [peso, setPeso] = useState(paraCampo(aluno?.vlPeso))
  const [estatura, setEstatura] = useState(paraCampo(aluno?.vlEstatura))
  const [cintura, setCintura] = useState(paraCampo(aluno?.vlCintura))
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)

  const voltar = aluno ? `/alunos/${aluno.id}` : '/alunos'
  const nomeDoProfissional = profissionais.find((p) => p.id === aluno?.profissionalId)?.nmPessoa

  async function salvar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    const cpfLimpo = somenteDigitos(cpf)
    const medidas = {
      vlPeso: lerNumero(peso),
      vlEstatura: paraCentimetros(lerNumero(estatura)),
      vlCintura: paraCentimetros(lerNumero(cintura)),
    }

    const problemas: string[] = []
    if (!nome.trim()) problemas.push('Informe o nome.')
    if (!nascimento) problemas.push('Informe a data de nascimento.')
    else if (nascimento >= hojeIso()) problemas.push('A data de nascimento precisa estar no passado.')
    if (!sexo) problemas.push('Escolha o sexo.')
    if (!servico) problemas.push('Escolha a frequência.')
    if (cpfLimpo && cpfLimpo.length !== 11) problemas.push('O CPF precisa ter 11 dígitos.')
    if (email.trim() && !emailValido(email.trim())) problemas.push('Confira o e-mail.')
    if (admin && !aluno && profissionalId === '') problemas.push('Escolha o profissional do aluno.')
    if (
      (peso.trim() && medidas.vlPeso === null) ||
      (estatura.trim() && medidas.vlEstatura === null) ||
      (cintura.trim() && medidas.vlCintura === null)
    ) {
      problemas.push('Peso, estatura e cintura precisam ser números.')
    }
    problemas.push(...Object.values(validarMedidas(medidas)))
    if (problemas.length > 0 || !sexo || !servico) {
      setErro(problemas.join(' '))
      return
    }

    const request: AlunoRequest = {
      nmPessoa: nome.trim(),
      cpf: cpfLimpo || null,
      email: email.trim() || null,
      dtNascimento: nascimento,
      tpServico: servico,
      profissionalId: profissionalId === '' ? null : profissionalId,
      sexo,
      ...medidas,
    }
    setSalvando(true)
    setErro('')
    try {
      const salvo = aluno ? await alunoService.atualizar(aluno.id, request) : await alunoService.cadastrar(request)
      navigate(`/alunos/${salvo.id}`)
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
        {aluno && (
          <Link component={RouterLink} to={voltar} underline="hover">
            {aluno.nmPessoa}
          </Link>
        )}
        <Typography sx={{ fontWeight: 600, color: 'text.secondary' }}>{aluno ? 'Editar' : 'Novo aluno'}</Typography>
      </Breadcrumbs>

      <TituloPagina
        titulo={aluno ? `Editar ${aluno.nmPessoa}` : 'Novo aluno'}
        descricao="Campos com * são obrigatórios. As medidas podem ficar para a primeira avaliação."
      />

      <Box component="form" onSubmit={salvar} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Card sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="h2">Dados da criança</Typography>
          <TextField label="Nome completo *" value={nome} onChange={(e) => setNome(e.target.value)} autoFocus />
          <Box sx={grade}>
            <TextField
              label="Data de nascimento *"
              type="date"
              value={nascimento}
              onChange={(e) => setNascimento(e.target.value)}
              slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: hojeIso() } }}
            />
            <TextField select label="Sexo *" value={sexo} onChange={(e) => setSexo(e.target.value as Sexo)}>
              {sexos.map((item) => (
                <MenuItem key={item} value={item}>
                  {rotuloSexo[item]}
                </MenuItem>
              ))}
            </TextField>
            <TextField select label="Frequência *" value={servico} onChange={(e) => setServico(e.target.value as TipoServico)}>
              {servicos.map((item) => (
                <MenuItem key={item} value={item}>
                  {rotuloServico[item]}
                </MenuItem>
              ))}
            </TextField>
          </Box>
          <Box sx={grade}>
            <TextField
              label="CPF"
              placeholder="000.000.000-00"
              value={cpf}
              onChange={(e) => setCpf(e.target.value)}
              helperText="Opcional."
              slotProps={{ htmlInput: { inputMode: 'numeric', maxLength: 14 } }}
            />
            <TextField label="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} helperText="Opcional." />
          </Box>
          {admin && !aluno && (
            <TextField
              select
              label="Profissional *"
              value={profissionalId}
              onChange={(e) => setProfissionalId(Number(e.target.value))}
            >
              {profissionais.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.nmPessoa}
                </MenuItem>
              ))}
            </TextField>
          )}
          {admin && aluno && (
            <Dica>
              Profissional: <strong>{nomeDoProfissional ?? '…'}</strong>. Para trocar, use "Transferir" na página do aluno.
            </Dica>
          )}
        </Card>

        <Card sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="h2">Medidas</Typography>
          <Typography sx={{ fontSize: 14, color: 'text.secondary' }}>
            Estatura e cintura podem ser digitadas em centímetros (135) ou em metros (1,35).
          </Typography>
          <Box sx={grade}>
            <TextField
              label="Peso (kg)"
              value={peso}
              onChange={(e) => setPeso(e.target.value)}
              slotProps={{ htmlInput: { inputMode: 'decimal' } }}
            />
            <TextField
              label="Estatura"
              value={estatura}
              onChange={(e) => setEstatura(e.target.value)}
              slotProps={{ htmlInput: { inputMode: 'decimal' } }}
            />
            <TextField
              label="Cintura"
              value={cintura}
              onChange={(e) => setCintura(e.target.value)}
              slotProps={{ htmlInput: { inputMode: 'decimal' } }}
            />
          </Box>
        </Card>

        {erro && <Alert severity="error">{erro}</Alert>}

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Button variant="outlined" component={RouterLink} to={voltar}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" loading={salvando}>
            Salvar
          </Button>
        </Box>
      </Box>
    </>
  )
}

// Cadastro (/alunos/novo) e edição (/alunos/:id/editar) do aluno.
function AlunoFormulario() {
  const { id } = useParams()
  const alunoId = id ? Number(id) : null
  const { sessao } = useSessao()
  const admin = sessao?.tipo === 'ADMIN'

  const aluno = useDados(async () => (alunoId === null ? null : alunoService.buscarPorId(alunoId)), [alunoId])
  const profissionais = useDados(async () => (admin ? profissionalService.listar() : []), [admin])

  if (aluno.carregando || profissionais.carregando) {
    return <Carregando />
  }
  if (aluno.erro || profissionais.erro) {
    return <Alert severity="error">{aluno.erro || profissionais.erro}</Alert>
  }
  return <FormularioAluno aluno={aluno.dados} profissionais={profissionais.dados ?? []} admin={admin} />
}

export default AlunoFormulario
