import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance();

yahooFinance.quote('AAPL').then(res => console.log(Object.keys(res))).catch(console.error);
