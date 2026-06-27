// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  output: 'static',
  site: 'https://countries-plus.oriz.in',
  vite: {
    plugins: [tailwindcss()],
  },
});
