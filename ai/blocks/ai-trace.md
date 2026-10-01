# Inspetor de execução

- Arquivo: `src/blocks/ai-trace.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: IA
- Preview: showcase `#/frame/ai-trace` (`?theme=dark` para o escuro)

Trace completo de uma execução em cascata com o passo selecionado ao lado: entrada e saída em JSON, latência, tokens, custo, erro com nova tentativa só daquele passo.

## Componentes usados

`AgentPlan`, `AgentTrace`, `Badge`, `Button`, `JsonView`, `Page`, `PageHeading`, `PropertyList`, `ReportSection`, `ResizableSplit`, `StatCell`, `StatGrid`, `SystemMessage`, `TraceStep`, `formatCurrency`, `formatDuration`, `formatNumber`, `notify`
