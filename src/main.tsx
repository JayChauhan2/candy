import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import KingdomHome from './KingdomHome'
import './reset.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode><KingdomHome /></StrictMode>,
)
