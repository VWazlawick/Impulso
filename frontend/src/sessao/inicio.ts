import type { TipoUsuario } from '../types/enums.ts'

// A primeira tela de cada perfil depois de entrar.
export function inicioDoPerfil(tipo: TipoUsuario) {
  return tipo === 'RESPONSAVEL' ? '/familia' : '/alunos'
}
