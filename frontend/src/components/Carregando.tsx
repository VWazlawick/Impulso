import { Box, CircularProgress } from '@mui/material'

function Carregando() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
      <CircularProgress aria-label="Carregando" />
    </Box>
  )
}

export default Carregando
