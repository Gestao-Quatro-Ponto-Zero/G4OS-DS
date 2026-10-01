import { Check, CreditCard, Download } from "lucide-react";
import { useState } from "react";
import {
  Badge,
  Button,
  ConfirmDialog,
  DataTable,
  Meter,
  SegmentedControl,
  cn,
  formatCurrency,
  notify,
  type Column } from "@g4os/ds";
import { plans as sharedPlans, type PlanId } from "./data/plans";
import { org } from "./data/workspace";
import { SettingsShell } from "./shells/settings-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Plano e cobrança",
  description: "Plano atual com renovação, uso contra limites, troca de plano mensal/anual, forma de pagamento e histórico de faturas.",
  category: "Configurações",
  order: 6,
  height: 1000,
  concept: {
    goal: "Mostrar o plano, o uso contra os limites e as faturas, e permitir trocar de plano.",
    patterns: [
      "Anatomia D · Configurações: título 'Configurações' fixo e subnavegação colada abaixo (SettingsLayout)",
      "Uso contra limites com aviso perto do teto",
      "Planos lado a lado com o atual marcado; mensal/anual",
      "Histórico de faturas com PDF",
    ],
    adapt: [
      "Contrato de serviço, consumo de créditos",
    ],
    avoid: [
      "Esconder o limite até ele estourar",
    ],
  },
} as const;

/* ------------------------------------------------------------------ */
/* Dados de exemplo                                                    */
/* ------------------------------------------------------------------ */

// Planos vêm da mesma fonte do site de preços; aqui o valor é o total do time (preço × licenças).
type Plan = { id: PlanId; name: string; monthly: number | null; blurb: string; features: string[]; featured?: boolean };
const plans: Plan[] = sharedPlans.map((p) => ({ id: p.id, name: p.name, monthly: p.price == null ? null : p.price * org.seats, blurb: p.desc, features: p.highlights, featured: p.featured }));
const current: PlanId = "pro";
const renewal = "15/10/2026";
const usage = [
  { label: "Licenças", value: 12, target: 15, format: (n: number) => String(n) },
  { label: "Armazenamento", value: 38.4, target: 50, format: (n: number) => `${n.toLocaleString("pt-BR")} GB` },
  { label: "Automações no mês", value: 9_120, target: 10_000, format: (n: number) => n.toLocaleString("pt-BR") },
];
type Invoice = { id: string; date: string; description: string; amount: number; status: "paga" | "aberta" | "falhou" };
const invoices: Invoice[] = [
  { id: "NF-2026-09", date: "15/09/2026", description: "Pro · mensal · 15 licenças", amount: 169 * 15, status: "paga" },
  { id: "NF-2026-08", date: "15/08/2026", description: "Pro · mensal · 15 licenças", amount: 169 * 15, status: "paga" },
  { id: "NF-2026-07b", date: "22/07/2026", description: "Licenças adicionais (3) · proporcional", amount: 253.5, status: "paga" },
  { id: "NF-2026-07", date: "15/07/2026", description: "Pro · mensal · 12 licenças", amount: 169 * 12, status: "falhou" },
  { id: "NF-2026-06", date: "15/06/2026", description: "Essencial · mensal · 5 licenças", amount: 89 * 5, status: "paga" },
];

/** Uso contra um limite do plano (não é meta: perto do limite = âmbar). */
function UsageMeter({ label, value, limit, format = (n: number) => n.toLocaleString("pt-BR") }: { label: string; value: number; limit: number; format?: (n: number) => string }) {
  const pct = limit ? value / limit : 0;
  const warn = pct >= 0.9;
  return (
    <div className="min-w-0">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <span className="truncate text-[13px] font-medium">{label}</span>
        <span className="shrink-0 text-[12px] tabular-nums text-muted">
          <span className="font-medium text-ink">{format(value)}</span> de {format(limit)}
        </span>
      </div>
      <Meter value={pct * 100} thick tone={warn ? "warn" : "ink"} label={label} />
      <p className={cn("m-0 mt-1.5 text-[11.5px] tabular-nums", warn ? "font-medium text-amber" : "text-muted")}>
        {warn ? `Perto do limite · ${format(Math.max(0, limit - value))} restantes` : `${format(limit - value)} disponíveis`}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Tela                                                                */
/* ------------------------------------------------------------------ */

export default function SettingsBillingBlock() {
  const [cycle, setCycle] = useState<"mensal" | "anual">("mensal");
  const [pending, setPending] = useState<Plan | null>(null);
  const [plan, setPlan] = useState<PlanId>(current);
  const price = (p: Plan) => (p.monthly == null ? null : cycle === "anual" ? p.monthly * 0.83 : p.monthly);
  const active = plans.find((p) => p.id === plan)!;

  const columns: Column<Invoice>[] = [
    { key: "data", header: "Data", nowrap: true, cell: (i) => <span className="tabular-nums">{i.date}</span> },
    { key: "desc", header: "Descrição", primary: true, cell: (i) => <span className="font-normal">{i.description}</span> },
    { key: "valor", header: "Valor", align: "right", nowrap: true, cell: (i) => <span className="tabular-nums">{formatCurrency(i.amount)}</span> },
    {
      key: "status",
      header: "Status",
      nowrap: true,
      cell: (i) => (i.status === "paga" ? <Badge tone="ok">Paga</Badge> : i.status === "aberta" ? <Badge tone="warn">Em aberto</Badge> : <Badge tone="bad">Falhou</Badge>),
    },
    {
      key: "pdf",
      header: "",
      action: true,
      align: "right",
      cell: (i) => (
        <Button size="sm" variant="quiet" aria-label={`Baixar fatura ${i.id}`} onClick={() => notify(`Baixando fatura ${i.id} (PDF)`, undefined, "info")}>
          <Download /> PDF
        </Button>
      ),
    },
  ];

  return (
    <SettingsShell slug="settings-billing" title="Plano e cobrança" description="Só administradores veem esta página.">
      <section className="rounded-2xl border border-line bg-surface p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="m-0 text-[12px] text-muted">Plano atual</p>
            <p className="m-0 mt-1 flex items-center gap-2 text-[20px] font-semibold tracking-tight">
              {active.name} <Badge tone="accent">Mensal</Badge>
            </p>
            <p className="m-0 mt-1 text-[13px] text-muted">
              {active.monthly != null ? `${formatCurrency(active.monthly)}/mês` : "Sob contrato"} · renova em {renewal}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => notify("Pedido de cancelamento aberto: nosso time entra em contato em até 1 dia útil", undefined, "info")}>
              Cancelar assinatura
            </Button>
            <Button size="sm" onClick={() => document.getElementById("planos")?.scrollIntoView({ behavior: "smooth" })}>
              Mudar plano
            </Button>
          </div>
        </div>
        <div className="mt-6 grid gap-6 border-t border-line pt-5 md:grid-cols-3">
          {usage.map((u) => (
            <UsageMeter key={u.label} label={u.label} value={u.value} limit={u.target} format={u.format} />
          ))}
        </div>
      </section>

      <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3">
        <span className="grid h-9 w-12 place-items-center rounded-md border border-line bg-soft text-[10px] font-bold tracking-wider text-blue">VISA</span>
        <div className="min-w-0 flex-1">
          <p className="m-0 text-[13.5px] font-medium">Visa terminado em 4821</p>
          <p className="m-0 text-[12px] text-muted">Vence em 08/2028 · cobrança para financeiro@acme.com.br</p>
        </div>
        <Button size="sm" variant="ghost" onClick={() => notify("Abrimos o formulário seguro do provedor de pagamento", undefined, "info")}>
          <CreditCard /> Trocar cartão
        </Button>
      </div>

      <section id="planos" className="mt-10 scroll-mt-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="m-0 text-[14px] font-medium">Planos</h3>
          <SegmentedControl
            label="Ciclo de cobrança"
            value={cycle}
            onChange={setCycle}
            options={[
              { value: "mensal", label: "Mensal" },
              { value: "anual", label: "Anual · −17%" },
            ]}
          />
        </div>
        <div className="grid gap-3 lg:grid-cols-3">
          {plans.map((p) => {
            const isCurrent = p.id === plan;
            const pr = price(p);
            return (
              <article key={p.id} className={cn("relative flex flex-col rounded-2xl border bg-surface p-5", isCurrent ? "border-ink shadow-[0_0_0_1px_var(--ds-ink)]" : "border-line")}>
                {p.featured && <span className="absolute -top-2.5 left-5 rounded-md bg-accent px-2 py-0.5 text-[10.5px] font-semibold text-on-ink">Mais escolhido</span>}
                <h4 className="m-0 text-[15px] font-semibold">{p.name}</h4>
                <p className="m-0 mt-0.5 text-[12.5px] text-muted">{p.blurb}</p>
                <p className="m-0 mt-4 flex items-baseline gap-1">
                  {pr == null ? (
                    <span className="text-[22px] font-semibold tracking-tight">Sob consulta</span>
                  ) : (
                    <>
                      <span className="text-[26px] font-semibold tabular-nums tracking-tight">{formatCurrency(pr, { cents: false })}</span>
                      <span className="text-[12.5px] text-muted">/mês{cycle === "anual" && ", cobrado anualmente"}</span>
                    </>
                  )}
                </p>
                <ul className="m-0 mt-4 flex-1 list-none space-y-2 p-0 text-[13px]">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-ink-soft">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ok" strokeWidth={2.5} /> {f}
                    </li>
                  ))}
                </ul>
                <Button className="mt-5 w-full" variant={isCurrent ? "ghost" : "primary"} disabled={isCurrent} onClick={() => (p.monthly == null ? notify("Um especialista vai entrar em contato", undefined, "info") : setPending(p))}>
                  {isCurrent ? "Plano atual" : p.monthly == null ? "Falar com vendas" : plans.indexOf(p) < plans.findIndex((x) => x.id === plan) ? `Mudar para ${p.name}` : `Assinar ${p.name}`}
                </Button>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mt-10">
        <h3 className="m-0 mb-3 text-[14px] font-medium">Faturas</h3>
        <DataTable rows={invoices} columns={columns} rowKey={(i) => i.id} />
      </section>

      <ConfirmDialog
        open={!!pending}
        onClose={() => setPending(null)}
        title={`Mudar para o plano ${pending?.name}?`}
        description={
          pending && price(pending) != null
            ? `A partir de hoje você paga ${formatCurrency(price(pending)!)} por mês. A diferença deste ciclo é calculada proporcionalmente na próxima fatura.`
            : undefined
        }
        confirmLabel={`Mudar para ${pending?.name}`}
        onConfirm={() => {
          if (pending) {
            setPlan(pending.id);
            notify(`Plano alterado para ${pending.name}`);
          }
          setPending(null);
        }}
      />
    </SettingsShell>
  );
}
