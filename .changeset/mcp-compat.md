---
"@g4ai/ds": minor
---

Servidor MCP compatível com os principais clientes (Claude Code, Codex, Cursor, VS Code/Copilot, Gemini CLI, Zed, Windsurf, Cline, Continue, Goose, JetBrains, opencode, pi via adaptador).

- Negocia os protocolos 2024-11-05, 2025-03-26, 2025-06-18 e 2025-11-25.
- stdio mais robusto: CRLF, BOM, pedaços parciais, lotes respondidos como lote, EOF sem quebra de linha, SIGTERM, stdout só para o protocolo.
- Schemas de entrada portáveis (Gemini, OpenAI): sem `default`, inteiros como `integer`. Argumentos inválidos voltam como `isError` para o modelo corrigir.
- Prompts `criar-tela`, `revisar-tela` e `adaptar-projeto`; templates de recurso com autocompletar; `logging/setLevel`; `completion/complete`.
- Respostas longas paginadas com `offset` (cabem no limite do Claude Code); `search` e `audit` com `offset`.
- Novo modo Streamable HTTP local: `npx -y @g4ai/ds mcp --http [--port 3845]`.
- Novo guia `docs/guias/mcp.md` com a config de cada cliente, Windows e problemas comuns. Testes com o SDK oficial: `npm run test:mcp`.
