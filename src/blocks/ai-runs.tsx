import { Download } from "lucide-react";
import { useEffect, useMemo } from "react";
import {
  Button,
  DataTable,
  Empty,
  EmptyFilterResult,
  FilterBar,
  Highlight,
  Page,
  PageHeading,
  PageToolbar,
  Pagination,
  SavedViews,
  SortHeader,
  StatCell,
  StatGrid,
  TableSearch,
  downloadCsv,
  formatCurrency,
  formatDuration,
  formatNumber,
  gridToCsv,
  notify,
  useFilters,
  usePagination,
  useSavedViews,
  useSort,
  type Column,
  type FilterField,
  type GridColumn,
  type SavedView,
} from "@g4ai/ds";
import { NOW, agentById, agents, runStatusLabel, runWhen, runs, triggerKindLabel, type Run, type RunStatus, type TriggerKind } from "./data/agents";
import { AgentListError, AgentListSkeleton, AgentShell, RunStatusLabel, agentRoutes, useAgentDemoState } from "./shells/agent-shell";
import { go, useFrameParam } from "./shells/frame-route";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Execuções de agentes",
  description: "Todas as execuções da frota: agente, status com palavra, gatilho, início, duração, tokens e custo. Filtros por agente, status, gatilho e período, p95 do recorte, CSV e os cinco estados (?estado=carregando|vazio|erro). Linha abre a execução.",
  category: "IA",
  order: 11,
  height: 980,
  concept: {
    goal: "Achar a execução certa (a que falhou, a que custou caro, a que está esperando alguém) e abrir o passo a passo dela.",
    patterns: [
      "Anatomia A · Lista: cabeçalho fixo + PageToolbar colada (visões salvas, filtros, busca)",
      "Resumo do recorte acima da tabela: total, falhas, p95 e custo mudam com o filtro",
      "Status = ponto + palavra; falha pinta a linha; número à direita com tabular-nums",
      "Vindo de outra tela, o filtro chega pela URL (?agente=, ?status=)",
    ],
    adapt: [
      "Jobs de integração, sincronizações, rotinas agendadas de ERP",
      "Fora de IA troque tokens por registros processados",
    ],
    avoid: [
      "Log em texto corrido sem status por execução",
      "Custo sem unidade ou sem total do recorte",
    ],
  },
} as const;

const statuses = Object.keys(runStatusLabel) as RunStatus[];
const kinds = Object.keys(triggerKindLabel) as TriggerKind[];
const fields: FilterField<Run>[] = [
  { key: "agent", label: "Agente", type: "enum", quick: true, accessor: (r) => r.agentId, options: agents.map((a) => ({ value: a.id, label: a.name })) },
  { key: "status", label: "Status", type: "enum", quick: true, accessor: (r) => r.status, options: statuses.map((s) => ({ value: s, label: runStatusLabel[s] })) },
  { key: "trigger", label: "Gatilho", type: "enum", quick: true, accessor: (r) => r.trigger.kind, options: kinds.map((k) => ({ value: k, label: triggerKindLabel[k] })) },
  { key: "date", label: "Início", type: "date", accessor: (r) => r.startedAt.slice(0, 10) },
  { key: "cost", label: "Custo", type: "currency", accessor: (r) => r.cost },
  { key: "duration", label: "Duração (s)", type: "number", unit: "s", accessor: (r) => Math.round(r.durationMs / 1000) },
];
const views: SavedView[] = [
  { id: "todas", label: "Todas", system: true, state: { query: "", conditions: [] } },
  { id: "falhas", label: "Falhas", system: true, state: { query: "", conditions: [{ id: "s", field: "status", op: "is", value: ["falhou"] }] } },
  { id: "aguardando", label: "Aguardando aprovação", system: true, state: { query: "", conditions: [{ id: "a", field: "status", op: "is", value: ["aguardando"] }] } },
  { id: "hoje", label: "Hoje", system: true, state: { query: "", conditions: [{ id: "d", field: "date", op: "today" }] } },
];

const csvColumns: GridColumn<Run>[] = [
  { key: "id", header: "Execução", value: (r) => r.id },
  { key: "agent", header: "Agente", value: (r) => agentById(r.agentId)?.name ?? r.agentId },
  { key: "status", header: "Status", value: (r) => runStatusLabel[r.status] },
  { key: "start", header: "Início", value: (r) => r.startedAt },
  { key: "ms", header: "Duração (ms)", value: (r) => r.durationMs },
  { key: "tokens", header: "Tokens", value: (r) => r.tokensIn + r.tokensOut },
  { key: "cost", header: "Custo (R$)", value: (r) => r.cost },
];

const p95 = (list: Run[]) => {
  if (!list.length) return 0;
  const s = [...list].map((r) => r.durationMs).sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor(s.length * 0.95))];
};

export default function AiRuns() {
  const estado = useAgentDemoState();
  const visible = useMemo(() => (estado === "vazio" ? [] : runs), [estado]);
  const filters = useFilters(visible, { fields, now: NOW, search: (r) => [r.id, r.subject, agentById(r.agentId)?.name, r.error], url: true });
  const saved = useSavedViews(filters, views, "ai-execucoes-visoes");
  const q = filters.state.query;

  // Vindo do agente (?agente=sdr-inbound) ou do painel (?status=falhou).
  const fromAgent = useFrameParam("agente");
  const fromStatus = useFrameParam("status");
  const { setState } = filters;
  useEffect(() => {
    const conditions = [
      ...(fromAgent ? [{ id: "ag", field: "agent", op: "is" as const, value: [fromAgent] }] : []),
      ...(fromStatus ? [{ id: "st", field: "status", op: "is" as const, value: [fromStatus] }] : []),
    ];
    if (conditions.length) setState({ query: "", conditions });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromAgent, fromStatus]);

  const sort = useSort(filters.rows, { inicio: (r) => r.startedAt, duracao: (r) => r.durationMs, tokens: (r) => r.tokensIn + r.tokensOut, custo: (r) => r.cost }, { key: "inicio", dir: "desc" });
  const pages = usePagination(sort.rows, 15, { resetKey: [filters.state, sort.sort] });
  const shown = filters.rows;
  const failed = shown.filter((r) => r.status === "falhou").length;

  const columns: Column<Run>[] = [
    {
      key: "run",
      header: "Execução",
      primary: true,
      cell: (r) => (
        <span className="block min-w-0 leading-tight">
          <Highlight text={r.subject} query={q} className="block truncate font-medium" />
          <span className="block truncate text-[12px] font-normal text-muted">
            <Highlight text={r.id} query={q} className="font-mono text-[11.5px]" /> · {agentById(r.agentId)?.name} · v{r.version}
          </span>
        </span>
      ),
    },
    { key: "status", header: "Status", nowrap: true, cell: (r) => <RunStatusLabel status={r.status} /> },
    { key: "trigger", header: "Gatilho", nowrap: true, mobileHidden: true, cell: (r) => <span className="text-muted">{r.trigger.by ? `Manual · ${r.trigger.text.replace(/^(Disparado por|Pergunta de|Teste de) /, "").split(" ")[0]}` : triggerKindLabel[r.trigger.kind]}</span> },
    { key: "start", header: <SortHeader label="Início" {...sort.header("inicio")} />, nowrap: true, cell: (r) => <span className="tabular-nums text-muted">{runWhen(r.startedAt)}</span> },
    { key: "duration", header: <SortHeader label="Duração" align="right" {...sort.header("duracao")} />, align: "right", nowrap: true, cell: (r) => <span className="tabular-nums">{formatDuration(r.durationMs)}</span> },
    { key: "tokens", header: <SortHeader label="Tokens" align="right" {...sort.header("tokens")} />, align: "right", nowrap: true, mobileHidden: true, cell: (r) => <span className="tabular-nums text-muted">{formatNumber(r.tokensIn + r.tokensOut)}</span> },
    { key: "cost", header: <SortHeader label="Custo" align="right" {...sort.header("custo")} />, align: "right", nowrap: true, cell: (r) => <span className="font-medium tabular-nums">{formatCurrency(r.cost)}</span> },
  ];

  return (
    <AgentShell current={agentRoutes.runs}>
      <Page>
        <PageHeading
          title="Execuções"
          description="Cada vez que um agente rodou, em qualquer versão. Abra uma execução para ver o passo a passo, a saída e o custo."
          actions={
            <Button
              variant="ghost"
              disabled={!shown.length}
              disabledReason="Nenhuma execução no recorte atual"
              onClick={() => {
                downloadCsv("execucoes-agentes", gridToCsv(sort.rows, csvColumns));
                notify(`${formatNumber(shown.length)} execuções exportadas em CSV`);
              }}
            >
              <Download /> Exportar CSV
            </Button>
          }
        />
        <div className="space-y-4">
          {estado !== "vazio" && (
            <PageToolbar>
              <SavedViews views={saved} counts={Object.fromEntries(views.map((v) => [v.id, filters.countFor(v.state)]))} />
              <FilterBar filters={filters} noun="execução" nounPlural="execuções" search={<TableSearch value={q} onChange={filters.setQuery} total={visible.length} noun="execução" nounPlural="execuções" searchIn="id, assunto, agente e erro" />} />
            </PageToolbar>
          )}
          {estado === "carregando" ? (
            <AgentListSkeleton rows={8} label="Carregando execuções" />
          ) : estado === "erro" ? (
            <AgentListError noun="as execuções" />
          ) : !visible.length ? (
            <Empty
              title="Nenhuma execução ainda"
              hint="Quando um agente publicado rodar (por evento, agenda ou API), a execução aparece aqui com o passo a passo."
              action={<Button href={agentRoutes.agents}>Ver agentes</Button>}
            />
          ) : (
            <>
              <StatGrid cols={4}>
                <StatCell label="Execuções no recorte" value={formatNumber(shown.length)} hint={`${shown.filter((r) => r.status === "executando").length} rodando agora`} />
                <StatCell label="Falhas" value={formatNumber(failed)} hint={shown.length ? `${Math.round((failed / shown.length) * 100)} % do recorte` : "—"} tone={failed ? "bad" : undefined} />
                <StatCell label="Duração p95" value={shown.length ? formatDuration(p95(shown)) : "—"} hint="95 % terminam abaixo disso" />
                <StatCell label="Custo" value={formatCurrency(shown.reduce((s, r) => s + r.cost, 0))} hint={`${formatNumber(shown.reduce((s, r) => s + r.tokensIn + r.tokensOut, 0))} tokens`} />
              </StatGrid>
              <DataTable
                label="Execuções"
                rows={pages.rows}
                columns={columns}
                rowKey={(r) => r.id}
                onRowClick={(r) => go("ai-agent-run", r.id)}
                rowLabel={(r) => `Abrir execução ${r.id}`}
                rowTone={(r) => (r.status === "falhou" ? "bad" : r.status === "aguardando" ? "warn" : undefined)}
                empty={<EmptyFilterResult filters={filters} noun="execução" nounPlural="execuções" />}
              />
              <Pagination page={pages.page} pageCount={pages.pageCount} onPage={pages.setPage} total={pages.total} pageSize={pages.pageSize} noun="execução" nounPlural="execuções" />
            </>
          )}
        </div>
      </Page>
    </AgentShell>
  );
}
