# Dashboards

Um dashboard responde **"como estamos e onde agir?"** em uma olhada. Não é um relatório nem um mural de gráficos.

## Estrutura

```
PageHeading "Início" / "Vendas"            [Período: 30 d | 90 d | 12 m]  [Exportar]
KpiGrid (3–5 KpiCard): número + delta + período (+ sparkline)
─────────────────────────────────────────────────────────────
ChartCard grande (tendência principal)       │ ChartCard (composição/ranking)
  AreaChart com comparação tracejada          │   BarList / DonutChart
─────────────────────────────────────────────────────────────
ListPanel "Precisa de você" (tone=attention) │ ChartCard funil / meta (GoalMeter)
ActivityFeed / Leaderboard / tabela curta com "Ver todos"
```

- Primeira dobra (1440 × 900): KPIs + o gráfico principal. O que pede ação logo depois.
- Grade de 12 colunas mental: 2/3 + 1/3 ou 1/2 + 1/2. Em tablet, uma coluna.
- Um seletor de período para a página inteira; se um card tiver período próprio, diga na descrição.

## KPIs

- **3 a 5.** Mais que isso, ninguém lê. Escolha os que mudam decisão.
- Cada KPI tem: rótulo, valor formatado, **delta com base explícita** ("vs. mês anterior"), e opcionalmente sparkline ou meta.
- `goodWhen="down"` para custo, churn, tempo de resposta, inadimplência, tempo de contratação.
- `href` leva ao detalhe (a lista filtrada que explica o número).
- Nada de número sem unidade, nada de % sem base.

## Gráficos

- Um gráfico por pergunta; o título do `ChartCard` é a pergunta.
- Tendência com volume → `AreaChart`; composição → `DonutChart`/`BarList`/`Treemap`; conversão → `FunnelChart`; meta → `GoalMeter`/`GaugeChart`/`BulletChart`. Ver [dados.md](../fundamentos/dados.md).
- Comparação com período anterior é tracejada em `chart-2`.

## Blocos de ação

- `ListPanel tone="attention"` com o que está atrasado/parado/em risco, cada linha levando ao registro.
- `ActivityFeed` para "o que mudou" (quem fez o quê).
- `Leaderboard` para rankings de pessoas/contas.
- Tabela curta (5 linhas) com "Ver todos" em vez de tabela inteira.

## Por tipo de app

| App | KPIs típicos | Gráfico principal | Ação |
| --- | --- | --- | --- |
| CRM | Receita fechada, pipeline aberto, taxa de conversão, ciclo médio, ticket médio | receita × meta (área + referência), funil por etapa | negócios parados > 14 d |
| ATS | Vagas abertas, candidatos ativos, tempo até contratação, aceite de proposta | funil de recrutamento, contratações/mês | vagas sem movimento, entrevistas sem feedback |
| ERP | Pedidos, faturamento, ruptura de estoque, prazo de entrega | pedidos por dia, top produtos (BarList) | itens abaixo do mínimo |
| Financeiro | Saldo, a receber, a pagar, inadimplência | fluxo de caixa (barras entradas/saídas + saldo), cascata do resultado | contas vencidas |
| SaaS | MRR, clientes ativos, churn, NPS | MRR (área), coorte de retenção (heatmap) | contas em risco |

## Nunca

- Gauge/velocímetro para número sem meta.
- Pizza com 10 fatias.
- Mesmo número em KPI e em card de gráfico lado a lado.
- Gráfico decorativo sem pergunta.
- Atualização automática que muda números enquanto a pessoa lê sem indicar ("Atualizado há 2 min" + botão).
