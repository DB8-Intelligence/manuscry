import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import type { BlogPost } from '@manuscry/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function Blog() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ posts: BlogPost[] }>('/api/blog/posts')
      .then((res) => setPosts(res.posts))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#0F172A]">
      {/* Nav */}
      <nav className="border-b border-slate-800/50 sticky top-0 bg-[#0F172A]/95 backdrop-blur z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <span
            className="text-xl font-bold text-white tracking-tight cursor-pointer"
            onClick={() => navigate('/')}
          >
            Manuscry
          </span>
          <div className="flex items-center gap-4">
            <Button
              size="sm"
              onClick={() => navigate('/login')}
              className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-medium"
            >
              Começar grátis
            </Button>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-white mb-3">Blog Manuscry</h1>
          <p className="text-slate-400">
            Dicas, estratégias e tendências do mercado editorial e autopublicação KDP
          </p>
        </div>

        {loading && (
          <div className="text-center py-12 text-slate-500">Carregando artigos...</div>
        )}

        {!loading && posts.length === 0 && (
          <div className="text-center py-20">
            <div className="text-4xl mb-4">{'\u{1F4DD}'}</div>
            <h3 className="text-lg font-semibold text-white mb-2">Em breve</h3>
            <p className="text-slate-400 text-sm">Nossos artigos estão sendo preparados. Volte em breve!</p>
          </div>
        )}

        <div className="space-y-6">
          {posts.map((post) => (
            <Card
              key={post.id}
              className="border-slate-700 bg-slate-900/50 hover:border-slate-600 cursor-pointer transition-all"
              onClick={() => navigate(`/blog/${post.slug}`)}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Badge className="bg-[#1E3A8A]/20 text-[#93C5FD] text-xs">{post.category}</Badge>
                  <span className="text-xs text-slate-500">
                    {post.published_at ? new Date(post.published_at).toLocaleDateString('pt-BR') : ''}
                  </span>
                </div>
                <h2 className="text-xl font-semibold text-white mb-2 hover:text-amber-400 transition-colors">
                  {post.title}
                </h2>
                <p className="text-slate-400 text-sm leading-relaxed">{post.excerpt}</p>
                <div className="flex items-center justify-between mt-4">
                  <div className="flex gap-1.5">
                    {post.tags?.slice(0, 3).map((tag) => (
                      <Badge key={tag} className="bg-slate-800 text-slate-500 text-xs">{tag}</Badge>
                    ))}
                  </div>
                  <span className="text-xs text-[#93C5FD]">Ler artigo &rarr;</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      {/* Footer CTA */}
      <section className="border-t border-slate-800 bg-slate-900/50">
        <div className="max-w-4xl mx-auto px-6 py-12 text-center">
          <h3 className="text-xl font-bold text-white mb-3">Pronto para publicar seu livro?</h3>
          <p className="text-slate-400 text-sm mb-6">
            Crie seu primeiro livro com IA em minutos. 14 dias grátis.
          </p>
          <Button
            onClick={() => navigate('/login')}
            className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-medium px-8"
          >
            Criar meu livro agora
          </Button>
        </div>
      </section>
    </div>
  );
}
