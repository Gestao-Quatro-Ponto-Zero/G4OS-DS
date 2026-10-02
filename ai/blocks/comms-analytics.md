# Mural · alcance da comunicação

- Arquivo: `src/blocks/comms-analytics.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: Comunicação
- Preview: showcase `#/frame/comms-analytics` (`?theme=dark` para o escuro)

Painel de alcance: taxa de leitura contra a meta, tempo até a leitura, confirmações de leitura obrigatória, engajamento por canal, área e cidade, horário de leitura e comunicados com baixa leitura que pedem reforço.

## Conceito

**Objetivo:** Saber se a comunicação está chegando, em quem não chega e o que reforçar hoje.

**Padrões aplicados**

- Anatomia B · Painel: período e exportar no cabeçalho; 4 KPIs com base explícita
- “Precisa de você” antes dos gráficos: comunicados com leitura baixa ou confirmação atrasada, com ação de reforço
- Um gráfico por pergunta: leitura × meta, canal, área × cidade (matriz), tempo até ler, horário
- Tabela de comunicados ordenável no fim, linha abre o comunicado

**Quando usar e o que adaptar**

- Alcance de campanhas para clientes, adesão a treinamentos obrigatórios, leitura de políticas de compliance

**Evite**

- Contar entrega como leitura (e abertura como confirmação)
- Pintar de verde o que está bom: só o que pede atenção ganha cor

## Componentes usados

`Badge`, `BarChart`, `BarList`, `Button`, `ChartCard`, `Column`, `DataTable`, `HeatmapMatrix`, `KpiCard`, `KpiGrid`, `LineChart`, `ListPanel`, `MiniBarChart`, `OperationButton`, `Page`, `PageHeading`, `SegmentedControl`, `downloadCsv`, `formatDate`, `formatNumber`, `formatPercent`, `plural`, `useOperation`, `useSort`
