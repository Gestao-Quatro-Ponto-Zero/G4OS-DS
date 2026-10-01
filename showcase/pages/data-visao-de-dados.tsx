import { Download, Mail, UserRoundPen } from "lucide-react";
import { useState } from "react";
import {
  Badge,
  BulkBar,
  Button,
  DataTable,
  Empty,
  EmptyFilterResult,
  FilterBar,
  Highlight,
  Pagination,
  SavedViews,
  TableSearch,
  downloadCsv,
  formatCurrency,
  formatDate,
  gridToCsv,
  notify,
  selectionColumn,
  useDataView,
  useSavedViews,
  type Column,
} from "@g4ai/ds";
import { CodeBlock, Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";
import { dealFields, dealSearch, deals, dealViews, me, now, owners, type Deal } from "./_filtros-data";

export const meta: PageMeta = {
  title: "Visão de dados (useDataView)",
  group: "Coleções",
  order: 19,
  description:
    "Busca, filtros, visões salvas, ordenação, paginação, seleção e estado na URL de uma lista, num hook só e na ordem certa (filtra → ordena → pagina). É a receita da tela de lista: CRM, pedidos, faturas, candidatos.",
};

const ownerName = (v: string) => owners.find((o) => o.value === v)?.label ?? v;

function FullExample() {
  const view = useDataView(deals, {
    rowKey: (d) => d.id,
    fields: dealFields,
    search: dealSearch,
    sortBy: { negocio: (d) => d.name, valor: (d) => d.value, fechamento: (d) => d.closes },
    defaultSort: { key: "valor", dir: "desc" },
    pageSize: 8,
    pageSizeOptions: [8, 16, 32],
    me,
    now,
  });
  const views = useSavedViews(view.filters, dealViews);
  const q = view.filters.state.query;
  const { selection } = view;
  const columns: Column<Deal>[] = [
    selectionColumn<Deal>(selection, (d) => d.id, (d) => `${d.name} · ${d.company}`),
    {
      key: "name",
      header: "Negócio",
      sortKey: "negocio",
      primary: true,
      cell: (d) => (
        <span>
          <Highlight text={d.name} query={q} className="block" />
          <Highlight text={d.company} query={q} className="block text-[12px] font-normal text-muted" />
        </span>
      ),
    },
    { key: "stage", header: "Etapa", cell: (d) => <Badge>{d.stage}</Badge> },
    { key: "owner", header: "Responsável", cell: (d) => ownerName(d.owner) },
    {
      key: "value",
      header: "Valor",
      sortKey: "valor",
      align: "right",
      nowrap: true,
      cell: (d) => <span className="font-medium tabular-nums">{formatCurrency(d.value, { cents: false })}</span>,
      footer: formatCurrency(view.filteredRows.reduce((t, d) => t + d.value, 0), { cents: false }),
    },
    { key: "closes", header: "Fechamento", sortKey: "fechamento", nowrap: true, cell: (d) => <span className="tabular-nums text-muted">{formatDate(d.closes)}</span> },
  ];
  const selectedDeals = view.filteredRows.filter((d) => selection.has(d.id));

  return (
    <div className="space-y-4">
      <SavedViews views={views} counts={Object.fromEntries(dealViews.map((v) => [v.id, view.filters.countFor(v.state)]))} />
      <FilterBar
        filters={view.filters}
        noun="negócio"
        search={<TableSearch value={q} onChange={view.filters.setQuery} total={view.total} noun="negócio" searchIn="nome, empresa e cidade" />}
        actions={
          <Button size="sm" variant="ghost" onClick={() => downloadCsv("negocios", gridToCsv(view.filteredRows, [
            { key: "name", header: "Negócio", value: (d) => d.name },
            { key: "company", header: "Empresa", value: (d) => d.company },
            { key: "stage", header: "Etapa", value: (d) => d.stage },
            { key: "owner", header: "Responsável", value: (d) => ownerName(d.owner) },
            { key: "value", header: "Valor", value: (d) => d.value },
            { key: "closes", header: "Fechamento", value: (d) => new Date(`${d.closes}T00:00:00`) },
          ]))}>
            <Download /> <span className="max-sm:sr-only">Exportar</span>
          </Button>
        }
      />
      <DataTable
        label="Negócios"
        rows={view.rows}
        columns={columns}
        rowKey={(d) => d.id}
        sort={view.sort}
        rowSelected={(d) => selection.has(d.id)}
        footerLabel={`Total (${view.shown})`}
        empty={
          view.emptyKind === "filtered" ? (
            <EmptyFilterResult filters={view.filters} noun="negócio" />
          ) : (
            <Empty framed={false} title="Nenhum negócio ainda" hint="Negócios aparecem aqui quando alguém do time cria um." action={<Button size="sm">Criar negócio</Button>} />
          )
        }
      />
      <Pagination {...view.pagination} noun="negócio" />
      <BulkBar count={selection.count} noun="negócio" onClear={selection.clear}>
        <button type="button" onClick={() => notify(`${selectedDeals.length} negócios atribuídos a você`)}>
          <UserRoundPen /> Atribuir a mim
        </button>
        <button type="button" onClick={() => notify(`E-mail enviado para ${selectedDeals.length} contatos`)}>
          <Mail /> Enviar e-mail
        </button>
      </BulkBar>
    </div>
  );
}

function ServerExample() {
  const [loading, setLoading] = useState(false);
  const view = useDataView(deals.slice(0, 12), { rowKey: (d) => d.id, sortBy: { valor: (d) => d.value }, pageSize: 6 });
  const columns: Column<Deal>[] = [
    { key: "name", header: "Negócio", primary: true, cell: (d) => d.name },
    { key: "company", header: "Empresa", cell: (d) => d.company },
    { key: "value", header: "Valor", sortKey: "valor", align: "right", cell: (d) => <span className="tabular-nums">{formatCurrency(d.value, { cents: false })}</span> },
  ];
  const refetch = () => {
    setLoading(true);
    window.setTimeout(() => setLoading(false), 1400);
  };
  return (
    <div className="space-y-3">
      <Button size="sm" variant="ghost" onClick={refetch} disabled={loading}>
        Recarregar do servidor
      </Button>
      <DataTable label="Negócios do servidor" rows={view.rows} columns={columns} rowKey={(d) => d.id} sort={view.sort} loading={loading} />
      <Pagination {...view.pagination} />
    </div>
  );
}

export default function Page() {
  return (
    <DocPage title={meta.title} kicker="Coleções" description={meta.description}>
      <DocSection
        title="Lista completa"
        rule="Visões → busca e filtros → tabela ordenável → paginação → ações em massa. Filtrar volta à página 1; a seleção fica só com o que aparece; o vazio diz se é falta de dados ou do filtro."
      >
        <Demo
          bare
          code={`const view = useDataView(deals, {
  rowKey: (d) => d.id,
  fields,                                     // FilterField[]: Etapa, Responsável, Valor…
  search: (d) => [d.name, d.company, d.city], // busca livre
  sortBy: { valor: (d) => d.value, fechamento: (d) => d.closes },
  defaultSort: { key: "valor", dir: "desc" },
  pageSize: 20,
  pageSizeOptions: [20, 50, 100],
  me: session.userId,                          // filtro "sou eu"
  url: true,                                   // ?q=…&f=…&sort=valor.desc&page=2
});
const views = useSavedViews(view.filters, systemViews, "negocios:visoes");

<SavedViews views={views} counts={…} />
<FilterBar filters={view.filters} noun="negócio"
  search={<TableSearch value={view.filters.state.query} onChange={view.filters.setQuery} total={view.total} noun="negócio" />} />
<DataTable label="Negócios" rows={view.rows} sort={view.sort} rowKey={(d) => d.id}
  columns={[selectionColumn(view.selection, (d) => d.id, (d) => d.name), …]}
  rowSelected={(d) => view.selection.has(d.id)}
  empty={view.emptyKind === "filtered" ? <EmptyFilterResult filters={view.filters} noun="negócio" /> : <Empty … />} />
<Pagination {...view.pagination} noun="negócio" />
<BulkBar count={view.selection.count} noun="negócio" onClear={view.selection.clear}>…</BulkBar>`}
        >
          <FullExample />
        </Demo>
      </DocSection>

      <DocSection title="O que o hook devolve">
        <PropsTable
          rows={[
            ["view.rows", "T[]", "—", "Linhas da página atual (filtradas e ordenadas)."],
            ["view.filteredRows", "T[]", "—", "Todas as que passam no filtro, ordenadas: exportar, totais, “selecionar todos os N”."],
            ["view.filters", "FiltersApi", "—", "Para FilterBar, SavedViews, EmptyFilterResult (useFilters)."],
            ["view.sort", "useSort", "—", "Para DataTable sort={…} + Column.sortKey."],
            ["view.selection", "useSelection", "—", "Para selectionColumn e BulkBar. Ao filtrar, fica só com o que ainda aparece."],
            ["view.pagination", "props de Pagination", "—", "Espalhe: <Pagination {...view.pagination} />."],
            ["view.emptyKind", '"none" | "filtered" | null', "—", "Sem dados (Empty com próxima ação) ou pelo filtro (EmptyFilterResult com “Limpar”)."],
            ["view.total / view.shown", "number", "—", "Tamanho da coleção / quantos passam no filtro."],
            ["view.reset()", "() => void", "—", "Sem busca e filtros, ordenação padrão, seleção vazia."],
          ]}
        />
      </DocSection>

      <DocSection title="Opções">
        <PropsTable
          rows={[
            ["rowKey", "(row) => string", "—", "Obrigatório."],
            ["fields / search", "FilterField[] / (row) => texto[]", "—", "Mesmo contrato do useFilters."],
            ["sortBy / defaultSort", "{ chave: (row) => valor } / SortState", "—", "Mesmo contrato do useSort."],
            ["pageSize / pageSizeOptions", "number / number[]", "20 / —", "0 = sem paginação."],
            ["url", "boolean | string", "false", "Espelha q, f, m (E/OU), sort e page na URL. Prefixo (\"c_\") quando há duas listas na tela."],
            ["me / now", "string / Date", "—", "Pessoa atual (“sou eu”) e data de referência (testes, demonstração)."],
          ]}
        />
      </DocSection>

      <DocSection title="Recarregando sem pular" rule="Ao trocar página, ordenação ou filtro no servidor, as linhas atuais ficam (esmaecidas) com uma barra no topo. Esqueleto só no primeiro carregamento.">
        <Demo
          code={`// servidor: passe a página que chegou e o estado de carregamento
<DataTable rows={data?.items ?? []} loading={isFetching} … />   // sem linhas: esqueleto · com linhas: barra
<DataGrid rows={…} loading={isFetching} manualSort sort={sort} onSortChange={setSort} … />`}
        >
          <ServerExample />
        </Demo>
      </DocSection>

      <DocSection title="URL e servidor" rule="Tudo que estreita a lista vai para a URL: o link reproduz o recorte e o voltar do navegador funciona. No servidor, leia os mesmos parâmetros.">
        <CodeBlock
          code={`/negocios?q=aurora&f=stage~is~Proposta|Negociação&m=or&sort=valor.desc&page=2

// Peças soltas, quando a paginação e a ordenação são do servidor:
const [sort, setSort] = useUrlState<SortState>("sort", null, {
  serialize: (s) => (s ? \`\${s.key}.\${s.dir}\` : ""),
  parse: (raw) => { const [key, dir] = raw.split("."); return key ? { key, dir: dir === "asc" ? "asc" : "desc" } : null; },
});
const [page, setPage] = useUrlState("page", 1, { parse: Number, serialize: (n) => (n > 1 ? String(n) : "") });
const filters = useFilters([], { fields, url: true });            // só o estado; a filtragem é no servidor
const query = serializeFilters(filters.state);                    // mande para a API (mesma semântica de applyFilters)`}
        />
      </DocSection>

      <DocSection title="Regras">
        <Rules
          items={[
            { do: "useDataView em toda tela de lista: a ordem filtra → ordena → pagina e o reset da página já vêm certos.", dont: "Paginar antes de filtrar (a página 3 de um filtro com 1 página vira tabela vazia)." },
            { do: "Vazio por filtro com EmptyFilterResult (“Remover filtro”, “Limpar”); vazio de verdade com Empty e a próxima ação.", dont: "O mesmo “Nenhum resultado” para os dois casos." },
            { do: "Exportar o que está filtrado (view.filteredRows), com o nome do recorte no arquivo.", dont: "Exportar só a página visível." },
            { do: "Ação em massa diz quantos itens e pede ConfirmDialog quando é destrutiva.", dont: "Ação em massa sobre itens que o filtro escondeu." },
          ]}
        />
      </DocSection>
    </DocPage>
  );
}
