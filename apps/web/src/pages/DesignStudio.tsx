import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjectStore } from '@/stores/projectStore';
import { api } from '@/lib/api';
import type { CanvaDesign } from '@manuscry/shared';
import { CANVA_DESIGN_TEMPLATES } from '@manuscry/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function DesignStudio() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentProject, fetchProject } = useProjectStore();

  const [designs, setDesigns] = useState<CanvaDesign[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetchProject(id);
    loadDesigns();
  }, [id, fetchProject]);

  async function loadDesigns() {
    if (!id) return;
    setLoading(true);
    try {
      const res = await api.get<{ designs: CanvaDesign[] }>(`/api/canva/designs/${id}`);
      setDesigns(res.designs);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  async function createDesign(type: string) {
    if (!id) return;
    setCreating(type);
    try {
      const res = await api.post<{ design: CanvaDesign }>('/api/canva/create', {
        projectId: id, type,
      });
      setDesigns((prev) => [...prev, res.design]);
      if (res.design.canva_edit_url) {
        window.open(res.design.canva_edit_url, '_blank');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao criar design');
    } finally {
      setCreating(null);
    }
  }

  if (!currentProject) {
    return <div className="min-h-screen bg-[#0F172A] flex items-center justify-center"><div className="text-slate-500">Carregando...</div></div>;
  }

  return (
    <div className="min-h-screen bg-[#0F172A]">
      <header className="border-b border-slate-800 bg-slate-900/50">
        <div className="max-w-5xl mx-auto px-6 py-5">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/projects/${id}`)} className="text-slate-400 hover:text-white mb-3 -ml-2">
            &larr; Voltar ao Projeto
          </Button>
          <div className="flex items-center gap-3">
            <Badge className="bg-pink-900/30 text-pink-400">{'\u{1F3A8}'} DESIGN</Badge>
            <h1 className="text-xl font-bold text-white">Design Studio</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Crie materiais visuais profissionais com Canva para "{currentProject.name}"
          </p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Template gallery */}
        <div>
          <h3 className="text-white font-semibold mb-4">Criar novo design</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {CANVA_DESIGN_TEMPLATES.map((t) => (
              <Card key={t.type} className="border-slate-700 bg-slate-900/50 hover:border-pink-800/50 transition-all cursor-pointer group">
                <CardContent className="p-5 text-center">
                  <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">{t.icon}</div>
                  <h4 className="font-semibold text-white text-sm">{t.label}</h4>
                  <p className="text-xs text-slate-500 mt-1">{t.description}</p>
                  <p className="text-[10px] text-slate-600 mt-1">{t.dimensions.width}x{t.dimensions.height}px</p>
                  <Button
                    size="sm"
                    onClick={() => createDesign(t.type)}
                    disabled={creating !== null}
                    className="mt-3 w-full bg-pink-600 hover:bg-pink-700 text-white text-xs"
                  >
                    {creating === t.type ? 'Abrindo...' : 'Criar no Canva'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Existing designs */}
        {!loading && designs.length > 0 && (
          <div>
            <h3 className="text-white font-semibold mb-4">Seus designs ({designs.length})</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {designs.map((d) => {
                const template = CANVA_DESIGN_TEMPLATES.find((t) => t.type === d.type);
                return (
                  <Card key={d.id} className="border-slate-700 bg-slate-900/50 overflow-hidden">
                    {d.thumbnail_url ? (
                      <div className="aspect-video bg-slate-800">
                        <img src={d.thumbnail_url} alt={d.title} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="aspect-video bg-slate-800 flex items-center justify-center text-3xl text-slate-700">
                        {template?.icon || '\u{1F3A8}'}
                      </div>
                    )}
                    <CardContent className="p-4">
                      <p className="text-white text-sm font-medium truncate">{d.title}</p>
                      <div className="flex items-center justify-between mt-2">
                        <Badge className="bg-slate-800 text-slate-400 text-[10px]">{template?.label || d.type}</Badge>
                        {d.canva_edit_url && (
                          <a href={d.canva_edit_url} target="_blank" rel="noopener noreferrer" className="text-xs text-pink-400 hover:text-pink-300">
                            Editar &rarr;
                          </a>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* How it works */}
        <Card className="border-slate-700 bg-slate-900/50">
          <CardHeader>
            <CardTitle className="text-white text-sm">Como funciona</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-400 space-y-2">
            <p>1. Escolha o tipo de material (capa, post, carrossel, etc.)</p>
            <p>2. O Canva abre com as dimensões corretas pré-configuradas</p>
            <p>3. Edite com as ferramentas do Canva (templates, fontes, imagens)</p>
            <p>4. Baixe ou publique diretamente do Canva</p>
            <p className="text-xs text-slate-600 mt-3">
              Dica: use a capa gerada pela IA (Fase 5) como base e refine no Canva.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
