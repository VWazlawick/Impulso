// Erro no formato que o backend devolve: o status HTTP, a mensagem do campo "erro"
// e, no erro 400 de validação, a mensagem de cada campo em "campos".
export class ErroApi extends Error {
  readonly status: number
  readonly campos: Record<string, string>

  constructor(status: number, mensagem: string, campos: Record<string, string> = {}) {
    super(mensagem)
    this.name = 'ErroApi'
    this.status = status
    this.campos = campos
  }
}

export function mensagemDeErro(erro: unknown) {
  if (erro instanceof ErroApi && Object.keys(erro.campos).length > 0) {
    return Object.values(erro.campos).join(' ')
  }
  return erro instanceof Error ? erro.message : 'Algo deu errado. Tente de novo.'
}
