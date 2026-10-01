import { ArrowRight } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import {
  AreaChart,
  BarChart,
  ChartCard,
  LineChart,
  PieChart,
  RadarChart,
  RadialChart,
  Select,
  formatCurrency,
  formatNumber,
} from "@g4ai/ds";
import { DocPage, DocSection, type PageMeta } from "../kit";
import * as d from "./_chart-data";

export const meta: PageMeta = {
  title: "Visão geral",
  group: "Gráficos",
  order: 0,
  description: "Gráficos em SVG puro, sem dependência, com os tokens do DS (claro, escuro e marcas). Tooltip por mouse e teclado, tabela para leitor de tela, formatos pt-BR.",
};

const brl = (n: number) => formatCurrency(n, { compact: true });
const periods = [
  { value: "90", label: "Últimos 3 meses" },
  { value: "30", label: "Últimos 30 dias" },
  { value: "7", label: "Últimos 7 dias" },
];

function TypeCard({ href, title, description, children }: { href: string; title: string; description: string; children: ReactNode }) {
  return (
    <a href={href} className="group block min-w-0">
      <ChartCard
        title={title}
        description={description}
        action={<ArrowRight className="h-4 w-4 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-ink" aria-hidden />}
        className="h-full transition-colors group-hover:border-line-strong"
      >
        <div className="pointer-events-none">{children}</div>
      </ChartCard>
    </a>
  );
}

export default function Page() {
  const [range, setRange] = useState("90");
  const data = useMemo(() => d.leadsDaily.slice(-Number(range)), [range]);
  const total = data.reduce((t, r) => t + r.organico + r.pago, 0);
  return (
    <DocPage title="Gráficos" kicker="Gráficos" description={meta.description}>
      <DocSection title="Interativo" rule="Período no cabeçalho, total do recorte, legenda que liga/desliga séries. Passe o mouse ou use as setas.">
        <ChartCard
          title="Leads por origem"
          description={`${formatNumber(total)} leads · ${periods.find((p) => p.value === range)?.label.toLowerCase()}`}
          action={<Select size="compact" label="Período" value={range} onValueChange={setRange} options={periods} />}
          insight="Pago cresceu mais rápido que orgânico em setembro"
          insightTrend="up"
          insightDetail="Orgânico ainda responde por 58 % do total"
        >
          <AreaChart
            label="Leads por dia, orgânico e pago"
            data={data}
            index="dia"
            series={[{ key: "organico", label: "Orgânico" }, { key: "pago", label: "Pago" }]}
            stacked
            legend="interactive"
            legendPosition="bottom"
            height={300}
            tooltip={{ indicator: "line", showTotal: true }}
          />
        </ChartCard>
      </DocSection>

      <DocSection title="Tipos" rule="Cada tipo tem uma página com variantes, código e regras. Comece por “Qual gráfico usar” se estiver em dúvida.">
        <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
          <TypeCard href="#/p/graficos-area" title="Área" description="10 variantes · volume no tempo">
            <AreaChart label="Vendas por canal" stacked data={d.sales6} index="mes" series={[{ key: "online", label: "Online" }, { key: "loja", label: "Loja" }]} format={brl} height={180} legend={false} yAxis={false} tooltip={false} />
          </TypeCard>
          <TypeCard href="#/p/graficos-barras" title="Barras" description="12 variantes · comparação e ranking">
            <BarChart label="Vendas por canal" data={d.sales6} index="mes" series={[{ key: "online", label: "Online" }, { key: "loja", label: "Loja" }]} format={brl} height={180} legend={false} yAxis={false} tooltip={false} />
          </TypeCard>
          <TypeCard href="#/p/graficos-linhas" title="Linhas" description="10 variantes · taxas e tendências">
            <LineChart label="Conversão por segmento" data={d.conversion9} index="mes" series={[{ key: "pme", label: "PME" }, { key: "mid", label: "Mid" }]} height={180} legend={false} yAxis={false} dots tooltip={false} />
          </TypeCard>
          <TypeCard href="#/p/graficos-pizza" title="Pizza e rosca" description="8 variantes · parte de um todo">
            <div className="flex justify-center">
              <PieChart label="Origem dos leads" items={d.pieChannels} innerRadius={0.62} legend={false} size={180} />
            </div>
          </TypeCard>
          <TypeCard href="#/p/graficos-radar" title="Radar" description="10 variantes · perfil em critérios">
            <div className="flex justify-center">
              <RadarChart axes={d.radarAxes} series={[d.radarA, { ...d.radarIdeal, dashed: true, color: "var(--ds-accent)" }]} size={220} legend={false} />
            </div>
          </TypeCard>
          <TypeCard href="#/p/graficos-radial" title="Radial" description="7 variantes · um número contra a meta">
            <div className="flex justify-center">
              <RadialChart value={78} shape="half" label="Meta do trimestre" caption="da meta" format={(n) => `${n} %`} size={200} />
            </div>
          </TypeCard>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["#/p/graficos-tooltip", "Tooltip", "10 variantes: indicador, total, ícones, formatação"],
            ["#/p/graficos-negocio", "Gráficos de negócio", "NPS, Likert, Pareto, box plot, slope…"],
            ["#/p/graficos-conversao", "Funil e fluxo", "Funil com maior perda e Sankey"],
            ["#/p/graficos-composicao", "Composição e ranking", "Treemap, BarList, barra de proporção"],
            ["#/p/graficos-metas", "Metas e pontes", "Waterfall, bullet e medidor"],
            ["#/p/graficos-padroes", "Distribuição e tempo", "Dispersão, matrizes de calor, Gantt"],
          ].map(([href, title, desc]) => (
            <a key={href} href={href} className="group flex items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-3 transition-colors hover:border-line-strong">
              <span className="min-w-0">
                <span className="block text-[14px] font-medium">{title}</span>
                <span className="block truncate text-[12.5px] text-muted">{desc}</span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted group-hover:text-ink" aria-hidden />
            </a>
          ))}
        </div>
      </DocSection>
    </DocPage>
  );
}
