import { createTheme } from '@mui/material/styles';

export const appTheme = createTheme({
  palette: {
    mode: 'light',
    background: {
      default: '#f5f5f5'
    },
    primary: {
      main: '#2f2f2f'
    }
  },
  shape: {
    borderRadius: 18
  },
  typography: {
    fontFamily: ['"Roboto"', '"Helvetica"', '"Arial"', 'sans-serif'].join(',')
  }
});