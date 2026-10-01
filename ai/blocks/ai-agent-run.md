# Execução de agente

- Arquivo: `src/blocks/ai-agent-run.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: IA
- Preview: showcase `#/frame/ai-agent-run` (`?theme=dark` para o escuro)

Detalhe de uma execução: trace em cascata com replay, passo selecionado com entrada e saída, ferramentas usadas, custo e tokens, saída para aprovar e tentar de novo.

## Conceito

**Objetivo:** Explicar uma execução do agente passo a passo para quem precisa auditar ou aprovar o resultado antes de usar.

**Padrões aplicados**

- Anatomia C · Registro: trilha + título fixos, trace em cascata no conteúdo
- Passo selecionado mostra entrada e saída lado a lado
- Custo, tokens e tempo sempre visíveis
- Saída que pede aprovação humana antes de agir; tentar de novo por passo

**Quando usar e o que adaptar**

- Logs de automação, jobs de integração, pipelines de dados
- Troque 'tokens' por 'registros processados' fora de IA

**Evite**

- Mostrar só o resultado final sem como chegou nele

## Componentes usados

`AgentTrace`, `AiBadge`, `Badge`, `Button`, `JsonView`, `Page`, `PageHeading`, `PropertyList`, `StatCell`, `StatGrid`, `SystemMessage`, `Tabs`, `TokenUsageMeter`, `ToolCall`, `ToolCallsSection`, `TraceStep`, `formatCurrency`, `formatDuration`, `formatNumber`, `notify`
