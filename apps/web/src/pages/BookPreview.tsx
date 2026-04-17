import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import type { BookPreviewData } from '@manuscry/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function BookPreview() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [preview, setPreview] = useState<BookPreviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) return;
    api.get<BookPreviewData>(`/api/features/preview/${projectId}`)
      .then(setPreview)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [projectId]);

  if (loading) return <div className="min-h-screen bg-[#0F172A] flex items-center justify-center"><div className="text-slate-500">Carregando preview...</div></div>;
  if (!preview) return <div className="min-h-screen bg-[#0F172A] flex items-center justify-center"><div className="text-slate-400">Livro não encontrado</div></div>;

  return (
    <div className="min-h-screen bg-[#0F172A]">
      <nav className="border-b border-slate-800/50 sticky top-0 bg-[#0F172A]/95 backdrop-blur z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-xl font-bold text-white tracking-tight cursor-pointer" onClick={() => navigate('/')}>Manuscry</span>
          <Button size="sm" onClick={() => navigate('/store')} variant="ghost" className="text-slate-400 hover:text-white">Voltar à loja</Button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex flex-col md:flex-row gap-8 mb-10">
          {preview.cover_url && (
            <div className="w-48 flex-shrink-0">
              <img src={preview.cover_url} alt={preview.title} className="w-full rounded-lg shadow-2xl" />
            </div>
          )}
          <div>
            <Badge className="bg-[#1E3A8A]/20 text-[#93C5FD] text-xs mb-3">{preview.genre}</Badge>
            <h1 className="text-3xl font-bold text-white mb-2">{preview.title}</h1>
            <p className="text-slate-400 mb-4">por <span className="text-[#93C5FD]">{preview.author_name}</span></p>
            <div className="flex gap-4 text-sm text-slate-500">
              <span>{preview.total_chapters} capítulos</span>
              <span>{preview.total_words.toLocaleString()} palavras</span>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-semibold text-white mb-1">Preview — Primeiros capítulos</h2>
          <p className="text-xs text-slate-500">Leia os primeiros capítulos gratuitamente</p>
        </div>

        {preview.preview_chapters.map((ch) => (
          <Card key={ch.number} className="border-slate-700 bg-slate-900/50 mb-6">
            <CardContent className="p-8">
              <h3 className="text-lg font-semibold text-white mb-1">Capítulo {ch.number}: {ch.title}</h3>
              <div className="mt-4 text-slate-300 leading-relaxed whitespace-pre-wrap text-[15px]">
                {ch.excerpt}
              </div>
            </CardContent>
          </Card>
        ))}

        <Card className="border-amber-800/30 bg-gradient-to-r from-amber-950/20 to-[#1E3A8A]/20 mt-8">
          <CardContent className="p-8 text-center">
            <h3 className="text-xl font-bold text-white mb-3">Quer ler o livro completo?</h3>
            <p className="text-slate-400 text-sm mb-6">
              Este livro foi criado com o Manuscry. Crie o seu também — 14 dias grátis.
            </p>
            <Button onClick={() => navigate('/login')} className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold px-8">
              Criar meu livro agora
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
