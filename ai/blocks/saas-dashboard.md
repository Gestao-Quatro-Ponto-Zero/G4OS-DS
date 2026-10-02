# Dashboard de produto SaaS

- Arquivo: `src/blocks/saas-dashboard.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: SaaS
- Preview: showcase `#/frame/saas-dashboard` (`?theme=dark` para o escuro)

KPIs com variação, visitantes com seletor de período, movimento de MRR, NPS e contas recentes que abrem a página da conta.

## Conceito

**Objetivo:** Mostrar a saúde do produto SaaS em uma olhada: receita, aquisição, retenção e satisfação.

**Padrões aplicados**

- Anatomia B · Painel: cabeçalho fixo com Exportar e Nova conta
- KPIs com variação e sparkline
- Visitantes com seletor de período; movimento de MRR; NPS
- Contas recentes abrem a página da conta

**Quando usar e o que adaptar**

- Painel de qualquer produto: troque os KPIs e as perguntas

**Evite**

- Mais de 5 KPIs no topo

## Componentes usados

`AreaChart`, `Badge`, `BarChart`, `Button`, `ChartCard`, `Column`, `DataTable`, `EntityMark`, `GridColumn`, `KpiCard`, `KpiGrid`, `NpsChart`, `Page`, `PageHeading`, `SegmentedControl`, `Tabs`, `downloadCsv`, `formatCurrency`, `formatNumber`, `gridToCsv`, `notify`
