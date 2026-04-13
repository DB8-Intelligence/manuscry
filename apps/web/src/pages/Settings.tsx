import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function Settings() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-[#0F172A]">
      <header className="border-b border-slate-800 bg-slate-900/50">
        <div className="max-w-4xl mx-auto px-6 py-5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard')}
            className="text-slate-400 hover:text-white mb-3 -ml-2"
          >
            &larr; Dashboard
          </Button>
          <h1 className="text-2xl font-bold text-white">Configurações</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <Card className="border-slate-700 bg-slate-900/50">
          <CardHeader>
            <CardTitle className="text-white text-base">Conta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-slate-400">
              Email: <span className="text-slate-200">{user?.email}</span>
            </p>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              Plano: <Badge className="bg-amber-500/20 text-amber-400">Trial</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-700 bg-slate-900/50">
          <CardHeader>
            <CardTitle className="text-white text-base">Sessão</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={signOut}
              className="border-red-800 text-red-400 hover:bg-red-950 hover:text-red-300"
            >
              Sair da conta
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
