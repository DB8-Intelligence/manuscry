import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjectStore } from '@/stores/projectStore';
import { usePhase2 } from '@/hooks/usePipeline';
import type { Phase2Data, Phase2DataFiction, Phase2DataNonfiction, FictionCharacter } from '@manuscry/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const LOADING_MESSAGES = [
  'Criando personagens com vozes únicas...',
  'Definindo o DNA narrativo do livro...',
  'Construindo o Book Bible completo...',
  'Elaborando sinopse e premissa...',
  'Finalizando o mundo do livro...',
];

function isFictionData(data: Phase2Data): data is Phase2DataFiction {
  return 'characters' in data;
}

function CharacterCard({ character }: { character: FictionCharacter }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="border-slate-700 bg-slate-800/50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h4 className="font-semibold text-white">{character.name}</h4>
            <p className="text-xs text-slate-400">
              {character.role} &middot; {character.age} anos
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="text-slate-400 hover:text-white text-xs"
          >
            {expanded ? 'Menos' : 'Mais'}
          </Button>
        </div>
        <p className="text-sm text-slate-300 mb-2">{character.description}</p>
        {expanded && (
          <div className="space-y-2 text-sm border-t border-slate-700 pt-3 mt-3">
            <div>
              <span className="text-slate-500">Motivação interna:</span>{' '}
              <span className="text-slate-300">{character.internal_motivation}</span>
            </div>
            <div>
              <span className="text-slate-500">Motivação externa:</span>{' '}
              <span className="text-slate-300">{character.external_motivation}</span>
            </div>
            <div>
              <span className="text-slate-500">Medo central:</span>{' '}
              <span className="text-slate-300">{character.central_fear}</span>
            </div>
            <div>
              <span className="text-slate-500">Arco de transformação:</span>{' '}
              <span className="text-slate-300">{character.transformation_arc}</span>
            </div>
            <div>
              <span className="text-slate-500">Voz característica:</span>{' '}
              <span className="text-slate-300 italic">"{character.voice_signature}"</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CollapsibleSection({ title, children, defaultOpen = false }: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card className="border-slate-700 bg-slate-900/50">
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left px-5 py-4 flex items-center justify-between"
      >
        <h3 className="font-semibold text-white text-base">{title}</h3>
        <span className="text-slate-500 text-sm">{open ? 'Recolher' : 'Expandir'}</span>
      </button>
      {open && <CardContent className="pt-0 pb-5 px-5">{children}</CardContent>}
    </Card>
  );
}

export default function Phase2() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentProject, fetchProject, updateProject } = useProjectStore();
  const phase2 = usePhase2(id || '');

  const [loadingMsg, setLoadingMsg] = useState(0);

  useEffect(() => {
    if (id) fetchProject(id);
  }, [id, fetchProject]);

  useEffect(() => {
    if (!phase2.loading) return;
    const interval = setInterval(() => {
      setLoadingMsg((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [phase2.loading]);

  const existingData = currentProject?.phase_2_data as Phase2Data | null;
  const resultData = phase2.data || existingData;

  if (!currentProject) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="text-slate-500">Carregando...</div>
      </div>
    );
  }

  async function handleGenerate() {
    const result = await phase2.run();
    if (result && id) {
      updateProject(id, {
        phase_2_data: result,
        current_phase: 3,
        phases_completed: [...(currentProject!.phases_completed || []), 2],
      });
    }
  }

  function handleAdvance() {
    navigate(`/projects/${id}/phase-3`);
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
            <Badge className="bg-[#1E3A8A]/30 text-[#93C5FD]">FASE 2</Badge>
            <h1 className="text-xl font-bold text-white">Concept Builder</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            O DNA completo do seu livro — o Book Bible
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Generate button — only if no result yet */}
        {!resultData && !phase2.loading && (
          <Card className="border-slate-700 bg-slate-900/50 text-center py-12">
            <CardContent className="space-y-4">
              <div className="text-4xl mb-2">
                {currentProject.genre_mode === 'nonfiction' ? '\u{1F4DA}' : '\u{1F4D6}'}
              </div>
              <h3 className="text-lg font-semibold text-white">
                {currentProject.genre_mode === 'nonfiction' ? 'Livro de Não-Ficção' : 'Livro de Ficção'}
              </h3>
              <p className="text-sm text-slate-400 max-w-md mx-auto">
                {currentProject.genre_mode === 'nonfiction'
                  ? 'Vamos criar seu framework metodológico, promessa de transformação e posicionamento de autoridade.'
                  : 'Vamos criar personagens únicos, conflito central e todo o DNA narrativo do seu livro.'}
              </p>
              <Button
                onClick={handleGenerate}
                className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-medium px-8"
              >
                Gerar Book Bible
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Loading */}
        {phase2.loading && (
          <Card className="border-slate-700 bg-slate-900/50 text-center py-16">
            <CardContent>
              <div className="animate-spin w-8 h-8 border-4 border-slate-600 border-t-amber-500 rounded-full mx-auto mb-4" />
              <p className="text-white font-medium">{LOADING_MESSAGES[loadingMsg]}</p>
              <p className="text-sm text-slate-500 mt-2">O Book Bible é detalhado — pode levar até 60 segundos</p>
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
        {phase2.error && (
          <div className="bg-red-900/30 border border-red-800 text-red-300 p-4 rounded-lg">
            {phase2.error}
            <Button variant="link" onClick={handleGenerate} className="text-red-300 underline ml-2 p-0 h-auto">
              Tentar novamente
            </Button>
          </div>
        )}

        {/* Results */}
        {resultData && (
          <>
            {/* Title card */}
            <Card className="border-amber-800/30 bg-amber-950/10">
              <CardContent className="p-6 text-center">
                <h2 className="text-2xl font-bold text-white mb-2">{resultData.title}</h2>
                {resultData.subtitle && (
                  <p className="text-slate-400 mb-3">{resultData.subtitle}</p>
                )}
                <p className="text-amber-400 italic text-lg mb-4">"{resultData.tagline}"</p>
                <div className="flex justify-center gap-2">
                  <Badge className="bg-slate-800 text-slate-300">
                    {resultData.estimated_word_count?.toLocaleString()} palavras
                  </Badge>
                  <Badge className="bg-slate-800 text-slate-300">
                    {resultData.chapter_count} capítulos
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Synopsis */}
            <CollapsibleSection title="Sinopse" defaultOpen>
              <p className="text-slate-300 leading-relaxed whitespace-pre-line">{resultData.synopsis}</p>
              <div className="mt-4 border-t border-slate-700 pt-3">
                <span className="text-xs text-slate-500 uppercase">Premissa</span>
                <p className="text-slate-200 font-medium">{resultData.premise}</p>
              </div>
            </CollapsibleSection>

            {/* Fiction-specific: Characters */}
            {isFictionData(resultData) && (
              <CollapsibleSection title={`Personagens (${resultData.characters.length})`} defaultOpen>
                <div className="space-y-3">
                  {resultData.characters.map((char, i) => (
                    <CharacterCard key={i} character={char} />
                  ))}
                </div>
              </CollapsibleSection>
            )}

            {/* Fiction-specific: World & Conflict */}
            {isFictionData(resultData) && (
              <CollapsibleSection title="Mundo e Conflito">
                <div className="space-y-4">
                  <div>
                    <span className="text-xs text-slate-500 uppercase">Conflito central</span>
                    <p className="text-slate-200 font-medium">{resultData.central_conflict}</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 uppercase">Regras do mundo</span>
                    <p className="text-slate-300">{resultData.world_rules}</p>
                  </div>
                </div>
              </CollapsibleSection>
            )}

            {/* Nonfiction-specific: Framework */}
            {!isFictionData(resultData) && (
              <CollapsibleSection title="Framework Metodológico" defaultOpen>
                <div className="space-y-4">
                  <h4 className="text-white font-semibold">{(resultData as Phase2DataNonfiction).framework.name}</h4>
                  <p className="text-slate-400 text-sm">{(resultData as Phase2DataNonfiction).framework.description}</p>
                  <div className="space-y-2">
                    {(resultData as Phase2DataNonfiction).framework.steps.map((step, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[#1E3A8A]/30 text-[#93C5FD] text-xs flex items-center justify-center font-bold">
                          {i + 1}
                        </span>
                        <p className="text-slate-300 text-sm pt-1">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </CollapsibleSection>
            )}

            {/* Nonfiction-specific: Transformation */}
            {!isFictionData(resultData) && (
              <CollapsibleSection title="Promessa de Transformação">
                <div className="space-y-4">
                  <p className="text-slate-200 font-medium">
                    {(resultData as Phase2DataNonfiction).transformation_promise}
                  </p>
                  <div>
                    <span className="text-xs text-slate-500 uppercase">Dores do leitor</span>
                    <ul className="mt-2 space-y-1">
                      {(resultData as Phase2DataNonfiction).reader_pain_points.map((pain, i) => (
                        <li key={i} className="text-slate-300 text-sm flex items-start gap-2">
                          <span className="text-red-400 mt-0.5">&bull;</span>
                          {pain}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 uppercase">Credibilidade do autor</span>
                    <p className="text-slate-300 text-sm">{(resultData as Phase2DataNonfiction).author_credibility}</p>
                  </div>
                </div>
              </CollapsibleSection>
            )}

            {/* Narrative details */}
            <CollapsibleSection title="Detalhes Narrativos">
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-slate-500">Público-alvo:</span>{' '}
                  <span className="text-slate-300">{resultData.target_audience}</span>
                </div>
                <div>
                  <span className="text-slate-500">Proposta de valor:</span>{' '}
                  <span className="text-slate-300">{resultData.unique_value_proposition}</span>
                </div>
                <div>
                  <span className="text-slate-500">Tom de voz:</span>{' '}
                  <span className="text-slate-300">{resultData.tone_of_voice}</span>
                </div>
                <div>
                  <span className="text-slate-500">Estilo narrativo:</span>{' '}
                  <span className="text-slate-300">{resultData.narrative_style}</span>
                </div>
                <div>
                  <span className="text-slate-500">Temas:</span>{' '}
                  <span className="text-slate-300">{resultData.thematic_threads.join(', ')}</span>
                </div>
              </div>
            </CollapsibleSection>

            {/* Actions */}
            <div className="flex justify-between items-center pt-4">
              <Button
                variant="ghost"
                onClick={() => { phase2.reset(); }}
                className="text-slate-500 hover:text-slate-300"
              >
                Refazer Book Bible
              </Button>
              <Button
                onClick={handleAdvance}
                className="bg-[#1E3A8A] hover:bg-[#1E40AF] text-white px-8"
              >
                Livro aprovado &rarr; criar roteiro
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
