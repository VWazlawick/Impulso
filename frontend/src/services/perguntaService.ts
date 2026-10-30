import type { TipoResposta } from '../types/enums.ts'
import type { PerguntaRequest, PerguntaResponse } from '../types/pergunta.ts'
import { aceita } from '../utils/regras.ts'
import { copiar, esperar, novoId, solicitante } from './exemplo/apoio.ts'
import { banco, type SubgrupoExemplo } from './exemplo/banco.ts'
import { montarPergunta, temRespostas } from './exemplo/montar.ts'
import { ErroApi } from './erros.ts'

// Por enquanto usa os dados de exemplo e repete as regras do PerguntaService.

function buscarEntidade(id: number) {
  const pergunta = banco.perguntas.find((p) => p.id === id)
  if (!pergunta) {
    throw new ErroApi(404, 'Pergunta não encontrada!')
  }
  return pergunta
}

function buscarSubgrupo(id: number) {
  const subgrupo = banco.subgrupos.find((s) => s.id === id)
  if (!subgrupo) {
    throw new ErroApi(404, 'Subgrupo não encontrado!')
  }
  return subgrupo
}

function validarTipo(subgrupo: SubgrupoExemplo, tpResposta: TipoResposta) {
  if (!aceita(subgrupo.tpCalculo, tpResposta)) {
    throw new ErroApi(400, `O subgrupo com cálculo ${subgrupo.tpCalculo} não aceita pergunta do tipo ${tpResposta}!`)
  }
}

export const perguntaService = {
  // POST /api/subgrupo/{subgrupoId}/pergunta
  async cadastrar(subgrupoId: number, request: PerguntaRequest): Promise<PerguntaResponse> {
    await esperar()
    solicitante('ADMIN')
    validarTipo(buscarSubgrupo(subgrupoId), request.tpResposta)
    const pergunta = { id: novoId(), subgrupoId, ...request }
    banco.perguntas.push(pergunta)
    return copiar(montarPergunta(pergunta))
  },

  // PUT /api/pergunta/{id}
  async atualizar(id: number, request: PerguntaRequest): Promise<PerguntaResponse> {
    await esperar()
    solicitante('ADMIN')
    const pergunta = buscarEntidade(id)
    if (request.tpResposta !== pergunta.tpResposta && temRespostas([id])) {
      throw new ErroApi(409, 'A pergunta já tem respostas registradas: o tipo não pode ser trocado!')
    }
    validarTipo(buscarSubgrupo(pergunta.subgrupoId), request.tpResposta)
    Object.assign(pergunta, request)
    return copiar(montarPergunta(pergunta))
  },

  // DELETE /api/pergunta/{id}
  async excluir(id: number): Promise<void> {
    await esperar()
    solicitante('ADMIN')
    buscarEntidade(id)
    if (temRespostas([id])) {
      throw new ErroApi(409, 'A pergunta já tem respostas registradas e não pode ser excluída!')
    }
    banco.perguntas = banco.perguntas.filter((p) => p.id !== id)
  },
}
