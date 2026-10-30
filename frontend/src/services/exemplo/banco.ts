import type { ClassificacaoRequest } from '../../types/classificacao.ts'
import type { EmpresaResponse } from '../../types/empresa.ts'
import type {
  Sexo,
  TipoCalculo,
  TipoOpcao,
  TipoResposta,
  TipoServico,
  TipoUsuario,
} from '../../types/enums.ts'
import type { PaisResponse } from '../../types/geografia.ts'
import type { GrupoResponse } from '../../types/grupo.ts'

// Dados de exemplo, fictícios. Ficam só na memória do navegador e voltam ao
// início quando a página recarrega. A pasta "exemplo" inteira sai quando o
// backend for ligado: as linhas abaixo imitam as tabelas do banco.

export type UsuarioExemplo = { id: number; email: string; tpUsuario: TipoUsuario; stAtivo: boolean }

export type ProfissionalExemplo = {
  id: number
  nmPessoa: string
  cpf: string
  email: string | null
  usuarioId: number | null
}

export type ResponsavelExemplo = { id: number; nmPessoa: string; nrTelefone: string; usuarioId: number | null }

export type AlunoExemplo = {
  id: number
  nmPessoa: string
  cpf: string | null
  email: string | null
  dtNascimento: string
  tpServico: TipoServico
  profissionalId: number
  sexo: Sexo
  vlPeso: number | null
  vlEstatura: number | null
  vlCintura: number | null
  stAtivo: boolean
  responsaveis: number[]
}

export type EnderecoExemplo = {
  id: number
  alunoId: number
  rua: string
  nrCasa: string
  bairro: string
  cep: string
  complemento: string | null
  cidadeId: number
}

export type SubgrupoExemplo = { id: number; grupoId: number; nmSubgrupo: string; tpCalculo: TipoCalculo; nrOrdem: number }

export type PerguntaExemplo = {
  id: number
  subgrupoId: number
  dsPergunta: string
  tpResposta: TipoResposta
  dsUnidade: string | null
  nrOrdem: number
}

export type ClassificacaoExemplo = ClassificacaoRequest & { id: number }

export type RespostaExemplo = { perguntaId: number; vlResposta: number | null; tpOpcao: TipoOpcao | null }

export type AvaliacaoExemplo = {
  id: number
  alunoId: number
  profissionalId: number
  grupoId: number
  dtAvaliacao: string
  vlPeso: number | null
  vlEstatura: number | null
  vlCintura: number | null
  respostas: RespostaExemplo[]
}

export type EstadoExemplo = { id: number; paisId: number; nmEstado: string; sgEstado: string }
export type CidadeExemplo = { id: number; estadoId: number; nmCidade: string }
export type CepExemplo = { cep: string; rua: string; bairro: string; cidadeId: number }

type Banco = {
  empresa: EmpresaResponse | null
  usuarios: UsuarioExemplo[]
  profissionais: ProfissionalExemplo[]
  responsaveis: ResponsavelExemplo[]
  alunos: AlunoExemplo[]
  enderecos: EnderecoExemplo[]
  grupos: GrupoResponse[]
  subgrupos: SubgrupoExemplo[]
  perguntas: PerguntaExemplo[]
  classificacoes: ClassificacaoExemplo[]
  avaliacoes: AvaliacaoExemplo[]
  paises: PaisResponse[]
  estados: EstadoExemplo[]
  cidades: CidadeExemplo[]
  ceps: CepExemplo[]
}

// Respostas curtinhas para montar as avaliações de exemplo.
const n = (perguntaId: number, vlResposta: number): RespostaExemplo => ({ perguntaId, vlResposta, tpOpcao: null })
const o = (perguntaId: number, tpOpcao: TipoOpcao): RespostaExemplo => ({ perguntaId, vlResposta: null, tpOpcao })

export const banco: Banco = {
  empresa: { id: 1, razaoSocial: 'Espaço Pequenos Passos Ltda', cnpj: '11222333000181' },

  // Contas de exemplo. Aqui qualquer senha serve; o backend confere a senha de verdade.
  usuarios: [
    { id: 1, email: 'adm@academia.com', tpUsuario: 'ADMIN', stAtivo: true },
    { id: 2, email: 'ana.lima@academia.com', tpUsuario: 'PROFISSIONAL', stAtivo: true },
    { id: 3, email: 'bruno.costa@academia.com', tpUsuario: 'PROFISSIONAL', stAtivo: true },
    { id: 4, email: 'fernanda.souza@email.com', tpUsuario: 'RESPONSAVEL', stAtivo: true },
  ],

  profissionais: [
    { id: 101, nmPessoa: 'Ana Lima', cpf: '10020030040', email: 'ana.lima@academia.com', usuarioId: 2 },
    { id: 102, nmPessoa: 'Bruno Costa', cpf: '20030040050', email: 'bruno.costa@academia.com', usuarioId: 3 },
    { id: 103, nmPessoa: 'Carla Mendes', cpf: '30040050060', email: null, usuarioId: null },
  ],

  responsaveis: [
    { id: 301, nmPessoa: 'Fernanda Souza', nrTelefone: '47999990001', usuarioId: 4 },
    { id: 302, nmPessoa: 'Rogério Alves', nrTelefone: '47999990002', usuarioId: null },
    { id: 303, nmPessoa: 'Patrícia Martins', nrTelefone: '4733330003', usuarioId: null },
  ],

  alunos: [
    { id: 201, nmPessoa: 'Lucas Souza', cpf: null, email: null, dtNascimento: '2019-03-14', tpServico: 'DUAS_VEZES_SEMANA', profissionalId: 101, sexo: 'MASCULINO', vlPeso: 24.8, vlEstatura: 124, vlCintura: 56, stAtivo: true, responsaveis: [301] },
    { id: 202, nmPessoa: 'Marina Souza', cpf: null, email: null, dtNascimento: '2021-06-02', tpServico: 'UMA_VEZ_SEMANA', profissionalId: 101, sexo: 'FEMININO', vlPeso: 17.2, vlEstatura: 104, vlCintura: 50, stAtivo: true, responsaveis: [301] },
    { id: 203, nmPessoa: 'Pedro Alves', cpf: '40050060070', email: null, dtNascimento: '2017-09-20', tpServico: 'DIARIA', profissionalId: 101, sexo: 'MASCULINO', vlPeso: 30.5, vlEstatura: 135, vlCintura: 60, stAtivo: true, responsaveis: [302] },
    { id: 204, nmPessoa: 'Júlia Martins', cpf: null, email: null, dtNascimento: '2016-01-10', tpServico: 'DUAS_VEZES_SEMANA', profissionalId: 102, sexo: 'FEMININO', vlPeso: 33, vlEstatura: 142, vlCintura: 62, stAtivo: true, responsaveis: [303] },
    { id: 205, nmPessoa: 'Theo Ramos', cpf: null, email: null, dtNascimento: '2018-11-05', tpServico: 'UMA_VEZ_SEMANA', profissionalId: 101, sexo: 'MASCULINO', vlPeso: 23, vlEstatura: 121, vlCintura: 55, stAtivo: false, responsaveis: [] },
    { id: 206, nmPessoa: 'Sofia Nunes', cpf: null, email: null, dtNascimento: '2019-08-22', tpServico: 'DIARIA', profissionalId: 102, sexo: 'FEMININO', vlPeso: null, vlEstatura: null, vlCintura: null, stAtivo: true, responsaveis: [] },
  ],

  enderecos: [
    { id: 801, alunoId: 201, rua: 'Rua das Palmeiras', nrCasa: '120', bairro: 'Centro', cep: '89010000', complemento: 'Casa', cidadeId: 1 },
    { id: 802, alunoId: 203, rua: 'Rua dos Ipês', nrCasa: '45', bairro: 'Velha', cep: '89036000', complemento: null, cidadeId: 1 },
  ],

  grupos: [
    { id: 1, nmGrupo: 'Grupo 1', nrIdadeMin: 3, nrIdadeMax: 5 },
    { id: 2, nmGrupo: 'Grupo 2', nrIdadeMin: 6, nrIdadeMax: 7 },
    { id: 3, nmGrupo: 'Grupo 3', nrIdadeMin: 8, nrIdadeMax: 9 },
    { id: 4, nmGrupo: 'Grupo 4', nrIdadeMin: 10, nrIdadeMax: 11 },
  ],

  subgrupos: [
    { id: 11, grupoId: 1, nmSubgrupo: 'Equilíbrio', tpCalculo: 'ESTAGIO', nrOrdem: 1 },
    { id: 12, grupoId: 1, nmSubgrupo: 'Salto no lugar', tpCalculo: 'MAIOR_VALOR', nrOrdem: 2 },
    { id: 21, grupoId: 2, nmSubgrupo: 'Salto horizontal', tpCalculo: 'MAIOR_VALOR', nrOrdem: 1 },
    { id: 22, grupoId: 2, nmSubgrupo: 'Corrida', tpCalculo: 'ESTAGIO', nrOrdem: 2 },
    { id: 23, grupoId: 2, nmSubgrupo: 'Quadrado', tpCalculo: 'MENOR_VALOR', nrOrdem: 3 },
    { id: 31, grupoId: 3, nmSubgrupo: 'Arremesso', tpCalculo: 'MAIOR_VALOR', nrOrdem: 1 },
    { id: 32, grupoId: 3, nmSubgrupo: 'Corrida', tpCalculo: 'ESTAGIO', nrOrdem: 2 },
  ],

  perguntas: [
    { id: 111, subgrupoId: 11, dsPergunta: 'Critério 1', tpResposta: 'SIM_NAO_PARCIAL', dsUnidade: null, nrOrdem: 1 },
    { id: 112, subgrupoId: 11, dsPergunta: 'Critério 2', tpResposta: 'SIM_NAO_PARCIAL', dsUnidade: null, nrOrdem: 2 },
    { id: 121, subgrupoId: 12, dsPergunta: 'Tentativa 1', tpResposta: 'NUMERO', dsUnidade: 'cm', nrOrdem: 1 },
    { id: 122, subgrupoId: 12, dsPergunta: 'Tentativa 2', tpResposta: 'NUMERO', dsUnidade: 'cm', nrOrdem: 2 },
    { id: 211, subgrupoId: 21, dsPergunta: 'Tentativa 1', tpResposta: 'NUMERO', dsUnidade: 'cm', nrOrdem: 1 },
    { id: 212, subgrupoId: 21, dsPergunta: 'Tentativa 2', tpResposta: 'NUMERO', dsUnidade: 'cm', nrOrdem: 2 },
    { id: 221, subgrupoId: 22, dsPergunta: 'Critério 1', tpResposta: 'SIM_NAO_PARCIAL', dsUnidade: null, nrOrdem: 1 },
    { id: 222, subgrupoId: 22, dsPergunta: 'Critério 2', tpResposta: 'SIM_NAO_PARCIAL', dsUnidade: null, nrOrdem: 2 },
    { id: 223, subgrupoId: 22, dsPergunta: 'Critério 3', tpResposta: 'SIM_NAO_PARCIAL', dsUnidade: null, nrOrdem: 3 },
    { id: 231, subgrupoId: 23, dsPergunta: 'Tentativa 1', tpResposta: 'NUMERO', dsUnidade: 's', nrOrdem: 1 },
    { id: 232, subgrupoId: 23, dsPergunta: 'Tentativa 2', tpResposta: 'NUMERO', dsUnidade: 's', nrOrdem: 2 },
    { id: 311, subgrupoId: 31, dsPergunta: 'Tentativa 1', tpResposta: 'NUMERO', dsUnidade: 'm', nrOrdem: 1 },
    { id: 312, subgrupoId: 31, dsPergunta: 'Tentativa 2', tpResposta: 'NUMERO', dsUnidade: 'm', nrOrdem: 2 },
    { id: 321, subgrupoId: 32, dsPergunta: 'Critério 1', tpResposta: 'SIM_NAO_PARCIAL', dsUnidade: null, nrOrdem: 1 },
    { id: 322, subgrupoId: 32, dsPergunta: 'Critério 2', tpResposta: 'SIM_NAO_PARCIAL', dsUnidade: null, nrOrdem: 2 },
  ],

  classificacoes: [
    { id: 401, tpIndicador: 'SUBGRUPO', subgrupoId: 12, tpSexo: 'FEMININO', nrIdadeMin: 3, nrIdadeMax: 5, vlInicio: 0, dsClassificacao: 'Fraco' },
    { id: 402, tpIndicador: 'SUBGRUPO', subgrupoId: 12, tpSexo: 'FEMININO', nrIdadeMin: 3, nrIdadeMax: 5, vlInicio: 60, dsClassificacao: 'Razoável' },
    { id: 403, tpIndicador: 'SUBGRUPO', subgrupoId: 12, tpSexo: 'FEMININO', nrIdadeMin: 3, nrIdadeMax: 5, vlInicio: 80, dsClassificacao: 'Bom' },
    { id: 404, tpIndicador: 'SUBGRUPO', subgrupoId: 12, tpSexo: 'MASCULINO', nrIdadeMin: 3, nrIdadeMax: 5, vlInicio: 0, dsClassificacao: 'Fraco' },
    { id: 405, tpIndicador: 'SUBGRUPO', subgrupoId: 12, tpSexo: 'MASCULINO', nrIdadeMin: 3, nrIdadeMax: 5, vlInicio: 65, dsClassificacao: 'Razoável' },
    { id: 406, tpIndicador: 'SUBGRUPO', subgrupoId: 12, tpSexo: 'MASCULINO', nrIdadeMin: 3, nrIdadeMax: 5, vlInicio: 85, dsClassificacao: 'Bom' },
    { id: 501, tpIndicador: 'SUBGRUPO', subgrupoId: 21, tpSexo: 'FEMININO', nrIdadeMin: 6, nrIdadeMax: 7, vlInicio: 0, dsClassificacao: 'Fraco' },
    { id: 502, tpIndicador: 'SUBGRUPO', subgrupoId: 21, tpSexo: 'FEMININO', nrIdadeMin: 6, nrIdadeMax: 7, vlInicio: 95, dsClassificacao: 'Razoável' },
    { id: 503, tpIndicador: 'SUBGRUPO', subgrupoId: 21, tpSexo: 'FEMININO', nrIdadeMin: 6, nrIdadeMax: 7, vlInicio: 115, dsClassificacao: 'Bom' },
    { id: 504, tpIndicador: 'SUBGRUPO', subgrupoId: 21, tpSexo: 'MASCULINO', nrIdadeMin: 6, nrIdadeMax: 7, vlInicio: 0, dsClassificacao: 'Fraco' },
    { id: 505, tpIndicador: 'SUBGRUPO', subgrupoId: 21, tpSexo: 'MASCULINO', nrIdadeMin: 6, nrIdadeMax: 7, vlInicio: 100, dsClassificacao: 'Razoável' },
    { id: 506, tpIndicador: 'SUBGRUPO', subgrupoId: 21, tpSexo: 'MASCULINO', nrIdadeMin: 6, nrIdadeMax: 7, vlInicio: 120, dsClassificacao: 'Bom' },
    { id: 601, tpIndicador: 'IMC', subgrupoId: null, tpSexo: 'FEMININO', nrIdadeMin: 6, nrIdadeMax: 7, vlInicio: 0, dsClassificacao: 'Abaixo do peso' },
    { id: 602, tpIndicador: 'IMC', subgrupoId: null, tpSexo: 'FEMININO', nrIdadeMin: 6, nrIdadeMax: 7, vlInicio: 13.5, dsClassificacao: 'Saudável' },
    { id: 603, tpIndicador: 'IMC', subgrupoId: null, tpSexo: 'FEMININO', nrIdadeMin: 6, nrIdadeMax: 7, vlInicio: 17.5, dsClassificacao: 'Acima do peso' },
    { id: 604, tpIndicador: 'IMC', subgrupoId: null, tpSexo: 'MASCULINO', nrIdadeMin: 6, nrIdadeMax: 7, vlInicio: 0, dsClassificacao: 'Abaixo do peso' },
    { id: 605, tpIndicador: 'IMC', subgrupoId: null, tpSexo: 'MASCULINO', nrIdadeMin: 6, nrIdadeMax: 7, vlInicio: 14, dsClassificacao: 'Saudável' },
    { id: 606, tpIndicador: 'IMC', subgrupoId: null, tpSexo: 'MASCULINO', nrIdadeMin: 6, nrIdadeMax: 7, vlInicio: 18, dsClassificacao: 'Acima do peso' },
    { id: 701, tpIndicador: 'RCE', subgrupoId: null, tpSexo: 'FEMININO', nrIdadeMin: 0, nrIdadeMax: 17, vlInicio: 0, dsClassificacao: 'Adequada' },
    { id: 702, tpIndicador: 'RCE', subgrupoId: null, tpSexo: 'FEMININO', nrIdadeMin: 0, nrIdadeMax: 17, vlInicio: 0.5, dsClassificacao: 'Risco' },
    { id: 703, tpIndicador: 'RCE', subgrupoId: null, tpSexo: 'MASCULINO', nrIdadeMin: 0, nrIdadeMax: 17, vlInicio: 0, dsClassificacao: 'Adequada' },
    { id: 704, tpIndicador: 'RCE', subgrupoId: null, tpSexo: 'MASCULINO', nrIdadeMin: 0, nrIdadeMax: 17, vlInicio: 0.5, dsClassificacao: 'Risco' },
  ],

  avaliacoes: [
    {
      id: 901, alunoId: 201, profissionalId: 101, grupoId: 2, dtAvaliacao: '2025-05-20', vlPeso: 22.9, vlEstatura: 117, vlCintura: 54,
      respostas: [n(211, 96), n(212, 102), o(221, 'NAO'), o(222, 'PARCIAL'), o(223, 'NAO'), n(231, 9.8), n(232, 9.4)],
    },
    {
      id: 902, alunoId: 201, profissionalId: 101, grupoId: 2, dtAvaliacao: '2025-11-10', vlPeso: 23.8, vlEstatura: 120, vlCintura: 55,
      respostas: [n(211, 108), n(212, 112), o(221, 'SIM'), o(222, 'PARCIAL'), o(223, 'NAO'), n(231, 9.1), n(232, 8.8)],
    },
    {
      id: 903, alunoId: 201, profissionalId: 101, grupoId: 2, dtAvaliacao: '2026-05-12', vlPeso: 24.8, vlEstatura: 124, vlCintura: 56,
      respostas: [n(211, 118), n(212, 123), o(221, 'SIM'), o(222, 'SIM'), o(223, 'PARCIAL'), n(231, 8.6), n(232, 8.3)],
    },
    {
      id: 904, alunoId: 202, profissionalId: 101, grupoId: 1, dtAvaliacao: '2026-04-15', vlPeso: 17.2, vlEstatura: 104, vlCintura: 50,
      respostas: [o(111, 'SIM'), o(112, 'PARCIAL'), n(121, 62), n(122, 66)],
    },
    {
      id: 905, alunoId: 203, profissionalId: 101, grupoId: 3, dtAvaliacao: '2026-03-20', vlPeso: 30.5, vlEstatura: 135, vlCintura: 60,
      respostas: [n(311, 6.5), n(312, 7.2), o(321, 'SIM'), o(322, 'NAO')],
    },
  ],

  paises: [{ id: 1, nmPais: 'Brasil', sgPais: 'BR' }],
  estados: [
    { id: 1, paisId: 1, nmEstado: 'Santa Catarina', sgEstado: 'SC' },
    { id: 2, paisId: 1, nmEstado: 'Paraná', sgEstado: 'PR' },
    { id: 3, paisId: 1, nmEstado: 'Rio Grande do Sul', sgEstado: 'RS' },
    { id: 4, paisId: 1, nmEstado: 'São Paulo', sgEstado: 'SP' },
  ],
  cidades: [
    { id: 1, estadoId: 1, nmCidade: 'Blumenau' },
    { id: 2, estadoId: 1, nmCidade: 'Joinville' },
    { id: 3, estadoId: 1, nmCidade: 'Florianópolis' },
    { id: 4, estadoId: 2, nmCidade: 'Curitiba' },
    { id: 5, estadoId: 2, nmCidade: 'Londrina' },
    { id: 6, estadoId: 3, nmCidade: 'Porto Alegre' },
    { id: 7, estadoId: 3, nmCidade: 'Caxias do Sul' },
    { id: 8, estadoId: 4, nmCidade: 'São Paulo' },
    { id: 9, estadoId: 4, nmCidade: 'Campinas' },
  ],

  // CEPs que a busca de exemplo conhece. Os outros dão "CEP não encontrado!".
  ceps: [
    { cep: '89010000', rua: 'Rua das Palmeiras', bairro: 'Centro', cidadeId: 1 },
    { cep: '80010000', rua: 'Rua das Araucárias', bairro: 'Centro', cidadeId: 4 },
    { cep: '01001000', rua: 'Rua do Exemplo', bairro: 'Sé', cidadeId: 8 },
  ],
}
