# Empresas e contatos

- Arquivo: `src/blocks/crm-contacts.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: CRM
- Preview: showcase `#/frame/crm-contacts` (`?theme=dark` para o escuro)

Base de contas em DataGrid: rolagem interna com cabeçalho e total fixos, empresa fixa à esquerda, seleção em massa, ações rápidas (ligar, e-mail, ⋯, clique direito), estágio e responsável editáveis na célula, colunas configuráveis e CSV.

## Conceito

**Objetivo:** Trabalhar a base de contas em escala: filtrar, editar na célula e agir em massa sem abrir cada registro.

**Padrões aplicados**

- Anatomia A · Lista com DataGrid: rolagem interna, cabeçalho e total fixos, empresa fixa à esquerda
- Estágio e responsável editáveis na célula com desfazer
- Ações rápidas na linha (ligar, e-mail, ⋯ e clique direito)
- Seleção em massa; colunas configuráveis; CSV; cards no celular
- Importar planilha em gaveta: arquivo → mapear colunas → revisar (linhas com erro antes de gravar)
- E-mail pela linha abre o compositor com o contato principal
- Cinco estados: ?estado=carregando|vazio|erro simula; recorte vazio limpa filtros

**Quando usar e o que adaptar**

- Clientes (ERP), candidatos (ATS), contas (SaaS)

**Evite**

- Rolagem interna no celular (a grade já passa a rolar com a página)

## Componentes usados

`AlertCard`, `Avatar`, `AvatarGroup`, `Badge`, `Button`, `Checkbox`, `ComposeEmailDialog`, `DataGrid`, `Drawer`, `Empty`, `EmptyFilterResult`, `EntityMark`, `ErrorState`, `FieldBlock`, `FieldGrid`, `FileDropzone`, `FilterBar`, `FilterField`, `GridColumn`, `Highlight`, `Modal`, `OperationButton`, `OperationFeedback`, `Page`, `PageHeading`, `Person`, `SavedView`, `SavedViews`, `Select`, `Skeleton`, `Stepper`, `TableSearch`, `Tabs`, `TextField`, `UploadItem`, `downloadCsv`, `formatCurrency`, `formatNumber`, `gridToCsv`, `matchesQuery`, `notify`, `useFilters`, `useOperation`, `useSavedViews`
