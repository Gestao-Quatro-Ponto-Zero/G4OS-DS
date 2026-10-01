# DRE gerencial

- Arquivo: `src/blocks/fin-dre.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: Financeiro
- Preview: showcase `#/frame/fin-dre` (`?theme=dark` para o escuro)

Demonstrativo de resultado com grupos expansíveis, realizado × orçado com variação favorável/desfavorável, cascata da receita ao lucro, margens contra a meta e receita × margem no semestre.

## Conceito

**Objetivo:** Explicar o resultado do mês: da receita ao lucro, contra o orçado.

**Padrões aplicados**

- Anatomia B · Painel com tabela hierárquica: grupos expansíveis
- Realizado × orçado com variação favorável/desfavorável
- Cascata da receita ao lucro; margens contra a meta

**Quando usar e o que adaptar**

- Relatório de unidade de negócio, P&L de produto

**Evite**

- Tabela plana sem grupos (impossível de ler)

## Componentes usados

`BulletChart`, `Button`, `ChartCard`, `ComboChart`, `Delta`, `Page`, `PageHeading`, `SegmentedControl`, `WaterfallChart`, `formatCurrency`, `formatPercent`, `notify`
