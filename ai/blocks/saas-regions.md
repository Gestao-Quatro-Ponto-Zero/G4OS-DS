# Receita por estado

- Arquivo: `src/blocks/saas-regions.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: SaaS
- Preview: showcase `#/frame/saas-regions` (`?theme=dark` para o escuro)

Mapa por UF com receita, crescimento ou penetração em degraus, lista ordenada ligada ao mapa, filtro por região e zoom com detalhe das cidades ao escolher um estado.

## Conceito

**Objetivo:** Ver onde a receita está concentrada e onde cresce, para decidir em que estados investir em vendas, parceiros e suporte local.

**Padrões aplicados**

- Anatomia B · Painel: cabeçalho fixo com filtro de região, um cartão principal
- Métrica no SegmentedControl do cartão; crescimento usa escala divergente (abaixo × acima de zero), não verde × vermelho
- Mapa nunca sozinho: lista ordenada ao lado, ligada pelo mesmo realce (hover numa acende na outra)
- Escolher um estado aproxima o mapa e abre o detalhe (cidades, clientes); Voltar ao Brasil devolve a visão inteira
- Sem dado em hachura com travessão, diferente de zero

**Quando usar e o que adaptar**

- Vendas por região de um ERP
- Candidatos por estado num ATS
- Inadimplência por UF no financeiro
- Outro país: passe regions e viewBox próprios

**Evite**

- Mapa sem a lista ordenada (estados grandes parecem mais importantes)
- Escala contínua sem degraus
- Pintar crescimento de verde e vermelho como se fosse bom × ruim

## Componentes usados

`Badge`, `BarList`, `BrRegion`, `BrUfId`, `Button`, `ChartCard`, `ChoroplethMap`, `ChoroplethScaleOptions`, `Empty`, `ErrorState`, `Page`, `PageHeading`, `RankedRegionList`, `SegmentedControl`, `Select`, `Skeleton`, `brRegions`, `brUfs`, `fitViewBox`, `formatCompact`, `formatCurrency`, `formatDelta`, `formatNumber`, `formatPercent`, `useLinkedHighlight`
