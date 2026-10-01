import { Pencil, UserPlus } from "lucide-react";
import { useState } from "react";
import {
  Avatar,
  Badge,
  BulletChart,
  BumpChart,
  Button,
  ChartCard,
  CurrencyField,
  DataTable,
  IconButton,
  KpiCard,
  KpiGrid,
  Modal,
  Page,
  PageHeading,
  SegmentedControl,
  SlopeChart,
  formatCurrency,
  formatPercent,
  notify,
  type Column,
} from "@g4os/ds";
import { activities, daysFromToday, deals, reps as baseReps, type Rep } from "./data/crm";
import { CrmShell } from "./shells/crm-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Time e metas",
  description: "Atingimento de meta por vendedor (bullet), evolução do ranking (bump), trimestre contra o anterior (slope) e edição de meta.",
  category: "CRM",
  order: 8,
  height: 1180,
  concept: {
    goal: "Mostrar ao gestor quem está acima ou abaixo da meta e como o ranking mudou.",
    patterns: [
      "Anatomia B · Painel: cabeçalho fixo",
      "Bullet por vendedor (realizado × meta), bump do ranking, slope do trimestre",
      "Editar meta em modal",
    ],
    adapt: [
      "Metas de recrutadores, produtividade de atendentes",
    ],
    avoid: [
      "Ranking sem mostrar a meta de cada um",
    ],
  },
} as const;

const here = "#/frame/crm-team";
const money = (n: number) => formatCurrency(n, { compact: true });
const months = ["abr", "mai", "jun", "jul", "ago", "set"];
const ranks: Record<string, number[]> = { ana: [2, 1, 1, 2, 1, 1], diego: [1, 2, 3, 1, 2, 2], carla: [3, 3, 2, 3, 3, 3], bruno: [5, 4, 4, 4, 4, 4], eduardo: [4, 5, 5, 5, 5, 5] };

export default function CrmTeam() {
  const [reps, setReps] = useState(baseReps);
  const [team, setTeam] = useState<"todos" | "Enterprise" | "PME">("todos");
  const [editing, setEditing] = useState<Rep | null>(null);
  const [quota, setQuota] = useState<number | null>(null);
  const shown = reps.filter((r) => team === "todos" || r.team === team);
  const won = shown.reduce((s, r) => s + r.won, 0);
  const target = shown.reduce((s, r) => s + r.quota, 0);
  const pipelineOf = (id: string) => deals.filter((d) => d.owner === id).reduce((s, d) => s + d.value, 0);
  const lateOf = (id: string) => activities.filter((a) => a.owner === id && !a.done && daysFromToday(a.due) < 0).length;

  const columns: Column<Rep>[] = [
    {
      key: "name",
      header: "Pessoa",
      primary: true,
      cell: (r) => (
        <span className="flex items-center gap-2.5">
          <Avatar initials={r.initials} tint={r.tint} name={r.name} />
          <span className="min-w-0">
            <span className="block truncate">{r.name}</span>
            <span className="block text-[12px] font-normal text-muted">
              {r.role} · {r.team}
            </span>
          </span>
        </span>
      ),
    },
    { key: "won", header: "Ganho no tri", align: "right", nowrap: true, cell: (r) => <span className="font-medium tabular-nums">{money(r.won)}</span> },
    { key: "quota", header: "Meta", align: "right", nowrap: true, cell: (r) => <span className="tabular-nums text-muted">{money(r.quota)}</span> },
    {
      key: "pct",
      header: "Atingimento",
      align: "right",
      nowrap: true,
      cell: (r) => <Badge tone={r.won >= r.quota ? "ok" : r.won >= r.quota * 0.9 ? "neutral" : "warn"}>{formatPercent(r.won / r.quota, 0)}</Badge>,
    },
    { key: "pipe", header: "Pipeline aberto", align: "right", nowrap: true, mobileHidden: true, cell: (r) => <span className="tabular-nums">{money(pipelineOf(r.id))}</span> },
    { key: "late", header: "Atividades atrasadas", align: "right", mobileHidden: true, cell: (r) => (lateOf(r.id) ? <span className="font-medium text-rose">{lateOf(r.id)}</span> : <span className="text-muted">0</span>) },
    {
      key: "edit",
      header: "",
      action: true,
      cell: (r) => (
        <IconButton
          label={`Editar meta de ${r.name}`}
          size="sm"
          onClick={() => {
            setEditing(r);
            setQuota(r.quota);
          }}
        >
          <Pencil />
        </IconButton>
      ),
    },
  ];

  return (
    <CrmShell current={here}>
      <Page>
        <PageHeading
          title="Time e metas"
          description="3º trimestre de 2026. Metas por pessoa, ritmo e evolução do ranking."
          actions={
            <>
              <SegmentedControl
                label="Time"
                value={team}
                onChange={setTeam}
                options={[
                  { value: "todos", label: "Todos" },
                  { value: "Enterprise", label: "Enterprise" },
                  { value: "PME", label: "PME" },
                ]}
              />
              <Button variant="ghost" onClick={() => notify("Exemplo: o convite é feito em Configurações › Membros do app.", undefined, "info")}>
                <UserPlus /> Convidar
              </Button>
            </>
          }
        />
        <div className="mt-6 space-y-6">
          <KpiGrid cols={3}>
            <KpiCard label="Ganho no trimestre" value={money(won)} delta={won / shown.reduce((s, r) => s + r.wonPrev, 0) - 1} period="vs. 2º trimestre" />
            <KpiCard label="Atingimento do time" value={formatPercent(won / target, 0)} hint={`${money(won)} de ${money(target)}`} />
            <KpiCard label="Batendo a meta" value={`${shown.filter((r) => r.won >= r.quota).length} de ${shown.length}`} hint="pessoas acima de 100 %" />
          </KpiGrid>

          <ChartCard title="Quem está na meta?" description="Barra = ganho · traço = meta · faixas: abaixo de 60 %, 60–90 %, acima de 90 %">
            <div className="space-y-3">
              {shown.map((r) => (
                <BulletChart key={r.id} label={r.name} hint={r.team} value={r.won} target={r.quota} format={money} />
              ))}
            </div>
          </ChartCard>

          <div className="grid gap-6 lg:grid-cols-2">
            <ChartCard title="Como o ranking mudou?" description="Posição por receita ganha no mês">
              <BumpChart periods={months} series={shown.map((r) => ({ label: r.name.split(" ")[0], ranks: ranks[r.id] }))} height={240} />
            </ChartCard>
            <ChartCard title="Quem cresceu no trimestre?" description="Receita ganha · 2º tri → 3º tri">
              <SlopeChart items={shown.map((r) => ({ label: r.name.split(" ")[0], from: r.wonPrev, to: r.won }))} fromLabel="2º tri" toLabel="3º tri" format={money} height={240} />
            </ChartCard>
          </div>

          <DataTable rows={shown} columns={columns} rowKey={(r) => r.id} />
        </div>
      </Page>
      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        size="sm"
        title={`Meta de ${editing?.name ?? ""}`}
        description="Meta de receita ganha para o 3º trimestre de 2026."
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
            <Button
              disabled={!quota}
              onClick={() => {
                if (!editing || !quota) return;
                const prev = editing.quota;
                setReps((all) => all.map((r) => (r.id === editing.id ? { ...r, quota } : r)));
                notify(`Meta de ${editing.name.split(" ")[0]}: ${money(quota)}`, () => setReps((all) => all.map((r) => (r.id === editing.id ? { ...r, quota: prev } : r))));
                setEditing(null);
              }}
            >
              Salvar meta
            </Button>
          </>
        }
      >
        <CurrencyField label="Meta do trimestre" value={quota} onChange={setQuota} />
      </Modal>
    </CrmShell>
  );
}
