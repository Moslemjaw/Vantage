import { fetchSectorPerformance } from './src/services/market/kuwaitStocks.js';

fetchSectorPerformance().then(res => {
  console.log(`Fetched ${res.length} sectors.`);
  if (res.length > 0) console.log(res[0].name, res[0].avgChangePercent);
}).catch(err => {
  console.error('Fetch error:', err.message);
});
