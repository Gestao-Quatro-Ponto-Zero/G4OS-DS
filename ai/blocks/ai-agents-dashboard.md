# Painel da frota de agentes

- Arquivo: `src/blocks/ai-agents-dashboard.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: IA
- Preview: showcase `#/frame/ai-agents-dashboard` (`?theme=dark` para o escuro)

Saúde de todos os agentes num olhar: execuções, sucesso, custo e latência p95 com base explícita, execuções × falhas por dia, quem mais roda, custo por área, créditos do mês, 'Precisa de você' clicável e incidentes recentes.

## Conceito

**Objetivo:** Quem responde pela operação de IA da empresa vê em segundos se a frota está saudável, quanto custa e o que precisa de uma pessoa agora.

**Padrões aplicados**

- Anatomia B · Painel: cabeçalho fixo com período à direita
- 5 KPIs com delta e base explícita; custo e latência com goodWhen='down'
- Gráfico principal responde uma pergunta (execuções × falhas); MiniBarChart para custo por área
- 'Precisa de você' antes do detalhe: aprovações, agentes com erro, orçamento perto do limite, regressão
- Incidentes recentes abrem a execução que falhou

**Quando usar e o que adaptar**

- Painel de automações/RPA: troque tokens e custo de modelo por horas de robô
- Painel de integrações: execuções viram sincronizações; falhas por conector

**Evite**

- Mais de 5 KPIs no topo
- Falhas só como número, sem levar à execução
- Custo sem orçamento ao lado (ninguém sabe se é muito)

## Componentes usados

`BarChart`, `BarList`, `Button`, `ChartCard`, `KpiCard`, `KpiGrid`, `ListPanel`, `ListRow`, `Meter`, `MiniBarChart`, `Page`, `PageHeading`, `SegmentedControl`, `formatCurrency`, `formatDuration`, `formatNumber`, `formatPercent`
