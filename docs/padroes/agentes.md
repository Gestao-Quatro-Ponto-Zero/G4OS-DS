# Agentes: construtor, propostas e aprovação

## Construtor de agente (`agent-builder.tsx`)

Três seções fixas, nessa ordem:

1. **Gatilhos** — quando o agente roda (`TriggerList`). Visibilidade explícita (“Visível só para você”).
2. **Propriedades** — com o que trabalha: ferramentas, entrada, saída, verificações de qualidade, skills, arquivos (`PropertyRow` + `ChipPicker`; “+ Adicionar” com submenus).
3. **Instruções** — o que faz (`AgentInstructions`, editor rico com “Melhorar”).

Ações no topo (`PublishBar`): Compartilhar · Testar · Publicar. Editar algo publicado muda o status para “Alterações não publicadas”. O teste roda na conversa ao lado, com `RunSummary`.

## Tarefas propostas (`tasks-ai.tsx`)

A IA sugere; a pessoa decide. Cada `TaskProposalCard` é editável (destino, título, sub-tarefas, projeto, status, prioridade, responsável, rótulos, estimativa) e só é criado no destino com **Aceitar**. “Aceitar todas”/“Recusar todas” sempre com desfazer. Mostre a origem (reunião, documento) ao lado.

## Regras gerais

- Sempre mostre o que o agente fez e quanto tempo levou.
- Ação que sai da empresa (e-mail, post, pagamento) passa por aprovação humana (`ApprovalRequest`).
- Toda decisão em massa tem desfazer.
