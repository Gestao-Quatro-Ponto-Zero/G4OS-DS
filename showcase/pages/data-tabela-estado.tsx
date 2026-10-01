import { Download, Mail } from "lucide-react";
import { useState } from "react";
import {
  Badge,
  BulkBar,
  Button,
  DataTable,
  Empty,
  Pagination,
  PropertyList,
  SegmentedControl,
  formatCurrency,
  notify,
  selectionColumn,
  usePagination,
  useSelection,
  useSort,
  type Column,
} from "@g4ai/ds";
import {
  CodeBlock,
  Demo,
  DocPage,
  DocSection,
  PropsTable,
  Rules,
  type PageMeta,
} from "../kit";

export const meta: PageMeta = {
  title: "Ordenar, selecionar, paginar",
  group: "Coleções",
  order: 20,
  description:
    "Hooks e peças para tabela de verdade sem biblioteca: useSort + SortHeader, useSelection + selectionColumn + BulkBar, usePagination + Pagination. Compõem com DataTable. Para tudo junto (com filtros e URL), use useDataView.",
};

type Invoice = {
  id: string;
  customer: string;
  due: string;
  value: number;
  status: "pago" | "aberto" | "vencido";
};
const customers = [
  "Construtora Pilar",
  "Vértice Logística",
  "Agro Cerrado",
  "Clínica Bem Viver",
  "Hotel Mar Azul",
  "Café Serra Alta",
  "Pet Mundo",
  "Escola Novo Saber",
];
const invoices: Invoice[] = Array.from({ length: 23 }, (_, i) => ({
  id: String(i + 1),
  customer: customers[(i * 3) % customers.length],
  due: `${String(1 + ((i * 7) % 28)).padStart(2, "0")}/10/2026`,
  value: 1_200 + ((i * 7919) % 48_000),
  status: (["aberto", "pago", "vencido"] as const)[i % 3],
}));
const tone = { pago: "ok", aberto: "neutral", vencido: "bad" } as const;

type TableState = "dados" | "carregando" | "recarregando" | "vazio" | "erro";

function StatesDemo() {
  const [state, setState] = useState<TableState>("dados");
  const rows =
    state === "dados" || state === "recarregando" ? invoices.slice(0, 4) : [];
  const columns: Column<Invoice>[] = [
    {
      key: "customer",
      header: "Cliente",
      primary: true,
      cell: (r) => r.customer,
    },
    {
      key: "due",
      header: "Vencimento",
      nowrap: true,
      cell: (r) => <span className="tabular-nums text-muted">{r.due}</span>,
    },
    {
      key: "value",
      header: "Valor",
      align: "right",
      nowrap: true,
      cell: (r) => (
        <span className="tabular-nums">{formatCurrency(r.value)}</span>
      ),
      footer: formatCurrency(rows.reduce((t, r) => t + r.value, 0)),
    },
  ];
  return (
    <div className="space-y-3">
      <div className="-mx-1 max-w-full overflow-x-auto px-1 pb-1">
        <SegmentedControl
          label="Estado da tabela"
          value={state}
          onChange={setState}
          options={[
            { value: "dados", label: "Com dados" },
            { value: "carregando", label: "Carregando" },
            { value: "recarregando", label: "Recarregando" },
            { value: "vazio", label: "Vazio" },
            { value: "erro", label: "Erro" },
          ]}
        />
      </div>
      <DataTable
        label="Faturas"
        rows={rows}
        columns={columns}
        rowKey={(r) => r.id}
        loading={state === "carregando" || state === "recarregando"}
        error={
          state === "erro"
            ? {
                message: "O servidor de cobrança não respondeu.",
                onRetry: () => setState("dados"),
              }
            : undefined
        }
        rowTone={(r) => (r.status === "vencido" ? "bad" : undefined)}
        empty={
          <Empty
            framed={false}
            title="Nenhuma fatura emitida"
            hint="Faturas aparecem aqui quando um pedido é faturado."
            action={<Button size="sm">Emitir fatura</Button>}
          />
        }
      />
    </div>
  );
}

export default function Page() {
  const sort = useSort(
    invoices,
    { cliente: (r) => r.customer, valor: (r) => r.value },
    { key: "valor", dir: "desc" }
  );
  const pages = usePagination(sort.rows, 6, { resetKey: sort.sort });
  const sel = useSelection(pages.rows.map((r) => r.id));
  const columns: Column<Invoice>[] = [
    selectionColumn<Invoice>(
      sel,
      (r) => r.id,
      (r) => `fatura de ${r.customer}`
    ),
    {
      key: "customer",
      header: "Cliente",
      sortKey: "cliente",
      primary: true,
      cell: (r) => r.customer,
    },
    {
      key: "due",
      header: "Vencimento",
      nowrap: true,
      cell: (r) => <span className="tabular-nums text-muted">{r.due}</span>,
    },
    {
      key: "value",
      header: "Valor",
      sortKey: "valor",
      align: "right",
      nowrap: true,
      cell: (r) => (
        <span className="font-medium tabular-nums">
          {formatCurrency(r.value)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Situação",
      cell: (r) => (
        <Badge tone={tone[r.status]}>
          {r.status[0].toUpperCase() + r.status.slice(1)}
        </Badge>
      ),
    },
  ];

  return (
    <DocPage
      title={meta.title}
      kicker="Coleções"
      description={meta.description}
    >
      <DocSection
        title="Exemplo completo"
        rule="Clique nos cabeçalhos com setas, marque linhas (a barra de ações aparece), troque de página."
      >
        <Demo
          bare
          code={`const sort = useSort(invoices, { cliente: (r) => r.customer, valor: (r) => r.value }, { key: "valor", dir: "desc" });
const pages = usePagination(sort.rows, 20, { resetKey: sort.sort }); // ordenou → volta à página 1
const sel = useSelection(pages.rows.map((r) => r.id));   // "todos" = página visível

const columns: Column<Invoice>[] = [
  selectionColumn(sel, (r) => r.id, (r) => \`fatura de \${r.customer}\`),
  { key: "customer", header: "Cliente", sortKey: "cliente", primary: true, cell: (r) => r.customer },
  { key: "value", header: "Valor", sortKey: "valor", align: "right", cell: … },
];

<DataTable label="Faturas" rows={pages.rows} columns={columns} rowKey={(r) => r.id} sort={sort}
  rowSelected={(r) => sel.has(r.id)} />
<Pagination page={pages.page} pageCount={pages.pageCount} onPage={pages.setPage} total={pages.total}
  pageSize={pages.pageSize} pageSizeOptions={[6, 12, 24]} onPageSizeChange={pages.setPageSize} noun="fatura" />
<BulkBar count={sel.count} noun="fatura" onClear={sel.clear}>
  <button type="button" onClick={cobrar}><Mail /> Enviar cobrança</button>
</BulkBar>`}
        >
          <div className="space-y-4">
            <DataTable
              label="Faturas"
              rows={pages.rows}
              columns={columns}
              rowKey={(r) => r.id}
              sort={sort}
              rowSelected={(r) => sel.has(r.id)}
            />
            <Pagination
              page={pages.page}
              pageCount={pages.pageCount}
              onPage={pages.setPage}
              total={pages.total}
              pageSize={pages.pageSize}
              pageSizeOptions={[6, 12, 24]}
              onPageSizeChange={pages.setPageSize}
              noun="fatura"
            />
            <BulkBar count={sel.count} noun="fatura" onClear={sel.clear}>
              <button
                type="button"
                onClick={() => {
                  notify(`Cobrança enviada para ${sel.count} faturas`);
                  sel.clear();
                }}
              >
                <Mail /> Enviar cobrança
              </button>
              <button type="button">
                <Download /> Exportar
              </button>
            </BulkBar>
          </div>
        </Demo>
      </DocSection>

      <DocSection
        title="Estados da tabela"
        rule="Cinco estados em todo dado. Carregando sem linhas = esqueleto com a forma final; recarregando (filtro, página, servidor) mantém as linhas com uma barra no topo, sem pular; erro com saída; vazio com próxima ação."
      >
        <Demo
          className="block"
          code={`<DataTable label="Faturas" rows={rows} columns={columns} rowKey={(r) => r.id}
  loading={isFetching}                       // sem linhas: esqueleto · com linhas: barra + linhas esmaecidas
  error={error && { message: error.message, onRetry: refetch }}
  rowTone={(r) => (r.status === "vencido" ? "bad" : undefined)}
  empty={<Empty framed={false} title="Nenhuma fatura emitida" action={<Button size="sm">Emitir fatura</Button>} />} />

// rodapé com total: qualquer coluna com footer
{ key: "value", header: "Valor", align: "right", cell: …, footer: formatCurrency(total) }

// lista longa numa área fixa: rola por dentro com cabeçalho e rodapé fixos
<DataTable maxHeight={420} … />`}
        >
          <StatesDemo />
        </Demo>
      </DocSection>

      <DocSection
        title="useSort + ordenação na DataTable"
        rule="Clique alterna crescente → decrescente → sem ordenação. Texto compara em pt-BR (acentos e caixa) e números dentro do texto em ordem natural (“Pedido 2” antes de “Pedido 10”); nulos vão para o fim."
      >
        <PropsTable
          rows={[
            [
              "useSort(rows, by, initial?)",
              "—",
              "—",
              "by: { chave: (row) => string | number | Date }. Retorna rows, sort, setSort, toggle, header(chave).",
            ],
            [
              "DataTable sort={sort} + Column.sortKey",
              "useSort",
              "—",
              "Caminho curto: o cabeçalho vira botão de ordenação e o <th> ganha aria-sort.",
            ],
            [
              "sort.header(chave)",
              "{ active, dir, onToggle }",
              "—",
              "Para cabeçalho próprio: espalhe em <SortHeader label=… />.",
            ],
            [
              "SortHeader.align",
              '"left" | "right"',
              '"left"',
              "right em colunas numéricas (seta à esquerda do rótulo).",
            ],
          ]}
        />
      </DocSection>

      <DocSection
        title="DataTable"
        rule="Tabela de leitura e listas médias. Vira blocos rotulados abaixo de 1024 px (a seleção fica ao lado do título)."
      >
        <PropsTable
          rows={[
            ["label", "string", "—", "Nome da tabela para leitores de tela."],
            [
              "sort",
              "useSort",
              "—",
              "Colunas com sortKey ganham cabeçalho ordenável.",
            ],
            [
              "loading",
              "boolean",
              "false",
              "Sem linhas: esqueleto (loadingRows). Com linhas: mantém e mostra barra de progresso.",
            ],
            [
              "error",
              "{ message, onRetry? }",
              "—",
              "Bloco “Não foi possível carregar” com “Tentar de novo”.",
            ],
            [
              "empty",
              "ReactNode",
              "—",
              "Sem linhas. Use EmptyFilterResult quando o vazio vem do filtro.",
            ],
            [
              "maxHeight",
              "number | string",
              "—",
              "Rola por dentro com cabeçalho (e rodapé) fixos no desktop.",
            ],
            [
              "rowSelected / rowTone",
              "(row) => …",
              "—",
              "Linha marcada (seleção, registro aberto) / faixa de atenção warn·bad.",
            ],
            [
              "Column.footer / footerLabel",
              "ReactNode / string",
              '"Total"',
              "Rodapé com totais; o rótulo vai na primeira coluna sem footer.",
            ],
            [
              "Column.width / align",
              'number | string / "left" | "right" | "center"',
              "—",
              "Largura fixa; números à direita.",
            ],
          ]}
        />
      </DocSection>

      <DocSection
        title="useSelection + selectionColumn + BulkBar"
        rule="“Selecionar todos” age sobre os ids visíveis (página ou filtro atual), nunca sobre registros que a pessoa não vê."
      >
        <PropsTable
          rows={[
            [
              "useSelection(visibleIds)",
              "—",
              "—",
              "selected, count, all, some, has, toggle, toggleAll, clear, visibleCount, hiddenCount, keepOnly(ids), set(ids).",
            ],
            [
              "sel.hiddenCount",
              "number",
              "—",
              "Selecionados fora da página/filtro atual: avise antes de uma ação em massa (ou use keepOnly ao filtrar).",
            ],
            [
              "selectionColumn(sel, rowKey, rowLabel)",
              "Column<T>",
              "—",
              "Checkbox por linha + cabeçalho com estado parcial.",
            ],
            [
              "BulkBar",
              "{ count, noun, nounPlural?, onClear, children }",
              "—",
              "Barra escura flutuante no rodapé. Filhos: <button> com ícone + verbo.",
            ],
          ]}
        />
      </DocSection>

      <DocSection
        title="usePagination + Pagination"
        rule="No cliente até alguns milhares de linhas. Acima disso, pagine no servidor e use só Pagination."
      >
        <PropsTable
          rows={[
            [
              "usePagination(rows, pageSize = 20, { resetKey? })",
              "—",
              "—",
              "page, pageCount, pageSize, total, rows (da página), setPage, setPageSize. Volta à página 1 quando resetKey (filtro, ordenação) muda; nunca passa da última página.",
            ],
            [
              "Pagination",
              "{ page, pageCount, onPage, total?, pageSize? }",
              "—",
              "“1–20 de 312” + anterior/próxima + páginas vizinhas. No celular: “2 de 9” entre as setas.",
            ],
            [
              "Pagination.pageSizeOptions + onPageSizeChange",
              "number[]",
              "—",
              "“Por página” (seletor nativo, bom no celular).",
            ],
            [
              "Pagination.noun / nounPlural",
              "string",
              "—",
              "“1–20 de 312 faturas”.",
            ],
          ]}
        />
      </DocSection>

      <DocSection
        title="PropertyList"
        rule="Propriedades de um registro (lateral de contato, candidato, pedido). Vazio mostra “—”: a ausência também é informação."
      >
        <Demo
          className="grid gap-8 md:grid-cols-2"
          code={`<PropertyList items={[
  { label: "Valor", value: formatCurrency(460800), hint: "R$ 160 por usuário/mês" },
  { label: "Probabilidade", value: "75 %" },
  { label: "Concorrente", value: undefined },
]} />
<PropertyList stacked items={…} />`}
        >
          <PropertyList
            items={[
              {
                label: "Valor",
                value: (
                  <span className="font-semibold tabular-nums">
                    {formatCurrency(460_800)}
                  </span>
                ),
                hint: "R$ 160 por usuário/mês · 12 meses",
              },
              { label: "Probabilidade", value: "75 %" },
              { label: "Responsável", value: "Ana Lopes" },
              { label: "Concorrente", value: undefined },
            ]}
          />
          <PropertyList
            stacked
            items={[
              { label: "CNPJ", value: "12.345.678/0001-90" },
              { label: "Segmento", value: "Indústria" },
              { label: "Cidade", value: "Joinville, SC" },
              { label: "Site", value: undefined },
            ]}
          />
        </Demo>
      </DocSection>

      <DocSection title="Receita: tabela de lista dedicada">
        <CodeBlock
          code={`// filtros → ordenação → paginação → seleção (nessa ordem)
const filtered = useMemo(() => rows.filter(matches), [rows, query, facets]);
const sort = useSort(filtered, by, { key: "data", dir: "desc" });
const pages = usePagination(sort.rows, 20, { resetKey: [query, facets, sort.sort] }); // filtrou → página 1
const sel = useSelection(pages.rows.map(rowKey));
// ou tudo junto, com URL: const view = useDataView(rows, { rowKey, fields, search, sortBy, pageSize: 20, url: true })`}
        />
        <Rules
          items={[
            {
              do: "Ordenação padrão que responde à tarefa (vencidos primeiro, maior valor primeiro).",
              dont: "Ordem de criação no banco como padrão.",
            },
            {
              do: "Ações em massa com verbo e contagem (“Faturar 3 pedidos”); destrutivas passam por ConfirmDialog.",
              dont: "Ações em massa sempre visíveis, desabilitadas até alguém selecionar.",
            },
            {
              do: "Colunas numéricas alinhadas à direita com tabular-nums.",
              dont: "Valores monetários centralizados.",
            },
          ]}
        />
      </DocSection>
    </DocPage>
  );
}
