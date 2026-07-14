import { fetchBulkQuotes } from './src/services/market/kuwaitStocks.js';

fetchBulkQuotes().then(res => {
  console.log(`Fetched ${res.length} quotes.`);
  if (res.length > 0) {
     console.log('Sample symbol:', res[0].ticker);
  }
}).catch(console.error);
