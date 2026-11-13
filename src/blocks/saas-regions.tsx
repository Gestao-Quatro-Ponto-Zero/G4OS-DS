import { Users } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Badge,
  BarList,
  Button,
  ChartCard,
  ChoroplethMap,
  Empty,
  ErrorState,
  Page,
  PageHeading,
  RankedRegionList,
  SegmentedControl,
  Select,
  Skeleton,
  brRegions,
  brUfs,
  formatCompact,
  formatCurrency,
  formatDelta,
  formatNumber,
  formatPercent,
  fitGeoViewBox,
  useLinkedHighlight,
  type BrRegion,
  type BrUfId,
  type ChoroplethScaleOptions,
} from "@g4ai/ds";
import { SaasShell } from "./shells/saas-shell";
import { setFrameQuery, useFrameParam } from "./shells/frame-route";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Receita por estado",
  description: "Mapa por UF com receita, crescimento ou penetração em degraus, lista ordenada ligada ao mapa, filtro por região e zoom com detalhe das cidades ao escolher um estado.",
  category: "SaaS",
  order: 11,
  height: 1180,
  concept: {
    goal: "Ver onde a receita está concentrada e onde cresce, para decidir em que estados investir em vendas, parceiros e suporte local.",
    patterns: [
      "Anatomia B · Painel: cabeçalho fixo com filtro de região, um cartão principal",
      "Métrica no SegmentedControl do cartão; crescimento usa escala divergente (abaixo × acima de zero), não verde × vermelho",
      "Mapa nunca sozinho: lista ordenada ao lado, ligada pelo mesmo realce (hover numa acende na outra)",
      "Escolher um estado aproxima o mapa e abre o detalhe (cidades, clientes); Voltar ao Brasil devolve a visão inteira",
      "Sem dado em hachura com travessão, diferente de zero",
    ],
    adapt: ["Vendas por região de um ERP", "Candidatos por estado num ATS", "Inadimplência por UF no financeiro", "Outro país: passe regions e viewBox próprios"],
    avoid: ["Mapa sem a lista ordenada (estados grandes parecem mais importantes)", "Escala contínua sem degraus", "Pintar crescimento de verde e vermelho como se fosse bom × ruim"],
  },
} as const;

const here = "#/frame/saas-regions";

/* ------------------------------------------------------------------ */
/* Dados de exemplo: clientes ativos do Pulso em outubro de 2026.      */
/* mrr em R$ mil por mês; growth = variação contra outubro de 2025;    */
/* reach = fatia das empresas-alvo da UF que já são clientes (null =   */
/* base de empresas indisponível).                                     */
/* ------------------------------------------------------------------ */

type UfData = { mrr: number; growth: number; reach: number | null; clients: number; cities: [string, string, string] };

const ufData: Record<BrUfId, UfData> = {
  SP: { mrr: 1480, growth: 0.12, reach: 0.021, clients: 612, cities: ["São Paulo", "Campinas", "Ribeirão Preto"] },
  RJ: { mrr: 520, growth: 0.06, reach: 0.016, clients: 214, cities: ["Rio de Janeiro", "Niterói", "Duque de Caxias"] },
  MG: { mrr: 430, growth: 0.18, reach: 0.012, clients: 187, cities: ["Belo Horizonte", "Uberlândia", "Contagem"] },
  PR: { mrr: 310, growth: 0.22, reach: 0.018, clients: 131, cities: ["Curitiba", "Londrina", "Maringá"] },
  RS: { mrr: 280, growth: 0.04, reach: 0.014, clients: 118, cities: ["Porto Alegre", "Caxias do Sul", "Pelotas"] },
  SC: { mrr: 240, growth: 0.31, reach: 0.024, clients: 97, cities: ["Florianópolis", "Joinville", "Blumenau"] },
  DF: { mrr: 190, growth: 0.09, reach: 0.026, clients: 74, cities: ["Brasília", "Taguatinga", "Águas Claras"] },
  GO: { mrr: 120, growth: 0.27, reach: 0.011, clients: 52, cities: ["Goiânia", "Aparecida de Goiânia", "Anápolis"] },
  BA: { mrr: 110, growth: 0.15, reach: 0.006, clients: 49, cities: ["Salvador", "Feira de Santana", "Vitória da Conquista"] },
  PE: { mrr: 95, growth: 0.19, reach: 0.008, clients: 41, cities: ["Recife", "Jaboatão dos Guararapes", "Caruaru"] },
  CE: { mrr: 80, growth: 0.24, reach: 0.009, clients: 35, cities: ["Fortaleza", "Caucaia", "Juazeiro do Norte"] },
  ES: { mrr: 70, growth: -0.03, reach: 0.013, clients: 31, cities: ["Vitória", "Vila Velha", "Serra"] },
  MT: { mrr: 55, growth: 0.38, reach: 0.01, clients: 22, cities: ["Cuiabá", "Rondonópolis", "Sinop"] },
  MS: { mrr: 45, growth: 0.14, reach: 0.009, clients: 19, cities: ["Campo Grande", "Dourados", "Três Lagoas"] },
  PA: { mrr: 40, growth: 0.11, reach: 0.004, clients: 18, cities: ["Belém", "Ananindeua", "Santarém"] },
  AM: { mrr: 35, growth: -0.08, reach: 0.005, clients: 15, cities: ["Manaus", "Parintins", "Itacoatiara"] },
  RN: { mrr: 22, growth: 0.05, reach: 0.006, clients: 10, cities: ["Natal", "Mossoró", "Parnamirim"] },
  PB: { mrr: 20, growth: 0.21, reach: 0.006, clients: 9, cities: ["João Pessoa", "Campina Grande", "Santa Rita"] },
  MA: { mrr: 18, growth: -0.12, reach: 0.003, clients: 8, cities: ["São Luís", "Imperatriz", "Timon"] },
  AL: { mrr: 15, growth: 0.02, reach: 0.004, clients: 7, cities: ["Maceió", "Arapiraca", "Rio Largo"] },
  PI: { mrr: 14, growth: 0.16, reach: 0.004, clients: 6, cities: ["Teresina", "Parnaíba", "Picos"] },
  SE: { mrr: 12, growth: -0.05, reach: 0.005, clients: 5, cities: ["Aracaju", "Nossa Senhora do Socorro", "Lagarto"] },
  RO: { mrr: 10, growth: 0.07, reach: 0.005, clients: 4, cities: ["Porto Velho", "Ji-Paraná", "Ariquemes"] },
  TO: { mrr: 9, growth: 0.42, reach: 0.006, clients: 4, cities: ["Palmas", "Araguaína", "Gurupi"] },
  AC: { mrr: 3, growth: -0.2, reach: 0.002, clients: 2, cities: ["Rio Branco", "Cruzeiro do Sul", "Sena Madureira"] },
  AP: { mrr: 2, growth: 0.5, reach: null, clients: 1, cities: ["Macapá", "Santana", "Laranjal do Jari"] },
  RR: { mrr: 2, growth: 0, reach: null, clients: 1, cities: ["Boa Vista", "Rorainópolis", "Caracaraí"] },
};
const cityShare = [0.52, 0.17, 0.11];

type Metric = "receita" | "crescimento" | "penetracao";
const metrics: Record<
  Metric,
  {
    label: string;
    noun: string;
    format: (n: number) => string;
    scale: ChoroplethScaleOptions;
    value: (d: UfData) => number | null;
  }
> = {
  receita: {
    label: "Receita",
    noun: "Receita mensal",
    format: (n) => formatCurrency(n, { compact: true }),
    scale: { steps: 7, breaks: "quantile" },
    value: (d) => d.mrr * 1000,
  },
  crescimento: {
    label: "Crescimento",
    noun: "Crescimento em 12 meses",
    format: (n) => formatDelta(n, 0),
    scale: { scheme: "diverging", steps: 6, domain: [-0.3, 0.3] },
    value: (d) => d.growth,
  },
  penetracao: {
    label: "Penetração",
    noun: "Empresas-alvo que são clientes",
    format: (n) => formatPercent(n, 1),
    scale: { steps: 5, tone: "info", breaks: "quantile" },
    value: (d) => d.reach,
  },
};

/** "1 cliente", "12 clientes". */
const clientsLabel = (n: number) => `${formatNumber(n)} ${n === 1 ? "cliente" : "clientes"}`;

type RegionFilter = "todas" | BrRegion;
const regionOptions = [{ value: "todas", label: "Todas as regiões" }, ...Object.keys(brRegions).map((r) => ({ value: r, label: r }))];

/** Totais de um conjunto de UFs (receita somada; crescimento e penetração ponderados). */
function totals(ids: readonly BrUfId[]) {
  const rows = ids.map((id) => ufData[id]);
  const mrr = rows.reduce((s, d) => s + d.mrr * 1000, 0);
  const before = rows.reduce((s, d) => s + (d.mrr * 1000) / (1 + d.growth), 0);
  const withReach = rows.filter((d) => d.reach != null);
  const reached = withReach.reduce((s, d) => s + d.clients, 0);
  const universe = withReach.reduce((s, d) => s + d.clients / (d.reach as number), 0);
  return {
    receita: mrr,
    crescimento: before ? mrr / before - 1 : 0,
    penetracao: universe ? reached / universe : 0,
    clients: rows.reduce((s, d) => s + d.clients, 0),
  };
}

/* ------------------------------------------------------------------ */
/* Estados (no showcase, ?estado=carregando|vazio|filtro|erro; no SEU  */
/* app troque pelo estado da consulta).                                */
/* ------------------------------------------------------------------ */

function MapSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Carregando receita por estado" className="flex flex-col gap-5 rounded-xl border border-line bg-surface px-6 py-5">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-3 w-72 max-w-full" />
      </div>
      <Skeleton className="h-9 w-64 max-w-full rounded-lg" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-3 w-14" />
        <Skeleton className="h-6 w-56 max-w-full" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <Skeleton className="aspect-square max-h-[640px] w-full rounded-xl" />
        <div className="flex flex-col gap-4">
          {Array.from({ length: 10 }, (_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-3 w-5" />
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <Skeleton className="h-3 w-1/3" />
                <Skeleton className="h-1 w-full" />
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
/* Detalhe da UF escolhida                                             */
/* ------------------------------------------------------------------ */

function UfDetail({ id }: { id: BrUfId }) {
  const d = ufData[id];
  const uf = brUfs.find((u) => u.id === id)!;
  const mrr = d.mrr * 1000;
  const stats = [
    { label: "Receita mensal", value: formatCurrency(mrr, { compact: true }) },
    { label: "Clientes", value: formatNumber(d.clients) },
    { label: "Crescimento", value: formatDelta(d.growth, 0) },
    {
      label: "Penetração",
      value: d.reach == null ? "—" : formatPercent(d.reach, 1),
    },
  ];
  const rest = 1 - cityShare.reduce((s, x) => s + x, 0);
  return (
    <section aria-labelledby="uf-detail-title" className="flex flex-col gap-4 rounded-xl border border-line p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h4 id="uf-detail-title" className="m-0 text-[15px] font-semibold">
          {uf.name}
        </h4>
        <Badge>{uf.region}</Badge>
      </div>
      <dl className="m-0 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="flex min-w-0 flex-col gap-0.5">
            <dt className="truncate text-[12px] text-muted">{s.label}</dt>
            <dd className="m-0 text-[15px] font-semibold tabular-nums">{s.value}</dd>
          </div>
        ))}
      </dl>
      <div className="flex flex-col gap-2">
        <h5 className="m-0 text-[12px] font-medium text-ink-soft">Principais cidades</h5>
        <BarList
          sort={false}
          format={(n) => formatCurrency(n, { compact: true })}
          items={[
            ...d.cities.map((c, i) => ({
              label: c,
              value: mrr * cityShare[i],
              hint: clientsLabel(Math.max(1, Math.round(d.clients * cityShare[i]))),
            })),
            ...(d.clients > 3 ? [{ label: "Outras cidades", value: mrr * rest }] : []),
          ]}
        />
      </div>
      <Button variant="ghost" size="sm" className="self-start" href="#/frame/saas-customers">
        <Users aria-hidden /> Ver clientes
      </Button>
    </section>
  );
}

/* ------------------------------------------------------------------ */

export default function SaasRegions() {
  const estado = useFrameParam("estado");
  const [metric, setMetric] = useState<Metric>("receita");
  const [region, setRegion] = useState<RegionFilter>(estado === "filtro" ? "Norte" : "todas");
  const hl = useLinkedHighlight<string>();
  const m = metrics[metric];

  const ids = useMemo<readonly BrUfId[]>(() => (region === "todas" ? brUfs.map((u) => u.id) : brRegions[region]), [region]);
  // ?estado=filtro simula um recorte sem clientes (no seu app: a consulta voltou vazia).
  const filteredEmpty = estado === "filtro" && region === "Norte";
  const regions = useMemo(() => brUfs.filter((u) => ids.includes(u.id)), [ids]);
  const viewBox = useMemo(() => (region === "todas" ? undefined : fitGeoViewBox(regions)), [region, regions]);
  const values = useMemo(() => Object.fromEntries(ids.map((id) => [id, m.value(ufData[id])])), [ids, m]);
  const total = totals(ids);
  const place = region === "todas" ? "Brasil" : region;
  const selected = hl.pinned as BrUfId | null;

  const changeRegion = (r: string) => {
    hl.setPinned(null);
    setRegion(r as RegionFilter);
    if (estado === "filtro") setFrameQuery({ estado: undefined });
  };

  const heading = (
    <PageHeading
      title="Receita por estado"
      description="Clientes ativos em outubro de 2026, pela UF de faturamento."
      actions={
        estado === "vazio" || estado === "carregando" || estado === "erro" ? undefined : (
          <Select label="Região" hideLabel size="compact" value={region} onValueChange={changeRegion} options={regionOptions} />
        )
      }
    />
  );

  return (
    <SaasShell current={here}>
      <Page>
        {heading}
        <div className="mt-6 flex flex-col gap-6">
          {estado === "carregando" ? (
            <MapSkeleton />
          ) : estado === "erro" ? (
            <div className="rounded-xl border border-line bg-surface">
              <ErrorState
                title="Não foi possível carregar a receita por estado"
                description="O servidor não respondeu. Nada foi perdido; tente de novo em instantes."
                retryLabel="Tentar de novo"
                onRetry={() => setFrameQuery({ estado: undefined })}
                details="GET /api/v1/receita/uf · 503 Service Unavailable · req_3b91c7"
              />
            </div>
          ) : estado === "vazio" ? (
            <Empty
              title="Ainda não há receita por estado"
              hint="O mapa aparece quando os clientes tiverem a UF de faturamento preenchida no cadastro."
              action={<Button href="#/frame/saas-customers">Completar cadastro dos clientes</Button>}
            />
          ) : filteredEmpty ? (
            <Empty
              title={`Nenhum cliente ativo na região ${region}`}
              hint="Nenhum estado desta região teve faturamento em outubro de 2026."
              action={
                <Button variant="ghost" onClick={() => changeRegion("todas")}>
                  Limpar filtro
                </Button>
              }
            />
          ) : (
            <ChartCard
              title={metric === "crescimento" ? "Onde a receita cresce?" : metric === "penetracao" ? "Onde ainda há espaço?" : "Onde está a receita?"}
              description={
                metric === "crescimento"
                  ? "Variação da receita mensal contra outubro de 2025"
                  : metric === "penetracao"
                  ? "Fatia das empresas-alvo de cada UF que já são clientes"
                  : "Receita recorrente mensal pela UF de faturamento"
              }
            >
              {/* Métrica e total no corpo (como no cabeçalho de um explorador): no celular o título não espreme. */}
              <div className="flex flex-col gap-5">
                <SegmentedControl
                  label="Métrica"
                  value={metric}
                  onChange={setMetric}
                  options={(Object.keys(metrics) as Metric[]).map((k) => ({
                    value: k,
                    label: metrics[k].label,
                  }))}
                  className="self-start"
                />
                <div className="flex flex-col gap-0.5">
                  <span className="text-[12px] text-muted">{place === "Brasil" ? "Brasil" : `Região ${place}`}</span>
                  <span className="flex flex-wrap items-baseline gap-x-2">
                    <span className="text-[24px] font-semibold tabular-nums tracking-tight">{m.format(total[metric])}</span>
                    <span className="text-[13px] text-muted">
                      {m.noun.toLowerCase()} · {clientsLabel(total.clients)}
                    </span>
                  </span>
                </div>
                <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
                  <ChoroplethMap
                    label={`${m.noun} por estado, ${place}, outubro de 2026`}
                    regions={regions}
                    viewBox={viewBox}
                    values={values}
                    scale={m.scale}
                    format={m.format}
                    valueLabel={m.label}
                    formatLegend={metric === "receita" ? formatCompact : undefined}
                    legendTitle={metric === "receita" ? "Receita mensal (R$)" : undefined}
                    highlight={hl}
                    zoomTo={selected}
                    zoomOutLabel={region === "todas" ? "Voltar ao Brasil" : `Voltar ao ${region}`}
                  />
                  <div className="flex min-w-0 flex-col gap-4">
                    {selected ? <UfDetail id={selected} /> : null}
                    <RankedRegionList
                      label={`${m.noun} por estado, do maior ao menor`}
                      regions={regions}
                      values={values}
                      scale={m.scale}
                      format={m.format}
                      highlight={hl}
                      limit={selected ? 5 : 12}
                      hint={(id) => clientsLabel(ufData[id as BrUfId].clients)}
                    />
                    {metric === "penetracao" ? <p className="m-0 text-[12px] text-muted">Amapá e Roraima sem base de empresas-alvo: aparecem em hachura, com travessão.</p> : null}
                  </div>
                </div>
              </div>
            </ChartCard>
          )}
        </div>
      </Page>
    </SaasShell>
  );
}
