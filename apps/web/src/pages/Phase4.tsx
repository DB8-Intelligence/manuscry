import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjectStore } from '@/stores/projectStore';
import { api } from '@/lib/api';
import type {
  Phase3Data, Phase4Data, WrittenChapter, ChapterOutline,
} from '@manuscry/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type StreamingState = 'idle' | 'writing' | 'humanizing' | 'done' | 'error';

export default function Phase4() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentProject, fetchProject } = useProjectStore();

  const [activeChapter, setActiveChapter] = useState<number | null>(null);
  const [streamState, setStreamState] = useState<StreamingState>('idle');
  const [streamedText, setStreamedText] = useState('');
  const [streamError, setStreamError] = useState('');
  const [viewingChapter, setViewingChapter] = useState<number | null>(null);

  // Editor state
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const textRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (id) fetchProject(id);
  }, [id, fetchProject]);

  useEffect(() => {
    if (streamState === 'writing' || streamState === 'humanizing') {
      textRef.current?.scrollTo({ top: textRef.current.scrollHeight });
    }
  }, [streamedText, streamState]);

  const phase3Data = currentProject?.phase_3_data as Phase3Data | null;
  const phase4Data = (currentProject?.phase_4_data || { chapters: [], total_words_written: 0 }) as Phase4Data;

  const getWrittenChapter = useCallback(
    (num: number): WrittenChapter | undefined =>
      phase4Data.chapters.find((ch) => ch.number === num),
    [phase4Data.chapters],
  );

  const getChapterStatus = useCallback(
    (num: number): WrittenChapter['status'] => {
      if (activeChapter === num && (streamState === 'writing' || streamState === 'humanizing')) {
        return 'writing';
      }
      return getWrittenChapter(num)?.status || 'pending';
    },
    [activeChapter, streamState, getWrittenChapter],
  );

  const isStreaming = streamState === 'writing' || streamState === 'humanizing';

  function enterEditMode() {
    if (!viewingChapter || isStreaming) return;
    const written = getWrittenChapter(viewingChapter);
    if (!written?.content) return;
    setEditContent(written.content);
    setEditing(true);
    setSaveMessage('');
    setTimeout(() => editorRef.current?.focus(), 50);
  }

  function cancelEdit() {
    setEditing(false);
    setEditContent('');
    setSaveMessage('');
  }

  async function saveEdit() {
    if (!id || !viewingChapter) return;
    setSaving(true);
    setSaveMessage('');
    try {
      await api.post('/api/pipeline/phase4/save', {
        projectId: id,
        chapterNumber: viewingChapter,
        content: editContent,
      });
      await fetchProject(id);
      setEditing(false);
      setSaveMessage('Salvo');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (err) {
      setSaveMessage(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  async function writeChapter(chapterNumber: number) {
    if (!id || isStreaming) return;
    if (editing) cancelEdit();

    setActiveChapter(chapterNumber);
    setStreamState('writing');
    setStreamedText('');
    setStreamError('');
    setViewingChapter(chapterNumber);

    try {
      await api.stream(
        '/api/pipeline/phase4/write',
        { projectId: id, chapterNumber },
        (text) => setStreamedText((prev) => prev + text),
        () => {
          setStreamState('done');
          fetchProject(id!).then(() => { setActiveChapter(null); });
        },
      );
    } catch (err) {
      setStreamState('error');
      setStreamError(err instanceof Error ? err.message : 'Erro na escrita');
    }
  }

  async function humanizeChapter(chapterNumber: number) {
    if (!id || isStreaming) return;
    if (editing) cancelEdit();

    setActiveChapter(chapterNumber);
    setStreamState('humanizing');
    setStreamedText('');
    setStreamError('');
    setViewingChapter(chapterNumber);

    try {
      await api.stream(
        '/api/pipeline/phase4/humanize',
        { projectId: id, chapterNumber },
        (text) => setStreamedText((prev) => prev + text),
        () => {
          setStreamState('done');
          fetchProject(id!).then(() => { setActiveChapter(null); });
        },
      );
    } catch (err) {
      setStreamState('error');
      setStreamError(err instanceof Error ? err.message : 'Erro na humanização');
    }
  }

  if (!currentProject) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="text-slate-500">Carregando...</div>
      </div>
    );
  }

  if (!phase3Data?.chapters) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="text-slate-400">Roteiro não encontrado. Complete a Fase 3 primeiro.</div>
      </div>
    );
  }

  const totalChapters = phase3Data.chapters.length;
  const writtenCount = phase4Data.chapters.filter(
    (ch) => ch.status === 'completed' || ch.status === 'humanized',
  ).length;
  const humanizedCount = phase4Data.chapters.filter((ch) => ch.status === 'humanized').length;
  const progressPercent = totalChapters > 0 ? (writtenCount / totalChapters) * 100 : 0;
  const allWritten = writtenCount >= totalChapters;

  const isViewingStream = activeChapter === viewingChapter && streamedText;
  const viewedContent = viewingChapter !== null
    ? (isViewingStream ? streamedText : getWrittenChapter(viewingChapter)?.content || '')
    : '';
  const viewedOutline = viewingChapter !== null
    ? phase3Data.chapters.find((ch) => ch.number === viewingChapter)
    : null;
  const viewedWritten = viewingChapter !== null ? getWrittenChapter(viewingChapter) : null;

  const editorWordCount = editing
    ? editContent.split(/\s+/).filter(Boolean).length
    : viewedContent.split(/\s+/).filter(Boolean).length;

  const STATUS_BADGES: Record<string, { text: string; className: string }> = {
    pending: { text: 'Pendente', className: 'bg-slate-800 text-slate-500' },
    writing: { text: 'Escrevendo...', className: 'bg-amber-900/30 text-amber-400 animate-pulse' },
    completed: { text: 'Escrito', className: 'bg-blue-900/30 text-blue-400' },
    humanized: { text: 'Humanizado', className: 'bg-emerald-900/30 text-emerald-400' },
  };

  return (
    <div className="min-h-screen bg-[#0F172A]">
      <header className="border-b border-slate-800 bg-slate-900/50">
        <div className="max-w-6xl mx-auto px-6 py-5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/projects/${id}`)}
            className="text-slate-400 hover:text-white mb-3 -ml-2"
          >
            &larr; Voltar ao Projeto
          </Button>
          <div className="flex items-center gap-3">
            <Badge className="bg-[#1E3A8A]/30 text-[#93C5FD]">FASE 4</Badge>
            <h1 className="text-xl font-bold text-white">Writing Engine</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Escrita, edição e humanização capítulo a capítulo
          </p>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* Progress bar */}
        <Card className="border-slate-700 bg-slate-900/50 mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">
                {writtenCount}/{totalChapters} capítulos escritos
                {humanizedCount > 0 && ` (${humanizedCount} humanizados)`}
              </span>
              <span className="text-sm text-white font-medium">
                {phase4Data.total_words_written.toLocaleString()} palavras
              </span>
            </div>
            <div className="bg-slate-800 rounded-full h-2">
              <div
                className="bg-amber-500 h-2 rounded-full transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chapter list */}
          <div className="lg:col-span-1 space-y-2">
            <h3 className="text-white font-semibold mb-3 text-sm">Capítulos</h3>
            <div className="space-y-1.5 max-h-[70vh] overflow-y-auto pr-1">
              {phase3Data.chapters.map((outline: ChapterOutline) => {
                const status = getChapterStatus(outline.number);
                const badge = STATUS_BADGES[status] || STATUS_BADGES.pending;
                const isViewing = viewingChapter === outline.number;
                const written = getWrittenChapter(outline.number);
                const canWrite = status === 'pending' || status === 'completed' || status === 'humanized';
                const canHumanize = status === 'completed';

                return (
                  <div
                    key={outline.number}
                    className={`rounded-lg border p-3 transition-all cursor-pointer ${
                      isViewing
                        ? 'border-[#1E3A8A] bg-[#1E3A8A]/10'
                        : 'border-slate-700 bg-slate-900/50 hover:border-slate-600'
                    }`}
                    onClick={() => {
                      if (written?.content || (activeChapter === outline.number && streamedText)) {
                        if (editing) cancelEdit();
                        setViewingChapter(outline.number);
                      }
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-mono text-slate-500">Cap. {outline.number}</span>
                      <Badge className={`text-[10px] ${badge.className}`}>{badge.text}</Badge>
                    </div>
                    <p className="text-sm text-white truncate mb-2">{outline.title}</p>
                    {written && (
                      <p className="text-xs text-slate-500">{written.word_count.toLocaleString()} palavras</p>
                    )}
                    <div className="flex gap-1.5 mt-2">
                      {canWrite && (
                        <Button
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); writeChapter(outline.number); }}
                          disabled={isStreaming}
                          className="h-6 text-xs bg-amber-500 hover:bg-amber-600 text-slate-900 px-2"
                        >
                          {status === 'pending' ? 'Escrever' : 'Reescrever'}
                        </Button>
                      )}
                      {canHumanize && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => { e.stopPropagation(); humanizeChapter(outline.number); }}
                          disabled={isStreaming}
                          className="h-6 text-xs border-slate-600 text-slate-300 px-2"
                        >
                          Humanizar
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Content viewer / editor */}
          <div className="lg:col-span-2">
            {viewingChapter === null && streamState === 'idle' && (
              <Card className="border-slate-700 bg-slate-900/50 text-center py-20">
                <CardContent>
                  <div className="text-4xl mb-4">{'\u270D\uFE0F'}</div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Selecione um capítulo para começar
                  </h3>
                  <p className="text-sm text-slate-400 max-w-sm mx-auto">
                    Clique em "Escrever" em qualquer capítulo da lista.
                    Após escrito, clique em "Editar" para ajustes manuais.
                  </p>
                </CardContent>
              </Card>
            )}

            {viewingChapter !== null && (
              <Card className="border-slate-700 bg-slate-900/50">
                <CardHeader className="pb-3 border-b border-slate-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-white text-base">
                        Capítulo {viewedOutline?.number}: {viewedOutline?.title}
                      </CardTitle>
                      <p className="text-xs text-slate-500 mt-1">
                        {viewedOutline?.act_position} &middot; Tensão {viewedOutline?.tension_level}/10
                        &middot; ~{viewedOutline?.estimated_words?.toLocaleString()} palavras alvo
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {activeChapter === viewingChapter && streamState === 'writing' && (
                        <Badge className="bg-amber-900/30 text-amber-400 animate-pulse">Escrevendo...</Badge>
                      )}
                      {activeChapter === viewingChapter && streamState === 'humanizing' && (
                        <Badge className="bg-purple-900/30 text-purple-400 animate-pulse">Humanizando...</Badge>
                      )}
                      {editing && (
                        <Badge className="bg-blue-900/30 text-blue-400">Editando</Badge>
                      )}
                      {/* Edit/Save buttons */}
                      {viewedWritten?.content && !isStreaming && !editing && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={enterEditMode}
                          className="h-7 text-xs border-slate-600 text-slate-300"
                        >
                          Editar
                        </Button>
                      )}
                      {editing && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={cancelEdit}
                            className="h-7 text-xs text-slate-400"
                          >
                            Cancelar
                          </Button>
                          <Button
                            size="sm"
                            onClick={saveEdit}
                            disabled={saving}
                            className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            {saving ? 'Salvando...' : 'Salvar'}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {/* Edit mode */}
                  {editing && (
                    <textarea
                      ref={editorRef}
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full p-6 bg-transparent text-slate-300 text-[15px] leading-relaxed resize-none focus:outline-none min-h-[60vh] max-h-[70vh] overflow-y-auto"
                      spellCheck={false}
                    />
                  )}

                  {/* Read mode */}
                  {!editing && (
                    <div
                      ref={textRef}
                      className="p-6 max-h-[60vh] overflow-y-auto"
                    >
                      {viewedContent ? (
                        <div className="whitespace-pre-wrap text-slate-300 leading-relaxed text-[15px]">
                          {viewedContent}
                          {isStreaming && activeChapter === viewingChapter && (
                            <span className="inline-block w-2 h-5 bg-amber-500 animate-pulse ml-0.5 align-text-bottom" />
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-12 text-slate-500">
                          <p>Capítulo ainda não escrito</p>
                          <Button
                            onClick={() => writeChapter(viewingChapter)}
                            disabled={isStreaming}
                            className="mt-3 bg-amber-500 hover:bg-amber-600 text-slate-900"
                          >
                            Escrever agora
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Footer */}
                  {(viewedContent || editing) && (
                    <div className="border-t border-slate-800 px-6 py-3 flex items-center justify-between text-xs text-slate-500">
                      <span>{editorWordCount.toLocaleString()} palavras</span>
                      <div className="flex items-center gap-2">
                        {saveMessage && (
                          <Badge className={saveMessage === 'Salvo'
                            ? 'bg-emerald-900/30 text-emerald-400 text-xs'
                            : 'bg-red-900/30 text-red-400 text-xs'
                          }>
                            {saveMessage}
                          </Badge>
                        )}
                        {streamState === 'done' && activeChapter === viewingChapter && !saveMessage && (
                          <Badge className="bg-emerald-900/30 text-emerald-400 text-xs">
                            Salvo automaticamente
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {streamState === 'error' && streamError && (
              <div className="bg-red-900/30 border border-red-800 text-red-300 p-4 rounded-lg mt-4">
                {streamError}
              </div>
            )}
          </div>
        </div>

        {allWritten && (
          <div className="mt-8 flex justify-end">
            <Button
              onClick={() => navigate(`/projects/${id}/phase-5`)}
              className="bg-[#1E3A8A] hover:bg-[#1E40AF] text-white px-8"
            >
              Manuscrito completo &rarr; Produção
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
