# Central de suporte

- Arquivo: `src/blocks/saas-support.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: SaaS
- Preview: showcase `#/frame/saas-support` (`?theme=dark` para o escuro)

Fila de chamados com filtros e SLA, conversa com resposta, status, prioridade e responsável; no celular a conversa abre em tela cheia (?id=).

## Conceito

**Objetivo:** Atender a fila de chamados priorizando SLA, sem perder a conversa.

**Padrões aplicados**

- Anatomia F · Mestre-detalhe: fila à esquerda, conversa à direita
- PageToolbar com filtros e busca colada ao cabeçalho
- SLA, prioridade e responsável no detalhe; no celular a conversa abre em tela cheia (?id=)

**Quando usar e o que adaptar**

- Atendimento interno (TI, RH), pós-venda, ouvidoria

**Evite**

- Abrir cada chamado em página nova

## Componentes usados

`Avatar`, `Badge`, `Button`, `Empty`, `EmptyFilterResult`, `EntityMark`, `FieldBlock`, `FilterBar`, `FilterField`, `Highlight`, `KpiCard`, `KpiGrid`, `Page`, `PageHeading`, `PageToolbar`, `Select`, `Skeleton`, `TableSearch`, `TextareaField`, `notify`, `useFilters`
