# Painel comercial

- Arquivo: `src/blocks/crm-sales-dashboard.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: CRM
- Preview: showcase `#/frame/crm-sales-dashboard` (`?theme=dark` para o escuro)

Meta do trimestre com ritmo esperado, receita por mês contra a meta, funil de conversão, ranking de vendedores e motivos de perda.

## Conceito

**Objetivo:** Responder se o time vai bater a meta do trimestre e onde está perdendo negócios.

**Padrões aplicados**

- Anatomia B · Painel: cabeçalho fixo com seletor de time
- KPIs levam à lista já filtrada (drill-down)
- “Precisa de você” num só painel logo abaixo dos KPIs: atividades atrasadas, negócios parados, propostas vencendo e leads novos
- Meta com ritmo esperado (GoalMeter)
- Receita × meta, funil, ranking e motivos de perda (Pareto)

**Quando usar e o que adaptar**

- Painel de recrutamento, de cobrança ou de operações

**Evite**

- Mostrar receita sem meta nem ritmo esperado

## Componentes usados

`BarChart`, `Button`, `ChartCard`, `CompareStat`, `Empty`, `ErrorState`, `FunnelChart`, `GaugeChart`, `GoalMeter`, `KpiCard`, `KpiGrid`, `Leaderboard`, `ListPanel`, `ListRow`, `Page`, `PageHeading`, `ParetoChart`, `SegmentedControl`, `Skeleton`, `formatCurrency`, `formatNumber`, `formatPercent`
