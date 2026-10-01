# Dados e gráficos

Gráficos do DS são SVG puro (`src/components/charts.tsx` e, para os complexos, `charts-advanced.tsx`), sem Recharts nem D3. Mesmo acabamento, mesmo tooltip, mesma formatação, acessíveis por teclado e leitor de tela.

## Paleta de séries

| Token | Hex | Papel |
| --- | --- | --- |
| `chart-1` | `#202124` | **a série principal**: o número que importa (receita deste período, "nós") |
| `chart-2` | `#184560` | comparação: período anterior, meta, benchmark |
| `chart-3` | `#b9915b` | destaque de marca, terceira categoria |
| `chart-4` | `#842e20` | quarta categoria |
| `chart-5` | `#5f7f6f` | quinta categoria |
| `chart-6` | `#a3a7b0` | "Outros", sem dado, referência |
| `chart-grid` | `#eef0f2` | linhas de grade (mais claras que `line`) |

Em código: `chartColor(i)` devolve `var(--color-chart-N)`; em TS fora do CSS, `tokens.chart[i]`.

**Ordem fixa.** A mesma categoria tem a mesma cor em todos os gráficos da tela (se "Orgânico" é chart-3 no donut, é chart-3 na barra ao lado). Passe `color` explícito quando a ordem dos dados variar.

**Até 6 séries.** Acima disso, agrupe as menores em "Outros" (chart-6) ou troque de gráfico (BarList, tabela).

**Cores semânticas dentro de gráfico** só quando o dado é semântico: entradas × saídas de caixa (`ok`/`rose`), dentro × fora da meta. Não pinte uma série de verde porque "é bom".

## Qual gráfico usar

| Pergunta | Gráfico | Componente |
| --- | --- | --- |
| Quanto? (um número) | número grande + delta | `KpiCard`, `Metric`, `StatCell` |
| Como evoluiu no tempo, com volume? | área | `AreaChart` |
| Como evoluiu uma taxa/preço? | linha | `LineChart` |
| Tendência ao lado de um número? | sparkline | `Sparkline` (dentro do `KpiCard`) |
| Qual categoria é maior? (≤ 16) | barras | `BarChart` |
| Ranking com nomes longos | barras horizontais | `BarList` |
| Composição de um todo (2–6 partes) | donut | `DonutChart` |
| Composição hierárquica / muitas partes | treemap | `Treemap` |
| Onde as pessoas desistem? | funil | `FunnelChart` (`bars` estreito, `columns` largo) |
| Como um valor inicial vira o final? | cascata | `WaterfallChart` |
| De onde vem e para onde vai o fluxo? | sankey | `SankeyChart` |
| Relação entre duas medidas | dispersão / bolhas | `ScatterChart` |
| Perfil em vários critérios (scorecard) | radar | `RadarChart` |
| Quanto da meta / capacidade? | medidor, anel, barra de meta | `GaugeChart`, `ProgressRing`, `GoalMeter` |
| Quando acontece? (dia × intensidade) | calendário de calor | `CalendarHeatmap` |
| Matriz (coorte, dia × hora) | mapa de calor | `HeatmapMatrix` |
| Real × meta em uma linha | bullet | `BulletChart` |

Também em `charts-advanced.tsx`: `ComboChart` (barras + linha no mesmo eixo), `ProportionBar` (barra 100 % com legenda) e `GanttChart` (cronograma). Todos no showcase em **Gráficos**.

## Regras

1. **Um gráfico responde uma pergunta.** O título do `ChartCard` é a pergunta ("De onde vêm os leads?"), a descrição dá período e unidade ("Últimos 90 dias · em R$").
2. **Eixo Y começa em zero** em barras e áreas. `niceDomain` já faz isso; não "dê zoom" para exagerar variação. Linhas de taxa podem não começar em zero, e a escala diz isso.
3. **Grade horizontal clara, sem eixo vertical desenhado**, sem borda de plotagem, sem 3D, sem sombra, sem gradiente além do da área.
4. **Valor exato sempre alcançável**: tooltip no hover e nas setas do teclado; tabela `sr-only` para leitor de tela (feito pelo componente, passe `label`).
5. **Rotule direto quando der**; legenda só com 2+ séries. Legenda acima do gráfico, alinhada à esquerda.
6. **Formate eixos compactos** (`formatAxis={(n) => formatCurrency(n, { compact: true })}`) e tooltips completos (`format={(n) => formatCurrency(n)}`).
7. **Comparação é tracejada** (`dashed: true`) quando é meta ou período anterior; cheia quando é outra categoria real.
8. **Meta é linha de referência** (`reference={{ value, label: "Meta" }}`), em dourado tracejado.
9. **Funil destaca a maior perda** em âmbar: é onde agir. Mostre conversão da etapa e conversão acumulada.
10. **Sem dado ≠ zero.** Use `null` no dado para lacunas; o tooltip mostra "—".
11. **Nada anima na entrada**; só transições quando o dado muda.
12. **Período sempre explícito** e seletor de período (`SegmentedControl` com 2–4 opções) no `action` do `ChartCard`.

## Números

- Moeda: `formatCurrency(1234.5)` → `R$ 1.234,50`; compacto `R$ 1,2 mil`.
- Porcentagem recebe **fração**: `formatPercent(0.123)` → `12,3 %`.
- Variação: `formatDelta(0.125)` → `+12,5 %`. Em `KpiCard`, passe `delta={0.125}` e `goodWhen` (`"down"` para custo, churn, tempo de resposta, inadimplência).
- Sempre `tabular-nums` em colunas e totais.
