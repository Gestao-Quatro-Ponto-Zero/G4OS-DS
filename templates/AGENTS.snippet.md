<!--
Cole este trecho no AGENTS.md (ou CLAUDE.md, .cursorrules, copilot-instructions.md)
de qualquer projeto que usa ou vai usar o G4OS-DS. Funciona sem plugin: qualquer
agente que leia o arquivo passa a seguir o design system.
Instale antes: pnpm add @g4ai/ds @base-ui/react lucide-react
-->

## Design system: G4OS-DS

Este projeto usa o **G4OS-DS** (`@g4ai/ds`). Antes de criar, editar ou revisar qualquer interface:

1. Leia `node_modules/@g4ai/ds/ai/core.md` (regras, tokens, módulos, blocos). Sem acesso ao `node_modules`: https://gestao-quatro-ponto-zero.github.io/G4OS-DS/llms.txt. Se o servidor MCP `g4os-ds` estiver ligado (`claude mcp add g4os-ds -- npx -y @g4ai/ds mcp`), prefira as ferramentas `search`, `get_component`, `get_block`.
2. Para um componente, leia só `…/ai/components/<módulo>.md`; para uma tela parecida pronta, `…/ai/blocks/<slug>.md` e copie `…/src/blocks/<slug>.tsx`.
3. Ordem: bloco pronto → composição de componentes do DS → componente com outras props → do zero com tokens.
4. Nunca: hex, `bg-white`, `text-white`, `gray-500`/`blue-600`, `<select>` nativo, `confirm`/`alert`, `toFixed` para dinheiro. Use `bg-surface`/`bg-popover`/`text-ink`/`bg-primary text-on-primary`, `Select`, `ConfirmDialog`, `notify`, `formatCurrency`.
5. Texto em pt-BR; cinco estados em todo dado (carregando, vazio, vazio por filtro, erro, ideal); funciona em `data-theme="dark"`.
6. Antes de concluir: `npx g4os-ds audit <pastas alteradas>` com 0 erros e o typecheck verde.

Pedidos comuns (o agente deve seguir o fluxo correspondente em `node_modules/@g4ai/ds/plugin/skills/`):
- "Adapte este projeto ao G4OS-DS" → `ds-migrate/SKILL.md` (doctor → instalar → inventário com audit → migrar por página → verificar; progresso em `MIGRATION.md`).
- "Crie a tela X com o design system" → `ds-create/SKILL.md`.
- "Revise/polir esta tela" → `ds-review/SKILL.md`.
- "Tema do cliente / dark mode" → `ds-theme/SKILL.md`.
