// Simulates visitors going through the Bous Paw top-up flow.
// Each simulated user gets their variant from Flagsmith (recording an exposure),
// and a share of them complete the top-up (recording a topup_completed event).
//
// The conversion rates below are ASSUMPTIONS for the demo, not real Bous Paw data.
//
// Usage: FLAGSMITH_ENV_KEY=<client key> node scripts/simulate.mjs [users]
import { Flagsmith } from '@flagsmith/nodejs'

const ENV_KEY = process.env.FLAGSMITH_ENV_KEY
const USERS = Number(process.argv[2] || 1000)
const RATES = { control: 0.30, fees_upfront: 0.38 }
const RUN = Date.now().toString(36)

if (!ENV_KEY) {
  console.error('Set FLAGSMITH_ENV_KEY')
  process.exit(1)
}

const flagsmith = new Flagsmith({ environmentKey: ENV_KEY, enableEvents: true })
const stats = {
  control: { users: 0, conversions: 0 },
  fees_upfront: { users: 0, conversions: 0 },
}

async function simulate(i) {
  const id = `sim_${RUN}_${i}`
  const flag = await flagsmith.getExperimentFlag('topup_screen', id)
  const variant = flag.value === 'fees_upfront' ? 'fees_upfront' : 'control'
  stats[variant].users++
  if (Math.random() < RATES[variant]) {
    const amount = 500 + Math.round(Math.random() * 30) * 100 // 500–3,500 HTG
    flagsmith.trackEvent('topup_completed', { identifier: id, value: amount })
    stats[variant].conversions++
  }
}

const BATCH = 25
for (let i = 0; i < USERS; i += BATCH) {
  await Promise.all(
    Array.from({ length: Math.min(BATCH, USERS - i) }, (_, k) => simulate(i + k)),
  )
  process.stdout.write(`\r${Math.min(i + BATCH, USERS)}/${USERS} users`)
}
await flagsmith.close()

console.log('\n')
for (const [v, s] of Object.entries(stats)) {
  const rate = s.users ? ((s.conversions / s.users) * 100).toFixed(1) : '0'
  console.log(`${v.padEnd(13)} ${s.users} users, ${s.conversions} top-ups (${rate}%)`)
}
