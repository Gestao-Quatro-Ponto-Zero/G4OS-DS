import { useState } from "react";
import { AreaChart, ChartCard, CompareStat, GoalMeter, SegmentedControl, formatCurrency, formatNumber } from "@g4ai/ds";
import { Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";

export const meta: PageMeta = {
  title: "Cards de gráfico e metas",
  group: "Dashboards",
  order: 20,
  description: "ChartCard é a moldura de todo gráfico de dashboard. GoalMeter mostra progresso até uma meta com o ritmo esperado; CompareStat põe dois períodos lado a lado.",
};

const data = ["abr", "mai", "jun", "jul", "ago", "set"].map((mes, i) => ({ mes, receita: [820, 1040, 960, 1180, 1310, 1120][i] * 1000, meta: 1_100_000 }));
const money = (n: number) => formatCurrency(n, { compact: true });

export default function Page() {
  const [period, setPeriod] = useState<"6m" | "3m">("6m");
  return (
    <DocPage title={meta.title} kicker="Dashboards" description={meta.description}>
      <DocSection title="ChartCard" rule="O título é a pergunta que o gráfico responde. A descrição dá período e unidade. action recebe o seletor de período.">
        <Demo
          bare
          code={`<ChartCard
  title="Estamos batendo a meta mensal?"
  description="Receita ganha por mês · meta de R$ 1,1 mi"
  value="R$ 6,4 mi"
  action={<SegmentedControl label="Período" value={period} onChange={setPeriod}
    options={[{ value: "6m", label: "6 meses" }, { value: "3m", label: "3 meses" }]} />}
  footer="Fonte: contratos assinados no CRM."
>
  <AreaChart label="Receita mensal" data={data} index="mes"
    series={[{ key: "receita", label: "Receita" }]}
    reference={{ value: 1100000, label: "Meta" }} formatAxis={money} />
</ChartCard>`}
        >
          <ChartCard
            title="Estamos batendo a meta mensal?"
            description="Receita ganha por mês · meta de R$ 1,1 mi"
            value={money(data.slice(period === "6m" ? 0 : 3).reduce((s, d) => s + d.receita, 0))}
            action={
              <SegmentedControl
                label="Período"
                value={period}
                onChange={setPeriod}
                options={[
                  { value: "6m", label: "6 meses" },
                  { value: "3m", label: "3 meses" },
                ]}
              />
            }
            footer="Fonte: contratos assinados no CRM."
          >
            <AreaChart
              label="Receita mensal com meta"
              data={data.slice(period === "6m" ? 0 : 3)}
              index="mes"
              series={[{ key: "receita", label: "Receita" }]}
              reference={{ value: 1_100_000, label: "Meta R$ 1,1 mi" }}
              format={(n) => formatCurrency(n, { cents: false })}
              formatAxis={money}
              height={220}
            />
          </ChartCard>
        </Demo>
        <PropsTable
          rows={[
            ["title", "string", "—", "Pergunta respondida: “De onde vêm os leads?”."],
            ["description", "ReactNode", "—", "Período, unidade, filtro aplicado."],
            ["value", "ReactNode", "—", "Número-resumo do período, abaixo do título."],
            ["action", "ReactNode", "—", "SegmentedControl de período ou ActionMenu."],
            ["footer", "ReactNode", "—", "Fonte, nota de metodologia, link “ver relatório”."],
          ]}
        />
      </DocSection>

      <DocSection title="GoalMeter" rule="Progresso até a meta. Com expected, a marca vertical mostra onde deveria estar hoje: âmbar se atrás do ritmo, verde ao bater a meta.">
        <Demo
          className="grid gap-6 md:grid-cols-3"
          code={`<GoalMeter label="Time Sudeste" value={3610000} target={3300000} format={money} />
<GoalMeter label="PME" value={1460000} target={1700000} expected={1700000 * 0.8} format={money} />
<GoalMeter label="Vagas preenchidas" value={14} target={20} expected={12} />`}
        >
          <GoalMeter label="Time Sudeste" value={3_610_000} target={3_300_000} format={money} />
          <GoalMeter label="PME" value={1_060_000} target={1_700_000} expected={1_360_000} format={money} />
          <GoalMeter label="Vagas preenchidas" value={14} target={20} expected={12} format={(n) => formatNumber(n)} />
        </Demo>
        <PropsTable
          rows={[
            ["value · target", "number", "—", "Realizado e meta, na mesma unidade."],
            ["expected", "number", "—", "Onde deveria estar hoje (ritmo linear, sazonalidade)."],
            ["format", "(n) => string", "formatNumber", "Formato dos valores."],
          ]}
        />
      </DocSection>

      <DocSection title="CompareStat" rule="Dois valores do mesmo indicador (atual × anterior, plano × real), com barras na mesma escala e a variação.">
        <Demo className="grid gap-6 md:grid-cols-2" code={`<CompareStat label="Novos clientes" current={71} previous={58} currentLabel="3º tri" previousLabel="2º tri" />
<CompareStat label="Custo por contratação" current={3870} previous={3580} goodWhen="down" format={brl} />`}>
          <CompareStat label="Novos clientes" current={71} previous={58} currentLabel="3º tri" previousLabel="2º tri" />
          <CompareStat label="Custo por contratação" current={3_870} previous={3_580} goodWhen="down" format={(n) => formatCurrency(n, { cents: false })} />
        </Demo>
      </DocSection>

      <DocSection title="Regras">
        <Rules
          items={[
            { do: "Um gráfico por pergunta, e a pergunta no título.", dont: "“Gráfico de receita” como título; o leitor não sabe o que procurar." },
            { do: "Meta como linha de referência (reference) ou GoalMeter, sempre com o valor escrito.", dont: "Meta implícita que só quem montou o painel conhece." },
            { do: "Seletor de período no action do card que ele afeta.", dont: "Um seletor global escondido que muda gráficos distantes sem aviso." },
          ]}
        />
      </DocSection>
    </DocPage>
  );
}
