# Sessões com artefatos

- Arquivo: `src/blocks/ai-sessions-artifacts.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: IA
- Preview: showcase `#/frame/ai-sessions-artifacts` (`?theme=dark` para o escuro)

Lista de sessões enxuta + conversa em fluxo (status da execução, passos recolhíveis, artefatos que abrem em abas) + painel de artefatos e detalhes. Montada com AgentAppLayout, ThreadHeader e ThreadView.

## Conceito

**Objetivo:** Versão calma das sessões do G4 OS: mantém a lista de sessões, mas a leitura é em fluxo e as entregas viram artefatos no painel lateral.

**Padrões aplicados**

- AgentAppLayout: trilho + lista recolhível (botão no cabeçalho da conversa, ⌘\) + conversa + painel (⌘.); lista recolhida = troca rápida de sessão
- Lista clean: uma linha por sessão (título + glifo de status + horário), agrupada por data ou por projeto pelo ícone do cabeçalho
- Respostas em fluxo com “Trabalhou por …” (RunSummary divider): os passos abrem sob demanda
- Histórico longo recolhido no topo (ThreadView collapseBefore)
- Campo enxuto: + (anexos e ferramentas) · permissão … agente/modelo · ditar · enviar; voz no botão redondo fora do campo
- Permissão sempre visível; “Acesso total” em âmbar e com confirmação
- Painel com abas que viram ícones quando falta espaço; a aba ativa fica sempre inteira
- Celular: lista → conversa em tela cheia → painel como folha

**Quando usar e o que adaptar**

- Qualquer app de agente com histórico + entregáveis
- Use a lista rica (Sessões do G4 OS) quando etiquetas e status detalhados importam mais que a leitura
- Para agentes de código (commit, deploy), veja “Agente de código (tarefas longas)”

**Evite**

- Misturar respostas em cartão e em fluxo na mesma tela
- Abrir o painel sem um artefato para mostrar
- Mais de ~5 controles na linha do campo ou chips quebrando texto
- Segunda linha de etiquetas em cada sessão da lista clean

## Componentes usados

`AgentAppLayout`, `AgentComposer`, `AnswerCard`, `ArtifactCard`, `ArtifactPanel`, `ArtifactTab`, `BarChart`, `BarList`, `BottomNav`, `ComposerChip`, `ContextItem`, `ContextView`, `Disclaimer`, `InputModal`, `InsightCard`, `ListToggle`, `MenuEntry`, `MessageActions`, `MinimapItem`, `ModelEffort`, `ModelPicker`, `PermissionMode`, `PermissionModeChip`, `PromptSuggestions`, `ReportSection`, `RunStatus`, `RunSummary`, `SessionDetails`, `SessionQuickSwitcher`, `SessionSidebar`, `SheetArtifact`, `SlashCommand`, `StepGroup`, `StepItem`, `ThreadHeader`, `ThreadView`, `UserBubble`, `VoiceModeButton`, `VoiceOverlay`, `WorkspaceSwitcher`, `formatCurrency`, `formatNumber`, `notify`
