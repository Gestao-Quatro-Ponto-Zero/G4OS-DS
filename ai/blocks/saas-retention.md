# Retenção por coorte

- Arquivo: `src/blocks/saas-retention.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: SaaS
- Preview: showcase `#/frame/saas-retention` (`?theme=dark` para o escuro)

Triângulo de coortes com escala em degraus e legenda ligada, linha de média, curvas de retenção por coorte e recorte por segmento (self-service × vendas).

## Conceito

**Objetivo:** Saber se as coortes novas retêm melhor que as antigas e em que mês a perda se estabiliza.

**Padrões aplicados**

- Anatomia B · Painel: cabeçalho com segmento, KPIs, um gráfico principal
- Mapa de calor em triângulo (null = mês ainda não alcançado) com tamanho da coorte e linha de média
- Escala em degraus com legenda que destaca as células da faixa
- Mesma pergunta em curvas: coortes recentes mais escuras, média em destaque

**Quando usar e o que adaptar**

- Retenção de clientes no varejo, permanência de colaboradores (ATS), recompra no e-commerce

**Evite**

- Coorte sem o tamanho ao lado
- Escala contínua com dezenas de tons
- Comparar coortes sem o mesmo mês desde o início

## Componentes usados

`Button`, `ChartCard`, `Delta`, `Empty`, `ErrorState`, `HeatmapMatrix`, `KpiCard`, `KpiGrid`, `Page`, `PageHeading`, `RetentionCurves`, `SegmentedControl`, `Skeleton`, `formatNumber`, `formatPercent`
