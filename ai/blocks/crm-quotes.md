# Propostas comerciais

- Arquivo: `src/blocks/crm-quotes.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: CRM
- Preview: showcase `#/frame/crm-quotes` (`?theme=dark` para o escuro)

Cotações do time: rascunho, enviada, aceita e recusada, com valor, validade e visualizações. Linha abre o detalhe em gaveta (?id=) com itens e ações conforme a situação; nova proposta com itens, desconto e validade.

## Conceito

**Objetivo:** Acompanhar as propostas enviadas e agir nas que vencem ou esperam resposta, sem sair da lista.

**Padrões aplicados**

- Anatomia A · Lista: cabeçalho fixo + PageToolbar colada (visões, filtros, busca)
- Situação = ponto + texto (Badge); validade em âmbar perto do vencimento e em rose quando venceu
- Detalhe em Drawer pelo endereço (?id=): itens, total, ações que mudam com a situação
- Nova proposta em Drawer com itens, desconto e validade (useOperation + OperationButton)
- Cinco estados: ?estado=carregando|vazio|erro simula; recorte vazio limpa filtros

**Quando usar e o que adaptar**

- Orçamentos (ERP), propostas de contratação (ATS), cotações de compra

**Evite**

- Abrir a proposta em outra página só para mudar a situação
- Total sem mostrar desconto e validade

## Componentes usados

`Avatar`, `Badge`, `Button`, `Column`, `Combobox`, `DataTable`, `DatePicker`, `Drawer`, `Empty`, `EmptyFilterResult`, `EntityMark`, `ErrorState`, `FieldBlock`, `FieldGrid`, `FilterBar`, `FilterField`, `IconButton`, `Modal`, `NumberField`, `OperationButton`, `OperationFeedback`, `Page`, `PageHeading`, `PageToolbar`, `PropertyList`, `SavedView`, `SavedViews`, `Select`, `Skeleton`, `TableSearch`, `TextField`, `formatCurrency`, `formatDate`, `formatNumber`, `formatPercent`, `notify`, `useFilters`, `useOperation`, `useSavedViews`
