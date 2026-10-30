import type { ResponsavelRequest, ResponsavelResponse } from '../types/responsavel.ts'
import { copiar, esperar, porNome, solicitante } from './exemplo/apoio.ts'
import { banco } from './exemplo/banco.ts'
import { montarResponsavel } from './exemplo/montar.ts'
import { profissionalLogado, responsavelPermitido } from './exemplo/permissoes.ts'
import { validarResponsavel } from './exemplo/validacoes.ts'

// Por enquanto usa os dados de exemplo e repete as regras do ResponsavelService.
// Responsável novo nasce pela ficha do aluno (alunoService.cadastrarResponsavel).

export const responsavelService = {
  // GET /api/responsavel?nome=
  // O admin vê todos; o profissional, só os responsáveis dos alunos dele.
  async listar(nome = ''): Promise<ResponsavelResponse[]> {
    await esperar()
    const quem = solicitante('ADMIN', 'PROFISSIONAL')
    let responsaveis = banco.responsaveis
    if (!quem.admin) {
      const profissional = profissionalLogado(quem)
      responsaveis = responsaveis.filter((r) =>
        banco.alunos.some((a) => a.profissionalId === profissional.id && a.responsaveis.includes(r.id)),
      )
    }
    const trecho = nome.trim().toLowerCase()
    return copiar(
      responsaveis
        .filter((r) => r.nmPessoa.toLowerCase().includes(trecho))
        .sort(porNome)
        .map(montarResponsavel),
    )
  },

  // GET /api/responsavel/{id}
  async buscarPorId(id: number): Promise<ResponsavelResponse> {
    await esperar()
    return copiar(montarResponsavel(responsavelPermitido(id, solicitante('ADMIN', 'PROFISSIONAL'))))
  },

  // PUT /api/responsavel/{id}
  async atualizar(id: number, request: ResponsavelRequest): Promise<ResponsavelResponse> {
    await esperar()
    const responsavel = responsavelPermitido(id, solicitante('ADMIN', 'PROFISSIONAL'))
    validarResponsavel(request)
    responsavel.nmPessoa = request.nmPessoa
    responsavel.nrTelefone = request.nrTelefone
    return copiar(montarResponsavel(responsavel))
  },
}
