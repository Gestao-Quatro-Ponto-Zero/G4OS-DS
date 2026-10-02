# Aprovações de agentes

- Arquivo: `src/blocks/ai-approvals.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: IA
- Preview: showcase `#/frame/ai-approvals` (`?theme=dark` para o escuro)

Fila human-in-the-loop (?id=): o que o agente quer fazer, impacto, risco, dados de apoio e a prévia (e-mail, tabela ou mensagem); aprovar, editar antes, sempre aprovar este tipo ou recusar com motivo.

## Conceito

**Objetivo:** Quem aprova decide rápido e com segurança o que os agentes vão fazer em nome da empresa, sem abrir cinco telas.

**Padrões aplicados**

- Anatomia F · Mestre-detalhe: fila à esquerda, pedido à direita; a seleção fica no endereço (?id=)
- ApprovalRequest com impacto, risco e prévia exata do que vai sair
- Recusar exige motivo (volta para o agente como instrução)
- Por que pediu aprovação: a política aparece junto, com link para mudar
- Celular: a fila ocupa a tela e o pedido abre em tela cheia com Voltar

**Quando usar e o que adaptar**

- Aprovação de despesas, descontos comerciais, publicação de conteúdo
- Sem IA: troque 'agente' por 'solicitante' e mantenha a prévia do efeito

**Evite**

- Aprovar sem ver a prévia do que vai sair
- Recusar sem motivo (o agente repete o erro)
- Fila sem prazo: pedidos expiram e ninguém sabe

## Componentes usados

`ApprovalRequest`, `ApprovalState`, `Badge`, `Button`, `Empty`, `Modal`, `Page`, `PageHeading`, `PropertyList`, `Table`, `TableBody`, `TableCell`, `TableHead`, `TableHeader`, `TableRow`, `Tabs`, `TextareaField`, `notify`
