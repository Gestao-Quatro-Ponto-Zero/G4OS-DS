# Agentes: construtor, propostas e aprovação

## Construtor de agente (`agent-builder.tsx`)

Três seções fixas, nessa ordem:

1. **Gatilhos** — quando o agente roda (`TriggerList`). Visibilidade explícita (“Visível só para você”).
2. **Propriedades** — com o que trabalha: ferramentas, entrada, saída, verificações de qualidade, skills, arquivos (`PropertyRow` + `ChipPicker`; “+ Adicionar” com submenus).
3. **Instruções** — o que faz (`AgentInstructions`, editor rico com “Melhorar”).

Ações no topo (`PublishBar`): Compartilhar · Testar · Publicar. Editar algo publicado muda o status para “Alterações não publicadas”. O teste roda na conversa ao lado, com `RunSummary`.

## Tarefas propostas (`tasks-ai.tsx`)

A IA sugere; a pessoa decide. Cada `TaskProposalCard` é editável (destino, título, sub-tarefas, projeto, status, prioridade, responsável, rótulos, estimativa) e só é criado no destino com **Aceitar**. “Aceitar todas”/“Recusar todas” sempre com desfazer. Mostre a origem (reunião, documento) ao lado.

## Pedido de aprovação (`ApprovalRequest`)

O agente pede permissão antes de uma ação com efeito externo. O cartão mostra o que vai acontecer (`preview`), quanto (`impact`) e as saídas.

- **Tom pelo risco.** Sem `tone`, a aparência vem do `risk`: `low` = info (azul), `medium` = warn (âmbar), `high` = bad (rosa). Use `tone` só quando o risco não diz tudo; `neutral` para pedidos rotineiros.
- **Diga o tipo do pedido.** `eyebrow` ("Comando no terminal") e `icon` trocam a sobrelinha e o ícone enquanto pende. Depois da decisão o cartão mostra o estado.
- **Corpo e ações próprios.** `children` entra entre o preview e o rodapé (detalhes, avisos, campos). `actions` substitui aprovar/sempre/editar/recusar; mantenha um primário.
- **Estados decididos.** `approved`, `always`, `rejected`, `expired` (venceu sem resposta) e `superseded` (um pedido mais novo tomou o lugar). Sem botões; o cartão vira registro. Os textos vêm de `labels` (padrão em pt-BR).
- **Histórico enxuto.** `compact` reduz um pedido decidido a uma linha (ícone, estado, título, impacto). Pedido pendente ignora `compact`.

## Regras gerais

- Sempre mostre o que o agente fez e quanto tempo levou.
- Ação que sai da empresa (e-mail, post, pagamento) passa por aprovação humana (`ApprovalRequest`).
- Toda decisão em massa tem desfazer.
