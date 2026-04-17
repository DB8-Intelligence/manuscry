import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjectStore } from '@/stores/projectStore';
import { api } from '@/lib/api';
import type { EditorialCalendar, CalendarMilestone } from '@manuscry/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

const PHASE_ICONS: Record<number, string> = {
  0: '\u{1F4CA}', 1: '\u{1F3AF}', 2: '\u{1F4D6}', 3: '\u{1F5FA}\uFE0F', 4: '\u270D\uFE0F', 5: '\u{1F680}',
};

export default function EditorialCalendarPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentProject, fetchProject } = useProjectStore();
  const [calendar, setCalendar] = useState<EditorialCalendar | null>(null);
  const [loading, setLoading] = useState(true);
  const [deadlines, setDeadlines] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!id) return;
    fetchProject(id);
    api.get<EditorialCalendar>(`/api/collab/calendar/${id}`)
      .then((c) => {
        setCalendar(c);
        const dl: Record<string, string> = {};
        c.milestones.forEach((m) => { if (m.deadline) dl[m.id] = m.deadline; });
        setDeadlines(dl);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id, fetchProject]);

  async function updateDeadline(milestoneId: string, deadline: string) {
    if (!id) return;
    setDeadlines({ ...deadlines, [milestoneId]: deadline });
    try {
      await api.patch(`/api/collab/calendar/${id}/milestone`, { milestoneId, deadline });
    } catch { /* ignore */ }
  }

  if (loading || !calendar || !currentProject) {
    return <div className="min-h-screen bg-[#0F172A] flex items-center justify-center"><div className="text-slate-500">Carregando...</div></div>;
  }

  const completed = calendar.milestones.filter((m: CalendarMilestone) => m.completed).length;
  const total = calendar.milestones.length;
  const progressPercent = (completed / total) * 100;

  const today = new Date();
  const upcoming = calendar.milestones
    .filter((m) => !m.completed && deadlines[m.id])
    .sort((a, b) => new Date(deadlines[a.id]).getTime() - new Date(deadlines[b.id]).getTime())
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-[#0F172A]">
      <header className="border-b border-slate-800 bg-slate-900/50">
        <div className="max-w-4xl mx-auto px-6 py-5">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/projects/${id}`)} className="text-slate-400 hover:text-white mb-3 -ml-2">&larr; Voltar ao Projeto</Button>
          <div className="flex items-center gap-3">
            <Badge className="bg-emerald-900/30 text-emerald-400">{'\u{1F4C5}'} CALENDÁRIO</Badge>
            <h1 className="text-xl font-bold text-white">Calendário Editorial</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">{currentProject.name}</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Progress */}
        <Card className="border-slate-700 bg-slate-900/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold">Progresso do projeto</h3>
              <span className="text-sm text-slate-400">{completed}/{total} fases completas</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2">
              <div className="bg-amber-500 h-2 rounded-full transition-all" style={{ width: `${progressPercent}%` }} />
            </div>
          </CardContent>
        </Card>

        {/* Upcoming deadlines */}
        {upcoming.length > 0 && (
          <Card className="border-amber-800/30 bg-amber-950/10">
            <CardHeader>
              <CardTitle className="text-amber-400 text-sm">Próximas deadlines</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {upcoming.map((m) => {
                const dl = new Date(deadlines[m.id]);
                const daysLeft = Math.ceil((dl.getTime() - today.getTime()) / 86400000);
                const urgent = daysLeft <= 3;
                return (
                  <div key={m.id} className="flex items-center justify-between text-sm">
                    <span className="text-slate-300">{PHASE_ICONS[m.phase]} {m.phase_name}</span>
                    <Badge className={urgent ? 'bg-red-900/30 text-red-400 text-xs' : 'bg-slate-800 text-slate-400 text-xs'}>
                      {daysLeft > 0 ? `${daysLeft} dias` : 'atrasado'}
                    </Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Timeline */}
        <div>
          <h3 className="text-white font-semibold mb-4">Timeline completa</h3>
          <div className="space-y-3">
            {calendar.milestones.map((m: CalendarMilestone, i: number) => {
              const isLast = i === calendar.milestones.length - 1;
              const dl = deadlines[m.id];
              const isPast = dl && new Date(dl) < today && !m.completed;
              return (
                <div key={m.id} className="flex gap-4">
                  {/* Timeline marker */}
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0 ${
                      m.completed ? 'bg-emerald-900/50 border-2 border-emerald-500' :
                      'bg-slate-800 border-2 border-slate-700'
                    }`}>
                      {m.completed ? '\u2713' : PHASE_ICONS[m.phase]}
                    </div>
                    {!isLast && <div className={`w-0.5 flex-1 my-1 ${m.completed ? 'bg-emerald-800/50' : 'bg-slate-800'}`} style={{ minHeight: 40 }} />}
                  </div>

                  {/* Content */}
                  <Card className={`flex-1 mb-3 ${
                    m.completed ? 'border-emerald-800/30 bg-emerald-950/10' :
                    isPast ? 'border-red-800/30 bg-red-950/10' :
                    'border-slate-700 bg-slate-900/50'
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-mono text-slate-500">FASE {m.phase}</span>
                            {m.completed && <Badge className="bg-emerald-900/30 text-emerald-400 text-xs">Concluída</Badge>}
                            {isPast && <Badge className="bg-red-900/30 text-red-400 text-xs">Atrasada</Badge>}
                          </div>
                          <h4 className="font-semibold text-white">{m.title}</h4>
                          <p className="text-xs text-slate-500 mt-1">{m.notes}</p>
                        </div>
                        <div className="w-40">
                          <Input
                            type="date"
                            value={dl || ''}
                            onChange={(e) => updateDeadline(m.id, e.target.value)}
                            disabled={m.completed}
                            className="bg-slate-800 border-slate-600 text-white text-xs h-8"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tips */}
        <Card className="border-slate-700 bg-slate-900/50">
          <CardContent className="p-5">
            <p className="text-xs text-slate-500 mb-2">{'\u{1F4A1}'} Dica de produtividade</p>
            <p className="text-sm text-slate-300">
              Defina deadlines realistas para cada fase. Autores bem-sucedidos reservam 2-4 semanas
              para escrita (Fase 4) e 1 semana para produção (Fase 5). Você recebe alertas próximos
              do prazo.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
