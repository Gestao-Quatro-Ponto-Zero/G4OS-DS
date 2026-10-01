# Tabelas e coleções

## Anatomia de uma página de lista

```
PageHeading: "Negócios"                         [Importar] [Novo negócio]
TableToolbar: [busca………] [Etapa ▾] [Dono ▾] Limpar        24 de 312 negócios   [Lista|Quadro]
DataTable (contorno arredondado, cabeçalho gelo 12 px, linhas 13.5 px)
Pagination: 1–20 de 312                                    ‹ 1 2 3 … 16 ›
BulkBar (flutua no rodapé quando há seleção)
```

## DataTable

```tsx
const columns: Column<Deal>[] = [
  { key: "nome", header: "Negócio", cell: (d) => d.name, primary: true },
  { key: "empresa", header: "Empresa", cell: (d) => d.company },
  { key: "valor", header: <SortHeader label="Valor" {...sort.header("valor")} />, cell: (d) => formatCurrency(d.value), align: "right", nowrap: true },
  { key: "etapa", header: "Etapa", cell: (d) => <StatusLabel … /> },
  { key: "acoes", header: "", cell: (d) => <ActionMenu actions={…} />, action: true },
];
<DataTable rows={page.rows} columns={columns} rowKey={(d) => d.id} onRowClick={open} rowLabel={(d) => `Abrir ${d.name}`} empty={<Empty framed={false} … />} />
```

- **Abaixo de 1024 px a tabela vira blocos rotulados** (o rótulo vem do `header` string). `primary` vai para o topo do bloco; `wide` ocupa a linha; `action` fica separado; `mobileHidden` some.
- A linha inteira abre o registro (`onRowClick`) e funciona com Enter/Espaço. Ações da linha (menu ⋯) param a propagação sozinhas (`action: true`).
- Números à direita, `tabular-nums`, `nowrap`. Texto à esquerda. Nunca centralize colunas.
- Primeira coluna = identidade do registro (nome, número), `font-medium`.
- Até ~7 colunas visíveis. Mais que isso, esconda no celular e considere uma coluna "Detalhes" ou o drawer.
- Status em tabela é **ponto + texto** (`StatusLabel`), não badge colorido em toda linha.
- Célula vazia mostra "—" em `text-muted`.

## DataGrid (`data-grid.tsx`): a tabela de trabalho

Use `DataGrid` quando **a lista é a tela** e a pessoa age sobre as linhas (contatos, pedidos, títulos, candidatos). `DataTable` continua para listas curtas, leitura e seções de página.

| Precisa de… | DataTable | DataGrid |
| --- | --- | --- |
| Até ~50 linhas, página rola inteira | ✓ | |
| Rolagem interna com cabeçalho e totais fixos | | ✓ `height` / `maxHeight` |
| Coluna de identificação e ações fixas ao rolar para o lado | | ✓ `pinned` |
| Seleção em massa, “selecionar todos os N” | ↔ `selectionColumn` | ✓ `selectable`, `totalCount`, `bulkActions` |
| Ações rápidas por linha + clique direito | | ✓ `rowActions` (`inline` = ícone no hover) |
| Mostrar/ocultar, redimensionar e lembrar colunas | | ✓ menu Colunas, arrastar borda, `storageKey` |
| Expandir detalhe, agrupar com subtotal, total no rodapé | | ✓ `renderExpanded`, `groupBy` + `aggregate`, `footer` |
| Editar na célula | | ✓ `editable` + `onEdit` |
| Centenas a milhares de linhas | | ✓ virtualização automática (> 200) |
| Celular | blocos rotulados | rolagem com 1ª coluna fixa ou `mobile="cards"` |

Regras:

1. **Altura**: `maxHeight` para listas que mudam com filtro (a grade encolhe e o total fica colado no fim); `height` só para listas sempre cheias. Use a altura útil da tela (`calc(100dvh - Xpx)`) para não ter dois scrolls na mesma direção.
2. **Colunas fixas**: só a identificação (nome, nº do pedido) à esquerda e as ações à direita. No celular a coluna fixa ocupa no máximo 42 % da largura.
3. **Barra**: passe `FilterBar` (com `TableSearch`) em `toolbar`; densidade, Exportar e Colunas ficam no fim da mesma linha.
4. **Ações rápidas**: `inline` só para o que se faz dezenas de vezes por dia (ligar, receber, aprovar), no máximo 3. Destrutivas vão para o ⋯ com `separator` e `tone: "danger"`, e passam por confirmação ou desfazer. O clique direito mostra as mesmas ações + “Copiar <coluna>” + “Selecionar”.
5. **Seleção**: shift+clique marca intervalo; com `totalCount` maior que a página aparece “Selecionar todos os N”; a ação em massa recebe `allMatching` e deve rodar no filtro (servidor), não só nas linhas carregadas. Use `gender="f"` para concordância (“3 contas selecionadas”).
6. **Totais**: `footer` soma o que está filtrado; diga isso no `tooltip` da coluna. Não some percentuais.
7. **Tom**: `rowTone` (warn/bad/ok) para exceções — 5 a 10 % das linhas, com a palavra correspondente na linha.
8. **Edição inline**: campos curtos e frequentes (dono, estágio, prazo, valor). Salve na hora, com toast e desfazer. Formulário longo → Drawer.
9. **Teclado**: ↑↓/PgUp/PgDn/Home/End movem, Enter abre, →/← expandem, Espaço/X selecionam, E edita, Esc limpa a seleção.
10. **Exportar**: `exportFileName` gera CSV pt-BR (`;`, decimal com vírgula, BOM) do que está na tela ou só dos selecionados.

Exemplos vivos: showcase › Coleções › DataGrid. Em blocos: `crm-contacts`, `erp-orders` (grupos + itens expansíveis), `fin-receivables` (tom por atraso), `ats-candidates` (mover etapa em massa).

## Estado da tabela (`data.tsx`)

| Hook / componente | Para |
| --- | --- |
| `useSort(rows, { chave: acessor })` + `SortHeader` | ordenação por coluna (asc → desc → sem) em pt-BR |
| `useSelection(idsVisiveis)` + `selectionColumn(...)` | checkbox por linha e "selecionar todos" (com indeterminado) |
| `BulkBar` | ações em massa flutuando no rodapé enquanto há seleção |
| `usePagination(rows, 20)` + `Pagination` | paginação no cliente ("1–20 de 312") |

Com 10 mil+ registros, pagine/ordene no servidor e use os hooks só na página atual. Ordem e filtros vão para a URL.

## Filtros

- Busca textual normaliza acento e caixa (`normalize` de `lib/text`).
- `FacetFilter` por atributo com multi-seleção; o gatilho mostra contador quando ativo.
- "Limpar" aparece só com filtro ativo. A contagem "X de Y" é `aria-live`.
- Filtro rápido binário ("Minhas", "Atrasadas") é `FilterChip`.
- No celular, filtros além do primeiro recolhem em "Filtros" (drawer ou popover).

## Quadro (kanban)

Ver [pipelines.md](pipelines.md). `KanbanBoard` + `KanbanColumn` (`meta` para soma de valor) + `KanbanCard` / `RecordCard`.

## Painéis de prévia

`ListPanel` + `ListRow` para mostrar 3–5 itens de uma coleção dentro de um dashboard, com "Ver todos". `tone="attention"` (âmbar) para pendências.

## Vazio, carregando, erro

Toda coleção tem os três:

- **Carregando**: `Skeleton` com a forma das linhas (3–5 linhas), nunca spinner central.
- **Vazio de verdade**: `Empty` com a próxima ação ("Criar negócio", "Importar planilha").
- **Vazio por filtro**: `Empty` "Nenhum X com esses filtros" + "Limpar filtros".
- **Erro**: bloco com o que aconteceu e "Tentar de novo"; mantém filtros.
