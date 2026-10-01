# Requisições de compra

- Arquivo: `src/blocks/erp-purchase-requests.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: ERP
- Preview: showcase `#/frame/erp-purchase-requests` (`?theme=dark` para o escuro)

Fila de aprovação mestre-detalhe: cadeia de aprovadores, itens, comparação de cotações com o menor preço destacado e aprovar/recusar com justificativa.

## Conceito

**Objetivo:** Aprovar ou recusar requisições de compra com a cotação certa e justificativa.

**Padrões aplicados**

- Anatomia F · Mestre-detalhe: fila à esquerda, requisição à direita
- Cadeia de aprovadores com etapa atual
- Comparação de cotações com o menor preço destacado
- Recusar exige justificativa

**Quando usar e o que adaptar**

- Aprovação de propostas (ATS), descontos (CRM), reembolsos

**Evite**

- Aprovar sem ver as cotações

## Componentes usados

`Avatar`, `Badge`, `Button`, `Callout`, `Empty`, `Modal`, `NumberField`, `Page`, `PageHeading`, `PropertyList`, `Stepper`, `Tabs`, `TextField`, `Tone`, `areaClass`, `formatCurrency`, `notify`
