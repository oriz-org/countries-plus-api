# countries-plus-api

Free, static, open-source extended country data &mdash; the fields [RestCountries](https://restcountries.com) doesn't have. For 203 sovereign states.

> **This is a supplement to [RestCountries](https://restcountries.com), not a replacement.** RestCountries already has flag, current capital, population, languages, calling code, borders, region, currency code+symbol. We only carry the fields it lacks: national motto + translation, anthem title, founding date, former capitals, former names. Cross-link by `alpha2` / `alpha3` / `numeric` ISO codes.

Live: <https://countries-plus.oriz.in>

## Endpoints

| Path | Returns |
| --- | --- |
| `/countries/<ALPHA2>.json` | One country record |
| `/index.json` | Array of every alpha2 code |
| `/all.json` | Array of every full record |
| `/by-region.json` | Records grouped by region |

Sample &mdash; `https://countries-plus.oriz.in/countries/IN.json`:

```json
{
  "alpha2": "IN",
  "alpha3": "IND",
  "numeric": "356",
  "name": "India",
  "region": "asia",
  "continent": "Asia",
  "motto": "Satyameva Jayate",
  "motto_translation": "Truth alone triumphs",
  "national_anthem_title": "Jana Gana Mana",
  "founding_date": "1947-08-15",
  "former_capitals": ["Calcutta (1858-1911)"],
  "currency_name": "Indian rupee",
  "currency_symbol": "₹",
  "sources": ["Wikidata / en.wikipedia (CC BY-SA 4.0)"]
}
```

Also mirrored on jsDelivr at `https://cdn.jsdelivr.net/gh/oriz-org/countries-plus-api@main/countries/IN.json`.

## Coverage (203 countries)

| Field | Countries with data |
| --- | --- |
| `alpha2`, `alpha3`, `name`, `region`, `continent` | 203 / 203 |
| `numeric` | 202 / 203 |
| `currency_name` | 203 / 203 |
| `currency_symbol` | 95 / 203 |
| `national_anthem_title` | 202 / 203 |
| `founding_date` | 202 / 203 |
| `motto` | 33 / 203 |
| `motto_translation` | 62 / 203 |
| `former_capitals` | 18 / 203 |
| `former_names` | 59 / 203 |

Wikidata is the upstream; many small countries simply don't have a motto on file. **We don't fabricate** &mdash; missing fields are `null` or `[]`. PRs welcome to add curated entries via `scripts/overrides.cjs`.

## How it's built

1. `scripts/generate.cjs` queries Wikidata SPARQL for every sovereign state (`wd:Q3624078`), plus curated overrides in `scripts/overrides.cjs` for fields Wikidata is thin on (motto translation, former names, currency symbols).
2. The output is split into one file per country (`countries/<ALPHA2>.json`) plus three aggregates (`index.json`, `all.json`, `by-region.json`) at the repo root.
3. `scripts/prebuild.cjs` mirrors the repo-root data into `public/` so Astro picks it up.
4. Astro builds the landing / docs / explorer pages into `dist/`.

Regenerate the dataset:

```bash
npm install
npm run data            # generate.cjs + prebuild.cjs
npm run build           # Astro static build into dist/
```

## Cross-linking with RestCountries

```js
const [base, plus] = await Promise.all([
  fetch('https://restcountries.com/v3.1/alpha/IN').then(r => r.json()).then(a => a[0]),
  fetch('https://countries-plus.oriz.in/countries/IN.json').then(r => r.json()),
]);
const merged = { ...base, ...plus };
// has flag, capital, population (RestCountries) AND motto, founding_date, former_capitals (us).
```

## Credits

- **[RestCountries](https://restcountries.com)** &mdash; the base API this one supplements. Use it for everything we don't have.
- **[Wikidata](https://www.wikidata.org)** &mdash; the upstream for almost all fields (CC0).
- **[Wikipedia infoboxes](https://en.wikipedia.org)** &mdash; consulted for curated overrides (CC BY-SA 4.0).

## License

- Code (`scripts/`, `src/`): [MIT](./LICENSE)
- Data (`countries/`, root `*.json`): [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) (inherited from Wikipedia / Wikidata)

Attribution string: &ldquo;Source: Wikidata / en.wikipedia (CC BY-SA 4.0)&rdquo;.

---

Part of the **oriz fleet** of free, static, open-source APIs:

- [rto.oriz.in](https://rto.oriz.in) &mdash; Indian RTO codes
- [constants.oriz.in](https://constants.oriz.in) &mdash; CODATA 2022 physical constants
- [ragas.oriz.in](https://ragas.oriz.in) &mdash; Carnatic and Hindustani ragas
- [dynasties.oriz.in](https://dynasties.oriz.in) &mdash; Indian dynasties
- [countries-plus.oriz.in](https://countries-plus.oriz.in) &mdash; this one
