# Clientes

- Arquivo: `src/blocks/erp-customers.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: ERP
- Preview: showcase `#/frame/erp-customers` (`?theme=dark` para o escuro)

Carteira de clientes B2B: CNPJ, segmento, vendedor, uso do limite de crédito e títulos vencidos. Detalhe em gaveta com pedidos recentes, bloqueio de crédito e novo pedido.

## Conceito

**Objetivo:** Ver a carteira de clientes B2B com risco de crédito e agir sem perder a lista.

**Padrões aplicados**

- Anatomia A · Lista: cabeçalho fixo + PageToolbar colada
- Uso do limite de crédito e títulos vencidos na linha
- Detalhe em gaveta com bloqueio de crédito e novo pedido

**Quando usar e o que adaptar**

- Contas (CRM), clientes (SaaS)

**Evite**

- Abrir página nova só para ver o limite de crédito

## Componentes usados

`Badge`, `Button`, `Column`, `DataTable`, `Drawer`, `EmptyFilterResult`, `EntityMark`, `FilterBar`, `FilterField`, `Highlight`, `ListRow`, `Meter`, `Page`, `PageHeading`, `PageToolbar`, `PropertyList`, `SortHeader`, `TableSearch`, `formatCurrency`, `notify`, `useFilters`, `useSort`
