import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjectStore } from '@/stores/projectStore';
import { usePhase1 } from '@/hooks/usePipeline';
import type { Phase0Theme, Phase1Data, AuthorAnswers } from '@manuscry/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';

const LOADING_MESSAGES = [
  'Validando posicionamento no mercado...',
  'Definindo seu Unique Book Angle...',
  'Calculando fit com o nicho...',
  'Analisando concorrência direta...',
  'Preparando perfil do livro...',
];

export default function Phase1() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentProject, fetchProject, updateProject } = useProjectStore();
  const phase1 = usePhase1(id || '');

  const [loadingMsg, setLoadingMsg] = useState(0);
  const [answers, setAnswers] = useState<AuthorAnswers>({
    experience: '',
    angle: '',
    audience: '',
  });

  useEffect(() => {
    if (id) fetchProject(id);
  }, [id, fetchProject]);

  useEffect(() => {
    if (!phase1.loading) return;
    const interval = setInterval(() => {
      setLoadingMsg((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [phase1.loading]);

  // If phase 1 data already exists, show results
  const existingData = currentProject?.phase_1_data as Phase1Data | null;
  const resultData = phase1.data || existingData;

  const phase0Data = currentProject?.phase_0_data as (
    { selected_theme?: Phase0Theme } & Record<string, unknown>
  ) | null;
  const selectedTheme = phase0Data?.selected_theme;

  if (!currentProject) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="text-slate-500">Carregando...</div>
      </div>
    );
  }

  async function handleSubmit() {
    if (!answers.experience || !answers.angle || !answers.audience) return;
    const result = await phase1.run(answers);
    if (result && id) {
      updateProject(id, {
        phase_1_data: result,
        current_phase: 2,
        phases_completed: [...(currentProject!.phases_completed || []), 1],
      });
    }
  }

  function handleAdvance() {
    navigate(`/projects/${id}/phase-2`);
  }

  return (
    <div className="min-h-screen bg-[#0F172A]">
      <header className="border-b border-slate-800 bg-slate-900/50">
        <div className="max-w-4xl mx-auto px-6 py-5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/projects/${id}`)}
            className="text-slate-400 hover:text-white mb-3 -ml-2"
          >
            &larr; Voltar ao Projeto
          </Button>
          <div className="flex items-center gap-3">
            <Badge className="bg-[#1E3A8A]/30 text-[#93C5FD]">FASE 1</Badge>
            <h1 className="text-xl font-bold text-white">Theme Selector</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Valide seu tema e defina o Unique Book Angle
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Selected theme from Phase 0 */}
        {selectedTheme && (
          <Card className="border-slate-700 bg-slate-900/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-base">Tema selecionado</CardTitle>
                <Badge className="bg-slate-800 text-slate-400 text-xs">Da Fase 0</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <h3 className="font-semibold text-white mb-2">{selectedTheme.title}</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
                <div>
                  <span className="text-slate-500">Score</span>
                  <p className="text-amber-400 font-bold">{selectedTheme.opportunity_score?.toFixed(1)}</p>
                </div>
                <div>
                  <span className="text-slate-500">Demanda</span>
                  <p className="text-slate-300">{selectedTheme.demand_level}</p>
                </div>
                <div>
                  <span className="text-slate-500">Competição</span>
                  <p className="text-slate-300">{selectedTheme.competition_level}</p>
                </div>
                <div>
                  <span className="text-slate-500">Evergreen</span>
                  <p className="text-slate-300">{selectedTheme.evergreen ? 'Sim' : 'Não'}</p>
                </div>
              </div>
              <p className="text-sm text-slate-400">
                <span className="text-slate-500">Gap:</span> {selectedTheme.gap_insight}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Author questions form — only if no result yet */}
        {!resultData && !phase1.loading && (
          <Card className="border-slate-700 bg-slate-900/50">
            <CardHeader>
              <CardTitle className="text-white text-base">Sobre você e seu livro</CardTitle>
              <p className="text-sm text-slate-400">
                Suas respostas nos ajudam a criar um posicionamento único e autêntico
              </p>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label className="text-slate-300">
                  Você tem experiência pessoal com este tema?
                </Label>
                <p className="text-xs text-slate-500">
                  Vivências reais criam autenticidade. Pode ser profissional, acadêmica ou pessoal.
                </p>
                <textarea
                  value={answers.experience}
                  onChange={(e) => setAnswers({ ...answers, experience: e.target.value })}
                  placeholder="Ex: Trabalho como terapeuta há 10 anos e atendo pacientes com esse perfil..."
                  rows={3}
                  className="w-full rounded-lg bg-slate-800 border border-slate-600 text-white placeholder:text-slate-500 px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">
                  Qual ângulo único você quer explorar?
                </Label>
                <p className="text-xs text-slate-500">
                  O que torna SUA perspectiva diferente de todos os outros livros no nicho?
                </p>
                <textarea
                  value={answers.angle}
                  onChange={(e) => setAnswers({ ...answers, angle: e.target.value })}
                  placeholder="Ex: Quero misturar neurociência com histórias reais de pacientes..."
                  rows={3}
                  className="w-full rounded-lg bg-slate-800 border border-slate-600 text-white placeholder:text-slate-500 px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">
                  Para quem especificamente você está escrevendo?
                </Label>
                <p className="text-xs text-slate-500">
                  Quanto mais específico, melhor o posicionamento. Evite "todo mundo".
                </p>
                <textarea
                  value={answers.audience}
                  onChange={(e) => setAnswers({ ...answers, audience: e.target.value })}
                  placeholder="Ex: Mulheres 30-45 que saíram de relacionamentos tóxicos e buscam reconstruir a autoestima..."
                  rows={3}
                  className="w-full rounded-lg bg-slate-800 border border-slate-600 text-white placeholder:text-slate-500 px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                />
              </div>

              <Button
                onClick={handleSubmit}
                disabled={!answers.experience || !answers.angle || !answers.audience}
                className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-medium"
              >
                Validar tema e gerar UBA
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Loading */}
        {phase1.loading && (
          <Card className="border-slate-700 bg-slate-900/50 text-center py-16">
            <CardContent>
              <div className="animate-spin w-8 h-8 border-4 border-slate-600 border-t-amber-500 rounded-full mx-auto mb-4" />
              <p className="text-white font-medium">{LOADING_MESSAGES[loadingMsg]}</p>
              <p className="text-sm text-slate-500 mt-2">Isso pode levar até 30 segundos</p>
            </CardContent>
          </Card>
        )}

        {/* Error */}
        {phase1.error && (
          <div className="bg-red-900/30 border border-red-800 text-red-300 p-4 rounded-lg">
            {phase1.error}
            <Button variant="link" onClick={handleSubmit} className="text-red-300 underline ml-2 p-0 h-auto">
              Tentar novamente
            </Button>
          </div>
        )}

        {/* Results */}
        {resultData && (
          <>
            {/* Validation warnings */}
            {resultData.validation.warnings.length > 0 && (
              <Card className="border-yellow-800/50 bg-yellow-950/20">
                <CardContent className="p-4">
                  <p className="text-yellow-400 font-medium text-sm mb-2">Pontos de atenção</p>
                  <ul className="list-disc list-inside text-sm text-yellow-300/80 space-y-1">
                    {resultData.validation.warnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Validation score */}
            <Card className="border-emerald-800/50 bg-emerald-950/20">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-emerald-400">Posicionamento Validado</h3>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-emerald-400">
                      {resultData.validation.score.toFixed(1)}/10
                    </div>
                    <div className="text-xs text-slate-500">fit de mercado: {resultData.validation.market_fit}</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {resultData.validation.green_lights.map((g, i) => (
                    <Badge key={i} className="bg-emerald-900/30 text-emerald-400 text-xs">{g}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* UBA Card */}
            <Card className="border-[#1E3A8A]/50 bg-[#1E3A8A]/10">
              <CardHeader>
                <CardTitle className="text-[#93C5FD]">Seu Unique Book Angle</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <span className="text-xs text-slate-500 uppercase tracking-wider">Para quem</span>
                    <p className="text-slate-200">{resultData.unique_book_angle.for_whom}</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 uppercase tracking-wider">Que enfrenta</span>
                    <p className="text-slate-200">{resultData.unique_book_angle.pain_or_desire}</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 uppercase tracking-wider">Este livro oferece</span>
                    <p className="text-slate-200">{resultData.unique_book_angle.what_it_offers}</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 uppercase tracking-wider">Diferente porque</span>
                    <p className="text-slate-200">{resultData.unique_book_angle.different_because}</p>
                  </div>
                </div>
                <div className="border-t border-[#1E3A8A]/30 pt-4">
                  <p className="text-[#93C5FD] italic text-lg">
                    "{resultData.unique_book_angle.one_sentence}"
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Book Profile */}
            <Card className="border-slate-700 bg-slate-900/50">
              <CardHeader>
                <CardTitle className="text-white text-base">Perfil do Livro</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500">Gênero KDP</span>
                    <p className="text-slate-300">{resultData.book_profile.kdp_genre}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Sub-gênero</span>
                    <p className="text-slate-300">{resultData.book_profile.kdp_subgenre}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Tom</span>
                    <p className="text-slate-300">{resultData.book_profile.tone}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Palavras alvo</span>
                    <p className="text-slate-300">{resultData.book_profile.target_word_count?.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Preço BR</span>
                    <p className="text-slate-300">{resultData.book_profile.price_range_brl}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Preço US</span>
                    <p className="text-slate-300">{resultData.book_profile.price_range_usd}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-slate-500 text-sm">Leitor ideal</span>
                  <p className="text-slate-300 text-sm">{resultData.book_profile.reader_profile}</p>
                </div>
              </CardContent>
            </Card>

            {/* Advance button */}
            <div className="flex justify-between items-center pt-4">
              <Button
                variant="ghost"
                onClick={() => { phase1.reset(); }}
                className="text-slate-500 hover:text-slate-300"
              >
                Refazer análise
              </Button>
              <Button
                onClick={handleAdvance}
                className="bg-[#1E3A8A] hover:bg-[#1E40AF] text-white px-8"
              >
                Confirmar e criar Book Bible &rarr;
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
