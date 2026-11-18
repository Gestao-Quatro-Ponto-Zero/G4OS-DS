---
"@g4ai/ds": minor
---

Mapas do mundo e dos municípios para o `ChoroplethMap`. `loadWorldCountries()` traz os países (id ISO alfa-2, nome em português, continente) e o recorte de cada continente; `loadBrMunicipios(uf)` traz os municípios de uma UF com o código IBGE como id. Os dois carregam sob demanda (mundo: ~20 KB com gzip; UF: de 1 a 54 KB). O mapa ganha `markers` e `markerBelow` para controlar os círculos de toque das regiões pequenas, e a hachura de "sem dado" passa a ter passo fixo em px em qualquer recorte.
