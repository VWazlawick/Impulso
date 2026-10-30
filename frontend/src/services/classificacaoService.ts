import type { ClassificacaoRequest, ClassificacaoResponse } from '../types/classificacao.ts'
import type { TipoIndicador } from '../types/enums.ts'
import { formatarNumero } from '../utils/formatos.ts'
import { resultadoNumerico } from '../utils/regras.ts'
import { copiar, esperar, novoId } from './exemplo/apoio.ts'
import { banco, type ClassificacaoExemplo } from './exemplo/banco.ts'
import { montarClassificacao } from './exemplo/montar.ts'
import { ErroApi } from './erros.ts'

// Por enquanto usa os dados de exemplo e repete as regras do ClassificacaoService.

function buscarEntidade(id: number) {
  const classificacao = banco.classificacoes.find((c) => c.id === id)
  if (!classificacao) {
    throw new ErroApi(404, 'Classificação não encontrada!')
  }
  return classificacao
}

function validar(request: ClassificacaoRequest, ignorarId: number | null) {
  if (request.nrIdadeMin > request.nrIdadeMax) {
    throw new ErroApi(400, 'A idade mínima não pode ser maior que a máxima!')
  }

  if (request.tpIndicador !== 'SUBGRUPO') {
    if (request.subgrupoId !== null) {
      throw new ErroApi(400, 'IMC e RCE não usam subgrupo: deixe o subgrupoId vazio!')
    }
  } else {
    if (request.subgrupoId === null) {
      throw new ErroApi(400, 'Informe o subgrupo da classificação!')
    }
    const subgrupo = banco.subgrupos.find((s) => s.id === request.subgrupoId)
    if (!subgrupo) {
      throw new ErroApi(404, 'Subgrupo não encontrado!')
    }
    if (!resultadoNumerico(subgrupo.tpCalculo)) {
      throw new ErroApi(400, 'Só subgrupos com cálculo MAIOR_VALOR ou MENOR_VALOR têm classificação!')
    }
  }

  const repetida = banco.classificacoes.some(
    (faixa) =>
      faixa.id !== ignorarId &&
      faixa.tpIndicador === request.tpIndicador &&
      faixa.subgrupoId === request.subgrupoId &&
      faixa.tpSexo === request.tpSexo &&
      faixa.nrIdadeMin <= request.nrIdadeMax &&
      faixa.nrIdadeMax >= request.nrIdadeMin &&
      faixa.vlInicio === request.vlInicio,
  )
  if (repetida) {
    throw new ErroApi(
      409,
      `Já existe uma faixa começando em ${formatarNumero(request.vlInicio)} para esse sexo e essas idades!`,
    )
  }
}

// Mesma ordem do backend: sexo, idade mínima e valor de início.
function ordenar(a: ClassificacaoExemplo, b: ClassificacaoExemplo) {
  return a.tpSexo.localeCompare(b.tpSexo) || a.nrIdadeMin - b.nrIdadeMin || a.vlInicio - b.vlInicio
}

export const classificacaoService = {
  // GET /api/classificacao?tpIndicador=...&subgrupoId=...
  async listar(tpIndicador: TipoIndicador, subgrupoId: number | null): Promise<ClassificacaoResponse[]> {
    await esperar()
    const faixas = banco.classificacoes
      .filter((c) => c.tpIndicador === tpIndicador && c.subgrupoId === subgrupoId)
      .sort(ordenar)
      .map(montarClassificacao)
    return copiar(faixas)
  },

  // POST /api/classificacao
  async cadastrar(request: ClassificacaoRequest): Promise<ClassificacaoResponse> {
    await esperar()
    validar(request, null)
    const classificacao = { id: novoId(), ...request }
    banco.classificacoes.push(classificacao)
    return copiar(montarClassificacao(classificacao))
  },

  // PUT /api/classificacao/{id}
  async atualizar(id: number, request: ClassificacaoRequest): Promise<ClassificacaoResponse> {
    await esperar()
    const classificacao = buscarEntidade(id)
    validar(request, id)
    Object.assign(classificacao, request)
    return copiar(montarClassificacao(classificacao))
  },

  // DELETE /api/classificacao/{id}
  async excluir(id: number): Promise<void> {
    await esperar()
    buscarEntidade(id)
    banco.classificacoes = banco.classificacoes.filter((c) => c.id !== id)
  },
}
