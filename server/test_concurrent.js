import { fetchBulkQuotes } from './src/services/market/kuwaitStocks.js';

Promise.all([
  fetchBulkQuotes(),
  fetchBulkQuotes(),
  fetchBulkQuotes()
]).then(results => {
  console.log(`Results: ${results[0].length}, ${results[1].length}, ${results[2].length}`);
}).catch(console.error);
