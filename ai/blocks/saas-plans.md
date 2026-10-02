# Planos e preços

- Arquivo: `src/blocks/saas-plans.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: SaaS
- Preview: showcase `#/frame/saas-plans` (`?theme=dark` para o escuro)

Catálogo de planos com preço mensal e anual por usuário, limites, assinantes e MRR por plano, comparação de limites e edição do plano em gaveta.

## Conceito

**Objetivo:** Manter o catálogo de planos coerente: quanto custa cada um, o que inclui e quantas contas dependem dele antes de mudar um preço.

**Padrões aplicados**

- Anatomia A · Lista: cabeçalho fixo; catálogo em cards e tabela de limites abaixo
- Alternador mensal/anual muda todos os preços de uma vez
- Cada plano mostra assinantes e MRR: o impacto aparece antes de editar
- Editar em Drawer com useOperation; preço novo vale para novas assinaturas

**Quando usar e o que adaptar**

- Tabelas de preço de serviço (ERP), pacotes de horas, planos de suporte

**Evite**

- Mudar preço sem mostrar quantas contas estão no plano
- Limite ilimitado escrito como número alto

## Componentes usados

`Badge`, `Button`, `Column`, `CurrencyField`, `DataTable`, `Drawer`, `Empty`, `FieldGrid`, `KpiCard`, `KpiGrid`, `NumberField`, `OperationButton`, `OperationFeedback`, `Page`, `PageHeading`, `SegmentedControl`, `Skeleton`, `Switch`, `TextareaField`, `formatCompact`, `formatCurrency`, `formatNumber`, `formatPercent`, `useOperation`
