export type Cor = { fundo: string; texto: string }

// Tons pastel com o texto escuro o bastante para ler bem.
export const lilas: Cor = { fundo: '#EFEBFA', texto: '#513C8B' }
export const lavanda: Cor = { fundo: '#E9E2FF', texto: '#5B43B0' }
export const amarelo: Cor = { fundo: '#FFF1C2', texto: '#6B4E00' }
export const pessego: Cor = { fundo: '#FFE1D3', texto: '#8A3B1D' }
export const menta: Cor = { fundo: '#D3F3E4', texto: '#17603F' }
export const azul: Cor = { fundo: '#DCEBFF', texto: '#1D4E89' }
export const rosa: Cor = { fundo: '#FFDDEB', texto: '#8C2457' }
export const neutro: Cor = { fundo: '#F4F0FF', texto: '#4F4677' }
export const perigo: Cor = { fundo: '#FFF0F3', texto: '#A61E3D' }
export const destaque: Cor = { fundo: '#FFD166', texto: '#473B1D' }

const sequencia = [pessego, lavanda, menta, azul, amarelo, rosa]

// Para itens em sequência (grupos, faixas): cada posição ganha um pastel.
export function corDaPosicao(indice: number) {
  return sequencia[indice % sequencia.length]
}
