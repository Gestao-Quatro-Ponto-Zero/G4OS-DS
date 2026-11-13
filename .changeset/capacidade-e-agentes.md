---
"@g4ai/ds": minor
---

Armazenamento com varredura, tarefas delegadas a agentes e atividade de agente por fases.

- **Capacidade**: `CapacityBar` (barra segmentada com varredura, textura sutil e segmentos navegáveis por teclado), `CapacityLegend` (ligada à barra) e `CapacityBreakdown` (total animado, status ao vivo, recomendações de limpeza com `ConfirmDialog` no irreversível e Desfazer no reversível); `formatStorage` (base 1000). Bloco novo `settings-storage`.
- **Tarefas delegadas**: `DelegableTaskList` (seleção múltipla por clique, arrasto, Shift e teclado; barra "Delegar"), `AgentQueue` (status ao vivo por tarefa), `DelegationPill`, `TaskResultCard` (passos, resumo que vira lista em cartão estreito, arquivo com "Abrir em", aprovar ou pedir ajuste), `describeTaskDue` e `useDelegationDemo`. Bloco novo `ai-delegate` (Assistente → Tarefas).
- **Atividade do agente**: `AgentActivityCard` (fases com cor e palavra, plano, contexto por fase com busca, ideias, escrita e revisão em diff, ferramentas, modelo, tokens, custo e tempo, Pausar e Parar), `AgentPhaseBadge`, `AgentMark`, `useAgentActivityDemo`. Usado no bloco `ai-codex`.
