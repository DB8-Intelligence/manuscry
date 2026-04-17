import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import type { MarketplaceListing } from '@manuscry/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

const GENRE_CATEGORIES = [
  { id: 'all', label: 'Todos', icon: '\u{1F4DA}' },
  { id: 'Romance', label: 'Romance', icon: '\u2764\uFE0F' },
  { id: 'Suspense', label: 'Suspense / Thriller', icon: '\u{1F50D}' },
  { id: 'Fantasia', label: 'Fantasia / Sci-Fi', icon: '\u{1F52E}' },
  { id: 'Autoajuda', label: 'Autoajuda', icon: '\u{1F4A1}' },
  { id: 'Negócios', label: 'Negócios', icon: '\u{1F4C8}' },
  { id: 'Saúde', label: 'Saúde / Bem-estar', icon: '\u{1F33F}' },
  { id: 'Terror', label: 'Terror / Horror', icon: '\u{1F47B}' },
  { id: 'Biografia', label: 'Biografia / Memórias', icon: '\u{1F464}' },
  { id: 'Educação', label: 'Educação', icon: '\u{1F393}' },
  { id: 'Culinária', label: 'Culinária', icon: '\u{1F373}' },
  { id: 'Infantil', label: 'Infantil', icon: '\u{2B50}' },
];

function BookCard({ book, featured }: { book: MarketplaceListing; featured?: boolean }) {
  return (
    <Card className={`border-slate-700 bg-slate-900/50 overflow-hidden hover:border-slate-600 transition-all group cursor-pointer flex-shrink-0 ${
      featured ? 'ring-1 ring-amber-500/20' : ''
    }`} style={{ width: featured ? 200 : 180 }}>
      <div className="aspect-[2/3] bg-slate-800 relative overflow-hidden">
        {book.cover_image_url ? (
          <img src={book.cover_image_url} alt={book.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl text-slate-700">{'\u{1F4D6}'}</div>
        )}
        {featured && (
          <div className="absolute top-2 left-2">
            <Badge className="bg-amber-500 text-slate-900 text-[10px] font-bold">{'\u2B50'} Destaque</Badge>
          </div>
        )}
      </div>
      <CardContent className="p-3">
        <h3 className="font-medium text-white text-sm truncate">{book.title}</h3>
        <p className="text-xs text-[#93C5FD] mt-0.5 truncate">{book.author_name}</p>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-slate-500">{book.word_count.toLocaleString()} palavras</span>
          <span className="text-amber-400 font-bold text-xs">{book.price_brl}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function CategoryCarousel({ title, books, icon }: { title: string; books: MarketplaceListing[]; icon: string }) {
  if (books.length === 0) return null;
  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">{icon} {title}</h2>
        <span className="text-xs text-[#93C5FD] cursor-pointer hover:text-white">Ver todos &rarr;</span>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
        {books.map((book) => <BookCard key={book.id} book={book} />)}
      </div>
    </div>
  );
}

export default function Marketplace() {
  const navigate = useNavigate();
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeGenre, setActiveGenre] = useState('all');

  useEffect(() => {
    api.get<{ listings: MarketplaceListing[] }>('/api/marketplace/listings')
      .then((res) => setListings(res.listings))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = listings.filter((b) => {
    const matchSearch = !search || b.title.toLowerCase().includes(search.toLowerCase()) || b.author_name.toLowerCase().includes(search.toLowerCase());
    const matchGenre = activeGenre === 'all' || (b.genre && b.genre.toLowerCase().includes(activeGenre.toLowerCase()));
    return matchSearch && matchGenre;
  });

  const featured = filtered.slice(0, 6);
  const genres = GENRE_CATEGORIES.filter((g) => g.id !== 'all');
  const booksByGenre = genres.map((g) => ({
    ...g,
    books: listings.filter((b) => b.genre && b.genre.toLowerCase().includes(g.id.toLowerCase())),
  })).filter((g) => g.books.length > 0);

  const totalAuthors = new Set(listings.map((b) => b.author_name)).size;
  const totalGenres = new Set(listings.map((b) => b.genre).filter(Boolean)).size;

  return (
    <div className="min-h-screen bg-[#0F172A]">
      {/* Nav */}
      <nav className="border-b border-slate-800/50 sticky top-0 bg-[#0F172A]/95 backdrop-blur z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold text-white tracking-tight cursor-pointer" onClick={() => navigate('/')}>Manuscry</span>
            <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs">Store</Badge>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400 cursor-pointer hover:text-white hidden sm:block" onClick={() => navigate('/blog')}>Blog</span>
            <Button size="sm" onClick={() => navigate('/login')} className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-medium">
              Publicar meu livro
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-b from-[#1E3A8A]/10 to-transparent border-b border-slate-800/50">
        <div className="max-w-6xl mx-auto px-6 py-12 text-center">
          <h1 className="text-3xl font-bold text-white mb-3">Livros criados com Manuscry</h1>
          <p className="text-slate-400 max-w-lg mx-auto mb-6">
            Cada livro aqui foi criado com IA editorial profissional e validado pelo nosso pipeline de 6 fases.
          </p>
          <Button onClick={() => navigate('/login')} className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-medium mb-8">
            Criar seu livro &rarr;
          </Button>

          {/* Stats */}
          <div className="flex justify-center gap-10">
            <div><span className="text-2xl font-bold text-white">{listings.length}</span><p className="text-xs text-slate-500">LIVROS</p></div>
            <div><span className="text-2xl font-bold text-white">{totalAuthors}</span><p className="text-xs text-slate-500">AUTORES</p></div>
            <div><span className="text-2xl font-bold text-white">{totalGenres || GENRE_CATEGORIES.length - 1}</span><p className="text-xs text-slate-500">GÊNEROS</p></div>
          </div>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Search + filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título ou autor..."
            className="bg-slate-800 border-slate-600 text-white flex-1"
          />
          <div className="flex gap-2 overflow-x-auto pb-1">
            {GENRE_CATEGORIES.slice(0, 8).map((g) => (
              <button
                key={g.id}
                onClick={() => setActiveGenre(g.id)}
                className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-all ${
                  activeGenre === g.id
                    ? 'bg-amber-500 text-slate-900 font-medium'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {g.icon} {g.label}
              </button>
            ))}
          </div>
        </div>

        {loading && <div className="text-center py-12 text-slate-500">Carregando catálogo...</div>}

        {!loading && listings.length === 0 && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">{'\u{1F4DA}'}</div>
            <h3 className="text-xl font-semibold text-white mb-3">A vitrine está sendo preparada</h3>
            <p className="text-slate-400 text-sm mb-6 max-w-md mx-auto">
              Em breve, livros de autores do Manuscry aparecerão aqui. Seja um dos primeiros!
            </p>
            <Button onClick={() => navigate('/login')} className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-medium">
              Criar meu livro agora
            </Button>
          </div>
        )}

        {/* Featured section */}
        {featured.length > 0 && activeGenre === 'all' && !search && (
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <Badge className="bg-amber-500 text-slate-900 text-xs font-bold">{'\u2B50'} Destaques</Badge>
              <span className="text-xs text-slate-500">Selecionados pela equipe Manuscry</span>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 -mx-2 px-2">
              {featured.map((book) => <BookCard key={book.id} book={book} featured />)}
            </div>
          </div>
        )}

        {/* Genre carousels (when no filter active) */}
        {activeGenre === 'all' && !search && booksByGenre.map((g) => (
          <CategoryCarousel key={g.id} title={g.label} books={g.books} icon={g.icon} />
        ))}

        {/* Filtered grid */}
        {(activeGenre !== 'all' || search) && (
          <>
            <p className="text-sm text-slate-400 mb-4">{filtered.length} livro{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}</p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {filtered.map((book) => (
                <div key={book.id} className="w-full">
                  <BookCard book={book} />
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/50 mt-12">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <span className="font-bold text-white">Manuscry Store</span>
            <p className="text-xs text-slate-500 mt-1">Livros criados com pipeline editorial profissional</p>
          </div>
          <div className="flex gap-4 text-xs text-slate-500">
            <span className="cursor-pointer hover:text-slate-300" onClick={() => navigate('/')}>Home</span>
            <span className="cursor-pointer hover:text-slate-300" onClick={() => navigate('/blog')}>Blog</span>
          </div>
          <p className="text-xs text-slate-600">&copy; {new Date().getFullYear()} DB8 Intelligence</p>
        </div>
      </footer>
    </div>
  );
}
