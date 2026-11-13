# Execução de agente

- Arquivo: `src/blocks/ai-agent-run.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: IA
- Preview: showcase `#/frame/ai-agent-run` (`?theme=dark` para o escuro)

Detalhe de uma execução (?id=): trace em cascata com o passo selecionado, entrada e saída, ferramentas usadas, custo e tokens, saída para aprovar, executar de novo e 'O que você quer fazer agora?' navegável por teclado. Ao vivo (?estado=ao-vivo): AgentRunCard com passos chegando, portão de aprovação com diff e resultado.

## Conceito

**Objetivo:** Explicar uma execução do agente passo a passo para quem precisa auditar, aprovar o resultado ou corrigir o agente.

**Padrões aplicados**

- Anatomia C · Registro: trilha (Execuções › agente) + título fixos, trace em cascata no conteúdo
- Passo selecionado mostra entrada e saída lado a lado; falha com mensagem em linguagem de gente
- Custo, tokens e tempo sempre visíveis
- Executar de novo com useOperation (o botão informa enquanto roda)
- Fim da execução: 'O que você quer fazer agora?' com 3 opções numeradas (↑ ↓ Enter, 1–3, Esc) e campo livre
- Ao vivo (?estado=ao-vivo): AgentRunCard — passos chegam um a um (o atual brilha), o agente para num portão com o diff (Aprovar e aplicar / Devolver com comentário) e, ao concluir, os passos recolhem numa linha e aparece o resultado com as verificações

**Quando usar e o que adaptar**

- Logs de automação, jobs de integração, pipelines de dados
- Troque 'tokens' por 'registros processados' fora de IA

**Evite**

- Mostrar só o resultado final sem como chegou nele
- Terminar a execução sem próximo passo (o usuário volta para a lista sem saber o que fazer)
- Agente que escreve (lançamentos, arquivos, e-mails) sem parar para aprovação com o diff à vista

## Componentes usados

`AgentRunCard`, `AgentRunScript`, `AgentTrace`, `AiBadge`, `Badge`, `Button`, `CommandGroup`, `CommandInput`, `CommandItem`, `CommandList`, `CommandMenu`, `IconButton`, `JsonView`, `OperationButton`, `OperationFeedback`, `Page`, `PageHeading`, `PropertyList`, `StatCell`, `StatGrid`, `SystemMessage`, `Tabs`, `TokenUsageMeter`, `ToolCall`, `ToolCallsSection`, `TraceStep`, `formatCurrency`, `formatDate`, `formatDuration`, `formatNumber`, `notify`, `useOperation`
