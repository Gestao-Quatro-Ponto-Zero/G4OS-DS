import { Plus } from "lucide-react";
import { useEffect, useState, type DragEvent } from "react";
import {
  Badge,
  Button,
  EntityMark,
  FilterBar,
  KanbanBoard,
  KanbanColumn,
  PageHeading,
  RecordCard,
  SegmentedControl,
  TableSearch,
  formatCurrency,
  formatPercent,
  notify,
  useFilters,
  type FilterField,
} from "@g4os/ds";
import { companyById, deals as initialDeals, go, me, repById, reps, sources, stages, today, useFrameParam, type Deal, type Stage } from "./data/crm";
import { CrmShell, NewDealModal } from "./shells/crm-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Pipeline de vendas",
  description: "Quadro de negócios por etapa com soma de valor, previsão ponderada, filtros, arrastar entre etapas e novo negócio.",
  category: "CRM",
  order: 1,
  height: 860,
} as const;

const here = "#/frame/crm-pipeline";
const money = (n: number) => formatCurrency(n, { compact: true });

const fields: FilterField<Deal>[] = [
  { key: "owner", label: "Responsável", type: "person", quick: true, accessor: (d) => d.owner, options: reps.map((r) => ({ value: r.id, label: r.name })) },
  { key: "source", label: "Origem", type: "enum", quick: true, accessor: (d) => d.source, options: sources.map((s) => ({ value: s, label: s })) },
  { key: "value", label: "Valor", type: "currency", accessor: (d) => d.value },
  { key: "age", label: "Dias na etapa", type: "number", unit: "dias", accessor: (d) => d.age },
  { key: "close", label: "Fechamento previsto", type: "date", accessor: (d) => d.close },
];

export default function CrmPipeline() {
  const [deals, setDeals] = useState(initialDeals);
  const [dragging, setDragging] = useState<string | null>(null);
  const [scope, setScope] = useState<"todos" | "meus">("todos");
  const [creating, setCreating] = useState(false);
  const novo = useFrameParam("novo");
  useEffect(() => {
    if (novo) setCreating(true);
  }, [novo]);

  const filters = useFilters(scope === "meus" ? deals.filter((d) => d.owner === me) : deals, {
    fields,
    search: (d) => [d.title, companyById(d.companyId).name, repById(d.owner).name],
    me,
    now: today,
    url: true,
  });
  const visible = filters.rows;
  const total = visible.reduce((s, d) => s + d.value, 0);
  const weighted = visible.reduce((s, d) => s + d.value * (stages.find((st) => st.id === d.stage)?.probability ?? 0), 0);

  const move = (id: string, stage: Stage) => {
    const deal = deals.find((d) => d.id === id);
    if (!deal || deal.stage === stage.id) return;
    const from = deal.stage;
    setDeals((all) => all.map((d) => (d.id === id ? { ...d, stage: stage.id, age: 0 } : d)));
    notify(`${companyById(deal.companyId).name} movido para ${stage.label}`, () => setDeals((all) => all.map((d) => (d.id === id ? { ...d, stage: from } : d))));
  };
  const drop = (stage: Stage) => (e: DragEvent) => {
    const id = e.dataTransfer.getData("text/plain") || dragging;
    setDragging(null);
    if (id) move(id, stage);
  };

  return (
    <CrmShell current={here}>
      <div className="page-inset flex h-full min-h-0 flex-col overflow-y-auto" data-ds-content="">
        <PageHeading
          sticky={false}
          title="Pipeline"
          description="Novos negócios B2B · funil padrão. Arraste um card para mudar de etapa."
          actions={
            <>
              <SegmentedControl
                label="Escopo"
                value={scope}
                onChange={setScope}
                options={[
                  { value: "todos", label: "Todos" },
                  { value: "meus", label: "Meus" },
                ]}
              />
              <Button onClick={() => setCreating(true)}>
                <Plus /> Novo negócio
              </Button>
            </>
          }
        />

        {/* Previsão: total, ponderado e distribuição por etapa */}
        <div className="mt-5 grid shrink-0 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-3">
          <div className="bg-surface px-4 py-3">
            <div className="text-[12px] text-muted">Em aberto</div>
            <div className="mt-0.5 text-[18px] font-semibold tabular-nums tracking-tight">{formatCurrency(total, { cents: false })}</div>
            <div className="text-[12px] text-muted">{visible.length} negócios</div>
          </div>
          <div className="bg-surface px-4 py-3">
            <div className="text-[12px] text-muted">Previsão ponderada</div>
            <div className="mt-0.5 text-[18px] font-semibold tabular-nums tracking-tight">{formatCurrency(weighted, { cents: false })}</div>
            <div className="text-[12px] text-muted">valor × probabilidade da etapa</div>
          </div>
          <div className="bg-surface px-4 py-3">
            <div className="text-[12px] text-muted">Distribuição do valor</div>
            <div className="mt-2 flex h-2 w-full gap-[2px] overflow-hidden rounded-full" role="img" aria-label="Valor em aberto por etapa">
              {stages.map((st) => {
                const v = visible.filter((d) => d.stage === st.id).reduce((s, d) => s + d.value, 0);
                return v ? <span key={st.id} title={`${st.label}: ${money(v)}`} style={{ width: `${(v / (total || 1)) * 100}%`, background: st.color }} /> : null;
              })}
            </div>
            <div className="mt-1.5 flex flex-wrap gap-x-3 text-[11px] text-muted">
              {stages.map((st) => (
                <span key={st.id} className="inline-flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: st.color }} />
                  {st.label.slice(0, 4)}. {formatPercent(st.probability, 0)}
                </span>
              ))}
            </div>
          </div>
        </div>

        <FilterBar
          className="mt-4 shrink-0"
          filters={filters}
          noun="negócio"
          search={<TableSearch value={filters.state.query} onChange={filters.setQuery} total={deals.length} noun="negócio" searchIn="título, empresa e responsável" />}
        />

        <div className="mt-4 flex min-h-[440px] flex-1 flex-col">
          <KanbanBoard className="h-full">
            {stages.map((st) => {
              const list = visible.filter((d) => d.stage === st.id);
              return (
                <KanbanColumn key={st.id} title={st.label} count={list.length} dotColor={st.color} meta={money(list.reduce((s, d) => s + d.value, 0))} onDrop={drop(st)} width={212}>
                  {list.map((d) => {
                    const c = companyById(d.companyId);
                    return (
                      <RecordCard
                        key={d.id}
                        title={c.name}
                        subtitle={d.title}
                        value={formatCurrency(d.value, { cents: false })}
                        leading={<EntityMark name={c.name} tint={c.tint} className="h-7 w-7 text-[11px]" />}
                        tags={
                          <>
                            <Badge>{d.source}</Badge>
                            {d.hot && <Badge tone="accent">Prioridade</Badge>}
                          </>
                        }
                        owner={repById(d.owner)}
                        meta={d.age > 30 ? <span className="font-medium text-amber">{d.age} dias parado</span> : d.age === 0 ? "entrou hoje" : `${d.age} dias na etapa`}
                        tone={d.age > 30 ? "warn" : undefined}
                        onOpen={() => go("crm-deal", d.id)}
                        onDragStart={(e) => {
                          e.dataTransfer.setData("text/plain", d.id);
                          setDragging(d.id);
                        }}
                      />
                    );
                  })}
                  {!list.length && <p className="m-0 rounded-lg border border-dashed border-line px-3 py-6 text-center text-[12px] text-muted">Solte um negócio aqui</p>}
                </KanbanColumn>
              );
            })}
          </KanbanBoard>
        </div>
      </div>
      <NewDealModal
        open={creating}
        onClose={() => setCreating(false)}
        onCreate={(d) => {
          setDeals((all) => [d, ...all]);
          notify(`${companyById(d.companyId).name} entrou em ${stages.find((s) => s.id === d.stage)?.label}`, () => setDeals((all) => all.filter((x) => x.id !== d.id)));
        }}
      />
    </CrmShell>
  );
}
