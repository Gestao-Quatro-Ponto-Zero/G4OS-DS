import { Check, Pencil, Users } from "lucide-react";
import { useState } from "react";
import {
  Badge,
  Button,
  CurrencyField,
  DataTable,
  Drawer,
  Empty,
  FieldGrid,
  KpiCard,
  KpiGrid,
  NumberField,
  OperationButton,
  OperationFeedback,
  Page,
  PageHeading,
  SegmentedControl,
  Skeleton,
  Switch,
  TextareaField,
  formatCompact,
  formatCurrency,
  formatNumber,
  formatPercent,
  useOperation,
  type Column,
} from "@g4ai/ds";
import { customers, planCatalog, type PlanDef, type PlanLimits } from "./data/saas";
import { ListError, SaasShell, useDemoState } from "./shells/saas-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Planos e preços",
  description: "Catálogo de planos com preço mensal e anual por usuário, limites, assinantes e MRR por plano, comparação de limites e edição do plano em gaveta.",
  category: "SaaS",
  order: 9,
  height: 1180,
  concept: {
    goal: "Manter o catálogo de planos coerente: quanto custa cada um, o que inclui e quantas contas dependem dele antes de mudar um preço.",
    patterns: [
      "Anatomia A · Lista: cabeçalho fixo; catálogo em cards e tabela de limites abaixo",
      "Alternador mensal/anual muda todos os preços de uma vez",
      "Cada plano mostra assinantes e MRR: o impacto aparece antes de editar",
      "Editar em Drawer com useOperation; preço novo vale para novas assinaturas",
    ],
    adapt: ["Tabelas de preço de serviço (ERP), pacotes de horas, planos de suporte"],
    avoid: ["Mudar preço sem mostrar quantas contas estão no plano", "Limite ilimitado escrito como número alto"],
  },
} as const;

const here = "#/frame/saas-plans";
type Billing = "mensal" | "anual";
const limitLabel: Record<keyof PlanLimits, string> = { usuarios: "Usuários", paineis: "Painéis", eventos: "Eventos por mês", api: "Chamadas de API por mês", retencao: "Retenção de dados" };
const showLimit = (k: keyof PlanLimits, v: number | null) => {
  if (k === "retencao") return `${formatNumber(v ?? 0)} dias`;
  if (v === null) return "Ilimitado";
  if (v === 0) return "Não incluso";
  return k === "eventos" || k === "api" ? formatCompact(v) : formatNumber(v);
};

export default function SaasPlans() {
  const [plans, setPlans] = useState(planCatalog);
  const [billing, setBilling] = useState<Billing>("mensal");
  const [editing, setEditing] = useState<PlanDef | null>(null);
  const estado = useDemoState();
  const op = useOperation({ busyLabel: "Salvando plano…" });

  const stats = (p: PlanDef) => {
    const subs = customers.filter((c) => c.plan === p.id && c.status !== "trial");
    return { subs: subs.length, seats: subs.reduce((s, c) => s + c.seats, 0), mrr: subs.reduce((s, c) => s + c.mrr, 0) };
  };
  const totalMrr = plans.reduce((s, p) => s + stats(p).mrr, 0);
  const price = (p: PlanDef) => (billing === "mensal" ? p.monthly : p.annual);

  const save = () => {
    if (!editing) return;
    const prev = plans;
    const next = editing;
    void op
      .run(
        () => new Promise((r) => setTimeout(r, 600)),
        { message: `Plano ${next.id} atualizado · vale para novas assinaturas`, undo: () => setPlans(prev) },
        { apply: () => setPlans((all) => all.map((p) => (p.id === next.id ? next : p))), revert: () => setPlans(prev) },
      )
      .then((err) => !err && setEditing(null));
  };

  const limitRows = (Object.keys(limitLabel) as (keyof PlanLimits)[]).map((k) => ({ key: k }));
  const limitCols: Column<{ key: keyof PlanLimits }>[] = [
    { key: "limit", header: "Limite", primary: true, cell: (r) => limitLabel[r.key] },
    ...plans.map((p) => ({ key: p.id, header: p.id, align: "right" as const, nowrap: true, cell: (r: { key: keyof PlanLimits }) => <span className="tabular-nums">{showLimit(r.key, p.limits[r.key])}</span> })),
  ];

  return (
    <SaasShell current={here}>
      <Page>
        <PageHeading
          title="Planos e preços"
          description="Preço por usuário. Mudanças valem para novas assinaturas; contas atuais mantêm o preço até a renovação."
          actions={
            <SegmentedControl
              label="Cobrança"
              value={billing}
              onChange={setBilling}
              options={[
                { value: "mensal", label: "Mensal" },
                { value: "anual", label: "Anual" },
              ]}
            />
          }
        />

        {estado === "carregando" ? (
          <div role="status" aria-label="Carregando planos" className="grid gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="space-y-3 rounded-xl border border-line bg-surface p-5">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-7 w-32" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-4/5" />
                <Skeleton className="mt-4 h-8 w-28" />
              </div>
            ))}
          </div>
        ) : estado === "erro" ? (
          <ListError noun="os planos" />
        ) : estado === "vazio" ? (
          <Empty title="Nenhum plano publicado" hint="Crie o primeiro plano para começar a cobrar. Você pode partir de Starter, Pro e Enterprise." action={<Button onClick={() => setEditing(planCatalog[1])}>Criar plano a partir do Pro</Button>} />
        ) : (
          <div className="space-y-8">
            <KpiGrid>
              {plans.map((p) => {
                const s = stats(p);
                return <KpiCard key={p.id} label={`MRR do ${p.id}`} value={formatCurrency(s.mrr, { cents: false })} hint={`${formatPercent(totalMrr ? s.mrr / totalMrr : 0)} do total · ${formatNumber(s.subs)} contas`} />;
              })}
            </KpiGrid>

            <section aria-label="Catálogo" className="grid gap-4 md:grid-cols-3">
              {plans.map((p) => {
                const s = stats(p);
                return (
                  <article key={p.id} className="flex flex-col rounded-xl border border-line bg-surface p-5">
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="m-0 text-[15px] font-semibold">{p.id}</h2>
                      <Badge>{p.public ? "Público" : "Sob consulta"}</Badge>
                    </div>
                    <p className="m-0 mt-1 text-[13px] leading-relaxed text-muted">{p.description}</p>
                    <div className="mt-4 flex items-baseline gap-1">
                      <span className="text-[25px] font-semibold tabular-nums">{formatCurrency(price(p), { cents: false })}</span>
                      <span className="text-[12.5px] text-muted">por usuário/mês</span>
                    </div>
                    <p className="m-0 text-[12px] text-muted">{billing === "anual" ? `Cobrado anualmente · ${formatPercent(1 - p.annual / p.monthly, 0)} de desconto` : `No anual: ${formatCurrency(p.annual, { cents: false })}`}</p>
                    <ul className="m-0 mt-4 flex-1 list-none space-y-1.5 p-0 text-[13px]">
                      {p.features.map((f) => (
                        <li key={f} className="flex items-center gap-2">
                          <Check className="h-3.5 w-3.5 shrink-0 text-ok" aria-hidden /> {f}
                        </li>
                      ))}
                    </ul>
                    <dl className="m-0 mt-4 grid grid-cols-2 gap-3 border-t border-line pt-4 text-[12.5px]">
                      <div>
                        <dt className="text-muted">Assinantes</dt>
                        <dd className="m-0 font-medium tabular-nums">{formatNumber(s.subs)} contas</dd>
                      </div>
                      <div>
                        <dt className="text-muted">Usuários pagos</dt>
                        <dd className="m-0 font-medium tabular-nums">{formatNumber(s.seats)}</dd>
                      </div>
                    </dl>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button size="sm" variant="ghost" onClick={() => (op.reset(), setEditing(p))}>
                        <Pencil /> Editar plano
                      </Button>
                      <Button size="sm" variant="ghost" href={`#/frame/saas-customers?plano=${p.id}`}>
                        <Users /> Ver assinantes
                      </Button>
                    </div>
                  </article>
                );
              })}
            </section>

            <section>
              <h2 className="m-0 mb-3 text-[14px] font-medium">Limites por plano</h2>
              <DataTable rows={limitRows} columns={limitCols} rowKey={(r) => r.key} />
              <p className="m-0 mt-2 text-[12px] text-muted">
                Quem passa de 90 % de um limite aparece em{" "}
                <a href="#/frame/saas-usage" className="font-medium text-ink underline underline-offset-2">
                  Uso e limites
                </a>
                .
              </p>
            </section>
          </div>
        )}
      </Page>

      <Drawer
        open={!!editing}
        onClose={() => setEditing(null)}
        kicker="Plano"
        title={editing ? `Editar ${editing.id}` : ""}
        footer={
          editing && (
            <>
              <Button variant="ghost" onClick={() => setEditing(null)}>
                Cancelar
              </Button>
              <OperationButton operation={op} disabled={!editing.monthly || !editing.annual} disabledReason="Informe os dois preços" onClick={save}>
                Salvar plano
              </OperationButton>
            </>
          )
        }
      >
        {editing && (
          <div className="space-y-5">
            <OperationFeedback operation={op} />
            <div className="rounded-xl border border-line bg-soft/60 px-4 py-3 text-[13px]">
              {formatNumber(stats(editing).subs)} contas assinam este plano ({formatCurrency(stats(editing).mrr, { cents: false })} de MRR). Elas mantêm o preço atual até a renovação.
            </div>
            <TextareaField label="Descrição" value={editing.description} onChange={(v) => setEditing({ ...editing, description: v })} rows={2} />
            <FieldGrid>
              <CurrencyField label="Preço mensal (por usuário)" value={editing.monthly} onChange={(v) => setEditing({ ...editing, monthly: v ?? 0 })} />
              <CurrencyField label="Preço no anual (por usuário/mês)" value={editing.annual} onChange={(v) => setEditing({ ...editing, annual: v ?? 0 })} hint={editing.monthly ? `${formatPercent(1 - editing.annual / editing.monthly, 0)} de desconto` : undefined} />
            </FieldGrid>
            <fieldset className="m-0 space-y-4 border-0 p-0">
              <legend className="mb-3 text-[13px] font-medium">Limites</legend>
              <FieldGrid>
                <NumberField label="Usuários" value={editing.limits.usuarios} onChange={(v) => setEditing({ ...editing, limits: { ...editing.limits, usuarios: v } })} min={1} hint="Vazio = ilimitado" />
                <NumberField label="Painéis" value={editing.limits.paineis} onChange={(v) => setEditing({ ...editing, limits: { ...editing.limits, paineis: v } })} min={1} hint="Vazio = ilimitado" />
                <NumberField label="Eventos por mês" value={editing.limits.eventos} onChange={(v) => setEditing({ ...editing, limits: { ...editing.limits, eventos: v } })} min={0} />
                <NumberField label="Retenção" value={editing.limits.retencao} onChange={(v) => setEditing({ ...editing, limits: { ...editing.limits, retencao: v ?? 30 } })} min={30} suffix="dias" />
              </FieldGrid>
            </fieldset>
            <Switch label="Mostrar na página de preços" checked={editing.public} onCheckedChange={(v) => setEditing({ ...editing, public: v })} />
          </div>
        )}
      </Drawer>
    </SaasShell>
  );
}
