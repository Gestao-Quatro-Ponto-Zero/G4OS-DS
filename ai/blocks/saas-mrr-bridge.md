# Movimento de MRR

- Arquivo: `src/blocks/saas-mrr-bridge.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: SaaS
- Preview: showcase `#/frame/saas-mrr-bridge` (`?theme=dark` para o escuro)

Ponte de MRR do início ao fim do período (novos, expansão, reativação, contração, cancelamento) com eixo truncado, troca de período que transforma as barras e a lista de contas por trás de cada movimento.

## Conceito

**Objetivo:** Explicar por que o MRR mudou no período e chegar às contas que causaram cada movimento.

**Padrões aplicados**

- Anatomia B · Painel: cabeçalho com período, KPIs, um gráfico principal
- Cascata com eixo truncado (exceção documentada), conectores e valores nas barras
- Barra selecionável abre a lista de contas daquele movimento (padrão: Novos)
- Unidade alternável: R$ ou % do MRR de início

**Quando usar e o que adaptar**

- Ponte de caixa, variação de margem, carteira de contratos (início → fim)

**Evite**

- Eixo truncado sem a marca de quebra
- Cascata com mais de 8 barras
- Movimento sem as contas que o explicam

## Componentes usados

`Button`, `ChartCard`, `Empty`, `ErrorState`, `KpiCard`, `KpiGrid`, `Page`, `PageHeading`, `SegmentedControl`, `Skeleton`, `WaterfallChart`, `WaterfallStep`, `formatCurrency`, `formatNumber`, `formatPercent`
