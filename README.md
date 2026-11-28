# Bous Paw: Fees Upfront Top-up Experiment

Built for **Toggle Wars: The Flagsmith Experimentation Hackathon** (Track 01, Test Something Real).

Bous Paw lets people in Haiti top up a virtual dollar card in gourdes (HTG, Haiti's currency) from MonCash or NatCash, the two mobile money wallets most people in Haiti use, then pay online for services like Netflix, Coursera and Spotify. Bous Paw is a real product preparing to launch. This repo is a demo of its top-up screen, built to run one experiment well.

> Demo rates and fees only. No real money moves in this app.

**Demo video:** https://youtu.be/IH3evpmlk9M  
**Live app:** https://bouspawexperiment.netlify.app

## The question

When someone tops up their card, when should we show the fee and the exchange rate?

* **control**: the user types an amount in HTG, and only sees the fee, the rate and the dollars their card will receive on the review step.
* **fees_upfront**: the fee, the rate and the dollar amount update live while the user types.

## Hypothesis

Showing the fee, exchange rate and USD amount while the user types (fees_upfront) will increase completed top-ups compared to showing them only at the review step (control), because users trust the price before they commit.

## How it works with Flagsmith

| Piece | What it is |
| --- | --- |
| Flag | `topup_screen`, a multivariate flag. Control is the flag's own value (`control`). One keyed variation: `fees_upfront`. |
| Metric | **Top-up completed**: occurrence of the `topup_completed` event, direction up. |
| Experiment | **Fees upfront on top-up**: 50% fees_upfront, 50% control. |
| Exposure | `flagsmith.getExperimentFlag('topup_screen')` records the exposure when the screen loads. |
| Conversion | `flagsmith.trackEvent('topup_completed', { value: amount })` when the user taps Confirm top-up. |
| Identity | Each visitor gets a stable ID, so exposures and conversions join on the same user. |

The Flagsmith code lives in [`src/flagsmith.js`](src/flagsmith.js). If Flagsmith is unreachable, the app falls back to `control`.

## Traffic

The rules allow simulated traffic, so [`scripts/simulate.mjs`](scripts/simulate.mjs) sends about 1,000 simulated users through the same flag with the Flagsmith Node.js SDK. Every simulated user gets their variant from Flagsmith (a real exposure) and some of them complete a top-up (a real `topup_completed` event).

The conversion rates in the script are **assumptions, not Bous Paw data**: 30% for control and 38% for fees_upfront. They are set to a realistic lift for a pricing transparency change, not an exaggerated one. Real visitors to the app are counted too.

## Results

Final results from the completed Flagsmith experiment (1,044 users):

| Variant | Users | Top-ups | Rate |
| --- | --- | --- | --- |
| control | 509 | 155 | 30.5% |
| fees_upfront | 532 | 210 | 39.5% |

* **Lift:** +29.6% for fees_upfront
* **95% interval:** +7.8% to +51.5%
* **Chance to win:** 99.6%

**What it means:** showing the price before the user commits wins. The 95% interval stays above zero and Flagsmith raised no sample ratio warning, so this is a real result, not noise. It also matches a promise Bous Paw already makes to users: the rate is shown before you confirm.

## Shipping the winner safely

After the experiment ended, fees_upfront was rolled out with the same `topup_screen` flag, in steps, with no redeploy:

1. 10% of users, check the app still works
2. 50% of users
3. 100% of users

**Kill switch:** turning `topup_screen` off in Flagsmith sends every user back to the control screen within seconds, and turning it back on restores fees_upfront. In code this is one check in [`src/flagsmith.js`](src/flagsmith.js): the variant is only used when the flag is enabled.

## What we covered

| Toggle Wars skill | In this project |
| --- | --- |
| Put features behind flags | Both top-up screens behind `topup_screen` |
| Run a real A/B test | 50/50 Flagsmith Experiment with real exposure and conversion events |
| Read the results properly | Lift, 95% interval, chance to win, sample ratio check |
| Roll out to a few users first | 10% to 50% to 100%, plus a kill switch |

## Limitations and next steps

* **Exposure is recorded at page load.** `getExperimentFlag` runs when the screen opens, but the two versions only look different once the user types an amount. Visitors who leave before typing are counted as exposed without seeing the difference. This dilutes both groups equally, so it does not favor fees_upfront: the true lift is likely higher than the +29.4% measured.
* **For the real launch,** Bous Paw would record the exposure only when the fee area is actually on screen, using `trackExposureEvent` at that moment instead of at page load.
* **Traffic was simulated** with assumed conversion rates. The next step is to rerun the same experiment with real Bous Paw users after launch and compare.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:5173. Each browser gets its own visitor ID, so an incognito window may land on the other variant. The variant and visitor ID are shown at the bottom of the screen.

To point it at your own Flagsmith environment, copy `.env.example` to `.env.local` and set `VITE_FLAGSMITH_ENV_KEY` to your client side environment key.

### Simulate traffic

```bash
FLAGSMITH_ENV_KEY=your_client_side_key node scripts/simulate.mjs 1000
```

Then refresh the experiment results in the Flagsmith dashboard (allowed once every 5 minutes).

## Stack

React 19, Vite, `@flagsmith/flagsmith` 12.6 (web), `@flagsmith/nodejs` 9.5 (simulation), Flagsmith Cloud with its built-in warehouse, Netlify.

## Team

Carl Mesidor, Head of Product at Bous Paw. Built with Claude as a coding partner.
