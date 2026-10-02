# Caixa de leads

- Arquivo: `src/blocks/crm-leads.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: CRM
- Preview: showcase `#/frame/crm-leads` (`?theme=dark` para o escuro)

Leads do site, de eventos e de indicação para qualificar: pontuação com os sinais que a explicam, mensagem original e decisão em um clique (qualificar vira negócio no pipeline; desqualificar pede motivo).

## Conceito

**Objetivo:** Decidir rápido quais leads viram negócio e quais saem da fila, sem perder o motivo.

**Padrões aplicados**

- Anatomia F · Mestre-detalhe: fila à esquerda, lead à direita; seleção no endereço (?id=); no celular o detalhe ocupa a tela com voltar
- Pontuação explicada pelos sinais (cor sempre com palavra: Quente, Morno, Frio)
- Qualificar abre gaveta com o negócio pré-preenchido e leva ao registro criado
- Desqualificar exige motivo (alimenta o relatório de origem)
- Cinco estados: ?estado=carregando|vazio|erro simula; aba vazia com próxima ação

**Quando usar e o que adaptar**

- Triagem de candidatos (ATS), chamados novos (suporte), pedidos de cotação (ERP)

**Evite**

- Pontuação sem explicação
- Qualificar sem criar o negócio (o lead some e ninguém acompanha)

## Componentes usados

`Avatar`, `Badge`, `Button`, `CurrencyField`, `Drawer`, `Empty`, `EntityMark`, `ErrorState`, `FieldBlock`, `FieldGrid`, `Modal`, `OperationButton`, `OperationFeedback`, `Page`, `PageHeading`, `PropertyList`, `Select`, `Skeleton`, `Tabs`, `TextField`, `formatCurrency`, `formatDate`, `notify`, `useOperation`
