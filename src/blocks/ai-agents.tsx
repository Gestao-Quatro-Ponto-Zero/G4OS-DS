import { Bot, Copy, History, LayoutGrid, Pause, PencilLine, Play, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import {
  ActionMenu,
  AgentComposer,
  AppIcon,
  Avatar,
  Button,
  DataTable,
  EmptyFilterResult,
  FilterBar,
  HealthDot,
  Highlight,
  Page,
  PageHeading,
  PageToolbar,
  Pagination,
  SavedViews,
  SortHeader,
  Sparkline,
  StatCell,
  StatGrid,
  TableSearch,
  ToolGlyph,
  formatCurrency,
  formatNumber,
  formatPercent,
  notify,
  useFilters,
  usePagination,
  useSavedViews,
  useSort,
  type Column,
  type FilterField,
  type SavedView,
} from "@g4ai/ds";
import { apps } from "./data/agent-builder";
import { agentStatusLabel, agentStatusTone, agents as seed, areas, budgetUse, modelById, models, ownerOfAgent, templates, type AgentStatus, type FleetAgent } from "./data/agents";
import { people } from "./data/workspace";
import { AgentListError, AgentListSkeleton, AgentShell, agentRoutes, useAgentDemoState } from "./shells/agent-shell";
import { go, useFrameParam } from "./shells/frame-route";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Frota de agentes",
  description: "Todos os agentes da empresa: status com palavra, dono, modelo, versão em produção, execuções dos últimos 7 dias, sucesso e custo contra o orçamento. Visões salvas, filtros, busca e os cinco estados (?estado=carregando|vazio|erro).",
  category: "IA",
  order: 10,
  height: 1000,
  concept: {
    goal: "Saber de relance quais agentes a empresa tem, quem é dono de cada um e quais pedem atenção (erro, orçamento estourando).",
    patterns: [
      "Anatomia A · Lista: cabeçalho fixo + PageToolbar colada (visões salvas, filtros, busca)",
      "Status = ponto + palavra; linha com erro ou orçamento acima de 90 % ganha faixa",
      "Execuções em Sparkline de 7 dias; custo com a fração do orçamento ao lado",
      "Linha abre o registro do agente; ⋯ com editar, execuções, pausar e duplicar",
      "Vazio vira 'O que você quer automatizar?' com campo de pedido e modelos sugeridos",
    ],
    adapt: [
      "Catálogo de automações, robôs de RPA, integrações agendadas: troque modelo por conector",
      "Sem orçamento por agente? Troque a coluna de custo por 'última execução'",
    ],
    avoid: [
      "Badge colorido sem palavra para o status",
      "Mostrar só o total de execuções sem a tendência",
      "Vazio sem próxima ação (um app de agentes começa pelo pedido)",
    ],
  },
} as const;

const me = "joana";
const fields: FilterField<FleetAgent>[] = [
  { key: "status", label: "Status", type: "enum", quick: true, accessor: (a) => a.status, options: (Object.keys(agentStatusLabel) as AgentStatus[]).map((s) => ({ value: s, label: agentStatusLabel[s] })) },
  { key: "area", label: "Área", type: "enum", quick: true, accessor: (a) => a.area, options: areas.map((x) => ({ value: x, label: x })) },
  { key: "owner", label: "Dono", type: "person", accessor: (a) => a.owner, options: people.filter((p) => p.status === "ativo").map((p) => ({ value: p.id, label: p.name })) },
  { key: "model", label: "Modelo", type: "enum", accessor: (a) => a.model, options: models.map((m) => ({ value: m.id, label: m.name })) },
  { key: "cost", label: "Custo no mês", type: "currency", accessor: (a) => a.cost30d },
  { key: "success", label: "Sucesso (30 dias)", type: "number", unit: "%", accessor: (a) => Math.round(a.successRate * 1000) / 10 },
];
const views: SavedView[] = [
  { id: "todos", label: "Todos", system: true, state: { query: "", conditions: [] } },
  { id: "meus", label: "Meus", system: true, state: { query: "", conditions: [{ id: "m", field: "owner", op: "me" }] } },
  { id: "atencao", label: "Com erro", system: true, state: { query: "", conditions: [{ id: "e", field: "status", op: "is", value: ["erro"] }] } },
  { id: "parados", label: "Pausados e rascunhos", system: true, state: { query: "", conditions: [{ id: "p", field: "status", op: "is", value: ["pausado", "rascunho"] }] } },
];

const suggestions = templates.filter((t) => ["t-sdr", "t-cobranca", "t-triagem", "t-meet"].includes(t.id));

export default function AiAgents() {
  const estado = useAgentDemoState();
  const [list, setList] = useState(seed);
  const visible = estado === "vazio" ? [] : list;
  const filters = useFilters(visible, { fields, me, search: (a) => [a.name, a.purpose, a.area, ownerOfAgent(a).name, modelById(a.model).name], url: true });
  const saved = useSavedViews(filters, views, "ai-agentes-visoes");
  const q = filters.state.query;
  // Vindo do painel ("Com erro" → #/frame/ai-agents?visao=atencao).
  const hashView = useFrameParam("visao");
  const { setState } = filters;
  useEffect(() => {
    const v = views.find((x) => x.id === hashView);
    if (v) setState(v.state);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hashView]);
  const sort = useSort(filters.rows, { nome: (a) => a.name, runs: (a) => a.runs7d.reduce((s, n) => s + n, 0), sucesso: (a) => a.successRate, custo: (a) => a.cost30d }, { key: "runs", dir: "desc" });
  const pages = usePagination(sort.rows, 10, { resetKey: [filters.state, sort.sort] });
  const [prompt, setPrompt] = useState("");

  const active = list.filter((a) => a.status === "ativo").length;
  const runs7 = list.reduce((s, a) => s + a.runs7d.reduce((x, n) => x + n, 0), 0);
  const spent = list.reduce((s, a) => s + a.cost30d, 0);
  const budget = list.reduce((s, a) => s + a.budget, 0);
  const attention = list.filter((a) => a.status === "erro" || budgetUse(a) > 0.9).length;

  const setStatus = (a: FleetAgent, status: AgentStatus) => {
    const before = a.status;
    setList((all) => all.map((x) => (x.id === a.id ? { ...x, status } : x)));
    notify(status === "pausado" ? `${a.name} pausado: novos gatilhos ficam na fila` : `${a.name} retomado`, () => setList((all) => all.map((x) => (x.id === a.id ? { ...x, status: before } : x))));
  };

  const columns: Column<FleetAgent>[] = [
    {
      key: "name",
      header: <SortHeader label="Agente" {...sort.header("nome")} />,
      primary: true,
      cell: (a) => (
        <span className="flex items-center gap-2.5">
          <AppIcon icon={Bot} color="var(--ds-primary)" size="sm" variant="soft" />
          <span className="min-w-0">
            <Highlight text={a.name} query={q} className="block truncate font-medium" />
            <span className="block truncate text-[12px] font-normal text-muted">
              {a.area} · {a.trigger.text}
            </span>
          </span>
        </span>
      ),
    },
    { key: "status", header: "Status", nowrap: true, cell: (a) => <HealthDot tone={agentStatusTone[a.status]} label={agentStatusLabel[a.status]} /> },
    {
      key: "owner",
      header: "Dono",
      nowrap: true,
      mobileHidden: true,
      cell: (a) => {
        const p = ownerOfAgent(a);
        return (
          <span className="flex items-center gap-2">
            <Avatar initials={p.initials} tint={p.tint} name={p.name} size="xs" />
            <span className="truncate">{p.name.split(" ")[0]}</span>
          </span>
        );
      },
    },
    {
      key: "model",
      header: "Modelo · versão",
      nowrap: true,
      cell: (a) => (
        <span className="block leading-tight">
          <span className="block">{modelById(a.model).name}</span>
          <span className="block text-[12px] tabular-nums text-muted">{a.version ? `v${a.version} em produção` : "nunca publicado"}</span>
        </span>
      ),
    },
    {
      key: "runs",
      header: <SortHeader label="Execuções (7 dias)" {...sort.header("runs")} />,
      nowrap: true,
      cell: (a) => (
        <span className="flex items-center gap-2">
          <Sparkline values={a.runs7d} tone={a.status === "erro" ? "bad" : "neutral"} width={64} height={22} area={false} />
          <span className="w-12 text-right text-[12.5px] tabular-nums">{formatNumber(a.runs7d.reduce((s, n) => s + n, 0))}</span>
        </span>
      ),
    },
    {
      key: "success",
      header: <SortHeader label="Sucesso" align="right" {...sort.header("sucesso")} />,
      align: "right",
      nowrap: true,
      cell: (a) => <span className={a.successRate < 0.9 ? "font-medium tabular-nums text-rose" : "tabular-nums"}>{a.runs30d ? formatPercent(a.successRate) : "—"}</span>,
    },
    {
      key: "cost",
      header: <SortHeader label="Custo no mês" align="right" {...sort.header("custo")} />,
      align: "right",
      nowrap: true,
      cell: (a) => (
        <span className="block leading-tight">
          <span className="block font-medium tabular-nums">{formatCurrency(a.cost30d, { cents: false })}</span>
          <span className={budgetUse(a) > 0.9 ? "block text-[12px] tabular-nums text-amber" : "block text-[12px] tabular-nums text-muted"}>{formatPercent(budgetUse(a), 0)} do orçamento</span>
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      action: true,
      cell: (a) => (
        <ActionMenu
          label={`Ações de ${a.name}`}
          actions={[
            { label: "Abrir agente", onSelect: () => go("ai-agent", a.id) },
            { label: "Editar no construtor", icon: <PencilLine className="h-4 w-4" />, onSelect: () => go("ai-agent-builder", a.id) },
            { label: "Ver execuções", icon: <History className="h-4 w-4" />, onSelect: () => go("ai-runs", { agente: a.id }) },
            { label: "Duplicar como rascunho", icon: <Copy className="h-4 w-4" />, onSelect: () => go("ai-agent-builder", { de: a.id }) },
            a.status === "pausado"
              ? { label: "Retomar", icon: <Play className="h-4 w-4" />, separator: true, onSelect: () => setStatus(a, "ativo") }
              : { label: "Pausar", icon: <Pause className="h-4 w-4" />, separator: true, disabled: a.status === "rascunho", onSelect: () => setStatus(a, "pausado") },
          ]}
        />
      ),
    },
  ];

  return (
    <AgentShell current={agentRoutes.agents}>
      <Page>
        <PageHeading
          title="Agentes"
          description="Os agentes de IA da Acme em produção e em rascunho. Custo e sucesso dos últimos 30 dias."
          actions={
            <>
              <Button variant="ghost" href={agentRoutes.templates}>
                <LayoutGrid /> Descobrir modelos
              </Button>
              <Button href={`${agentRoutes.builder}?novo=1`}>
                <Plus /> Novo agente
              </Button>
            </>
          }
        />
        {estado !== "vazio" && (
          <StatGrid cols={4}>
            <StatCell label="Ativos" value={`${active} de ${list.length}`} hint={`${list.filter((a) => a.status === "rascunho").length} em rascunho`} />
            <StatCell label="Execuções em 7 dias" value={formatNumber(runs7)} hint="todas as versões" />
            <StatCell label="Custo no mês" value={formatCurrency(spent, { cents: false })} hint={`${formatPercent(spent / budget, 0)} do orçamento somado`} />
            <StatCell label="Pedem atenção" value={attention} hint="com erro ou acima de 90 % do orçamento" tone={attention ? "warn" : undefined} />
          </StatGrid>
        )}
        <div className="mt-6 space-y-4">
          {estado !== "vazio" && (
            <PageToolbar>
              <SavedViews views={saved} counts={Object.fromEntries(views.map((v) => [v.id, filters.countFor(v.state)]))} />
              <FilterBar filters={filters} noun="agente" search={<TableSearch value={q} onChange={filters.setQuery} total={visible.length} noun="agente" searchIn="nome, objetivo, área, dono e modelo" />} />
            </PageToolbar>
          )}
          {estado === "carregando" ? (
            <AgentListSkeleton label="Carregando agentes" />
          ) : estado === "erro" ? (
            <AgentListError noun="os agentes" />
          ) : !visible.length ? (
            <section aria-labelledby="vazio-titulo" className="flex flex-col items-center rounded-2xl border border-line bg-surface px-5 py-10 sm:px-10">
              <div className="w-full max-w-[640px] text-center">
                <span className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-soft text-ink">
                  <Bot className="h-5 w-5" />
                </span>
                <h2 id="vazio-titulo" className="m-0 mt-4 text-[20px] font-semibold tracking-tight">
                  O que você quer automatizar?
                </h2>
                <p className="m-0 mt-1.5 text-[13.5px] text-muted">Descreva a tarefa como pediria a uma pessoa do time. O agente nasce como rascunho e só roda depois que você publicar.</p>
              </div>
              <div className="mt-6 w-full max-w-[640px]">
                <AgentComposer
                  value={prompt}
                  onChange={setPrompt}
                  onSubmit={(v) => v.trim() && go("ai-agent-builder", { pedido: v.trim() })}
                  placeholder="Ex.: toda manhã, lembre clientes de boletos vencidos e me peça aprovação para parcelar"
                />
              </div>
              <div className="mt-8 w-full max-w-[880px]">
                <p className="m-0 mb-3 text-[12px] font-medium text-muted">Ou comece por um modelo</p>
                <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-4">
                  {suggestions.map((t) => (
                    <li key={t.id}>
                      <a href={`${agentRoutes.builder}?modelo=${t.id}`} className="flex h-full flex-col rounded-xl border border-line bg-surface p-3.5 text-left transition-colors hover:border-line-strong hover:bg-soft/40">
                        <span className="flex gap-1">
                          {t.apps.slice(0, 3).map((id) => (
                            <ToolGlyph key={id} name={apps[id].name} color={apps[id].color} />
                          ))}
                        </span>
                        <span className="mt-2.5 text-[13.5px] font-medium">{t.name}</span>
                        <span className="mt-1 line-clamp-2 text-[12px] leading-snug text-muted">{t.description}</span>
                      </a>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 text-center">
                  <Button variant="ghost" size="sm" href={agentRoutes.templates}>
                    Ver os {templates.length} modelos
                  </Button>
                </div>
              </div>
            </section>
          ) : (
            <>
              <DataTable
                label="Agentes"
                rows={pages.rows}
                columns={columns}
                rowKey={(a) => a.id}
                onRowClick={(a) => go("ai-agent", a.id)}
                rowLabel={(a) => `Abrir ${a.name}`}
                rowTone={(a) => (a.status === "erro" ? "bad" : budgetUse(a) > 0.9 ? "warn" : undefined)}
                empty={<EmptyFilterResult filters={filters} noun="agente" />}
              />
              <Pagination page={pages.page} pageCount={pages.pageCount} onPage={pages.setPage} total={pages.total} pageSize={pages.pageSize} noun="agente" />
            </>
          )}
        </div>
      </Page>
    </AgentShell>
  );
}
