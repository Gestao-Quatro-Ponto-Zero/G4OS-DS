# Cobrança e faturas

- Arquivo: `src/blocks/saas-billing.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: SaaS
- Preview: showcase `#/frame/saas-billing` (`?theme=dark` para o escuro)

Ponte de MRR do mês, situação das faturas, régua de cobrança com retentativa, filtros, ações em massa e detalhe da fatura em gaveta (?id=).

## Conceito

**Objetivo:** Proteger o MRR: ver de onde ele vem e recuperar cobranças que falharam.

**Padrões aplicados**

- Anatomia B · Painel + lista: ponte de MRR no topo, faturas abaixo
- Régua de cobrança com retentativa
- Ações em massa; detalhe da fatura em gaveta (?id=)

**Quando usar e o que adaptar**

- Contas a receber (financeiro), assinaturas de serviço

**Evite**

- Falha de cobrança sem próxima tentativa visível

## Componentes usados

`Badge`, `BulkBar`, `Button`, `ChartCard`, `Column`, `DataTable`, `Drawer`, `EmptyFilterResult`, `EntityMark`, `FilterBar`, `FilterField`, `Highlight`, `KpiCard`, `KpiGrid`, `Page`, `PageHeading`, `Pagination`, `PropertyList`, `ProportionBar`, `SortHeader`, `TableSearch`, `WaterfallChart`, `formatCurrency`, `formatDate`, `notify`, `selectionColumn`, `useFilters`, `usePagination`, `useSelection`, `useSort`
