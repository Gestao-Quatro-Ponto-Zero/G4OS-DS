---
"@g4ai/ds": minor
---

Regiões de DDD para o `ChoroplethMap`. `loadBrDdd(uf)` junta os municípios de cada DDD de uma UF numa região só, sem as divisas internas, com o DDD como id e o mesmo viewBox de `loadBrMunicipios(uf)`. Carrega sob demanda (de 1 a 5 KB com gzip por UF).
