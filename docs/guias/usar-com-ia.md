# Usar o G4OS-DS com agentes de IA

O DS foi feito para ser aplicado por agentes (Claude Code, Codex, Cursor, Copilot, Gemini CLI, pi…) em **qualquer** repositório: criar telas, adaptar um projeto existente, revisar e tematizar.

| Peça | O que é | Onde |
| --- | --- | --- |
| **Servidor MCP** | Busca, componentes, blocos, guias, tokens, tema de marca, audit e doctor como ferramentas, mais prompts prontos | `npx -y @g4ai/ds mcp` (stdio) · `--http` |
| **Web** | `llms.txt`, `llms-full.txt`, `ai/` e `docs/` publicados com o site | https://gestao-quatro-ponto-zero.github.io/G4OS-DS/llms.txt |
| **Guia gerado** | Regras, tokens, props de cada componente e catálogo de blocos (com o conceito de cada um), em Markdown e JSON | `node_modules/@g4ai/ds/ai/` (`core.md` é a porta de entrada) |
| **CLI** | `g4os-ds doctor` (pré-requisitos), `g4os-ds audit` (o que foge do DS, `--fix`), `g4os-ds init` (CI e pre-commit), `g4os-ds mcp` | `npx g4os-ds` |
| **ESLint** | as mesmas regras do audit no editor e no `eslint .` | `@g4ai/ds/eslint` ([auditoria](auditoria.md#eslint)) |
| **Skills** | Fluxos prontos: `g4os-ds`, `ds-create`, `ds-migrate`, `ds-review`, `ds-theme` | plugin do Claude Code |

Tudo sai da mesma fonte (o código do DS) e vem dentro do pacote: o MCP e as skills leem a versão **instalada**, então nunca ficam desatualizados em relação ao projeto.

## Instalar

### Opção A · servidor MCP (qualquer cliente MCP)

```bash
claude mcp add g4os-ds -- npx -y @g4ai/ds mcp          # Claude Code
codex mcp add g4os-ds -- npx -y @g4ai/ds mcp           # Codex
gemini mcp add -s user g4os-ds npx -y @g4ai/ds mcp     # Gemini CLI
```

```json
// Cursor (.cursor/mcp.json), Claude Desktop, Windsurf, Cline, Kiro, JetBrains, pi (pi-mcp-adapter)
{ "mcpServers": { "g4os-ds": { "command": "npx", "args": ["-y", "@g4ai/ds", "mcp"] } } }
```

```json
// VS Code: .vscode/mcp.json
{ "servers": { "g4os-ds": { "type": "stdio", "command": "npx", "args": ["-y", "@g4ai/ds", "mcp"] } } }
```

Os demais clientes (Zed, Continue, Goose, opencode, Amp, pi), a variante de Windows (`cmd /c npx`), o modo HTTP (`--http`) e os problemas comuns estão em **[Servidor MCP em qualquer cliente](mcp.md)**.

Com o DS instalado no projeto, `npx` usa a versão de `node_modules`. Fora de um projeto, baixa a última do npm.

| Ferramenta | O que devolve |
| --- | --- |
| `search` | componentes, blocos e guias por palavra-chave, com a próxima ferramenta sugerida |
| `get_component` | props, regras e exemplos de um componente ou módulo, com a linha de import |
| `list_blocks` | telas prontas por categoria, com o objetivo de cada uma |
| `get_block` | conceito (objetivo, padrões, o que adaptar, o que evitar); `include_source: true` traz o código |
| `get_guide` | guias, padrões, receitas e fundamentos (sem `slug`, lista todos; aceita `core` e `tokens`) |
| `get_tokens` | tokens semânticos, presets de marca e de tipografia |
| `theme_from_colors` | CSS `[data-brand]` claro e escuro a partir das cores do cliente, com contraste WCAG |
| `audit` | violações numa pasta do projeto (mesmas regras do CLI e do ESLint), com a troca sugerida e a troca segura quando existe; `format`, `preset`, `severity`, `rule`, `changed`, `since` |
| `doctor` | pré-requisitos do projeto (React 18.2+/19, Tailwind 4, CSS, tema, fonte) |

Prompts: `criar-tela`, `revisar-tela`, `adaptar-projeto`. Respostas longas vêm em partes, com o `offset` para continuar. Recursos: `g4os-ds://core`, `g4os-ds://tokens`, `g4os-ds://llms`, `g4os-ds://components/<módulo>`, `g4os-ds://blocks/<slug>`, `g4os-ds://guides/<slug>`.

### Opção B · web (agentes que leem URLs)

| Endereço | Conteúdo |
| --- | --- |
| https://gestao-quatro-ponto-zero.github.io/G4OS-DS/llms.txt | índice com links para tudo |
| https://gestao-quatro-ponto-zero.github.io/G4OS-DS/llms-full.txt | o essencial num arquivo só (regras, tokens, anatomia, instalação, catálogos) |
| https://gestao-quatro-ponto-zero.github.io/G4OS-DS/ai/core.md | porta de entrada |
| `https://gestao-quatro-ponto-zero.github.io/G4OS-DS/ai/components/<módulo>.md` | props e exemplos de um módulo |
| `https://gestao-quatro-ponto-zero.github.io/G4OS-DS/ai/blocks/<slug>.md` | conceito e componentes de um bloco |
| https://gestao-quatro-ponto-zero.github.io/G4OS-DS/ai/manifest.json | catálogo estruturado |
| `https://gestao-quatro-ponto-zero.github.io/G4OS-DS/docs/<pasta>/<arquivo>.md` | fundamentos, padrões, receitas, guias |

### Opção C · plugin do Claude Code

```text
/plugin marketplace add Gestao-Quatro-Ponto-Zero/G4OS-DS
/plugin install g4os-ds@g4os
```

As skills disparam sozinhas pelos pedidos (ver abaixo). Atualize com `/plugin marketplace update g4os`. Sem o plugin, copie `node_modules/@g4ai/ds/plugin/skills/<nome>` para `.claude/skills/` do projeto (ou `~/.claude/skills/`).

### Opção D · só um arquivo no projeto

Cole [`templates/AGENTS.snippet.md`](../../templates/AGENTS.snippet.md) no `AGENTS.md`/`CLAUDE.md`/`.cursorrules` do app. O agente lê `node_modules/@g4ai/ds/ai/core.md` e usa as skills em `node_modules/@g4ai/ds/plugin/skills/*/SKILL.md` como roteiro.

## Pedidos que funcionam

| Você diz | Skill | O agente faz |
| --- | --- | --- |
| "Adapte este projeto ao G4OS-DS" | ds-migrate | `doctor` (para se React < 19 / Tailwind < 4) → instala e liga CSS/tema/fonte → `audit --json` como linha de base → `MIGRATION.md` com telas em ordem → migra casca e depois página a página, com audit 0 e tsc verde a cada passo |
| "Atualize o @g4ai/ds e ajuste o código" | ds-migrate (modo atualização) | lê `CHANGELOG.md` e `ai/renames.json`, aplica, audita |
| "Crie a tela de contas a receber com o design system" | ds-create | escolhe o bloco mais próximo (`fin-receivables`), adapta aos dados reais, cinco estados, audita |
| "Refaça esta página a partir deste print" | ds-create (modo imagem) | mapeia regiões do print para padrões do DS sem copiar cores do print |
| "Revise esta tela / está no padrão?" | ds-review | audit + checklist, relatório por gravidade; corrige se pedido |
| "Tema do cliente Acme: azul #0b5cff e amarelo #ffb020" | ds-theme | deriva claro e escuro com contraste AA, gera `[data-brand="acme"]`, aplica |
| "Quero dark mode" | ds-theme | `data-theme` + `themeScript` + `ThemeToggle`, e usa o audit para achar o que não troca |

Qualquer pedido de interface num projeto com `@g4ai/ds` aciona a skill base `g4os-ds` (regras + onde ler).

## Acompanhar uma migração

```bash
npx g4os-ds audit --format json --out ds-audit.json   # totals.errors, byCategory, byRule, byFile
npx g4os-ds audit "src/app/(app)/pedidos"            # uma página, com a troca sugerida em cada linha
npx g4os-ds audit --changed --fix                     # o que o agente mudou: aplica as trocas seguras
```

Compare `totals.errors` entre commits para ver o avanço. **"0 erros" não é o fim**: as regras de anatomia e composição (`page-width-wrapper`, `disabled-wrapper`, `field-double-label`, `raw-input`…) são avisos e pegam exatamente o que deixa uma tela migrada "esquisita". Zere os avisos também. O `MIGRATION.md` (criado pela skill) guarda antes → depois por tela. Exceções legítimas ficam no código com motivo: `// g4os-ds-disable-next-line <regra> -- motivo`. Para o CI só falhar no que é novo durante a migração: `npx g4os-ds init --baseline` ([auditoria](auditoria.md)).

## Medir se os agentes acertam (eval)

O repositório tem um eval que roda agentes de verdade contra o pacote empacotado, num app Vite limpo (`templates/vite-app`) com o `AGENTS.snippet.md` e o MCP — o mesmo ambiente de quem usa o DS:

```bash
node scripts/eval/run.mjs --label antes --agents claude,codex --tasks all   # 6 tarefas: lista, registro, 2 migrações, configurações, dashboard
# … mude docs/regras/MCP …
node scripts/eval/run.mjs --label depois --agents claude,codex --tasks all
node scripts/eval/report.mjs antes depois                                   # tabela + falhas mais comuns
```

A nota (0–100) soma typecheck, build, render sem erro, 390 px sem estouro, axe, verificações visuais (título e corpo no mesmo eixo, desabilitado legível, checkbox com texto), `audit --preset strict` e uma rubrica por tarefa. Custa tokens: não roda no `check`. Saída em `.eval/` (fora do git).

## Mantendo o guia em dia (quem mexe no DS)

`npm run ai:build` regenera `ai/` a partir de `src/index.ts`, dos tipos (props próprias e JSDoc), das páginas do showcase (exemplos `Demo code=`) e dos blocos. `npm run check` falha se `ai/` estiver desatualizado e roda `audit` no próprio DS. Renomeou algo: registre em `ai/renames.json` e no `CHANGELOG.md`.
