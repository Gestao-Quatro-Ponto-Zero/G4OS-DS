# Estoque

- Arquivo: `src/blocks/erp-inventory.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: ERP
- Preview: showcase `#/frame/erp-inventory` (`?theme=dark` para o escuro)

Saldo por item com quebra por depósito, régua contra o mínimo, cobertura em dias, ruptura com requisição de compra, transferência e entrada de mercadoria. Linha abre o produto.

## Conceito

**Objetivo:** Evitar ruptura: ver o saldo por depósito contra o mínimo e repor a tempo.

**Padrões aplicados**

- Anatomia A · Lista: cabeçalho fixo + PageToolbar colada
- Régua de saldo contra o mínimo e cobertura em dias
- Ruptura vira requisição de compra em um clique
- Linha abre o produto

**Quando usar e o que adaptar**

- Licenças (SaaS), capacidade de equipes, vagas por área

**Evite**

- Mostrar saldo sem o mínimo de referência

## Componentes usados

`Badge`, `Button`, `Callout`, `ChartCard`, `Column`, `DataTable`, `Empty`, `EmptyFilterResult`, `FieldBlock`, `FilterBar`, `FilterField`, `Highlight`, `KpiCard`, `Meter`, `Modal`, `NumberField`, `Page`, `PageHeading`, `PageToolbar`, `Select`, `SortHeader`, `TableSearch`, `TextField`, `Treemap`, `formatCurrency`, `formatNumber`, `notify`, `useFilters`, `useSort`
