#!/usr/bin/env node
/**
 * generate.cjs - fetch country-extended data from Wikidata SPARQL and
 * merge with curated overrides from overrides.cjs.
 *
 * Outputs:
 *   countries/<ALPHA2>.json   one per country
 *   index.json                array of alpha2 codes
 *   all.json                  array of full records
 *   by-region.json            { africa: [...], asia: [...], ... }
 *
 * Source: Wikidata SPARQL (en.wikipedia infoboxes upstream). CC BY-SA 4.0.
 */
const fs = require('fs');
const path = require('path');
const https = require('https');
const OVERRIDES = require('./overrides.cjs');

const ROOT = path.resolve(__dirname, '..');
const OUT = ROOT;
const COUNTRIES_DIR = path.join(OUT, 'countries');
fs.mkdirSync(COUNTRIES_DIR, { recursive: true });

const ENDPOINT = 'https://query.wikidata.org/sparql';
const UA = 'countries-plus-api/0.1 (https://github.com/oriz-org/countries-plus-api; data@oriz.in)';

const SPARQL = [
  'SELECT DISTINCT ?country ?countryLabel ?iso2 ?iso3 ?isoNum ?motto ?anthemLabel ?inception ?currencyLabel ?continentLabel WHERE {',
  '  { ?country wdt:P31 wd:Q3624078 . }',
  '  UNION { ?country wdt:P31 wd:Q6256 . }',
  '  ?country wdt:P297 ?iso2 .',
  '  OPTIONAL { ?country wdt:P298 ?iso3 . }',
  '  OPTIONAL { ?country wdt:P299 ?isoNum . }',
  '  OPTIONAL { ?country wdt:P1546 ?mottoRaw .',
  '    OPTIONAL { ?mottoRaw rdfs:label ?mottoLabel . FILTER(LANG(?mottoLabel) = "en") }',
  '    BIND(IF(ISLITERAL(?mottoRaw), STR(?mottoRaw), STR(?mottoLabel)) AS ?motto)',
  '  }',
  '  OPTIONAL { ?country wdt:P85 ?anthem . ?anthem rdfs:label ?anthemLabel . FILTER(LANG(?anthemLabel) = "en") }',
  '  OPTIONAL { ?country wdt:P571 ?inception . }',
  '  OPTIONAL { ?country wdt:P38 ?currency . ?currency rdfs:label ?currencyLabel . FILTER(LANG(?currencyLabel) = "en") }',
  '  OPTIONAL { ?country wdt:P30 ?continent . ?continent rdfs:label ?continentLabel . FILTER(LANG(?continentLabel) = "en") }',
  '  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }',
  '}',
].join('\n');

function fetchSparql() {
  return new Promise((resolve, reject) => {
    const url = ENDPOINT + '?format=json&query=' + encodeURIComponent(SPARQL);
    https.get(url, { headers: { 'User-Agent': UA, 'Accept': 'application/sparql-results+json' } }, (res) => {
      if (res.statusCode !== 200) { reject(new Error('HTTP ' + res.statusCode)); return; }
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch (e) { reject(e); } });
    }).on('error', reject);
  });
}

function regionOf(continent) {
  if (!continent) return 'other';
  const c = continent.toLowerCase();
  if (c.includes('africa')) return 'africa';
  if (c.includes('north america')) return 'americas';
  if (c.includes('south america')) return 'americas';
  if (c === 'americas' || c.includes('caribbean')) return 'americas';
  if (c.includes('asia')) return 'asia';
  if (c.includes('europe')) return 'europe';
  if (c.includes('oceania') || c.includes('australia')) return 'oceania';
  if (c.includes('antarctica')) return 'antarctica';
  return 'other';
}

async function main() {
  console.log('[generate] querying Wikidata SPARQL...');
  const j = await fetchSparql();
  const rows = j.results.bindings;
  console.log('[generate] ' + rows.length + ' raw rows');

  const byIso = {};
  for (const r of rows) {
    const iso = r.iso2.value.toUpperCase();
    if (!byIso[iso]) byIso[iso] = [];
    byIso[iso].push(r);
  }

  const records = [];
  for (const iso of Object.keys(byIso)) {
    const group = byIso[iso];
    const pick = (key) => {
      for (const r of group) if (r[key] && r[key].value) return r[key].value;
      return null;
    };
    let bestInception = null;
    for (const r of group) {
      const v = r.inception && r.inception.value;
      if (!v) continue;
      // Pick most recent inception (modern independence/refounding), not earliest predecessor state.
      if (!bestInception || v > bestInception) bestInception = v;
    }
    let motto = null;
    for (const r of group) {
      const v = r.motto && r.motto.value;
      if (!v) continue;
      // Skip entity-URI values (where motto is linked to a Wikidata item rather than literal text).
      if (v.startsWith('http://') || v.startsWith('https://')) continue;
      if (!motto || v.length > motto.length) motto = v;
    }

    const name = pick('countryLabel');
    const iso3 = pick('iso3');
    const isoNum = pick('isoNum');
    const anthem = pick('anthemLabel');
    const currency = pick('currencyLabel');
    const continent = pick('continentLabel');

    let founding_date = null;
    if (bestInception) {
      const m = bestInception.match(/^(-?\d{1,4})-(\d{2})-(\d{2})/);
      if (m) {
        const yyyy = parseInt(m[1], 10);
        founding_date = (yyyy >= 1 ? bestInception.slice(0, 10) : String(yyyy));
      } else {
        founding_date = bestInception.slice(0, 4);
      }
    }

    const rec = {
      alpha2: iso,
      alpha3: iso3 || null,
      numeric: isoNum || null,
      name: name || iso,
      region: regionOf(continent),
      continent: continent || null,
    };
    if (motto) rec.motto = motto;
    if (anthem) rec.national_anthem_title = anthem;
    if (founding_date) rec.founding_date = founding_date;
    if (currency) rec.currency_name = currency;

    const ov = OVERRIDES[iso];
    if (ov) {
      if (ov.motto_translation && ov.motto_translation !== rec.motto) rec.motto_translation = ov.motto_translation;
      if (ov.former_capitals && ov.former_capitals.length) rec.former_capitals = ov.former_capitals;
      if (ov.former_names && ov.former_names.length) rec.former_names = ov.former_names;
      if (ov.currency_symbol) rec.currency_symbol = ov.currency_symbol;
    }

    rec.sources = ['Wikidata / en.wikipedia (CC BY-SA 4.0)'];
    records.push(rec);
  }

  const final = records
    .filter((r) => r.alpha2 && r.alpha2.length === 2 && r.name)
    .sort((a, b) => a.alpha2.localeCompare(b.alpha2));

  for (const rec of final) {
    fs.writeFileSync(path.join(COUNTRIES_DIR, rec.alpha2 + '.json'), JSON.stringify(rec, null, 2) + '\n');
  }
  fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(final.map((r) => r.alpha2), null, 2) + '\n');
  fs.writeFileSync(path.join(OUT, 'all.json'), JSON.stringify(final, null, 2) + '\n');

  const byRegion = {};
  for (const r of final) {
    const reg = r.region || 'other';
    if (!byRegion[reg]) byRegion[reg] = [];
    byRegion[reg].push({ alpha2: r.alpha2, name: r.name });
  }
  for (const reg of Object.keys(byRegion)) byRegion[reg].sort((a, b) => a.name.localeCompare(b.name));
  fs.writeFileSync(path.join(OUT, 'by-region.json'), JSON.stringify(byRegion, null, 2) + '\n');

  const stats = {
    total: final.length,
    with_motto: final.filter((r) => r.motto).length,
    with_motto_translation: final.filter((r) => r.motto_translation).length,
    with_anthem: final.filter((r) => r.national_anthem_title).length,
    with_founding_date: final.filter((r) => r.founding_date).length,
    with_former_capitals: final.filter((r) => r.former_capitals).length,
    with_former_names: final.filter((r) => r.former_names).length,
    with_currency_symbol: final.filter((r) => r.currency_symbol).length,
    by_region: Object.fromEntries(Object.entries(byRegion).map(([k, v]) => [k, v.length])),
  };
  console.log('[generate] field coverage:');
  console.log(JSON.stringify(stats, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });
