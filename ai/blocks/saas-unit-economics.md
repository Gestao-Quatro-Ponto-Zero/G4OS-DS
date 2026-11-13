# CAC e LTV por canal

- Arquivo: `src/blocks/saas-unit-economics.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: SaaS
- Preview: showcase `#/frame/saas-unit-economics` (`?theme=dark` para o escuro)

Dispersão conectada de CAC contra LTV mês a mês por canal de aquisição, com a linha de 3× e a zona saudável, cabeça que percorre o tempo e resumo por canal.

## Conceito

**Objetivo:** Ver se cada canal de aquisição continua pagando o próprio custo: onde o LTV/CAC caiu abaixo da meta de 3×, quando e por quê.

**Padrões aplicados**

- Anatomia B · Painel: cabeçalho fixo; um cartão-pergunta com o seletor de canal no action
- Células de número do mês em foco (mês, CAC, LTV, LTV/CAC com ponto + texto) acima do gráfico
- Dispersão conectada: um ponto por mês, setas de direção, cabeça no mês em foco, outros canais esmaecidos
- Linha y = 3·x tracejada e zona saudável em verde bem leve, com rótulo
- Controle de tempo embaixo (tocar/pausar); setas do teclado no gráfico também movem a cabeça
- Anotações nos meses em que algo mudou (campanha, plano anual)

**Quando usar e o que adaptar**

- Preço × volume por produto, custo por contratação × tempo até contratar, ticket × churn por plano
- Qualquer par de medidas em que a direção no tempo importa mais que o ponto isolado

**Evite**

- Mais de três séries visíveis ao mesmo tempo: o caminho vira novelo
- Usar com poucos meses (menos de 6): uma linha simples mostra melhor
- Pintar o caminho de verde ou vermelho: a zona e o status com palavra já dizem se está saudável

## Componentes usados

`Button`, `ChartCard`, `ConnectedScatter`, `ConnectedScatterSeries`, `DataTable`, `Dot`, `Empty`, `ErrorState`, `GridColumn`, `Page`, `PageHeading`, `SegmentedControl`, `Skeleton`, `StatCell`, `StatGrid`, `downloadCsv`, `formatCurrency`, `formatNumber`, `gridToCsv`, `notify`
