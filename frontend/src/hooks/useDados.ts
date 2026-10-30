import { useEffect, useRef, useState, type DependencyList } from 'react'
import { mensagemDeErro } from '../services/erros.ts'

type Estado<T> = {
  chave: string | null
  dados: T | null
  erro: string
}

// Busca dados quando a tela abre e de novo quando as dependências mudam
// (por exemplo, o filtro escolhido). recarregar() busca outra vez sem
// esconder o que já está na tela, como depois de salvar ou excluir.
export function useDados<T>(buscar: () => Promise<T>, dependencias: DependencyList) {
  const chave = JSON.stringify(dependencias)
  const [estado, setEstado] = useState<Estado<T>>({ chave: null, dados: null, erro: '' })
  const [versao, setVersao] = useState(0)

  // Guarda a função de busca mais recente; quem decide quando buscar é a chave.
  const buscarAtual = useRef(buscar)
  useEffect(() => {
    buscarAtual.current = buscar
  })

  useEffect(() => {
    let ativo = true
    buscarAtual
      .current()
      .then((dados) => {
        if (ativo) setEstado({ chave, dados, erro: '' })
      })
      .catch((erro: unknown) => {
        if (ativo) setEstado({ chave, dados: null, erro: mensagemDeErro(erro) })
      })
    return () => {
      ativo = false
    }
  }, [chave, versao])

  const atual = estado.chave === chave
  return {
    dados: atual ? estado.dados : null,
    erro: atual ? estado.erro : '',
    carregando: !atual,
    recarregar: () => setVersao((anterior) => anterior + 1),
  }
}
