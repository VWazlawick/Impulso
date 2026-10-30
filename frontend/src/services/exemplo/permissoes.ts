import { ErroApi } from '../erros.ts'
import type { Solicitante } from './apoio.ts'
import { banco } from './banco.ts'

// As mesmas regras de "quem vê o quê" do backend (buscarAlunoPermitido e companhia).

export function profissionalLogado(quem: Solicitante) {
  const profissional = banco.profissionais.find((p) => p.usuarioId === quem.usuarioId)
  if (!profissional) {
    throw new ErroApi(403, 'Acesso Negado')
  }
  return profissional
}

export function responsavelLogado(quem: Solicitante) {
  return banco.responsaveis.find((r) => r.usuarioId === quem.usuarioId)
}

// Admin vê todos; o profissional, os alunos dele; o responsável, os filhos vinculados a ele.
export function alunoPermitido(alunoId: number, quem: Solicitante) {
  const aluno = banco.alunos.find((a) => a.id === alunoId)
  const naoEncontrado = new ErroApi(404, 'Aluno não encontrado!')
  if (!aluno) {
    throw naoEncontrado
  }
  if (quem.admin) {
    return aluno
  }
  if (quem.responsavel) {
    const responsavel = responsavelLogado(quem)
    if (!responsavel || !aluno.responsaveis.includes(responsavel.id)) {
      throw naoEncontrado
    }
    return aluno
  }
  if (aluno.profissionalId !== profissionalLogado(quem).id) {
    throw naoEncontrado
  }
  return aluno
}

// O profissional só enxerga responsáveis de alunos dele.
export function responsavelPermitido(responsavelId: number, quem: Solicitante) {
  const responsavel = banco.responsaveis.find((r) => r.id === responsavelId)
  const naoEncontrado = new ErroApi(404, 'Responsável não encontrado!')
  if (!responsavel) {
    throw naoEncontrado
  }
  if (!quem.admin) {
    const profissional = profissionalLogado(quem)
    const dele = banco.alunos.some((a) => a.profissionalId === profissional.id && a.responsaveis.includes(responsavelId))
    if (!dele) {
      throw naoEncontrado
    }
  }
  return responsavel
}
