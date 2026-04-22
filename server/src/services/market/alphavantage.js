
export async function fetchAlphaVantageData() {
  const apiKey = process.env.ALPHAVANTAGE_API_KEY;
  if (!apiKey) {
    console.warn('[alphavantage] ALPHAVANTAGE_API_KEY not configured.');
    return null;
  }

  // We fetch WTI Crude Oil price as a core macro indicator for Kuwait/GCC
  const url = new URL('https://www.alphavantage.co/query');
  url.searchParams.set('function', 'WTI');
  url.searchParams.set('interval', 'monthly');
  url.searchParams.set('apikey', apiKey);

  try {
    const response = await fetch(url.toString());
    if (!response.ok) return null;

    const data = await response.json();
    if (data && data.data && data.data.length > 0) {
      const latest = data.data[0];
      return {
        indicator: 'WTI Crude Oil',
        date: latest.date,
        value: latest.value,
        unit: 'USD/barrel',
      };
    }
    return null;
  } catch (error) {
    console.error('[alphavantage] Fetch error:', error.message);
    return null;
  }
}
