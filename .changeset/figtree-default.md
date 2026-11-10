---
"@g4ai/ds": patch
---

A tipografia padrão volta a ser a Figtree, com títulos em 600 (`--ds-display-weight`), como antes do KV. A Manrope do KV G4 OS continua disponível, agora opcional: `data-type="g4os"` (preset "G4 OS · Manrope" em `typePresets`). Quem tinha `g4` salvo como tipografia (o id do padrão antigo) passa ao padrão atual; `data-type="classica"` segue valendo e equivale ao padrão. Novo export `DEFAULT_TYPE`.

Apps que carregam a fonte por conta própria devem carregar a Figtree (`next/font/google` ou Google Fonts); os templates e o guia de instalação já usam ela. Quem quiser manter a Manrope declara `data-type="g4os"` no `<html>`.

`Slider`: a primeira e a última marca da régua alinham pela borda, em vez de sair da largura do campo.
