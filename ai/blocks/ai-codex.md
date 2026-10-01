# Agente de código (tarefas longas)

- Arquivo: `src/blocks/ai-codex.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: IA
- Preview: showcase `#/frame/ai-codex` (`?theme=dark` para o escuro)

Estilo Codex: sessões agrupadas por repositório, lista recolhível (⌘\\), conversa em fluxo com “Trabalhou por …”, histórico longo recolhido, resultados (commit, deploy, testes), permissão e modelo no campo.

## Conceito

**Objetivo:** Acompanhar um agente que trabalha por minutos em um repositório (corrige, testa, publica): ver o que ele fez, o resultado verificável e decidir o próximo passo sem se perder em conversas longas.

**Padrões aplicados**

- Anatomia Conversa (AgentAppLayout): trilho + lista por projeto recolhível (⌘\) + conversa; troca rápida de sessão quando a lista está fechada
- Lista “Por projeto”: pastas = repositórios, sessões aninhadas, “Mostrar mais”, ⋯ por projeto
- Execução como linha discreta (RunSummary divider): “Trabalhou por 1 min 1 s ›” abre os passos
- Histórico longo recolhido no topo (ThreadView collapseBefore): só o final importa
- Resultados verificáveis em lista (commit, deploy, testes) com links, não só texto
- Permissão sempre visível no campo; “Acesso total” em âmbar e com confirmação

**Quando usar e o que adaptar**

- Agentes de dados (consultas, notebooks): projetos viram bases; resultados viram tabelas e gráficos
- Operações (deploys, incidentes): resultados com status ok/falhou e link do painel
- Use “Sessões com artefatos” quando a entrega principal for um documento e não uma ação

**Evite**

- Esconder que o agente tem acesso total
- Mostrar o histórico inteiro sempre aberto
- Resultado sem evidência (hash, link, contagem de testes)

## Componentes usados

`AgentAppLayout`, `AgentComposer`, `AnswerCard`, `BottomNav`, `Disclaimer`, `IconRail`, `InputModal`, `ListToggle`, `MenuEntry`, `MessageActions`, `ModelEffort`, `ModelPicker`, `NavItem`, `PermissionMode`, `PermissionModeChip`, `ProductMark`, `RailItem`, `RunSummary`, `SessionQuickSwitcher`, `SessionSidebar`, `StepGroup`, `StepItem`, `ThreadHeader`, `ThreadView`, `Tooltip`, `UserBubble`, `VoiceModeButton`, `VoiceOverlay`, `WorkspaceSwitcher`, `notify`
