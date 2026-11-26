import { useMemo, useState } from 'react'
import './App.css'

// Demo rates for the hackathon (not live rates)
export const RATE_HTG_PER_USD = 131
export const FEE_PERCENT = 0.03
export const FEE_FLAT_HTG = 25
export const MIN_HTG = 500
export const MAX_HTG = 100000

export function quote(htg) {
  const amount = Number(htg) || 0
  const fee = amount > 0 ? Math.round(amount * FEE_PERCENT + FEE_FLAT_HTG) : 0
  const net = Math.max(amount - fee, 0)
  const usd = net / RATE_HTG_PER_USD
  return { amount, fee, net, usd }
}

const fmtHTG = (n) => `${Math.round(n).toLocaleString('en-US')} HTG`
const fmtUSD = (n) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

function Breakdown({ q }) {
  return (
    <div className="breakdown">
      <div className="row"><span>Exchange rate</span><span>1 USD = {RATE_HTG_PER_USD} HTG</span></div>
      <div className="row"><span>Fee (3% + 25 HTG)</span><span>{fmtHTG(q.fee)}</span></div>
      <div className="row total"><span>Card receives</span><span>{fmtUSD(q.usd)}</span></div>
    </div>
  )
}

/**
 * variant: 'control'       -> fee and USD amount only shown on the review step
 *          'fees_upfront'  -> live breakdown while typing
 */
export default function App({ variant = 'control', onExposure, onComplete, userId }) {
  const [step, setStep] = useState('amount')
  const [htg, setHtg] = useState('')
  const q = useMemo(() => quote(htg), [htg])
  const upfront = variant === 'fees_upfront'
  const valid = q.amount >= MIN_HTG && q.amount <= MAX_HTG

  return (
    <div className="stage">
      <div className="phone">
        <header className="top">
          <div className="brand"><img src="/logo.png" alt="" />Bous Paw</div>
          <div className="tagline">Top up in gourdes.<br />Pay online in dollars.</div>
          <div className="sub">Add money to your virtual card</div>
        </header>

        {step === 'amount' && (
          <section className="card">
            <label htmlFor="amt">How much do you want to add?</label>
            <div className="input">
              <input
                id="amt"
                inputMode="numeric"
                placeholder="0"
                value={htg}
                onChange={(e) => setHtg(e.target.value.replace(/[^0-9]/g, ''))}
              />
              <span>HTG</span>
            </div>
            <p className={q.amount > MAX_HTG ? 'hint error' : 'hint'}>
              {q.amount > MAX_HTG ? 'Maximum 100,000 HTG per top-up' : 'Min 500 HTG · Max 100,000 HTG · Pay from your MonCash or NatCash mobile wallet'}
            </p>
            {upfront && q.amount > 0 && <Breakdown q={q} />}
            <button disabled={!valid} onClick={() => setStep('review')}>Continue</button>
          </section>
        )}

        {step === 'review' && (
          <section className="card">
            <h2>Review top-up</h2>
            <div className="row big"><span>You pay</span><span>{fmtHTG(q.amount)}</span></div>
            <Breakdown q={q} />
            <button onClick={() => { onComplete?.(q); setStep('done') }}>Confirm top-up</button>
            <button className="ghost" onClick={() => setStep('amount')}>Back</button>
          </section>
        )}

        {step === 'done' && (
          <section className="card done">
            <div className="check">✓</div>
            <h2>{fmtUSD(q.usd)} added to your card</h2>
            <p className="hint">Ready for Netflix, Coursera and more.</p>
            <button onClick={() => { setHtg(''); setStep('amount') }}>New top-up</button>
          </section>
        )}

        <p className="disclaimer">Hackathon demo. Demo rates and fees, no real money moves.</p>
        <footer className="meta">
          <span>variant: <b>{variant}</b></span>
          {userId && <span>user: {userId}</span>}
        </footer>
      </div>
    </div>
  )
}
