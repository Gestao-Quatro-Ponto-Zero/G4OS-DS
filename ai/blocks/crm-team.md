# Time e metas

- Arquivo: `src/blocks/crm-team.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: CRM
- Preview: showcase `#/frame/crm-team` (`?theme=dark` para o escuro)

Atingimento de meta por vendedor (bullet), evolução do ranking (bump), trimestre contra o anterior (slope) e edição de meta.

## Conceito

**Objetivo:** Mostrar ao gestor quem está acima ou abaixo da meta e como o ranking mudou.

**Padrões aplicados**

- Anatomia B · Painel: cabeçalho fixo
- Bullet por vendedor (realizado × meta), bump do ranking, slope do trimestre
- Editar meta em modal

**Quando usar e o que adaptar**

- Metas de recrutadores, produtividade de atendentes

**Evite**

- Ranking sem mostrar a meta de cada um

## Componentes usados

`Avatar`, `Badge`, `BulletChart`, `BumpChart`, `Button`, `ChartCard`, `Column`, `CurrencyField`, `DataTable`, `IconButton`, `KpiCard`, `KpiGrid`, `Modal`, `Page`, `PageHeading`, `SegmentedControl`, `SlopeChart`, `formatCurrency`, `formatPercent`, `notify`
