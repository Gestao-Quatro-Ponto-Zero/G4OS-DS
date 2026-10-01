"use client";

import { useState } from "react";
import {
  AreaChart,
  BarList,
  ChartCard,
  KpiCard,
  KpiGrid,
  Page,
  PageHeading,
  SegmentedControl,
  formatCurrency,
  formatNumber,
  formatPercent,
} from "@g4ai/ds";

// Troque pelos seus dados (fetch, Server Action, SDK).
const revenue = [
  { mes: "abr", receita: 182000, anterior: 160000 },
  { mes: "mai", receita: 196000, anterior: 171000 },
  { mes: "jun", receita: 214000, anterior: 176000 },
  { mes: "jul", receita: 205000, anterior: 188000 },
  { mes: "ago", receita: 238000, anterior: 194000 },
  { mes: "set", receita: 251000, anterior: 201000 },
];
const sources = [
  { label: "Indicação", value: 142 },
  { label: "Orgânico", value: 118 },
  { label: "Eventos", value: 64 },
  { label: "Outbound", value: 51 },
  { label: "Parceiros", value: 23 },
];

export default function Dashboard() {
  const [period, setPeriod] = useState<"6m" | "12m">("6m");
  return (
    <Page>
      <PageHeading
        title="Início"
        description="Como estamos neste mês e onde agir."
        actions={
          <SegmentedControl
            label="Período"
            value={period}
            onChange={(v) => setPeriod(v as "6m" | "12m")}
            options={[
              { value: "6m", label: "6 meses" },
              { value: "12m", label: "12 meses" },
            ]}
          />
        }
      />
      <div className="mt-6 space-y-6">
        <KpiGrid cols={4}>
          <KpiCard label="Receita do mês" value={formatCurrency(251000, { compact: true })} delta={0.055} spark={revenue.map((r) => r.receita)} href="/negocios" />
          <KpiCard label="Negócios ganhos" value={formatNumber(38)} delta={0.12} />
          <KpiCard label="Conversão" value={formatPercent(0.214)} delta={-0.018} />
          <KpiCard label="Ciclo médio" value="23 dias" delta={-0.08} goodWhen="down" />
        </KpiGrid>
        <div className="grid gap-4 lg:grid-cols-3">
          <ChartCard className="lg:col-span-2" title="A receita está crescendo?" description="Receita fechada por mês · em R$" value={formatCurrency(251000)}>
            <AreaChart
              label="Receita mensal comparada ao ano anterior"
              data={revenue}
              index="mes"
              series={[
                { key: "receita", label: "2026" },
                { key: "anterior", label: "2025", dashed: true },
              ]}
              format={(n) => formatCurrency(n)}
              formatAxis={(n) => formatCurrency(n, { compact: true })}
              reference={{ value: 240000, label: "Meta" }}
            />
          </ChartCard>
          <ChartCard title="De onde vêm os leads?" description="Últimos 90 dias">
            <BarList items={sources} showShare />
          </ChartCard>
        </div>
      </div>
    </Page>
  );
}
