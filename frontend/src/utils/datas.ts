// Datas no formato do backend: texto "aaaa-mm-dd".

function doisDigitos(numero: number) {
  return String(numero).padStart(2, '0')
}

// Hoje no fuso do computador (não em UTC, que pode virar o dia).
export function hojeIso() {
  const agora = new Date()
  return `${agora.getFullYear()}-${doisDigitos(agora.getMonth() + 1)}-${doisDigitos(agora.getDate())}`
}

// "2026-05-12" → "12/05/2026"
export function formatarData(iso: string) {
  const [ano, mes, dia] = iso.split('-')
  return `${dia}/${mes}/${ano}`
}

// "2026-05-12" → "12/05/26", para eixos de gráfico.
export function formatarDataCurta(iso: string) {
  const [ano, mes, dia] = iso.split('-')
  return `${dia}/${mes}/${ano.slice(2)}`
}

// Anos completos entre as duas datas, como o Period.between do backend.
export function idadeEm(nascimento: string, data: string) {
  const [anoN, mesN, diaN] = nascimento.split('-').map(Number)
  const [anoD, mesD, diaD] = data.split('-').map(Number)
  let anos = anoD - anoN
  if (mesD < mesN || (mesD === mesN && diaD < diaN)) {
    anos -= 1
  }
  return anos
}

export function idadeHoje(nascimento: string) {
  return idadeEm(nascimento, hojeIso())
}
