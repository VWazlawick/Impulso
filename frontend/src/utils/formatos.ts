export function faixaEtaria(nrIdadeMin: number, nrIdadeMax: number) {
  const unidade = nrIdadeMax === 1 ? 'ano' : 'anos'
  return nrIdadeMin === nrIdadeMax ? `${nrIdadeMax} ${unidade}` : `${nrIdadeMin} a ${nrIdadeMax} ${unidade}`
}

// contar(1, 'pergunta', 'perguntas') → "1 pergunta"; contar(3, ...) → "3 perguntas"
export function contar(quantidade: number, singular: string, plural: string) {
  return `${quantidade} ${quantidade === 1 ? singular : plural}`
}

// 13.5 → "13,5". Sem separador de milhar, para o número voltar igual num campo.
export function formatarNumero(valor: number) {
  return valor.toLocaleString('pt-BR', { useGrouping: false, maximumFractionDigits: 2 })
}

// Número para um campo de texto: 13.5 → "13,5"; vazio quando não tem valor.
export function paraCampo(valor: number | null | undefined) {
  return valor === null || valor === undefined ? '' : formatarNumero(valor)
}

// Aceita vírgula ou ponto ("13,5" ou "13.5"). Devolve null se não for número.
export function lerNumero(texto: string) {
  const limpo = texto.trim().replace(',', '.')
  if (limpo === '') {
    return null
  }
  const numero = Number(limpo)
  return Number.isFinite(numero) ? numero : null
}

// Só inteiros a partir de 0, como idades e ordens.
export function lerInteiro(texto: string) {
  const numero = lerNumero(texto)
  return numero !== null && Number.isInteger(numero) && numero >= 0 ? numero : null
}
