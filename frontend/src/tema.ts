import { createTheme } from '@mui/material/styles'
import { ptBR } from '@mui/material/locale'

export const fonteTitulo = '"Fredoka", "Nunito", sans-serif'

// A cara do sistema num lugar só: as telas pedem "primary", "secondary" etc.
// e não repetem cor, fonte nem formato.
export const tema = createTheme(
  {
    palette: {
      primary: { main: '#7C5CD6', light: '#EFEBFA', dark: '#513C8B', contrastText: '#FFFFFF' },
      secondary: { main: '#FFD166', light: '#FFEABA', dark: '#F5BE3D', contrastText: '#473B1D' },
      error: { main: '#C2264B' },
      background: { default: '#F7F3FF', paper: '#FFFFFF' },
      text: { primary: '#2E2650', secondary: '#6B6290' },
      divider: '#ECE6FB',
    },
    shape: { borderRadius: 14 },
    typography: {
      fontFamily: '"Nunito", "Arial", sans-serif',
      h1: { fontFamily: fonteTitulo, fontWeight: 600, fontSize: '1.875rem' },
      h2: { fontFamily: fonteTitulo, fontWeight: 600, fontSize: '1.375rem' },
      h3: { fontFamily: fonteTitulo, fontWeight: 600, fontSize: '1.25rem' },
      button: { textTransform: 'none', fontWeight: 700 },
    },
    components: {
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: { root: { borderRadius: 999, minHeight: 44, paddingInline: 20 } },
      },
      MuiCard: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: { borderRadius: 20, border: '1px solid #ECE6FB', boxShadow: '0 6px 18px rgba(91, 67, 176, 0.08)' },
        },
      },
      MuiDialog: {
        styleOverrides: { paper: { borderRadius: 24 } },
      },
      MuiDialogTitle: {
        styleOverrides: { root: { fontFamily: fonteTitulo, fontWeight: 600, fontSize: '1.375rem' } },
      },
      MuiDialogActions: {
        styleOverrides: { root: { padding: '8px 24px 20px' } },
      },
      MuiTextField: {
        defaultProps: { fullWidth: true },
      },
      MuiOutlinedInput: {
        styleOverrides: { notchedOutline: { borderColor: '#DDD5F5', borderWidth: 1.5 } },
      },
      MuiAlert: {
        styleOverrides: { root: { borderRadius: 14, fontWeight: 600 } },
      },
      MuiChip: {
        styleOverrides: { root: { fontWeight: 700 } },
      },
    },
  },
  ptBR,
)
