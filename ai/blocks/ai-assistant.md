# Assistente sobre a tela

- Arquivo: `src/blocks/ai-assistant.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: IA
- Preview: showcase `#/frame/ai-assistant` (`?theme=dark` para o escuro)

Painel Ask AI ao lado de uma tela de CRM: sugestões, resposta com ferramentas usadas e fontes citadas, streaming e parar. A tela continua usável.

## Conceito

**Objetivo:** Pedir ajuda à IA sobre a tela que já está aberta (aqui, o CRM) sem perder o contexto nem a tela.

**Padrões aplicados**

- Painel lateral de IA ao lado da tela: a tela continua usável
- Respostas com ferramentas usadas e fontes citadas
- Streaming com Parar; sugestões de pergunta no início
- No celular o painel abre fechado e ocupa a tela quando aberto

**Quando usar e o que adaptar**

- Qualquer tela de lista ou registro (ERP, ATS, financeiro): troque as sugestões pelo contexto da tela

**Evite**

- Modal de IA que cobre a tela que a pessoa quer analisar

## Componentes usados

`AiBadge`, `AiSource`, `AskAILauncher`, `AskAIPanel`, `Badge`, `ChatComposer`, `ChatMessage`, `CitationChip`, `Column`, `ComposerChip`, `DataTable`, `EntityMark`, `KpiCard`, `KpiGrid`, `Page`, `PageHeading`, `PromptSuggestion`, `PromptSuggestions`, `SourceList`, `SystemMessage`, `ThinkingIndicator`, `ToolCall`, `ToolCallsSection`, `formatCurrency`
