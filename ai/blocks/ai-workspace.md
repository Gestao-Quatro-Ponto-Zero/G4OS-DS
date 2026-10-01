# Workspace de agente

- Arquivo: `src/blocks/ai-workspace.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: IA
- Preview: showcase `#/frame/ai-workspace` (`?theme=dark` para o escuro)

Conversa com o agente à esquerda e artefatos à direita (relatório, contexto, saída, planilha) em painel redimensionável; resposta com tempo e trace, cartões que abrem abas, composer com comandos e voz.

## Conceito

**Objetivo:** Análise feita pelo agente que gera entregáveis: a conversa explica, os artefatos (relatório, planilha, contexto) ficam ao lado para revisar e exportar.

**Padrões aplicados**

- Anatomia Conversa + painel: ResizableSplit com conversa à esquerda e ArtifactPanel à direita
- Resposta em fluxo com RunSummary (tempo, passos, ferramentas, custo) que abre o trace
- Artefatos são cidadãos de primeira classe: cartões na conversa abrem abas no painel
- Contexto explícito: o que o agente usou, com relevância e citações
- Composer com comandos (/relatório) e voz

**Quando usar e o que adaptar**

- Análises de receita, funil, churn, inadimplência
- Pesquisa de mercado e due diligence
- Relatórios para cliente: o relatório vira entregável exportável

**Evite**

- Esconder quanto tempo e quanto custou a execução
- Artefato que só existe dentro da conversa (sem aba e sem exportar)

## Componentes usados

`AgentComposer`, `AgentMessage`, `AgentTrace`, `ArtifactCard`, `ArtifactKind`, `ArtifactPanel`, `ArtifactTab`, `ComposerChip`, `ContextItem`, `ContextView`, `InsightCard`, `JsonView`, `KpiPair`, `LineChart`, `Menu`, `MetricBar`, `RankedList`, `ReportSection`, `ResizableSplit`, `RunSummary`, `SheetArtifact`, `formatCurrency`, `notify`
