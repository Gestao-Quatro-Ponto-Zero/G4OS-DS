import { X } from "lucide-react";
import { useState } from "react";
import {
  Button,
  ChartCard,
  Empty,
  ErrorState,
  KpiCard,
  KpiGrid,
  Page,
  PageHeading,
  SegmentedControl,
  Skeleton,
  WaterfallChart,
  cn,
  formatCurrency,
  formatNumber,
  formatPercent,
  type WaterfallStep,
} from "@g4ai/ds";
import { SaasShell } from "./shells/saas-shell";
import { setFrameQuery, useFrameParam } from "./shells/frame-route";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Movimento de MRR",
  description:
    "Ponte de MRR do início ao fim do período (novos, expansão, reativação, contração, cancelamento) com eixo truncado, troca de período que transforma as barras e a lista de contas por trás de cada movimento.",
  category: "SaaS",
  order: 11,
  height: 1320,
  concept: {
    goal: "Explicar por que o MRR mudou no período e chegar às contas que causaram cada movimento.",
    patterns: [
      "Anatomia B · Painel: cabeçalho com período, KPIs, um gráfico principal",
      "Cascata com eixo truncado (exceção documentada), conectores e valores nas barras",
      "Barra selecionável abre a lista de contas daquele movimento (padrão: Novos)",
      "Unidade alternável: R$ ou % do MRR de início",
    ],
    adapt: [
      "Ponte de caixa, variação de margem, carteira de contratos (início → fim)",
    ],
    avoid: [
      "Eixo truncado sem a marca de quebra",
      "Cascata com mais de 8 barras",
      "Movimento sem as contas que o explicam",
    ],
  },
} as const;

/* ------------------------------------------------------------------ */
/* Dados de exemplo (troque pela sua consulta)                         */
/* ------------------------------------------------------------------ */

const here = "#/frame/saas-mrr-bridge";
type Period = "jul" | "ago" | "set" | "tri";
type Move = "novos" | "expansao" | "reativacao" | "contracao" | "cancelamento";
type Month = Exclude<Period, "tri">;

const moveLabel: Record<Move, string> = {
  novos: "Novos",
  expansao: "Expansão",
  reativacao: "Reativação",
  contracao: "Contração",
  cancelamento: "Cancelamento",
};
const moveNoun: Record<Move, [string, string]> = {
  novos: ["conta nova", "contas novas"],
  expansao: ["conta com expansão", "contas com expansão"],
  reativacao: ["conta reativada", "contas reativadas"],
  contracao: ["conta com redução", "contas com redução"],
  cancelamento: ["conta cancelada", "contas canceladas"],
};
const moves: Move[] = [
  "novos",
  "expansao",
  "reativacao",
  "contracao",
  "cancelamento",
];
const monthName: Record<Month, string> = { jul: "Jul", ago: "Ago", set: "Set" };

/** MRR (R$) e quantidade de contas por movimento, mês a mês. */
const monthly: Record<
  Month,
  { start: number; accounts: number } & Record<
    Move,
    { value: number; count: number }
  >
> = {
  jul: {
    start: 412_400,
    accounts: 1_182,
    novos: { value: 17_900, count: 61 },
    expansao: { value: 9_800, count: 34 },
    reativacao: { value: 2_100, count: 7 },
    contracao: { value: -4_200, count: 21 },
    cancelamento: { value: -8_300, count: 38 },
  },
  ago: {
    start: 429_700,
    accounts: 1_212,
    novos: { value: 19_400, count: 66 },
    expansao: { value: 10_600, count: 38 },
    reativacao: { value: 2_600, count: 9 },
    contracao: { value: -4_900, count: 24 },
    cancelamento: { value: -9_100, count: 41 },
  },
  set: {
    start: 448_300,
    accounts: 1_246,
    novos: { value: 18_500, count: 60 },
    expansao: { value: 10_700, count: 37 },
    reativacao: { value: 2_100, count: 6 },
    contracao: { value: -4_700, count: 22 },
    cancelamento: { value: -9_100, count: 40 },
  },
};
const months: Month[] = ["jul", "ago", "set"];
/** Trimestre anterior (abr–jun), para os deltas do trimestre. */
const prevQuarter = { end: 412_400, logoChurn: 0.104 };

type Account = {
  name: string;
  month: Month;
  plan: string;
  value: number;
  move: Move;
};
const accounts: Account[] = [
  {
    move: "novos",
    name: "Granito Engenharia",
    month: "set",
    plan: "Enterprise, anual",
    value: 6_400,
  },
  {
    move: "novos",
    name: "Transportes Serra Azul",
    month: "ago",
    plan: "Enterprise, anual",
    value: 5_200,
  },
  {
    move: "novos",
    name: "Clínica Vale do Sol",
    month: "jul",
    plan: "Enterprise, mensal",
    value: 4_800,
  },
  {
    move: "novos",
    name: "Pomar Alimentos",
    month: "set",
    plan: "Pro, anual",
    value: 2_320,
  },
  {
    move: "novos",
    name: "Colégio Horizonte",
    month: "ago",
    plan: "Pro, anual",
    value: 1_960,
  },
  {
    move: "novos",
    name: "Ótica Ponto Focal",
    month: "jul",
    plan: "Pro, mensal",
    value: 1_540,
  },
  {
    move: "novos",
    name: "Arquitetura Traço Livre",
    month: "ago",
    plan: "Pro, mensal",
    value: 1_380,
  },
  {
    move: "expansao",
    name: "Rede Farma Vida",
    month: "ago",
    plan: "Enterprise · +40 licenças",
    value: 3_900,
  },
  {
    move: "expansao",
    name: "Construtora Alicerce",
    month: "set",
    plan: "Pro → Enterprise",
    value: 2_700,
  },
  {
    move: "expansao",
    name: "Laticínios Boa Vista",
    month: "jul",
    plan: "Pro · +12 licenças",
    value: 1_680,
  },
  {
    move: "expansao",
    name: "Agência Maré Alta",
    month: "set",
    plan: "Starter → Pro",
    value: 1_120,
  },
  {
    move: "expansao",
    name: "Escola de Idiomas Ponte",
    month: "ago",
    plan: "Pro · +6 licenças",
    value: 840,
  },
  {
    move: "reativacao",
    name: "Padaria Trigo de Ouro",
    month: "ago",
    plan: "Pro, mensal",
    value: 980,
  },
  {
    move: "reativacao",
    name: "Studio Pilates Equilíbrio",
    month: "jul",
    plan: "Starter, mensal",
    value: 620,
  },
  {
    move: "reativacao",
    name: "Contabilidade Exata",
    month: "set",
    plan: "Pro, mensal",
    value: 560,
  },
  {
    move: "contracao",
    name: "Móveis Lar Doce",
    month: "ago",
    plan: "Enterprise → Pro",
    value: -2_100,
  },
  {
    move: "contracao",
    name: "Hotel Brisa do Mar",
    month: "set",
    plan: "Pro · −8 licenças",
    value: -1_120,
  },
  {
    move: "contracao",
    name: "Distribuidora Norte Sul",
    month: "jul",
    plan: "Pro · −5 licenças",
    value: -700,
  },
  {
    move: "contracao",
    name: "Café Grão Nobre",
    month: "set",
    plan: "Pro → Starter",
    value: -410,
  },
  {
    move: "cancelamento",
    name: "Logística Rota Certa",
    month: "set",
    plan: "Enterprise, anual",
    value: -4_300,
  },
  {
    move: "cancelamento",
    name: "Varejo Bom Preço",
    month: "jul",
    plan: "Enterprise, mensal",
    value: -3_600,
  },
  {
    move: "cancelamento",
    name: "Clínica Sorriso Pleno",
    month: "ago",
    plan: "Pro, mensal",
    value: -1_400,
  },
  {
    move: "cancelamento",
    name: "Pet Shop Amigo Fiel",
    month: "ago",
    plan: "Pro, mensal",
    value: -1_120,
  },
  {
    move: "cancelamento",
    name: "Gráfica Impressão Viva",
    month: "set",
    plan: "Starter, mensal",
    value: -390,
  },
];

/** Soma o período: um mês ou o trimestre inteiro. */
function summary(period: Period) {
  const list = period === "tri" ? months : [period];
  const first = monthly[list[0]];
  const by = Object.fromEntries(
    moves.map((mv) => [
      mv,
      list.reduce(
        (s, mo) => ({
          value: s.value + monthly[mo][mv].value,
          count: s.count + monthly[mo][mv].count,
        }),
        { value: 0, count: 0 }
      ),
    ])
  ) as Record<Move, { value: number; count: number }>;
  const end = first.start + moves.reduce((s, mv) => s + by[mv].value, 0);
  const prevEnd =
    period === "tri"
      ? prevQuarter.end
      : period === "jul"
      ? 398_900
      : monthly[months[months.indexOf(period) - 1]].start;
  const prevChurn =
    period === "tri"
      ? prevQuarter.logoChurn
      : period === "jul"
      ? 0.034
      : monthly[months[months.indexOf(period) - 1]].cancelamento.count /
        monthly[months[months.indexOf(period) - 1]].accounts;
  return {
    start: first.start,
    end,
    accounts: first.accounts,
    by,
    nrr:
      (first.start +
        by.expansao.value +
        by.contracao.value +
        by.cancelamento.value) /
      first.start,
    quickRatio:
      (by.novos.value + by.expansao.value + by.reativacao.value) /
      Math.abs(by.contracao.value + by.cancelamento.value),
    logoChurn: by.cancelamento.count / first.accounts,
    prevEnd,
    prevChurn,
    list,
  };
}

const periodLabel: Record<Period, string> = {
  jul: "julho",
  ago: "agosto",
  set: "setembro",
  tri: "o trimestre",
};
const periodRange: Record<Period, string> = {
  jul: "1º a 31 de julho de 2026",
  ago: "1º a 31 de agosto de 2026",
  set: "1º a 30 de setembro de 2026",
  tri: "1º de julho a 30 de setembro de 2026",
};
const startName: Record<Period, string> = {
  jul: "Início de jul",
  ago: "Início de ago",
  set: "Início de set",
  tri: "Início de jul",
};
const endName: Record<Period, string> = {
  jul: "fim de jul",
  ago: "fim de ago",
  set: "fim de set",
  tri: "fim de set",
};

/* ------------------------------------------------------------------ */
/* Estados (no SEU app, troque pelo estado da consulta)                */
/* ------------------------------------------------------------------ */

function BridgeSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Carregando movimento de MRR"
      className="flex flex-col gap-6"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4"
          >
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-3 w-32 max-w-full" />
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-5 rounded-xl border border-line bg-surface px-6 py-5">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-56 max-w-full" />
          <Skeleton className="h-3 w-40 max-w-full" />
        </div>
        <div className="flex h-[300px] items-end gap-[6%] px-10">
          {[78, 30, 18, 8, 10, 14, 86].map((h, i) => (
            <div key={i} className="flex h-full w-full items-end">
              <div className="w-full" style={{ height: `${h}%` }}>
                <Skeleton className="h-full w-full rounded-md" />
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-3 border-t border-line pt-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="flex items-center justify-between gap-3">
              <div className="flex flex-col gap-1.5">
                <Skeleton className="h-3 w-40" />
                <Skeleton className="h-2.5 w-28" />
              </div>
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Lista de contas por trás do movimento selecionado                   */
/* ------------------------------------------------------------------ */

function MovementAccounts({
  move,
  period,
  total,
  count,
}: {
  move: Move;
  period: Period;
  total: number;
  count: number;
}) {
  const s = summary(period);
  const list = accounts
    .filter((a) => a.move === move && s.list.includes(a.month))
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
  const shown = list.reduce((t, a) => t + a.value, 0);
  const rest = count - list.length;
  const top = Math.max(1, ...list.map((a) => Math.abs(a.value)));
  const tone = total >= 0 ? "ok" : "rose";
  const signed = (n: number) =>
    `${n >= 0 ? "+" : "−"}${formatCurrency(Math.abs(n), { cents: false })}`;
  return (
    <section aria-labelledby="mrr-move-title" className="flex flex-col gap-1">
      <div className="flex items-start justify-between gap-3 pb-2">
        <div className="flex min-w-0 flex-col gap-0.5">
          <h4
            id="mrr-move-title"
            className="m-0 flex items-center gap-2 text-[13.5px] font-medium"
          >
            <span
              aria-hidden
              className={cn(
                "size-2 rounded-[2px]",
                tone === "ok" ? "bg-ok" : "bg-rose"
              )}
            />
            {moveLabel[move]}
          </h4>
          <p className="m-0 text-[12px] text-muted">
            {formatNumber(count)} {moveNoun[move][count === 1 ? 0 : 1]} em{" "}
            {periodLabel[period]}
          </p>
        </div>
        <span
          className={cn(
            "shrink-0 text-[13.5px] font-medium tabular-nums",
            tone === "ok" ? "text-ok" : "text-rose"
          )}
        >
          {signed(total)}
        </span>
      </div>
      <ul className="m-0 flex list-none flex-col p-0">
        {list.map((a) => (
          <li
            key={a.name}
            className="flex flex-col gap-1.5 border-t border-line py-2.5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-[13px] text-ink">{a.name}</span>
                <span className="text-[12px] text-muted">
                  {monthName[a.month]} · {a.plan}
                </span>
              </div>
              <span className="shrink-0 text-[13px] tabular-nums text-ink-soft">
                {signed(a.value)}
              </span>
            </div>
            <span aria-hidden className="h-[3px] rounded-full bg-soft">
              <span
                className={cn(
                  "block h-full rounded-full",
                  tone === "ok" ? "bg-ok/70" : "bg-rose/70"
                )}
                style={{ width: `${(Math.abs(a.value) / top) * 100}%` }}
              />
            </span>
          </li>
        ))}
        {rest > 0 && (
          <li className="flex items-center justify-between gap-3 border-t border-line py-2.5 text-[12.5px] text-muted">
            <span>
              Outras {formatNumber(rest)} {moveNoun[move][rest === 1 ? 0 : 1]}
            </span>
            <span className="tabular-nums">{signed(total - shown)}</span>
          </li>
        )}
      </ul>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Tela                                                                */
/* ------------------------------------------------------------------ */

export default function SaasMrrBridge() {
  const estado = useFrameParam("estado");
  const [period, setPeriod] = useState<Period>("tri");
  const [unit, setUnit] = useState<"brl" | "pct">("brl");
  const [selected, setSelected] = useState<number | null>(1);
  const s = summary(period);
  const filtered = estado === "filtro";
  const clear = () => setFrameQuery({ estado: undefined });

  const steps: WaterfallStep[] = [
    { label: startName[period], value: s.start, kind: "total" },
    ...moves.map((mv) => ({ label: moveLabel[mv], value: s.by[mv].value })),
    { label: "Fim", value: s.end, kind: "total" },
  ];
  const shown =
    unit === "pct"
      ? steps.map((st) => ({ ...st, value: st.value / s.start }))
      : steps;
  const money = (n: number) => formatCurrency(n, { compact: true });
  const pct = (n: number) => formatPercent(n, 1);
  const fmt = unit === "pct" ? pct : money;
  const selMove =
    selected != null && selected >= 1 && selected <= moves.length
      ? moves[selected - 1]
      : null;

  return (
    <SaasShell current={here}>
      <Page>
        <PageHeading
          title="Movimento de MRR"
          description={
            estado === "vazio"
              ? "Como a receita recorrente muda de um período para o outro: novos, expansão, reativação, contração e cancelamento."
              : `Todos os planos · ${periodRange[period]}`
          }
          actions={
            estado === "vazio" || estado === "carregando" ? undefined : (
              <SegmentedControl
                label="Período"
                value={period}
                onChange={(p) => setPeriod(p)}
                options={[
                  { value: "jul", label: "Jul" },
                  { value: "ago", label: "Ago" },
                  { value: "set", label: "Set" },
                  { value: "tri", label: "Trimestre" },
                ]}
              />
            )
          }
        />
        <div className="mt-6 flex flex-col gap-6">
          {estado === "carregando" ? (
            <BridgeSkeleton />
          ) : estado === "erro" ? (
            <div className="rounded-xl border border-line bg-surface">
              <ErrorState
                size="md"
                title="Não foi possível carregar o movimento de MRR"
                description="O servidor de cobrança não respondeu. Nada foi perdido; tente de novo em instantes."
                retryLabel="Tentar de novo"
                onRetry={clear}
                secondaryAction={
                  <Button variant="ghost" href="#/frame/saas-billing">
                    Ir para cobrança
                  </Button>
                }
              />
            </div>
          ) : estado === "vazio" ? (
            <Empty
              title="Ainda não há receita recorrente para comparar"
              hint="A ponte aparece quando houver pelo menos um mês fechado de assinaturas pagas."
              action={
                <Button href="#/frame/saas-integrations">
                  Conectar meio de pagamento
                </Button>
              }
            />
          ) : (
            <>
              {!filtered && (
                <KpiGrid>
                  <KpiCard
                    label={`MRR em ${
                      period === "tri" || period === "set"
                        ? "30 de set"
                        : period === "ago"
                        ? "31 de ago"
                        : "31 de jul"
                    }`}
                    value={formatCurrency(s.end, { cents: false })}
                    delta={(s.end - s.start) / s.start}
                    period={`+${formatCurrency(s.end - s.start, {
                      cents: false,
                    })} desde ${startName[period].toLowerCase()}`}
                  />
                  <KpiCard
                    label="Retenção líquida (NRR)"
                    value={formatPercent(s.nrr, 1)}
                    hint="Expansão menos contração e cancelamento, sobre o MRR do início"
                  />
                  <KpiCard
                    label="Quick ratio"
                    value={formatNumber(s.quickRatio, 2)}
                    hint="Ganhos (novos, expansão, reativação) ÷ perdas. Acima de 2 é saudável"
                  />
                  <KpiCard
                    label="Churn de logos"
                    value={formatPercent(s.logoChurn, 1)}
                    delta={(s.logoChurn - s.prevChurn) / s.prevChurn}
                    goodWhen="down"
                    period={`${formatNumber(
                      s.by.cancelamento.count
                    )} de ${formatNumber(s.accounts)} contas · vs. ${
                      period === "tri" ? "trimestre anterior" : "mês anterior"
                    }`}
                  />
                </KpiGrid>
              )}

              <ChartCard
                title="O que mudou o MRR no período?"
                description={`${startName[period]} → ${endName[period]} · ${
                  unit === "pct" ? "em % do MRR do início" : "em R$"
                } · eixo começa perto do menor valor`}
                action={
                  filtered ? undefined : (
                    <SegmentedControl
                      label="Unidade"
                      value={unit}
                      onChange={setUnit}
                      options={[
                        { value: "brl", label: "R$" },
                        { value: "pct", label: "% do início" },
                      ]}
                    />
                  )
                }
              >
                {filtered ? (
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-wrap items-center gap-2 text-[12.5px] text-muted">
                      Filtro:
                      <span className="inline-flex items-center gap-1 rounded-md border border-line bg-soft px-2 py-0.5 text-ink">
                        Plano Starter anual
                        <button
                          type="button"
                          aria-label="Remover filtro Plano Starter anual"
                          onClick={clear}
                          className="ds-hit inline-flex rounded text-muted outline-none hover:text-ink focus-visible:ring-2 focus-visible:ring-muted/40"
                        >
                          <X className="size-3.5" />
                        </button>
                      </span>
                    </div>
                    <Empty
                      framed={false}
                      title="Nenhum movimento de MRR neste recorte"
                      hint="Nenhuma conta do plano Starter anual mudou de valor no período."
                      action={
                        <Button variant="ghost" onClick={clear}>
                          Limpar filtro
                        </Button>
                      }
                    />
                  </div>
                ) : (
                  <div className="flex flex-col gap-5">
                    <WaterfallChart
                      steps={shown}
                      format={fmt}
                      formatAxis={
                        unit === "pct" ? (n) => formatPercent(n, 0) : money
                      }
                      axisBreak
                      connectors
                      showValues
                      selected={selected}
                      onSelect={setSelected}
                      height={300}
                      label={`Ponte de MRR: ${periodLabel[period]}`}
                    />
                    <div className="border-t border-line pt-4">
                      {selMove ? (
                        <MovementAccounts
                          move={selMove}
                          period={period}
                          total={s.by[selMove].value}
                          count={s.by[selMove].count}
                        />
                      ) : (
                        <p className="m-0 text-[12.5px] text-muted">
                          {selected === 0
                            ? `MRR de ${formatCurrency(s.start, {
                                cents: false,
                              })} em ${formatNumber(
                                s.accounts
                              )} contas no início do período.`
                            : selected === moves.length + 1
                            ? `MRR de ${formatCurrency(s.end, {
                                cents: false,
                              })} no fim do período.`
                            : "Selecione uma barra para ver as contas por trás do movimento."}{" "}
                          {selected != null &&
                            "Selecione um movimento para ver as contas."}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </ChartCard>
            </>
          )}
        </div>
      </Page>
    </SaasShell>
  );
}
