import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import type { SalesOverview, BookPerformance } from '@manuscry/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';

const COLORS = ['#F59E0B', '#3B82F6', '#10B981', '#8B5CF6', '#EF4444', '#06B6D4'];

export default function Analytics() {
  const navigate = useNavigate();
  const [overview, setOverview] = useState<SalesOverview | null>(null);
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [bookPerf, setBookPerf] = useState<BookPerformance | null>(null);
  const [loading, setLoading] = useState(true);
  const [perfLoading, setPerfLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<SalesOverview>('/api/analytics/sales')
      .then(setOverview)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function loadBookPerformance(projectId: string) {
    setSelectedBook(projectId);
    setPerfLoading(true);
    setBookPerf(null);
    try {
      const res = await api.get<BookPerformance>(`/api/analytics/performance/${projectId}`);
      setBookPerf(res);
    } catch { /* ignore */ }
    finally { setPerfLoading(false); }
  }

  async function downloadReport() {
    setReportLoading(true);
    setError('');
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${apiUrl}/api/analytics/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        } as HeadersInit,
        body: JSON.stringify({ type: 'full_report' }),
      });
      if (!res.ok) throw new Error('Erro ao gerar relatório');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `manuscry-relatorio-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro');
    } finally { setReportLoading(false); }
  }

  const fmt = (cents: number) => {
    const v = cents / 100;
    return overview?.currency === 'USD' ? `$${v.toFixed(2)}` : `R$ ${v.toFixed(2)}`;
  };

  if (loading) {
    return <div className="min-h-screen bg-[#0F172A] flex items-center justify-center"><div className="text-slate-500">Carregando analytics...</div></div>;
  }

  return (
    <div className="min-h-screen bg-[#0F172A]">
      <header className="border-b border-slate-800 bg-slate-900/50">
        <div className="max-w-6xl mx-auto px-6 py-5">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="text-slate-400 hover:text-white mb-3 -ml-2">&larr; Dashboard</Button>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge className="bg-blue-900/30 text-blue-400">ANALYTICS</Badge>
              <h1 className="text-xl font-bold text-white">Sales Dashboard</h1>
            </div>
            <Button onClick={downloadReport} disabled={reportLoading} variant="outline" className="border-slate-600 text-slate-300 text-sm">
              {reportLoading ? 'Gerando...' : '\u{1F4C4} Baixar relatório PDF'}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {error && <div className="bg-red-900/30 border border-red-800 text-red-300 p-3 rounded-lg text-sm">{error}</div>}

        {/* KPI Cards */}
        {overview && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-slate-700 bg-slate-900/50">
              <CardContent className="p-4">
                <p className="text-xs text-slate-500">Receita líquida</p>
                <p className="text-2xl font-bold text-emerald-400">{fmt(overview.total_net_cents)}</p>
              </CardContent>
            </Card>
            <Card className="border-slate-700 bg-slate-900/50">
              <CardContent className="p-4">
                <p className="text-xs text-slate-500">Vendas totais</p>
                <p className="text-2xl font-bold text-white">{overview.total_sales}</p>
              </CardContent>
            </Card>
            <Card className="border-slate-700 bg-slate-900/50">
              <CardContent className="p-4">
                <p className="text-xs text-slate-500">Livros publicados</p>
                <p className="text-2xl font-bold text-[#93C5FD]">{overview.total_books_published}</p>
              </CardContent>
            </Card>
            <Card className="border-slate-700 bg-slate-900/50">
              <CardContent className="p-4">
                <p className="text-xs text-slate-500">Preço médio</p>
                <p className="text-2xl font-bold text-amber-400">{fmt(overview.avg_price_cents)}</p>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue by channel chart */}
          {overview && overview.by_channel.length > 0 && (
            <Card className="border-slate-700 bg-slate-900/50">
              <CardHeader><CardTitle className="text-white text-sm">Receita por Canal</CardTitle></CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={overview.by_channel}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="channel_name" tick={{ fill: '#94A3B8', fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
                      <YAxis tick={{ fill: '#94A3B8', fontSize: 10 }} />
                      <Tooltip contentStyle={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 8, color: '#F8FAFC' }} />
                      <Bar dataKey="net_cents" name="Receita líquida" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sales by book pie chart */}
          {overview && overview.by_book.length > 0 && (
            <Card className="border-slate-700 bg-slate-900/50">
              <CardHeader><CardTitle className="text-white text-sm">Vendas por Livro</CardTitle></CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={overview.by_book} dataKey="total_sales" nameKey="title" cx="50%" cy="50%" outerRadius={80} label={({ name }) => typeof name === 'string' ? name.slice(0, 15) : ''}>
                        {overview.by_book.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 8, color: '#F8FAFC' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Best seller highlight */}
        {overview?.best_seller && (
          <Card className="border-amber-800/30 bg-amber-950/10">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="text-3xl">{'\u{1F3C6}'}</div>
              <div>
                <p className="text-xs text-amber-400 uppercase">Best Seller</p>
                <h3 className="text-white font-bold">{overview.best_seller.title}</h3>
                <p className="text-sm text-slate-400">{overview.best_seller.total_sales} vendas — {fmt(overview.best_seller.revenue_cents)}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Book list with performance drill-down */}
        {overview && overview.by_book.length > 0 && (
          <Card className="border-slate-700 bg-slate-900/50">
            <CardHeader>
              <CardTitle className="text-white text-sm">Performance por Livro</CardTitle>
              <p className="text-xs text-slate-500">Clique em um livro para análise de mercado com IA</p>
            </CardHeader>
            <CardContent className="space-y-2">
              {overview.by_book.map((book) => (
                <button
                  key={book.project_id}
                  onClick={() => loadBookPerformance(book.project_id)}
                  className={`w-full text-left rounded-lg p-4 transition-all ${
                    selectedBook === book.project_id
                      ? 'bg-[#1E3A8A]/10 border border-[#1E3A8A]/50'
                      : 'bg-slate-800/30 border border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-medium text-sm">{book.title}</h4>
                      <p className="text-xs text-slate-500">{book.genre}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold text-sm">{book.total_sales} vendas</p>
                      <p className="text-xs text-emerald-400">{fmt(book.revenue_cents)}</p>
                    </div>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Book performance detail */}
        {perfLoading && (
          <Card className="border-slate-700 bg-slate-900/50 text-center py-12">
            <CardContent>
              <div className="animate-spin w-6 h-6 border-2 border-slate-600 border-t-amber-500 rounded-full mx-auto mb-3" />
              <p className="text-white text-sm">Analisando mercado com IA...</p>
            </CardContent>
          </Card>
        )}

        {bookPerf && (
          <div className="space-y-4">
            <h3 className="text-white font-semibold">Análise: "{bookPerf.title}"</h3>

            {/* Market trends */}
            {bookPerf.market_trends.length > 0 && (
              <Card className="border-slate-700 bg-slate-900/50">
                <CardHeader><CardTitle className="text-white text-sm">Tendências de Mercado</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {bookPerf.market_trends.map((t, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-slate-300">"{t.keyword}"</span>
                        <div className="flex gap-2">
                          <Badge className={t.trend === 'rising' ? 'bg-emerald-900/30 text-emerald-400 text-xs' : t.trend === 'declining' ? 'bg-red-900/30 text-red-400 text-xs' : 'bg-slate-800 text-slate-400 text-xs'}>
                            {t.trend === 'rising' ? '\u2191' : t.trend === 'declining' ? '\u2193' : '\u2192'} {t.search_volume}
                          </Badge>
                          <Badge className="bg-slate-800 text-slate-500 text-xs">Comp: {t.competition}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Competitors */}
            {bookPerf.competitors.length > 0 && (
              <Card className="border-slate-700 bg-slate-900/50">
                <CardHeader><CardTitle className="text-white text-sm">Top Concorrentes</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {bookPerf.competitors.map((c, i) => (
                      <div key={i} className="flex items-center justify-between text-sm border-b border-slate-800 last:border-0 pb-2 last:pb-0">
                        <div>
                          <p className="text-white">{c.title}</p>
                          <p className="text-xs text-slate-500">{c.author}</p>
                        </div>
                        <div className="flex gap-3 text-xs text-slate-400">
                          <span>BSR #{c.bsr.toLocaleString()}</span>
                          <span>{c.rating}{'\u2B50'} ({c.reviews})</span>
                          <span className="text-amber-400">{c.price}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recommendations */}
            {bookPerf.recommendations.length > 0 && (
              <Card className="border-amber-800/30 bg-amber-950/10">
                <CardHeader><CardTitle className="text-amber-400 text-sm">Recomendações da IA</CardTitle></CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {bookPerf.recommendations.map((r, i) => (
                      <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                        <span className="text-amber-500">{'\u{1F4A1}'}</span> {r}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Empty state */}
        {overview && overview.by_book.length === 0 && (
          <Card className="border-slate-700 bg-slate-900/50 text-center py-16">
            <CardContent>
              <div className="text-4xl mb-4">{'\u{1F4CA}'}</div>
              <h3 className="text-lg font-semibold text-white mb-2">Nenhuma venda ainda</h3>
              <p className="text-sm text-slate-400 mb-6">Publique seu primeiro livro e ative a distribuição para ver os dados aqui.</p>
              <Button onClick={() => navigate('/dashboard')} className="bg-amber-500 hover:bg-amber-600 text-slate-900">Ir para meus livros</Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
