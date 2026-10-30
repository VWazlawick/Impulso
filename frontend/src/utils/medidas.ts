// Regras das medidas iguais às do backend (ConversorMedida e validações dos requests).

export function arredondar(valor: number) {
  return Math.round((valor + Number.EPSILON) * 100) / 100
}

// Abaixo de 3 é metro e vira centímetro: 1,35 → 135.
export function paraCentimetros(valor: number | null) {
  return valor !== null && valor < 3 ? arredondar(valor * 100) : valor
}

function maisDeDuasCasas(valor: number) {
  return Math.abs(valor * 100 - Math.round(valor * 100)) > 1e-9
}

type Medidas = {
  vlPeso: number | null
  vlEstatura: number | null
  vlCintura: number | null
}

// Devolve os erros por campo, como o "campos" do erro 400 do backend. Vazio = tudo certo.
// Espera estatura e cintura já em centímetros.
export function validarMedidas({ vlPeso, vlEstatura, vlCintura }: Medidas) {
  const campos: Record<string, string> = {}
  if (vlPeso !== null) {
    if (vlPeso <= 0) {
      campos.vlPeso = 'O peso deve ser maior que zero!'
    } else if (vlPeso >= 1000 || maisDeDuasCasas(vlPeso)) {
      campos.vlPeso = 'O peso aceita até 3 dígitos inteiros e 2 decimais!'
    }
  }
  if (vlEstatura !== null) {
    if (vlEstatura < 30) {
      campos.vlEstatura = 'Estatura inválida: informe em centímetros (135) ou em metros (1.35)!'
    } else if (vlEstatura >= 1000 || maisDeDuasCasas(vlEstatura)) {
      campos.vlEstatura = 'A estatura aceita até 3 dígitos inteiros e 2 decimais!'
    }
  }
  if (vlCintura !== null) {
    if (vlCintura < 20) {
      campos.vlCintura = 'Cintura inválida: informe em centímetros (60) ou em metros (0.60)!'
    } else if (vlCintura >= 1000 || maisDeDuasCasas(vlCintura)) {
      campos.vlCintura = 'A cintura aceita até 3 dígitos inteiros e 2 decimais!'
    }
  }
  return campos
}
