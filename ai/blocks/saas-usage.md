# Uso e limites

- Arquivo: `src/blocks/saas-usage.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: SaaS
- Preview: showcase `#/frame/saas-usage` (`?theme=dark` para o escuro)

Consumo do ciclo por conta e recurso (usuários, painéis, eventos, API) contra o limite do plano; quem está perto ou acima do limite primeiro, com filtro por conta (?id=).

## Conceito

**Objetivo:** Achar as contas que vão bater (ou já bateram) no limite do plano, para avisar antes do bloqueio e oferecer upgrade.

**Padrões aplicados**

- Anatomia A · Lista: cabeçalho fixo + PageToolbar colada (faixa, recurso, plano, busca)
- Ordenada por % do limite: acima e perto primeiro
- Barra de uso + número + palavra; só acima/perto ganham cor
- Linha abre a conta; ?id= filtra uma conta vinda da página dela

**Quando usar e o que adaptar**

- Cotas de armazenamento, créditos de IA, franquia de minutos ou mensagens

**Evite**

- Mostrar só a porcentagem sem o limite
- Pintar de verde quem está dentro do limite

## Componentes usados

`ActionMenu`, `Badge`, `Button`, `Column`, `DataTable`, `Empty`, `EmptyFilterResult`, `EntityMark`, `FilterBar`, `FilterField`, `GridColumn`, `Highlight`, `KpiCard`, `KpiGrid`, `Meter`, `Page`, `PageHeading`, `PageToolbar`, `Pagination`, `SortHeader`, `TableSearch`, `downloadCsv`, `formatCompact`, `formatCurrency`, `formatNumber`, `formatPercent`, `gridToCsv`, `notify`, `useFilters`, `usePagination`, `useSort`
