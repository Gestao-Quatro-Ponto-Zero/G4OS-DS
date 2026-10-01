import { CalendarClock, Plus, Upload } from "lucide-react";
import { useState } from "react";
import {
  Badge,
  BarChart,
  Button,
  ChartCard,
  CurrencyField,
  DataTable,
  DatePicker,
  FieldBlock,
  KpiCard,
  KpiGrid,
  LineChart,
  Modal,
  Page,
  PageHeading,
  ProportionBar,
  SegmentedControl,
  TextField,
  WaterfallChart,
  formatCurrency,
  notify,
  type Column,
} from "@g4os/ds";
import { accounts, br, bridge, cashBalance, iso, minimumCash, payableStatus, payables as seed, weeks, type Payable } from "./data/fin";
import { go } from "./shells/frame-route";
import { NexoShell } from "./shells/nexo-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Fluxo de caixa",
  description: "Entradas e saídas por semana (saídas negativas), saldo projetado contra o mínimo de segurança, ponte do mês em cascata, próximos pagamentos e saldo por conta.",
  category: "Financeiro",
  order: 2,
  height: 1320,
  concept: {
    goal: "Responder se vai faltar caixa nas próximas semanas e o que vence antes.",
    patterns: [
      "Anatomia B · Painel: cabeçalho fixo",
      "Entradas/saídas por semana (saídas negativas) e saldo projetado × mínimo",
      "Ponte do mês em cascata; próximos pagamentos",
    ],
    adapt: [
      "Projeção de capacidade, consumo de licenças",
    ],
    avoid: [
      "Saldo projetado sem o mínimo de segurança",
    ],
  },
} as const;

const money = (n: number) => formatCurrency(n, { compact: true });

export default function FinCashflow() {
  const [horizon, setHorizon] = useState<"4" | "8">("8");
  const [list, setList] = useState(seed);
  const [entry, setEntry] = useState(false);
  const [kind, setKind] = useState<"entrada" | "saida">("saida");
  const [desc, setDesc] = useState("");
  const [value, setValue] = useState<number | null>(null);
  const [date, setDate] = useState(iso(1));
  const [extra, setExtra] = useState(0);
  let running = cashBalance + extra;
  const projection = weeks.slice(4).map((w) => {
    running += w.entradas + w.saidas;
    return { semana: w.semana, saldo: running, minimo: minimumCash };
  });
  const next7 = list.filter((p) => p.status !== "pago" && p.due <= iso(7)).sort((a, b) => a.due.localeCompare(b.due));

  const pay = (p: Payable) => {
    const before = list;
    setList((all) => all.map((x) => (x.id === p.id ? { ...x, status: "pago" } : x)));
    notify(`Pagamento de ${formatCurrency(p.value)} a ${p.supplier} enviado ao banco`, () => setList(before));
  };

  const columns: Column<Payable>[] = [
    { key: "due", header: "Vencimento", nowrap: true, cell: (p) => <span className={p.status === "atrasado" ? "font-medium text-rose" : p.due === iso(0) ? "font-medium text-amber" : "tabular-nums"}>{p.due === iso(0) ? "Hoje" : br(p.due).slice(0, 5)}</span> },
    { key: "supplier", header: "Favorecido", primary: true, cell: (p) => p.supplier },
    { key: "category", header: "Categoria", mobileHidden: true, cell: (p) => <span className="text-muted">{p.category}</span> },
    { key: "value", header: "Valor", align: "right", nowrap: true, cell: (p) => <span className="font-medium tabular-nums">{formatCurrency(p.value)}</span> },
    { key: "status", header: "Situação", cell: (p) => <Badge tone={payableStatus[p.status].tone}>{payableStatus[p.status].label}</Badge> },
    {
      key: "act",
      header: "",
      action: true,
      cell: (p) =>
        p.status === "atrasado" || (p.status === "agendado" && p.due <= iso(0)) ? (
          <Button size="sm" variant="ghost" onClick={() => pay(p)}>
            Pagar
          </Button>
        ) : p.status === "aprovacao" ? (
          <Button size="sm" variant="ghost" onClick={() => go("fin-payables", p.id)}>
            Aprovar
          </Button>
        ) : null,
    },
  ];

  return (
    <NexoShell section="caixa">
      <Page>
        <PageHeading
          title="Fluxo de caixa"
          description="Realizado até hoje e previsto a partir de títulos em aberto, folha e impostos. Conciliado com os bancos às 08:00."
          actions={
            <>
              <Button variant="ghost" onClick={() => go("fin-reconciliation")}>
                <Upload /> Importar OFX
              </Button>
              <Button onClick={() => setEntry(true)}>
                <Plus /> Lançamento
              </Button>
            </>
          }
        />
        <div className="mt-6 space-y-6">
          <KpiGrid>
            <KpiCard label="Saldo em contas hoje" value={money(cashBalance + extra)} delta={-0.069} goodWhen="neutral" period="vs. 01/09" />
            <KpiCard label="A receber em 30 dias" value={money(1_476_000)} delta={0.041} period="vs. mês anterior" href="#/frame/fin-receivables" />
            <KpiCard label="A pagar em 30 dias" value={money(1_474_000)} delta={0.083} goodWhen="down" period="vs. mês anterior" href="#/frame/fin-payables" />
            <KpiCard label="Menor saldo projetado" value={money(Math.min(...projection.map((p) => p.saldo)))} hint={`mínimo de segurança ${money(minimumCash)}`} />
          </KpiGrid>

          <ChartCard
            title="Quanto entra e quanto sai por semana?"
            description="Entradas acima de zero, saídas abaixo · até 28/09 realizado, depois previsto"
            action={<SegmentedControl label="Horizonte" value={horizon} onChange={setHorizon} options={[{ value: "4", label: "4 semanas" }, { value: "8", label: "8 semanas" }]} />}
          >
            <BarChart
              label="Entradas e saídas por semana"
              data={weeks.slice(-Number(horizon))}
              index="semana"
              series={[
                { key: "entradas", label: "Entradas", color: "var(--ds-ok)" },
                { key: "saidas", label: "Saídas", color: "var(--ds-rose)" },
              ]}
              stacked
              format={(n) => formatCurrency(n, { cents: false })}
              formatAxis={money}
              height={240}
            />
          </ChartCard>

          <div className="grid gap-6 lg:grid-cols-2">
            <ChartCard title="O saldo fica acima do mínimo?" description="Saldo projetado no fim de cada semana">
              <LineChart
                label="Saldo projetado por semana com mínimo de segurança"
                data={projection}
                index="semana"
                series={[
                  { key: "saldo", label: "Saldo projetado" },
                  { key: "minimo", label: "Mínimo de segurança", dashed: true, color: "var(--ds-amber)" },
                ]}
                format={(n) => formatCurrency(n, { cents: false })}
                formatAxis={money}
                height={220}
              />
            </ChartCard>
            <ChartCard title="Como o caixa de setembro mudou?" description="Do saldo inicial ao final, por grupo de movimentação">
              <WaterfallChart steps={bridge} format={money} formatAxis={money} label="Ponte do caixa de setembro" height={236} />
            </ChartCard>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <section className="min-w-0 lg:col-span-2">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h2 className="m-0 flex items-center gap-2 text-[14px] font-medium">
                    <CalendarClock className="h-4 w-4 text-muted" /> Próximos pagamentos
                  </h2>
                  <p className="m-0 mt-0.5 text-[12px] text-muted">7 dias · {formatCurrency(next7.reduce((s, p) => s + p.value, 0), { cents: false })}</p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => go("fin-payables")}>
                  Ver todos
                </Button>
              </div>
              <DataTable rows={next7} columns={columns} rowKey={(p) => p.id} onRowClick={(p) => go("fin-payables", p.id)} rowLabel={(p) => `Abrir ${p.doc}`} />
            </section>
            <ChartCard title="Onde está o dinheiro?" description="Saldo por conta hoje">
              <ProportionBar items={accounts.map((a) => ({ label: a.label, value: a.balance }))} format={money} />
            </ChartCard>
          </div>
        </div>
      </Page>
      <Modal
        open={entry}
        onClose={() => setEntry(false)}
        title="Novo lançamento"
        description="Para movimentos sem documento (tarifas, rendimentos, adiantamentos). Títulos de clientes e fornecedores entram por A receber / A pagar."
        footer={
          <>
            <Button variant="ghost" onClick={() => setEntry(false)}>
              Cancelar
            </Button>
            <Button
              disabled={!desc.trim() || !value}
              onClick={() => {
                const v = (value ?? 0) * (kind === "saida" ? -1 : 1);
                setExtra((e) => e + v);
                setEntry(false);
                setDesc("");
                setValue(null);
                notify(`Lançamento de ${formatCurrency(Math.abs(v))} registrado para ${br(date)}`, () => setExtra((e) => e - v));
              }}
            >
              Lançar
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <SegmentedControl label="Tipo" value={kind} onChange={setKind} options={[{ value: "saida", label: "Saída" }, { value: "entrada", label: "Entrada" }]} />
          </div>
          <TextField className="sm:col-span-2" label="Descrição" value={desc} onChange={setDesc} placeholder="Ex.: Tarifa de manutenção de conta" />
          <CurrencyField label="Valor" value={value} onChange={setValue} />
          <FieldBlock label="Data">
            <DatePicker label="Data do lançamento" value={date} onValueChange={setDate} />
          </FieldBlock>
        </div>
      </Modal>
    </NexoShell>
  );
}
