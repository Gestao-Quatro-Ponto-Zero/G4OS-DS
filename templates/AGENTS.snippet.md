<!--
Cole este trecho no AGENTS.md (ou CLAUDE.md, .cursorrules, copilot-instructions.md)
de qualquer projeto que usa ou vai usar o G4OS-DS. Funciona sem plugin: qualquer
agente que leia o arquivo passa a seguir o design system.
Instale antes: pnpm add @g4ai/ds @base-ui/react lucide-react
-->

## Design system: G4OS-DS

Este projeto usa o **G4OS-DS** (`@g4ai/ds`). Antes de criar, editar ou revisar qualquer interface:

1. Leia `node_modules/@g4ai/ds/ai/core.md` inteiro (fluxo, anatomias, "Qual componente", erros comuns). Sem `node_modules`: https://gestao-quatro-ponto-zero.github.io/G4OS-DS/llms.txt. Com o MCP `g4os-ds` ligado (`claude mcp add g4os-ds -- npx -y @g4ai/ds mcp`): `plan_screen` com o pedido → `get_block`/`get_component` → `audit`.
2. Comece pelo bloco mais próximo (`…/ai/blocks/<slug>.md`, código em `…/src/blocks/<slug>.tsx`); confira props em `…/ai/components/<módulo>.md` antes de usar. Não invente props.
3. Toda tela é `Page` + `PageHeading`. Coluna estreita = `<Page width="narrow">` (nunca `mx-auto max-w-*` em volta do corpo).
4. O `label` dos campos já é o rótulo visível: sem `FieldBlock` duplicado, sem children repetindo o label do `Checkbox`; `hideLabel` só em célula/toolbar. Bloqueado = `<Button disabled disabledReason="motivo">`.
5. Nunca: hex, `bg-white`, `text-white`, `gray-500`/`blue-600`, `<select>`/`<input>`/`<textarea>`/`<table>` crus, `<input type="date|time">`, `confirm`/`alert`, `toFixed` para dinheiro. Use tokens (`bg-surface`, `text-ink`, `bg-primary text-on-primary`), `Select`/`Combobox`/`MultiSelect`/`CheckboxGroup`/`NativeSelect`, `DatePicker`/`TimePicker`, `DataTable`/`Table`, `ConfirmDialog`, `notify`, `formatCurrency`/`formatDate`.
6. Texto em pt-BR (verbo + objeto, só a primeira maiúscula, sem "!" nem "com sucesso"); cinco estados em todo dado (carregando, vazio, vazio por filtro, erro, ideal); funciona em `data-theme="dark"`.
7. Antes de concluir, repita até limpar: `npx g4os-ds audit --changed --fix`, depois `npx g4os-ds audit --changed --format json` → **0 erros e 0 avisos**; `npx tsc --noEmit` verde (e `npx eslint` se o projeto usa `@g4ai/ds/eslint`).

Pedidos comuns (o agente deve seguir o fluxo correspondente em `node_modules/@g4ai/ds/plugin/skills/`):
- "Adapte este projeto ao G4OS-DS" → `ds-migrate/SKILL.md` (doctor → instalar → inventário com audit → migrar por página → verificar; progresso em `MIGRATION.md`).
- "Crie a tela X com o design system" → `ds-create/SKILL.md`.
- "Revise/polir esta tela" → `ds-review/SKILL.md`.
- "Tema do cliente / dark mode" → `ds-theme/SKILL.md`.
