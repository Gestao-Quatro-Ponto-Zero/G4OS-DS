# Nota fiscal (NF-e)

- Arquivo: `src/blocks/erp-invoice.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: ERP
- Preview: showcase `#/frame/erp-invoice` (`?theme=dark` para o escuro)

Documento fiscal para tela e impressão: chave de acesso, emitente e destinatário, itens com NCM/CFOP, tributos, totais, transporte, carta de correção e cancelamento.

## Conceito

**Objetivo:** Conferir, imprimir e corrigir uma NF-e com a mesma leitura do documento fiscal.

**Padrões aplicados**

- Anatomia C · Registro como documento: cabeçalho fixo (fora da impressão)
- Layout fiel ao documento: chave, emitente, destinatário, itens, tributos
- CSS de impressão só com o documento
- Carta de correção e cancelamento com confirmação

**Quando usar e o que adaptar**

- Proposta comercial, contrato, recibo

**Evite**

- Embrulhar o cabeçalho num invólucro (o fixo para de funcionar)

## Componentes usados

`ActionMenu`, `Badge`, `Button`, `Callout`, `ConfirmDialog`, `Modal`, `Page`, `PageHeading`, `TextareaField`, `formatCurrency`, `formatNumber`, `notify`
