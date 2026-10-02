# Conversa com aprovação

- Arquivo: `src/blocks/ai-conversation.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: IA
- Preview: showcase `#/frame/ai-conversation` (`?theme=dark` para o escuro)

Conversa longa com raciocínio recolhível, plano, ferramentas, fontes citadas, artefato e um pedido de aprovação antes de enviar e-mails (humano no controle).

## Conceito

**Objetivo:** Mostrar uma conversa longa em que o agente pensa, planeja, usa ferramentas e pede aprovação antes de uma ação irreversível.

**Padrões aplicados**

- Anatomia G · App de altura total: só a thread rola, composer fixo
- Raciocínio e plano recolhíveis: visíveis, mas sem poluir
- Pedido de aprovação humana antes de agir (enviar e-mails)
- Fontes citadas e artefato inline

**Quando usar e o que adaptar**

- Qualquer agente que mexe em dados de clientes (cobrança, CRM, RH)

**Evite**

- Esconder o que o agente fez; executar ação externa sem aprovação

## Componentes usados

`AgentComposer`, `AgentMessage`, `AgentPlan`, `AiSource`, `ApprovalRequest`, `ApprovalState`, `ArtifactCard`, `Button`, `CitationChip`, `Modal`, `ReasoningBlock`, `RunSummary`, `SourceList`, `SystemMessage`, `TextField`, `TextareaField`, `ToolCall`, `ToolCallsSection`, `formatCurrency`, `notify`
