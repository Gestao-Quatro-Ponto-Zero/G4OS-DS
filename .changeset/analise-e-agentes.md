---
"@g4ai/ds": minor
---

Gráficos analíticos, agentes de IA e revisão visual do DS inteiro.

**Novos componentes**
- Análise: `ConnectedScatter` (duas medidas no tempo, com meta e controle de tempo), `HorizonChart` + `HorizonLegend` (muitas séries contra a própria base), `ChoroplethMap` + `RankedRegionList` (mapa do Brasil por UF, dados do Natural Earth em `brUfs`), `PivotTable` + `PivotBuilder` (tabela dinâmica com motor `pivot()` testado) e `RetentionCurves`.
- Peças compartilhadas: `ScaleLegend`, `ChartScrubber`, `AxisBreak`, `useLinkedHighlight`; escalas `sequentialColor`, `divergingColor`, `quantize`, `onScaleInk`; tokens `chart-pos` / `chart-neg` (escala divergente).
- IA: `CitedText` (citação acende a frase que sustenta), `SourceCards`, `SourceStack`, `AnswerVersions`, `RelatedQuestions`; `AgentRunCard` com `DiffApproval` e `RunResult`; `EvalDotGrid`, `EvalCaseCompare`, `EvalRunHeader`; `ToolToggleList`, `KnowledgeFiles`, `AppAccessList`; `MorphIllustration`, `IntroCard` e `onboardingScenes`.

**Evoluções (aditivas)**
- `WaterfallChart`: `axisBreak` (única exceção ao eixo em zero, com marca de quebra), `selected`/`onSelect`, transição ao trocar o período.
- `SankeyChart`: `columnLabels`, `nodeLabels="above"`, `selected`/`onSelect` com rastro do caminho, `minWidth`.
- `HeatmapMatrix`: `rowMeta`, `summaryRow`, `scale`, `legend`, células navegáveis por teclado.
- `ModelPicker`: modelos em destaque com nota, "Outros modelos" por fornecedor e `summary` (contexto e preço). `MessageActions`: `onRegenerate` com opções e `versions`.
- `DiffView`: `actions` e `collapsed`. `AgentInstructions`: `maxLength`.

**Blocos novos**: `saas-mrr-bridge`, `saas-retention`, `saas-journey`, `saas-unit-economics`, `saas-regions`, `saas-explore`, `saas-usage-horizon`, `ai-answer`, `onboarding-intro`. Evoluídos: `ai-agent-run` (`?estado=ao-vivo`), `ai-agent-evals`, `ai-agent-builder`, `ai-agent-templates` (instalação no lugar).

**Mudanças visíveis**
- Formatadores (`formatNumber`, `formatCurrency`, `formatCompact`, `formatPercent`) usam o sinal de menos tipográfico "−", como `formatDelta` já fazia.
- `MessageActions` na variante `md` mostra `onShare` e quebra linha no celular.
- Foco de campo escurece a borda em todos os campos (Select, Combobox, DatePicker incluídos); campo somente leitura volta ao fundo gelo.
- `Button` ghost desenha o contorno por dentro (mesma altura dos campos vizinhos); `Label` no padrão dos rótulos de campo.
- KPIs alinhados na mesma linha com e sem sparkline; cabeçalho do `ChartCard` quebra no celular; legendas e tooltips alinhados; rótulos de barra e de eixo sem sumir nem vazar.
- Tabela no celular: a ação "⋯" vai para o canto do cartão; rótulos de colunas com `SortHeader` aparecem.

**Migração**
- Se algum teste ou código seu compara a saída dos formatadores com hífen ("-R$ 20,00"), troque para "−" (U+2212) ou normalize antes de comparar.
- `SankeyChart`: o hover agora traça o caminho inteiro (não só as faixas vizinhas) e `SankeyNode` aceita `color`.
- `WaterfallChart`: valores de quedas ficam abaixo da barra; em faixa estreita só a barra em foco mostra o valor; o tooltip traz a variação com sinal.
- `HeatmapMatrix`: células usam a mesma escala da legenda (`sequentialColor`); `tone="info"` passa a seguir o token `info`.

**Servidor**: libs puras e tokens (`@g4ai/ds/lib/format`, `/lib/pivot`, `/lib/scale`, `/lib/geo-br`, `/lib/dates`, `/tokens`…) saem sem `"use client"` e rodam em Server Component, rota de API ou script. O ponto de entrada principal continua de cliente.

**Auditoria**: regra `class-conflict` (duas utilidades da mesma propriedade no `cn`, que vence pela ordem do CSS e não do código).
