import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { ChapterVersion } from '@manuscry/shared';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const SOURCE_LABELS: Record<string, string> = {
  ai_write: 'Escrita IA',
  ai_humanize: 'Humanização',
  manual_edit: 'Edição manual',
  ai_translate: 'Tradução',
};

const SOURCE_COLORS: Record<string, string> = {
  ai_write: 'bg-amber-900/30 text-amber-400',
  ai_humanize: 'bg-purple-900/30 text-purple-400',
  manual_edit: 'bg-blue-900/30 text-blue-400',
  ai_translate: 'bg-emerald-900/30 text-emerald-400',
};

interface Props {
  projectId: string;
  chapterNumber: number;
  onClose: () => void;
  onRestored: () => void;
}

export default function VersionHistory({ projectId, chapterNumber, onClose, onRestored }: Props) {
  const [versions, setVersions] = useState<ChapterVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<ChapterVersion | null>(null);
  const [restoring, setRestoring] = useState<string | null>(null);

  useEffect(() => {
    api.get<{ versions: ChapterVersion[] }>(`/api/collab/version/list/${projectId}/${chapterNumber}`)
      .then((r) => setVersions(r.versions))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [projectId, chapterNumber]);

  async function restore(versionId: string) {
    if (!confirm('Restaurar esta versão? O conteúdo atual do capítulo será substituído.')) return;
    setRestoring(versionId);
    try {
      await api.post('/api/collab/version/restore', { projectId, chapterNumber, versionId });
      onRestored();
      onClose();
    } catch { /* ignore */ }
    finally { setRestoring(null); }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-4xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Badge className="bg-blue-900/30 text-blue-400">{'\u{1F4DC}'} HISTÓRICO</Badge>
            <h3 className="text-white font-semibold">Versões do Capítulo {chapterNumber}</h3>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white text-lg">&times;</button>
        </div>

        <div className="flex-1 overflow-hidden flex">
          {/* List */}
          <div className="w-72 border-r border-slate-800 overflow-y-auto">
            {loading && <div className="p-4 text-slate-500 text-sm">Carregando versões...</div>}
            {!loading && versions.length === 0 && (
              <div className="p-4 text-slate-500 text-sm text-center">
                Nenhuma versão salva ainda.<br />
                <span className="text-xs">Versões são criadas automaticamente ao escrever, humanizar ou editar.</span>
              </div>
            )}
            <div className="p-2 space-y-1">
              {versions.slice().reverse().map((v) => (
                <button
                  key={v.version_id}
                  onClick={() => setPreview(v)}
                  className={`w-full text-left p-3 rounded-lg transition-all ${
                    preview?.version_id === v.version_id
                      ? 'bg-[#1E3A8A]/20 border border-[#1E3A8A]/50'
                      : 'hover:bg-slate-800/50 border border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white text-sm font-medium">{v.label}</span>
                    <Badge className={`text-[10px] ${SOURCE_COLORS[v.source] || 'bg-slate-800'}`}>
                      {SOURCE_LABELS[v.source] || v.source}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500">
                    {new Date(v.created_at).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="text-xs text-slate-600">{v.word_count.toLocaleString()} palavras</p>
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="flex-1 flex flex-col">
            {preview ? (
              <>
                <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                  <div>
                    <p className="text-white text-sm font-semibold">{preview.label}</p>
                    <p className="text-xs text-slate-500">{preview.word_count.toLocaleString()} palavras</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => restore(preview.version_id)}
                    disabled={restoring === preview.version_id}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {restoring === preview.version_id ? 'Restaurando...' : 'Restaurar esta versão'}
                  </Button>
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="whitespace-pre-wrap text-slate-300 text-sm leading-relaxed">{preview.content}</div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
                Selecione uma versão para visualizar
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
