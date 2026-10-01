# Pipeline de vendas

- Arquivo: `src/blocks/crm-pipeline.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: CRM
- Preview: showcase `#/frame/crm-pipeline` (`?theme=dark` para o escuro)

Quadro de negócios por etapa com soma de valor, previsão ponderada, filtros, arrastar entre etapas e novo negócio.

## Conceito

**Objetivo:** Ver o funil comercial inteiro e mover negócios entre etapas sabendo quanto vale cada coluna.

**Padrões aplicados**

- Anatomia E · Quadro: cabeçalho fixo; colunas crescem em telas largas
- Soma de valor e previsão ponderada no topo e por coluna
- Arrastar muda a etapa (com desfazer); card abre o negócio
- Filtros e busca na barra acima do quadro

**Quando usar e o que adaptar**

- Candidatos (ATS), pedidos (ERP), chamados por status

**Evite**

- Mudar etapa por botão dentro do card

## Componentes usados

`Badge`, `Button`, `EntityMark`, `FilterBar`, `FilterField`, `KanbanBoard`, `KanbanColumn`, `PageHeading`, `RecordCard`, `SegmentedControl`, `TableSearch`, `formatCurrency`, `formatPercent`, `notify`, `useFilters`
