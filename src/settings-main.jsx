// React entry for the hidden Pengaturan (settings) page. Mounted from settings.html.
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Settings } from './settings/Settings.jsx'
import './styles/tokens.css'
import './styles/app.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Settings />
  </StrictMode>,
)
