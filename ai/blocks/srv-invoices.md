# Notas fiscais de serviço (NFS-e)

- Arquivo: `src/blocks/srv-invoices.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: Serviços
- Preview: showcase `#/frame/srv-invoices` (`?theme=dark` para o escuro)

NFS-e da Prefeitura de São Paulo em DataGrid: a emitir, na prefeitura, emitidas, rejeitadas e canceladas; ISS (alíquota, valor e retenção pelo tomador), município, origem (OS ou contrato), emissão em lote e correção de rejeitada em gaveta (?id=).

## Conceito

**Objetivo:** Emitir todas as notas do mês sem deixar nenhuma para trás e resolver as rejeitadas antes do vencimento da cobrança.

**Padrões aplicados**

- Anatomia A · Lista com DataGrid: abas por situação, total e ISS no rodapé
- Emitir em lote pela seleção (só “A emitir” entram); ação primária do cabeçalho emite todas as pendentes
- Rejeitada abre em Drawer com o código da prefeitura, o campo exato a corrigir e a dica de onde achar o dado
- ISS retido pelo tomador em palavra, nunca só em cor
- Cancelar nota emitida pede confirmação (irreversível na prefeitura)
- Cinco estados: ?estado=carregando|vazio|erro simula; vazio por filtro com Limpar

**Quando usar e o que adaptar**

- NF-e de produto (ERP), recibos de autônomo, faturas de locação

**Evite**

- Mostrar “Erro E160” sem dizer qual campo corrigir
- Reenviar rejeitada sem editar (volta a rejeitar)

## Componentes usados

`Badge`, `Button`, `Callout`, `ConfirmDialog`, `DataGrid`, `Drawer`, `Empty`, `EmptyFilterResult`, `FilterBar`, `FilterField`, `GridColumn`, `Highlight`, `OperationButton`, `OperationFeedback`, `Page`, `PageHeading`, `PropertyList`, `StatCell`, `StatGrid`, `TableSearch`, `Tabs`, `TextField`, `formatCurrency`, `formatDate`, `formatPercent`, `notify`, `useFilters`, `useOperation`
