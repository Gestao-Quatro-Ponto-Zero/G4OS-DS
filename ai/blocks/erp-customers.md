# Clientes

- Arquivo: `src/blocks/erp-customers.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: ERP
- Preview: showcase `#/frame/erp-customers` (`?theme=dark` para o escuro)

Carteira de clientes B2B: CNPJ, segmento, vendedor, uso do limite de crédito e títulos vencidos. Detalhe em gaveta (?id=) com pedidos e títulos, bloqueio de crédito, e cadastro com consulta de CNPJ, endereço e condições comerciais.

## Conceito

**Objetivo:** Ver a carteira de clientes B2B com risco de crédito e agir sem perder a lista.

**Padrões aplicados**

- Anatomia A · Lista: cabeçalho fixo + PageToolbar colada
- Uso do limite de crédito e títulos vencidos na linha
- Detalhe em gaveta pela URL (?id=): trocar de cliente no ⌘K troca a gaveta
- Novo cliente em gaveta: CNPJ com máscara e consulta na Receita, endereço e condições
- Cinco estados: ?estado=carregando|vazio|erro

**Quando usar e o que adaptar**

- Contas (CRM), clientes (SaaS)

**Evite**

- Abrir página nova só para ver o limite de crédito
- Guardar o registro aberto num estado que não acompanha a URL

## Componentes usados

`Badge`, `Button`, `Column`, `CurrencyField`, `DataTable`, `Drawer`, `Empty`, `EmptyFilterResult`, `EntityMark`, `FilterBar`, `FilterField`, `Highlight`, `ListRow`, `MaskedField`, `Meter`, `OperationButton`, `OperationFeedback`, `Page`, `PageHeading`, `PageToolbar`, `PropertyList`, `Select`, `SortHeader`, `TableSearch`, `TextField`, `formatCurrency`, `masks`, `notify`, `useFilters`, `useOperation`, `useSort`
