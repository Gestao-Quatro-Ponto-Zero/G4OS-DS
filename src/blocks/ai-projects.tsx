import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Avatar,
  Badge,
  Button,
  DataTable,
  EmptyFilterResult,
  FilterBar,
  Highlight,
  InputModal,
  KpiCard,
  KpiGrid,
  Page,
  PageHeading,
  TableSearch,
  formatCurrency,
  formatDuration,
  formatNumber,
  notify,
  useFilters,
  type Column,
  type FilterField, PageToolbar
} from "@g4ai/ds";
import { AgentShell, agentRoutes } from "./shells/agent-shell";
import { go } from "./shells/frame-route";
import { ownerOf, projects, statusLabel, statusTone, type AgentProject } from "./data/agent";
import { people } from "./data/workspace";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Projetos do agente",
  description: "Lista de análises feitas pelo agente com status, dono, tempo, artefatos e custo; filtros, busca e nova análise que abre o workspace.",
  category: "IA",
  order: 1,
  height: 820,
  concept: {
    goal: "Achar e reabrir análises feitas pelo agente, com status, dono e custo, para o time acompanhar o que a IA produziu.",
    patterns: [
      "Anatomia A · Lista: cabeçalho fixo + PageToolbar colada (filtros e busca local)",
      "KPIs curtos no topo (em andamento, concluídas, custo)",
      "Uma ação primária: Nova análise (InputModal) que abre o workspace",
      "Linha abre o projeto (?id=)",
    ],
    adapt: [
      "Relatórios gerados, execuções de automação, campanhas: troque colunas e status",
    ],
    avoid: [
      "Filtros fora da PageToolbar (somem ao rolar)",
    ],
  },
} as const;

const fields: FilterField<AgentProject>[] = [
  { key: "status", label: "Status", type: "enum", quick: true, accessor: (p) => p.status, options: (Object.keys(statusLabel) as AgentProject["status"][]).map((s) => ({ value: s, label: statusLabel[s] })) },
  { key: "agent", label: "Agente", type: "enum", quick: true, accessor: (p) => p.agent, options: ["Analista de receita", "Analista financeiro", "Pesquisa de mercado", "Operações"].map((a) => ({ value: a, label: a })) },
  { key: "owner", label: "Dono", type: "person", accessor: (p) => p.owner, options: people.filter((p) => p.status === "ativo").map((p) => ({ value: p.id, label: p.name })) },
  { key: "artifacts", label: "Artefatos", type: "number", accessor: (p) => p.artifacts, unit: "artefatos" },
];

export default function AiProjects() {
  const [asking, setAsking] = useState(false);
  const filters = useFilters(projects, { fields, search: (p) => [p.title, p.question, p.agent, ownerOf(p).name], me: "joana", url: "p_" });
  const q = filters.state.query;
  const totals = useMemo(() => ({ runs: projects.length, waiting: projects.filter((p) => p.status === "aguardando").length, cost: projects.reduce((s, p) => s + p.cost, 0), tokens: projects.reduce((s, p) => s + p.tokens, 0) }), []);

  const columns: Column<AgentProject>[] = [
    {
      key: "title",
      header: "Análise",
      primary: true,
      cell: (p) => (
        <div className="min-w-0">
          <div className="truncate font-medium">
            <Highlight text={p.title} query={q} />
          </div>
          <div className="truncate text-[12px] font-normal text-muted">
            <Highlight text={p.question} query={q} />
          </div>
        </div>
      ),
    },
    { key: "status", header: "Status", nowrap: true, cell: (p) => <Badge tone={statusTone[p.status]}>{statusLabel[p.status]}</Badge> },
    { key: "agent", header: "Agente", mobileHidden: true, cell: (p) => <span className="text-ink-soft">{p.agent}</span> },
    {
      key: "owner",
      header: "Dono",
      cell: (p) => {
        const o = ownerOf(p);
        return (
          <span className="inline-flex items-center gap-2">
            <Avatar initials={o.initials} tint={o.tint} size="sm" name={o.name} />
            <span className="truncate">{o.name.split(" ")[0]}</span>
          </span>
        );
      },
    },
    { key: "run", header: "Última execução", nowrap: true, cell: (p) => <span className="tabular-nums text-ink-soft">{p.lastRun} · {formatDuration(p.durationMs)}</span> },
    { key: "artifacts", header: "Artefatos", align: "right", cell: (p) => <span className="tabular-nums">{p.artifacts}</span> },
    { key: "cost", header: "Custo", align: "right", mobileHidden: true, cell: (p) => <span className="tabular-nums text-muted">{formatCurrency(p.cost)}</span> },
  ];

  return (
    <AgentShell current={agentRoutes.projects}>
      <Page>
        <PageHeading
          title="Projetos"
          description="Cada projeto é uma pergunta de negócio que o agente investigou, com o que produziu e quanto custou."
          actions={
            <Button onClick={() => setAsking(true)}>
              <Plus /> Nova análise
            </Button>
          }
        />
        <KpiGrid cols={4} className="mt-6">
          <KpiCard label="Análises no mês" value={formatNumber(totals.runs)} delta={0.33} period="vs. agosto" />
          <KpiCard label="Aguardando você" value={formatNumber(totals.waiting)} hint="ações que precisam de aprovação" href={`${agentRoutes.conversation}`} />
          <KpiCard label="Tokens usados" value={formatNumber(totals.tokens)} hint="de 2 milhões no plano" />
          <KpiCard label="Custo no mês" value={formatCurrency(totals.cost)} delta={0.12} goodWhen="down" period="vs. agosto" />
        </KpiGrid>
        <div className="mt-6 space-y-3">
          <PageToolbar>
            <FilterBar filters={filters} noun="análise" nounPlural="análises" search={<TableSearch value={q} onChange={filters.setQuery} total={projects.length} noun="análise" nounPlural="análises" searchIn="título, pergunta, agente e dono" />} />
          </PageToolbar>
          <DataTable
            rows={filters.rows}
            columns={columns}
            rowKey={(p) => p.id}
            rowLabel={(p) => `Abrir ${p.title}`}
            onRowClick={(p) => go("ai-workspace", p.id)}
            empty={<EmptyFilterResult filters={filters} noun="análise" nounPlural="análises" />}
          />
        </div>
      </Page>
      <InputModal
        open={asking}
        onClose={() => setAsking(false)}
        title="Nova análise"
        description="Escreva a pergunta de negócio. O agente planeja, busca os dados e volta com relatório e artefatos."
        placeholder="Ex.: Por que o ticket médio caiu no Sul?"
        submitLabel="Começar análise"
        suggestions={["Quais contas têm risco de churn?", "Onde estamos perdendo margem?", "Qual canal traz os clientes mais rentáveis?"]}
        onSubmit={(v) => {
          setAsking(false);
          notify(`Análise iniciada: “${v}”`, undefined, "info");
          go("ai-workspace", "p3");
        }}
      />
    </AgentShell>
  );
}
