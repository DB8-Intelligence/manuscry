export function buildBookPerformancePrompt(
  bookTitle: string,
  genre: string,
  market: 'pt-br' | 'en',
): { system: string; user: string } {
  const system = `Você é um analista de mercado editorial especializado em Amazon KDP.
Analisa tendências de busca, concorrência e posicionamento de livros.
Retorne APENAS JSON válido.`;

  const user = `Livro: "${bookTitle}"
Gênero: ${genre}
Mercado: ${market === 'pt-br' ? 'Amazon.com.br' : 'Amazon.com'}

Analise o mercado atual para este livro. Retorne este JSON:
{
  "market_trends": [
    {
      "keyword": "keyword relacionada ao gênero/tema",
      "search_volume": "alto|médio|baixo",
      "trend": "rising|stable|declining",
      "competition": "low|medium|high"
    }
  ],
  "competitors": [
    {
      "title": "título do livro concorrente no top 10",
      "author": "autor",
      "bsr": 12345,
      "rating": 4.5,
      "reviews": 234,
      "price": "$9.99"
    }
  ],
  "recommendations": [
    "recomendação prática para melhorar vendas — 1 por linha, 3-5 recomendações"
  ]
}

Gere 5-8 keywords de tendência, 5 concorrentes e 3-5 recomendações.`;

  return { system, user };
}
