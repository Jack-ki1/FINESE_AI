// Hand-rolled prerender for public marketing routes (§3.3).
//
// The app stays a Vite SPA behind /auth — only the marketing shell gets a
// static, crawler-readable snapshot. Full SSG (vite-react-ssg) is the
// follow-up once shareable session/report links need per-route OG cards.
//
// Usage: npm run build && npm run prerender
// It patches dist/index.html with:
//  - canonical per-route <title>/meta (home)
//  - <noscript> fallback copy so a no-JS crawler/unfurler sees real text
//  - a route manifest comment listing prerendered paths

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const DIST = resolve(process.cwd(), 'dist', 'index.html');

const HOME_TITLE = 'FINESE AI — Verified data analysis, not guesses';
const HOME_DESC =
  'Upload a dataset, ask a question in plain English, get an answer backed by real, server-executed computation — not a language model estimating a number.';

const NOSCRIPT = `<noscript><div style="max-width:40rem;margin:3rem auto;font-family:system-ui;padding:0 1.5rem"><h1>FINESE AI — Verified data analysis, not guesses</h1><p>Upload a spreadsheet, ask in plain English, and get answers backed by real, server-executed computation: correlation, regression, t-tests, forecasting, clustering — each with a receipt.</p><p><a href="/auth?mode=signup">Start free</a> · <a href="/auth">Sign in</a></p></div></noscript>`;

function main() {
  if (!existsSync(DIST)) {
    console.error(`[prerender] ${DIST} not found — run npm run build first.`);
    process.exit(1);
  }
  let html = readFileSync(DIST, 'utf8');

  html = html.replace(/<title>.*?<\/title>/, `<title>${HOME_TITLE}</title>`);
  if (html.includes('name="description"')) {
    html = html.replace(
      /<meta name="description" content="[^"]*">/,
      `<meta name="description" content="${HOME_DESC}">`
    );
  }
  if (!html.includes('<noscript>')) {
    html = html.replace('</head>', `</head>`);
    html = html.replace('<div id="root"></div>', `<div id="root"></div>${NOSCRIPT}`);
  }
  if (!html.includes('prerendered-routes')) {
    html = html.replace('</body>', `<!-- prerendered-routes: / -->\n</body>`);
  }
  writeFileSync(DIST, html);
  console.log('[prerender] dist/index.html patched for / (title, meta, noscript).');
}

main();
