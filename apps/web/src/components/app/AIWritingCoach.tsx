import { useState } from 'react';
import { api } from '@/lib/api';
import type { CoachAnalysis, CoachSuggestion } from '@manuscry/shared';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const TYPE_COLORS: Record<string, string> = {
  pacing: 'bg-blue-900/30 text-blue-400',
  show_dont_tell: 'bg-purple-900/30 text-purple-400',
  dialogue: 'bg-emerald-900/30 text-emerald-400',
  cliche: 'bg-red-900/30 text-red-400',
  repetition: 'bg-orange-900/30 text-orange-400',
  tone: 'bg-amber-900/30 text-amber-400',
  structure: 'bg-cyan-900/30 text-cyan-400',
  general: 'bg-slate-800 text-slate-400',
};

const TYPE_LABELS: Record<string, string> = {
  pacing: 'Ritmo',
  show_dont_tell: 'Mostrar vs Contar',
  dialogue: 'Diálogo',
  cliche: 'Clichê',
  repetition: 'Repetição',
  tone: 'Tom',
  structure: 'Estrutura',
  general: 'Geral',
};

interface Props {
  projectId: string;
  chapterNumber: number | null;
  onClose: () => void;
}

export default function AIWritingCoach({ projectId, chapterNumber, onClose }: Props) {
  const [analysis, setAnalysis] = useState<CoachAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function analyze() {
    if (!projectId || chapterNumber === null) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.post<CoachAnalysis>('/api/collab/coach/analyze', {
        projectId, chapterNumber,
      });
      setAnalysis(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao analisar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed right-0 top-0 bottom-0 w-96 bg-slate-900 border-l border-slate-800 z-40 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Badge className="bg-purple-900/30 text-purple-400">{'\u{1F9E0}'} COACH</Badge>
          <h3 className="text-white font-semibold text-sm">Writing Coach</h3>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-white text-lg">&times;</button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {!analysis && !loading && (
          <div className="text-center py-8">
            <div className="text-3xl mb-3">{'\u{1F9E0}'}</div>
            <p className="text-white text-sm font-medium mb-2">Análise profissional com IA</p>
            <p className="text-slate-400 text-xs mb-4">
              Receba feedback sobre ritmo, diálogo, clichês, repetição e muito mais.
              O coach analisa seu capítulo e sugere melhorias com trechos exatos.
            </p>
            <Button
              onClick={analyze}
              disabled={chapterNumber === null}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white text-sm"
            >
              Analisar capítulo
            </Button>
            {chapterNumber === null && (
              <p className="text-xs text-slate-500 mt-2">Selecione um capítulo primeiro</p>
            )}
          </div>
        )}

        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin w-6 h-6 border-2 border-slate-600 border-t-purple-500 rounded-full mx-auto mb-3" />
            <p className="text-slate-400 text-sm">Analisando seu texto...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-900/30 border border-red-800 text-red-300 p-3 rounded-lg text-xs">{error}</div>
        )}

        {analysis && (
          <div className="space-y-4">
            {/* Score */}
            <div className={`rounded-lg p-4 border ${
              analysis.overall_score >= 7 ? 'border-emerald-800/30 bg-emerald-950/20' :
              analysis.overall_score >= 5 ? 'border-amber-800/30 bg-amber-950/20' :
              'border-red-800/30 bg-red-950/20'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Score geral</span>
                <span className={`text-2xl font-bold ${
                  analysis.overall_score >= 7 ? 'text-emerald-400' :
                  analysis.overall_score >= 5 ? 'text-amber-400' : 'text-red-400'
                }`}>{analysis.overall_score.toFixed(1)}/10</span>
              </div>
            </div>

            {/* Strengths */}
            {analysis.strengths.length > 0 && (
              <div>
                <p className="text-xs text-emerald-400 uppercase mb-2">{'\u2713'} Pontos fortes</p>
                <ul className="space-y-1">
                  {analysis.strengths.map((s, i) => (
                    <li key={i} className="text-xs text-slate-300 pl-4 border-l-2 border-emerald-800/50">{s}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Areas to improve */}
            {analysis.areas_to_improve.length > 0 && (
              <div>
                <p className="text-xs text-amber-400 uppercase mb-2">{'\u26A0\uFE0F'} Áreas para melhorar</p>
                <ul className="space-y-1">
                  {analysis.areas_to_improve.map((s, i) => (
                    <li key={i} className="text-xs text-slate-300 pl-4 border-l-2 border-amber-800/50">{s}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Suggestions */}
            <div>
              <p className="text-xs text-slate-400 uppercase mb-2">Sugestões ({analysis.suggestions.length})</p>
              <div className="space-y-2">
                {analysis.suggestions.map((s: CoachSuggestion) => {
                  const isOpen = expandedId === s.id;
                  return (
                    <div key={s.id} className="border border-slate-700 rounded-lg bg-slate-800/30">
                      <button
                        onClick={() => setExpandedId(isOpen ? null : s.id)}
                        className="w-full text-left p-3 flex items-start gap-2"
                      >
                        <Badge className={`text-[10px] flex-shrink-0 ${TYPE_COLORS[s.type] || TYPE_COLORS.general}`}>
                          {TYPE_LABELS[s.type] || s.type}
                        </Badge>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-white font-medium">{s.title}</p>
                        </div>
                      </button>
                      {isOpen && (
                        <div className="px-3 pb-3 space-y-2">
                          <p className="text-xs text-slate-300">{s.explanation}</p>
                          {s.original_text && (
                            <div>
                              <p className="text-[10px] text-slate-500 uppercase">Trecho:</p>
                              <p className="text-xs text-slate-400 italic bg-slate-800/50 p-2 rounded mt-1">"{s.original_text}"</p>
                            </div>
                          )}
                          {s.suggested_improvement && (
                            <div>
                              <p className="text-[10px] text-emerald-400 uppercase">Sugestão:</p>
                              <p className="text-xs text-emerald-200/80 bg-emerald-950/20 p-2 rounded mt-1">"{s.suggested_improvement}"</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <Button
              onClick={analyze}
              variant="outline"
              disabled={loading}
              className="w-full border-slate-700 text-slate-400 text-xs"
            >
              Reanalisar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
