# Frota de agentes

- Arquivo: `src/blocks/ai-agents.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: IA
- Preview: showcase `#/frame/ai-agents` (`?theme=dark` para o escuro)

Todos os agentes da empresa: status com palavra, dono, modelo, versão em produção, execuções dos últimos 7 dias, sucesso e custo contra o orçamento. Visões salvas, filtros, busca e os cinco estados (?estado=carregando|vazio|erro).

## Conceito

**Objetivo:** Saber de relance quais agentes a empresa tem, quem é dono de cada um e quais pedem atenção (erro, orçamento estourando).

**Padrões aplicados**

- Anatomia A · Lista: cabeçalho fixo + PageToolbar colada (visões salvas, filtros, busca)
- Status = ponto + palavra; linha com erro ou orçamento acima de 90 % ganha faixa
- Execuções em Sparkline de 7 dias; custo com a fração do orçamento ao lado
- Linha abre o registro do agente; ⋯ com editar, execuções, pausar e duplicar
- Vazio vira 'O que você quer automatizar?' com campo de pedido e modelos sugeridos

**Quando usar e o que adaptar**

- Catálogo de automações, robôs de RPA, integrações agendadas: troque modelo por conector
- Sem orçamento por agente? Troque a coluna de custo por 'última execução'

**Evite**

- Badge colorido sem palavra para o status
- Mostrar só o total de execuções sem a tendência
- Vazio sem próxima ação (um app de agentes começa pelo pedido)

## Componentes usados

`ActionMenu`, `AgentComposer`, `AppIcon`, `Avatar`, `Button`, `Column`, `DataTable`, `EmptyFilterResult`, `FilterBar`, `FilterField`, `HealthDot`, `Highlight`, `Page`, `PageHeading`, `PageToolbar`, `Pagination`, `SavedView`, `SavedViews`, `SortHeader`, `Sparkline`, `StatCell`, `StatGrid`, `TableSearch`, `ToolGlyph`, `formatCurrency`, `formatNumber`, `formatPercent`, `notify`, `useFilters`, `usePagination`, `useSavedViews`, `useSort`
