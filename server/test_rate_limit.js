import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance();

async function test() {
  for (let i = 0; i < 10; i++) {
    try {
      const res = await yahooFinance.quote(['NBK.KW', 'GBK.KW']);
      console.log(`Success ${i}: ${res.length}`);
    } catch (err) {
      console.error(`Error ${i}: ${err.message}`);
    }
  }
}
test();
