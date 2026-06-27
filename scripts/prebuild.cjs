#!/usr/bin/env node
/**
 * prebuild.cjs - mirror repo-root data dir into public/ so Astro includes
 * it in dist/. Keeps canonical data at repo root for jsDelivr URL stability.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PUB = path.join(ROOT, 'public');

const ENTRIES = ['countries', 'all.json', 'index.json', 'by-region.json'];

function mirror(src, dst) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dst, { recursive: true });
    for (const name of fs.readdirSync(src)) {
      mirror(path.join(src, name), path.join(dst, name));
    }
    return;
  }
  try { fs.unlinkSync(dst); } catch {}
  try {
    fs.linkSync(src, dst);
  } catch {
    fs.copyFileSync(src, dst);
  }
}

fs.mkdirSync(PUB, { recursive: true });

for (const entry of ENTRIES) {
  const src = path.join(ROOT, entry);
  const dst = path.join(PUB, entry);
  if (!fs.existsSync(src)) {
    console.warn('[prebuild] missing: ' + src + ' - skipping');
    continue;
  }
  if (fs.existsSync(dst) && fs.statSync(dst).isDirectory()) {
    fs.rmSync(dst, { recursive: true, force: true });
  }
  mirror(src, dst);
  console.log('[prebuild] mirrored ' + entry + ' -> public/' + entry);
}

console.log('[prebuild] done');
