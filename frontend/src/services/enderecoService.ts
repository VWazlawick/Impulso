import type { EnderecoRequest, EnderecoResponse } from '../types/endereco.ts'
import { copiar, esperar, novoId, solicitante } from './exemplo/apoio.ts'
import { banco } from './exemplo/banco.ts'
import { montarEndereco } from './exemplo/montar.ts'
import { alunoPermitido } from './exemplo/permissoes.ts'
import { falharSeHouver } from './exemplo/validacoes.ts'
import { ErroApi } from './erros.ts'

// Por enquanto usa os dados de exemplo e repete as regras do EnderecoService.

function validar({ rua, nrCasa, bairro, cep, complemento, cidadeId }: EnderecoRequest) {
  const campos: Record<string, string> = {}
  if (!rua.trim()) {
    campos.rua = 'A rua é obrigatória!'
  } else if (rua.length > 150) {
    campos.rua = 'A rua deve ter no máximo 150 caracteres!'
  }
  if (!nrCasa.trim()) {
    campos.nrCasa = 'O número é obrigatório!'
  } else if (nrCasa.length > 20) {
    campos.nrCasa = 'O número deve ter no máximo 20 caracteres!'
  }
  if (!bairro.trim()) {
    campos.bairro = 'O bairro é obrigatório!'
  } else if (bairro.length > 100) {
    campos.bairro = 'O bairro deve ter no máximo 100 caracteres!'
  }
  if (!cep) {
    campos.cep = 'O CEP é obrigatório!'
  } else if (!/^\d{8}$/.test(cep)) {
    campos.cep = 'O CEP deve ter 8 digitos!'
  }
  if (complemento !== null && complemento.length > 100) {
    campos.complemento = 'O complemento deve ter no máximo 100 caracteres!'
  }
  falharSeHouver(campos)
  if (!banco.cidades.some((c) => c.id === cidadeId)) {
    throw new ErroApi(404, 'Cidade não encontrada!')
  }
}

function enderecoDoAluno(alunoId: number, id: number) {
  const endereco = banco.enderecos.find((e) => e.id === id && e.alunoId === alunoId)
  if (!endereco) {
    throw new ErroApi(404, 'Endereço não encontrado!')
  }
  return endereco
}

export const enderecoService = {
  // GET /api/aluno/{alunoId}/endereco
  async listar(alunoId: number): Promise<EnderecoResponse[]> {
    await esperar()
    alunoPermitido(alunoId, solicitante('ADMIN', 'PROFISSIONAL'))
    return copiar(banco.enderecos.filter((e) => e.alunoId === alunoId).map(montarEndereco))
  },

  // POST /api/aluno/{alunoId}/endereco
  async cadastrar(alunoId: number, request: EnderecoRequest): Promise<EnderecoResponse> {
    await esperar()
    alunoPermitido(alunoId, solicitante('ADMIN', 'PROFISSIONAL'))
    validar(request)
    const endereco = { id: novoId(), alunoId, ...request }
    banco.enderecos.push(endereco)
    return copiar(montarEndereco(endereco))
  },

  // PUT /api/aluno/{alunoId}/endereco/{id}
  async atualizar(alunoId: number, id: number, request: EnderecoRequest): Promise<EnderecoResponse> {
    await esperar()
    alunoPermitido(alunoId, solicitante('ADMIN', 'PROFISSIONAL'))
    const endereco = enderecoDoAluno(alunoId, id)
    validar(request)
    Object.assign(endereco, request)
    return copiar(montarEndereco(endereco))
  },

  // DELETE /api/aluno/{alunoId}/endereco/{id}
  async excluir(alunoId: number, id: number): Promise<void> {
    await esperar()
    alunoPermitido(alunoId, solicitante('ADMIN', 'PROFISSIONAL'))
    enderecoDoAluno(alunoId, id)
    banco.enderecos = banco.enderecos.filter((e) => e.id !== id)
  },
}
