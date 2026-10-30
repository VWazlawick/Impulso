import type { ResponsavelRequest } from '../../types/responsavel.ts'
import { ErroApi } from '../erros.ts'

// Imita o erro 400 do Bean Validation: { erro: "Dados Inválidos", campos: { ... } }.
export function falharSeHouver(campos: Record<string, string>) {
  if (Object.keys(campos).length > 0) {
    throw new ErroApi(400, 'Dados Inválidos', campos)
  }
}

// As mesmas anotações do ResponsavelRequest.
export function validarResponsavel({ nmPessoa, nrTelefone }: ResponsavelRequest) {
  const campos: Record<string, string> = {}
  if (!nmPessoa.trim()) {
    campos.nmPessoa = 'O nome do Responsável é obrigatório'
  }
  if (!nrTelefone.trim()) {
    campos.nrTelefone = 'Telefone é obrigatório!'
  } else if (!/^\d{10,11}$/.test(nrTelefone)) {
    campos.nrTelefone = 'O telefone deve ter DDD + número, só digitos'
  }
  falharSeHouver(campos)
}
