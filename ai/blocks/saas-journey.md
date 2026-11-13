# Jornada até o plano pago

- Arquivo: `src/blocks/saas-journey.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: SaaS
- Preview: showcase `#/frame/saas-journey` (`?theme=dark` para o escuro)

Sankey da visita ao plano pago com as perdas de cada etapa, troca de canal que transforma os fluxos, nó selecionável que traça o caminho e painel com conversão, maiores perdas e divisão do plano.

## Conceito

**Objetivo:** Ver onde as pessoas saem do caminho até o plano pago e comparar os canais de aquisição.

**Padrões aplicados**

- Anatomia B · Painel: cabeçalho com canal, gráfico principal e painel lateral (empilha no celular)
- Sankey com rótulos acima do nó (valor · % das visitas) e etapas embaixo
- Selecionar um nó traça o que chega e o que sai dele; o painel mostra a conversão
- No celular o gráfico rola dentro do próprio contêiner

**Quando usar e o que adaptar**

- Funil de recrutamento com desistências, jornada de compra no e-commerce, triagem de chamados

**Evite**

- Mais de 5 etapas ou 20 nós
- Perda sem nome ("Outros")
- Sankey quando só importa a conversão total (use FunnelChart)

## Componentes usados

`Button`, `ChartCard`, `Empty`, `ErrorState`, `Page`, `PageHeading`, `SankeyChart`, `SankeyLink`, `SankeyNode`, `SegmentedControl`, `Skeleton`, `formatNumber`, `formatPercent`
