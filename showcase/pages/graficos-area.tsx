import { Globe, Store } from "lucide-react";
import { useMemo, useState } from "react";
import { AreaChart, ChartContainer, Select, formatCompact, formatCurrency, formatNumber, type ChartConfig } from "@g4ai/ds";
import { DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";
import { ChartDemo, ChartGrid } from "./_chart-kit";
import * as d from "./_chart-data";

export const meta: PageMeta = {
  title: "Área",
  group: "Gráficos",
  order: 2,
  description: "Volume ao longo do tempo. Do interativo com período e séries ao empilhado 100 %: escolha a variante pela pergunta, não pelo efeito.",
};

const brl = (n: number) => formatCurrency(n, { compact: true });
const sales = [{ key: "online", label: "Online" }, { key: "loja", label: "Loja física" }];
const leadSeries = [{ key: "organico", label: "Orgânico" }, { key: "pago", label: "Pago" }];
const periods = [
  { value: "90", label: "Últimos 3 meses" },
  { value: "30", label: "Últimos 30 dias" },
  { value: "7", label: "Últimos 7 dias" },
];

function Interactive() {
  const [range, setRange] = useState("90");
  const data = useMemo(() => d.leadsDaily.slice(-Number(range)), [range]);
  const total = data.reduce((t, r) => t + r.organico + r.pago, 0);
  return (
    <ChartDemo
      title="Leads por origem · Interativo"
      description={`${formatNumber(total)} leads nos ${periods.find((p) => p.value === range)?.label.toLowerCase()}`}
      action={<Select size="compact" label="Período" value={range} onValueChange={setRange} options={periods} />}
      code={`const [range, setRange] = useState("90");
const data = leads.slice(-Number(range));

<ChartCard
  title="Leads por origem"
  description="Últimos 3 meses"
  action={<Select size="compact" label="Período" value={range} onValueChange={setRange} options={periods} />}
>
  <AreaChart
    label="Leads por dia, orgânico e pago"
    data={data}
    index="dia"
    series={[{ key: "organico", label: "Orgânico" }, { key: "pago", label: "Pago" }]}
    stacked
    legend="interactive"        // clicar na legenda liga/desliga a série
    legendPosition="bottom"
    height={300}
  />
</ChartCard>`}
    >
      <AreaChart label="Leads por dia, orgânico e pago" data={data} index="dia" series={leadSeries} stacked legend="interactive" legendPosition="bottom" height={300} />
    </ChartDemo>
  );
}

const iconConfig: ChartConfig = {
  online: { label: "Online", icon: Globe },
  loja: { label: "Loja física", icon: Store },
};

export default function Page() {
  return (
    <DocPage title="Gráfico de área" kicker="Gráficos" description={meta.description}>
      <DocSection title="Interativo" rule="Período no cabeçalho, séries ligáveis na legenda. Total do recorte na descrição: a pessoa sabe o que está olhando.">
        <Interactive />
      </DocSection>

      <DocSection title="Variantes">
        <ChartGrid>
          <ChartDemo
            title="Padrão"
            description="Vendas online · jan–jun 2026"
            insight="Subiu 2,3 % em junho"
            insightTrend="up"
            insightDetail="Comparado a maio"
            code={`<AreaChart label="Vendas online" data={vendas} index="mes" series={[{ key: "online", label: "Online" }]} format={brl} formatAxis={brl} />`}
          >
            <AreaChart label="Vendas online" data={d.sales6} index="mes" series={[sales[0]]} format={(n) => formatCurrency(n, { cents: false })} formatAxis={brl} height={220} />
          </ChartDemo>

          <ChartDemo
            title="Linear"
            description="Segmentos retos entre os pontos"
            insight="Pico em fevereiro"
            code={`<AreaChart curve="linear" … />`}
          >
            <AreaChart label="Vendas online, linear" curve="linear" data={d.sales6} index="mes" series={[sales[0]]} format={(n) => formatCurrency(n, { cents: false })} formatAxis={brl} height={220} />
          </ChartDemo>

          <ChartDemo title="Degraus" description="Valores que mudam em saltos (preço, plano, headcount)" code={`<AreaChart curve="step" … />`}>
            <AreaChart label="Vendas online em degraus" curve="step" data={d.sales6} index="mes" series={[sales[0]]} format={(n) => formatCurrency(n, { cents: false })} formatAxis={brl} height={220} />
          </ChartDemo>

          <ChartDemo
            title="Empilhado"
            description="Partes de um total: online + loja"
            insight="Online responde por 62 % do semestre"
            code={`<AreaChart stacked series={[{ key: "online", label: "Online" }, { key: "loja", label: "Loja física" }]} … />`}
          >
            <AreaChart label="Vendas por canal, empilhado" stacked data={d.sales6} index="mes" series={sales} format={(n) => formatCurrency(n, { cents: false })} formatAxis={brl} height={220} />
          </ChartDemo>

          <ChartDemo
            title="Empilhado 100 %"
            description="Participação de cada canal mês a mês"
            insight="Loja física passou de 30 % para 40 %"
            code={`<AreaChart stackOffset="expand" series={[…]} … />   // eixo e tooltip em %`}
          >
            <AreaChart label="Participação por canal" stackOffset="expand" data={d.sales6} index="mes" series={sales} format={(n) => formatCurrency(n, { cents: false })} height={220} />
          </ChartDemo>

          <ChartDemo title="Sem degradê" description="Preenchimento chapado e suave" code={`<AreaChart gradient={false} stacked … />`}>
            <AreaChart label="Vendas por canal, sem degradê" gradient={false} stacked data={d.sales6} index="mes" series={sales} format={(n) => formatCurrency(n, { cents: false })} formatAxis={brl} height={220} legend={false} />
          </ChartDemo>

          <ChartDemo title="Legenda embaixo" description="Centralizada, como rodapé" code={`<AreaChart legendPosition="bottom" … />`}>
            <AreaChart label="Vendas por canal" legendPosition="bottom" data={d.sales6} index="mes" series={sales} format={(n) => formatCurrency(n, { cents: false })} formatAxis={brl} height={210} />
          </ChartDemo>

          <ChartDemo title="Com grade completa" description="Linhas verticais tracejadas por categoria" code={`<AreaChart grid="both" dots … />`}>
            <AreaChart label="Vendas online com grade" grid="both" dots data={d.sales6} index="mes" series={[sales[0]]} format={(n) => formatCurrency(n, { cents: false })} formatAxis={brl} height={220} />
          </ChartDemo>

          <ChartDemo
            title="Com ícones"
            description="Rótulos e ícones vêm da ChartConfig"
            code={`const config: ChartConfig = {
  online: { label: "Online", icon: Globe },
  loja: { label: "Loja física", icon: Store },
};

<ChartContainer config={config}>
  <AreaChart label="…" data={vendas} index="mes" stacked legendPosition="bottom" />
</ChartContainer>`}
          >
            <ChartContainer config={iconConfig}>
              <AreaChart label="Vendas por canal com ícones" data={d.sales6} index="mes" stacked legendPosition="bottom" format={(n) => formatCurrency(n, { cents: false })} formatAxis={brl} height={210} />
            </ChartContainer>
          </ChartDemo>

          <ChartDemo title="Sem eixos" description="Para cards pequenos: forma da tendência e tooltip" code={`<AreaChart xAxis={false} yAxis={false} grid="none" … />`}>
            <AreaChart label="Leads, últimos 30 dias" xAxis={false} yAxis={false} grid="none" data={d.leadsDaily.slice(-30)} index="dia" series={[leadSeries[0]]} height={160} format={formatCompact} />
          </ChartDemo>
        </ChartGrid>
      </DocSection>

      <DocSection title="Props">
        <PropsTable
          rows={[
            ["data · index · series · label", "—", "—", "Linhas, chave do X, séries (opcional com ChartContainer) e resumo acessível."],
            ["curve", '"monotone" | "linear" | "step"', '"monotone"', "Forma da linha."],
            ["stacked · stackOffset", 'boolean · "none" | "expand"', "false · none", "Empilhado e 100 %."],
            ["gradient", "boolean", "true", "Degradê no preenchimento."],
            ["dots", "boolean", "false", "Marcador em cada ponto."],
            ["grid", '"horizontal" | "both" | "none"', '"horizontal"', "Linhas de grade."],
            ["xAxis · yAxis", "boolean", "true", "Mostra os eixos."],
            ["legend · legendPosition", 'boolean | "interactive" · "top" | "bottom"', "auto · top", "Interativo = clicar liga/desliga."],
            ["activeSeries · onActiveSeriesChange", "string[] · (keys) => void", "—", "Séries visíveis controladas de fora."],
            ["tooltip", "ChartTooltipOptions | false", "{}", "Ver página Tooltip."],
            ["reference", "{ value, label }", "—", "Linha de meta."],
            ["height", "number", "280", "Altura; a largura acompanha o contêiner."],
          ]}
        />
      </DocSection>
      <DocSection title="Regras">
        <Rules
          items={[
            { do: "Período no cabeçalho e total do recorte na descrição.", dont: "Área sem dizer de quando é." },
            { do: "100 % para participação; empilhado para total + partes.", dont: "Empilhar séries que não somam (taxa + volume)." },
            { do: "Legenda interativa quando há 2+ séries que a pessoa quer isolar.", dont: "Mais de 3 áreas sobrepostas sem empilhar." },
          ]}
        />
      </DocSection>
    </DocPage>
  );
}
