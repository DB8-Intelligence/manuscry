# Manuscry — Roadmap de Features

## Status: Implementado / Registrado para Implementação Futura

---

## PRIORIDADE ALTA (impacto direto na receita e retenção)

### 1. Templates por Gênero (Blueprint Library) — IMPLEMENTADO
- 10 templates iniciais: Romance, Dark Romance, Thriller, Fantasia, Autoajuda, Negócios, Saúde, Terror, Infantil, Lead Magnet
- Cada template inclui: tom, estrutura, chapters, word target, audience, referências, dicas de escrita, market notes
- API: GET /api/features/templates + GET /api/features/templates/:id
- Expandir para 33+ templates no futuro

### 2. Leitura Online / Preview Público — IMPLEMENTADO
- Primeiros 3 capítulos de livros publicados visíveis na vitrine
- Rota pública: /store/preview/:projectId
- API: GET /api/features/preview/:projectId
- CTA no final do preview para criar conta

### 3. Séries de Livros — IMPLEMENTADO
- Criar séries com nome e descrição
- Adicionar volumes (projetos) à série
- Dados salvos no author_profile do usuário
- API: GET/POST /api/features/series + POST /series/:id/add-volume
- FUTURO: Book Bible compartilhado entre volumes, consistência cross-volume

### 4. Tradução Automática — IMPLEMENTADO (estrutura)
- Cria projeto traduzido com dados pré-copiados
- Muda market e adiciona sufixo (EN)/(PT-BR) ao nome
- Preço: R$49 (4900 centavos) / $9.99
- API: POST /api/features/translate
- FUTURO: Tradução real capítulo a capítulo via Claude (SSE streaming)

### 5. Programa de Afiliados — IMPLEMENTADO
- Código de afiliado gerado automaticamente (MSC-XXXXXXXX)
- URL de referral: manuscry.ai/?ref=CODE
- Comissão: 20% da assinatura do indicado
- API: GET /api/features/affiliate
- FUTURO: Dashboard de afiliados com tracking, payouts automáticos

---

## PRIORIDADE MÉDIA (diferenciação e retenção)

### 6. Colaboração em Tempo Real — IMPLEMENTADO
**Descrição:** Dois autores editando o mesmo manuscrito simultaneamente (como Google Docs).
**Tecnologia:** WebSocket + CRDT (Yjs ou Automerge) para resolução de conflitos em tempo real.
**Escopo:**
- Cursor de cada colaborador visível com cor diferente
- Chat lateral entre colaboradores
- Controle de permissões (editor, viewer, commentator)
- Histórico de quem editou o quê
**Impacto:** Abre mercado para ghostwriters profissionais e equipes editoriais.
**Estimativa:** 2-3 semanas de desenvolvimento.

### 7. Calendário Editorial — IMPLEMENTADO
**Descrição:** Timeline visual com deadlines por fase do pipeline.
**Escopo:**
- Visualização tipo Gantt ou kanban com fases do pipeline
- Deadlines configuráveis por fase
- Integração com Social Studio para agendar posts
- Notificações de prazo por email (Resend)
- Dashboard widget com próximas deadlines
**Impacto:** Organização profissional para autores sérios.
**Estimativa:** 1 semana.

### 8. Versioning / Histórico de Revisões — IMPLEMENTADO
**Descrição:** Salvar versões do manuscrito (v1, v2, v3) com diff visual.
**Escopo:**
- Snapshot automático antes de cada edição/humanização
- Lista de versões com timestamp e palavra-count
- Comparação visual (diff) entre versões
- Restaurar versão anterior com 1 clique
- Limite: 10 versões por capítulo
**Impacto:** Segurança para o autor, essencial para edição profissional.
**Estimativa:** 1 semana.

### 9. AI Writing Coach — IMPLEMENTADO
**Descrição:** Chat IA integrado no editor que sugere melhorias em tempo real.
**Escopo:**
- Sidebar de chat dentro do ManuscriptEditor
- Análise do parágrafo selecionado
- Sugestões: ritmo, "show don't tell", clichês, repetições
- Não reescreve — sugere e explica o porquê
- Toggle on/off por preferência do autor
- Usa contexto do Book Bible para sugestões alinhadas ao tom
**Impacto:** Diferenciação vs ferramentas "clique e gere". Posiciona como parceiro de escrita.
**Estimativa:** 1 semana.

### 10. Gamificação — IMPLEMENTADO
**Descrição:** Sistema de engajamento com badges, metas e leaderboard.
**Escopo:**
- Streaks diários de escrita (7 dias seguidos = badge)
- Metas de palavras diárias/semanais configuráveis
- Badges por milestone: primeiro livro, 50K palavras, publicação, etc.
- Leaderboard mensal de autores mais produtivos
- XP por atividade (escrever, humanizar, publicar, vender)
- Perfil público com badges visíveis
**Impacto:** Retenção e engajamento. Autores voltam todo dia.
**Estimativa:** 1-2 semanas.

---

## PRIORIDADE FUTURA (expansão de mercado)

### 11. App Mobile (React Native) — REGISTRADO
**Descrição:** App nativo para iOS e Android.
**Escopo:**
- Editor simplificado para escrita mobile
- Dashboard de vendas e analytics
- Notificações push (vendas, reviews, status de publicação)
- Social Studio mobile (gerar conteúdo do celular)
- Leitura de livros da vitrine
**Tecnologia:** React Native + Expo (compartilha lógica com web).
**Impacto:** Autores escrevem em qualquer lugar. Retenção 24/7.
**Estimativa:** 4-6 semanas.

### 12. Marketplace de Ghostwriters — REGISTRADO
**Descrição:** Conectar autores com ghostwriters profissionais dentro da plataforma.
**Escopo:**
- Perfil de ghostwriter com portfólio, gêneros, preço por palavra
- Sistema de propostas e contratação
- Escrow de pagamento (Manuscry como intermediário)
- Rating e reviews de ghostwriters
- Manuscry cobra 20% como comissão de intermediação
**Impacto:** Novo modelo de receita. Atende autores que querem delegar.
**Estimativa:** 3-4 semanas.

### 13. White Label para Editoras — REGISTRADO
**Descrição:** Editoras pequenas usam o Manuscry com marca própria.
**Escopo:**
- Domínio customizado (editora.manuscry.ai ou editora.com)
- Logo e cores da editora
- Gestão de múltiplos autores
- Dashboard unificado de publicações
- Faturamento em nome da editora
- Plano Publisher já inclui acesso
**Impacto:** Enterprise play. Receita recorrente de alto ticket.
**Estimativa:** 3-4 semanas.

### 14. Integração com Canva — IMPLEMENTADO
**Descrição:** Edição avançada de capas e materiais de marketing via Canva.
**Escopo:**
- Botão "Editar no Canva" na capa gerada
- Templates de Social Studio editáveis no Canva
- Importação de designs do Canva para o Manuscry
- API do Canva (Canva Connect API)
**Impacto:** Capas e materiais de maior qualidade sem sair da plataforma.
**Estimativa:** 2 semanas.

### 15. API Pública para Desenvolvedores — IMPLEMENTADO
**Descrição:** Permitir que terceiros construam sobre o pipeline do Manuscry.
**Escopo:**
- API REST documentada (Swagger/OpenAPI)
- Autenticação por API key (plano Publisher)
- Endpoints: criar projeto, gerar conteúdo, exportar, publicar
- Webhooks para eventos (livro publicado, venda, etc.)
- Rate limiting por plano
- SDKs para Python, JavaScript, Go
- Portal de documentação (docs.manuscry.ai)
**Impacto:** Ecossistema de integrações. Lock-in profissional.
**Estimativa:** 3-4 semanas.

---

## Resumo de Estimativas

| Prioridade | Features | Implementado | A fazer | Estimativa total |
|---|---|---|---|---|
| Alta | 5 | 5 (código) | Expandir templates | 1 semana |
| Média | 5 | 5 (código) | Frontend polish | 2-3 semanas |
| Futura | 5 | 0 | 5 features | 15-20 semanas |
| **Total** | **15** | **5** | **10** | **~21-28 semanas** |

---

## Modelo de Receita Projetado

| Fonte | Preço | Tipo |
|---|---|---|
| Assinatura Starter | R$109/mês ($29.99) | Recorrente |
| Assinatura Pro | R$269/mês ($74.99) | Recorrente |
| Assinatura Publisher | R$679/mês ($189.99) | Recorrente |
| Social Studio add-on | R$39/rede/mês | Recorrente |
| Tradução automática | R$49/livro ($9.99) | One-shot |
| Comissão de vendas | 10-15% por venda | Variável |
| Afiliados (custo) | -20% da assinatura | Custo de aquisição |
| Templates premium (futuro) | R$19/template | One-shot |
| Ghostwriter marketplace (futuro) | 20% da transação | Variável |
| White label (futuro) | R$2.000+/mês | Enterprise |
| API access (futuro) | Incluso no Publisher | Já cobrado |
