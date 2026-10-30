import type { TipoUsuario } from '../types/enums.ts'
import type { UsuarioRequest, UsuarioResponse } from '../types/usuario.ts'
import { emailValido } from '../utils/documentos.ts'
import { copiar, esperar, novoId, solicitante } from './exemplo/apoio.ts'
import { banco } from './exemplo/banco.ts'
import { montarUsuario } from './exemplo/montar.ts'
import { responsavelPermitido } from './exemplo/permissoes.ts'
import { falharSeHouver } from './exemplo/validacoes.ts'
import { ErroApi } from './erros.ts'

// Por enquanto usa os dados de exemplo e repete as regras do UsuarioService.

function validar({ email, senha }: UsuarioRequest) {
  const campos: Record<string, string> = {}
  if (!email.trim()) {
    campos.email = 'Email obrigatório'
  } else if (!emailValido(email.trim())) {
    campos.email = 'Email inválido!'
  }
  if (!senha) {
    campos.senha = 'Informe a senha!'
  } else if (senha.length < 8) {
    campos.senha = 'A Senha deve ter no mínimo 8 caracteres!'
  }
  falharSeHouver(campos)
}

function validarSemAcesso(usuarioId: number | null) {
  if (usuarioId !== null) {
    throw new ErroApi(409, 'Esta pessoa já possui acesso')
  }
}

function salvarNovoUsuario(request: UsuarioRequest, tpUsuario: TipoUsuario) {
  const email = request.email.trim().toLowerCase()
  if (banco.usuarios.some((u) => u.email.toLowerCase() === email)) {
    throw new ErroApi(409, 'Email já cadastrado!')
  }
  const usuario = { id: novoId(), email, tpUsuario, stAtivo: true }
  banco.usuarios.push(usuario)
  return usuario
}

export const usuarioService = {
  // GET /api/usuario/me
  async meusDados(): Promise<UsuarioResponse> {
    await esperar()
    const quem = solicitante()
    const usuario = banco.usuarios.find((u) => u.id === quem.usuarioId)
    if (!usuario) {
      throw new ErroApi(404, 'Usuário não encontrado!')
    }
    return copiar(montarUsuario(usuario))
  },

  // POST /api/usuario
  // Profissional só ganha acesso pelo admin; responsável, pelo admin ou pelo profissional do aluno.
  async criarAcesso(request: UsuarioRequest): Promise<UsuarioResponse> {
    await esperar()
    const quem = solicitante('ADMIN', 'PROFISSIONAL')
    validar(request)

    const profissional = banco.profissionais.find((p) => p.id === request.pessoaId)
    if (profissional) {
      if (!quem.admin) {
        throw new ErroApi(403, 'Acesso Negado')
      }
      validarSemAcesso(profissional.usuarioId)
      const usuario = salvarNovoUsuario(request, 'PROFISSIONAL')
      profissional.usuarioId = usuario.id
      return copiar(montarUsuario(usuario))
    }

    if (banco.responsaveis.some((r) => r.id === request.pessoaId)) {
      const responsavel = responsavelPermitido(request.pessoaId, quem)
      validarSemAcesso(responsavel.usuarioId)
      const usuario = salvarNovoUsuario(request, 'RESPONSAVEL')
      responsavel.usuarioId = usuario.id
      return copiar(montarUsuario(usuario))
    }

    if (banco.alunos.some((a) => a.id === request.pessoaId)) {
      throw new ErroApi(409, 'Alunos não possuem acesso ao sistema!')
    }
    throw new ErroApi(404, 'Pessoa não encontrada!')
  },
}
