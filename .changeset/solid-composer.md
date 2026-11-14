---
"@g4ai/ds": patch
---

`AgentComposer` e `ChatComposer` voltam ao campo sólido do 0.10: superfície opaca, borda `line` de 1 px, sombra leve, borda `line-strong` no foco e botão de enviar chapado em `primary` (tinta no tema G4, cor da marca em `[data-brand]`). Saem o vidro translúcido, a sombra elevada, a borda azul no foco e o degradê azul-céu com sombra no enviar. As classes `ds-glass` e `ds-ai-action` continuam disponíveis para momentos de marca. Quem sobrescrevia o compositor para voltar ao visual sólido pode remover o override.
