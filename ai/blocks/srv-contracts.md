# Contratos recorrentes

- Arquivo: `src/blocks/srv-contracts.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: Serviços
- Preview: showcase `#/frame/srv-contracts` (`?theme=dark` para o escuro)

Mensalidades por cliente: plano, valor mensal, reajuste anual (IPCA/IGP-M), próxima cobrança, horas do pacote e situação. Contrato abre em gaveta (?id=) com simulação de reajuste, consumo e, quando novo, o progresso da implantação.

## Conceito

**Objetivo:** Proteger a receita recorrente: renovar e reajustar no prazo, ver quem consome acima do pacote e acompanhar a implantação de quem acabou de fechar.

**Padrões aplicados**

- Anatomia A · Lista: cabeçalho fixo + PageToolbar colada (abas por situação, filtros, busca)
- Abas com contador só onde pede ação (Renovação próxima)
- Horas do pacote com barra; consumo acima pinta só o número
- Detalhe em Drawer (?id=): reajuste simulado pelo índice acumulado, últimas notas e cobranças
- Contrato novo mostra ProjectProgressCard da implantação com um único próximo passo
- Cinco estados: ?estado=carregando|vazio|erro simula; vazio por filtro com Limpar

**Quando usar e o que adaptar**

- Assinaturas de SaaS, mensalidades de escola, planos de manutenção de frota

**Evite**

- Reajuste aplicado sem mostrar o valor novo ao cliente
- Contador total na aba “Ativos” (não pede ação)

## Componentes usados

`Badge`, `Button`, `Callout`, `Column`, `ConfirmDialog`, `DataTable`, `Drawer`, `Empty`, `EmptyFilterResult`, `EntityMark`, `FilterBar`, `FilterField`, `Highlight`, `Meter`, `OperationButton`, `OperationFeedback`, `Page`, `PageHeading`, `PageToolbar`, `ProjectProgressCard`, `PropertyList`, `StatCell`, `StatGrid`, `TableSearch`, `Tabs`, `formatCurrency`, `formatDate`, `formatNumber`, `formatPercent`, `notify`, `useFilters`, `useOperation`
