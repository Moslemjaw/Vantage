import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance();

export async function fetchYahooNewsMiddleEast(max = 10) {
  try {
    const res = await yahooFinance.search('Middle East', { newsCount: max });
    return (res.news || []).map((article) => ({
      externalId: `yahoo-${article.uuid || Math.random().toString()}`,
      headline: article.title,
      body: article.title, 
      source: article.publisher || 'Yahoo News',
      url: article.link,
      publishedAt: article.providerPublishTime ? new Date(article.providerPublishTime) : new Date(),
      tag: 'MIDDLE EAST',
    }));
  } catch (error) {
    console.error('[yahooNews] Fetch error:', error.message);
    return [];
  }
}
