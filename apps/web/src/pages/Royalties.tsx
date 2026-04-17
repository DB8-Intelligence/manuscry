import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import type {
  RoyaltySummary, AuthorAgreement,
  BankAccount, PlatformPaymentDelay,
} from '@manuscry/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Royalties() {
  const navigate = useNavigate();

  const [summary, setSummary] = useState<RoyaltySummary | null>(null);
  const [agreement, setAgreement] = useState<AuthorAgreement | null>(null);
  const [agreementText, setAgreementText] = useState('');
  const [delays, setDelays] = useState<PlatformPaymentDelay[]>([]);
  const [bank, setBank] = useState<BankAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);

  // Bank form
  const [bankForm, setBankForm] = useState({
    country: 'BR' as const,
    holder_name: '', document: '', bank_name: '', bank_code: '',
    agency: '', account_number: '', account_type: 'checking' as 'checking' | 'savings',
    pix_key: '',
  });
  const [savingBank, setSavingBank] = useState(false);
  const [bankMsg, setBankMsg] = useState('');

  useEffect(() => {
    Promise.all([
      api.get<{ summary: RoyaltySummary }>('/api/royalties/summary'),
      api.get<{ agreement: AuthorAgreement | null; terms_text: string; platform_delays: PlatformPaymentDelay[] }>('/api/royalties/agreement'),
      api.get<{ bank_account: BankAccount | null }>('/api/royalties/bank'),
    ]).then(([sumRes, agrRes, bankRes]) => {
      setSummary(sumRes.summary);
      setAgreement(agrRes.agreement);
      setAgreementText(agrRes.terms_text);
      setDelays(agrRes.platform_delays);
      setBank(bankRes.bank_account);
      if (bankRes.bank_account) {
        setBankForm({
          country: bankRes.bank_account.country as 'BR',
          holder_name: bankRes.bank_account.holder_name,
          document: bankRes.bank_account.document,
          bank_name: bankRes.bank_account.bank_name,
          bank_code: bankRes.bank_account.bank_code,
          agency: bankRes.bank_account.agency,
          account_number: bankRes.bank_account.account_number,
          account_type: bankRes.bank_account.account_type,
          pix_key: bankRes.bank_account.pix_key || '',
        });
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function acceptAgreement() {
    setAccepting(true);
    try {
      const res = await api.post<{ agreement: AuthorAgreement }>('/api/royalties/agreement/accept', {});
      setAgreement(res.agreement);
    } catch { /* ignore */ }
    finally { setAccepting(false); }
  }

  async function saveBank() {
    if (!bankForm.holder_name || !bankForm.bank_code || !bankForm.account_number) {
      setBankMsg('Preencha os campos obrigatórios');
      return;
    }
    setSavingBank(true);
    setBankMsg('');
    try {
      const res = await api.post<{ bank_account: BankAccount }>('/api/royalties/bank', bankForm);
      setBank(res.bank_account);
      setBankMsg('Dados bancários salvos');
      setTimeout(() => setBankMsg(''), 3000);
    } catch (err) {
      setBankMsg(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally { setSavingBank(false); }
  }

  if (loading) {
    return <div className="min-h-screen bg-[#0F172A] flex items-center justify-center"><div className="text-slate-500">Carregando...</div></div>;
  }

  const formatCurrency = (cents: number, currency: string) => {
    const val = cents / 100;
    return currency === 'BRL' ? `R$ ${val.toFixed(2)}` : `$ ${val.toFixed(2)}`;
  };

  return (
    <div className="min-h-screen bg-[#0F172A]">
      <header className="border-b border-slate-800 bg-slate-900/50">
        <div className="max-w-4xl mx-auto px-6 py-5">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="text-slate-400 hover:text-white mb-3 -ml-2">&larr; Dashboard</Button>
          <div className="flex items-center gap-3">
            <Badge className="bg-emerald-900/30 text-emerald-400">ROYALTIES</Badge>
            <h1 className="text-xl font-bold text-white">Royalties e Pagamentos</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Agreement */}
        {!agreement?.accepted && (
          <Card className="border-amber-800/30 bg-amber-950/10">
            <CardHeader>
              <CardTitle className="text-white text-base">Acordo de Distribuição e Royalties</CardTitle>
              <p className="text-sm text-slate-400">Aceite os termos para ativar a distribuição e receber pagamentos</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-slate-800/50 rounded-lg p-4 max-h-64 overflow-y-auto">
                <pre className="text-xs text-slate-400 whitespace-pre-wrap font-sans leading-relaxed">{agreementText}</pre>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-white mb-2">Prazos por plataforma</h4>
                <div className="space-y-1">
                  {delays.map((d) => (
                    <div key={d.platform} className="flex justify-between text-xs">
                      <span className="text-slate-400">{d.platform}</span>
                      <span className="text-slate-300">{d.delay_days} dias</span>
                    </div>
                  ))}
                </div>
              </div>
              <Button onClick={acceptAgreement} disabled={accepting} className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-medium">
                {accepting ? 'Aceitando...' : 'Li e aceito os termos'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Summary */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-slate-700 bg-slate-900/50">
              <CardContent className="p-4">
                <p className="text-xs text-slate-500">Ganhos totais</p>
                <p className="text-xl font-bold text-emerald-400">{formatCurrency(summary.total_earnings_cents, summary.currency)}</p>
              </CardContent>
            </Card>
            <Card className="border-slate-700 bg-slate-900/50">
              <CardContent className="p-4">
                <p className="text-xs text-slate-500">Pendente</p>
                <p className="text-xl font-bold text-amber-400">{formatCurrency(summary.pending_payout_cents, summary.currency)}</p>
              </CardContent>
            </Card>
            <Card className="border-slate-700 bg-slate-900/50">
              <CardContent className="p-4">
                <p className="text-xs text-slate-500">Livros vendidos</p>
                <p className="text-xl font-bold text-white">{summary.total_books_sold}</p>
              </CardContent>
            </Card>
            <Card className="border-slate-700 bg-slate-900/50">
              <CardContent className="p-4">
                <p className="text-xs text-slate-500">Canais ativos</p>
                <p className="text-xl font-bold text-[#93C5FD]">{summary.active_channels}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Bank Account */}
        <Card className="border-slate-700 bg-slate-900/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-base">Dados Bancários</CardTitle>
              {bank?.verified && <Badge className="bg-emerald-900/30 text-emerald-400 text-xs">Verificada</Badge>}
            </div>
            <p className="text-sm text-slate-400">Para recebimento automático dos royalties</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Titular da conta *</Label>
                <Input value={bankForm.holder_name} onChange={(e) => setBankForm({ ...bankForm, holder_name: e.target.value })} placeholder="Nome completo" className="bg-slate-800 border-slate-600 text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">CPF / CNPJ *</Label>
                <Input value={bankForm.document} onChange={(e) => setBankForm({ ...bankForm, document: e.target.value })} placeholder="000.000.000-00" className="bg-slate-800 border-slate-600 text-white" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Banco *</Label>
                <Input value={bankForm.bank_name} onChange={(e) => setBankForm({ ...bankForm, bank_name: e.target.value })} placeholder="Ex: Nubank" className="bg-slate-800 border-slate-600 text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Código do banco</Label>
                <Input value={bankForm.bank_code} onChange={(e) => setBankForm({ ...bankForm, bank_code: e.target.value })} placeholder="260" className="bg-slate-800 border-slate-600 text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Tipo</Label>
                <Select value={bankForm.account_type} onValueChange={(v) => { if (v) setBankForm({ ...bankForm, account_type: v as 'checking' | 'savings' }); }}>
                  <SelectTrigger className="bg-slate-800 border-slate-600 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    <SelectItem value="checking" className="text-white">Corrente</SelectItem>
                    <SelectItem value="savings" className="text-white">Poupança</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Agência</Label>
                <Input value={bankForm.agency} onChange={(e) => setBankForm({ ...bankForm, agency: e.target.value })} placeholder="0001" className="bg-slate-800 border-slate-600 text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Conta *</Label>
                <Input value={bankForm.account_number} onChange={(e) => setBankForm({ ...bankForm, account_number: e.target.value })} placeholder="12345-6" className="bg-slate-800 border-slate-600 text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Chave PIX</Label>
                <Input value={bankForm.pix_key} onChange={(e) => setBankForm({ ...bankForm, pix_key: e.target.value })} placeholder="CPF, email ou chave aleatória" className="bg-slate-800 border-slate-600 text-white" />
              </div>
            </div>
            {bankMsg && (
              <Badge className={bankMsg.includes('salvo') ? 'bg-emerald-900/30 text-emerald-400' : 'bg-red-900/30 text-red-400'}>{bankMsg}</Badge>
            )}
            <Button onClick={saveBank} disabled={savingBank} className="bg-[#1E3A8A] hover:bg-[#1E40AF] text-white">
              {savingBank ? 'Salvando...' : 'Salvar dados bancários'}
            </Button>
          </CardContent>
        </Card>

        {/* Payment info */}
        <Card className="border-slate-700 bg-slate-900/50">
          <CardHeader>
            <CardTitle className="text-white text-sm">Como funciona o pagamento</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-400 space-y-2">
            <p>1. Seu livro é vendido em uma plataforma (ex: Amazon KDP)</p>
            <p>2. A plataforma processa o pagamento conforme seu prazo (ex: 60 dias)</p>
            <p>3. Manuscry recebe o valor e deduz a comissão do canal</p>
            <p>4. Em até 5 dias úteis, depositamos na sua conta bancária</p>
            <p>5. Mínimo para saque: R$ 50,00 (BRL) ou US$ 25,00 (USD)</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
