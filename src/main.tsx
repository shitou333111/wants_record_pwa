import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>

    <App />
  </React.StrictMode>,
)

document.addEventListener("touchend", () => {
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
});