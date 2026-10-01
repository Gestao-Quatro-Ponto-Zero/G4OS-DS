import { CalendarRange, Globe, Mail, Megaphone, Search, Share2 } from "lucide-react";
import { useState } from "react";
import {
  BarList,
  Button,
  CalendarHeatmap,
  ChartCard,
  DonutChart,
  FunnelChart,
  KpiCard,
  KpiGrid,
  LineChart,
  Page,
  PageHeading,
  SankeyChart,
  SegmentedControl,
  formatNumber,
  formatPercent,
  notify,
} from "@g4os/ds";
import { SaasShell } from "./shells/saas-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Análise de aquisição",
  description: "Funil de conversão em colunas, origem do tráfego, dispositivos, taxa de conversão no tempo e mapa de atividade diária.",
  category: "SaaS",
  order: 2,
  height: 1540,
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
  meta: 0.75,
}));

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
              <Button variant="ghost" onClick={() => notify("Exemplo: sobrepõe o período anterior em todos os gráficos.", undefined, "info")}>
                <CalendarRange /> Comparar
              </Button>
            </>
          }
        />
        <div className="mt-6 space-y-6">
          <KpiGrid>
            <KpiCard label="Visitas" value={formatNumber(184_320)} delta={0.084} period="vs. trimestre anterior" />
            <KpiCard label="Taxa de cadastro" value={formatPercent(21_870 / 38_460)} delta={0.012} period="vs. trimestre anterior" />
            <KpiCard label="Ativação em 7 dias" value={formatPercent(5_210 / 12_640)} delta={-0.031} period="Queda após novo onboarding" />
            <KpiCard label="Custo por assinatura" value="R$ 312" delta={-0.07} goodWhen="down" period="vs. trimestre anterior" />
          </KpiGrid>

          <ChartCard title="Onde perdemos pessoas no caminho?" description="Funil do trimestre · conversão entre etapas acima de cada faixa">
            <FunnelChart stages={funnel} variant="columns" label="Funil de aquisição do trimestre" />
          </ChartCard>

          <div className="grid gap-6 lg:grid-cols-5">
            <ChartCard className="lg:col-span-3" title="De onde vêm as visitas?" description="Visitas por origem no trimestre">
              <BarList items={sources} showShare />
            </ChartCard>
            <ChartCard className="lg:col-span-2" title="Por qual dispositivo?" description="Participação das visitas">
              <DonutChart items={devices} label="Visitas por dispositivo" centerLabel="Visitas" format={(n) => formatNumber(n)} />
            </ChartCard>
          </div>

          <ChartCard title="Quais origens viram assinatura?" description="Cadastros do trimestre: origem → ativação no trial → plano assinado">
            <SankeyChart nodes={flowNodes} links={flowLinks} label="Fluxo de cadastros da origem até o plano assinado" height={300} />
          </ChartCard>

          <div className="grid gap-6 lg:grid-cols-2">
            <ChartCard title="A conversão de trial melhora?" description="Trial → assinatura, por semana de cadastro">
              <LineChart
                label="Conversão semanal de trial para assinatura com meta de 75 %"
                data={conversion}
                index="semana"
                series={[
                  { key: "conversao", label: "Conversão" },
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
