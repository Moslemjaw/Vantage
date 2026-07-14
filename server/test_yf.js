import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance();

const topTickers = ['NBK.KW', 'INVALID_TICKER.KW'];
yahooFinance.quote(topTickers)
  .then(res => console.log('success:', res.length))
  .catch(err => {
    console.error('Error fetching:', err.message);
    if (err.result) {
      console.log('Result available even on error:', err.result.length);
    }
  });
