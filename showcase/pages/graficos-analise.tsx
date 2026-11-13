import { useState } from "react";
import { ChartCard, ConnectedScatter, HorizonChart, HorizonLegend, SegmentedControl, formatCurrency, type ConnectedScatterSeries, type HorizonSeries } from "@g4ai/ds";
import { Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";

export const meta: PageMeta = {
  title: "Dispersão conectada e horizon",
  group: "Gráficos",
  order: 25,
  description: "ConnectedScatter mostra como duas medidas andaram juntas no tempo (CAC × LTV). HorizonChart compara muitas séries diárias contra a própria base em linhas baixas dobradas em faixas.",
};

/* Dados determinísticos (sem Math.random) para prints estáveis. */
const months = ["jul", "ago", "set", "out", "nov", "dez", "jan", "fev", "mar", "abr", "mai", "jun"];
const pago = [[1120, 3000], [1210, 2980], [1290, 3010], [1350, 3040], [1390, 3110], [1410, 3240], [1360, 3420], [1290, 3650], [1210, 3900], [1130, 4150], [1040, 4400], [960, 4640]];
const organico = [[360, 4120], [375, 4200], [370, 4290], [385, 4350], [400, 4380], [395, 4460], [410, 4590], [405, 4720], [420, 4810], [415, 4930], [425, 5080], [430, 5210]];
const label = (i: number) => `${months[i]} ${i < 6 ? 2025 : 2026}`;
const cacLtv: ConnectedScatterSeries[] = [
  { key: "pago", label: "Mídia paga", points: pago.map(([x, y], i) => ({ x, y, label: label(i), note: i === 6 ? "Planos anuais" : undefined })) },
  { key: "organico", label: "Orgânico", points: organico.map(([x, y], i) => ({ x, y, label: label(i) })) },
];

const dayLabels = Array.from({ length: 60 }, (_, i) => `Dia ${i + 1}`);
const shops = ["Loja Centro", "Loja Norte", "Shopping Leste", "Aeroporto", "Rodoviária", "Loja Sul", "Outlet", "Quiosque Praia"];
const horizon: HorizonSeries[] = shops.map((label, s) => ({
  key: `s${s}`,
  label,
  values: dayLabels.map((_, i) => Math.round((Math.sin(i / (6 + s) + s) * 0.14 + (i / 60) * (s % 3 === 0 ? 0.12 : -0.05) + Math.sin(i * 1.3 + s) * 0.03) * 1000) / 1000),
}));

const brl = (n: number) => formatCurrency(n, { cents: false });

export default function Page() {
  const [channel, setChannel] = useState("pago");
  const [bands, setBands] = useState<"2" | "3" | "4">("3");
  return (
    <DocPage title={meta.title} kicker="Gráficos" description={meta.description}>
      <DocSection title="Dispersão conectada" rule="Um ponto por mês, ligado ao seguinte. A cabeça é o mês em foco; setas do teclado ou o controle de tempo movem a cabeça. Trocar a série transiciona o caminho.">
        <Demo
          bare
          code={`<ConnectedScatter
  label="CAC contra LTV de 12 meses, julho de 2025 a junho de 2026"
  series={[{ key: "pago", label: "Mídia paga", points: [{ x: 780, y: 2950, label: "jul 2025" }, …, { x: 960, y: 4640, label: "jun 2026", note: "Planos anuais" }] }, …]}
  active={canal}
  xLabel="CAC" yLabel="LTV em 12 meses"
  formatX={brl} formatY={brl}
  reference={{ ratio: 3, label: "LTV = 3× CAC", zone: "above", zoneLabel: "Saudável, acima de 3×" }}
/>`}
        >
          <ChartCard
            title="O LTV paga o CAC?"
            description="Custo de aquisição contra o LTV de 12 meses · jul 2025 a jun 2026"
            action={
              <SegmentedControl
                label="Canal"
                value={channel}
                onChange={setChannel}
                options={[
                  { value: "pago", label: "Paga" },
                  { value: "organico", label: "Orgânico" },
                ]}
              />
            }
          >
            <ConnectedScatter
              label="CAC contra LTV de 12 meses, julho de 2025 a junho de 2026"
              series={cacLtv}
              activeSeries={channel}
              xLabel="CAC"
              yLabel="LTV em 12 meses"
              formatX={brl}
              formatY={brl}
              formatAxisY={(n) => formatCurrency(n, { compact: true })}
              reference={{ ratio: 3, label: "LTV = 3× CAC", zone: "above", zoneLabel: "Saudável, acima de 3×" }}
              height={320}
            />
          </ChartCard>
        </Demo>
        <PropsTable
          rows={[
            ["series", "{ key, label, points: { x, y, label, note? }[], color? }[]", "—", "Pontos em ordem do tempo. `label` = instante (\"jun 2026\"); `note` vira anotação junto ao ponto."],
            ["active", "string", "a primeira", "Série em destaque. As outras aparecem esmaecidas (`compare={false}` esconde)."],
            ["index / onIndexChange", "number", "o último ponto", "Posição da cabeça. Controle para ligar a células de número acima do gráfico."],
            ["xLabel / yLabel", "string", "—", "Nomes das medidas: eixo, tooltip e tabela de leitor de tela."],
            ["formatX / formatY", "(n) => string", "formatNumber", "Formato completo; `formatAxisX`/`formatAxisY` para o eixo compacto."],
            ["reference", "{ ratio, label, zone?, zoneLabel? }", "—", "Linha y = ratio · x tracejada; `zone` sombreia o lado saudável."],
            ["curve", "\"smooth\" | \"linear\"", "\"smooth\"", "Caminho suave (passa por todos os pontos) ou em segmentos."],
            ["arrows / scrubber / legend", "boolean", "true", "Setas de direção, controle de tempo com tocar/pausar e legenda."],
            ["label", "string", "—", "Obrigatório: descrição do gráfico para leitor de tela."],
          ]}
        />
      </DocSection>

      <DocSection title="Horizon" rule="Muitas séries contra a própria base, cada uma numa linha baixa. Acima da base em chart-pos, abaixo em chart-neg; a cor mais forte é a mais longe. A cruz é a mesma em todas as linhas.">
        <Demo
          bare
          code={`// values = desvio de cada dia contra a base, em fração (0.12 = 12 % acima)
<HorizonChart
  label="Vendas diárias por loja contra a média do trimestre"
  series={[{ key: "centro", label: "Loja Centro", values: [0.04, 0.06, -0.02, …] }, …]}
  days={["Dia 1", "Dia 2", …]}
  bands={3}
  sort="peak"
/>`}
        >
          <ChartCard
            title="Quais lojas fugiram da média?"
            description="Vendas por dia contra a média do trimestre · últimos 60 dias"
            action={
              <SegmentedControl
                label="Faixas"
                value={bands}
                onChange={setBands}
                options={[
                  { value: "2", label: "2" },
                  { value: "3", label: "3" },
                  { value: "4", label: "4" },
                ]}
              />
            }
          >
            <HorizonChart label="Vendas diárias por loja contra a média do trimestre" series={horizon} days={dayLabels} bands={Number(bands) as 2 | 3 | 4} sort="peak" />
          </ChartCard>
        </Demo>
        <Demo title="Só a legenda" code={`<HorizonLegend bands={3} extent={0.36} />`}>
          <HorizonLegend bands={3} extent={0.36} />
        </Demo>
        <PropsTable
          rows={[
            ["series", "{ key, label, values: (number | null)[] }[]", "—", "Desvio diário contra a base, em fração. `null` = sem dado."],
            ["days", "string[]", "—", "Rótulo de cada dia: cabeçalho, anúncio do teclado e tabela."],
            ["bands", "1 | 2 | 3 | 4", "3", "Em quantas faixas cada linha dobra. Trocar transiciona suave."],
            ["extent", "number", "maior desvio", "Desvio coberto pelas faixas (fração). Fixe para comparar telas."],
            ["sort", "\"name\" | \"peak\" | \"latest\"", "\"name\"", "Ordem das linhas; a troca desliza as linhas."],
            ["index / onIndexChange", "number | null", "—", "Dia sob a cruz. Sem cruz, o valor à direita é o do último dia."],
            ["ticks", "{ index, label }[]", "—", "Marcas de tempo embaixo (ex.: o 1º de cada mês)."],
            ["rowHeight", "number", "32", "Altura de cada linha."],
            ["header / legend", "boolean", "true", "Dia em foco e legenda das faixas (HorizonLegend)."],
            ["format", "(n) => string", "formatDelta(n, 0)", "Formato do desvio."],
            ["label", "string", "—", "Obrigatório: descrição para leitor de tela (a tabela escondida traz pico, mínimo e último de cada linha)."],
          ]}
        />
      </DocSection>

      <DocSection title="Teclado e acessibilidade">
        <Rules
          items={[
            { do: "Dispersão conectada: setas movem a cabeça mês a mês; Home e End vão ao início e ao fim. O mês, o x e o y são anunciados." },
            { do: "Horizon: setas para os lados mudam o dia, para cima e para baixo percorrem as linhas, PageUp/PageDown pulam uma semana, Esc tira a cruz." },
          ]}
        />
      </DocSection>

      <DocSection title="Quando usar">
        <Rules
          items={[
            { do: "Dispersão conectada quando a direção no tempo importa: o canal ficou mais caro e o LTV não acompanhou? Até 3 séries.", dont: "Com poucos meses (menos de 6) ou uma medida só: use LineChart." },
            { do: "Horizon para 8 a 20 séries diárias contra a própria base (lojas, cidades, filas, serviços).", dont: "Com menos de 6 séries: um LineChart com as linhas juntas lê melhor." },
            { do: "Horizon com base explícita na descrição (\"contra a média de maio\") e a legenda das faixas visível.", dont: "Comparar valores absolutos entre linhas: cada uma é relativa à própria base." },
            { do: "Ler azul como acima e laranja como abaixo da base, com o número à direita.", dont: "Tratar a escala como bom × ruim; distribuições (prazo, salário) são BoxPlot ou Histogram." },
          ]}
        />
      </DocSection>
    </DocPage>
  );
}
