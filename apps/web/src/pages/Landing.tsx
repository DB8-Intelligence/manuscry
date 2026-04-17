import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const PIPELINE_STEPS = [
  { phase: 0, icon: '\u{1F4CA}', name: 'Análise de Mercado', desc: 'IA analisa demanda, concorrência e gaps no KDP. Você começa sabendo exatamente onde está o dinheiro.' },
  { phase: 1, icon: '\u{1F3AF}', name: 'Posicionamento', desc: 'Valida seu tema e define o Unique Book Angle — o diferencial que torna seu livro impossível de ignorar.' },
  { phase: 2, icon: '\u{1F4D6}', name: 'Book Bible', desc: 'DNA completo: personagens com vozes únicas, conflito, tom, estrutura. Tudo consistente do início ao fim.' },
  { phase: 3, icon: '\u{1F5FA}\uFE0F', name: 'Roteiro', desc: 'Roteiro capítulo a capítulo com mapa de tensão, arcos emocionais e ganchos narrativos.' },
  { phase: 4, icon: '\u270D\uFE0F', name: 'Escrita + Edição', desc: 'Streaming em tempo real. Edite manualmente. Humanize para voz natural indistinguível de humano.' },
  { phase: 5, icon: '\u{1F680}', name: 'Produção', desc: 'Capas IA, biografia, metadados KDP, audiobook, EPUB + PDF. Tudo validado antes do export.' },
];

const FEATURES = [
  { icon: '\u{1F9E0}', title: 'Análise antes da escrita', desc: 'Nenhum concorrente analisa o mercado KDP ANTES de você escrever. Manuscry mostra onde estão as oportunidades reais.' },
  { icon: '\u{1F4DA}', title: 'Book Bible persistente', desc: 'O DNA do livro é injetado em TODA chamada de escrita. Personagens nunca mudam entre capítulos.' },
  { icon: '\u{1F464}', title: 'Humanizador', desc: 'Reescreve cada capítulo com voz natural. Expressões idiomáticas, ritmo variado, imperfeições estilísticas.' },
  { icon: '\u2705', title: '40 checks KDP', desc: 'Preflight Validator verifica compliance antes de exportar. Zero rejeições evitáveis na Amazon.' },
  { icon: '\u{1F3A8}', title: 'Capas por IA', desc: '5 variações profissionais via Flux Pro, cada uma com score de adequação ao gênero. Escolha a melhor.' },
  { icon: '\u{1F30E}', title: 'PT-BR + EN', desc: 'Mercado brasileiro e global. Billing em Real (Hotmart) ou Dólar (Stripe). Interface bilíngue.' },
];

const COMPARISON = [
  { feature: 'Análise de mercado KDP', manuscry: true, others: false },
  { feature: 'Book Bible com consistência', manuscry: true, others: false },
  { feature: 'Escrita com streaming', manuscry: true, others: true },
  { feature: 'Editor manual pós-IA', manuscry: true, others: false },
  { feature: 'Humanizador de texto', manuscry: true, others: false },
  { feature: 'Capas por IA', manuscry: true, others: true },
  { feature: 'Audiobook', manuscry: true, others: true },
  { feature: 'EPUB + PDF export', manuscry: true, others: true },
  { feature: 'Preflight KDP (40 checks)', manuscry: true, others: false },
  { feature: 'Metadados + A+ Content', manuscry: true, others: false },
  { feature: 'Specs de design (print)', manuscry: true, others: false },
  { feature: 'Billing PT-BR (Hotmart)', manuscry: true, others: false },
];

const PLANS = [
  {
    name: 'Trial', price: 'Grátis', period: '14 dias',
    books: '1 livro', features: ['Ebook + Paperback KDP', 'Mercado PT-BR', 'Pipeline completo'],
    cta: 'Começar grátis', popular: false,
  },
  {
    name: 'Starter', price: '$29.99', period: '/mês',
    priceBrl: 'R$109/mês', books: '1 livro/mês',
    features: ['Tudo do Trial', 'Sem limite de tempo', 'Análise + humanizador', 'Suporte por email'],
    cta: 'Assinar Starter', popular: false,
  },
  {
    name: 'Pro', price: '$74.99', period: '/mês',
    priceBrl: 'R$269/mês', books: '3 livros/mês',
    features: ['Tudo do Starter', 'Todos os formatos', 'KDP + IngramSpark', 'Audiobook + dust jacket', 'Mercados PT-BR e EN'],
    cta: 'Assinar Pro', popular: true,
  },
  {
    name: 'Publisher', price: '$189.99', period: '/mês',
    priceBrl: 'R$679/mês', books: '8 livros/mês',
    features: ['Tudo do Pro', 'White label', 'Acesso à API', '10 pen names', 'Suporte prioritário'],
    cta: 'Assinar Publisher', popular: false,
  },
];

const FAQS = [
  {
    q: 'O conteúdo gerado é realmente publicável no KDP?',
    a: 'Sim. O Manuscry gera conteúdo original, passa por humanização e valida 40 checks de compliance KDP antes de exportar. O Preflight Validator garante que seu livro não será rejeitado.',
  },
  {
    q: 'Posso editar o texto depois que a IA escreve?',
    a: 'Sim. Cada capítulo tem um editor integrado onde você pode fazer ajustes manuais. Você também pode reescrever e humanizar quantas vezes quiser.',
  },
  {
    q: 'Qual a diferença do Manuscry para ChatGPT ou outras IAs?',
    a: 'O ChatGPT gera texto genérico sem contexto. O Manuscry mantém um Book Bible persistente — personagens, tom, conflito — injetado em TODA chamada. Isso garante consistência do primeiro ao último capítulo.',
  },
  {
    q: 'Funciona para ficção E não-ficção?',
    a: 'Sim. O pipeline se adapta: ficção ganha personagens, conflito e mapa de tensão. Não-ficção ganha framework metodológico, promessa de transformação e dores do leitor.',
  },
  {
    q: 'Quanto tempo leva para criar um livro completo?',
    a: 'Um livro de não-ficção (45K palavras) pode ficar pronto em 2-3 dias. Ficção (70K palavras) em 3-5 dias. Inclui análise, roteiro, escrita, humanização, capa e export.',
  },
  {
    q: 'Posso cancelar a qualquer momento?',
    a: 'Sim. Sem fidelidade, sem multa. Cancele quando quiser e sua conta volta para o plano Trial.',
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-slate-800 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left py-5 flex items-center justify-between gap-4"
      >
        <span className="font-medium text-white">{q}</span>
        <span className="text-slate-500 text-xl flex-shrink-0">{open ? '\u2212' : '+'}</span>
      </button>
      {open && <p className="pb-5 text-slate-400 text-sm leading-relaxed">{a}</p>}
    </div>
  );
}

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0F172A] text-white">
      {/* ── NAV ── */}
      <nav className="border-b border-slate-800/50 sticky top-0 bg-[#0F172A]/95 backdrop-blur z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-xl font-bold tracking-tight">Manuscry</span>
          <div className="flex items-center gap-4">
            <a href="#pricing" className="text-sm text-slate-400 hover:text-white hidden sm:block">Preços</a>
            <a href="#features" className="text-sm text-slate-400 hover:text-white hidden sm:block">Features</a>
            <span onClick={() => navigate('/store')} className="text-sm text-slate-400 hover:text-white hidden sm:block cursor-pointer">Loja</span>
            <span onClick={() => navigate('/blog')} className="text-sm text-slate-400 hover:text-white hidden sm:block cursor-pointer">Blog</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/login')}
              className="text-slate-300 hover:text-white"
            >
              Entrar
            </Button>
            <Button
              size="sm"
              onClick={() => navigate('/login')}
              className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-medium"
            >
              Começar grátis
            </Button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
        <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-6">
          14 dias grátis &middot; Sem cartão de crédito
        </Badge>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight mb-6">
          Do conceito ao livro publicado
          <br />
          <span className="text-amber-400">em dias, não meses</span>
        </h1>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-8 leading-relaxed">
          Pipeline editorial completo com IA: análise de mercado KDP, escrita com
          streaming, humanizador, capas profissionais e arquivos prontos para
          Amazon — tudo em uma plataforma.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Button
            onClick={() => navigate('/login')}
            className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold px-8 py-6 text-lg"
          >
            Criar meu primeiro livro
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/login')}
            className="border-slate-600 text-slate-300 hover:text-white px-8 py-6 text-lg"
          >
            {'\u{1F4C4}'} Já tenho um manuscrito
          </Button>
        </div>
        <p className="text-xs text-slate-600 mt-2">
          Tem um rascunho ou ideia? Faça upload e a IA completa o resto.
        </p>

        {/* Social proof numbers */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-2xl mx-auto pt-8 border-t border-slate-800">
          {[
            { num: '6', label: 'Fases do pipeline' },
            { num: '40', label: 'Checks KDP' },
            { num: '5', label: 'Capas por projeto' },
            { num: '2', label: 'Mercados (BR + EN)' },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="text-2xl font-bold text-amber-400">{stat.num}</div>
              <div className="text-xs text-slate-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PAIN POINTS ── */}
      <section className="bg-slate-900/50 border-y border-slate-800">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <h2 className="text-2xl font-bold text-center mb-4">Publicar um livro não deveria ser tão difícil</h2>
          <p className="text-slate-400 text-center mb-10 max-w-2xl mx-auto">
            Autores perdem semanas pesquisando mercado, meses escrevendo, e depois
            ainda enfrentam rejeições no KDP por erros de formatação.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: '\u{274C}', title: 'Sem dados de mercado', desc: 'Você escreve 70.000 palavras sem saber se alguém vai comprar. A maioria dos livros KDP vende menos de 10 cópias.' },
              { icon: '\u{274C}', title: 'Inconsistência narrativa', desc: 'ChatGPT esquece personagens entre prompts. No capítulo 15 o protagonista muda de nome e personalidade.' },
              { icon: '\u{274C}', title: 'Rejeição na plataforma', desc: 'Formatação errada, metadados incompletos, capa fora do padrão. Cada rejeição KDP são dias perdidos.' },
            ].map((pain) => (
              <Card key={pain.title} className="border-red-900/20 bg-red-950/10">
                <CardContent className="p-6">
                  <span className="text-2xl">{pain.icon}</span>
                  <h3 className="font-semibold text-white mt-3 mb-2">{pain.title}</h3>
                  <p className="text-sm text-slate-400">{pain.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── PIPELINE ── */}
      <section id="pipeline" className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <Badge className="bg-[#1E3A8A]/20 text-[#93C5FD] mb-4">Como funciona</Badge>
          <h2 className="text-3xl font-bold mb-4">6 fases. Um livro pronto.</h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            Cada fase entrega um resultado concreto. Você avança quando quiser, edita o que precisar.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {PIPELINE_STEPS.map((step) => (
            <Card key={step.phase} className="border-slate-700 bg-slate-900/50 hover:border-[#1E3A8A]/50 transition-all">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{step.icon}</span>
                  <div>
                    <span className="text-xs font-mono text-slate-500">FASE {step.phase}</span>
                    <h3 className="font-semibold text-white">{step.name}</h3>
                  </div>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed">{step.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="bg-slate-900/50 border-y border-slate-800">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-4">Diferenciais</Badge>
            <h2 className="text-3xl font-bold mb-4">O que só o Manuscry oferece</h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              Recursos que nenhum concorrente tem — porque fomos construídos especificamente para o mercado KDP.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <Card key={f.title} className="border-slate-700 bg-[#0F172A]">
                <CardContent className="p-6">
                  <span className="text-3xl">{f.icon}</span>
                  <h3 className="font-semibold text-white mt-3 mb-2">{f.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMPARISON TABLE ── */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Manuscry vs alternativas</h2>
          <p className="text-slate-400">Comparação direta com BookAutoAI, Inkfluence, Sudowrite e outros.</p>
        </div>
        <div className="border border-slate-700 rounded-xl overflow-hidden">
          <div className="grid grid-cols-3 bg-slate-800/50 text-sm font-medium">
            <div className="p-4 text-slate-400">Feature</div>
            <div className="p-4 text-center text-amber-400">Manuscry</div>
            <div className="p-4 text-center text-slate-500">Outros</div>
          </div>
          {COMPARISON.map((row, i) => (
            <div key={row.feature} className={`grid grid-cols-3 text-sm ${i % 2 === 0 ? 'bg-slate-900/30' : ''}`}>
              <div className="p-4 text-slate-300">{row.feature}</div>
              <div className="p-4 text-center text-emerald-400">{row.manuscry ? '\u2713' : '\u2014'}</div>
              <div className="p-4 text-center text-slate-600">{row.others ? '\u2713' : '\u2014'}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="bg-slate-900/50 border-y border-slate-800">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-4">Preços</Badge>
            <h2 className="text-3xl font-bold mb-4">Escolha seu plano</h2>
            <p className="text-slate-400">Desconto progressivo por volume. Cancele quando quiser.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PLANS.map((plan) => (
              <Card
                key={plan.name}
                className={`border-slate-700 bg-[#0F172A] relative ${
                  plan.popular ? 'ring-2 ring-amber-500/50 border-amber-800/50' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-amber-500 text-slate-900 text-xs font-bold">Mais popular</Badge>
                  </div>
                )}
                <CardContent className="p-6 space-y-5">
                  <div>
                    <h3 className="font-semibold text-white text-lg">{plan.name}</h3>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="text-3xl font-bold text-white">{plan.price}</span>
                      <span className="text-slate-500 text-sm">{plan.period}</span>
                    </div>
                    {plan.priceBrl && (
                      <p className="text-xs text-slate-500 mt-1">{plan.priceBrl}</p>
                    )}
                  </div>
                  <div>
                    <Badge className="bg-slate-800 text-slate-300 text-xs">{plan.books}</Badge>
                  </div>
                  <ul className="space-y-2">
                    {plan.features.map((f) => (
                      <li key={f} className="text-sm text-slate-400 flex items-start gap-2">
                        <span className="text-emerald-500 mt-0.5">{'\u2713'}</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    onClick={() => navigate('/login')}
                    className={`w-full font-medium ${
                      plan.popular
                        ? 'bg-amber-500 hover:bg-amber-600 text-slate-900'
                        : 'bg-[#1E3A8A] hover:bg-[#1E40AF] text-white'
                    }`}
                  >
                    {plan.cta}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="text-center text-xs text-slate-600 mt-6">
            Custo por livro: Starter $29.99 &middot; Pro $25.00 &middot; Publisher $23.75
          </p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="max-w-3xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center mb-10">Perguntas frequentes</h2>
        <div>
          {FAQS.map((faq) => (
            <FAQItem key={faq.q} q={faq.q} a={faq.a} />
          ))}
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="bg-gradient-to-b from-[#1E3A8A]/20 to-transparent border-t border-[#1E3A8A]/30">
        <div className="max-w-3xl mx-auto px-6 py-20 text-center">
          <h2 className="text-3xl font-bold mb-4">Pronto para publicar seu livro?</h2>
          <p className="text-slate-400 mb-8 max-w-lg mx-auto">
            Comece agora com 14 dias grátis. Sem cartão de crédito. Sem compromisso.
            Seu primeiro livro pode estar pronto esta semana.
          </p>
          <Button
            onClick={() => navigate('/login')}
            className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold px-10 py-6 text-lg"
          >
            Criar meu livro agora
          </Button>
          <p className="text-xs text-slate-600 mt-4">
            Pipeline completo: análise de mercado &rarr; escrita &rarr; capas &rarr; EPUB/PDF
          </p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-slate-800 bg-slate-900/50">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <span className="text-lg font-bold">Manuscry</span>
              <p className="text-xs text-slate-500 mt-1">Do conceito ao livro publicado com IA</p>
            </div>
            <div className="flex gap-6 text-sm text-slate-500">
              <a href="#pipeline" className="hover:text-slate-300">Como funciona</a>
              <a href="#features" className="hover:text-slate-300">Features</a>
              <a href="#pricing" className="hover:text-slate-300">Preços</a>
            </div>
            <p className="text-xs text-slate-600">
              &copy; {new Date().getFullYear()} DB8 Intelligence. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
