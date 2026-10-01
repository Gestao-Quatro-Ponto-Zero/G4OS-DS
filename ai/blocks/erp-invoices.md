# Notas fiscais

- Arquivo: `src/blocks/erp-invoices.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: ERP
- Preview: showcase `#/frame/erp-invoices` (`?theme=dark` para o escuro)

NF-e emitidas com situação na SEFAZ, rejeições em destaque com o motivo e reenvio, busca por número, chave ou cliente (/), download de XML em massa. Linha abre a nota.

## Conceito

**Objetivo:** Achar notas com problema na SEFAZ e resolver rápido.

**Padrões aplicados**

- Anatomia A · Lista: cabeçalho fixo + PageToolbar colada
- Rejeições em destaque com o motivo e reenvio
- Busca por número, chave ou cliente (/); XML em massa

**Quando usar e o que adaptar**

- Faturas (SaaS), títulos (financeiro)

**Evite**

- Rejeição sem o motivo na linha

## Componentes usados

`Badge`, `BulkBar`, `Button`, `Callout`, `Column`, `DataTable`, `EmptyFilterResult`, `FilterBar`, `FilterField`, `Highlight`, `Page`, `PageHeading`, `PageToolbar`, `SortHeader`, `StatCell`, `StatGrid`, `TableSearch`, `formatCurrency`, `notify`, `selectionColumn`, `useFilters`, `useSelection`, `useSort`
