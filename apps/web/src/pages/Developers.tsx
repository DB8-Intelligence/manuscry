import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import type { PublicApiKey, ApiKeyCreated, ApiKeyScope } from '@manuscry/shared';
import { AVAILABLE_SCOPES } from '@manuscry/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function Developers() {
  const navigate = useNavigate();
  const [keys, setKeys] = useState<PublicApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [selectedScopes, setSelectedScopes] = useState<Set<ApiKeyScope>>(new Set(['read:projects']));
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState<ApiKeyCreated | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get<{ keys: PublicApiKey[] }>('/api/api-keys');
      setKeys(res.keys);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  function toggleScope(s: ApiKeyScope) {
    setSelectedScopes((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s); else next.add(s);
      return next;
    });
  }

  async function create() {
    if (!name) return;
    setCreating(true);
    try {
      const res = await api.post<{ key: ApiKeyCreated; warning: string }>('/api/api-keys', {
        name, scopes: Array.from(selectedScopes),
      });
      setNewKey(res.key);
      setName('');
      setSelectedScopes(new Set(['read:projects']));
      setShowForm(false);
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro');
    } finally {
      setCreating(false);
    }
  }

  async function revoke(id: string) {
    if (!confirm('Revogar esta chave? Aplicações usando ela pararão de funcionar imediatamente.')) return;
    await api.delete(`/api/api-keys/${id}`);
    await load();
  }

  function copyKey(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="min-h-screen bg-[#0F172A]">
      <header className="border-b border-slate-800 bg-slate-900/50">
        <div className="max-w-5xl mx-auto px-6 py-5">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="text-slate-400 hover:text-white mb-3 -ml-2">&larr; Dashboard</Button>
          <div className="flex items-center gap-3">
            <Badge className="bg-purple-900/30 text-purple-400">{'\u{1F5A5}\uFE0F'} DEVELOPERS</Badge>
            <h1 className="text-xl font-bold text-white">API Pública</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">Gerencie chaves de API e construa integrações sobre o Manuscry</p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* New key banner */}
        {newKey && (
          <Card className="border-amber-500/50 bg-amber-950/20">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-amber-400 font-semibold">{'\u26A0\uFE0F'} Copie sua chave agora</h3>
                <button onClick={() => setNewKey(null)} className="text-slate-500 hover:text-white">&times;</button>
              </div>
              <p className="text-xs text-slate-400 mb-3">Esta chave não será mostrada novamente. Guarde em local seguro.</p>
              <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 font-mono text-xs text-amber-300 break-all">
                {newKey.full_key}
              </div>
              <Button size="sm" onClick={() => copyKey(newKey.full_key)} className="mt-3 bg-amber-500 hover:bg-amber-600 text-slate-900">
                {copied ? 'Copiado!' : 'Copiar chave'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Quick start */}
        <Card className="border-slate-700 bg-slate-900/50">
          <CardHeader>
            <CardTitle className="text-white text-base">Início rápido</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-slate-950 border border-slate-800 rounded-lg p-4 text-xs text-slate-300 overflow-x-auto">
{`curl https://api.manuscry.ai/v1/me \\
  -H "Authorization: Bearer msc_live_..."

# Listar projetos
curl https://api.manuscry.ai/v1/projects \\
  -H "Authorization: Bearer msc_live_..."

# Criar projeto
curl -X POST https://api.manuscry.ai/v1/projects \\
  -H "Authorization: Bearer msc_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{"name": "Meu Livro", "genre": "Romance", "market": "pt-br"}'`}
            </pre>
            <p className="text-xs text-slate-500 mt-3">
              Base URL: <code className="text-amber-400">https://api.manuscry.ai/v1</code> &middot; Rate limit: 60 req/min
            </p>
          </CardContent>
        </Card>

        {/* Endpoints */}
        <Card className="border-slate-700 bg-slate-900/50">
          <CardHeader>
            <CardTitle className="text-white text-base">Endpoints disponíveis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {[
                { method: 'GET', path: '/v1/me', desc: 'Informações da conta' },
                { method: 'GET', path: '/v1/projects', desc: 'Listar projetos', scope: 'read:projects' },
                { method: 'GET', path: '/v1/projects/:id', desc: 'Detalhes do projeto', scope: 'read:projects' },
                { method: 'POST', path: '/v1/projects', desc: 'Criar projeto', scope: 'write:projects' },
                { method: 'GET', path: '/v1/projects/:id/chapters', desc: 'Listar capítulos', scope: 'read:books' },
                { method: 'GET', path: '/v1/analytics/sales', desc: 'Resumo de vendas', scope: 'read:analytics' },
              ].map((e) => (
                <div key={e.path} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                  <Badge className={e.method === 'GET' ? 'bg-blue-900/30 text-blue-400 text-xs font-mono' : 'bg-emerald-900/30 text-emerald-400 text-xs font-mono'}>{e.method}</Badge>
                  <code className="text-sm text-slate-300 flex-1">{e.path}</code>
                  <span className="text-xs text-slate-500">{e.desc}</span>
                  {e.scope && <Badge className="bg-slate-900 text-slate-500 text-[10px]">{e.scope}</Badge>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* API Keys list */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">Suas chaves de API</h3>
            <Button onClick={() => setShowForm(!showForm)} className="bg-[#1E3A8A] hover:bg-[#1E40AF] text-white">
              {showForm ? 'Cancelar' : '+ Nova chave'}
            </Button>
          </div>

          {showForm && (
            <Card className="border-slate-700 bg-slate-900/50 mb-4">
              <CardContent className="p-5 space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Nome da chave</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Integração Produção" className="bg-slate-800 border-slate-600 text-white" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Escopos / permissões</Label>
                  <div className="space-y-2">
                    {AVAILABLE_SCOPES.map((s) => (
                      <label key={s.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/50 cursor-pointer hover:bg-slate-800">
                        <input type="checkbox" checked={selectedScopes.has(s.id)} onChange={() => toggleScope(s.id)} className="mt-1" />
                        <div>
                          <p className="text-white text-sm font-medium">{s.label}</p>
                          <p className="text-xs text-slate-500">{s.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                <Button onClick={create} disabled={creating || !name} className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900">
                  {creating ? 'Criando...' : 'Gerar chave'}
                </Button>
              </CardContent>
            </Card>
          )}

          {loading && <p className="text-slate-500 text-sm">Carregando...</p>}
          {!loading && keys.length === 0 && !showForm && (
            <Card className="border-slate-700 bg-slate-900/50 text-center py-10">
              <CardContent>
                <p className="text-slate-500 text-sm">Nenhuma chave criada ainda.</p>
                <p className="text-xs text-slate-600 mt-2">API Pública disponível no plano Publisher.</p>
              </CardContent>
            </Card>
          )}

          <div className="space-y-2">
            {keys.map((k) => (
              <Card key={k.id} className="border-slate-700 bg-slate-900/50">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-white text-sm font-medium">{k.name}</p>
                    <p className="text-xs text-slate-500 font-mono">{k.key_prefix}...{'\u2022'.repeat(20)}</p>
                    <div className="flex gap-1 mt-2">
                      {k.scopes.map((s) => <Badge key={s} className="bg-slate-800 text-slate-400 text-[10px]">{s}</Badge>)}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">
                      {k.last_used_at ? `Último uso: ${new Date(k.last_used_at).toLocaleDateString('pt-BR')}` : 'Nunca usada'}
                    </p>
                    <Button size="sm" variant="outline" onClick={() => revoke(k.id)} className="mt-2 border-red-800 text-red-400 hover:bg-red-950 text-xs h-7">
                      Revogar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Card className="border-slate-700 bg-slate-900/50">
          <CardContent className="p-5">
            <p className="text-xs text-slate-500 mb-2">{'\u{1F512}'} Segurança</p>
            <p className="text-sm text-slate-300">
              Chaves de API permitem acesso total aos escopos concedidos. Nunca exponha em código cliente,
              repos públicos ou logs. Use variáveis de ambiente e rotação periódica.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
