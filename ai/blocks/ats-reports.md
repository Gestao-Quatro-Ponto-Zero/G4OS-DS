# Relatórios de recrutamento

- Arquivo: `src/blocks/ats-reports.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: ATS
- Preview: showcase `#/frame/ats-reports` (`?theme=dark` para o escuro)

Funil de contratação com conversão entre etapas, qualidade e custo por origem, tempo para contratar por área contra o SLA, tempo por etapa e motivos de recusa de proposta. Período no cabeçalho e exportação em CSV.

## Conceito

**Objetivo:** Explicar onde o processo seletivo perde tempo e candidatos, e quais origens valem o investimento.

**Padrões aplicados**

- Anatomia B · Painel: cabeçalho fixo com período à direita; exportar como ação secundária
- Um gráfico por pergunta: funil, tempo × SLA, tempo por etapa, recusas (Pareto), origem
- Tabela de origens com conversão, retenção e custo (o detalhe acionável no fim)
- Drill-down a partir dos KPIs do painel de recrutamento

**Quando usar e o que adaptar**

- Relatório comercial (funil e origem de leads), relatório de atendimento (tempo por etapa)

**Evite**

- Gráfico sem pergunta no título ou sem referência (meta, SLA)
- Exportar como ação principal da tela

## Componentes usados

`BarChart`, `Button`, `ChartCard`, `Column`, `DataTable`, `DumbbellChart`, `Empty`, `ErrorState`, `FunnelChart`, `KpiCard`, `KpiGrid`, `Page`, `PageHeading`, `ParetoChart`, `SegmentedControl`, `Skeleton`, `downloadCsv`, `formatCurrency`, `formatNumber`, `formatPercent`, `notify`
