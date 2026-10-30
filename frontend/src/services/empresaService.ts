import type { EmpresaRequest, EmpresaResponse } from '../types/empresa.ts'
import { copiar, esperar, novoId, solicitante } from './exemplo/apoio.ts'
import { banco } from './exemplo/banco.ts'
import { falharSeHouver } from './exemplo/validacoes.ts'
import { ErroApi } from './erros.ts'

// Por enquanto usa os dados de exemplo e repete as regras do EmpresaService.
// Cada instalação do sistema tem uma empresa só.

export const empresaService = {
  // GET /api/empresa/atual
  async consultar(): Promise<EmpresaResponse> {
    await esperar()
    solicitante('ADMIN', 'PROFISSIONAL')
    if (!banco.empresa) {
      throw new ErroApi(404, 'A empresa ainda não foi Cadastrada')
    }
    return copiar(banco.empresa)
  },

  // PUT /api/empresa
  async salvar(request: EmpresaRequest): Promise<EmpresaResponse> {
    await esperar()
    solicitante('ADMIN')
    const campos: Record<string, string> = {}
    if (!request.razaoSocial.trim()) {
      campos.razaoSocial = 'A razão social é obrigatória'
    }
    if (!request.cnpj) {
      campos.cnpj = 'O CNPJ é obrigatório'
    } else if (!/^\d{14}$/.test(request.cnpj)) {
      campos.cnpj = 'O CNPJ deve ter 14 dígitos, sem pontuação'
    }
    falharSeHouver(campos)

    banco.empresa = { id: banco.empresa ? banco.empresa.id : novoId(), ...request }
    return copiar(banco.empresa)
  },
}
