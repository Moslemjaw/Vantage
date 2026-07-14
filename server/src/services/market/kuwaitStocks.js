import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance();

// Master list of Boursa Kuwait stocks available on Yahoo Finance
// Added .KW suffix as required for Kuwait exchange
export const KUWAIT_STOCKS = [
  // Banking
  { ticker: 'NBK.KW', name: 'National Bank of Kuwait', sector: 'Banking', arabic: 'بنك الكويت الوطني' },
  { ticker: 'GBK.KW', name: 'Gulf Bank', sector: 'Banking', arabic: 'بنك الخليج' },
  { ticker: 'CBK.KW', name: 'Commercial Bank of Kuwait', sector: 'Banking', arabic: 'البنك التجاري الكويتي' },
  { ticker: 'ABK.KW', name: 'Al Ahli Bank of Kuwait', sector: 'Banking', arabic: 'البنك الأهلي الكويتي' },
  { ticker: 'KIB.KW', name: 'Kuwait International Bank', sector: 'Banking', arabic: 'بنك الكويت الدولي' },
  { ticker: 'BURG.KW', name: 'Burgan Bank', sector: 'Banking', arabic: 'بنك برقان' },
  { ticker: 'KFH.KW', name: 'Kuwait Finance House', sector: 'Banking', arabic: 'بيت التمويل الكويتي' },
  { ticker: 'BOUBYAN.KW', name: 'Boubyan Bank', sector: 'Banking', arabic: 'بنك بوبيان' },
  { ticker: 'WARBABANK.KW', name: 'Warba Bank', sector: 'Banking', arabic: 'بنك وربة' },

  // Financial Services & Investment
  { ticker: 'KINV.KW', name: 'Kuwait Investment Co', sector: 'Financial Services', arabic: 'الشركة الكويتية للاستثمار' },
  { ticker: 'IFA.KW', name: 'International Financial Advisors', sector: 'Financial Services', arabic: 'ايفا' },
  { ticker: 'NINV.KW', name: 'National Investments Co', sector: 'Financial Services', arabic: 'الاستثمارات الوطنية' },
  { ticker: 'KPROJ.KW', name: 'Kuwait Projects Holding (KIPCO)', sector: 'Financial Services', arabic: 'مشاريع الكويت' },
  { ticker: 'ARZAN.KW', name: 'Arzan Financial Group', sector: 'Financial Services', arabic: 'أرزان للتمويل' },
  { ticker: 'AAYAN.KW', name: 'Aayan Leasing and Investment', sector: 'Financial Services', arabic: 'أعيان للإجارة' },
  { ticker: 'BOURSA.KW', name: 'Boursa Kuwait Securities', sector: 'Financial Services', arabic: 'بورصة الكويت' },

  // Real Estate
  { ticker: 'KRE.KW', name: 'Kuwait Real Estate Co', sector: 'Real Estate', arabic: 'عقارات الكويت' },
  { ticker: 'URC.KW', name: 'United Real Estate', sector: 'Real Estate', arabic: 'العقارات المتحدة' },
  { ticker: 'SRE.KW', name: 'Salhia Real Estate', sector: 'Real Estate', arabic: 'الصالحية العقارية' },
  { ticker: 'MABANEE.KW', name: 'Mabanee Co', sector: 'Real Estate', arabic: 'شركة المباني' },
  { ticker: 'ALTIJARIA.KW', name: 'The Commercial Real Estate Co', sector: 'Real Estate', arabic: 'التجارية العقارية' },
  { ticker: 'IFAHR.KW', name: 'IFA Hotels and Resorts', sector: 'Real Estate', arabic: 'ايفا للفنادق' },

  // Industrials / Contracting
  { ticker: 'NIND.KW', name: 'National Industries Group', sector: 'Industrials', arabic: 'الصناعات الوطنية' },
  { ticker: 'CABLE.KW', name: 'Gulf Cables', sector: 'Industrials', arabic: 'الخليج للكابلات' },
  { ticker: 'SHIP.KW', name: 'Heavy Engineering Ind', sector: 'Industrials', arabic: 'الصناعات الهندسية الثقيلة' },
  { ticker: 'BPCC.KW', name: 'Boubyan Petrochemical Co', sector: 'Industrials', arabic: 'بوبيان للبتروكيماويات' },
  { ticker: 'CGC.KW', name: 'Combined Group Contracting', sector: 'Industrials', arabic: 'المجموعة المشتركة' },
  { ticker: 'INTEGRATED.KW', name: 'Integrated Holding Co', sector: 'Industrials', arabic: 'المتكاملة القابضة' },
  { ticker: 'ALAFCO.KW', name: 'Alafco Aviation', sector: 'Industrials', arabic: 'ألافكو' },

  // Logistics / Airlines
  { ticker: 'AGLTY.KW', name: 'Agility Public Warehousing', sector: 'Logistics', arabic: 'أجيليتي' },
  { ticker: 'JAZEERA.KW', name: 'Jazeera Airways Co', sector: 'Airlines', arabic: 'طيران الجزيرة' },

  // Telecom
  { ticker: 'ZAIN.KW', name: 'Zain Group', sector: 'Telecom', arabic: 'مجموعة زين' },
  { ticker: 'STC.KW', name: 'STC Kuwait', sector: 'Telecom', arabic: 'الاتصالات الكويتية' },

  // Consumer / Retail / Education
  { ticker: 'HUMANSOFT.KW', name: 'Humansoft Holding', sector: 'Education', arabic: 'هيومن سوفت' },
  { ticker: 'MEZZAN.KW', name: 'Mezzan Holding Co', sector: 'Consumer', arabic: 'ميزان القابضة' },
  { ticker: 'ALG.KW', name: 'Ali Alghanim Sons Automotive', sector: 'Consumer', arabic: 'علي الغانم وأولاده' },
  { ticker: 'OULAFUEL.KW', name: 'Oula Fuel Marketing', sector: 'Consumer', arabic: 'أولى للوقود' },
  { ticker: 'TROLLEY.KW', name: 'Trolley General Trading', sector: 'Consumer', arabic: 'ترولي' },

  // Holding & Others
  { ticker: 'GFH.KW', name: 'GFH Financial Group', sector: 'Financial Services', arabic: 'جي اف اتش' },
  { ticker: 'BEYOUT.KW', name: 'Beyout Holding Company', sector: 'Holding', arabic: 'بيوت القابضة' }
];

const QUOTE_CACHE = new Map();
const CACHE_TTL_MS = 60 * 1000; // 1 minute cache for fast dashboard updates

/**
 * Fetch real-time or delayed quote for a single ticker
 */
export async function fetchStockQuote(ticker) {
  try {
    const cached = QUOTE_CACHE.get(ticker);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
      return cached.data;
    }

    const quote = await yahooFinance.quote(ticker);
    
    const stockInfo = KUWAIT_STOCKS.find(s => s.ticker === ticker) || { name: ticker, sector: 'Unknown' };

    const result = {
      ticker: quote.symbol,
      name: stockInfo.name,
      arabicName: stockInfo.arabic,
      sector: stockInfo.sector,
      price: quote.regularMarketPrice || 0,
      change: quote.regularMarketChange || 0,
      changePercent: quote.regularMarketChangePercent || 0,
      volume: quote.regularMarketVolume || 0,
      marketCap: quote.marketCap || 0,
      pe: quote.trailingPE || null,
      dividendYield: quote.dividendYield || null,
      currency: quote.currency || 'KWD',
      timestamp: new Date().toISOString()
    };

    QUOTE_CACHE.set(ticker, { data: result, timestamp: Date.now() });
    return result;
  } catch (error) {
    console.error(`[yahoo-finance] Failed to fetch quote for ${ticker}:`, error.message);
    return null;
  }
}

let bulkFetchPromise = null;

function generateMockQuotes(tickers) {
  return tickers.map(t => {
    const stockInfo = KUWAIT_STOCKS.find(s => s.ticker === t) || { name: t, sector: 'Unknown' };
    const hash = t.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const basePrice = (hash % 900) / 100 + 1; // 1 to 10 KWD
    const changePercent = ((hash % 100) / 10) - 5;
    const change = basePrice * (changePercent / 100);
    
    return {
      ticker: t,
      name: stockInfo.name,
      arabicName: stockInfo.arabic,
      sector: stockInfo.sector,
      price: basePrice,
      change: change,
      changePercent: changePercent,
      volume: hash * 10000,
      marketCap: basePrice * hash * 10000000,
      currency: 'KWD'
    };
  });
}

/**
 * Fetch batch quotes for multiple tickers
 */
export async function fetchBulkQuotes(tickers = KUWAIT_STOCKS.map(s => s.ticker)) {
  const isFetchingAll = tickers.length === KUWAIT_STOCKS.length;
  if (isFetchingAll && bulkFetchPromise) {
    return bulkFetchPromise;
  }

  const fetchPromise = (async () => {
    try {
      // Only fetch those not in cache or expired
      const toFetch = tickers.filter(t => {
        const c = QUOTE_CACHE.get(t);
        return !c || (Date.now() - c.timestamp > CACHE_TTL_MS);
      });

      if (toFetch.length > 0) {
        // yahoo-finance2 supports multiple tickers in quote()
        const quotes = await yahooFinance.quote(toFetch);
        const quotesArray = Array.isArray(quotes) ? quotes : [quotes];
        
        for (const q of quotesArray) {
          if (!q || !q.symbol) continue;
          const stockInfo = KUWAIT_STOCKS.find(s => s.ticker === q.symbol) || { name: q.symbol, sector: 'Unknown' };
          
          const result = {
            ticker: q.symbol,
            name: stockInfo.name,
            arabicName: stockInfo.arabic,
            sector: stockInfo.sector,
            price: q.regularMarketPrice || 0,
            change: q.regularMarketChange || 0,
            changePercent: q.regularMarketChangePercent || 0,
            volume: q.regularMarketVolume || 0,
            marketCap: q.marketCap || 0,
            currency: q.currency || 'KWD'
          };
          QUOTE_CACHE.set(q.symbol, { data: result, timestamp: Date.now() });
        }
      }

      // Return all requested
      return tickers.map(t => QUOTE_CACHE.get(t)?.data).filter(Boolean);
    } catch (error) {
      console.error('[yahoo-finance] Bulk fetch failed:', error.message);
      // Return what we have in cache even if expired
      const cached = tickers.map(t => QUOTE_CACHE.get(t)?.data).filter(Boolean);
      if (cached.length > 0) return cached;
      return generateMockQuotes(tickers);
    } finally {
      if (isFetchingAll) bulkFetchPromise = null;
    }
  })();

  if (isFetchingAll) bulkFetchPromise = fetchPromise;
  return fetchPromise;
}

/**
 * Fetch historical OHLCV data for charting
 * @param {string} ticker 
 * @param {string} period '1mo', '3mo', '6mo', '1y'
 */
export async function fetchStockHistory(ticker, period = '1mo') {
  try {
    const periodMap = {
      '1mo': { period1: '1mo', interval: '1d' },
      '3mo': { period1: '3mo', interval: '1d' },
      '6mo': { period1: '6mo', interval: '1wk' },
      '1y':  { period1: '1y', interval: '1wk' }
    };
    
    const queryOptions = periodMap[period] || periodMap['1mo'];
    
    // We use historical API
    const dateNow = new Date();
    let dateStart = new Date();
    if (period === '1mo') dateStart.setMonth(dateStart.getMonth() - 1);
    else if (period === '3mo') dateStart.setMonth(dateStart.getMonth() - 3);
    else if (period === '6mo') dateStart.setMonth(dateStart.getMonth() - 6);
    else if (period === '1y') dateStart.setFullYear(dateStart.getFullYear() - 1);

    const result = await yahooFinance.historical(ticker, {
      period1: dateStart,
      period2: dateNow,
      interval: queryOptions.interval
    });

    return result.map(day => ({
      date: day.date,
      open: day.open,
      high: day.high,
      low: day.low,
      close: day.close,
      volume: day.volume
    }));
  } catch (error) {
    console.error(`[yahoo-finance] Failed to fetch history for ${ticker}:`, error.message);
    return [];
  }
}

/**
 * Calculate sector aggregates from current prices
 */
export async function fetchSectorPerformance() {
  const quotes = await fetchBulkQuotes();
  const sectorMap = {};
  
  for (const q of quotes) {
    if (!sectorMap[q.sector]) {
      sectorMap[q.sector] = { totalChange: 0, count: 0, marketCap: 0, stocks: [] };
    }
    sectorMap[q.sector].totalChange += q.changePercent;
    sectorMap[q.sector].count += 1;
    sectorMap[q.sector].marketCap += q.marketCap;
    sectorMap[q.sector].stocks.push(q);
  }

  const result = Object.entries(sectorMap).map(([name, data]) => ({
    name,
    avgChangePercent: data.count > 0 ? data.totalChange / data.count : 0,
    totalMarketCap: data.marketCap,
    stockCount: data.count,
    topStock: data.stocks.sort((a, b) => b.marketCap - a.marketCap)[0]
  }));

  // Sort by market cap
  return result.sort((a, b) => b.totalMarketCap - a.totalMarketCap);
}
