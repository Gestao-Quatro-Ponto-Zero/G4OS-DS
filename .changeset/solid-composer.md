---
"@g4ai/ds": minor
---

`AgentComposer` e `ChatComposer` voltam ao campo sólido do 0.10: superfície opaca, borda `line` de 1 px, sombra leve e borda `line-strong` no foco. Os botões de enviar e parar ficam chapados no novo token `send` / `on-send` (utilitários `bg-send`, `text-on-send`): navy G4 `#001f35` com ícone prata no tema claro, prata com ícone navy no escuro. Numa marca de cliente (`data-brand` fora das marcas G4), `send` segue o `primary`. Saem o vidro translúcido, a sombra elevada, a borda azul no foco e o degradê azul-céu com sombra. As classes `ds-glass` e `ds-ai-action` continuam disponíveis para momentos de marca. Quem sobrescrevia o compositor para voltar ao visual sólido pode remover o override.
