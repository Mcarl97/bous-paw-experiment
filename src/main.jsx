import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { setupFlagsmith, trackTopup } from './flagsmith.js'

const root = createRoot(document.getElementById('root'))

setupFlagsmith().then(({ userId, variant }) => {
  root.render(
    <StrictMode>
      <App variant={variant} userId={userId} onComplete={trackTopup} />
    </StrictMode>,
  )
})
