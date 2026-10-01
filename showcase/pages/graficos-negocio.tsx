import {
  BoxPlot,
  BumpChart,
  ChartCard,
  DivergingBarChart,
  DumbbellChart,
  GaugeChart,
  Histogram,
  NpsChart,
  ParetoChart,
  PunchCard,
  RadialBars,
  SlopeChart,
  WaffleChart,
  formatCurrency,
} from "@g4ai/ds";
import { Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";

export const meta: PageMeta = {
  title: "Gráficos de negócio",
  group: "Gráficos",
  order: 20,
  description: "NPS, pesquisas, antes × depois, distribuição, Pareto, ranking no tempo e outros que bibliotecas genéricas não trazem prontos — pensados para as perguntas de CRM, ATS, ERP e financeiro.",
};

const brl = (n: number) => formatCurrency(n, { compact: true });
// Distribuição determinística (sem Math.random) para prints estáveis.
const seq = (n: number, base: number, spread: number, seed: number) => Array.from({ length: n }, (_, i) => Math.round(base + Math.sin(i * 12.9898 + seed) * spread + Math.cos(i * 4.1 + seed) * spread * 0.6));

export default function Page() {
  return (
    <DocPage title={meta.title} kicker="Gráficos" description={meta.description}>
      <DocSection title="NPS" rule="Mostre o número E a composição. NPS 40 com 60 % de neutros é outra história que NPS 40 com muitos detratores.">
        <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
          <Demo bare code={`// scores[i] = respostas com nota i (0 a 10)\n<NpsChart scores={[4, 2, 3, 5, 6, 9, 14, 38, 61, 120, 150]} previous={58} />`}>
            <ChartCard title="NPS do trimestre" description="412 respostas · jul–set">
              <NpsChart scores={[4, 2, 3, 5, 6, 9, 14, 38, 61, 120, 150]} previous={58} />
            </ChartCard>
          </Demo>
          <Demo
            bare
            code={`<GaugeChart value={72} min={-100} max={100} label="NPS"
  bands={[{ to: 0, tone: "bad", label: "Crítica" }, { to: 50, tone: "warn", label: "Aperfeiçoamento" }, { to: 100, tone: "ok", label: "Excelência" }]} />`}
          >
            <ChartCard title="NPS" description="Últimos 90 dias · 412 respostas">
              <div className="flex justify-center">
                <GaugeChart
                  value={72}
                  min={-100}
                  max={100}
                  label="NPS"
                  bands={[
                    { to: 0, tone: "bad", label: "Crítica" },
                    { to: 50, tone: "warn", label: "Aperfeiçoamento" },
                    { to: 100, tone: "ok", label: "Excelência" },
                  ]}
                  caption="Meta do ano: 70"
                />
              </div>
            </ChartCard>
          </Demo>
        </div>
      </DocSection>

      <DocSection title="Pesquisa em escala (Likert, eNPS, clima)" rule="Negativos à esquerda, positivos à direita, neutro no centro. Ordene as perguntas pelo % positivo.">
        <Demo bare code={`<DivergingBarChart rows={[{ label: "Tenho clareza das minhas metas", values: [3, 8, 14, 41, 34] }, …]} />`}>
          <ChartCard title="Pesquisa de clima" description="186 respostas · setembro">
            <DivergingBarChart
              rows={[
                { label: "Tenho clareza das minhas metas", values: [3, 8, 14, 41, 34] },
                { label: "Recebo feedback com frequência", values: [9, 18, 24, 32, 17] },
                { label: "Recomendaria a empresa", values: [4, 7, 18, 38, 33] },
                { label: "Ferramentas adequadas", values: [14, 22, 28, 24, 12] },
                { label: "Carga de trabalho sustentável", values: [18, 26, 25, 21, 10] },
              ]}
            />
          </ChartCard>
        </Demo>
      </DocSection>

      <DocSection title="Antes × depois" rule="Slope quando importa a direção de cada item; dumbbell quando importa o tamanho da diferença.">
        <div className="grid gap-5 lg:grid-cols-2">
          <Demo bare code={`<SlopeChart fromLabel="2025" toLabel="2026" items={[{ label: "Sudeste", from: 42, to: 51 }, …]} />`}>
            <ChartCard title="Conversão por região (%)" description="Q3 2025 → Q3 2026">
              <SlopeChart
                fromLabel="Q3 2025"
                toLabel="Q3 2026"
                format={(n) => `${n}%`}
                items={[
                  { label: "Sudeste", from: 42, to: 51 },
                  { label: "Sul", from: 38, to: 44 },
                  { label: "Nordeste", from: 35, to: 29 },
                  { label: "Centro-Oeste", from: 31, to: 36 },
                  { label: "Norte", from: 27, to: 24 },
                ]}
              />
            </ChartCard>
          </Demo>
          <Demo bare code={`<DumbbellChart aLabel="Orçado" bLabel="Realizado" rows={[{ label: "Marketing", a: 120000, b: 138000 }, …]} />`}>
            <ChartCard title="Orçado × realizado" description="Setembro · R$">
              <DumbbellChart
                aLabel="Orçado"
                bLabel="Realizado"
                format={brl}
                rows={[
                  { label: "Pessoal", a: 214000, b: 209000 },
                  { label: "Marketing", a: 120000, b: 138000 },
                  { label: "Tecnologia", a: 86000, b: 91000 },
                  { label: "Viagens", a: 24000, b: 15000 },
                  { label: "Escritório", a: 32000, b: 30500 },
                ]}
              />
            </ChartCard>
          </Demo>
        </div>
      </DocSection>

      <DocSection title="Distribuição" rule="Média esconde. Box plot mostra dispersão e outliers; histograma mostra a forma.">
        <div className="grid gap-5 lg:grid-cols-2">
          <Demo bare code={`<BoxPlot groups={[{ label: "Enterprise", values: [...] }, …]} format={(n) => \`\${n} d\`} />`}>
            <ChartCard title="Ciclo de venda por segmento" description="Dias entre criação e fechamento">
              <BoxPlot
                format={(n) => `${n} d`}
                groups={[
                  { label: "Enterprise", values: seq(40, 78, 22, 1).concat([160, 175]) },
                  { label: "Mid-market", values: seq(60, 46, 14, 2).concat([110]) },
                  { label: "PME", values: seq(90, 21, 8, 3) },
                ]}
              />
            </ChartCard>
          </Demo>
          <Demo bare code={`<Histogram label="Ticket dos pedidos" values={tickets} format={(n) => formatCurrency(n, { compact: true })} />`}>
            <ChartCard title="Ticket dos pedidos" description="1.240 pedidos · setembro">
              <Histogram label="Distribuição do ticket" values={seq(240, 820, 520, 4).map((v) => Math.abs(v) + 60)} format={(n) => formatCurrency(n, { cents: false })} height={200} />
            </ChartCard>
          </Demo>
        </div>
      </DocSection>

      <DocSection title="Causas e prioridades" rule="Pareto responde “por onde começar”: as poucas causas que explicam 80 %.">
        <Demo bare code={`<ParetoChart items={[{ label: "Atraso na entrega", value: 142 }, …]} />`}>
          <ChartCard title="Motivos de devolução" description="Setembro · 386 devoluções">
            <ParetoChart
              items={[
                { label: "Atraso", value: 142 },
                { label: "Avaria", value: 96 },
                { label: "Item errado", value: 58 },
                { label: "Arrependimento", value: 34 },
                { label: "Tamanho", value: 22 },
                { label: "Cobrança", value: 16 },
                { label: "Outros", value: 18 },
              ]}
            />
          </ChartCard>
        </Demo>
      </DocSection>

      <DocSection title="Proporção, ranking e padrões" rule="Waffle lê proporção melhor que pizza; bump mostra quem ultrapassou quem; punch card mostra quando as coisas acontecem.">
        <div className="grid gap-5 lg:grid-cols-2">
          <Demo bare code={`<WaffleChart items={[{ label: "Renovaram", value: 72, color: "var(--ds-ok)" }, …]} />`}>
            <ChartCard title="Renovação de contratos" description="Contratos que venceram no trimestre">
              <WaffleChart
                items={[
                  { label: "Renovaram", value: 72, color: "var(--ds-ok)" },
                  { label: "Em negociação", value: 17, color: "var(--ds-amber)" },
                  { label: "Cancelaram", value: 11, color: "var(--ds-rose)" },
                ]}
              />
            </ChartCard>
          </Demo>
          <Demo bare code={`<RadialBars items={[{ label: "Vendas", value: 92 }, { label: "CS", value: 78 }, …]} />`}>
            <ChartCard title="Metas do trimestre" description="% atingido por área">
              <RadialBars
                items={[
                  { label: "Vendas", value: 92, hint: "R$ 1,1 mi" },
                  { label: "Customer Success", value: 78, hint: "NRR 108%" },
                  { label: "Marketing", value: 64, hint: "2.380 MQLs" },
                ]}
                center={
                  <div>
                    <div className="text-[20px] font-semibold tabular-nums">78%</div>
                    <div className="text-[11px] text-muted">média</div>
                  </div>
                }
              />
            </ChartCard>
          </Demo>
          <Demo bare code={`<BumpChart periods={["jun", "jul", "ago", "set"]} series={[{ label: "Ana", ranks: [3, 2, 1, 1] }, …]} />`}>
            <ChartCard title="Ranking de vendedores" description="Posição por mês">
              <BumpChart
                periods={["jun", "jul", "ago", "set"]}
                series={[
                  { label: "Ana Lopes", ranks: [3, 2, 1, 1] },
                  { label: "Bruno Takeda", ranks: [1, 1, 2, 3] },
                  { label: "Carla Nogueira", ranks: [2, 3, 3, 2] },
                  { label: "Diego Araújo", ranks: [4, 4, 4, 4] },
                ]}
              />
            </ChartCard>
          </Demo>
          <Demo bare code={`<PunchCard rows={["Seg", …]} columns={["8h", …]} values={[[…]]} />`}>
            <ChartCard title="Quando os clientes compram" description="Pedidos por dia e hora">
              <PunchCard
                rows={["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"]}
                columns={["8h", "10h", "12h", "14h", "16h", "18h", "20h", "22h"]}
                values={[
                  [4, 12, 20, 14, 10, 18, 26, 9],
                  [5, 14, 22, 16, 12, 20, 28, 10],
                  [3, 11, 19, 15, 11, 19, 30, 12],
                  [6, 13, 21, 17, 13, 24, 34, 14],
                  [4, 10, 18, 12, 9, 22, 40, 22],
                  [1, 6, 14, 18, 16, 20, 25, 18],
                  [0, 3, 9, 12, 10, 14, 19, 11],
                ]}
              />
            </ChartCard>
          </Demo>
        </div>
        <PropsTable
          rows={[
            ["NpsChart.scores", "number[11]", "—", "Respostas por nota 0–10."],
            ["DivergingBarChart.rows", "{ label, values[] }[]", "—", "values na ordem da escala; scale muda os rótulos."],
            ["SlopeChart.items", "{ label, from, to }[]", "—", "Sobe = ok; desce = rose."],
            ["DumbbellChart.rows", "{ label, a, b }[]", "—", "a = referência (cinza), b = atual (série 1)."],
            ["WaffleChart.items", "{ label, value, color? }[]", "—", "Arredonda para somar exatamente 100 quadrados."],
            ["BoxPlot.groups", "{ label, values[] }[]", "—", "Quartis, bigodes 1,5×IQR e outliers calculados."],
            ["Histogram.values", "number[]", "—", "bins automático (Sturges) ou fixo."],
            ["ParetoChart.items", "{ label, value }[]", "—", "Ordena e marca as causas até 80 %."],
            ["BumpChart.series", "{ label, ranks[] }[]", "—", "1 = primeiro lugar."],
            ["RadialBars.items", "{ label, value (0–100), hint? }[]", "—", "2–5 anéis."],
          ]}
        />
      </DocSection>
      <DocSection title="Regras">
        <Rules
          items={[
            { do: "NPS sempre com número de respostas e período.", dont: "NPS de 12 respostas apresentado como verdade." },
            { do: "Box plot quando média e mediana divergem (salários, prazos).", dont: "Só a média de algo com outliers fortes." },
            { do: "Pareto para priorizar: diga quantas causas explicam 80 %.", dont: "Lista de causas em ordem alfabética." },
          ]}
        />
      </DocSection>
    </DocPage>
  );
}
