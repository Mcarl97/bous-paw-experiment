import flagsmith from '@flagsmith/flagsmith'

// Client-side environment key (public by design). Set in .env.local / Netlify env.
const ENV_KEY = import.meta.env.VITE_FLAGSMITH_ENV_KEY || '9ni44Tko9ght26ehsSasAE' // Development env
export const FLAG = 'topup_screen'
export const CONVERSION_EVENT = 'topup_completed'

// One stable ID per visitor, so exposures and conversions join on the same identity.
function visitorId() {
  try {
    let id = localStorage.getItem('bp_user')
    if (!id) {
      id = `web_${crypto.randomUUID().slice(0, 8)}`
      localStorage.setItem('bp_user', id)
    }
    return id
  } catch {
    return `web_${Math.random().toString(36).slice(2, 10)}`
  }
}

export async function setupFlagsmith() {
  const userId = visitorId()
  try {
    await flagsmith.init({ environmentID: ENV_KEY, enableEvents: true })
    await flagsmith.identify(userId)
    // Records the exposure for this identity and returns the variation.
    const flag = flagsmith.getExperimentFlag(FLAG)
    // Kill switch: if the flag is turned off in Flagsmith, everyone gets control.
    const variant = flag?.enabled && flag.value === 'fees_upfront' ? 'fees_upfront' : 'control'
    // Send buffered events if the tab closes.
    addEventListener('pagehide', () => { flagsmith.flushEvents() })
    return { userId, variant }
  } catch (err) {
    console.warn('Flagsmith unavailable, falling back to control', err)
    return { userId, variant: 'control' }
  }
}

export function trackTopup(q) {
  try {
    flagsmith.trackEvent(CONVERSION_EVENT, { value: q.amount })
    flagsmith.flushEvents()
  } catch (err) {
    console.warn('trackEvent failed', err)
  }
}
