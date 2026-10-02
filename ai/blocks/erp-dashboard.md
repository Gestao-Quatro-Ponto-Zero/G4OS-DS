# Painel de operações

- Arquivo: `src/blocks/erp-dashboard.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: ERP
- Preview: showcase `#/frame/erp-dashboard` (`?theme=dark` para o escuro)

Vendas do dia contra a meta, OTIF por semana, causas de atraso (Pareto), maiores clientes e as filas que pedem ação: faturar, repor estoque e aprovar compras.

## Conceito

**Objetivo:** Mostrar à operação se as vendas estão no ritmo e quais filas pedem ação agora (faturar, repor, aprovar).

**Padrões aplicados**

- Anatomia B · Painel: cabeçalho fixo com período
- Vendas × meta diária, OTIF, causas de atraso (Pareto)
- Filas de ação antes dos detalhes

**Quando usar e o que adaptar**

- Painel financeiro, de atendimento ou de recrutamento

**Evite**

- Gráficos bonitos sem a fila de ação

## Componentes usados

`AreaChart`, `Badge`, `BarList`, `ChartCard`, `Empty`, `KpiCard`, `KpiGrid`, `LineChart`, `ListPanel`, `ListRow`, `Page`, `PageHeading`, `ParetoChart`, `SegmentedControl`, `formatCompact`, `formatCurrency`, `formatNumber`
