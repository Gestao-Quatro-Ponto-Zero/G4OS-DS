# Chat com histórico

- Arquivo: `src/blocks/ai-chat.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: IA
- Preview: showcase `#/frame/ai-chat` (`?theme=dark` para o escuro)

Conversa em página inteira: histórico por data com busca, estado vazio com sugestões, respostas com ferramentas e fontes, avisos do sistema e limite de uso com contagem.

## Conceito

**Objetivo:** Conversar com o assistente em página inteira, com histórico pesquisável, para quem usa a IA como ferramenta de trabalho diária.

**Padrões aplicados**

- Anatomia G · App de altura total: histórico à esquerda, thread rola, composer fixo
- Histórico agrupado por data com busca
- Estado vazio com sugestões; avisos do sistema e limite de uso com contagem
- Respostas com ferramentas e fontes

**Quando usar e o que adaptar**

- Suporte interno, base de conhecimento, copiloto de vendas

**Evite**

- Rolar a página inteira junto com a conversa (perde o composer)

## Componentes usados

`AiMark`, `AiSource`, `Button`, `ChatComposer`, `ChatMessage`, `ChatThread`, `CitationChip`, `ComposerAttachment`, `ComposerChip`, `LimitDialog`, `PromptSuggestion`, `PromptSuggestions`, `RateLimitNotice`, `SourceList`, `SystemMessage`, `ThinkingIndicator`, `TokenUsageMeter`, `ToolCall`, `ToolCallsSection`, `normalize`
