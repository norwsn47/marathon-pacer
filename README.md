# Marathon Pacer

A web app that helps marathon runners plan their race pacing strategy using interactive split sliders and live visualizations.

## Features

- **Interactive pace sliders** — set a target finish time, then adjust pace per 5km (or 5-mile) segment
- **Live chart** — see your pace plan visualized with projected vs target pace per split
- **Strategy presets** — even split, negative split, positive split
- **Summary card** — screenshot-ready race plan summary with full split table
- **Mobile-friendly** — designed for use on a phone on race day

## Getting Started

```bash
npm install
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173).

## Build for Production

```bash
npm run build
```

Output goes to `dist/`. 

## Deploying to Cloudflare Pages

1. Push to GitHub
2. Connect your repo in the [Cloudflare Pages dashboard](https://pages.cloudflare.com/)
3. Set build command: `npm run build`
4. Set output directory: `dist`

Or deploy directly with Wrangler:

```bash
npx wrangler pages deploy dist --project-name marathon-pacer
```

## Tech Stack

- React 18 + TypeScript
- Vite 5
- Tailwind CSS 3
- Recharts 2

## Future Plans

- Passwordless auth via Resend (email magic links)
- Save and load pace plans per user
- Share pace plans via URL
