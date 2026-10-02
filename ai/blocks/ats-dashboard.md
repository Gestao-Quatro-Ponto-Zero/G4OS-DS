# Painel de recrutamento

- Arquivo: `src/blocks/ats-dashboard.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: ATS
- Preview: showcase `#/frame/ats-dashboard` (`?theme=dark` para o escuro)

Contratações contra a meta, tempo até contratar por área contra o SLA, funil, aceite de propostas, qualidade por origem e o que pede ação hoje (entrevistas e vagas fora do SLA).

## Conceito

**Objetivo:** Mostrar ao time de recrutamento se as contratações estão no ritmo e o que pede ação hoje.

**Padrões aplicados**

- Anatomia B · Painel: cabeçalho fixo com período, KPIs no topo
- Um gráfico por pergunta: meta, tempo × SLA, funil, aceite, origem
- “Precisa de você” antes dos detalhes: avaliações pendentes, propostas e requisições para aprovar, cada linha abre o registro
- KPIs abrem o detalhe (relatórios, propostas)

**Quando usar e o que adaptar**

- Painel de vendas, operações ou atendimento: troque as perguntas e as filas

**Evite**

- Gráficos sem período ou sem meta de referência

## Componentes usados

`AreaChart`, `Avatar`, `Button`, `ChartCard`, `Column`, `DataTable`, `DonutChart`, `DumbbellChart`, `Empty`, `ErrorState`, `FunnelChart`, `KpiCard`, `KpiGrid`, `ListPanel`, `ListRow`, `Page`, `PageHeading`, `SegmentedControl`, `Skeleton`, `formatCurrency`, `formatNumber`, `formatPercent`
