import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import type { GamificationProfile, Badge } from '@manuscry/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge as UiBadge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const CATEGORY_LABELS: Record<string, string> = {
  writing: 'Escrita',
  publishing: 'Publicação',
  social: 'Social',
  milestone: 'Marcos',
};

export default function Achievements() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<GamificationProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [goalInput, setGoalInput] = useState('1000');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get<GamificationProfile>('/api/collab/gamification')
      .then((p) => {
        setProfile(p);
        setGoalInput(String(p.daily_goal.target_words || 1000));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function saveGoal() {
    setSaving(true);
    try {
      await api.post('/api/collab/gamification/daily-goal', { targetWords: parseInt(goalInput) });
      const p = await api.get<GamificationProfile>('/api/collab/gamification');
      setProfile(p);
    } catch { /* ignore */ }
    finally { setSaving(false); }
  }

  if (loading || !profile) {
    return <div className="min-h-screen bg-[#0F172A] flex items-center justify-center"><div className="text-slate-500">Carregando...</div></div>;
  }

  const earned = profile.badges.filter((b) => b.earned);
  const byCategory: Record<string, Badge[]> = {};
  for (const b of profile.badges) {
    if (!byCategory[b.category]) byCategory[b.category] = [];
    byCategory[b.category].push(b);
  }

  const dailyProgress = Math.min(100, (profile.daily_goal.words_today / profile.daily_goal.target_words) * 100);
  const xpForNextLevel = (profile.level ** 2) * 100;
  const xpInCurrentLevel = profile.xp - ((profile.level - 1) ** 2) * 100;
  const xpNeededForNext = xpForNextLevel - ((profile.level - 1) ** 2) * 100;
  const levelProgress = Math.min(100, (xpInCurrentLevel / xpNeededForNext) * 100);

  return (
    <div className="min-h-screen bg-[#0F172A]">
      <header className="border-b border-slate-800 bg-slate-900/50">
        <div className="max-w-5xl mx-auto px-6 py-5">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="text-slate-400 hover:text-white mb-3 -ml-2">&larr; Dashboard</Button>
          <div className="flex items-center gap-3">
            <UiBadge className="bg-amber-500/20 text-amber-400 border border-amber-500/30">{'\u{1F3C6}'} CONQUISTAS</UiBadge>
            <h1 className="text-xl font-bold text-white">Suas Conquistas</h1>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Level + XP */}
        <Card className="border-amber-800/30 bg-gradient-to-r from-amber-950/20 to-[#1E3A8A]/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-amber-400 uppercase">Nível</p>
                <p className="text-4xl font-bold text-white">{profile.level}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 uppercase">Experience</p>
                <p className="text-2xl font-bold text-amber-400">{profile.xp.toLocaleString()} XP</p>
              </div>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2">
              <div className="bg-gradient-to-r from-amber-500 to-amber-400 h-2 rounded-full transition-all" style={{ width: `${levelProgress}%` }} />
            </div>
            <p className="text-xs text-slate-500 mt-2">{xpInCurrentLevel} / {xpNeededForNext} XP para o próximo nível</p>
          </CardContent>
        </Card>

        {/* Quick stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-slate-700 bg-slate-900/50">
            <CardContent className="p-4">
              <p className="text-xs text-slate-500">{'\u{1F525}'} Streak atual</p>
              <p className="text-2xl font-bold text-orange-400">{profile.streak.current_days} dias</p>
              <p className="text-[10px] text-slate-600">Recorde: {profile.streak.longest_days} dias</p>
            </CardContent>
          </Card>
          <Card className="border-slate-700 bg-slate-900/50">
            <CardContent className="p-4">
              <p className="text-xs text-slate-500">{'\u270D\uFE0F'} Palavras total</p>
              <p className="text-2xl font-bold text-white">{profile.total_words_lifetime.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card className="border-slate-700 bg-slate-900/50">
            <CardContent className="p-4">
              <p className="text-xs text-slate-500">{'\u{1F4DA}'} Livros publicados</p>
              <p className="text-2xl font-bold text-emerald-400">{profile.books_published}</p>
            </CardContent>
          </Card>
          <Card className="border-slate-700 bg-slate-900/50">
            <CardContent className="p-4">
              <p className="text-xs text-slate-500">{'\u2B50'} Badges conquistadas</p>
              <p className="text-2xl font-bold text-[#93C5FD]">{earned.length}/{profile.badges.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Daily goal */}
        <Card className="border-slate-700 bg-slate-900/50">
          <CardHeader>
            <CardTitle className="text-white text-base">Meta diária de palavras</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-400">Progresso hoje</span>
                <span className="text-white font-medium">{profile.daily_goal.words_today} / {profile.daily_goal.target_words}</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-3">
                <div className={`h-3 rounded-full transition-all ${profile.daily_goal.completed ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${dailyProgress}%` }} />
              </div>
              {profile.daily_goal.completed && (
                <p className="text-xs text-emerald-400 mt-2">{'\u2713'} Meta do dia atingida! +30 XP</p>
              )}
            </div>
            <div className="flex items-end gap-3">
              <div className="flex-1 space-y-1">
                <Label className="text-slate-300 text-xs">Ajustar meta diária</Label>
                <Input type="number" value={goalInput} onChange={(e) => setGoalInput(e.target.value)} className="bg-slate-800 border-slate-600 text-white" />
              </div>
              <Button onClick={saveGoal} disabled={saving} className="bg-[#1E3A8A] hover:bg-[#1E40AF] text-white">
                {saving ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Badges by category */}
        {Object.entries(byCategory).map(([cat, badges]) => (
          <Card key={cat} className="border-slate-700 bg-slate-900/50">
            <CardHeader>
              <CardTitle className="text-white text-base">{CATEGORY_LABELS[cat] || cat}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {badges.map((b) => (
                  <div key={b.id} className={`rounded-lg border p-4 text-center transition-all ${
                    b.earned ? 'border-amber-800/50 bg-amber-950/20' : 'border-slate-700 bg-slate-800/30 opacity-50'
                  }`}>
                    <div className={`text-3xl mb-2 ${!b.earned && 'grayscale'}`}>{b.icon}</div>
                    <p className={`text-xs font-semibold ${b.earned ? 'text-amber-400' : 'text-slate-400'}`}>{b.name}</p>
                    <p className="text-[10px] text-slate-500 mt-1">{b.description}</p>
                    {b.earned && b.earned_at && (
                      <p className="text-[9px] text-emerald-500 mt-2">{new Date(b.earned_at).toLocaleDateString('pt-BR')}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </main>
    </div>
  );
}
