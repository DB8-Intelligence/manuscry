import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import type { MarketplaceListing } from '@manuscry/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function Marketplace() {
  const navigate = useNavigate();
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ listings: MarketplaceListing[] }>('/api/marketplace/listings')
      .then((res) => setListings(res.listings))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#0F172A]">
      {/* Nav */}
      <nav className="border-b border-slate-800/50 sticky top-0 bg-[#0F172A]/95 backdrop-blur z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-xl font-bold text-white tracking-tight cursor-pointer" onClick={() => navigate('/')}>
              Manuscry
            </span>
            <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs">Store</Badge>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400 cursor-pointer hover:text-white" onClick={() => navigate('/blog')}>Blog</span>
            <Button size="sm" onClick={() => navigate('/login')} className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-medium">
              Publicar meu livro
            </Button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-white mb-3">Manuscry Store</h1>
          <p className="text-slate-400 max-w-xl mx-auto">
            Livros criados por autores independentes com o pipeline editorial do Manuscry.
            Cada livro passou por análise de mercado, escrita com IA e validação KDP.
          </p>
        </div>

        {loading && <div className="text-center py-12 text-slate-500">Carregando catálogo...</div>}

        {!loading && listings.length === 0 && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">{'\u{1F4DA}'}</div>
            <h3 className="text-xl font-semibold text-white mb-3">A loja está sendo preparada</h3>
            <p className="text-slate-400 text-sm mb-6 max-w-md mx-auto">
              Em breve, autores do Manuscry poderão publicar seus livros aqui.
              Crie o seu e seja um dos primeiros!
            </p>
            <Button onClick={() => navigate('/login')} className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-medium">
              Criar meu livro agora
            </Button>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {listings.map((book) => (
            <Card key={book.id} className="border-slate-700 bg-slate-900/50 overflow-hidden hover:border-slate-600 transition-all group cursor-pointer">
              {/* Cover */}
              <div className="aspect-[2/3] bg-slate-800 relative overflow-hidden">
                {book.cover_image_url ? (
                  <img src={book.cover_image_url} alt={book.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl text-slate-700">{'\u{1F4D6}'}</div>
                )}
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-white text-sm truncate">{book.title}</h3>
                <p className="text-xs text-slate-400 mt-1">{book.author_name}</p>
                <div className="flex items-center justify-between mt-3">
                  <Badge className="bg-slate-800 text-slate-400 text-xs">{book.genre}</Badge>
                  <span className="text-amber-400 font-bold text-sm">{book.price_brl}</span>
                </div>
                {book.channels_available.length > 0 && (
                  <p className="text-[10px] text-slate-600 mt-2">
                    Disponível em {book.channels_available.length} plataforma{book.channels_available.length > 1 ? 's' : ''}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/50 mt-12">
        <div className="max-w-6xl mx-auto px-6 py-8 flex items-center justify-between">
          <div>
            <span className="font-bold text-white">Manuscry Store</span>
            <p className="text-xs text-slate-500 mt-1">Livros criados com IA editorial profissional</p>
          </div>
          <div className="flex gap-4 text-xs text-slate-500">
            <span className="cursor-pointer hover:text-slate-300" onClick={() => navigate('/')}>Home</span>
            <span className="cursor-pointer hover:text-slate-300" onClick={() => navigate('/blog')}>Blog</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
