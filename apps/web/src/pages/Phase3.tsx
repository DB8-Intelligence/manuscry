import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjectStore } from '@/stores/projectStore';
import { usePhase3 } from '@/hooks/usePipeline';
import type { Phase3Data, Phase2Data, ChapterOutline } from '@manuscry/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

const LOADING_MESSAGES = [
  'Calculando estrutura narrativa...',
  'Calibrando curva de tensão...',
  'Criando fichas de capítulo...',
  'Montando mapa narrativo...',
  'Definindo arcos emocionais...',
  'Posicionando sementes narrativas...',
];

const ACT_COLORS: Record<string, string> = {
  act1: 'bg-blue-900/30 text-blue-400',
  act2a: 'bg-amber-900/30 text-amber-400',
  act2b: 'bg-orange-900/30 text-orange-400',
  act3: 'bg-red-900/30 text-red-400',
  intro: 'bg-blue-900/30 text-blue-400',
  development: 'bg-amber-900/30 text-amber-400',
  climax: 'bg-orange-900/30 text-orange-400',
  conclusion: 'bg-emerald-900/30 text-emerald-400',
};

function getActLabel(pos: string): string {
  const labels: Record<string, string> = {
    act1: 'Ato 1', act2a: 'Ato 2A', act2b: 'Ato 2B', act3: 'Ato 3',
    intro: 'Intro', development: 'Desenv.', climax: 'Clímax', conclusion: 'Conclusão',
  };
  return labels[pos] || pos;
}

function TensionTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { chapter: number; tension: number; title: string } }> }) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 text-sm shadow-xl">
      <p className="text-white font-medium">Cap. {d.chapter}: {d.title}</p>
      <p className="text-amber-400">Tensão: {d.tension}/10</p>
    </div>
  );
}

function ChapterCard({ chapter, isExpanded, onToggle }: {
  chapter: ChapterOutline;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const tensionColor =
    chapter.tension_level >= 8 ? 'bg-red-500' :
    chapter.tension_level >= 6 ? 'bg-amber-500' :
    'bg-slate-500';

  return (
    <Card className="border-slate-700 bg-slate-900/50">
      <button onClick={onToggle} className="w-full text-left p-4">
        <div className="flex items-center gap-3">
          <span className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-800 text-slate-300 text-xs flex items-center justify-center font-mono">
            {chapter.number}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium text-white truncate">{chapter.title}</h4>
              <Badge className={`text-xs ${ACT_COLORS[chapter.act_position] || 'bg-slate-800 text-slate-400'}`}>
                {getActLabel(chapter.act_position)}
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <div className="flex items-center gap-1">
                <div className={`w-12 h-1.5 rounded-full bg-slate-800 overflow-hidden`}>
                  <div
                    className={`h-full rounded-full ${tensionColor}`}
                    style={{ width: `${(chapter.tension_level / 10) * 100}%` }}
                  />
                </div>
                <span>{chapter.tension_level}/10</span>
              </div>
              <span>{chapter.estimated_words?.toLocaleString()} palavras</span>
            </div>
          </div>
          <span className="text-slate-500 text-sm flex-shrink-0">
            {isExpanded ? '\u25B2' : '\u25BC'}
          </span>
        </div>
      </button>

      {isExpanded && (
        <CardContent className="pt-0 pb-4 px-4 border-t border-slate-800 mt-0">
          <div className="pl-11 space-y-3 text-sm">
            <div>
              <span className="text-slate-500">Objetivo narrativo:</span>
              <p className="text-slate-200 font-medium">{chapter.narrative_objective}</p>
            </div>
            <div>
              <span className="text-slate-500">Resumo:</span>
              <p className="text-slate-300">{chapter.summary}</p>
            </div>
            {chapter.scenes.length > 0 && (
              <div>
                <span className="text-slate-500">Cenas:</span>
                <ul className="mt-1 space-y-1">
                  {chapter.scenes.map((scene, i) => (
                    <li key={i} className="text-slate-400 flex items-start gap-2">
                      <span className="text-slate-600 mt-0.5">{i + 1}.</span>
                      {scene}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-slate-500">Arco emocional:</span>
                <p className="text-slate-400">
                  {chapter.emotional_arc.start} &rarr; {chapter.emotional_arc.end}
                </p>
              </div>
              {chapter.cliffhanger && (
                <div>
                  <span className="text-slate-500">Cliffhanger:</span>
                  <p className="text-amber-400/80">{chapter.cliffhanger}</p>
                </div>
              )}
            </div>
            {chapter.planted_seeds.length > 0 && (
              <div>
                <span className="text-slate-500">Sementes plantadas:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {chapter.planted_seeds.map((seed, i) => (
                    <Badge key={i} className="bg-slate-800 text-slate-400 text-xs">{seed}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export default function Phase3() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentProject, fetchProject, updateProject } = useProjectStore();
  const phase3 = usePhase3(id || '');

  const [loadingMsg, setLoadingMsg] = useState(0);
  const [expandedChapter, setExpandedChapter] = useState<number | null>(null);
  const [showBookBible, setShowBookBible] = useState(false);

  useEffect(() => {
    if (id) fetchProject(id);
  }, [id, fetchProject]);

  useEffect(() => {
    if (!phase3.loading) return;
    const interval = setInterval(() => {
      setLoadingMsg((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [phase3.loading]);

  const existingData = currentProject?.phase_3_data as Phase3Data | null;
  const resultData = phase3.data || existingData;
  const bookBible = currentProject?.phase_2_data as Phase2Data | null;

  if (!currentProject) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="text-slate-500">Carregando...</div>
      </div>
    );
  }

  async function handleGenerate() {
    const result = await phase3.run();
    if (result && id) {
      updateProject(id, {
        phase_3_data: result,
        current_phase: 4,
        phases_completed: [...(currentProject!.phases_completed || []), 3],
      });
    }
  }

  // Prepare chart data
  const chartData = resultData?.chapters.map((ch) => ({
    chapter: ch.number,
    tension: ch.tension_level,
    title: ch.title,
  })) || [];

  const totalWords = resultData?.chapters.reduce((sum, ch) => sum + (ch.estimated_words || 0), 0) || 0;
  const targetWords = resultData?.total_words_target || 0;
  const wordsDiff = targetWords > 0 ? Math.abs(totalWords - targetWords) / targetWords : 0;
  const wordsOnTarget = wordsDiff <= 0.1;

  return (
    <div className="min-h-screen bg-[#0F172A]">
      <header className="border-b border-slate-800 bg-slate-900/50">
        <div className="max-w-5xl mx-auto px-6 py-5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/projects/${id}`)}
            className="text-slate-400 hover:text-white mb-3 -ml-2"
          >
            &larr; Voltar ao Projeto
          </Button>
          <div className="flex items-center gap-3">
            <Badge className="bg-[#1E3A8A]/30 text-[#93C5FD]">FASE 3</Badge>
            <h1 className="text-xl font-bold text-white">Narrative Architect</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Roteiro completo capítulo a capítulo + mapa de tensão
          </p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Book Bible collapsible reference */}
        {bookBible && (
          <Card className="border-slate-700 bg-slate-900/50">
            <button
              onClick={() => setShowBookBible(!showBookBible)}
              className="w-full text-left px-5 py-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Badge className="bg-slate-800 text-slate-400 text-xs">Fase 2</Badge>
                <span className="text-sm text-slate-300">
                  {bookBible.title} — Book Bible
                </span>
              </div>
              <span className="text-slate-500 text-xs">{showBookBible ? 'Recolher' : 'Expandir'}</span>
            </button>
            {showBookBible && (
              <CardContent className="pt-0 pb-4 border-t border-slate-800">
                <div className="text-sm space-y-2 text-slate-400">
                  <p><span className="text-slate-500">Premissa:</span> {bookBible.premise}</p>
                  <p><span className="text-slate-500">Tom:</span> {bookBible.tone_of_voice}</p>
                  <p><span className="text-slate-500">Capítulos previstos:</span> {bookBible.chapter_count}</p>
                  <p><span className="text-slate-500">Palavras:</span> {bookBible.estimated_word_count?.toLocaleString()}</p>
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {/* Generate button */}
        {!resultData && !phase3.loading && (
          <Card className="border-slate-700 bg-slate-900/50 text-center py-12">
            <CardContent className="space-y-4">
              <div className="text-4xl mb-2">{'\u{1F5FA}'}</div>
              <h3 className="text-lg font-semibold text-white">Gerar roteiro completo</h3>
              <p className="text-sm text-slate-400 max-w-md mx-auto">
                O roteiro define a estrutura de cada capítulo com objetivos claros,
                arcos emocionais e ganchos narrativos.
              </p>
              <Button
                onClick={handleGenerate}
                className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-medium px-8"
              >
                Gerar roteiro
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Loading */}
        {phase3.loading && (
          <Card className="border-slate-700 bg-slate-900/50 text-center py-16">
            <CardContent>
              <div className="animate-spin w-8 h-8 border-4 border-slate-600 border-t-amber-500 rounded-full mx-auto mb-4" />
              <p className="text-white font-medium">{LOADING_MESSAGES[loadingMsg]}</p>
              <p className="text-sm text-slate-500 mt-2">O roteiro completo pode levar até 90 segundos</p>
              <div className="w-48 bg-slate-800 rounded-full h-1.5 mx-auto mt-4">
                <div
                  className="bg-amber-500 h-1.5 rounded-full transition-all duration-[4000ms]"
                  style={{ width: `${Math.min(((loadingMsg + 1) / LOADING_MESSAGES.length) * 100, 95)}%` }}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error */}
        {phase3.error && (
          <div className="bg-red-900/30 border border-red-800 text-red-300 p-4 rounded-lg">
            {phase3.error}
            <Button variant="link" onClick={handleGenerate} className="text-red-300 underline ml-2 p-0 h-auto">
              Tentar novamente
            </Button>
          </div>
        )}

        {/* Results */}
        {resultData && (
          <>
            {/* Word count summary */}
            <Card className="border-slate-700 bg-slate-900/50">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-white">
                      {resultData.structure_type === 'three_act' ? 'Estrutura em 3 Atos' : 'Framework de Transformação'}
                    </h3>
                    <p className="text-sm text-slate-400">
                      {resultData.total_chapters} capítulos
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-medium">
                      {totalWords.toLocaleString()} palavras
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">
                        Meta: {targetWords.toLocaleString()}
                      </span>
                      <Badge className={wordsOnTarget
                        ? 'bg-emerald-900/30 text-emerald-400 text-xs'
                        : 'bg-yellow-900/30 text-yellow-400 text-xs'
                      }>
                        {wordsOnTarget ? 'No alvo' : `${wordsDiff > 0 ? '+' : ''}${Math.round(wordsDiff * 100)}%`}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tension map chart */}
            <Card className="border-slate-700 bg-slate-900/50">
              <CardHeader>
                <CardTitle className="text-white text-base">Mapa de Tensão</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis
                        dataKey="chapter"
                        tick={{ fill: '#94A3B8', fontSize: 12 }}
                        label={{ value: 'Capítulo', position: 'insideBottom', offset: -2, fill: '#64748B', fontSize: 11 }}
                      />
                      <YAxis
                        domain={[0, 10]}
                        tick={{ fill: '#94A3B8', fontSize: 12 }}
                        label={{ value: 'Tensão', angle: -90, position: 'insideLeft', fill: '#64748B', fontSize: 11 }}
                      />
                      <Tooltip content={<TensionTooltip />} />
                      <ReferenceLine y={7} stroke="#F59E0B" strokeDasharray="3 3" opacity={0.3} />
                      <Line
                        type="monotone"
                        dataKey="tension"
                        stroke="#F59E0B"
                        strokeWidth={2}
                        dot={(props: Record<string, unknown>) => {
                          const { cx, cy, payload } = props as { cx: number; cy: number; payload: { tension: number } };
                          const color = payload.tension >= 8 ? '#EF4444' : payload.tension >= 6 ? '#F59E0B' : '#64748B';
                          return <circle cx={cx} cy={cy} r={4} fill={color} stroke="#0F172A" strokeWidth={2} />;
                        }}
                        activeDot={{ r: 6, fill: '#F59E0B', stroke: '#0F172A', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-xs text-slate-500 text-center mt-2">
                  Clique em um capítulo abaixo para ver detalhes
                </p>
              </CardContent>
            </Card>

            {/* Chapter list */}
            <div>
              <h3 className="text-white font-semibold mb-4">
                Capítulos ({resultData.chapters.length})
              </h3>
              <div className="space-y-2">
                {resultData.chapters.map((chapter) => (
                  <ChapterCard
                    key={chapter.number}
                    chapter={chapter}
                    isExpanded={expandedChapter === chapter.number}
                    onToggle={() => setExpandedChapter(
                      expandedChapter === chapter.number ? null : chapter.number,
                    )}
                  />
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center pt-4">
              <Button
                variant="ghost"
                onClick={() => { phase3.reset(); }}
                className="text-slate-500 hover:text-slate-300"
              >
                Refazer roteiro
              </Button>
              <Button
                onClick={() => navigate(`/projects/${id}/phase-4`)}
                className="bg-[#1E3A8A] hover:bg-[#1E40AF] text-white px-8"
              >
                Roteiro aprovado &rarr; iniciar escrita
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
