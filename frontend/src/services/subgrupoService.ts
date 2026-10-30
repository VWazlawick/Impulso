import type { SubgrupoRequest, SubgrupoResponse } from '../types/subgrupo.ts'
import { aceita } from '../utils/regras.ts'
import { copiar, esperar, novoId, solicitante } from './exemplo/apoio.ts'
import { banco } from './exemplo/banco.ts'
import { montarSubgrupo, temRespostas } from './exemplo/montar.ts'
import { ErroApi } from './erros.ts'

// Por enquanto usa os dados de exemplo e repete as regras do SubgrupoService.

function buscarEntidade(id: number) {
  const subgrupo = banco.subgrupos.find((s) => s.id === id)
  if (!subgrupo) {
    throw new ErroApi(404, 'Subgrupo não encontrado!')
  }
  return subgrupo
}

export const subgrupoService = {
  // POST /api/grupo/{grupoId}/subgrupo
  async cadastrar(grupoId: number, request: SubgrupoRequest): Promise<SubgrupoResponse> {
    await esperar()
    solicitante('ADMIN')
    if (!banco.grupos.some((g) => g.id === grupoId)) {
      throw new ErroApi(404, 'Grupo não encontrado!')
    }
    const subgrupo = { id: novoId(), grupoId, ...request }
    banco.subgrupos.push(subgrupo)
    return copiar(montarSubgrupo(subgrupo))
  },

  // PUT /api/subgrupo/{id}
  async atualizar(id: number, request: SubgrupoRequest): Promise<SubgrupoResponse> {
    await esperar()
    solicitante('ADMIN')
    const subgrupo = buscarEntidade(id)
    const perguntas = banco.perguntas.filter((p) => p.subgrupoId === id)

    if (request.tpCalculo !== subgrupo.tpCalculo && temRespostas(perguntas.map((p) => p.id))) {
      throw new ErroApi(409, 'O subgrupo já tem respostas registradas: o tipo de cálculo não pode ser trocado!')
    }

    const incompativel = perguntas.find((p) => !aceita(request.tpCalculo, p.tpResposta))
    if (incompativel) {
      throw new ErroApi(
        400,
        `O cálculo ${request.tpCalculo} não aceita as perguntas do tipo ${incompativel.tpResposta} já cadastradas!`,
      )
    }

    Object.assign(subgrupo, request)
    return copiar(montarSubgrupo(subgrupo))
  },

  // DELETE /api/subgrupo/{id}
  async excluir(id: number): Promise<void> {
    await esperar()
    solicitante('ADMIN')
    buscarEntidade(id)
    if (banco.perguntas.some((p) => p.subgrupoId === id)) {
      throw new ErroApi(409, 'Exclua as perguntas antes de excluir o subgrupo!')
    }
    if (banco.classificacoes.some((c) => c.subgrupoId === id)) {
      throw new ErroApi(409, 'Exclua as classificações antes de excluir o subgrupo!')
    }
    banco.subgrupos = banco.subgrupos.filter((s) => s.id !== id)
  },
}
