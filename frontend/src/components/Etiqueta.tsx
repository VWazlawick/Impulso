import { Chip } from '@mui/material'
import type { Cor } from '../utils/cores.ts'

type Props = {
  cor: Cor
  texto: string
}

// Selo em formato de pílula, como a faixa etária e o tipo de cálculo.
function Etiqueta({ cor, texto }: Props) {
  return <Chip component="span" label={texto} size="small" sx={{ bgcolor: cor.fundo, color: cor.texto, fontSize: 13 }} />
}

export default Etiqueta
