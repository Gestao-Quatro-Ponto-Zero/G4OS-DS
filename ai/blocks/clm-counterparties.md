# Contrapartes

- Arquivo: `src/blocks/clm-counterparties.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: Contratos
- Preview: showcase `#/frame/clm-counterparties` (`?theme=dark` para o escuro)

Fornecedores, clientes e parceiros com CNPJ, sede (com hora local), contratos ativos, valor sob contrato e due diligence: certidões (Federal, FGTS, CNDT, estadual, municipal) e compliance (CEIS/CNEP, sanções, LGPD, beneficiário final). Detalhe em gaveta por ?id=.

## Conceito

**Objetivo:** Saber com quem a empresa tem contrato, quanto está em jogo com cada um e se a contraparte está regular antes de assinar ou renovar.

**Padrões aplicados**

- Anatomia A · Lista com DataGrid; detalhe em Drawer (?id=) para não perder a lista
- Due diligence resumida em palavra (Em dia, Certidão vencida, Pendências) e aberta por verificação na gaveta
- LocationTag com a hora local da sede (contraparte em Manaus, Recife ou Lisboa)
- Atualizar certidões e cadastrar contraparte com operação e aviso ao terminar
- Cinco estados: ?estado=carregando|vazio|erro; vazio por filtro com Limpar

**Quando usar e o que adaptar**

- Cadastro de fornecedores (ERP), parceiros de canal, prestadores PJ

**Evite**

- Mostrar só “risco alto” sem dizer qual certidão está vencida
- Assinar com certidão vencida sem registro de exceção

## Componentes usados

`Badge`, `Button`, `DataGrid`, `Drawer`, `Empty`, `EmptyFilterResult`, `EntityMark`, `FilterBar`, `FilterField`, `GridColumn`, `Highlight`, `LocationTag`, `MaskedField`, `OperationButton`, `OperationFeedback`, `Page`, `PageHeading`, `PropertyList`, `TableSearch`, `TextField`, `formatCurrency`, `formatDate`, `masks`, `plural`, `useFilters`, `useOperation`
