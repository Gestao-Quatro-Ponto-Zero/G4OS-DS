# Clientes do ERP de serviços

- Arquivo: `src/blocks/srv-clients.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: Serviços
- Preview: showcase `#/frame/srv-clients` (`?theme=dark` para o escuro)

Carteira de clientes (condomínios, clínicas, escritórios, escolas) com CNPJ, segmento, receita recorrente, OS abertas e saldo em aberto/vencido. Cadastro em gaveta com busca do CNPJ na Receita (?novo=1). Linha abre o cliente.

## Conceito

**Objetivo:** Achar o cliente em segundos e ver, na mesma linha, quanto ele vale por mês, o que está aberto e se está devendo.

**Padrões aplicados**

- Anatomia A · Lista: cabeçalho fixo + PageToolbar colada (filtros rápidos por segmento e situação, busca por CNPJ sem pontuação)
- Colunas numéricas à direita com tabular-nums; vencido pinta só o valor
- Ordenação por receita recorrente e saldo (useSort)
- Cadastrar em Drawer; “Buscar na Receita” preenche razão social e endereço pelo CNPJ
- Cinco estados: ?estado=carregando|vazio|erro simula; vazio por filtro com Limpar

**Quando usar e o que adaptar**

- Carteira de condomínios de uma administradora, pacientes de clínica, alunos de escola

**Evite**

- Saldo devedor só em cor, sem o valor
- Cadastro em página separada que perde a lista

## Componentes usados

`Badge`, `Button`, `Column`, `DataTable`, `Drawer`, `Empty`, `EmptyFilterResult`, `EntityMark`, `FilterBar`, `FilterField`, `Highlight`, `OperationButton`, `OperationFeedback`, `Page`, `PageHeading`, `PageToolbar`, `Select`, `StatCell`, `StatGrid`, `Switch`, `TableSearch`, `TextField`, `formatCurrency`, `useFilters`, `useOperation`, `useSort`
