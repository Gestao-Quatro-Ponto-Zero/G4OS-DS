---
name: g4os-ds
description: Regras e mapa do design system G4OS-DS (@g4ai/ds). Use SEMPRE que for escrever, editar ou revisar interface (componentes React, telas, CSS, classes Tailwind) num projeto que depende de @g4ai/ds ou quando o usuário mencionar "G4OS-DS", "design system G4", "nosso design system". Also use whenever editing UI in a project that uses @g4ai/ds. Carrega o guia essencial (tokens, regras, componentes, blocos) da cópia instalada do DS.
---

# G4OS-DS · base para qualquer trabalho de interface

Você está num projeto que usa (ou vai usar) o **G4OS-DS**: tokens semânticos com tema escuro e marcas, componentes React 19 + Base UI + Tailwind v4, gráficos SVG e blocos de tela prontos, tudo em pt-BR. Esta skill não contém o índice: ela manda você ler a versão **instalada**, que é a verdade.

## 1. Localize o DS (uma vez por sessão)

Na ordem, pare no primeiro que existir:

1. `node_modules/@g4ai/ds/` no projeto atual (ou no workspace do monorepo). É o caso normal: o DS vem do npm.
2. `npx g4os-ds guide` imprime o caminho de `ai/core.md` da versão instalada.
3. Caminho dado pelo usuário (ex.: um clone do repositório para desenvolver o próprio DS).
4. Sem nada local: leia https://gestao-quatro-ponto-zero.github.io/G4OS-DS/llms.txt (os mesmos arquivos `ai/` e `docs/` estão no site).

Chame essa pasta de `DS`. Se o projeto ainda não tem o pacote, instale (`pnpm add @g4ai/ds @base-ui/react lucide-react`) seguindo a skill **ds-migrate**, fase 1.

**Se o servidor MCP `g4os-ds` estiver disponível** (ferramentas `plan_screen`, `search`, `get_component`, `get_block`, `get_guide`, `get_tokens`, `theme_from_colors`, `audit`, `doctor`), prefira-o à leitura de arquivos: `get_guide core` → `plan_screen` com o pedido (anatomia, blocos e componentes) → `get_block`/`get_component` → `audit`. Para ligar: `claude mcp add g4os-ds -- npx -y @g4ai/ds mcp`.

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

## 4. Regras que mais erram (lista completa em "Erros que agentes mais cometem", no core.md)

- **Anatomia**: toda tela é `Page` + `PageHeading`. Coluna estreita = `<Page width="narrow">` (ou `medium`/`reading`), **nunca** um `div` `mx-auto max-w-*` em volta só do corpo (o título fica fora do eixo).
- **Rótulos**: o `label` dos campos já é visível. Não embrulhe `TextField`/`CurrencyField` num `FieldBlock` com o mesmo rótulo, nem repita o texto como children do `Checkbox`. `hideLabel` só em célula de tabela e toolbar.
- **Desabilitado**: `<Button disabled disabledReason="motivo">`. Nunca `span` com `opacity-50`/`pointer-events-none` em volta.
- **Escolha o controle certo**: vários itens → `CheckboxGroup` (visíveis) ou `MultiSelect`; dias da semana → `ToggleGroup multiple`; data → `DatePicker`; hora → `TimePicker`; entidade de lista longa → `Combobox`. Nada de `<select>`, `<input>`, `<textarea>`, `<table>` crus, `confirm()` ou `alert()`.
- **Tokens**: nada de `bg-white`, `text-white`, hex, `gray-500`/`blue-600`: `bg-surface`, `bg-popover`, `bg-soft`, `text-ink`/`text-muted`, `border-line`, ação `bg-primary text-on-primary`.
- **Dados**: `formatCurrency`/`formatNumber`/`formatPercent`/`formatDate`; cinco estados (carregando, vazio, vazio por filtro, erro, ideal).
- **Escrita**: pt-BR, verbo + objeto, só a primeira maiúscula, sem exclamação nem "com sucesso".
- **Props**: confira em `DS/ai/components/<módulo>.md` (ou `get_component`) antes de usar. Não invente props.

## 5. Antes de dizer "pronto"

Repita até ficar limpo (não pare no primeiro "0 erros": avisos de anatomia e composição contam):

```bash
npx g4os-ds audit --changed --fix                    # só o que mudou; aplica as trocas seguras
npx g4os-ds audit --changed --format json            # leia os achados restantes (regra, linha, sugestão) e corrija
npx tsc --noEmit                                      # ou o typecheck do projeto
npx eslint <arquivos>                                 # se o projeto usa o plugin @g4ai/ds/eslint
```

Pronto = 0 erros **e** 0 avisos (ou aviso com `// g4os-ds-disable-next-line <regra> -- motivo`). Se houver servidor de desenvolvimento, confira a tela em 1440 e 390 px, claro e escuro (`data-theme="dark"` no `<html>`). Relate o que verificou e o que não pôde verificar.

Tarefas maiores têm skill própria: **ds-create** (tela/app novo), **ds-migrate** (adaptar projeto existente ou atualizar versão), **ds-review** (auditar/polir), **ds-theme** (marca do cliente, tema escuro).
