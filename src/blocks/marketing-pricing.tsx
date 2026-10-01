import { Check, Minus } from "lucide-react";
import { Fragment, useState } from "react";
import { Accordion, Badge, Button, NumberField, SegmentedControl, cn, formatCurrency } from "@g4ai/ds";
import { featureGroups, plans, type Plan } from "./data/plans";
import { authRoutes } from "./shells/auth-shell";
import { frameHref } from "./shells/frame-route";
import { SiteShell } from "./shells/site-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Página de preços",
  description: "Planos com ciclo mensal/anual e calculadora por usuários, tabela comparativa por grupo de recurso (fixa ao rolar), FAQ em acordeão e CTA que leva ao cadastro com o plano escolhido.",
  category: "Marketing",
  order: 2,
  height: 1100,
  concept: {
    goal: "Ajudar a escolher o plano certo e ir para o cadastro com ele selecionado.",
    patterns: [
      "Anatomia I · Público: cabeçalho do site fixo",
      "Ciclo mensal/anual e calculadora por usuários",
      "Comparativo com cabeçalho fixo ao rolar; FAQ em acordeão",
      "CTA leva ao cadastro com ?plan=",
    ],
    adapt: [
      "Planos de suporte, pacotes de serviço",
    ],
    avoid: [
      "Esconder o preço ('fale com vendas') em todos os planos",
    ],
  },
} as const;

/* ------------------------------------------------------------------ */
/* Dados de exemplo                                                    */
/* ------------------------------------------------------------------ */

const annualDiscount = 0.17;
const faq = [
  { id: "trial", title: "Como funciona o teste grátis?", content: "São 14 dias com tudo do plano Pro, sem cartão. No fim você escolhe um plano ou a conta vira somente leitura — nenhum dado é apagado." },
  { id: "usuarios", title: "O que conta como usuário?", content: "Qualquer pessoa que entra no Atlas. Leitores (só visualizam) não pagam no plano Pro e Enterprise." },
  { id: "troca", title: "Posso trocar de plano depois?", content: "Sim, a qualquer momento. Subir de plano é imediato e cobrado proporcionalmente; descer vale a partir do próximo ciclo." },
  { id: "pagamento", title: "Quais formas de pagamento?", content: "Cartão de crédito, boleto e Pix. No anual, emitimos uma nota fiscal por ano ou por mês, como preferir." },
  { id: "dados", title: "Onde ficam meus dados?", content: "Em data centers no Brasil, com criptografia em repouso e em trânsito. O Enterprise tem ambiente dedicado e contrato de tratamento de dados (LGPD)." },
];

const cell = (v: boolean | string) =>
  v === true ? (
    <Check className="mx-auto h-4 w-4 text-ok" aria-label="Incluído" />
  ) : v === false ? (
    <Minus className="mx-auto h-4 w-4 text-line-strong" aria-label="Não incluído" />
  ) : (
    <span className="text-[12.5px] text-ink-soft">{v}</span>
  );

/* ------------------------------------------------------------------ */

export default function MarketingPricing() {
  const [cycle, setCycle] = useState<"mensal" | "anual">("anual");
  const [users, setUsers] = useState<number | null>(10);
  const n = Math.max(1, users ?? 1);
  const unit = (p: Plan) => (p.price == null ? null : cycle === "anual" ? p.price * (1 - annualDiscount) : p.price);
  const cta = (p: Plan) => (p.price == null ? "mailto:vendas@atlas.app?subject=Enterprise" : frameHref("auth-signup", { plan: p.id }));

  return (
    <SiteShell current="pricing">
      <section className="mx-auto max-w-[1200px] px-5 pb-10 pt-14 text-center sm:px-8">
        <h1 className="m-0 font-display text-[34px] leading-tight tracking-[-0.035em] [font-weight:var(--ds-display-weight)] sm:text-[44px]">Preço justo, por usuário</h1>
        <p className="mx-auto mt-3 max-w-[540px] text-[15px] leading-relaxed text-muted">Comece grátis por 14 dias. Pague só por quem usa, em reais, com nota fiscal.</p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-4">
          <SegmentedControl
            label="Ciclo de cobrança"
            value={cycle}
            onChange={setCycle}
            options={[
              { value: "mensal", label: "Mensal" },
              { value: "anual", label: "Anual · 17% off" },
            ]}
          />
          <div className="w-[180px] text-left [&_label]:sr-only [&>div]:mb-0">
            <NumberField label="Usuários" value={users} onChange={setUsers} min={1} max={500} suffix="usuários" />
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1200px] gap-4 px-5 sm:px-8 lg:grid-cols-3">
        {plans.map((p) => {
          const u = unit(p);
          return (
            <div key={p.id} className={cn("flex flex-col rounded-2xl border bg-surface p-6", p.featured ? "border-primary shadow-raised ring-1 ring-primary" : "border-line")}>
              <div className="flex items-center justify-between">
                <h2 className="m-0 text-[16px] font-semibold">{p.name}</h2>
                {p.featured && <Badge tone="accent">Mais escolhido</Badge>}
              </div>
              <p className="m-0 mt-1 text-[13px] text-muted">{p.desc}</p>
              <p className="m-0 mt-5 text-[32px] font-semibold tabular-nums tracking-[-0.03em]">
                {u != null ? (
                  <>
                    {formatCurrency(u, { cents: false })}
                    <span className="text-[13.5px] font-normal tracking-normal text-muted"> /usuário/mês</span>
                  </>
                ) : (
                  "Sob consulta"
                )}
              </p>
              <p className="m-0 mt-1 h-5 text-[12.5px] tabular-nums text-muted">
                {u != null && `${formatCurrency(u * n * (cycle === "anual" ? 12 : 1), { cents: false })} por ${cycle === "anual" ? "ano" : "mês"} para ${n} ${n === 1 ? "usuário" : "usuários"}`}
              </p>
              <ul className="mt-5 flex-1 list-none space-y-2 p-0">
                {p.highlights.map((it) => (
                  <li key={it} className="flex items-center gap-2 text-[13.5px] text-ink-soft">
                    <Check className="h-4 w-4 shrink-0 text-ok" aria-hidden /> {it}
                  </li>
                ))}
              </ul>
              <Button className="mt-6 w-full" variant={p.featured ? "primary" : "ghost"} href={cta(p)}>
                {p.price == null ? "Falar com vendas" : "Começar grátis"}
              </Button>
            </div>
          );
        })}
      </section>

      <section className="mx-auto max-w-[1200px] px-5 py-16 sm:px-8" aria-labelledby="comparar">
        <h2 id="comparar" className="m-0 mb-6 text-[22px] font-semibold tracking-[-0.03em]">
          Compare os planos
        </h2>
        <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
          <table className="w-full min-w-[680px] border-collapse text-left text-[13px]">
            <thead className="sticky top-0 z-[1] bg-surface">
              <tr className="border-b border-line">
                <th className="w-[40%] px-5 py-4 text-[12px] font-medium text-muted">Recurso</th>
                {plans.map((p) => (
                  <th key={p.id} className="px-4 py-4 text-center">
                    <div className="text-[14px] font-semibold">{p.name}</div>
                    <a href={cta(p)} className="mt-1 inline-block text-[12px] font-medium text-blue hover:underline">
                      {p.price == null ? "Falar com vendas" : "Começar"}
                    </a>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {featureGroups.map((g) => (
                <Fragment key={g.group}>
                  <tr className="bg-soft/60">
                    <th colSpan={4} className="px-5 py-2 text-[11px] font-medium uppercase tracking-[0.08em] text-muted">
                      {g.group}
                    </th>
                  </tr>
                  {g.rows.map((r) => (
                    <tr key={r.label} className="border-t border-line">
                      <th scope="row" className="px-5 py-3 font-normal text-ink-soft">
                        {r.label}
                      </th>
                      {r.values.map((v, i) => (
                        <td key={i} className="px-4 py-3 text-center">
                          {cell(v)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1200px] gap-8 px-5 pb-20 sm:px-8 lg:grid-cols-[320px_1fr]">
        <div>
          <h2 className="m-0 text-[22px] font-semibold tracking-[-0.03em]">Perguntas frequentes</h2>
          <p className="m-0 mt-2 text-[13.5px] leading-relaxed text-muted">
            Não achou sua dúvida? <a href="mailto:vendas@atlas.app" className="font-medium text-blue hover:underline">Fale com a gente</a> ou{" "}
            <a href={authRoutes.signup} className="font-medium text-blue hover:underline">
              teste grátis
            </a>
            .
          </p>
        </div>
        <Accordion items={faq} defaultOpen={["trial"]} />
      </section>
    </SiteShell>
  );
}
