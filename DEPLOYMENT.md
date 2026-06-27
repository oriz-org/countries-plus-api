# Deployment

Cloudflare Pages serves the site at <https://countries-plus.oriz.in> (custom domain) and the default `countries-plus-api.pages.dev` subdomain.

## CF Pages settings

| Setting | Value |
| --- | --- |
| Production branch | `main` |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | _(empty)_ |
| Node version | `20` or later (`NODE_VERSION=20` env var) |

Astro emits `dist/`. The repo-root JSON data is mirrored into `public/` by `scripts/prebuild.cjs` (runs as the `prebuild` hook before `astro build`), so the final `dist/` includes both the rendered HTML and every JSON endpoint.

## Local verification

```bash
npm install
npm run build
npx serve dist
```

Smoke tests:

```bash
curl http://localhost:3000/countries/IN.json
curl http://localhost:3000/index.json
curl http://localhost:3000/by-region.json
curl -I http://localhost:3000/                  # HTML
curl -I http://localhost:3000/docs/             # HTML
curl -I http://localhost:3000/explorer/         # HTML
```

## Data regeneration

```bash
npm run data           # scripts/generate.cjs + scripts/prebuild.cjs
```

`generate.cjs` hits Wikidata SPARQL and merges curated overrides from `scripts/overrides.cjs`. Commit the regenerated `countries/`, `index.json`, `all.json`, and `by-region.json` at the repo root.

## Custom domain

`countries-plus.oriz.in` is a proxied CNAME to `countries-plus-api.pages.dev`. TLS provisioning takes a few minutes after the first DNS resolution.
