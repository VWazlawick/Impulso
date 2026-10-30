import { InputAdornment, TextField } from '@mui/material'
import SearchRounded from '@mui/icons-material/SearchRounded'

type Props = {
  rotulo: string
  valor: string
  onMudar: (valor: string) => void
}

function CampoBusca({ rotulo, valor, onMudar }: Props) {
  return (
    <TextField
      label={rotulo}
      value={valor}
      onChange={(e) => onMudar(e.target.value)}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <SearchRounded />
            </InputAdornment>
          ),
        },
      }}
    />
  )
}

export default CampoBusca
