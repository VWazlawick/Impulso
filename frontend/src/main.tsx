import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { CssBaseline, ThemeProvider } from '@mui/material'
// As fontes vão junto com o site (antes vinham do Google, que ficava sabendo de cada acesso).
// Só os pesos que o tema usa: Fredoka nos títulos, Nunito no texto.
import '@fontsource/fredoka/500.css'
import '@fontsource/fredoka/600.css'
import '@fontsource/nunito/400.css'
import '@fontsource/nunito/600.css'
import '@fontsource/nunito/700.css'
import App from './App.tsx'
import { tema } from './tema.ts'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={tema}>
        <CssBaseline>
            <BrowserRouter>
                <App />
            </BrowserRouter>
        </CssBaseline>
    </ThemeProvider>
  </StrictMode>,
)
