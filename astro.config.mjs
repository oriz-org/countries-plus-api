// @ts-check
import { defineConfig } from 'astro/config';
import orizFleet from '@oriz/api-fleet-template';

export default defineConfig({
  output: 'static',
  site: 'https://countries-plus.oriz.in',
  integrations: [
    orizFleet({
      apiName: 'countries-plus',
      apiTitle: 'Countries+ API',
      apiDescription: 'Free static API supplementing RestCountries with mottos, founding dates, former capitals, former names. 203 sovereign states.',
      stats: '203 countries · supplements RestCountries · CC0',
      themeColor: 'teal',
      githubRepo: 'oriz-org/countries-plus-api',
      sampleEndpoint: '/countries/IN.json',
      sampleResponse: {
        alpha2: 'IN',
        alpha3: 'IND',
        numeric: '356',
        name: 'India',
        region: 'asia',
        continent: 'Asia',
        motto: 'Satyameva Jayate',
        national_anthem_title: 'Jana Gana Mana',
        founding_date: '1947-08-15',
        currency_name: 'Indian rupee',
        motto_translation: 'Truth alone triumphs',
        former_capitals: ['Calcutta (1858-1911)'],
        currency_symbol: '₹',
        sources: ['Wikidata / en.wikipedia (CC BY-SA 4.0)'],
      },
      dataDirs: ['countries'],
      indexFiles: ['index.json', 'all.json', 'by-region.json'],
    }),
  ],
});
