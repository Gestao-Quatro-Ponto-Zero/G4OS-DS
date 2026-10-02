# Ordens de serviço

- Arquivo: `src/blocks/srv-work-orders.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: Serviços
- Preview: showcase `#/frame/srv-work-orders` (`?theme=dark` para o escuro)

Quadro de OS por etapa (Aberta → Agendada → Em execução → Concluída → Faturada) com técnico, cliente, SLA e prioridade; alternador para lista. Arrastar para Agendada pede técnico e horário; para Faturada, confirma a NFS-e. Abrir OS em gaveta (?nova=1).

## Conceito

**Objetivo:** Ver toda a operação de campo num olhar: o que está sem técnico, o que vai estourar o SLA e o que já pode ser faturado.

**Padrões aplicados**

- Anatomia E · Quadro: colunas por etapa; no desktop a página não rola
- Card com SLA em palavra (Atrasada 1 d, Vence hoje 16:00); borda vermelha só no estourado
- Arrastar muda a etapa; Agendada pede técnico e horário em Modal; Faturada confirma a NFS-e
- Totais por coluna no cabeçalho (atrasadas, valor a faturar)
- Alternar Quadro/Lista sem perder filtros; etapa inline na lista
- Abrir OS em Drawer (?nova=1); card abre o registro
- Cinco estados: ?estado=carregando|vazio|erro simula; vazio por filtro com Limpar

**Quando usar e o que adaptar**

- Chamados de suporte, entregas de uma transportadora, obras por fase

**Evite**

- Status por botões dentro do card
- Cor de prioridade sem palavra

## Componentes usados

`Avatar`, `Badge`, `Button`, `Column`, `Combobox`, `DataTable`, `DatePicker`, `Drawer`, `Empty`, `EmptyFilterResult`, `FilterBar`, `FilterField`, `Highlight`, `KanbanBoard`, `KanbanColumn`, `Modal`, `OperationButton`, `OperationFeedback`, `Page`, `PageHeading`, `RecordCard`, `SegmentedControl`, `Select`, `Skeleton`, `TableSearch`, `TextField`, `TextareaField`, `chartColor`, `formatCurrency`, `notify`, `useFilters`, `useOperation`
