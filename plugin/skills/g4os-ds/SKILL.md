---
name: g4os-ds
description: Regras e mapa do design system G4OS-DS (@g4ai/ds). Use SEMPRE que for escrever, editar ou revisar interface (componentes React, telas, CSS, classes Tailwind) num projeto que depende de @g4ai/ds ou quando o usuário mencionar "G4OS-DS", "design system G4", "nosso design system". Also use whenever editing UI in a project that uses @g4ai/ds. Carrega o guia essencial (tokens, regras, componentes, blocos) da cópia instalada do DS.
---

# G4OS-DS · base para qualquer trabalho de interface

Você está num projeto que usa (ou vai usar) o **G4OS-DS**: tokens semânticos com tema escuro e marcas, componentes React 19 + Base UI + Tailwind v4, gráficos SVG e blocos de tela prontos, tudo em pt-BR. Esta skill não contém o índice: ela manda você ler a versão **instalada**, que é a verdade.

## 1. Localize o DS (uma vez por sessão)

Na ordem, pare no primeiro que existir:

1. Caminho dado pelo usuário (ex.: `../G4OS-DS`, `~/Documents/GitHub/G4OS-DS`).
2. `node_modules/@g4ai/ds/` no projeto atual (ou no workspace do monorepo).
3. `npx g4os-ds guide` imprime o caminho de `ai/core.md`.
4. Pastas irmãs: `../G4OS-DS`, `../../G4OS-DS`.

Chame essa pasta de `DS`. Se não achar, pergunte ao usuário onde está (e siga a skill **ds-migrate**, passo "Instalar", se o projeto ainda não tem o pacote).

## 2. Leia antes de escrever código

- **Sempre**: `DS/ai/core.md` (regras, tokens em uma linha, módulos, blocos). É curto.
- **Sob demanda**, só o que a tarefa pede:
  - props e exemplo de um componente → `DS/ai/components/<módulo>.md` (o módulo está no `core.md`)
  - uma tela parecida pronta → `DS/ai/blocks/<slug>.md` e o arquivo `DS/src/blocks/<slug>.tsx`
  - cores/tipo/raio exatos → `DS/ai/tokens.md`
  - padrão de tela (formulário, tabela, filtros, dashboard, feedback) → `DS/docs/padroes/<tema>.md`
  - regras completas → `DS/AGENTS.md`
- Não carregue `manifest.json` inteiro no contexto; use `jq`/grep nele se precisar de busca estruturada.

## 3. Ordem de preferência

1. **Bloco pronto** (copie `DS/src/blocks/<slug>.tsx`, troque os dados do topo).
2. **Composição** de componentes do DS (`import { … } from "@g4ai/ds"`).
3. Componente do DS com outras props.
4. shadcn/21st com a ponte `@g4ai/ds/shadcn.css`.
5. Do zero, só com tokens. Se ficar reaproveitável, sugira promover ao DS.

## 4. Regras que mais erram (o resto está no core.md)

- Nada de `bg-white`, `text-white`, hex, `gray-500`/`blue-600`: `bg-surface`, `bg-popover`, `bg-soft`, `text-ink`/`text-muted`, `border-line`, ação `bg-primary text-on-primary`, sobre preenchimento forte `text-on-ink`.
- Nada de `<select>`, `<input type="date">`, `confirm()`, `alert()`: `Select`/`Combobox`, `DatePicker`, `ConfirmDialog`, `notify`.
- Números e datas por `formatCurrency`/`formatNumber`/`formatPercent`/`formatDate`.
- Cinco estados em todo dado (carregando, vazio, vazio por filtro, erro, ideal).
- Texto em pt-BR, verbo + objeto nos botões, sem exclamação.

## 5. Antes de dizer "pronto"

```bash
npx g4os-ds audit <pastas alteradas>     # 0 erros
npx tsc --noEmit                          # ou o typecheck do projeto
```

Se houver servidor de desenvolvimento, confira a tela em 1440 e 390 px, claro e escuro (`data-theme="dark"` no `<html>`). Relate o que verificou e o que não pôde verificar.

Tarefas maiores têm skill própria: **ds-create** (tela/app novo), **ds-migrate** (adaptar projeto existente ou atualizar versão), **ds-review** (auditar/polir), **ds-theme** (marca do cliente, tema escuro).
