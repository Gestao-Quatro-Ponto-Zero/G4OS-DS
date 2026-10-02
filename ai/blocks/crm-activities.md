# Atividades e agenda

- Arquivo: `src/blocks/crm-activities.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: CRM
- Preview: showcase `#/frame/crm-activities` (`?theme=dark` para o escuro)

Tarefas, ligações, reuniões e e-mails agrupados por prazo (atrasadas primeiro) ou na semana, com conclusão rápida, filtros e nova atividade.

## Conceito

**Objetivo:** Não deixar follow-up cair: ver o que está atrasado, o que é hoje e fechar rápido.

**Padrões aplicados**

- Anatomia A · Lista: cabeçalho fixo + PageToolbar colada
- Agrupado por prazo (atrasadas primeiro) ou por semana
- Conclusão rápida na linha; nova atividade em modal
- Cinco estados: ?estado=carregando|vazio|erro simula; recorte vazio limpa filtros

**Quando usar e o que adaptar**

- Tarefas do ATS (entrevistas, retornos), cobranças do financeiro

**Evite**

- Ordenar por criação em vez de prazo

## Componentes usados

`Avatar`, `Badge`, `Button`, `Checkbox`, `Combobox`, `DatePicker`, `Empty`, `EmptyFilterResult`, `ErrorState`, `FieldBlock`, `FieldGrid`, `FilterBar`, `FilterField`, `Highlight`, `Modal`, `Page`, `PageHeading`, `PageToolbar`, `SegmentedControl`, `Select`, `Skeleton`, `TableSearch`, `TextField`, `formatDate`, `notify`, `useFilters`
