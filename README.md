# MiMo Peak / Off-Peak Status

A single-page static site that answers one question: **is MiMo AI on peak time or
off-peak right now?**

- Reads the current time from the browser (`Date`), so it works in any timezone —
  all peak/off-peak decisions are made on the UTC instant, so a viewer's local
  timezone can never skew the result.
- **Off-peak (night discount):** Beijing 00:00–08:00 = UTC 16:00–24:00,
  consumption coefficient **0.8×**.
- **Peak:** everything else, standard **1.0×** consumption.

## What's on the page

- Live peak / off-peak status and the active consumption coefficient
- Countdown to the next window change (discount starts / discount ends)
- A 24-hour Beijing-time strip with the discount window shaded and a live "now" marker
- Current time in your local zone, Beijing (UTC+8), and UTC
- The pricing rule stated once, at the bottom

## Run locally

Open `index.html` in a browser — no build step, no dependencies.

## Deployed

Hosted on GitHub Pages: https://therealashito.github.io/mimo-peak-check/
