# Banco de talentos

- Arquivo: `src/blocks/ats-candidates.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: ATS
- Preview: showcase `#/frame/ats-candidates` (`?theme=dark` para o escuro)

Todos os candidatos em DataGrid: visões salvas, filtros, busca local (/), seleção com mover etapa em massa, ações rápidas (e-mail, agendar), colunas configuráveis, CSV e cadastro manual.

## Conceito

**Objetivo:** Trabalhar o banco de talentos em escala: filtrar, selecionar muitos e mover de etapa de uma vez.

**Padrões aplicados**

- Anatomia A · Lista com DataGrid: rolagem interna, cabeçalho e colunas fixos
- Visões salvas, filtros e busca local (/) na barra da grade
- Seleção em massa com BulkBar (mover etapa, e-mail)
- Ações rápidas na linha; colunas configuráveis; CSV

**Quando usar e o que adaptar**

- Base de contatos (CRM), clientes B2B (ERP), leads de marketing

**Evite**

- Ação em massa sem confirmação quando altera muitos registros

## Componentes usados

`Avatar`, `Badge`, `Button`, `DataGrid`, `EmptyFilterResult`, `FilterBar`, `FilterField`, `GridColumn`, `Highlight`, `Menu`, `Modal`, `Page`, `PageHeading`, `SavedView`, `SavedViews`, `Select`, `TableSearch`, `TextField`, `formatCurrency`, `notify`, `plural`, `useFilters`, `useSavedViews`
