# Usar o G4OS-DS com agentes de IA

O DS foi feito para ser aplicado por agentes (Claude Code, Cursor, Codex, Copilot) em **qualquer** repositório: criar telas, adaptar um projeto existente, revisar e tematizar. Três peças:

| Peça | O que é | Onde |
| --- | --- | --- |
| **Guia gerado** | Regras, tokens, props de cada componente, catálogo de blocos, em Markdown e JSON, gerado do código a cada versão | `ai/` (`core.md` é a porta de entrada) |
| **CLI** | `g4os-ds doctor` (pré-requisitos) e `g4os-ds audit` (o que foge do DS, com sugestão e contagem) | `scripts/cli.mjs` → `npx g4os-ds` |
| **Skills** | Fluxos prontos: `g4os-ds`, `ds-create`, `ds-migrate`, `ds-review`, `ds-theme` | `plugin/` (plugin do Claude Code) |

O guia e a CLI vêm **dentro do pacote instalado** (`node_modules/@g4ai/ds/ai`, `…/scripts`). As skills são finas: mandam o agente ler a versão instalada, então nunca ficam desatualizadas em relação ao código.

## Instalar

### Opção A · plugin do Claude Code (recomendado)

```text
/plugin marketplace add ../G4OS-DS            # pasta local, ou a URL git do repositório
/plugin install g4os-ds@g4os
```

As skills passam a disparar sozinhas pelos pedidos (ver abaixo). Atualize com `/plugin marketplace update g4os`.

### Opção B · sem plugin (qualquer agente)

Cole `templates/AGENTS.snippet.md` no `AGENTS.md`/`CLAUDE.md`/`.cursorrules` do projeto. O agente lê `node_modules/@g4ai/ds/ai/core.md` e segue as skills em `node_modules/@g4ai/ds/plugin/skills/*/SKILL.md` como roteiro.

### Opção C · skills soltas

Copie `plugin/skills/<nome>` para `~/.claude/skills/` (todas as sessões) ou `.claude/skills/` do projeto.

## Pedidos que funcionam

| Você diz | Skill | O agente faz |
| --- | --- | --- |
| "Adapte este projeto ao G4OS-DS (está em ../G4OS-DS)" | ds-migrate | `doctor` (para se React < 19 / Tailwind < 4) → instala e liga CSS/tema/fonte → `audit --json` como linha de base → `MIGRATION.md` com telas em ordem → migra casca e depois página a página, com audit 0 e tsc verde a cada passo |
| "Atualize o @g4ai/ds para a 0.3 e ajuste o código" | ds-migrate (modo atualização) | lê `CHANGELOG.md` e `ai/renames.json`, aplica, audita |
| "Crie a tela de contas a receber com o design system" | ds-create | escolhe o bloco mais próximo (`fin-receivables`), adapta aos dados reais, cinco estados, audita |
| "Refaça esta página a partir deste print" | ds-create (modo imagem) | mapeia regiões do print para padrões do DS sem copiar cores do print |
| "Revise esta tela / está no padrão?" | ds-review | audit + checklist, relatório por gravidade; corrige se pedido |
| "Tema do cliente Acme: azul #0b5cff e amarelo #ffb020" | ds-theme | deriva claro e escuro com contraste AA, gera `[data-brand="acme"]`, aplica |
| "Quero dark mode" | ds-theme | `data-theme` + `themeScript` + `ThemeToggle`, e usa o audit para achar o que não troca |

Qualquer pedido de interface num projeto com `@g4ai/ds` aciona a skill base `g4os-ds` (regras + onde ler).

## Acompanhar uma migração

```bash
npx g4os-ds audit src --json --out ds-audit.json   # totals.errors, byRule, byFile
npx g4os-ds audit src/app/(app)/pedidos --fix-hints   # uma página, com a troca sugerida em cada linha
```

Compare `totals.errors` entre commits para ver o avanço. O `MIGRATION.md` (criado pela skill) guarda antes → depois por tela. Exceções legítimas ficam no código com motivo: `// ds-audit-ignore <regra>: motivo`.

## Mantendo o guia em dia (quem mexe no DS)

`npm run ai:build` regenera `ai/` a partir de `src/index.ts`, dos tipos (props próprias e JSDoc), das páginas do showcase (exemplos `Demo code=`) e dos blocos. `npm run check` falha se `ai/` estiver desatualizado e roda `audit` no próprio DS. Renomeou algo: registre em `ai/renames.json` e no `CHANGELOG.md`.
