# Orçamentos de serviço

- Arquivo: `src/blocks/srv-quotes.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: Serviços
- Preview: showcase `#/frame/srv-quotes` (`?theme=dark` para o escuro)

Orçamentos por situação (rascunho, enviado, aprovado, recusado, expirado) com validade e valor. Criar em gaveta com horas, valor/hora, materiais, desconto e ISS; aprovar vira OS (avulso) ou contrato (recorrente). ?id= abre o orçamento, ?novo=1 abre o cadastro.

## Conceito

**Objetivo:** Transformar pedido do cliente em orçamento rápido e, aprovado, em trabalho agendado ou receita recorrente sem redigitar nada.

**Padrões aplicados**

- Anatomia A · Lista: cabeçalho fixo + PageToolbar colada (abas por situação, filtros, busca)
- Criar e ver orçamento em Drawer, sem perder a lista; ?id= e ?novo=1 no endereço
- Itens de serviço (horas × valor/hora) e materiais separados; desconto e ISS destacado
- Aprovar pergunta o destino: avulso → OS, recorrente → contrato; o orçamento guarda o vínculo
- Validade vencendo em até 3 dias pinta só a data; expirado oferece renovar
- Cinco estados: ?estado=carregando|vazio|erro simula; vazio por filtro com Limpar

**Quando usar e o que adaptar**

- Proposta comercial (CRM), orçamento de obra, cotação de frete

**Evite**

- Aprovar orçamento e redigitar tudo na OS
- Desconto escondido no preço unitário (o cliente não vê o que ganhou)

## Componentes usados

`Badge`, `Button`, `Callout`, `Column`, `Combobox`, `DataTable`, `DatePicker`, `Drawer`, `Empty`, `EmptyFilterResult`, `FilterBar`, `FilterField`, `Highlight`, `IconButton`, `Modal`, `NumberField`, `OperationButton`, `OperationFeedback`, `Page`, `PageHeading`, `PageToolbar`, `PropertyList`, `Select`, `StatCell`, `StatGrid`, `Table`, `TableSearch`, `Tabs`, `TextField`, `formatCurrency`, `formatDate`, `formatPercent`, `notify`, `useFilters`, `useOperation`
