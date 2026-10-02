# Requisições de vaga

- Arquivo: `src/blocks/ats-requisitions.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: ATS
- Preview: showcase `#/frame/ats-requisitions` (`?theme=dark` para o escuro)

Fila de aprovação de novas vagas: quem pede, motivo (aumento de quadro ou substituição), faixa, orçamento anual e cadeia de aprovação. Aprovar libera a abertura da vaga; recusar exige motivo. Seleção em ?id=.

## Conceito

**Objetivo:** Decidir rápido quais vagas podem ser abertas, com orçamento e justificativa à vista.

**Padrões aplicados**

- Anatomia F · Mestre-detalhe: fila à esquerda, requisição à direita; seleção no endereço (?id=)
- Aba “Aguardando você” primeiro; contador na navegação só com o que pede ação
- Cadeia de aprovação em Stepper; recusar pede motivo obrigatório
- Abrir vaga (ats-job ?id=nova) envia para cá: ?nova=<título> entra no topo da fila
- Cinco estados: ?estado=carregando|vazio|erro simula

**Quando usar e o que adaptar**

- Aprovação de compras (ERP), descontos acima da alçada (CRM), reembolsos

**Evite**

- Recusar sem motivo (o gestor não sabe o que ajustar)
- Abrir vaga sem orçamento aprovado

## Componentes usados

`Avatar`, `Badge`, `Button`, `Callout`, `Empty`, `Modal`, `OperationButton`, `OperationFeedback`, `Page`, `PageHeading`, `PropertyList`, `Stepper`, `Tabs`, `TextareaField`, `formatCurrency`, `formatDate`, `notify`, `useOperation`
