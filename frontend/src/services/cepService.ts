import type { CepResponse } from '../types/endereco.ts'
import { esperar, solicitante } from './exemplo/apoio.ts'
import { banco } from './exemplo/banco.ts'
import { ErroApi } from './erros.ts'

// Por enquanto usa os CEPs de exemplo. No backend, a consulta vai ao ViaCEP.
// O CEP 99999-999 imita o ViaCEP fora do ar.

export const cepService = {
  // GET /api/cep/{cep}
  async buscar(cep: string): Promise<CepResponse> {
    await esperar()
    solicitante('ADMIN', 'PROFISSIONAL')
    if (!/^\d{8}$/.test(cep)) {
      throw new ErroApi(400, 'O CEP deve ter 8 dígitos!')
    }
    if (cep === '99999999') {
      throw new ErroApi(503, 'Consulta de CEP indisponível no momento, Preencha o endereço manualmente!')
    }
    const encontrado = banco.ceps.find((c) => c.cep === cep)
    const cidade = banco.cidades.find((c) => c.id === encontrado?.cidadeId)
    const estado = banco.estados.find((e) => e.id === cidade?.estadoId)
    if (!encontrado || !cidade || !estado) {
      throw new ErroApi(404, 'CEP não encontrado!')
    }
    return {
      cep,
      rua: encontrado.rua,
      bairro: encontrado.bairro,
      cidadeId: cidade.id,
      nmCidade: cidade.nmCidade,
      sgEstado: estado.sgEstado,
    }
  },
}
