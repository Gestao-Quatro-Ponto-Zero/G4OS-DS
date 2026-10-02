# Sessões do G4 OS (app agêntico)

- Arquivo: `src/blocks/ai-sessions.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: IA
- Preview: showcase `#/frame/ai-sessions` (`?theme=dark` para o escuro)

App desktop de sessões com agente: lista com status ao vivo, conversa com passos recolhíveis, respostas copiáveis e ramificáveis, ferramentas conectadas, painel de informações e modo voz.

## Conceito

**Objetivo:** Central de trabalho com o agente para quem delega várias tarefas por dia: ver o que está rodando, retomar conversas e auditar o que o agente fez.

**Padrões aplicados**

- Anatomia Conversa: app em altura total, sem rolagem de página; só o histórico rola e o composer fica fixo
- Lista rica: status ao vivo (Trabalhando, Resposta pronta, Falhou) e etiquetas sempre visíveis
- Respostas em cartão com Copiar · Markdown · ramificar: toda saída é reaproveitável
- Passos recolhíveis (StepGroup): o agente mostra o que fez sem poluir a leitura
- Painel de informações separado (modo da sessão, nome, etiquetas, notas)
- Lista recolhível (ListToggle no cabeçalho da conversa, ⌘\, lembrada entre visitas); recolhida, a troca rápida de sessão fica no cabeçalho
- Agrupar por data ou por projeto (ícone no cabeçalho da lista): pastas recolhíveis, “Mostrar mais” e ⋯ por projeto

**Quando usar e o que adaptar**

- Assistentes internos (G4 OS, copiloto de CRM/ERP): troque agentes e ferramentas conectadas
- Suporte com IA: a lista vira fila de atendimentos, o status vira SLA
- Para leitura mais calma, use a variação Sessões com artefatos (lista clean + respostas em fluxo)

**Evite**

- Esconder o status da sessão na lista
- Respostas sem ação de copiar ou ramificar
- Painel de informações aberto por padrão no celular
- Recolher a lista sem deixar um jeito visível de trocar de sessão

## Componentes usados

`AnswerCard`, `ComposerChip`, `Disclaimer`, `InputModal`, `ListToggle`, `MenuEntry`, `MessageActions`, `MinimapItem`, `ResizableSplit`, `SessionComposer`, `SessionHeader`, `SessionInfoPanel`, `SessionQuickSwitcher`, `SessionSidebar`, `SlashCommand`, `StepGroup`, `ThreadMinimap`, `UserBubble`, `VoiceModeButton`, `VoiceOverlay`, `WorkspaceSwitcher`, `notify`
