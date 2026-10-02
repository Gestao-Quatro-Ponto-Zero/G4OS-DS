# Fila de aprovação

- Arquivo: `src/blocks/clm-approvals.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: Contratos
- Preview: showcase `#/frame/clm-approvals` (`?theme=dark` para o escuro)

Mestre-detalhe (?id=): contratos esperando você, cadeia de aprovadores, o que muda em relação ao modelo padrão (cláusulas fora do padrão lado a lado, com risco e justificativa) e aprovar ou recusar com comentário.

## Conceito

**Objetivo:** Aprovar ou recusar um contrato olhando só o que foge do modelo padrão, sem reler a minuta inteira.

**Padrões aplicados**

- Anatomia F · Mestre-detalhe: fila à esquerda, aprovação à direita; seleção no endereço (?id=); no celular o detalhe abre em tela cheia com Voltar
- Diferenças contra o modelo: padrão × proposto lado a lado, risco em palavra e “alternativa já aprovada” quando existe na biblioteca
- Cadeia de aprovação (Stepper) com o comentário de quem já aprovou
- Recusar exige comentário; aprovar passa para o próximo da cadeia
- Cinco estados na fila: ?estado=carregando|vazio|erro

**Quando usar e o que adaptar**

- Aprovação de pedidos de compra, propostas comerciais com desconto, políticas internas

**Evite**

- Mostrar a minuta inteira para aprovar: o aprovador precisa do que mudou
- Recusar sem dizer o que precisa mudar

## Componentes usados

`Avatar`, `Badge`, `Button`, `Callout`, `Empty`, `EntityMark`, `FactLine`, `OperationButton`, `OperationFeedback`, `Page`, `PageHeading`, `Stepper`, `Tabs`, `TextareaField`, `formatCurrency`, `formatDate`, `plural`, `useOperation`
