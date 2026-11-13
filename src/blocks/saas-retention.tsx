import { X } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Button,
  ChartCard,
  Delta,
  Empty,
  ErrorState,
  HeatmapMatrix,
  KpiCard,
  KpiGrid,
  Page,
  PageHeading,
  RetentionCurves,
  SegmentedControl,
  Skeleton,
  formatNumber,
  formatPercent,
} from "@g4ai/ds";
import { SaasShell } from "./shells/saas-shell";
import { setFrameQuery, useFrameParam } from "./shells/frame-route";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Retenção por coorte",
  description:
    "Triângulo de coortes com escala em degraus e legenda ligada, linha de média, curvas de retenção por coorte e recorte por segmento (self-service × vendas).",
  category: "SaaS",
  order: 12,
  height: 1180,
  concept: {
    goal: "Saber se as coortes novas retêm melhor que as antigas e em que mês a perda se estabiliza.",
    patterns: [
      "Anatomia B · Painel: cabeçalho com segmento, KPIs, um gráfico principal",
      "Mapa de calor em triângulo (null = mês ainda não alcançado) com tamanho da coorte e linha de média",
      "Escala em degraus com legenda que destaca as células da faixa",
      "Mesma pergunta em curvas: coortes recentes mais escuras, média em destaque",
    ],
    adapt: [
      "Retenção de clientes no varejo, permanência de colaboradores (ATS), recompra no e-commerce",
    ],
    avoid: [
      "Coorte sem o tamanho ao lado",
      "Escala contínua com dezenas de tons",
      "Comparar coortes sem o mesmo mês desde o início",
    ],
  },
} as const;

/* ------------------------------------------------------------------ */
/* Dados de exemplo (troque pela sua consulta)                         */
/* ------------------------------------------------------------------ */

const here = "#/frame/saas-retention";
type Segment = "todos" | "self" | "vendas";

const cohorts = [
  "set 2025",
  "out 2025",
  "nov 2025",
  "dez 2025",
  "jan 2026",
  "fev 2026",
  "mar 2026",
  "abr 2026",
  "mai 2026",
  "jun 2026",
  "jul 2026",
  "ago 2026",
];
const monthsSince = Array.from({ length: 12 }, (_, i) => String(i + 1));
/** Curva típica de espaços ativos por mês desde o cadastro. */
const baseCurve = [
  0.74, 0.63, 0.55, 0.5, 0.47, 0.44, 0.42, 0.41, 0.4, 0.39, 0.385, 0.38,
];
const sizes: Record<Segment, number[]> = {
  todos: [360, 386, 402, 416, 395, 398, 461, 434, 459, 502, 495, 491],
  self: [262, 281, 290, 301, 282, 289, 336, 313, 331, 361, 357, 352],
  vendas: [98, 105, 112, 115, 113, 109, 125, 121, 128, 141, 138, 139],
};
const shift: Record<Segment, number> = { todos: 0, self: -0.05, vendas: 0.09 };

/** Triângulo: a coorte i tem (12 − i) meses observados; o resto é null. */
function matrix(segment: Segment) {
  return cohorts.map((_, i) =>
    monthsSince.map((__, m) => {
      if (m >= cohorts.length - i) return null;
      const wobble = Math.sin(i * 1.7 + m * 0.9) * 0.012;
      const better = i * 0.004 * (1 - m / 24);
      return (
        Math.round(
          Math.min(0.97, baseCurve[m] + shift[segment] + better + wobble) * 100
        ) / 100
      );
    })
  );
}

/** Média ponderada pelo tamanho da coorte, só com as coortes que já chegaram ao mês. */
function weighted(
  values: (number | null)[][],
  size: number[],
  m: number,
  pick?: number[]
) {
  let n = 0;
  let s = 0;
  values.forEach((row, i) => {
    if (pick && !pick.includes(i)) return;
    const v = row[m];
    if (v == null) return;
    n += size[i];
    s += v * size[i];
  });
  return n ? s / n : null;
}

const pp = (d: number) =>
  `${d > 0 ? "+" : d < 0 ? "−" : ""}${formatNumber(Math.abs(d) * 100, 1)} p.p.`;

/* ------------------------------------------------------------------ */
/* Estados                                                             */
/* ------------------------------------------------------------------ */

function RetentionSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Carregando retenção por coorte"
      className="flex flex-col gap-6"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <div
            key={i}
            className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4"
          >
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-3 w-40 max-w-full" />
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-4 rounded-xl border border-line bg-surface px-6 py-5">
        <Skeleton className="h-4 w-60 max-w-full" />
        <Skeleton className="h-3 w-48 max-w-full" />
        <div className="flex flex-col gap-1 overflow-hidden">
          {Array.from({ length: 8 }, (_, r) => (
            <div key={r} className="flex gap-1">
              <Skeleton className="h-6 w-16 shrink-0" />
              {Array.from({ length: 12 - r }, (__, c) => (
                <Skeleton key={c} className="h-6 w-9 shrink-0" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Tela                                                                */
/* ------------------------------------------------------------------ */

export default function SaasRetention() {
  const estado = useFrameParam("estado");
  const [segment, setSegment] = useState<Segment>("todos");
  const [view, setView] = useState<"mapa" | "curvas">("mapa");
  const clear = () => setFrameQuery({ estado: undefined });
  const filtered = estado === "filtro";

  const data = useMemo(() => {
    const values = matrix(segment);
    const size = sizes[segment];
    const avg = monthsSince.map((_, m) => weighted(values, size, m));
    const first3 = [0, 1, 2];
    const last3M1 = [9, 10, 11];
    // Mês 6: últimas 3 coortes que já chegaram ao mês 6 (índices 4–6).
    const last3M6 = [4, 5, 6];
    return {
      values,
      size,
      avg,
      total: size.reduce((s, n) => s + n, 0),
      m1: avg[0] ?? 0,
      m6: avg[5] ?? 0,
      d1:
        (weighted(values, size, 0, last3M1) ?? 0) -
        (weighted(values, size, 0, first3) ?? 0),
      d6:
        (weighted(values, size, 5, last3M6) ?? 0) -
        (weighted(values, size, 5, first3) ?? 0),
    };
  }, [segment]);

  const segName: Record<Segment, string> = {
    todos: "Todos os espaços",
    self: "Self-service",
    vendas: "Vendas",
  };

  return (
    <SaasShell current={here}>
      <Page>
        <PageHeading
          title="Retenção por coorte"
          description={
            estado === "vazio"
              ? "Espaços que continuam ativos a cada mês depois do cadastro, agrupados pelo mês de entrada."
              : `Espaços ainda ativos a cada mês depois do cadastro · ${segName[segment]} · dados até 30 de setembro de 2026`
          }
          actions={
            estado === "vazio" || estado === "carregando" ? undefined : (
              <SegmentedControl
                label="Segmento"
                value={segment}
                onChange={setSegment}
                options={[
                  { value: "todos", label: "Todos" },
                  { value: "self", label: "Self-service" },
                  { value: "vendas", label: "Vendas" },
                ]}
              />
            )
          }
        />
        <div className="mt-6 flex flex-col gap-6">
          {estado === "carregando" ? (
            <RetentionSkeleton />
          ) : estado === "erro" ? (
            <div className="rounded-xl border border-line bg-surface">
              <ErrorState
                size="md"
                title="Não foi possível carregar as coortes"
                description="A consulta de atividade demorou demais e foi interrompida. Nada foi perdido; tente de novo em instantes."
                retryLabel="Tentar de novo"
                onRetry={clear}
                secondaryAction={
                  <Button variant="ghost" href="#/frame/saas-dashboard">
                    Ir para a visão geral
                  </Button>
                }
              />
            </div>
          ) : estado === "vazio" ? (
            <Empty
              title="Ainda não há coortes para comparar"
              hint="A primeira coorte aparece um mês depois dos primeiros cadastros, quando dá para medir quem voltou."
              action={
                <Button href="#/frame/saas-integrations">
                  Conectar o rastreamento de uso
                </Button>
              }
            />
          ) : (
            <>
              {!filtered && (
                <KpiGrid cols={3}>
                  <KpiCard
                    label="Retenção no mês 1"
                    value={formatPercent(data.m1, 1)}
                    hint={
                      <span className="flex flex-wrap items-center gap-1.5">
                        <Delta value={data.d1} format={pp} variant="text" />
                        últimas 3 vs. primeiras 3 coortes
                      </span>
                    }
                  />
                  <KpiCard
                    label="Retenção no mês 6"
                    value={formatPercent(data.m6, 1)}
                    hint={
                      <span className="flex flex-wrap items-center gap-1.5">
                        <Delta value={data.d6} format={pp} variant="text" />
                        últimas 3 vs. primeiras 3 coortes
                      </span>
                    }
                  />
                  <KpiCard
                    label="Novos espaços"
                    value={formatNumber(data.total)}
                    hint="Cadastros de setembro de 2025 a agosto de 2026"
                  />
                </KpiGrid>
              )}

              <ChartCard
                title="As coortes novas retêm melhor que as antigas?"
                description="% de espaços ativos por mês desde o cadastro · uma linha por mês de entrada"
                action={
                  filtered ? undefined : (
                    <SegmentedControl
                      label="Visualização"
                      value={view}
                      onChange={setView}
                      options={[
                        { value: "mapa", label: "Mapa de calor" },
                        { value: "curvas", label: "Curvas" },
                      ]}
                    />
                  )
                }
                insight={
                  filtered
                    ? undefined
                    : `No mês 1, as coortes recentes retêm ${formatNumber(
                        Math.abs(data.d1) * 100,
                        1
                      )} p.p. ${
                        data.d1 >= 0 ? "a mais" : "a menos"
                      } que as primeiras`
                }
                insightTrend={
                  filtered ? undefined : data.d1 >= 0 ? "up" : "down"
                }
                insightDetail={
                  filtered
                    ? undefined
                    : "Média ponderada pelo tamanho da coorte"
                }
              >
                {filtered ? (
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-wrap items-center gap-2 text-[12.5px] text-muted">
                      Filtro:
                      <span className="inline-flex items-center gap-1 rounded-md border border-line bg-soft px-2 py-0.5 text-ink">
                        Região Norte
                        <button
                          type="button"
                          aria-label="Remover filtro Região Norte"
                          onClick={clear}
                          className="ds-hit inline-flex rounded text-muted outline-none hover:text-ink focus-visible:ring-2 focus-visible:ring-muted/40"
                        >
                          <X className="size-3.5" />
                        </button>
                      </span>
                    </div>
                    <Empty
                      framed={false}
                      title="Nenhuma coorte neste recorte"
                      hint="Nenhum espaço da Região Norte se cadastrou no período."
                      action={
                        <Button variant="ghost" onClick={clear}>
                          Limpar filtro
                        </Button>
                      }
                    />
                  </div>
                ) : view === "mapa" ? (
                  <HeatmapMatrix
                    label={`Retenção por coorte: ${segName[segment]}`}
                    rows={cohorts}
                    columns={monthsSince}
                    values={data.values}
                    rowsLabel="Coorte"
                    rowMetaLabel="Espaços"
                    rowMeta={data.size.map((n) => formatNumber(n))}
                    summaryRow={{
                      label: "Média",
                      values: data.avg,
                      meta: formatNumber(data.total),
                    }}
                    scale={{ steps: 6, domain: [0.2, 0.8] }}
                    legend
                    legendTitle="% ativos"
                    valueLabel="Ativos"
                    format={(n) => formatPercent(n, 0)}
                    cell={44}
                  />
                ) : (
                  <RetentionCurves
                    label={`Curvas de retenção por coorte: ${segName[segment]}`}
                    rows={cohorts.map((c, i) => ({
                      label: c,
                      values: data.values[i],
                    }))}
                    columns={monthsSince}
                    average={{ label: "Média", values: data.avg }}
                    height={300}
                  />
                )}
              </ChartCard>
              {!filtered && (
                <p className="m-0 text-[12px] text-muted">
                  Meses desde o cadastro no eixo horizontal. Células vazias: a
                  coorte ainda não chegou àquele mês.
                </p>
              )}
            </>
          )}
        </div>
      </Page>
    </SaasShell>
  );
}
