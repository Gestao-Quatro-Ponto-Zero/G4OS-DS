import { AreaChart, BarList, ChartCard, KpiCard, KpiGrid, formatNumber } from "@g4os/ds";
import { CodeBlock, Demo, DocPage, DocSection, Rules, type PageMeta } from "../kit";

export const meta: PageMeta = {
  title: "Como montar um dashboard",
  group: "Dashboards",
  order: 5,
  description: "Método em 5 passos para qualquer painel (vendas, recrutamento, financeiro, produto): comece pelas decisões, não pelos gráficos.",
};

const visits = ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"].map((dia, i) => ({ dia, visitas: [1820, 2140, 2010, 2380, 2250, 980, 760][i] }));

export default function Page() {
  return (
    <DocPage title={meta.title} kicker="Dashboards" description={meta.description}>
      <DocSection title="1. Liste as decisões que o painel apoia">
        <p className="m-0 max-w-[720px] text-[13.5px] leading-relaxed text-ink-soft">
          “Preciso contratar mais SDRs?” “Onde cortar custo este mês?” Cada decisão vira uma pergunta, e cada pergunta vira um card. Se um gráfico não ajuda a decidir nada, ele sai.
        </p>
      </DocSection>

      <DocSection title="2. Anatomia padrão (de cima para baixo)">
        <CodeBlock
          code={`<Page>
  <PageHeading title="…" description="período e fonte" actions={<SegmentedControl …/>} />
  <KpiGrid>          {/* 3–5 KPIs com delta e período */}
  <ChartCard>        {/* a pergunta principal, largura total */}
  <div className="grid gap-6 lg:grid-cols-2">   {/* ou 3/5 + 2/5 */}
    <ChartCard/> <ChartCard/>                   {/* perguntas de apoio */}
  </div>
  <DataTable />      {/* o detalhe acionável: quem, qual, quanto */}
</Page>`}
        />
      </DocSection>

      <DocSection title="3. Escolha o gráfico pela pergunta" rule="Detalhes e exemplos em Gráficos › Como escolher.">
        <div className="overflow-hidden rounded-xl border border-line bg-surface">
          <table className="w-full text-[13px]">
            <tbody className="divide-y divide-line">
              {[
                ["Como evoluiu no tempo?", "AreaChart (volume) · LineChart (taxa) · ComboChart (volume + taxa)"],
                ["Quem é maior?", "BarList (ranking) · BarChart (categorias) · Leaderboard (pessoas)"],
                ["Qual a composição?", "DonutChart (2–6 partes) · Treemap (muitas partes) · ProportionBar (uma linha)"],
                ["Onde perdemos?", "FunnelChart · SankeyChart (fluxos com desvios)"],
                ["Batemos a meta?", "GoalMeter · BulletChart (lista) · GaugeChart (um número)"],
                ["Por que o resultado mudou?", "WaterfallChart (ponte entre dois totais)"],
                ["Quando acontece?", "CalendarHeatmap (dias) · HeatmapMatrix (dia × hora, coortes)"],
              ].map(([q, a]) => (
                <tr key={q}>
                  <td className="w-[38%] px-4 py-2.5 font-medium">{q}</td>
                  <td className="px-4 py-2.5 text-ink-soft">{a}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DocSection>

      <DocSection title="4. Exemplo mínimo" rule="Três KPIs, uma pergunta principal, uma de apoio. Já é um dashboard útil.">
        <Demo
          bare
          code={`<KpiGrid cols={3}>
  <KpiCard label="Visitas na semana" value="12.340" delta={0.084} period="vs. semana anterior" />
  <KpiCard label="Cadastros" value="1.212" delta={0.021} period="vs. semana anterior" />
  <KpiCard label="Custo por cadastro" value="R$ 18,40" delta={-0.07} goodWhen="down" period="vs. semana anterior" />
</KpiGrid>
<div className="grid gap-6 lg:grid-cols-5">
  <ChartCard className="lg:col-span-3" title="Em que dia as pessoas chegam?" description="Visitas por dia da semana">
    <AreaChart label="Visitas por dia" data={visits} index="dia" series={[{ key: "visitas", label: "Visitas" }]} />
  </ChartCard>
  <ChartCard className="lg:col-span-2" title="De onde vêm?" description="Visitas por origem">
    <BarList items={sources} showShare />
  </ChartCard>
</div>`}
        >
          <div className="space-y-6 rounded-2xl border border-line bg-soft/40 p-5">
            <KpiGrid cols={3}>
              <KpiCard label="Visitas na semana" value="12.340" delta={0.084} period="vs. semana anterior" />
              <KpiCard label="Cadastros" value="1.212" delta={0.021} period="vs. semana anterior" />
              <KpiCard label="Custo por cadastro" value="R$ 18,40" delta={-0.07} goodWhen="down" period="vs. semana anterior" />
            </KpiGrid>
            <div className="grid gap-6 xl:grid-cols-5">
              <ChartCard className="xl:col-span-3" title="Em que dia as pessoas chegam?" description="Visitas por dia da semana">
                <AreaChart label="Visitas por dia da semana" data={visits} index="dia" series={[{ key: "visitas", label: "Visitas" }]} height={200} formatAxis={(n) => formatNumber(n)} />
              </ChartCard>
              <ChartCard className="xl:col-span-2" title="De onde vêm?" description="Visitas por origem">
                <BarList
                  showShare
                  items={[
                    { label: "Busca orgânica", value: 4_620 },
                    { label: "Direto", value: 3_110 },
                    { label: "LinkedIn", value: 2_380 },
                    { label: "E-mail", value: 1_430 },
                  ]}
                />
              </ChartCard>
            </div>
          </div>
        </Demo>
      </DocSection>

      <DocSection title="5. Revise antes de publicar">
        <Rules
          items={[
            { do: "Todo KPI com comparação e período; todo gráfico com título-pergunta e unidade.", dont: "Painel que só quem montou sabe ler." },
            { do: "Cor com significado: ink é o nosso número, chart-2 é comparação, verde/vermelho só para bom/ruim.", dont: "Arco-íris de categorias sem motivo." },
            { do: "Eixo Y a partir de zero em barras e áreas; valores exatos no tooltip e na tabela sr-only.", dont: "Eixo “ampliado” que transforma 2 % em um penhasco." },
            { do: "Terminar em algo acionável: a lista de quem precisa de atenção.", dont: "Dashboard que termina num gráfico bonito e ninguém sabe o próximo passo." },
            { do: "Blocos prontos como ponto de partida: SaaS › Dashboard, CRM › Painel comercial, ATS › Painel, Financeiro › Fluxo de caixa." },
          ]}
        />
      </DocSection>
    </DocPage>
  );
}
