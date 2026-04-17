import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Collaborator, CollaboratorRole } from '@manuscry/shared';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ROLE_LABELS: Record<CollaboratorRole, { label: string; desc: string; color: string }> = {
  owner: { label: 'Proprietário', desc: 'Controle total', color: 'bg-amber-900/30 text-amber-400' },
  editor: { label: 'Editor', desc: 'Pode editar capítulos', color: 'bg-blue-900/30 text-blue-400' },
  commenter: { label: 'Comentarista', desc: 'Pode sugerir mudanças', color: 'bg-purple-900/30 text-purple-400' },
  viewer: { label: 'Leitor', desc: 'Apenas visualiza', color: 'bg-slate-800 text-slate-400' },
};

interface Props {
  projectId: string;
  onClose: () => void;
}

export default function CollaboratorsModal({ projectId, onClose }: Props) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<CollaboratorRole>('editor');
  const [inviting, setInviting] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.get<{ collaborators: Collaborator[] }>(`/api/collab/collaborators/${projectId}`)
      .then((r) => setCollaborators(r.collaborators))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [projectId]);

  async function invite() {
    if (!email) return;
    setInviting(true);
    setMsg('');
    try {
      await api.post('/api/collab/invite', { projectId, email, role });
      setMsg('Convite enviado!');
      setEmail('');
      const r = await api.get<{ collaborators: Collaborator[] }>(`/api/collab/collaborators/${projectId}`);
      setCollaborators(r.collaborators);
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Erro');
    } finally {
      setInviting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Badge className="bg-blue-900/30 text-blue-400">{'\u{1F465}'} COLABORADORES</Badge>
            <h3 className="text-white font-semibold">Convidar pessoas</h3>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white text-lg">&times;</button>
        </div>

        <div className="p-5 space-y-5">
          {/* Invite form */}
          <div className="space-y-3">
            <div className="space-y-2">
              <Label className="text-slate-300 text-sm">Email do colaborador</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colaborador@email.com"
                className="bg-slate-800 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300 text-sm">Permissão</Label>
              <Select value={role} onValueChange={(v) => { if (v) setRole(v as CollaboratorRole); }}>
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  {Object.entries(ROLE_LABELS).filter(([k]) => k !== 'owner').map(([key, val]) => (
                    <SelectItem key={key} value={key} className="text-white">
                      <span className="font-medium">{val.label}</span>
                      <span className="text-slate-500 text-xs ml-2">&middot; {val.desc}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {msg && (
              <Badge className={msg.includes('enviado') ? 'bg-emerald-900/30 text-emerald-400' : 'bg-red-900/30 text-red-400'}>
                {msg}
              </Badge>
            )}
            <Button
              onClick={invite}
              disabled={inviting || !email}
              className="w-full bg-[#1E3A8A] hover:bg-[#1E40AF] text-white"
            >
              {inviting ? 'Enviando...' : 'Enviar convite'}
            </Button>
          </div>

          {/* Existing collaborators */}
          <div>
            <p className="text-xs text-slate-500 uppercase mb-3">Colaboradores atuais ({collaborators.length})</p>
            {loading && <p className="text-slate-500 text-sm">Carregando...</p>}
            {!loading && collaborators.length === 0 && (
              <p className="text-slate-500 text-sm text-center py-4">Nenhum colaborador ainda.</p>
            )}
            <div className="space-y-2">
              {collaborators.map((c, i) => {
                const info = ROLE_LABELS[c.role];
                return (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                    <div>
                      <p className="text-white text-sm">{c.email}</p>
                      {!c.accepted && <p className="text-xs text-amber-400">Convite pendente</p>}
                    </div>
                    <Badge className={`text-xs ${info.color}`}>{info.label}</Badge>
                  </div>
                );
              })}
            </div>
          </div>

          <p className="text-xs text-slate-500 text-center">
            Recurso em beta. Edição simultânea em tempo real em breve.
          </p>
        </div>
      </div>
    </div>
  );
}
