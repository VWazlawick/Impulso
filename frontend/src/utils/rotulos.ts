import type {
  Estagio,
  Sexo,
  TipoCalculo,
  TipoIndicador,
  TipoOpcao,
  TipoResposta,
  TipoServico,
  TipoUsuario,
} from '../types/enums.ts'
import { amarelo, azul, menta, neutro, pessego, rosa, type Cor } from './cores.ts'

// Como cada valor dos enums aparece na tela.

export const tiposDeCalculo: TipoCalculo[] = ['MAIOR_VALOR', 'MENOR_VALOR', 'ESTAGIO', 'NENHUM']

export const rotuloCalculo: Record<TipoCalculo, string> = {
  MAIOR_VALOR: 'Maior valor',
  MENOR_VALOR: 'Menor valor',
  ESTAGIO: 'Estágio',
  NENHUM: 'Nenhum',
}

export const corCalculo: Record<TipoCalculo, Cor> = {
  MAIOR_VALOR: azul,
  MENOR_VALOR: pessego,
  ESTAGIO: menta,
  NENHUM: neutro,
}

export const rotuloResposta: Record<TipoResposta, string> = {
  NUMERO: 'Número',
  SIM_NAO_PARCIAL: 'Sim, não ou parcial',
}

export const opcoes: TipoOpcao[] = ['SIM', 'PARCIAL', 'NAO']

export const rotuloOpcao: Record<TipoOpcao, string> = {
  SIM: 'Sim',
  PARCIAL: 'Parcial',
  NAO: 'Não',
}

export const rotuloEstagio: Record<Estagio, string> = {
  INICIAL: 'Inicial',
  ELEMENTAR: 'Elementar',
  MADURO: 'Maduro',
}

// Aqui a cor tem sentido: do começo (pêssego) ao estágio maduro (menta).
export const corEstagio: Record<Estagio, Cor> = {
  INICIAL: pessego,
  ELEMENTAR: amarelo,
  MADURO: menta,
}

export const indicadores: TipoIndicador[] = ['SUBGRUPO', 'IMC', 'RCE']

export const rotuloIndicador: Record<TipoIndicador, string> = {
  SUBGRUPO: 'Resultado de um teste',
  IMC: 'IMC',
  RCE: 'RCE',
}

export const sexos: Sexo[] = ['FEMININO', 'MASCULINO']

export const rotuloSexo: Record<Sexo, string> = {
  FEMININO: 'Feminino',
  MASCULINO: 'Masculino',
}

export const corSexo: Record<Sexo, Cor> = {
  FEMININO: rosa,
  MASCULINO: azul,
}

export const servicos: TipoServico[] = ['UMA_VEZ_SEMANA', 'DUAS_VEZES_SEMANA', 'DIARIA']

export const rotuloServico: Record<TipoServico, string> = {
  UMA_VEZ_SEMANA: '1 vez por semana',
  DUAS_VEZES_SEMANA: '2 vezes por semana',
  DIARIA: 'Todos os dias',
}

export const rotuloUsuario: Record<TipoUsuario, string> = {
  ADMIN: 'Administração',
  PROFISSIONAL: 'Profissional',
  RESPONSAVEL: 'Responsável',
}
