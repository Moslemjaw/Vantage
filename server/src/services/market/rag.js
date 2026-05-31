// A lightweight TF-IDF style RAG extractor for full articles

export function extractRelevantParagraphs(articles, trigger, sectorFocus) {
  if (!articles || articles.length === 0) return '';

  const keywords = new Set(
    `${trigger} ${sectorFocus !== 'All Sectors' ? sectorFocus : ''}`
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 3)
  );

  const paragraphs = [];

  for (const article of articles) {
    if (!article.body) continue;
    
    // Split into paragraphs roughly
    const chunks = article.body.split(/\n\s*\n/);
    
    for (const chunk of chunks) {
      if (chunk.length < 50) continue; // skip tiny lines
      
      const chunkLower = chunk.toLowerCase();
      let score = 0;
      
      keywords.forEach(kw => {
        const regex = new RegExp(`\\b${kw}\\b`, 'g');
        const matches = chunkLower.match(regex);
        if (matches) {
          score += matches.length;
        }
      });
      
      if (score > 0) {
        paragraphs.push({
          source: article.source,
          date: article.publishedAt ? new Date(article.publishedAt).toISOString().slice(0,10) : 'N/A',
          content: chunk.trim(),
          score
        });
      }
    }
  }

  // Sort by score descending and take top 5
  paragraphs.sort((a, b) => b.score - a.score);
  const topChunks = paragraphs.slice(0, 5);

  if (topChunks.length === 0) {
    return 'No highly relevant specific paragraphs found in the full text.';
  }

  return topChunks.map((p, i) => 
    `[EXTRACTED #${i+1}] (${p.date}) [${p.source}]\n${p.content}`
  ).join('\n\n');
}
