# Vagas

- Arquivo: `src/blocks/ats-jobs.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: ATS
- Preview: showcase `#/frame/ats-jobs` (`?theme=dark` para o escuro)

Vagas com funil por etapa, tempo em aberto contra o SLA, filtros por área e recrutador, busca local (/) e estado na URL. Linha abre a vaga.

## Conceito

**Objetivo:** Acompanhar todas as vagas abertas e achar rápido as que estão fora do SLA.

**Padrões aplicados**

- Anatomia A · Lista: cabeçalho fixo + PageToolbar colada; abas por situação
- Funil por etapa na linha (barra de proporção)
- Tempo em aberto contra o SLA com tom de alerta
- Estado na URL; linha abre a vaga

**Quando usar e o que adaptar**

- Projetos, contratos, pedidos com prazo

**Evite**

- SLA só em número, sem tom quando estoura

## Componentes usados

`ActionMenu`, `Avatar`, `Badge`, `Button`, `Column`, `DataTable`, `EmptyFilterResult`, `FilterBar`, `FilterField`, `Highlight`, `Page`, `PageHeading`, `PageToolbar`, `SortHeader`, `StatCell`, `StatGrid`, `TableSearch`, `Tabs`, `chartColor`, `notify`, `useFilters`, `useSort`
