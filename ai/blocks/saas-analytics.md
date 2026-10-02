# Análise de aquisição

- Arquivo: `src/blocks/saas-analytics.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: SaaS
- Preview: showcase `#/frame/saas-analytics` (`?theme=dark` para o escuro)

Funil de conversão em colunas, origem do tráfego, dispositivos, taxa de conversão no tempo e mapa de atividade diária.

## Conceito

**Objetivo:** Entender de onde vêm os clientes e onde a aquisição perde gente.

**Padrões aplicados**

- Anatomia B · Painel: cabeçalho fixo com período
- Funil em colunas com a maior perda destacada
- Origem, dispositivos, conversão no tempo e atividade diária

**Quando usar e o que adaptar**

- Funil de recrutamento, funil comercial

**Evite**

- Funil sem mostrar a conversão entre etapas

## Componentes usados

`BarList`, `Button`, `CalendarHeatmap`, `ChartCard`, `DataTable`, `DonutChart`, `Empty`, `ErrorState`, `FunnelChart`, `KpiCard`, `KpiGrid`, `LineChart`, `Page`, `PageHeading`, `SankeyChart`, `SegmentedControl`, `Skeleton`, `formatCurrency`, `formatDelta`, `formatNumber`, `formatPercent`
