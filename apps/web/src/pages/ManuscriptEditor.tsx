import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjectStore } from '@/stores/projectStore';
import { api } from '@/lib/api';
import type { Phase3Data, Phase4Data, WrittenChapter } from '@manuscry/shared';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AIWritingCoach from '@/components/app/AIWritingCoach';
import VersionHistory from '@/components/app/VersionHistory';

function ToolbarButton({ active, onClick, children, title }: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`w-8 h-8 rounded flex items-center justify-center text-sm transition-colors ${
        active
          ? 'bg-[#1E3A8A] text-white'
          : 'text-slate-400 hover:text-white hover:bg-slate-700'
      }`}
    >
      {children}
    </button>
  );
}

function EditorToolbar({ editor }: { editor: ReturnType<typeof useEditor> }) {
  if (!editor) return null;

  return (
    <div className="flex flex-wrap items-center gap-1 px-4 py-2 border-b border-slate-800 bg-slate-900/50">
      <ToolbarButton active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} title="Negrito">
        <span className="font-bold">B</span>
      </ToolbarButton>
      <ToolbarButton active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} title="Itálico">
        <span className="italic">I</span>
      </ToolbarButton>
      <ToolbarButton active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Sublinhado">
        <span className="underline">U</span>
      </ToolbarButton>
      <ToolbarButton active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()} title="Tachado">
        <span className="line-through">S</span>
      </ToolbarButton>

      <div className="w-px h-5 bg-slate-700 mx-1" />

      <ToolbarButton active={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="Título 1">
        H1
      </ToolbarButton>
      <ToolbarButton active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Título 2">
        H2
      </ToolbarButton>
      <ToolbarButton active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="Título 3">
        H3
      </ToolbarButton>

      <div className="w-px h-5 bg-slate-700 mx-1" />

      <ToolbarButton active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Lista">
        {'\u2022'}
      </ToolbarButton>
      <ToolbarButton active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Lista numerada">
        1.
      </ToolbarButton>
      <ToolbarButton active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Citação">
        {'\u201C'}
      </ToolbarButton>

      <div className="w-px h-5 bg-slate-700 mx-1" />

      <ToolbarButton active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()} title="Alinhar esquerda">
        {'\u2261'}
      </ToolbarButton>
      <ToolbarButton active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()} title="Centralizar">
        {'\u2263'}
      </ToolbarButton>
      <ToolbarButton active={editor.isActive({ textAlign: 'justify' })} onClick={() => editor.chain().focus().setTextAlign('justify').run()} title="Justificar">
        {'\u2630'}
      </ToolbarButton>

      <div className="w-px h-5 bg-slate-700 mx-1" />

      <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Separador">
        &mdash;
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="Desfazer">
        {'\u21A9'}
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().redo().run()} title="Refazer">
        {'\u21AA'}
      </ToolbarButton>
    </div>
  );
}

export default function ManuscriptEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentProject, fetchProject } = useProjectStore();

  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [hasUnsaved, setHasUnsaved] = useState(false);
  const [coachOpen, setCoachOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    if (id) fetchProject(id);
  }, [id, fetchProject]);

  const phase3Data = currentProject?.phase_3_data as Phase3Data | null;
  const phase4Data = (currentProject?.phase_4_data || { chapters: [], total_words_written: 0 }) as Phase4Data;
  const manuscriptStatus = phase4Data.manuscript_status || 'draft';

  const getChapter = useCallback(
    (num: number): WrittenChapter | undefined =>
      phase4Data.chapters.find((ch) => ch.number === num),
    [phase4Data.chapters],
  );

  const selectedWritten = selectedChapter !== null ? getChapter(selectedChapter) : null;

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder: 'Comece a editar seu capítulo...' }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-invert prose-slate max-w-none focus:outline-none min-h-[50vh] px-8 py-6 text-[15px] leading-relaxed',
      },
    },
    onUpdate: () => {
      setHasUnsaved(true);
    },
  });

  // Load chapter content into editor when selected
  useEffect(() => {
    if (!editor || !selectedWritten?.content) return;
    const html = selectedWritten.content
      .split(/\n\n+/)
      .map((p) => `<p>${p.replace(/\n/g, '<br/>')}</p>`)
      .join('');
    editor.commands.setContent(html);
    setHasUnsaved(false);
  }, [selectedChapter, selectedWritten?.content, editor]);

  async function handleSave() {
    if (!id || !editor || selectedChapter === null) return;
    setSaving(true);
    setSaveMsg('');

    const htmlContent = editor.getHTML();
    // Convert HTML back to plain text for storage
    const div = document.createElement('div');
    div.innerHTML = htmlContent;
    const plainText = div.innerText;

    try {
      await api.post('/api/pipeline/phase4/save', {
        projectId: id,
        chapterNumber: selectedChapter,
        content: plainText,
      });
      await fetchProject(id);
      setHasUnsaved(false);
      setSaveMsg('Salvo');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch (err) {
      setSaveMsg(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    if (!id) return;
    if (!confirm('Enviar manuscrito para revisão dos agentes? Eles farão a releitura e finalizarão o produto.')) return;
    setPublishing(true);
    try {
      await api.post('/api/pipeline/phase4/publish', { projectId: id });
      await fetchProject(id);
    } catch (err) {
      setSaveMsg(err instanceof Error ? err.message : 'Erro ao publicar');
    } finally {
      setPublishing(false);
    }
  }

  if (!currentProject) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="text-slate-500">Carregando...</div>
      </div>
    );
  }

  const totalWords = phase4Data.chapters
    .filter((ch) => ch.content)
    .reduce((sum, ch) => sum + ch.word_count, 0);

  const editorWordCount = editor ? editor.storage.characterCount?.words?.() || editor.getText().split(/\s+/).filter(Boolean).length : 0;

  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 flex-shrink-0">
        <div className="max-w-full px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate(`/projects/${id}`)} className="text-slate-400 hover:text-white -ml-2">
              &larr;
            </Button>
            <Badge className="bg-blue-900/30 text-blue-400">Editor</Badge>
            <h1 className="text-base font-semibold text-white truncate max-w-xs">
              {currentProject.name}
            </h1>
            {manuscriptStatus !== 'draft' && (
              <Badge className={
                manuscriptStatus === 'review' ? 'bg-amber-900/30 text-amber-400' :
                manuscriptStatus === 'approved' ? 'bg-emerald-900/30 text-emerald-400' :
                'bg-purple-900/30 text-purple-400'
              }>
                {manuscriptStatus === 'review' ? 'Em revisão' : manuscriptStatus === 'approved' ? 'Aprovado' : 'Publicado'}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">{totalWords.toLocaleString()} palavras total</span>
            {hasUnsaved && <Badge className="bg-amber-900/30 text-amber-400 text-xs">Não salvo</Badge>}
            {saveMsg && (
              <Badge className={saveMsg === 'Salvo' ? 'bg-emerald-900/30 text-emerald-400 text-xs' : 'bg-red-900/30 text-red-400 text-xs'}>
                {saveMsg}
              </Badge>
            )}
            {selectedChapter !== null && (
              <>
                <Button size="sm" variant="outline" onClick={() => setHistoryOpen(true)} className="border-slate-600 text-slate-300 h-8 text-xs">
                  {'\u{1F4DC}'} Histórico
                </Button>
                <Button size="sm" variant="outline" onClick={() => setCoachOpen(true)} className="border-purple-800 text-purple-400 h-8 text-xs">
                  {'\u{1F9E0}'} Coach
                </Button>
              </>
            )}
            <Button size="sm" onClick={handleSave} disabled={saving || !hasUnsaved || selectedChapter === null} className="bg-[#1E3A8A] hover:bg-[#1E40AF] text-white h-8 text-xs">
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
            <Button size="sm" onClick={handlePublish} disabled={publishing || manuscriptStatus === 'review'} className="bg-amber-500 hover:bg-amber-600 text-slate-900 h-8 text-xs">
              {publishing ? 'Enviando...' : 'Publicar'}
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Chapter sidebar */}
        <aside className="w-56 border-r border-slate-800 bg-slate-900/30 overflow-y-auto flex-shrink-0">
          <div className="p-3">
            <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">Capítulos</h3>
            <div className="space-y-1">
              {(phase3Data?.chapters || []).map((outline) => {
                const written = getChapter(outline.number);
                const isActive = selectedChapter === outline.number;
                const hasContent = !!written?.content;
                return (
                  <button
                    key={outline.number}
                    onClick={() => {
                      if (hasUnsaved && selectedChapter !== null) {
                        if (!confirm('Você tem alterações não salvas. Descartar?')) return;
                      }
                      setSelectedChapter(outline.number);
                      setHasUnsaved(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all ${
                      isActive
                        ? 'bg-[#1E3A8A]/20 text-[#93C5FD]'
                        : hasContent
                          ? 'text-slate-300 hover:bg-slate-800/50'
                          : 'text-slate-600 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-slate-500">{outline.number}</span>
                      {hasContent && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                    </div>
                    <p className="truncate mt-0.5">{outline.title}</p>
                    {written && <p className="text-[10px] text-slate-600 mt-0.5">{written.word_count.toLocaleString()} palavras</p>}
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Editor area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {selectedChapter === null ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl mb-4">{'\u{1F4DD}'}</div>
                <h3 className="text-lg font-semibold text-white mb-2">Editor de Manuscrito</h3>
                <p className="text-sm text-slate-400 max-w-sm">
                  Selecione um capítulo na barra lateral para começar a editar.
                  Todas as ferramentas de formatação estão disponíveis na toolbar.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Chapter title */}
              <div className="px-8 py-3 border-b border-slate-800 bg-slate-900/30">
                <h2 className="text-sm font-medium text-white">
                  Capítulo {selectedChapter}: {phase3Data?.chapters.find((ch) => ch.number === selectedChapter)?.title}
                </h2>
                <p className="text-xs text-slate-500">{editorWordCount.toLocaleString()} palavras neste capítulo</p>
              </div>

              {/* Toolbar */}
              <EditorToolbar editor={editor} />

              {/* Editor content */}
              <div className="flex-1 overflow-y-auto bg-[#0F172A]">
                {selectedWritten?.content ? (
                  <EditorContent editor={editor} />
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                    Este capítulo ainda não foi escrito. Use a Fase 4 para gerar o conteúdo primeiro.
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>

      {/* AI Writing Coach sidebar */}
      {coachOpen && id && (
        <AIWritingCoach
          projectId={id}
          chapterNumber={selectedChapter}
          onClose={() => setCoachOpen(false)}
        />
      )}

      {/* Version History modal */}
      {historyOpen && id && selectedChapter !== null && (
        <VersionHistory
          projectId={id}
          chapterNumber={selectedChapter}
          onClose={() => setHistoryOpen(false)}
          onRestored={() => { fetchProject(id); setHistoryOpen(false); }}
        />
      )}
    </div>
  );
}
