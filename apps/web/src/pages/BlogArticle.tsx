import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import type { BlogPost } from '@manuscry/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function BlogArticle() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    api.get<{ post: BlogPost }>(`/api/blog/posts/${slug}`)
      .then((res) => setPost(res.post))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="text-slate-500">Carregando...</div>
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">404</div>
          <p className="text-slate-400 mb-4">Artigo não encontrado</p>
          <Button onClick={() => navigate('/blog')} className="bg-[#1E3A8A] text-white">
            Ver todos os artigos
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F172A]">
      {/* Nav */}
      <nav className="border-b border-slate-800/50 sticky top-0 bg-[#0F172A]/95 backdrop-blur z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-xl font-bold text-white tracking-tight cursor-pointer" onClick={() => navigate('/')}>
            Manuscry
          </span>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/blog')} className="text-slate-400 hover:text-white">
              Blog
            </Button>
            <Button size="sm" onClick={() => navigate('/login')} className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-medium">
              Começar grátis
            </Button>
          </div>
        </div>
      </nav>

      <article className="max-w-3xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Badge className="bg-[#1E3A8A]/20 text-[#93C5FD] text-xs">{post.category}</Badge>
            <span className="text-xs text-slate-500">
              {post.published_at ? new Date(post.published_at).toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
            </span>
            <span className="text-xs text-slate-600">&middot; {post.author_name}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-4">{post.title}</h1>
          <p className="text-lg text-slate-400 leading-relaxed">{post.excerpt}</p>
          {post.tags && (
            <div className="flex gap-1.5 mt-4">
              {post.tags.map((tag) => (
                <Badge key={tag} className="bg-slate-800 text-slate-500 text-xs">{tag}</Badge>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div
          className="prose prose-invert prose-slate max-w-none prose-headings:text-white prose-p:text-slate-300 prose-p:leading-relaxed prose-a:text-amber-400 prose-strong:text-white prose-li:text-slate-300"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* CTA */}
        <Card className="border-amber-800/30 bg-gradient-to-r from-amber-950/20 to-[#1E3A8A]/20 mt-12">
          <CardContent className="p-8 text-center">
            <h3 className="text-xl font-bold text-white mb-3">{post.cta_text}</h3>
            <p className="text-slate-400 text-sm mb-6">
              Pipeline editorial completo com IA: da análise de mercado ao livro publicado.
              14 dias grátis, sem cartão.
            </p>
            <Button
              onClick={() => window.location.href = post.cta_url}
              className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold px-8"
            >
              Experimentar o Manuscry grátis
            </Button>
          </CardContent>
        </Card>
      </article>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/50">
        <div className="max-w-4xl mx-auto px-6 py-8 flex items-center justify-between">
          <span className="text-sm font-bold text-white">Manuscry</span>
          <div className="flex gap-4 text-xs text-slate-500">
            <a href="/blog" className="hover:text-slate-300">Blog</a>
            <a href="/" className="hover:text-slate-300">Home</a>
          </div>
          <span className="text-xs text-slate-600">&copy; {new Date().getFullYear()} DB8 Intelligence</span>
        </div>
      </footer>
    </div>
  );
}
