import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjectStore } from '@/stores/projectStore';
import { api } from '@/lib/api';
import type { Phase0Data, Phase0Theme } from '@manuscry/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

const FICTION_GENRES = [
  'Romance', 'Suspense / Thriller', 'Ficção Científica', 'Fantasia',
  'Terror / Horror', 'Mistério / Policial', 'Drama', 'Aventura',
  'Dark Romance', 'Comédia Romântica', 'Distopia', 'Ficção Histórica',
];

const NONFICTION_GENRES = [
  'Autoajuda / Desenvolvimento Pessoal', 'Negócios / Empreendedorismo',
  'Finanças Pessoais', 'Produtividade', 'Saúde / Bem-estar',
  'Psicologia', 'Marketing Digital', 'Liderança',
  'Educação / Pedagogia', 'Espiritualidade', 'Biografia',
  'Culinária', 'Tecnologia / IA',
];

const LOADING_MESSAGES = [
  'Analisando tendências de mercado...',
  'Identificando gaps de oportunidade...',
  'Avaliando concorrência no KDP...',
  'Calculando scores de oportunidade...',
  'Preparando recomendações...',
];

export default function Phase0() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentProject, fetchProject, updateProject } = useProjectStore();
  const [analysisData, setAnalysisData] = useState<Phase0Data | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState(0);
  const [error, setError] = useState('');

  // Genre overrides (if user wants to change before analyzing)
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedMarket, setSelectedMarket] = useState<'pt-br' | 'en'>('pt-br');

  useEffect(() => {
    if (id) fetchProject(id);
  }, [id, fetchProject]);

  useEffect(() => {
    if (currentProject) {
      if (currentProject.phase_0_data) {
        setAnalysisData(currentProject.phase_0_data);
      }
      if (currentProject.genre) setSelectedGenre(currentProject.genre);
      if (currentProject.market) setSelectedMarket(currentProject.market);
    }
  }, [currentProject]);

  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setLoadingMsg((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [loading]);

  const genres = currentProject?.genre_mode === 'nonfiction' ? NONFICTION_GENRES : FICTION_GENRES;

  async function runAnalysis() {
    if (!currentProject || !selectedGenre) return;
    setLoading(true);
    setError('');
    setLoadingMsg(0);

    try {
      const result = await api.post<Phase0Data>('/api/pipeline/phase0', {
        projectId: currentProject.id,
        genre: selectedGenre,
        market: selectedMarket,
        genre_mode: currentProject.genre_mode,
      });
      setAnalysisData(result);
      updateProject(currentProject.id, { phase_0_data: result });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro na análise');
    } finally {
      setLoading(false);
    }
  }

  async function selectTheme(index: number) {
    if (!currentProject) return;
    try {
      await api.post('/api/pipeline/phase0/select', {
        projectId: currentProject.id,
        themeIndex: index,
      });
      updateProject(currentProject.id, {
        current_phase: 1,
        phases_completed: [...(currentProject.phases_completed || []), 0],
      });
      navigate(`/projects/${currentProject.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao selecionar tema');
    }
  }

  if (!currentProject) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="text-slate-500">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F172A]">
      <header className="border-b border-slate-800 bg-slate-900/50">
        <div className="max-w-4xl mx-auto px-6 py-5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/projects/${currentProject.id}`)}
            className="text-slate-400 hover:text-white mb-3 -ml-2"
          >
            &larr; Voltar ao Projeto
          </Button>
          <div className="flex items-center gap-3">
            <Badge className="bg-[#1E3A8A]/30 text-[#93C5FD]">FASE 0</Badge>
            <h1 className="text-xl font-bold text-white">Market Analyst</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Análise de mercado KDP para descobrir as melhores oportunidades
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Genre/market selector before analysis */}
        {!analysisData && !loading && (
          <Card className="border-slate-700 bg-slate-900/50 mb-6">
            <CardHeader>
              <CardTitle className="text-white">Configurar análise</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Gênero</Label>
                  <Select value={selectedGenre} onValueChange={(v) => setSelectedGenre(v ?? '')}>
                    <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      {genres.map((g) => (
                        <SelectItem key={g} value={g} className="text-white hover:bg-slate-700">{g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Mercado</Label>
                  <Select value={selectedMarket} onValueChange={(v) => { if (v) setSelectedMarket(v as 'pt-br' | 'en'); }}>
                    <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      <SelectItem value="pt-br" className="text-white">PT-BR (Amazon.com.br)</SelectItem>
                      <SelectItem value="en" className="text-white">EN (Amazon.com)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                onClick={runAnalysis}
                disabled={!selectedGenre}
                className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-medium"
              >
                Analisar Mercado
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Loading */}
        {loading && (
          <Card className="border-slate-700 bg-slate-900/50 text-center py-16">
            <CardContent>
              <div className="animate-spin w-8 h-8 border-4 border-slate-600 border-t-amber-500 rounded-full mx-auto mb-4" />
              <p className="text-white font-medium">{LOADING_MESSAGES[loadingMsg]}</p>
              <p className="text-sm text-slate-500 mt-2">Isso pode levar até 30 segundos</p>
            </CardContent>
          </Card>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-900/30 border border-red-800 text-red-300 p-4 rounded-lg mb-6">
            {error}
            <Button variant="link" onClick={runAnalysis} className="text-red-300 underline ml-2 p-0 h-auto">
              Tentar novamente
            </Button>
          </div>
        )}

        {/* Results */}
        {analysisData && (
          <>
            {/* Market Summary */}
            <Card className="border-slate-700 bg-slate-900/50 mb-6">
              <CardHeader>
                <CardTitle className="text-white text-base">Resumo do Mercado</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300">{analysisData.market_summary}</p>
              </CardContent>
            </Card>

            {/* Theme Cards */}
            <h3 className="text-white font-semibold mb-4">5 Temas Rankeados por Oportunidade</h3>
            <div className="space-y-4 mb-6">
              {analysisData.themes.map((theme: Phase0Theme, index: number) => (
                <Card
                  key={index}
                  className={`border-slate-700 bg-slate-900/50 ${index === 0 ? 'ring-1 ring-amber-500/30 border-amber-800/50' : ''}`}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-slate-500">#{theme.rank}</span>
                          <h4 className="font-semibold text-white">{theme.title}</h4>
                          {index === 0 && (
                            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                              Recomendado
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-500">{theme.genre} &gt; {theme.subgenre}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-amber-400">{theme.opportunity_score.toFixed(1)}</div>
                        <div className="text-xs text-slate-500">score</div>
                      </div>
                    </div>

                    {/* Score bar */}
                    <div className="mb-4">
                      <div className="bg-slate-800 rounded-full h-2">
                        <div
                          className="bg-amber-500 h-2 rounded-full transition-all"
                          style={{ width: `${(theme.opportunity_score / 10) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Details grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-4">
                      <div>
                        <span className="text-slate-500">Demanda</span>
                        <p className="text-slate-300 font-medium">{theme.demand_level}</p>
                      </div>
                      <div>
                        <span className="text-slate-500">Competição</span>
                        <p className="text-slate-300 font-medium">{theme.competition_level}</p>
                      </div>
                      <div>
                        <span className="text-slate-500">Preço BR</span>
                        <p className="text-slate-300 font-medium">{theme.avg_price_brl}</p>
                      </div>
                      <div>
                        <span className="text-slate-500">Preço US</span>
                        <p className="text-slate-300 font-medium">{theme.avg_price_usd}</p>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm mb-4">
                      <p><span className="text-slate-500">Gap:</span> <span className="text-slate-300">{theme.gap_insight}</span></p>
                      <p><span className="text-slate-500">Ângulo:</span> <span className="text-slate-300">{theme.unique_angle}</span></p>
                      <p><span className="text-slate-500">Risco:</span> <span className="text-slate-300">{theme.risk}</span></p>
                    </div>

                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className={theme.evergreen ? 'bg-emerald-900/30 text-emerald-400' : 'bg-orange-900/30 text-orange-400'}>
                        {theme.evergreen ? 'Evergreen' : 'Tendência'}
                      </Badge>
                      <Button
                        onClick={() => selectTheme(index)}
                        size="sm"
                        className="bg-[#1E3A8A] hover:bg-[#1E40AF] text-white"
                      >
                        Selecionar este tema
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Recommendation */}
            <Card className="border-amber-800/30 bg-amber-950/10 mb-6">
              <CardHeader>
                <CardTitle className="text-amber-400 text-base">Recomendação</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-amber-200/80">{analysisData.recommendation}</p>
              </CardContent>
            </Card>

            <div className="text-center">
              <Button variant="ghost" onClick={runAnalysis} className="text-slate-500 hover:text-slate-300">
                Refazer análise
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
