
export async function fetchGNewsLatest(q = 'kuwait', max = 10) {
  const apiKey = process.env.GNEWS_API_KEY;
  if (!apiKey) {
    console.warn('[gnews] GNEWS_API_KEY not configured.');
    return [];
  }

  const url = new URL('https://gnews.io/api/v4/search');
  url.searchParams.set('q', q);
  url.searchParams.set('lang', 'en');
  url.searchParams.set('max', Math.min(10, max).toString());
  url.searchParams.set('apikey', apiKey);
  url.searchParams.set('sortby', 'publishedAt');

  try {
    const response = await fetch(url.toString());
    if (!response.ok) {
      const err = await response.text();
      console.error('[gnews] API Error:', response.status, err);
      return [];
    }

    const data = await response.json();
    return (data.articles || []).map((article) => ({
      externalId: `gnews-${article.url}`,
      headline: article.title,
      body: article.description,
      source: article.source?.name || 'GNews',
      url: article.url,
      publishedAt: article.publishedAt ? new Date(article.publishedAt) : new Date(),
      tag: 'GNEWS',
    }));
  } catch (error) {
    console.error('[gnews] Fetch error:', error.message);
    return [];
  }
}
