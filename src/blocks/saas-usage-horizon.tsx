import { useState } from "react";
import {
  Button,
  ChartCard,
  Empty,
  ErrorState,
  HorizonChart,
  KpiCard,
  KpiGrid,
  Page,
  PageHeading,
  SegmentedControl,
  Select,
  Skeleton,
  formatDelta,
  formatNumber,
  type HorizonSeries,
} from "@g4ai/ds";
import { SaasShell } from "./shells/saas-shell";
import { setFrameQuery, useFrameParam } from "./shells/frame-route";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Uso por cidade contra a base",
  description: "Horizon de 14 cidades: sessões diárias de junho a setembro contra a média de maio, com cruz sincronizada, ordenação por nome, pico ou último dia e número de faixas ajustável.",
  category: "SaaS",
  order: 12,
  height: 1180,
  concept: {
    goal: "Achar, entre muitas cidades, onde o uso se afastou da base (para cima ou para baixo), quando começou e se ainda dura.",
    patterns: [
      "Anatomia B · Painel: cabeçalho fixo, faixa de KPIs do último dia e um cartão-pergunta",
      "Horizon: uma linha baixa por cidade dobrada em faixas; acima da base em chart-pos, abaixo em chart-neg",
      "Cruz sincronizada em todas as linhas (ponteiro, toque ou setas) e valor do dia à direita de cada linha",
      "Ordenar (Nome, Pico, Último) e Faixas (1–4) como SegmentedControl; região como filtro",
      "Legenda que explica a leitura: tamanho da faixa e 'cor mais forte = mais longe da base'",
    ],
    adapt: [
      "Pedidos por loja, tickets por fila, latência por serviço, vendas por vendedor contra a própria meta",
      "Qualquer conjunto de 8 a 20 séries diárias comparadas com a própria base",
    ],
    avoid: [
      "Usar com menos de 6 séries: um LineChart com as linhas sobrepostas lê melhor",
      "Comparar valores absolutos entre cidades: o horizon mostra desvio relativo à base de cada uma",
      "Ler cor como bom ou ruim: azul é acima, laranja é abaixo",
    ],
  },
} as const;

/* ------------------------------------------------------------------ */
/* Dados de exemplo: desvio diário de sessões contra a média de maio    */
/* ------------------------------------------------------------------ */

const weekdays = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const monthNames = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const DAYS = 122; // 1º de junho a 30 de setembro de 2026
const dates = Array.from({ length: DAYS }, (_, i) => new Date(2026, 5, 1 + i));
const days = dates.map((d) => `${weekdays[d.getDay()]}, ${d.getDate()} de ${monthNames[d.getMonth()]}`);
const ticks = dates.flatMap((d, i) => (d.getDate() === 1 ? [{ index: i, label: monthNames[d.getMonth()].slice(0, 3) }] : []));

type Region = "norte" | "nordeste" | "centro-oeste" | "sudeste" | "sul";
const regionLabel: Record<Region, string> = { norte: "Norte", nordeste: "Nordeste", "centro-oeste": "Centro-Oeste", sudeste: "Sudeste", sul: "Sul" };

// Tendência (início → fim), um evento (centro, largura, amplitude) e queda no fim de semana.
type City = { key: string; label: string; region: Region; from: number; to: number; event?: [number, number, number]; weekend?: number };
const cities: City[] = [
  { key: "sp", label: "São Paulo", region: "sudeste", from: 0.02, to: 0.11 },
  { key: "rj", label: "Rio de Janeiro", region: "sudeste", from: 0, to: 0.04, event: [45, 8, 0.22] },
  { key: "bh", label: "Belo Horizonte", region: "sudeste", from: 0.01, to: -0.07 },
  { key: "cwb", label: "Curitiba", region: "sul", from: 0.03, to: 0.12 },
  { key: "poa", label: "Porto Alegre", region: "sul", from: -0.04, to: 0.02, event: [70, 10, -0.17] },
  { key: "rec", label: "Recife", region: "nordeste", from: 0, to: 0.08, event: [23, 5, 0.29] },
  { key: "ssa", label: "Salvador", region: "nordeste", from: 0.02, to: 0.05, event: [23, 4, 0.15] },
  { key: "for", label: "Fortaleza", region: "nordeste", from: 0.04, to: 0.17 },
  { key: "bsb", label: "Brasília", region: "centro-oeste", from: 0, to: -0.03, event: [98, 6, 0.16], weekend: 0.09 },
  { key: "gyn", label: "Goiânia", region: "centro-oeste", from: -0.02, to: 0.06 },
  { key: "mao", label: "Manaus", region: "norte", from: -0.05, to: -0.14 },
  { key: "bel", label: "Belém", region: "norte", from: 0, to: 0.05, event: [60, 7, -0.12] },
  { key: "fln", label: "Florianópolis", region: "sul", from: 0.05, to: 0.02, event: [35, 9, 0.18], weekend: 0.01 },
  { key: "cps", label: "Campinas", region: "sudeste", from: 0.01, to: 0.12, event: [105, 7, 0.12] },
];

const round3 = (v: number) => Math.round(v * 1000) / 1000;
const seriesAll: (HorizonSeries & { region: Region })[] = cities.map((c, ci) => ({
  key: c.key,
  label: c.label,
  region: c.region,
  values: dates.map((d, i) => {
    const t = i / (DAYS - 1);
    const trend = c.from + (c.to - c.from) * t;
    const event = c.event ? c.event[2] * Math.exp(-(((i - c.event[0]) / c.event[1]) ** 2)) : 0;
    const weekend = d.getDay() === 0 || d.getDay() === 6 ? -(c.weekend ?? 0.03) : 0;
    const noise = 0.018 * Math.sin(i * 1.7 + ci * 3.1) + 0.012 * Math.sin(i * 0.37 + ci);
    return round3(trend + event + weekend + noise);
  }),
}));

/* ------------------------------------------------------------------ */

const here = "#/frame/saas-usage-horizon";
type Sort = "name" | "peak" | "latest";
type Bands = "1" | "2" | "3" | "4";

/** Carregando com a forma final: KPIs, controles e linhas baixas. */
function HorizonSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Carregando uso por cidade" className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-3 w-32 max-w-full" />
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-4 rounded-xl border border-line bg-surface px-6 py-5">
        <Skeleton className="h-4 w-64 max-w-full" />
        <Skeleton className="h-8 w-80 max-w-full rounded-lg" />
        <div className="flex flex-col">
          {Array.from({ length: 10 }, (_, i) => (
            <div key={i} className="flex h-8 items-center gap-3 border-b border-line">
              <Skeleton className="h-3 w-20 shrink-0" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-3 w-10 shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SaasUsageHorizon() {
  const estado = useFrameParam("estado");
  const [sort, setSort] = useState<Sort>("peak");
  const [bands, setBands] = useState<Bands>("3");
  const [region, setRegion] = useState<string>(estado === "filtro" ? "norte" : "todas");
  // ?estado=filtro: as cidades do Norte ainda não têm base (sem maio completo).
  const pool = estado === "filtro" ? seriesAll.filter((s) => s.region !== "norte") : seriesAll;
  const shown = region === "todas" ? pool : pool.filter((s) => s.region === region);

  const last = DAYS - 1;
  const latest = shown.map((s) => ({ label: s.label, v: s.values[last] ?? 0 }));
  const above = latest.filter((x) => x.v > 0).length;
  const top = [...latest].sort((a, z) => z.v - a.v)[0];
  const bottom = [...latest].sort((a, z) => a.v - z.v)[0];

  const clear = () => {
    setRegion("todas");
    setFrameQuery({ estado: undefined });
  };

  return (
    <SaasShell current={here}>
      <Page>
        <PageHeading title="Uso por cidade" description="Sessões diárias de cada cidade comparadas com a média diária de maio. 1º de junho a 30 de setembro de 2026." />
        <div className="mt-6 flex flex-col gap-6">
          {estado === "carregando" ? (
            <HorizonSkeleton />
          ) : estado === "erro" ? (
            <div className="rounded-xl border border-line bg-surface">
              <ErrorState
                size="md"
                title="Não foi possível carregar o uso por cidade"
                description="O servidor de eventos não respondeu. Nada foi perdido; tente de novo em instantes."
                retryLabel="Tentar de novo"
                onRetry={() => setFrameQuery({ estado: undefined })}
                secondaryAction={
                  <Button variant="ghost" href="#/frame/saas-usage">
                    Ir para Uso e limites
                  </Button>
                }
              />
            </div>
          ) : estado === "vazio" ? (
            <Empty
              title="Ainda não há uma base para comparar"
              hint="A base é a média diária de um mês completo de sessões. Ela aparece quando o rastreamento do app completar o primeiro mês."
              action={<Button href="#/frame/saas-integrations">Conferir o rastreamento</Button>}
            />
          ) : (
            <>
              {shown.length > 0 && top && bottom && (
                <KpiGrid cols={3}>
                  <KpiCard label="Cidades acima da base" value={`${formatNumber(above)} de ${formatNumber(shown.length)}`} hint="no último dia, 30 de setembro" />
                  <KpiCard label="Maior alta no último dia" value={top.label} hint={`${formatDelta(top.v, 0)} sobre a média de maio`} />
                  <KpiCard label="Maior queda no último dia" value={bottom.label} hint={`${formatDelta(bottom.v, 0)} sobre a média de maio`} />
                </KpiGrid>
              )}
              <ChartCard title="Onde o uso se afastou da base?" description="Sessões por dia contra a média diária de maio de cada cidade · junho a setembro de 2026">
                <div className="flex flex-col gap-5">
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] text-muted" aria-hidden>
                        Ordenar
                      </span>
                      <SegmentedControl
                        label="Ordenar por"
                        value={sort}
                        onChange={setSort}
                        options={[
                          { value: "name", label: "Nome" },
                          { value: "peak", label: "Pico" },
                          { value: "latest", label: "Último" },
                        ]}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] text-muted" aria-hidden>
                        Faixas
                      </span>
                      <SegmentedControl label="Faixas" value={bands} onChange={setBands} options={(["1", "2", "3", "4"] as const).map((b) => ({ value: b, label: b }))} />
                    </div>
                    <Select
                      size="compact"
                      label="Região"
                      hideLabel
                      value={region}
                      onValueChange={setRegion}
                      className="w-44"
                      options={[{ value: "todas", label: "Todas as regiões" }, ...(Object.keys(regionLabel) as Region[]).map((r) => ({ value: r, label: regionLabel[r] }))]}
                    />
                  </div>
                  {shown.length === 0 ? (
                    <Empty
                      framed={false}
                      title={`Nenhuma cidade da região ${regionLabel[region as Region] ?? ""} no recorte`}
                      hint="As cidades desta região ainda não têm um mês completo de sessões para formar a base."
                      action={
                        <Button variant="ghost" onClick={clear}>
                          Limpar filtro
                        </Button>
                      }
                    />
                  ) : (
                    <HorizonChart
                      label="Desvio diário de sessões por cidade contra a média de maio, de junho a setembro de 2026"
                      series={shown}
                      days={days}
                      ticks={ticks}
                      sort={sort}
                      bands={Number(bands) as 1 | 2 | 3 | 4}
                    />
                  )}
                </div>
              </ChartCard>
            </>
          )}
        </div>
      </Page>
    </SaasShell>
  );
}
