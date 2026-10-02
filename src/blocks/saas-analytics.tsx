import { CalendarRange, Globe, Mail, Megaphone, Search, Share2 } from "lucide-react";
import { useState } from "react";
import {
  BarList,
  Button,
  CalendarHeatmap,
  ChartCard,
  DataTable,
  DonutChart,
  FunnelChart,
  KpiCard,
  KpiGrid,
  LineChart,
  Page,
  PageHeading,
  SankeyChart,
  SegmentedControl,
  formatCurrency,
  formatDelta,
  formatNumber,
  formatPercent,
} from "@g4ai/ds";
import { SaasShell } from "./shells/saas-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Análise de aquisição",
  description: "Funil de conversão em colunas, origem do tráfego, dispositivos, taxa de conversão no tempo e mapa de atividade diária.",
  category: "SaaS",
  order: 2,
  height: 1540,
  concept: {
    goal: "Entender de onde vêm os clientes e onde a aquisição perde gente.",
    patterns: [
      "Anatomia B · Painel: cabeçalho fixo com período",
      "Funil em colunas com a maior perda destacada",
      "Origem, dispositivos, conversão no tempo e atividade diária",
    ],
    adapt: [
      "Funil de recrutamento, funil comercial",
    ],
    avoid: [
      "Funil sem mostrar a conversão entre etapas",
    ],
  },
} as const;

/* ------------------------------------------------------------------ */
/* Dados de exemplo                                                    */
/* ------------------------------------------------------------------ */

const funnel = [
  { label: "Visitas à página de preços", value: 38_460 },
  { label: "Cadastro iniciado", value: 21_870 },
  { label: "Conta criada", value: 12_640 },
  { label: "Ativação", value: 5_210 },
  { label: "Assinatura", value: 1_388 },
];
/** Mesmo funil no período anterior (para "Comparar"). */
const funnelPrev = [35_120, 19_400, 11_020, 4_960, 1_215];

const sources = [
  { label: "Busca orgânica", value: 68_420, icon: <Search /> },
  { label: "Direto", value: 41_050, icon: <Globe /> },
  { label: "LinkedIn", value: 27_310, icon: <Share2 /> },
  { label: "E-mail marketing", value: 19_880, icon: <Mail /> },
  { label: "Instagram", value: 15_210, icon: <Megaphone /> },
  { label: "Indicação de clientes", value: 12_450 },
];

// Fluxo: origem → resultado do trial → plano (cadastros do trimestre).
const flowNodes = [
  { id: "org", label: "Busca orgânica", column: 0 },
  { id: "pago", label: "Mídia paga", column: 0 },
  { id: "ind", label: "Indicação", column: 0 },
  { id: "ativ", label: "Ativou no trial", column: 1 },
  { id: "aband", label: "Não ativou", column: 1 },
  { id: "pro", label: "Plano Pro", column: 2 },
  { id: "starter", label: "Plano Starter", column: 2 },
  { id: "perdido", label: "Não assinou", column: 2 },
];
const flowLinks = [
  { source: "org", target: "ativ", value: 2_310 },
  { source: "org", target: "aband", value: 3_120 },
  { source: "pago", target: "ativ", value: 1_480 },
  { source: "pago", target: "aband", value: 4_020 },
  { source: "ind", target: "ativ", value: 1_420 },
  { source: "ind", target: "aband", value: 290 },
  { source: "ativ", target: "pro", value: 610 },
  { source: "ativ", target: "starter", value: 778 },
  { source: "ativ", target: "perdido", value: 3_822 },
  { source: "aband", target: "perdido", value: 7_430 },
];

const devices = [
  { label: "Desktop", value: 101_376 },
  { label: "Celular", value: 71_885 },
  { label: "Tablet", value: 11_059 },
];

const weeks = ["01/07", "08/07", "15/07", "22/07", "29/07", "05/08", "12/08", "19/08", "26/08", "02/09", "09/09", "16/09", "23/09"];
const conversion = weeks.map((semana, i) => ({
  semana,
  conversao: Number((0.62 + i * 0.012 + Math.sin(i / 1.7) * 0.05).toFixed(3)),
  anterior: Number((0.6 + i * 0.006 + Math.sin((i + 3) / 1.9) * 0.04).toFixed(3)),
  meta: 0.75,
}));

/** KPIs do período: atual e anterior. `share` = parte do trimestre que cabe no mês. */
const kpis = { visitas: [184_320, 170_040], cadastro: [21_870 / 38_460, 19_400 / 35_120], ativacao: [5_210 / 12_640, 4_960 / 11_020], custo: [312, 335] } as const;

// Um ano de atividade (cadastros por dia), determinístico.
const end = new Date(2026, 8, 30);
const activity = Array.from({ length: 182 }, (_, i) => {
  const d = new Date(end);
  d.setDate(end.getDate() - i);
  const weekend = d.getDay() === 0 || d.getDay() === 6;
  const v = Math.max(0, Math.round((weekend ? 18 : 70) + Math.sin(i / 5) * 25 + ((i * 29) % 40) - (i > 150 ? 30 : 0)));
  return { date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`, value: v };
});

/* ------------------------------------------------------------------ */

const here = "#/frame/saas-analytics";

export default function SaasAnalytics() {
  const [range, setRange] = useState<"q" | "m">("q");
  const [compare, setCompare] = useState(false);
  // Mês ≈ 36 % do trimestre nos volumes; taxas não mudam de escala.
  const share = range === "q" ? 1 : 0.36;
  const vs = range === "q" ? "vs. trimestre anterior" : "vs. agosto";
  const stages = funnel.map((f) => ({ ...f, value: Math.round(f.value * share) }));
  const prevStages = funnelPrev.map((v) => Math.round(v * share));
  const conv = range === "q" ? conversion : conversion.slice(-4);
  const delta = (a: number, b: number) => (a - b) / b;
  return (
    <SaasShell current={here}>
      <Page>
        <PageHeading
          title="Aquisição"
          description={range === "q" ? "Do primeiro acesso à assinatura. Dados de 1º de julho a 30 de setembro de 2026." : "Do primeiro acesso à assinatura. Setembro de 2026 (números do trimestre como referência)."}
          actions={
            <>
              <SegmentedControl
                label="Período"
                value={range}
                onChange={setRange}
                options={[
                  { value: "q", label: "Trimestre" },
                  { value: "m", label: "Mês" },
                ]}
              />
              <Button variant="ghost" aria-pressed={compare} onClick={() => setCompare((c) => !c)}>
                <CalendarRange /> {compare ? "Ocultar comparação" : "Comparar com período anterior"}
              </Button>
            </>
          }
        />
        <div className="mt-6 space-y-6">
          <KpiGrid>
            <KpiCard label="Visitas" value={formatNumber(Math.round(kpis.visitas[0] * share))} delta={delta(kpis.visitas[0], kpis.visitas[1])} period={vs} hint={compare ? `Antes: ${formatNumber(Math.round(kpis.visitas[1] * share))}` : undefined} />
            <KpiCard label="Taxa de cadastro" value={formatPercent(kpis.cadastro[0])} delta={delta(kpis.cadastro[0], kpis.cadastro[1])} period={vs} hint={compare ? `Antes: ${formatPercent(kpis.cadastro[1])}` : undefined} />
            <KpiCard label="Ativação em 7 dias" value={formatPercent(kpis.ativacao[0])} delta={delta(kpis.ativacao[0], kpis.ativacao[1])} period={`${vs} · queda após novo onboarding`} hint={compare ? `Antes: ${formatPercent(kpis.ativacao[1])}` : undefined} />
            <KpiCard label="Custo por assinatura" value={formatCurrency(kpis.custo[0], { cents: false })} delta={delta(kpis.custo[0], kpis.custo[1])} goodWhen="down" period={vs} hint={compare ? `Antes: ${formatCurrency(kpis.custo[1], { cents: false })}` : undefined} />
          </KpiGrid>

          <ChartCard title="Onde perdemos pessoas no caminho?" description={`Funil ${range === "q" ? "do trimestre" : "do mês"} · conversão entre etapas acima de cada faixa`}>
            <FunnelChart stages={stages} variant="columns" label={`Funil de aquisição ${range === "q" ? "do trimestre" : "do mês"}`} />
            {compare && (
              <div className="mt-5">
                <DataTable
                  rows={stages.map((st, i) => ({ label: st.label, now: st.value, prev: prevStages[i], d: delta(st.value, prevStages[i]) }))}
                  rowKey={(r) => r.label}
                  columns={[
                    { key: "label", header: "Etapa", primary: true, cell: (r) => r.label },
                    { key: "now", header: "Agora", align: "right", nowrap: true, cell: (r) => <span className="tabular-nums">{formatNumber(r.now)}</span> },
                    { key: "prev", header: "Antes", align: "right", nowrap: true, cell: (r) => <span className="tabular-nums text-muted">{formatNumber(r.prev)}</span> },
                    { key: "d", header: "Variação", align: "right", nowrap: true, cell: (r) => <span className={r.d < 0 ? "font-medium tabular-nums text-rose" : "tabular-nums text-ink-soft"}>{formatDelta(r.d)}</span> },
                  ]}
                />
              </div>
            )}
          </ChartCard>

          <div className="grid gap-6 lg:grid-cols-5">
            <ChartCard className="lg:col-span-3" title="De onde vêm as visitas?" description="Visitas por origem no trimestre">
              <BarList items={sources.map((x) => ({ ...x, value: Math.round(x.value * share) }))} showShare />
            </ChartCard>
            <ChartCard className="lg:col-span-2" title="Por qual dispositivo?" description="Participação das visitas">
              <DonutChart items={devices.map((x) => ({ ...x, value: Math.round(x.value * share) }))} label="Visitas por dispositivo" centerLabel="Visitas" format={(n) => formatNumber(n)} />
            </ChartCard>
          </div>

          <ChartCard title="Quais origens viram assinatura?" description="Cadastros do trimestre: origem → ativação no trial → plano assinado">
            <SankeyChart nodes={flowNodes} links={flowLinks} label="Fluxo de cadastros da origem até o plano assinado" height={300} />
          </ChartCard>

          <div className="grid gap-6 lg:grid-cols-2">
            <ChartCard title="A conversão de trial melhora?" description={compare ? `Trial → assinatura por semana · tracejado: mesmo período ${range === "q" ? "do trimestre anterior" : "de agosto"}` : "Trial → assinatura, por semana de cadastro"}>
              <LineChart
                label={`Conversão semanal de trial para assinatura com meta de 75 %${compare ? ", comparada ao período anterior" : ""}`}
                data={conv}
                index="semana"
                series={[
                  { key: "conversao", label: "Conversão" },
                  ...(compare ? [{ key: "anterior", label: "Período anterior", dashed: true, color: "var(--ds-chart-2)" }] : []),
                  { key: "meta", label: "Meta", dashed: true, color: "var(--ds-accent)" },
                ]}
                format={(n) => formatPercent(n)}
                formatAxis={(n) => formatPercent(n, 0)}
                height={196}
              />
            </ChartCard>
            <ChartCard title="Quando as pessoas se cadastram?" description="Cadastros por dia nos últimos 6 meses">
              <CalendarHeatmap values={activity} end={end} weeks={26} noun="cadastros" />
            </ChartCard>
          </div>
        </div>
      </Page>
    </SaasShell>
  );
}
