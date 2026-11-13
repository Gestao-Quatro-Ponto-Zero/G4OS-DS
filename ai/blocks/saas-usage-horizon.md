# Uso por cidade contra a base

- Arquivo: `src/blocks/saas-usage-horizon.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: SaaS
- Preview: showcase `#/frame/saas-usage-horizon` (`?theme=dark` para o escuro)

Horizon de 14 cidades: sessões diárias de junho a setembro contra a média de maio, com cruz sincronizada, ordenação por nome, pico ou último dia e número de faixas ajustável.

## Conceito

**Objetivo:** Achar, entre muitas cidades, onde o uso se afastou da base (para cima ou para baixo), quando começou e se ainda dura.

**Padrões aplicados**

- Anatomia B · Painel: cabeçalho fixo, faixa de KPIs do último dia e um cartão-pergunta
- Horizon: uma linha baixa por cidade dobrada em faixas; acima da base em chart-pos, abaixo em chart-neg
- Cruz sincronizada em todas as linhas (ponteiro, toque ou setas) e valor do dia à direita de cada linha
- Ordenar (Nome, Pico, Último) e Faixas (1–4) como SegmentedControl; região como filtro
- Legenda que explica a leitura: tamanho da faixa e 'cor mais forte = mais longe da base'

**Quando usar e o que adaptar**

- Pedidos por loja, tickets por fila, latência por serviço, vendas por vendedor contra a própria meta
- Qualquer conjunto de 8 a 20 séries diárias comparadas com a própria base

**Evite**

- Usar com menos de 6 séries: um LineChart com as linhas sobrepostas lê melhor
- Comparar valores absolutos entre cidades: o horizon mostra desvio relativo à base de cada uma
- Ler cor como bom ou ruim: azul é acima, laranja é abaixo

## Componentes usados

`Button`, `ChartCard`, `Empty`, `ErrorState`, `HorizonChart`, `HorizonSeries`, `KpiCard`, `KpiGrid`, `Page`, `PageHeading`, `SegmentedControl`, `Select`, `Skeleton`, `formatDelta`, `formatNumber`
