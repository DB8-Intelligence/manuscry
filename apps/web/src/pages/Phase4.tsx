import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjectStore } from '@/stores/projectStore';
import { api } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import type { Phase3Data, Phase4Data, Phase4Chapter } from '@manuscry/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const API_URL = import.meta.env.VITE_API_URL || '';

function emptyChapter(chapter: number, title: string): Phase4Chapter {
  return {
    chapter,
    title,
    content: '',
    word_count: 0,
    status: 'pending',
    updated_at: '',
  };
}

export default function Phase4() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentProject, fetchProject, updateProject } = useProjectStore();

  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [liveText, setLiveText] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (id) fetchProject(id);
  }, [id, fetchProject]);

  const phase3 = currentProject?.phase_3_data as Phase3Data | null;
  const phase4 = (currentProject?.phase_4_data as Phase4Data | null) || null;

  const chapters: Phase4Chapter[] = useMemo(() => {
    if (!phase3) return [];
    return phase3.chapter_plan.map((plan) => {
      const saved = phase4?.chapters?.find((c) => c.chapter === plan.chapter);
      return saved && saved.content ? saved : emptyChapter(plan.chapter, plan.title);
    });
  }, [phase3, phase4]);

  const current = chapters.find((c) => c.chapter === selectedChapter);
  const currentPlan = phase3?.chapter_plan.find((p) => p.chapter === selectedChapter);

  useEffect(() => {
    if (current && !streaming) {
      setDraft(current.content);
      setLiveText(current.content);
    }
  }, [current?.chapter, current?.content, streaming]);

  async function streamCurrentChapter() {
    if (!currentProject || !currentPlan) return;
    setError('');
    setStreaming(true);
    setLiveText('');

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const res = await fetch(`${API_URL}/api/pipeline/phase4/chapter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          projectId: currentProject.id,
          chapterNum: selectedChapter,
        }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        const body = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(body.error || 'Falha ao iniciar streaming');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const events = buffer.split('\n\n');
        buffer = events.pop() || '';

        for (const raw of events) {
          const line = raw.replace(/^data:\s*/, '').trim();
          if (!line) continue;
          try {
            const evt = JSON.parse(line);
            if (evt.type === 'chunk') {
              accumulated += evt.text;
              setLiveText(accumulated);
            } else if (evt.type === 'done') {
              const ch = evt.chapter as Phase4Chapter;
              setDraft(ch.content);
              setLiveText(ch.content);
              const nextChapters = chapters.map((c) =>
                c.chapter === ch.chapter ? ch : c,
              );
              updateProject(currentProject.id, {
                phase_4_data: {
                  chapters: nextChapters,
                  total_words: evt.total_words ?? 0,
                },
              });
            } else if (evt.type === 'error') {
              throw new Error(evt.error);
            }
          } catch (parseErr) {
            if (parseErr instanceof Error && parseErr.message !== 'Unexpected end of JSON input') {
              throw parseErr;
            }
          }
        }
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Erro ao gerar capítulo');
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }

  function stopStreaming() {
    abortRef.current?.abort();
    setStreaming(false);
  }

  async function saveDraft() {
    if (!currentProject || !currentPlan) return;
    setSaving(true);
    setError('');
    try {
      const result = await api.patch<{ chapter: Phase4Chapter; total_words: number }>(
        '/api/pipeline/phase4/chapter',
        {
          projectId: currentProject.id,
          chapterNum: selectedChapter,
          content: draft,
          title: currentPlan.title,
        },
      );
      const nextChapters = chapters.map((c) =>
        c.chapter === result.chapter.chapter ? result.chapter : c,
      );
      updateProject(currentProject.id, {
        phase_4_data: { chapters: nextChapters, total_words: result.total_words },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  if (!currentProject) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center text-slate-400">
        Carregando...
      </div>
    );
  }

  if (!phase3) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center text-slate-400">
        Complete a Fase 3 antes de iniciar a escrita.
      </div>
    );
  }

  const totalWords = chapters.reduce((acc, c) => acc + (c.word_count || 0), 0);
  const doneCount = chapters.filter((c) => c.status === 'done').length;

  return (
    <div className="min-h-screen bg-[#0F172A]">
      <header className="border-b border-slate-800 bg-slate-900/50">
        <div className="max-w-6xl mx-auto px-6 py-5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/projects/${currentProject.id}`)}
            className="text-slate-400 hover:text-white mb-3 -ml-2"
          >
            &larr; Voltar ao Projeto
          </Button>
          <div className="flex items-center gap-3">
            <Badge className="bg-[#1E3A8A]/30 text-[#93C5FD]">FASE 4</Badge>
            <h1 className="text-xl font-bold text-white">Writing Engine</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Escrita capítulo a capítulo com streaming em tempo real · {doneCount}/
            {chapters.length} capítulos · {totalWords.toLocaleString('pt-BR')} palavras
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-12 gap-6">
        <aside className="col-span-4">
          <Card className="border-slate-700 bg-slate-900/50">
            <CardHeader>
              <CardTitle className="text-white text-base">Capítulos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[70vh] overflow-y-auto">
              {chapters.map((ch) => {
                const active = ch.chapter === selectedChapter;
                return (
                  <button
                    key={ch.chapter}
                    onClick={() => !streaming && setSelectedChapter(ch.chapter)}
                    disabled={streaming}
                    className={`w-full text-left p-3 rounded-lg border transition ${
                      active
                        ? 'border-amber-500 bg-amber-500/10'
                        : 'border-slate-700 hover:border-slate-500 bg-slate-900/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-slate-500">Cap {ch.chapter}</span>
                      <Badge
                        className={
                          ch.status === 'done'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : ch.status === 'draft'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-slate-700/60 text-slate-400'
                        }
                      >
                        {ch.status === 'done'
                          ? 'pronto'
                          : ch.status === 'draft'
                            ? 'rascunho'
                            : 'pendente'}
                      </Badge>
                    </div>
                    <p className="text-sm text-white font-medium mt-1 line-clamp-2">
                      {ch.title}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {ch.word_count.toLocaleString('pt-BR')} palavras
                    </p>
                  </button>
                );
              })}
            </CardContent>
          </Card>
        </aside>

        <section className="col-span-8 space-y-4">
          {currentPlan && (
            <Card className="border-slate-700 bg-slate-900/50">
              <CardHeader>
                <CardTitle className="text-white text-base">
                  Capítulo {currentPlan.chapter}: {currentPlan.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-slate-300">
                <p>
                  <span className="text-slate-500">Resumo:</span> {currentPlan.summary}
                </p>
                <p>
                  <span className="text-slate-500">Hook de saída:</span>{' '}
                  {currentPlan.hook}
                </p>
                <p className="text-xs text-slate-500">
                  Meta: {currentPlan.target_words} palavras
                </p>
              </CardContent>
            </Card>
          )}

          {error && (
            <div className="bg-red-900/30 border border-red-800 text-red-300 p-4 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            {!streaming ? (
              <Button
                onClick={streamCurrentChapter}
                className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-medium"
              >
                {current?.content ? 'Reescrever com IA' : 'Escrever com IA'}
              </Button>
            ) : (
              <Button
                onClick={stopStreaming}
                variant="outline"
                className="border-red-600 text-red-300"
              >
                Parar
              </Button>
            )}
            <Button
              onClick={saveDraft}
              disabled={saving || streaming || draft === current?.content}
              variant="outline"
              className="border-slate-600 text-slate-300"
            >
              {saving ? 'Salvando...' : 'Salvar rascunho'}
            </Button>
          </div>

          <Card className="border-slate-700 bg-slate-900/50">
            <CardHeader>
              <CardTitle className="text-white text-base">
                {streaming ? 'Gerando ao vivo...' : 'Editor'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {streaming ? (
                <div className="whitespace-pre-wrap text-slate-200 text-sm leading-relaxed min-h-[50vh] max-h-[60vh] overflow-y-auto font-serif">
                  {liveText}
                  <span className="inline-block w-2 h-4 bg-amber-400 animate-pulse ml-0.5" />
                </div>
              ) : (
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  className="w-full min-h-[50vh] bg-slate-950/60 border border-slate-700 rounded-lg p-4 text-slate-200 text-sm leading-relaxed font-serif focus:outline-none focus:border-amber-500"
                  placeholder="Capítulo ainda não escrito. Clique em 'Escrever com IA' para começar."
                />
              )}
              {!streaming && draft && (
                <p className="text-xs text-slate-500 mt-2">
                  {draft.trim().split(/\s+/).filter(Boolean).length} palavras
                </p>
              )}
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
