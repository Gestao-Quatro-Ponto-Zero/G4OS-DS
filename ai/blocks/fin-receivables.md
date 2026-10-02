# Contas a receber

- Arquivo: `src/blocks/fin-receivables.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: Financeiro
- Preview: showcase `#/frame/fin-receivables` (`?theme=dark` para o escuro)

Vencidos e a vencer em abas, aging em barras, DataGrid com tom por atraso, total fixo, cobrança em massa, ações rápidas (receber, cobrar), CSV e gaveta para registrar pagamento ou promessa.

## Conceito

**Objetivo:** Cobrar quem está atrasado, começando pelo maior risco.

**Padrões aplicados**

- Anatomia A · Lista com resumo de aging no topo e DataGrid abaixo
- Tom da linha por atraso; total fixo no rodapé da grade
- Cobrança em massa e ações rápidas (receber, cobrar)
- Registrar pagamento ou promessa em gaveta

**Quando usar e o que adaptar**

- Faturas em atraso (SaaS), devoluções pendentes

**Evite**

- Ordenar por nome em vez de atraso

## Componentes usados

`Badge`, `BarChart`, `Button`, `ChartCard`, `DataGrid`, `DatePicker`, `Drawer`, `Empty`, `EmptyFilterResult`, `EntityMark`, `FieldBlock`, `FilterBar`, `FilterField`, `GridColumn`, `Highlight`, `KpiCard`, `KpiGrid`, `Page`, `PageHeading`, `PropertyList`, `TableSearch`, `Tabs`, `formatCurrency`, `formatPercent`, `notify`, `useFilters`
