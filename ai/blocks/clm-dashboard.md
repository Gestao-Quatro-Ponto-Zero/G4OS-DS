# Painel de contratos

- Arquivo: `src/blocks/clm-dashboard.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: Contratos
- Preview: showcase `#/frame/clm-dashboard` (`?theme=dark` para o escuro)

Valor sob contrato, janela de vencimentos (30/60/90 dias), renovações automáticas a decidir antes do aviso prévio, assinaturas paradas, obrigações atrasadas e a fila “Precisa de você”.

## Conceito

**Objetivo:** Mostrar ao Jurídico e a Suprimentos o que vence, o que renova sozinho e o que está parado esperando alguém, antes que o prazo de aviso prévio passe.

**Padrões aplicados**

- Anatomia B · Painel: cabeçalho fixo com horizonte à direita; KPIs, um gráfico por pergunta e filas de ação
- KPI com base explícita; obrigações atrasadas com goodWhen="down"
- Vencimentos por mês com alternância Valor/Quantidade (ChartCardTotals) e renovação automática separada da por aditivo
- “Precisa de você” antes dos detalhes: aprovações, assinaturas paradas e prazos de aviso prévio
- Cada linha abre o registro certo (contrato, fila de aprovação, obrigações)

**Quando usar e o que adaptar**

- Gestão de apólices (vencimento e renovação), licenças de software, imóveis locados
- Troque as janelas 30/60/90 pela política da empresa (ex.: 45/90/180 em locação)

**Evite**

- Mostrar só a data de fim: o que importa é o último dia para avisar que não renova
- Somar contratos encerrados no valor sob contrato

## Componentes usados

`Badge`, `BarChart`, `BarList`, `Button`, `ChartCard`, `ChartCardTotals`, `Empty`, `EntityMark`, `ErrorState`, `KpiCard`, `KpiGrid`, `ListPanel`, `ListRow`, `MiniBarChart`, `Page`, `PageHeading`, `SegmentedControl`, `Skeleton`, `formatCompact`, `formatCurrency`, `formatDate`, `formatNumber`, `plural`
