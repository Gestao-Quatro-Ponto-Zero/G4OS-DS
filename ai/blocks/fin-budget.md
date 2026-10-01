# Orçamento

- Arquivo: `src/blocks/fin-budget.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: Financeiro
- Preview: showcase `#/frame/fin-budget` (`?theme=dark` para o escuro)

Orçado × realizado por centro de custo no mês ou no acumulado: halteres de variação, régua de consumo por responsável, tabela com desvio favorável/desfavorável e pedido de remanejamento.

## Conceito

**Objetivo:** Mostrar onde o realizado está fugindo do orçado e quem responde por isso.

**Padrões aplicados**

- Anatomia B · Painel: cabeçalho fixo com mês/acumulado
- Halteres orçado × realizado; desvio favorável/desfavorável por cor e palavra
- Pedido de remanejamento em modal

**Quando usar e o que adaptar**

- Metas comerciais, headcount por área

**Evite**

- Verde/vermelho sem dizer se custo acima é ruim

## Componentes usados

`Badge`, `Button`, `ChartCard`, `Column`, `CurrencyField`, `DataTable`, `DumbbellChart`, `FieldBlock`, `KpiCard`, `KpiGrid`, `Meter`, `Modal`, `Page`, `PageHeading`, `SegmentedControl`, `Select`, `TextareaField`, `formatCurrency`, `formatPercent`, `notify`
