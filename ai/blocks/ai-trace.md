# Inspetor de execução

- Arquivo: `src/blocks/ai-trace.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: IA
- Preview: showcase `#/frame/ai-trace` (`?theme=dark` para o escuro)

Trace completo de uma execução em cascata com o passo selecionado ao lado: entrada e saída em JSON, latência, tokens, custo, erro com nova tentativa só daquele passo.

## Conceito

**Objetivo:** Investigar uma execução que falhou ou demorou: onde, por quê e quanto custou, para quem mantém agentes.

**Padrões aplicados**

- Anatomia C · Registro: cabeçalho fixo com trilha; trace + detalhe lado a lado (ResizableSplit)
- Cascata com latência por passo; passo com erro em destaque
- Entrada/saída em JSON, tokens e custo do passo
- Tentar de novo só o passo que falhou

**Quando usar e o que adaptar**

- Monitor de integrações, filas de processamento, ETL

**Evite**

- Logs em texto corrido sem estrutura por passo

## Componentes usados

`AgentPlan`, `AgentTrace`, `Badge`, `Button`, `JsonView`, `Page`, `PageHeading`, `PropertyList`, `ReportSection`, `ResizableSplit`, `StatCell`, `StatGrid`, `SystemMessage`, `TraceStep`, `formatCurrency`, `formatDuration`, `formatNumber`, `notify`
