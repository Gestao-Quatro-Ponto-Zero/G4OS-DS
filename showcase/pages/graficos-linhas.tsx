import { useState } from "react";
import { ChartCardTotals, ComboChart, LineChart, Sparkline, formatCurrency, formatNumber } from "@g4os/ds";
import { DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";
import { ChartDemo, ChartGrid } from "./_chart-kit";
import * as d from "./_chart-data";

export const meta: PageMeta = {
  title: "Linhas",
  group: "Gráficos",
  order: 4,
  description: "Tendência de taxas, preços e índices — quando a área embaixo da curva não significa nada. Inclui combinado (barras + linha) e sparkline.",
};

const brl = (n: number) => formatCurrency(n, { compact: true });
const pct = (n: number) => `${formatNumber(n, 1)} %`;
const conv = [{ key: "pme", label: "PME" }, { key: "mid", label: "Mid-market" }];

function Interactive() {
  const [key, setKey] = useState<"organico" | "pago">("organico");
  return (
    <ChartDemo
      title="Leads por dia · Interativo"
      description="Últimos 3 meses"
      flush
      headerAside={
        <ChartCardTotals
          value={key}
          onChange={(k) => setKey(k as "organico" | "pago")}
          items={[
            { key: "organico", label: "Orgânico", value: formatNumber(d.leadsDaily.reduce((t, r) => t + r.organico, 0)) },
            { key: "pago", label: "Pago", value: formatNumber(d.leadsDaily.reduce((t, r) => t + r.pago, 0)) },
          ]}
        />
      }
      code={`<ChartCard title="Leads por dia" flush headerAside={<ChartCardTotals value={key} onChange={setKey} items={totais} />}>
  <LineChart label="Leads por dia" data={leads} index="dia" series={[{ key, label }]} curve="linear" height={260} />
</ChartCard>`}
    >
      <LineChart
        label="Leads por dia"
        data={d.leadsDaily}
        index="dia"
        series={[{ key, label: key === "organico" ? "Orgânico" : "Pago", color: key === "pago" ? "var(--ds-chart-2)" : undefined }]}
        curve="linear"
        height={260}
      />
    </ChartDemo>
  );
}

export default function Page() {
  return (
    <DocPage title="Gráfico de linhas" kicker="Gráficos" description={meta.description}>
      <DocSection title="Interativo">
        <Interactive />
      </DocSection>
      <DocSection title="Variantes">
        <ChartGrid>
          <ChartDemo title="Padrão" description="Conversão de PMEs · jan–set" insight="Caiu 4,9 pontos no período" insightTrend="down" insightDetail="Meta: 12 %" code={`<LineChart label="Conversão de PMEs" data={conversao} index="mes" series={[{ key: "pme", label: "PME" }]} format={pct} />`}>
            <LineChart label="Conversão de PMEs" data={d.conversion9} index="mes" series={[conv[0]]} format={pct} height={220} />
          </ChartDemo>
          <ChartDemo title="Linear" description="Segmentos retos" code={`<LineChart curve="linear" … />`}>
            <LineChart label="Conversão, linear" curve="linear" data={d.conversion9} index="mes" series={[conv[0]]} format={pct} height={220} />
          </ChartDemo>
          <ChartDemo title="Degraus" description="Mudanças em saltos (preço, plano)" code={`<LineChart curve="step" … />`}>
            <LineChart label="Conversão em degraus" curve="step" data={d.conversion9} index="mes" series={[conv[0]]} format={pct} height={220} />
          </ChartDemo>
          <ChartDemo title="Múltiplas" description="PME × Mid-market" insight="Só PME caiu; Mid-market estável" code={`<LineChart series={[{ key: "pme", label: "PME" }, { key: "mid", label: "Mid-market" }]} … />`}>
            <LineChart label="Conversão por segmento" data={d.conversion9} index="mes" series={conv} format={pct} height={220} />
          </ChartDemo>
          <ChartDemo title="Pontos" description="Marcador em cada mês" code={`<LineChart dots … />`}>
            <LineChart label="Conversão com pontos" dots data={d.conversion9} index="mes" series={conv} format={pct} height={220} legend={false} />
          </ChartDemo>
          <ChartDemo title="Rótulos" description="Valor sobre cada ponto, sem eixo" code={`<LineChart labels dots yAxis={false} grid="none" … />`}>
            <LineChart label="Conversão com rótulos" labels dots yAxis={false} grid="none" data={d.conversion9.slice(-6)} index="mes" series={[conv[0]]} format={pct} height={220} />
          </ChartDemo>
          <ChartDemo title="Valor no fim" description="Rótulo direto no último ponto (dispensa legenda)" code={`<LineChart endLabels legend={false} … />`}>
            <LineChart label="Conversão, valor final" endLabels legend={false} data={d.conversion9} index="mes" series={conv} format={pct} height={220} />
          </ChartDemo>
          <ChartDemo title="Com meta" description="Linha de referência tracejada" code={`<LineChart reference={{ value: 12, label: "Meta 12 %" }} … />`}>
            <LineChart label="Conversão contra a meta" reference={{ value: 12, label: "Meta 12 %" }} data={d.conversion9} index="mes" series={[conv[0]]} format={pct} height={220} />
          </ChartDemo>
          <ChartDemo title="Comparação tracejada" description="2026 × 2025" code={`<LineChart series={[{ key: "receita", label: "2026" }, { key: "anterior", label: "2025", dashed: true, color: "var(--ds-chart-6)" }]} … />`}>
            <LineChart
              label="Receita 2026 contra 2025"
              data={d.revenue}
              index="mes"
              series={[{ key: "receita", label: "2026" }, { key: "anterior", label: "2025", dashed: true, color: "var(--ds-chart-6)" }]}
              format={(n) => formatCurrency(n, { cents: false })}
              formatAxis={brl}
              height={220}
            />
          </ChartDemo>
          <ChartDemo title="Combinado" description="Pedidos (barras) e ticket médio (linha)" code={`<ComboChart bar={{ key: "pedidos", label: "Pedidos" }} line={{ key: "ticket", label: "Ticket médio" }} … />`}>
            <ComboChart
              label="Pedidos e ticket médio"
              data={d.revenue.map((r, i) => ({ mes: r.mes, pedidos: 820 + i * 40, ticket: Math.round(r.receita / (820 + i * 40)) }))}
              index="mes"
              bar={{ key: "pedidos", label: "Pedidos" }}
              line={{ key: "ticket", label: "Ticket médio" }}
              formatLine={(n) => formatCurrency(n, { cents: false })}
              height={220}
            />
          </ChartDemo>
        </ChartGrid>
      </DocSection>
      <DocSection title="Sparkline" rule="Mini tendência ao lado de um número, sem eixo. Nunca sozinha.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["MRR", "R$ 412 mil", [3, 4, 4, 5, 6, 6, 7, 8], "neutral"],
            ["Churn", "1,8 %", [5, 5, 4, 4, 3, 3, 2, 2], "neutral"],
            ["CAC", "R$ 1.240", [3, 3, 4, 5, 5, 6, 7, 7], "bad"],
            ["NPS", "72", [60, 62, 61, 66, 68, 70, 71, 72], "accent"],
          ].map(([l, v, s, t]) => (
            <div key={l as string} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-3">
              <div className="min-w-0">
                <div className="text-[12px] text-muted">{l as string}</div>
                <div className="whitespace-nowrap text-[18px] font-semibold tabular-nums">{v as string}</div>
              </div>
              <Sparkline values={s as number[]} tone={t as "neutral"} />
            </div>
          ))}
        </div>
      </DocSection>
      <DocSection title="Props específicas">
        <PropsTable
          rows={[
            ["curve", '"monotone" | "linear" | "step"', '"monotone"', "Forma da linha."],
            ["dots · labels · endLabels", "boolean", "false", "Pontos, valor em cada ponto, valor no último ponto."],
            ["series[].dashed", "boolean", "false", "Comparação (meta, período anterior)."],
            ["reference", "{ value, label }", "—", "Linha de meta."],
          ]}
        />
      </DocSection>
      <DocSection title="Regras">
        <Rules items={[{ do: "Até 3 linhas; rótulo no fim dispensa legenda.", dont: "Espaguete de 8 linhas cruzadas." }, { do: "Eixo Y pode não começar em zero em taxas — diga na descrição.", dont: "Zoom no eixo para dramatizar variação pequena." }]} />
      </DocSection>
    </DocPage>
  );
}
