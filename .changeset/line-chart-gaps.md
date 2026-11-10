---
"@g4ai/ds": minor
---

Gráficos cartesianos (`LineChart`, `AreaChart`, `BarChart`):

- `LineChart` deixa uma lacuna num ponto `null`. Antes a linha desenhava o ponto como zero, mas o eixo ignorava o `null`: com o eixo fora do zero (taxas, preços), a linha saía da área do gráfico. Um ponto isolado entre lacunas vira um marcador, e o cursor não marca um ponto sem dado. `labels` e `endLabels` também omitem os pontos sem dado, sem desenhar zero ou marcadores fora do gráfico.
- `axisWidth` fixa a largura do eixo de valores. Serve para alinhar gráficos empilhados que têm rótulos de tamanhos diferentes ("US$ 60,00" e "150 mi"): o mesmo dia fica na mesma posição em todos.
