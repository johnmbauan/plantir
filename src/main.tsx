import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MantineProvider, createTheme } from '@mantine/core'
import '@/index.css'
import App from '@/App'

const theme = createTheme({
  primaryColor: 'plantGreen',
  colors: {
    plantGreen: [
      '#eef4f0',
      '#d8e5dc',
      '#b5ccbc',
      '#8fb39b',
      '#6fa080',
      '#4a7c59',
      '#3d6849',
      '#2d5241',
      '#1f3d30',
      '#1a2e22',
    ],
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MantineProvider theme={theme}>
      <App />
    </MantineProvider>
  </StrictMode>,
)
