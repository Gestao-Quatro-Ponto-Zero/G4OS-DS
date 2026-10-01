import { ArrowRightLeft, Download } from "lucide-react";
import { useState } from "react";
import {
  Badge,
  Button,
  ChartCard,
  CurrencyField,
  DataTable,
  DumbbellChart,
  FieldBlock,
  KpiCard,
  KpiGrid,
  Meter,
  Modal,
  Page,
  PageHeading,
  SegmentedControl,
  Select,
  TextareaField,
  formatCurrency,
  formatPercent,
  notify,
  type Column,
} from "@g4os/ds";
import { budget, type BudgetLine } from "./data/fin";
import { NexoShell } from "./shells/nexo-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Orçamento",
  description: "Orçado × realizado por centro de custo no mês ou no acumulado: halteres de variação, régua de consumo por responsável, tabela com desvio favorável/desfavorável e pedido de remanejamento.",
  category: "Financeiro",
  order: 6,
  height: 1180,
  concept: {
    goal: "Mostrar onde o realizado está fugindo do orçado e quem responde por isso.",
    patterns: [
      "Anatomia B · Painel: cabeçalho fixo com mês/acumulado",
      "Halteres orçado × realizado; desvio favorável/desfavorável por cor e palavra",
      "Pedido de remanejamento em modal",
    ],
    adapt: [
      "Metas comerciais, headcount por área",
    ],
    avoid: [
      "Verde/vermelho sem dizer se custo acima é ruim",
    ],
  },
} as const;

const money = (n: number) => formatCurrency(n, { compact: true });

export default function FinBudget() {
  const [period, setPeriod] = useState<"mes" | "ano">("mes");
  const [lines, setLines] = useState(budget);
  const [move, setMove] = useState(false);
  const [from, setFrom] = useState("b-ti");
  const [to, setTo] = useState("b-com");
  const [amount, setAmount] = useState<number | null>(5_000);
  const [why, setWhy] = useState("");
  const planned = (l: BudgetLine) => (period === "mes" ? l.planned : l.plannedYtd);
  const actual = (l: BudgetLine) => (period === "mes" ? l.actual : l.actualYtd);
  // Receita acima do orçado é bom; despesa acima é ruim.
  const favorable = (l: BudgetLine) => (l.kind === "receita" ? actual(l) >= planned(l) : actual(l) <= planned(l));
  const expenses = lines.filter((l) => l.kind === "despesa");
  const totalPlan = expenses.reduce((s, l) => s + planned(l), 0);
  const totalActual = expenses.reduce((s, l) => s + actual(l), 0);
  const over = expenses.filter((l) => !favorable(l));

  const columns: Column<BudgetLine>[] = [
    { key: "center", header: "Centro de custo", primary: true, cell: (l) => <span className="block"><span className="block">{l.center}</span><span className="block text-[12px] font-normal text-muted">{l.owner}</span></span> },
    { key: "planned", header: "Orçado", align: "right", nowrap: true, cell: (l) => <span className="tabular-nums text-muted">{formatCurrency(planned(l), { cents: false })}</span> },
    { key: "actual", header: "Realizado", align: "right", nowrap: true, cell: (l) => <span className="font-medium tabular-nums">{formatCurrency(actual(l), { cents: false })}</span> },
    {
      key: "var",
      header: "Desvio",
      align: "right",
      nowrap: true,
      cell: (l) => {
        const d = actual(l) - planned(l);
        return (
          <span className={favorable(l) ? "tabular-nums text-ok" : "font-medium tabular-nums text-rose"}>
            {d >= 0 ? "+" : "−"}
            {formatCurrency(Math.abs(d), { cents: false })} <span className="text-[11.5px]">({formatPercent(d / planned(l), 1)})</span>
          </span>
        );
      },
    },
    { key: "status", header: "", cell: (l) => <Badge tone={favorable(l) ? "ok" : Math.abs(actual(l) / planned(l) - 1) > 0.1 ? "bad" : "warn"}>{favorable(l) ? "Dentro" : "Estourado"}</Badge> },
  ];

  return (
    <NexoShell section="orcamento">
      <Page>
        <PageHeading
          title="Orçamento 2026"
          description={period === "mes" ? "Setembro · realizado contabilizado até ontem." : "Acumulado de janeiro a setembro."}
          actions={
            <>
              <SegmentedControl label="Período" value={period} onChange={setPeriod} options={[{ value: "mes", label: "Setembro" }, { value: "ano", label: "Acumulado" }]} />
              <Button variant="ghost" onClick={() => notify("Orçado × realizado exportado (XLSX)", undefined, "info")}>
                <Download /> Exportar
              </Button>
              <Button onClick={() => setMove(true)}>
                <ArrowRightLeft /> Remanejar
              </Button>
            </>
          }
        />
        <div className="mt-6 space-y-6">
          <KpiGrid>
            <KpiCard label="Receita contra o orçado" value={formatPercent(actual(lines[0]) / planned(lines[0]), 1)} delta={actual(lines[0]) / planned(lines[0]) - 1} period="acima do orçamento" />
            <KpiCard label="Despesas realizadas" value={money(totalActual)} hint={`orçado ${money(totalPlan)}`} />
            <KpiCard label="Desvio de despesas" value={money(totalActual - totalPlan)} delta={(totalActual - totalPlan) / totalPlan} goodWhen="down" period="vs. orçado" />
            <KpiCard label="Centros estourados" value={`${over.length} de ${expenses.length}`} hint={over.map((l) => l.center.split(" · ")[1] ?? l.center).slice(0, 2).join(", ")} />
          </KpiGrid>
          <div className="grid gap-6 lg:grid-cols-2">
            <ChartCard title="Onde gastamos diferente do planejado?" description="Realizado em % do orçado (orçado = 100) · verde = dentro, vermelho = estourado">
              <DumbbellChart rows={expenses.map((l) => ({ label: l.center.split(" · ")[1] ?? l.center, a: 100, b: Math.round((actual(l) / planned(l)) * 100) }))} aLabel="Orçado" bLabel="Realizado" format={(n) => `${n}`} goodWhen="down" />
            </ChartCard>
            <ChartCard title="Quanto do orçamento cada área já usou?" description="Realizado ÷ orçado · acima de 100 % estourou">
              <ul className="list-none space-y-3.5 p-0">
                {expenses.map((l) => {
                  const pct = actual(l) / planned(l);
                  return (
                    <li key={l.id}>
                      <div className="flex items-baseline justify-between gap-3 text-[13px]">
                        <span className="min-w-0 truncate font-medium">{l.center.split(" · ")[1] ?? l.center}</span>
                        <span className={pct > 1.1 ? "shrink-0 font-medium tabular-nums text-rose" : pct > 1 ? "shrink-0 font-medium tabular-nums text-amber" : "shrink-0 tabular-nums text-ink-soft"}>{formatPercent(pct, 0)}</span>
                      </div>
                      <div className="mt-1.5">
                        <Meter value={pct * 100} thick tone={pct > 1.1 ? "bad" : pct > 1 ? "warn" : "ok"} label={`Uso do orçamento de ${l.center}`} />
                      </div>
                      <div className="mt-1 text-[11.5px] tabular-nums text-muted">
                        {money(actual(l))} de {money(planned(l))} · {l.owner}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </ChartCard>
          </div>
          <DataTable rows={lines} columns={columns} rowKey={(l) => l.id} />
        </div>
      </Page>
      <Modal
        open={move}
        onClose={() => setMove(false)}
        title="Remanejar orçamento"
        description="Move saldo não usado entre centros de custo. Acima de R$ 10 mil, precisa do aval da diretoria."
        footer={
          <>
            <Button variant="ghost" onClick={() => setMove(false)}>
              Cancelar
            </Button>
            <Button
              disabled={!amount || from === to}
              onClick={() => {
                const v = amount ?? 0;
                const before = lines;
                setLines((all) => all.map((l) => (l.id === from ? { ...l, planned: l.planned - v, plannedYtd: l.plannedYtd - v } : l.id === to ? { ...l, planned: l.planned + v, plannedYtd: l.plannedYtd + v } : l)));
                setMove(false);
                notify(v > 10_000 ? "Remanejamento enviado para aprovação da diretoria" : `${formatCurrency(v, { cents: false })} remanejados`, () => setLines(before));
              }}
            >
              {amount && amount > 10_000 ? "Enviar para aprovação" : "Remanejar"}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldBlock label="De">
            <Select label="Centro de origem" value={from} onValueChange={setFrom} options={expenses.map((l) => ({ value: l.id, label: l.center, description: `saldo ${formatCurrency(Math.max(0, l.planned - l.actual), { cents: false })}` }))} />
          </FieldBlock>
          <FieldBlock label="Para">
            <Select label="Centro de destino" value={to} onValueChange={setTo} options={expenses.map((l) => ({ value: l.id, label: l.center }))} />
          </FieldBlock>
          <CurrencyField className="sm:col-span-2" label="Valor" value={amount} onChange={setAmount} error={from === to ? "Escolha centros diferentes." : undefined} />
          <TextareaField className="sm:col-span-2" label="Justificativa" value={why} onChange={setWhy} autosize minRows={2} optional />
        </div>
      </Modal>
    </NexoShell>
  );
}
