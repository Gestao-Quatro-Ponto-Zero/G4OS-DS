# Conciliação bancária

- Arquivo: `src/blocks/fin-reconciliation.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: Financeiro
- Preview: showcase `#/frame/fin-reconciliation` (`?theme=dark` para o escuro)

Extrato do banco × lançamentos do ERP lado a lado: sugestões com grau de confiança, aceite em massa, vínculo manual e lançamento para tarifas e rendimentos sem documento.

## Conceito

**Objetivo:** Bater o extrato com o ERP rápido, aceitando o óbvio e resolvendo só as exceções.

**Padrões aplicados**

- Anatomia F · Mestre-detalhe: extrato × lançamentos lado a lado
- Sugestões com grau de confiança; aceite em massa
- Vínculo manual e lançamento para tarifas sem documento

**Quando usar e o que adaptar**

- Conciliação de cartões, de estoque físico × sistema

**Evite**

- Pedir confirmação item a item quando a confiança é alta

## Componentes usados

`Badge`, `Button`, `Callout`, `Empty`, `FieldBlock`, `FileDropzone`, `Meter`, `Modal`, `OperationButton`, `OperationFeedback`, `Page`, `PageHeading`, `PropertyList`, `Select`, `UploadItem`, `formatCurrency`, `formatPercent`, `notify`, `useOperation`
