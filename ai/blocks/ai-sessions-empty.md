# Nova sessão do G4 OS

- Arquivo: `src/blocks/ai-sessions-empty.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: IA
- Preview: showcase `#/frame/ai-sessions-empty` (`?theme=dark` para o escuro)

Início de uma sessão: saudação, campo com agentes e ferramentas, tarefas sugeridas, sessões em andamento e arquivos recentes. Enviar abre a sessão já trabalhando.

## Conceito

**Objetivo:** Primeira tela de uma sessão: ajudar a pessoa a começar rápido, com sugestões do que o agente sabe fazer e o que já está em andamento.

**Padrões aplicados**

- Estado vazio produtivo: saudação + composer + tarefas sugeridas (nunca uma tela em branco)
- Momento de marca possível: a saudação pode usar BrandPanel
- Atalhos para retomar: sessões em andamento e arquivos recentes
- Ferramentas conectadas com aviso de reconexão quando algo falha

**Quando usar e o que adaptar**

- Home de qualquer copiloto (CRM, ATS, ERP): troque as sugestões pelas tarefas mais comuns do time
- Onboarding de agente novo: sugestões viram um tour guiado

**Evite**

- Mais de 4 sugestões
- Sugestões genéricas que não usam os dados do cliente

## Componentes usados

`ComposerChip`, `Disclaimer`, `FileCard`, `Page`, `SessionComposer`, `SessionStatusChip`, `SlashCommand`, `ToolsBar`, `VoiceModeButton`, `notify`
