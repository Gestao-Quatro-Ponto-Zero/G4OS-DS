# Tarefas da semana

- Arquivo: `src/blocks/ai-delegate.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: IA
- Preview: showcase `#/frame/ai-delegate` (`?theme=dark` para o escuro)

A lista da semana de uma gestora: marque várias tarefas (clique, arraste ou Shift), delegue aos agentes e acompanhe ao vivo. Pílula com quem está trabalhando, painel de agentes com o passo atual, pedido de aprovação antes de pagar, conclusões uma a uma e o resultado em cartão com tabela e planilha. Cinco estados (?estado=).

## Conceito

**Objetivo:** Tirar da mão o que um agente resolve sozinho sem perder o controle: ver quem está fazendo o quê, decidir o que mexe em dinheiro e receber a entrega pronta para conferir.

**Padrões aplicados**

- reading
- Esta semana
- DelegableTaskList: seleção múltipla (clique, arrasto, Shift, teclado) e barra flutuante com Delegar (n) e o agente (Automático ou um nome)
- DelegationPill no topo: rostos empilhados + frase (2 agentes trabalhando · 1 aguardando você · Financeiro respondeu ✓); no celular abre o painel em folha
- AgentQueue: uma linha por tarefa em curso com o passo ao vivo (aria-live); Parar e Ver detalhes no ⋯; falha com Tentar de novo
- O que mexe em dinheiro trava em Aguardando você e vira ApprovalRequest com o valor (R$ 842,30) antes de pagar
- Concluída: check, riscado e sai da lista; a entrega abre como TaskResultCard (Trabalhou por ›, tabela-resumo, planilha com Abrir em, Aprovar/Pedir ajuste)
- Estados: carregando (forma da lista), vazio (Criar tarefa), erro de um agente (linha com falha e Tentar de novo). Sem estado de filtro: a tela não filtra

**Quando usar e o que adaptar**

- Gestão pessoal, backoffice financeiro, operação de compras, assistente de agenda: troque tarefas, agentes e roteiros
- Ligue useDelegationDemo ao seu orquestrador: status e activity vêm do servidor; o resto da tela não muda

**Evite**

- Delegar tarefa sem dono ou sem prazo (o agente não sabe quando é tarde)
- Agente pagar, enviar ou cancelar sem aprovação explícita
- Status só por cor ou só pelo ícone: sempre com palavra
- Contador de total na pílula: ela diz o que está acontecendo, não quantas tarefas existem

## Componentes usados

`AgentQueue`, `AgentRef`, `ApprovalRequest`, `Button`, `DelegableTask`, `DelegableTaskList`, `DelegationDemoStep`, `DelegationPill`, `Empty`, `Page`, `PageHeading`, `Sheet`, `Skeleton`, `TaskResultCard`, `formatCurrency`, `formatNumber`, `notify`, `useDelegationDemo`, `useReducedMotion`
