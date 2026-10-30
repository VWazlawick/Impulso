import type { GrupoDetalheResponse, GrupoRequest, GrupoResponse } from '../types/grupo.ts'
import { copiar, esperar, novoId, solicitante } from './exemplo/apoio.ts'
import { banco } from './exemplo/banco.ts'
import { montarGrupo, montarGrupoDetalhe } from './exemplo/montar.ts'
import { ErroApi } from './erros.ts'

// Por enquanto usa os dados de exemplo e repete as regras do GrupoService.
// Na ligação com o backend, cada função passa a chamar a rota do comentário,
// e as telas não mudam.

function buscarEntidade(id: number) {
  const grupo = banco.grupos.find((g) => g.id === id)
  if (!grupo) {
    throw new ErroApi(404, 'Grupo não encontrado!')
  }
  return grupo
}

function validarFaixa(request: GrupoRequest, ignorarId: number | null) {
  if (request.nrIdadeMin > request.nrIdadeMax) {
    throw new ErroApi(400, 'A idade mínima não pode ser maior que a máxima!')
  }
  const sobrepoe = banco.grupos.some(
    (g) => g.id !== ignorarId && g.nrIdadeMin <= request.nrIdadeMax && g.nrIdadeMax >= request.nrIdadeMin,
  )
  if (sobrepoe) {
    throw new ErroApi(409, 'A faixa etária se sobrepõe a outro grupo!')
  }
}

export const grupoService = {
  // GET /api/grupo
  async listar(): Promise<GrupoResponse[]> {
    await esperar()
    solicitante('ADMIN', 'PROFISSIONAL')
    return copiar([...banco.grupos].sort((a, b) => a.nrIdadeMin - b.nrIdadeMin).map(montarGrupo))
  },

  // GET /api/grupo/{id}
  async buscarPorId(id: number): Promise<GrupoDetalheResponse> {
    await esperar()
    solicitante('ADMIN', 'PROFISSIONAL')
    return copiar(montarGrupoDetalhe(buscarEntidade(id)))
  },

  // POST /api/grupo
  async cadastrar(request: GrupoRequest): Promise<GrupoResponse> {
    await esperar()
    solicitante('ADMIN')
    validarFaixa(request, null)
    const grupo = { id: novoId(), ...request }
    banco.grupos.push(grupo)
    return copiar(montarGrupo(grupo))
  },

  // PUT /api/grupo/{id}
  async atualizar(id: number, request: GrupoRequest): Promise<GrupoResponse> {
    await esperar()
    solicitante('ADMIN')
    const grupo = buscarEntidade(id)
    validarFaixa(request, id)
    Object.assign(grupo, request)
    return copiar(montarGrupo(grupo))
  },

  // DELETE /api/grupo/{id}
  async excluir(id: number): Promise<void> {
    await esperar()
    solicitante('ADMIN')
    buscarEntidade(id)
    if (banco.subgrupos.some((s) => s.grupoId === id)) {
      throw new ErroApi(409, 'Exclua os subgrupos antes de excluir o grupo!')
    }
    banco.grupos = banco.grupos.filter((g) => g.id !== id)
  },
}
