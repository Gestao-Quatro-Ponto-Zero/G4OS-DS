# Visão financeira

- Arquivo: `src/blocks/fin-dashboard.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: Financeiro
- Preview: showcase `#/frame/fin-dashboard` (`?theme=dark` para o escuro)

O dia da controladoria em uma tela: caixa e projeção contra o mínimo, liquidez, aging do a receber, aprovações de pagamento, conciliação pendente, maiores devedores e centros estourados.

## Conceito

**Objetivo:** O dia da controladoria em uma tela: caixa, recebíveis, aprovações e pendências.

**Padrões aplicados**

- Anatomia B · Painel: cabeçalho fixo com período
- KPIs de liquidez, aging e caixa contra o mínimo
- Filas de ação (aprovar, conciliar) antes dos detalhes

**Quando usar e o que adaptar**

- Painel de operações, de RH

**Evite**

- Painel só com gráficos, sem o que fazer hoje

## Componentes usados

`BarList`, `Button`, `ChartCard`, `GaugeChart`, `KpiCard`, `KpiGrid`, `LineChart`, `ListPanel`, `ListRow`, `Meter`, `Page`, `PageHeading`, `ProportionBar`, `formatCurrency`
