import { ChevronRight, Download } from "lucide-react";
import { Fragment, useState } from "react";
import {
  BulletChart,
  Button,
  ChartCard,
  ComboChart,
  Delta,
  Page,
  PageHeading,
  SegmentedControl,
  WaterfallChart,
  cn,
  formatCurrency,
  formatPercent,
  notify,
} from "@g4os/ds";
import { dre, marginByMonth, type DreLine } from "./data/fin";
import { NexoShell } from "./shells/nexo-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "DRE gerencial",
  description: "Demonstrativo de resultado com grupos expansíveis, realizado × orçado com variação favorável/desfavorável, cascata da receita ao lucro, margens contra a meta e receita × margem no semestre.",
  category: "Financeiro",
  order: 7,
  height: 1320,
} as const;

const money = (n: number) => formatCurrency(n, { compact: true });
const brl = (n: number) => (n < 0 ? `(${formatCurrency(-n, { cents: false })})` : formatCurrency(n, { cents: false }));
/** 3º trimestre ≈ jul + ago + set (fatores do realizado e do orçado de cada mês). */
const factor = { mes: { actual: 1, budget: 1 }, tri: { actual: 2.86, budget: 3 } };

function Row({ line, depth, open, onToggle, kind, revenue }: { line: Omit<DreLine, "children">; depth: number; open?: boolean; onToggle?: () => void; kind?: DreLine["kind"]; revenue: number }) {
  // Variação relativa ao orçado. Para custo (negativo), gastar menos é bom.
  const variance = line.budget ? (line.actual - line.budget) / Math.abs(line.budget) : 0;
  const isResult = kind === "result";
  const varianceForDisplay = kind === "cost" ? -variance : variance;
  return (
    <tr className={cn(isResult ? "bg-soft/60 font-semibold" : depth === 0 ? "font-medium" : "text-ink-soft")}>
      <td className="py-2.5 pr-3" style={{ paddingLeft: 40 + depth * 22 }}>
        {onToggle ? (
          <button type="button" onClick={onToggle} aria-expanded={open} className="-ml-5 inline-flex items-center gap-1 rounded text-left hover:text-ink">
            <ChevronRight className={cn("h-4 w-4 text-muted transition-transform", open && "rotate-90")} aria-hidden />
            {line.label}
          </button>
        ) : (
          line.label
        )}
      </td>
      <td className="px-3 py-2.5 text-right tabular-nums">{brl(line.actual)}</td>
      <td className="px-3 py-2.5 text-right tabular-nums text-muted">{brl(line.budget)}</td>
      <td className="px-3 py-2.5 text-right">
        <span className="inline-flex justify-end">
          <Delta value={varianceForDisplay} goodWhen={kind === "cost" ? "down" : "up"} variant="text" />
        </span>
      </td>
      <td className="px-3 py-2.5 text-right tabular-nums text-muted">{formatPercent(Math.abs(line.actual) / revenue)}</td>
      <td className="py-2.5 pl-3 pr-5 text-right tabular-nums text-muted">{brl(line.ytd)}</td>
    </tr>
  );
}

export default function FinDre() {
  const [open, setOpen] = useState<Record<string, boolean>>({ desp: true });
  const [period, setPeriod] = useState<"mes" | "tri">("mes");
  const f = factor[period];
  const scale = (l: Omit<DreLine, "children">) => ({ ...l, actual: Math.round(l.actual * f.actual), budget: Math.round(l.budget * f.budget) });
  const lines = dre.map((l) => ({ ...scale(l), children: l.children?.map(scale) }));
  const get = (id: string) => lines.find((l) => l.id === id)!;
  const revenue = get("rb").actual;
  const bridge = [
    { label: "Receita bruta", value: revenue, kind: "total" as const },
    { label: "Deduções", value: get("ded").actual },
    { label: "CMV", value: get("cmv").actual },
    { label: "Despesas", value: get("desp").actual },
    { label: "Deprec. e juros", value: get("da").actual },
    { label: "IR/CSLL", value: get("ir").actual },
    { label: "Lucro líquido", value: get("ll").actual, kind: "total" as const },
  ];
  const pct = (a: number, b: number) => Math.round((a / b) * 1000) / 10;
  const fmt = (n: number) => `${n.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} %`;

  return (
    <NexoShell section="dre">
      <Page>
        <PageHeading
          title="DRE gerencial"
          description={`${period === "mes" ? "Setembro" : "3º trimestre"} de 2026, regime de competência. Valores negativos entre parênteses.`}
          actions={
            <>
              <SegmentedControl label="Período" value={period} onChange={setPeriod} options={[{ value: "mes", label: "Setembro" }, { value: "tri", label: "3º trimestre" }]} />
              <Button variant="ghost" onClick={() => notify("DRE exportada para Excel", undefined, "info")}>
                <Download /> Excel
              </Button>
            </>
          }
        />
        <div className="mt-6 space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <ChartCard className="lg:col-span-2" title="Da receita ao lucro: para onde foi cada real?" description="Cascata do período · verde soma, vermelho subtrai">
              <WaterfallChart steps={bridge} format={money} formatAxis={money} label="Cascata da receita bruta ao lucro líquido" height={260} />
            </ChartCard>
            <ChartCard title="As margens estão na meta?" description="Realizado × meta do orçamento">
              <div className="space-y-6">
                <BulletChart label="Margem bruta" value={pct(get("lb").actual, get("rl").actual)} target={pct(get("lb").budget, get("rl").budget)} max={45} format={fmt} hint="lucro bruto ÷ receita líquida" />
                <BulletChart label="Margem EBITDA" value={pct(get("ebitda").actual, get("rl").actual)} target={pct(get("ebitda").budget, get("rl").budget)} max={20} format={fmt} />
                <BulletChart label="Margem líquida" value={pct(get("ll").actual, get("rl").actual)} target={8} max={12} format={fmt} hint="meta anual de 8 %" />
              </div>
            </ChartCard>
          </div>

          <ChartCard title="A margem acompanha o crescimento da receita?" description="Receita bruta (barras) e margem bruta (linha) · últimos 6 meses">
            <ComboChart label="Receita bruta e margem bruta por mês" data={marginByMonth} index="mes" bar={{ key: "receita", label: "Receita bruta" }} line={{ key: "margem", label: "Margem bruta" }} formatBar={money} formatLine={(n) => `${n.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} %`} height={220} />
          </ChartCard>

          <div className="overflow-x-auto rounded-xl border border-line bg-surface">
            <table className="w-full min-w-[760px] text-[13px]">
              <thead className="border-b border-line bg-soft/60 text-[12px] text-muted">
                <tr>
                  <th className="py-2.5 pl-10 pr-3 text-left font-medium">Conta</th>
                  <th className="px-3 py-2.5 text-right font-medium">Realizado</th>
                  <th className="px-3 py-2.5 text-right font-medium">Orçado</th>
                  <th className="px-3 py-2.5 text-right font-medium">Variação</th>
                  <th className="px-3 py-2.5 text-right font-medium">% receita</th>
                  <th className="py-2.5 pl-3 pr-5 text-right font-medium">Acumulado 2026</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {lines.map((l) => (
                  <Fragment key={l.id}>
                    <Row line={l} depth={0} kind={l.kind} revenue={revenue} open={open[l.id]} onToggle={l.children ? () => setOpen((o) => ({ ...o, [l.id]: !o[l.id] })) : undefined} />
                    {l.children && open[l.id] && l.children.map((c) => <Row key={c.id} line={c} depth={1} kind={l.kind} revenue={revenue} />)}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
          <p className="m-0 text-[12px] text-muted">
            Variação: verde quando favorável ao resultado (receita acima ou custo abaixo do orçado), vermelho quando desfavorável. Detalhe por centro de custo em{" "}
            <a className="text-blue hover:underline" href="#/frame/fin-budget">
              Orçamento
            </a>
            .
          </p>
        </div>
      </Page>
    </NexoShell>
  );
}
