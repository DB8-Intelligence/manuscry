export function buildPhase0Prompt(genre: string, market: string): string {
  return `Você é um analista especializado em Amazon KDP com acesso a dados de mercado atuais.

Mercado: ${market === 'pt-br' ? 'Amazon.com.br (Brasil, livros em português)' : 'Amazon.com (mercado global em inglês)'}
Gênero solicitado: ${genre}

Execute análise completa em 4 etapas:

1. TENDÊNCIAS ATUAIS
   Identifique os padrões de consumo mais recentes neste gênero no KDP.
   Quais sub-gêneros estão em alta? O que está saturado?

2. ANÁLISE DOS TOP CONCORRENTES
   Descreva os padrões dos livros mais vendidos:
   - Faixa de preço praticada
   - Tamanho médio (palavras/páginas)
   - Padrões de título e subtítulo
   - Elementos visuais de capa dominantes

3. GAP ANALYSIS
   O que os leitores reclamam nos reviews negativos dos top livros?
   Que necessidade não está sendo atendida?
   Qual ângulo único pode diferenciar um novo livro?

4. 5 TEMAS RANKEADOS
   Para cada tema, calcule:
   Score = (Demanda × 0.4) + (Gap Size × 0.35) + (Monetização × 0.25)

   Retorne do score mais alto ao mais baixo.

RETORNE APENAS JSON válido neste formato exato, sem texto fora do JSON:
{
  "market_summary": "string de 2-3 linhas sobre o estado atual do mercado",
  "themes": [
    {
      "rank": 1,
      "title": "nome sugestivo do tema",
      "genre": "gênero KDP exato",
      "subgenre": "sub-gênero específico",
      "opportunity_score": 8.7,
      "demand_level": "alto|médio|baixo",
      "competition_level": "alto|médio|baixo",
      "avg_price_brl": "R$X-Y",
      "avg_price_usd": "$X-Y",
      "gap_insight": "o que falta no mercado",
      "unique_angle": "como diferenciar",
      "risk": "principal risco",
      "evergreen": true
    }
  ],
  "recommendation": "qual tema recomendar e por quê em 2-3 linhas"
}`;
}
