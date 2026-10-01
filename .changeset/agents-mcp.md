---
"@g4ai/ds": minor
---

Docs e ferramentas para agentes de IA, e instruções de uso pelo npm.

- Novo `g4os-ds mcp`: servidor MCP local (sem dependências) com `search`, `get_component`, `list_blocks`, `get_block`, `get_guide`, `get_tokens`, `theme_from_colors`, `audit` e `doctor`. Instale com `claude mcp add g4os-ds -- npx -y @g4ai/ds mcp`.
- Site publica `llms.txt`, `llms-full.txt`, `ai/` e `docs/` para agentes que leem URLs.
- `ai/blocks/*.md` agora traz o conceito de cada bloco (objetivo, padrões, o que adaptar, o que evitar) e a lista de componentes usados (estava vazia desde a troca de nome do pacote).
- `g4os-ds doctor` não pede mais `transpilePackages` quando o pacote vem do npm (compilado).
- README, guias (novo: Vite), starter `templates/next-app` e skills passam a instalar pelo npm (`pnpm add @g4ai/ds`). Nova seção "Atualizar de versão".

O que o app precisa fazer: nada. Se o seu `next.config` tem `transpilePackages: ["@g4ai/ds"]` e o pacote vem do npm, pode remover.
