import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjectStore } from '../stores/projectStore';
import { api } from '../lib/api';
import type { Phase0Data, Phase0Theme } from '@manuscry/shared';

const LOADING_MESSAGES = [
  'Analisando tendências de mercado...',
  'Identificando gaps de oportunidade...',
  'Avaliando concorrência...',
  'Calculando scores...',
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

  useEffect(() => {
    if (id) fetchProject(id);
  }, [id, fetchProject]);

  useEffect(() => {
    if (currentProject?.phase_0_data) {
      setAnalysisData(currentProject.phase_0_data);
    }
  }, [currentProject]);

  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setLoadingMsg((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [loading]);

  async function runAnalysis() {
    if (!currentProject) return;
    setLoading(true);
    setError('');

    try {
      const result = await api.post<Phase0Data>('/api/pipeline/phase0', {
        projectId: currentProject.id,
        genre: currentProject.genre,
        market: currentProject.market,
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button
            onClick={() => navigate(`/projects/${currentProject.id}`)}
            className="text-sm text-gray-500 hover:text-gray-700 mb-2"
          >
            &larr; Voltar ao Projeto
          </button>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
              FASE 0
            </span>
            <h1 className="text-xl font-bold text-gray-900">Market Analyst</h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Análise de mercado KDP para{' '}
            <strong>{currentProject.genre}</strong> ({currentProject.market === 'pt-br' ? 'PT-BR' : 'EN'})
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {!analysisData && !loading && (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <div className="text-4xl mb-4">&#128200;</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Pronto para analisar o mercado
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Vamos identificar as melhores oportunidades no gênero{' '}
              <strong>{currentProject.genre}</strong> e recomendar os 5 melhores temas.
            </p>
            <button
              onClick={runAnalysis}
              className="bg-purple-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors"
            >
              Analisar Mercado
            </button>
          </div>
        )}

        {loading && (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <div className="animate-spin w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full mx-auto mb-4" />
            <p className="text-gray-600 font-medium">{LOADING_MESSAGES[loadingMsg]}</p>
            <p className="text-sm text-gray-400 mt-2">Isso pode levar até 30 segundos</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
            {error}
            <button
              onClick={runAnalysis}
              className="ml-4 underline hover:no-underline"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {analysisData && (
          <>
            {/* Market Summary */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">Resumo do Mercado</h3>
              <p className="text-gray-600">{analysisData.market_summary}</p>
            </div>

            {/* Theme Cards */}
            <h3 className="font-semibold text-gray-900 mb-4">
              5 Temas Rankeados por Oportunidade
            </h3>
            <div className="space-y-4 mb-6">
              {analysisData.themes.map((theme: Phase0Theme, index: number) => (
                <ThemeCard
                  key={index}
                  theme={theme}
                  isRecommended={index === 0}
                  onSelect={() => selectTheme(index)}
                />
              ))}
            </div>

            {/* Recommendation */}
            <div className="bg-purple-50 rounded-xl border border-purple-200 p-6">
              <h3 className="font-semibold text-purple-900 mb-2">Recomendação</h3>
              <p className="text-purple-700">{analysisData.recommendation}</p>
            </div>

            {/* Re-analyze button */}
            <div className="text-center mt-6">
              <button
                onClick={runAnalysis}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Refazer análise
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function ThemeCard({
  theme,
  isRecommended,
  onSelect,
}: {
  theme: Phase0Theme;
  isRecommended: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      className={`bg-white rounded-xl border p-5 ${
        isRecommended ? 'border-purple-300 ring-2 ring-purple-100' : 'border-gray-200'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-mono text-gray-400">#{theme.rank}</span>
            <h4 className="font-semibold text-gray-900">{theme.title}</h4>
            {isRecommended && (
              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                Recomendado
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">
            {theme.genre} &gt; {theme.subgenre}
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-purple-600">
            {theme.opportunity_score.toFixed(1)}
          </div>
          <div className="text-xs text-gray-400">score</div>
        </div>
      </div>

      {/* Score bar */}
      <div className="mb-3">
        <div className="bg-gray-100 rounded-full h-2">
          <div
            className="bg-purple-500 h-2 rounded-full transition-all"
            style={{ width: `${(theme.opportunity_score / 10) * 100}%` }}
          />
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-2 gap-3 text-sm mb-3">
        <div>
          <span className="text-gray-400">Demanda:</span>{' '}
          <span className="font-medium">{theme.demand_level}</span>
        </div>
        <div>
          <span className="text-gray-400">Competição:</span>{' '}
          <span className="font-medium">{theme.competition_level}</span>
        </div>
        <div>
          <span className="text-gray-400">Preço BR:</span>{' '}
          <span className="font-medium">{theme.avg_price_brl}</span>
        </div>
        <div>
          <span className="text-gray-400">Preço US:</span>{' '}
          <span className="font-medium">{theme.avg_price_usd}</span>
        </div>
      </div>

      <div className="space-y-2 text-sm mb-4">
        <p>
          <span className="text-gray-400">Gap:</span>{' '}
          <span className="text-gray-700">{theme.gap_insight}</span>
        </p>
        <p>
          <span className="text-gray-400">Ângulo:</span>{' '}
          <span className="text-gray-700">{theme.unique_angle}</span>
        </p>
        <p>
          <span className="text-gray-400">Risco:</span>{' '}
          <span className="text-gray-700">{theme.risk}</span>
        </p>
      </div>

      <div className="flex items-center justify-between">
        <span
          className={`text-xs px-2 py-0.5 rounded-full ${
            theme.evergreen
              ? 'bg-green-100 text-green-700'
              : 'bg-orange-100 text-orange-700'
          }`}
        >
          {theme.evergreen ? 'Evergreen' : 'Tendência'}
        </span>
        <button
          onClick={onSelect}
          className="bg-purple-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
        >
          Selecionar este tema
        </button>
      </div>
    </div>
  );
}
