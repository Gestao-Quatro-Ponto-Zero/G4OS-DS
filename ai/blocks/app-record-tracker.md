# Rastreador de registros

- Arquivo: `src/blocks/app-record-tracker.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: Aplicação
- Preview: showcase `#/frame/app-record-tracker` (`?theme=dark` para o escuro)

Banco de registros estilo Notion: tabela com etiquetas coloridas, status e prioridade editáveis, desfazer/refazer, Tabela ou Quadro, e painel lateral com propriedades, arquivos, notas e atividade.

## Conceito

**Objetivo:** Gerenciar registros estilo Notion (aqui, casos de QA) com propriedades editáveis e um painel de detalhes ao lado.

**Padrões aplicados**

- Anatomia A · Lista com DataGrid de altura total (rolagem interna, cabeçalho da grade fixo)
- Etiquetas coloridas, status e prioridade editáveis; desfazer/refazer
- Tabela ou Quadro (mesmos dados)
- RecordPanel lateral com ‹ › entre registros (?id=)

**Quando usar e o que adaptar**

- Backlog de produto, inventário de ativos, controle de contratos

**Evite**

- Abrir o registro em outra página e perder a lista

## Componentes usados

`ActivitySection`, `Avatar`, `Button`, `Checkbox`, `DataGrid`, `DueDatePicker`, `Empty`, `FileDropzone`, `FilesList`, `GridColumn`, `KanbanBoard`, `KanbanColumn`, `Modal`, `NotesTable`, `Priority`, `PriorityIcon`, `PriorityPill`, `PropertyPill`, `PropertyPills`, `RecordCard`, `RecordFile`, `RecordFileKind`, `RecordPanel`, `RecordSection`, `SectionAddButton`, `SegmentedControl`, `Skeleton`, `StatusPill`, `TableSearch`, `TagPill`, `TaskStatus`, `notify`, `priorityLabel`, `taskStatusLabel`, `useTableSearch`
