# Como Instalar as Skills no Claude Code

Guia completo para instalar as skills do Manuscry no Claude Code — de forma global (disponível em todos os projetos) e de forma local (apenas no projeto Manuscry).

---

## Entendendo Como as Skills Funcionam no Claude Code

O Claude Code lê instruções de arquivos `CLAUDE.md` em ordem hierárquica:

```
~/.claude/CLAUDE.md              ← Global: vale para TODOS os projetos
C:\Users\Douglas\CLAUDE.md       ← Usuário: vale para projetos do Douglas
C:\Users\Douglas\manuscry\CLAUDE.md  ← Projeto: vale só para o Manuscry
```

O Claude Code carrega todos os arquivos encontrados e os combina. O mais específico tem prioridade em caso de conflito.

---

## OPÇÃO 1 — Instalação Global (recomendada para skills reutilizáveis)

As skills de escrita, análise de mercado e produção editorial são úteis em qualquer projeto de conteúdo. Instale globalmente:

### Passo a Passo no Windows

```powershell
# 1. Criar pasta global do Claude Code (se não existir)
mkdir -Force "$env:USERPROFILE\.claude"

# 2. Criar subpasta para skills
mkdir -Force "$env:USERPROFILE\.claude\skills"

# 3. Copiar todas as skills para a pasta global
# (execute onde estiver o pacote de skills baixado)
Copy-Item "*.skill" "$env:USERPROFILE\.claude\skills\" -Force

# 4. Verificar se foi criado
ls "$env:USERPROFILE\.claude\skills\"
```

### Criar o CLAUDE.md Global

```powershell
# Criar ou editar o CLAUDE.md global
notepad "$env:USERPROFILE\.claude\CLAUDE.md"
```

Cole este conteúdo:

```markdown
# Instruções Globais — Douglas Bonânzza

## Skills Disponíveis

As seguintes skills estão instaladas globalmente em ~/.claude/skills/:

### Pipeline Editorial Manuscry
- kdp-market-analyst      — Análise de mercado KDP com score de oportunidade
- book-theme-selector     — Seleção e validação de tema com UBA
- book-concept-builder    — DNA do livro (Book Bible) para ficção e não-ficção
- narrative-architect     — Roteiro capítulo a capítulo com mapa de tensão
- chapter-writer          — Escrita com humanizador integrado
- text-humanizer          — Revisão e humanização de manuscrito
- audiobook-adapter       — Script para ElevenLabs/ACX
- cover-generator         — 5 variações de capa com score de mercado
- author-biography        — Pacote biográfico completo por plataforma
- book-designer           — Specs técnicas + dust jacket + tipografia
- print-production        — Pacotes KDP + IngramSpark + ACX + Findaway
- kdp-metadata-optimizer  — Keywords + categorias + HTML description

### Skills de Negócios DB8
(adicionar skills de outros projetos aqui conforme necessário)

## Preferências Globais
- Sempre responder em português do Brasil
- Código TypeScript com strict mode
- Nunca usar `any` implícito
- Commits em inglês, comentários em português
```

---

## OPÇÃO 2 — Instalação no Projeto Manuscry (local)

Para que as skills fiquem disponíveis apenas dentro do projeto Manuscry:

### Estrutura dentro do projeto

```
C:\Users\Douglas\manuscry\
├── CLAUDE.md                    ← já criado (instruções do projeto)
├── .claude\
│   └── skills\                  ← skills locais do projeto
│       ├── kdp-market-analyst.skill
│       ├── book-theme-selector.skill
│       ├── book-concept-builder.skill
│       ├── narrative-architect.skill
│       ├── chapter-writer.skill
│       ├── text-humanizer.skill
│       ├── audiobook-adapter.skill
│       ├── cover-generator.skill
│       ├── author-biography.skill
│       ├── book-designer.skill
│       ├── print-production.skill
│       └── kdp-metadata-optimizer.skill
```

### Comandos para criar a estrutura

```powershell
# Navegar para o projeto
cd C:\Users\Douglas\manuscry

# Criar pasta de skills local
mkdir -Force ".claude\skills"

# Copiar os arquivos .skill para a pasta local
# (ajustar o caminho de origem conforme onde você salvou os arquivos)
Copy-Item "C:\Users\Douglas\Downloads\*.skill" ".claude\skills\" -Force

# Verificar
ls .claude\skills\
```

---

## OPÇÃO 3 — Instalação no VS Code com Extensão Claude

Se você usa o Claude via extensão do VS Code:

### Configurar settings.json do VS Code

```powershell
# Abrir settings.json do VS Code
code "$env:APPDATA\Code\User\settings.json"
```

Adicionar:

```json
{
  "claude.skillsDirectory": "C:\\Users\\Douglas\\.claude\\skills",
  "claude.projectInstructions": "C:\\Users\\Douglas\\manuscry\\CLAUDE.md",
  "claude.autoLoadSkills": true
}
```

### Workspace Settings (só para o Manuscry)

Dentro do projeto, criar `.vscode/settings.json`:

```json
{
  "claude.projectInstructions": "${workspaceFolder}/CLAUDE.md",
  "claude.skillsDirectory": "${workspaceFolder}/.claude/skills",
  "claude.contextFiles": [
    "CLAUDE.md",
    "apps/api/src/services/prompts/*.ts"
  ]
}
```

---

## Como Verificar se as Skills Estão Funcionando

No Claude Code, digite:

```
/skills
```

Deve listar todas as skills encontradas. Se não aparecer, verifique os caminhos.

Ou peça diretamente:

```
Use a skill kdp-market-analyst para analisar o mercado de dark romance em PT-BR
```

Se responder com o formato estruturado da skill (5 temas com scores), está funcionando.

---

## Estrutura Final Recomendada para o Manuscry

```
C:\Users\Douglas\
├── .claude\
│   ├── CLAUDE.md              ← instruções globais
│   └── skills\                ← skills globais (todos os projetos)
│       └── *.skill
│
└── manuscry\                  ← pasta do projeto
    ├── CLAUDE.md              ← instruções específicas do Manuscry
    ├── MANUSCRY_INIT_PROMPT.md ← prompt para iniciar no Claude Code
    ├── .claude\
    │   └── skills\            ← skills locais (sobrescreve globais se mesmo nome)
    │       └── *.skill
    ├── .vscode\
    │   └── settings.json
    ├── apps\
    │   ├── web\
    │   └── api\
    └── packages\
        └── shared\
```

---

## Começando o Projeto no Claude Code

### Opção A — Claude Code no Terminal (recomendado)

```powershell
# Instalar Claude Code globalmente (se ainda não tiver)
npm install -g @anthropic-ai/claude-code

# Navegar para o projeto
cd C:\Users\Douglas\manuscry

# Iniciar Claude Code na pasta do projeto
claude

# Claude Code vai ler automaticamente o CLAUDE.md da pasta
# Cole o conteúdo de MANUSCRY_INIT_PROMPT.md como primeira mensagem
```

### Opção B — Claude Code no VS Code

1. Abrir VS Code na pasta `C:\Users\Douglas\manuscry`
   ```powershell
   code C:\Users\Douglas\manuscry
   ```

2. Abrir o painel do Claude Code (Ctrl+Shift+P → "Claude: Open")

3. O Claude Code vai detectar o `CLAUDE.md` automaticamente

4. Copiar e colar o conteúdo de `MANUSCRY_INIT_PROMPT.md` no chat

---

## Dicas Importantes

**1. O CLAUDE.md é lido automaticamente**
Não precisa referenciar manualmente. O Claude Code detecta e carrega sempre que você abre uma conversa na pasta do projeto.

**2. Skills vs CLAUDE.md**
- `CLAUDE.md` = instruções permanentes do projeto (contexto, arquitetura, regras)
- Skills `.skill` = capacidades especializadas que o Claude usa quando relevante

**3. Atualizar uma skill**
Para atualizar uma skill, simplesmente sobrescreva o arquivo `.skill` na pasta correspondente. Não precisa reiniciar.

**4. Verificar qual CLAUDE.md está ativo**
```
# No Claude Code, pergunte:
"Quais arquivos CLAUDE.md você está lendo agora?"
```

**5. Prioridade de contexto**
Se houver conflito entre global e local, o arquivo mais específico (mais próximo da pasta do projeto) tem prioridade.
