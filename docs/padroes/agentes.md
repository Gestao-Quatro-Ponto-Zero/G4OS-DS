# Agentes: construtor, propostas, resumo e aprovação

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

## Resumo do período (`catch-up.tsx`)

"Enquanto você estava fora": a IA lê as fontes de um período e devolve linhas curtas em quatro seções fixas, nesta ordem. Seção vazia não aparece.

| Seção | O que entra | Ação da linha |
| --- | --- | --- |
| **Precisa de você** | Alguém espera a pessoa; um prazo chega | A oferta da IA ("Posso responder à Ana"): `action` com o primário da linha |
| **Decisões tomadas** | Algo foi decidido sem ela | Abrir |
| **Entregue** | Trabalho concluído (PR, tarefa, entrega de um agente) | Abrir |
| **Para saber** | Contexto que não pede nada | Abrir |

- **Uma frase por linha**, com onde (`context`), quando (`when`) e até três pessoas. A fonte vem antes da frase para o leitor de tela.
- **Precisa de você é onde o resumo encontra as propostas da IA.** A linha diz o que espera a pessoa; a oferta, logo abaixo, diz o que a IA faz e leva o único primário da linha. Nunca proponha trabalho em Decisões, Entregue ou Para saber.
- **As fontes aparecem antes do resumo** (`CatchUpSources`), com a contagem do período e o estado de leitura de cada uma: o número explica o tamanho do resumo.
- **Reserve a estrutura enquanto o resumo chega.** `CatchUpRowSkeleton` inclui o texto e os metadados. Use `withAction` quando a linha também terá oferta e botão para reduzir deslocamentos de conteúdo.
- **Lido recolhe a linha** e o foco vai para a próxima; "Marcar tudo como lido" fecha com `CatchUpDone`. As ações ficam visíveis também no celular.
- **Período** em `SegmentedControl` (Hoje · 3 dias · Semana). Trocar o período com um resumo aberto refaz a leitura e filtra os itens pelo início do período.
- **Interromper mantém o resultado parcial.** Mostre quais fontes terminaram e ofereça refazer o resumo. `CatchUpDone` só aparece depois de concluir a leitura ou marcar todos os itens como lidos.
- **Falha de fonte mantém o resumo parcial**, mesmo após ler todos os itens disponíveis. Ofereça tentar de novo antes de indicar que está tudo em dia.
- **Reiniciar cancela as ações pendentes das linhas anteriores.** Uma animação de saída não pode marcar itens do novo resumo como lidos.

## Regras gerais

- Sempre mostre o que o agente fez e quanto tempo levou.
- Ação que sai da empresa (e-mail, post, pagamento) passa por aprovação humana (`ApprovalRequest`).
- Toda decisão em massa tem desfazer.

## Rosto do agente

`AgentOrb` é o avatar de um agente: um rosto gerado a partir de uma semente estável (`seed`, o id do agente), sem upload de imagem. `expression` mostra o que ele está fazendo (`thinking`, `working`, `reading`, `waiting`, `proud`…) e `badge` a ferramenta em uso. `shape` e `palette` são a silhueta e a cor que a pessoa escolheu ao criar o agente. `AgentOrbStack` mostra quem participa de uma conversa ou de um time.

- Use onde o agente aparece como alguém (cabeçalho da conversa, lista de agentes, menção). A marca genérica de IA continua sendo `AiMark`.
- O rosto reforça, não substitui: nome e estado ficam em texto ao lado.
- A expressão segue o estado real da execução. Em lista longa, `motion="none"` nos que não estão executando.
- As cores são identidade do agente (como o `tint` de `Avatar`): iguais nos dois temas, fora dos tokens semânticos.

## Código e diff na resposta

Todo texto que a pessoa vai copiar vai num `CodeBlock` (linguagem ou nome do arquivo no cabeçalho, copiar, altura limitada com "Mostrar tudo"). Mudança em arquivo, texto ou configuração vai num `DiffView`, que recebe um diff unificado e marca as palavras que mudaram. O realce do DS é mínimo e sem dependência; realce por gramática é opcional e do app, passado em `children`.
