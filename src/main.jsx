import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App'

// Register service worker for PWA support (enables Chrome install button)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // SW registration failed — non-critical
    })
  })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
