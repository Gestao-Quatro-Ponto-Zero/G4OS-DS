import { useState } from "react";
import { BarChart, ChartCardTotals, formatCompact, formatCurrency, formatNumber } from "@g4ai/ds";
import { DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";
import { ChartDemo, ChartGrid } from "./_chart-kit";
import * as d from "./_chart-data";

export const meta: PageMeta = {
  title: "Barras",
  group: "Gráficos",
  order: 3,
  description: "Comparação entre categorias ou períodos. Vertical para tempo, horizontal para rankings com nomes longos, empilhado para composição.",
};

const brl = (n: number) => formatCurrency(n, { compact: true });
const brlFull = (n: number) => formatCurrency(n, { cents: false });
const sales = [{ key: "online", label: "Online" }, { key: "loja", label: "Loja física" }];

function Interactive() {
  const [key, setKey] = useState<"organico" | "pago">("organico");
  const totals = {
    organico: d.leadsDaily.reduce((t, r) => t + r.organico, 0),
    pago: d.leadsDaily.reduce((t, r) => t + r.pago, 0),
  };
  return (
    <ChartDemo
      title="Leads por dia · Interativo"
      description="Últimos 3 meses · clique no total para trocar a série"
      flush
      headerAside={
        <ChartCardTotals
          value={key}
          onChange={(k) => setKey(k as "organico" | "pago")}
          items={[
            { key: "organico", label: "Orgânico", value: formatNumber(totals.organico) },
            { key: "pago", label: "Pago", value: formatNumber(totals.pago) },
          ]}
        />
      }
      code={`const [key, setKey] = useState("organico");

<ChartCard
  title="Leads por dia"
  description="Últimos 3 meses"
  flush
  headerAside={
    <ChartCardTotals
      value={key}
      onChange={setKey}
      items={[
        { key: "organico", label: "Orgânico", value: "21.506" },
        { key: "pago", label: "Pago", value: "15.120" },
      ]}
    />
  }
>
  <BarChart
    label="Leads por dia"
    data={leads}
    index="dia"
    series={[{ key, label: key === "organico" ? "Orgânico" : "Pago", color: key === "pago" ? "var(--ds-chart-2)" : undefined }]}
    radius={2}
    height={260}
  />
</ChartCard>`}
    >
      <BarChart
        label="Leads por dia"
        data={d.leadsDaily}
        index="dia"
        series={[{ key, label: key === "organico" ? "Orgânico" : "Pago", color: key === "pago" ? "var(--ds-chart-2)" : undefined }]}
        radius={2}
        height={260}
      />
    </ChartDemo>
  );
}

export default function Page() {
  return (
    <DocPage title="Gráfico de barras" kicker="Gráficos" description={meta.description}>
      <DocSection title="Interativo" rule="Os totais no cabeçalho são o seletor: a pessoa vê o número e troca a série no mesmo lugar.">
        <Interactive />
      </DocSection>

      <DocSection title="Variantes">
        <ChartGrid>
          <ChartDemo title="Padrão" description="Vendas online · jan–jun" insight="Subiu 2,3 % em junho" insightTrend="up" insightDetail="Comparado a maio" code={`<BarChart label="Vendas online" data={vendas} index="mes" series={[{ key: "online", label: "Online" }]} format={brl} />`}>
            <BarChart label="Vendas online" data={d.sales6} index="mes" series={[sales[0]]} format={brlFull} formatAxis={brl} height={220} />
          </ChartDemo>

          <ChartDemo title="Múltiplas" description="Online × loja física, lado a lado" code={`<BarChart series={[{ key: "online", label: "Online" }, { key: "loja", label: "Loja física" }]} … />`}>
            <BarChart label="Vendas por canal" data={d.sales6} index="mes" series={sales} format={brlFull} formatAxis={brl} height={220} />
          </ChartDemo>

          <ChartDemo title="Horizontal" description="Vendas por região · ranking" code={`<BarChart layout="horizontal" index="regiao" series={[{ key: "vendas", label: "Vendas" }]} … />`}>
            <BarChart label="Vendas por região" layout="horizontal" data={d.regions} index="regiao" series={[{ key: "vendas", label: "Vendas" }]} format={brlFull} formatAxis={brl} height={220} />
          </ChartDemo>

          <ChartDemo title="Com rótulos" description="Valor sobre cada barra" code={`<BarChart labels … />`}>
            <BarChart label="Vendas online com rótulos" labels data={d.sales6} index="mes" series={[sales[0]]} format={brl} yAxis={false} grid="none" height={220} />
          </ChartDemo>

          <ChartDemo title="Rótulo personalizado" description="Nome dentro da barra, valor no fim" code={`<BarChart layout="horizontal" categoryInside labels … />`}>
            <BarChart label="Vendas por região" layout="horizontal" categoryInside labels data={d.regions} index="regiao" series={[{ key: "vendas", label: "Vendas" }]} format={brl} xAxis={false} grid="none" height={220} />
          </ChartDemo>

          <ChartDemo title="Empilhadas" description="Total do mês e a parte de cada canal" code={`<BarChart stacked labels legendPosition="bottom" … />`}>
            <BarChart label="Vendas por canal, empilhado" stacked labels legendPosition="bottom" data={d.sales6} index="mes" series={sales} format={brl} yAxis={false} height={220} />
          </ChartDemo>

          <ChartDemo title="Empilhadas 100 %" description="Participação de cada canal" code={`<BarChart stackOffset="expand" … />`}>
            <BarChart label="Participação por canal" stackOffset="expand" data={d.sales6} index="mes" series={sales} format={brlFull} height={220} />
          </ChartDemo>

          <ChartDemo title="Negativas" description="Resultado mensal: lucro e prejuízo" insight="2 meses no vermelho no semestre" code={`<BarChart colorBy={(r) => (Number(r.resultado) < 0 ? "var(--ds-rose)" : "var(--ds-ok)")} labels … />`}>
            <BarChart
              label="Resultado mensal"
              data={d.profit6}
              index="mes"
              series={[{ key: "resultado", label: "Resultado" }]}
              colorBy={(r) => (Number(r.resultado) < 0 ? "var(--ds-rose)" : "var(--ds-ok)")}
              labels
              format={brl}
              yAxis={false}
              height={220}
            />
          </ChartDemo>

          <ChartDemo title="Cores por item" description="Negócios por etapa do funil" code={`<BarChart colorBy={(r) => r.cor} … />   // série única: uma cor por barra`}>
            <BarChart label="Negócios por etapa" data={d.stagesDeals} index="etapa" series={[{ key: "negocios", label: "Negócios" }]} colorBy={(r) => String(r.cor)} labels yAxis={false} grid="none" height={220} />
          </ChartDemo>

          <ChartDemo title="Barra ativa" description="Destaque de um período (o mês atual)" code={`<BarChart activeIndex={5} … />`}>
            <BarChart label="Vendas online, junho em destaque" activeIndex={5} labels data={d.sales6} index="mes" series={[sales[0]]} format={brl} yAxis={false} height={220} />
          </ChartDemo>

          <ChartDemo title="Horizontal múltipla" description="Duas séries por categoria" code={`<BarChart layout="horizontal" series={[…2]} … />`}>
            <BarChart label="Vendas por canal, horizontal" layout="horizontal" data={d.sales6} index="mes" series={sales} format={brlFull} formatAxis={brl} height={260} />
          </ChartDemo>

          <ChartDemo title="Sem eixos" description="Barras finas para cards pequenos" code={`<BarChart xAxis={false} yAxis={false} grid="none" radius={2} … />`}>
            <BarChart label="Leads por dia" xAxis={false} yAxis={false} grid="none" radius={2} data={d.leadsDaily.slice(-30)} index="dia" series={[{ key: "organico", label: "Orgânico" }]} format={formatCompact} height={140} />
          </ChartDemo>
        </ChartGrid>
      </DocSection>

      <DocSection title="Props específicas">
        <PropsTable
          rows={[
            ["layout", '"vertical" | "horizontal"', '"vertical"', "Horizontal põe as categorias à esquerda."],
            ["labels", 'boolean | "top" | "inside"', "false", "Valor sobre/dentro da barra; empilhado mostra o total."],
            ["categoryInside", "boolean", "false", "Horizontal: nome da categoria dentro da barra."],
            ["radius", "number", "4", "Raio da ponta (só a ponta externa é arredondada)."],
            ["colorBy", "(linha, i) => string", "—", "Série única: cor por barra (etapas, positivo/negativo)."],
            ["activeIndex", "number", "—", "Destaca uma barra e esmaece as demais."],
            ["stacked · stackOffset", 'boolean · "expand"', "—", "Empilhado e 100 %."],
            ["ChartCardTotals", "{ items, value, onChange }", "—", "Totais clicáveis no headerAside do ChartCard."],
          ]}
        />
      </DocSection>
      <DocSection title="Regras">
        <Rules
          items={[
            { do: "Horizontal quando os nomes são longos ou é um ranking.", dont: "Rótulos girados a 45° no eixo X." },
            { do: "Verde/vermelho só para sinal (lucro × prejuízo).", dont: "Cores aleatórias por barra sem significado." },
            { do: "Rótulos em vez de eixo quando há ≤ 8 barras.", dont: "Eixo e rótulo ao mesmo tempo, repetindo o número." },
          ]}
        />
      </DocSection>
    </DocPage>
  );
}
