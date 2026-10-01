---
"@g4ai/ds": patch
---

Instruções para agentes de IA e lint mais afiados, medidos com um eval de agentes reais.

- **16 regras novas no `g4os-ds audit` e no `@g4ai/ds/eslint`** (47 no total), nas categorias novas "Anatomia de página" e "Escrita" e em Composição: `page-width-wrapper` (corpo centralizado com `mx-auto max-w-*` fora do eixo do título → `Page width`), `page-heading`, `disabled-wrapper` (opacidade/pointer-events em volta de botão desabilitado → `disabledReason`), `redundant-children`, `field-double-label`, `nested-drawer`, `multiple-primary`, `select-per-row`, `cell-control-label` (com `--fix`), `raw-input`, `raw-table`, `data-states`, `manual-format`, `copy-tone`, `english-copy`, `title-case`. A maioria é aviso: zere os avisos, não só os erros.
- **Correção no leitor de código do audit**: `{...} />` seguido de `/` na mesma linha deixava de ver strings (falsos negativos e positivos em várias regras).
- **`ai/core.md` reescrito**: fluxo de trabalho, as nove anatomias com esqueleto, tabela "Qual componente" e os 18 erros que agentes mais cometem (errado → certo, com a regra do audit). Componentes ganharam notas "Uso certo / Evite" (`Page`, `Button`, `Checkbox`, `CheckboxGroup`, `MultiSelect`, `FieldBlock`, `DataTable`, `BulkBar`, `DatePicker`…).
- **MCP: ferramenta `plan_screen`** (pedido → anatomia, blocos de referência, componente certo por necessidade e checklist).
- Skills (`g4os-ds`, `ds-create`, `ds-migrate`, `ds-review`) e `templates/AGENTS.snippet.md` com o laço "audit até 0 erros e 0 avisos" e as armadilhas de migração.
- **Novo starter `templates/vite-app`** (Vite + React + Tailwind v4 + DS, roteador mínimo, ESLint e config do audit).
