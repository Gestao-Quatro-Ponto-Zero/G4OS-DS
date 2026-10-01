# Projetos do agente

- Arquivo: `src/blocks/ai-projects.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: IA
- Preview: showcase `#/frame/ai-projects` (`?theme=dark` para o escuro)

Lista de análises feitas pelo agente com status, dono, tempo, artefatos e custo; filtros, busca e nova análise que abre o workspace.

## Conceito

**Objetivo:** Achar e reabrir análises feitas pelo agente, com status, dono e custo, para o time acompanhar o que a IA produziu.

**Padrões aplicados**

- Anatomia A · Lista: cabeçalho fixo + PageToolbar colada (filtros e busca local)
- KPIs curtos no topo (em andamento, concluídas, custo)
- Uma ação primária: Nova análise (InputModal) que abre o workspace
- Linha abre o projeto (?id=)

**Quando usar e o que adaptar**

- Relatórios gerados, execuções de automação, campanhas: troque colunas e status

**Evite**

- Filtros fora da PageToolbar (somem ao rolar)

## Componentes usados

`Avatar`, `Badge`, `Button`, `Column`, `DataTable`, `EmptyFilterResult`, `FilterBar`, `FilterField`, `Highlight`, `InputModal`, `KpiCard`, `KpiGrid`, `Page`, `PageHeading`, `PageToolbar`, `TableSearch`, `formatCurrency`, `formatDuration`, `formatNumber`, `notify`, `useFilters`
