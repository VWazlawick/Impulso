import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { CssBaseline, ThemeProvider } from '@mui/material'
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
