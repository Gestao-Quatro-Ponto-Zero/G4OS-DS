import { useState } from "react";
import { ChartCard, HeatmapMatrix, RetentionCurves, SankeyChart, SegmentedControl, WaterfallChart, formatCurrency, formatNumber, formatPercent, type SankeyLink, type SankeyNode } from "@g4ai/ds";
import { Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";

export const meta: PageMeta = {
  title: "Receita, retenção e jornada",
  group: "Gráficos",
  order: 24,
  description: "As três perguntas de todo SaaS: por que o MRR mudou (cascata com eixo truncado e barras selecionáveis), quem fica (coorte em degraus e curvas de retenção) e onde as pessoas saem do caminho (sankey com nó selecionável).",
};

const brl = (n: number) => formatCurrency(n, { compact: true });

const bridges = {
  ago: [
    { label: "Início", value: 429_700, kind: "total" as const },
    { label: "Novos", value: 19_400 },
    { label: "Expansão", value: 10_600 },
    { label: "Contração", value: -4_900 },
    { label: "Cancelamento", value: -9_100 },
    { label: "Fim", value: 445_700, kind: "total" as const },
  ],
  set: [
    { label: "Início", value: 445_700, kind: "total" as const },
    { label: "Novos", value: 18_500 },
    { label: "Expansão", value: 10_700 },
    { label: "Contração", value: -4_700 },
    { label: "Cancelamento", value: -9_100 },
    { label: "Fim", value: 461_100, kind: "total" as const },
  ],
};

const cohorts = ["jan", "fev", "mar", "abr", "mai", "jun"];
const months = ["1", "2", "3", "4", "5", "6"];
const curve = [0.74, 0.63, 0.55, 0.5, 0.47, 0.44];
const triangle = cohorts.map((_, i) => months.map((__, m) => (m >= cohorts.length - i ? null : Math.round((curve[m] + i * 0.01) * 100) / 100)));
const average = months.map((_, m) => {
  const col = triangle.map((r) => r[m]).filter((v): v is number => v != null);
  return col.reduce((s, v) => s + v, 0) / col.length;
});

const journeyNodes: SankeyNode[] = [
  { id: "visita", label: "Visita", column: 0 },
  { id: "conta", label: "Conta criada", column: 1 },
  { id: "saiu", label: "Saiu", column: 1, color: "var(--ds-chart-6)" },
  { id: "pago", label: "Plano pago", column: 2, color: "var(--ds-ok)" },
  { id: "gratuito", label: "Gratuito", column: 2, color: "var(--ds-chart-6)" },
];
const journeyLinks: SankeyLink[] = [
  { source: "visita", target: "conta", value: 5_275 },
  { source: "visita", target: "saiu", value: 11_690 },
  { source: "conta", target: "pago", value: 1_020 },
  { source: "conta", target: "gratuito", value: 4_255 },
];

function WaterfallDemo() {
  const [month, setMonth] = useState<"ago" | "set">("set");
  const [sel, setSel] = useState<number | null>(1);
  const steps = bridges[month];
  return (
    <ChartCard
      title="O que mudou o MRR?"
      description={`${month === "set" ? "Setembro" : "Agosto"} de 2026 · em R$ · eixo começa perto do menor valor`}
      action={
        <SegmentedControl
          label="Mês"
          value={month}
          onChange={setMonth}
          options={[
            { value: "ago", label: "Ago" },
            { value: "set", label: "Set" },
          ]}
        />
      }
    >
      <div className="flex flex-col gap-3">
        <WaterfallChart steps={steps} format={brl} axisBreak connectors showValues selected={sel} onSelect={setSel} height={260} label="Ponte de MRR" />
        <p className="m-0 text-[12.5px] text-muted" aria-live="polite">
          {sel == null ? "Selecione uma barra." : `${steps[sel].label}: ${brl(steps[sel].value)}`}
        </p>
      </div>
    </ChartCard>
  );
}

function SankeyDemo() {
  const [sel, setSel] = useState<string | null>("pago");
  return (
    <ChartCard title="Onde as pessoas saem do caminho?" description="16.965 visitas e 1.020 planos pagos em setembro">
      <SankeyChart
        nodes={journeyNodes}
        links={journeyLinks}
        nodeLabels="above"
        columnLabels={["Visita", "Conta", "Plano"]}
        selected={sel}
        onSelect={setSel}
        minWidth={520}
        height={300}
        label="Jornada até o plano pago"
      />
    </ChartCard>
  );
}

export default function Page() {
  return (
    <DocPage title={meta.title} kicker="Gráficos" description={meta.description}>
      <DocSection
        title="Cascata de MRR (WaterfallChart)"
        rule="Explica a diferença entre dois totais grandes com movimentos pequenos. `axisBreak` é a única exceção à regra do eixo em zero e sempre desenha a marca de quebra; a tabela de leitor de tela mantém os valores reais."
      >
        <Demo
          bare
          code={`const [sel, setSel] = useState<number | null>(1);
<WaterfallChart
  steps={[
    { label: "Início", value: 445_700, kind: "total" },
    { label: "Novos", value: 18_500 },
    { label: "Expansão", value: 10_700 },
    { label: "Contração", value: -4_700 },
    { label: "Cancelamento", value: -9_100 },
    { label: "Fim", value: 461_100, kind: "total" },
  ]}
  format={(n) => formatCurrency(n, { compact: true })}
  axisBreak connectors showValues
  selected={sel} onSelect={setSel}
  label="Ponte de MRR"
/>`}
        >
          <WaterfallDemo />
        </Demo>
        <PropsTable
          rows={[
            ["axisBreak", "boolean | { min: number }", "false", "Eixo começa perto do menor valor, com marca de quebra no eixo e na base das barras de total. `{ min }` fixa o início."],
            ["connectors", "boolean", "true", "Linha tracejada do topo de uma barra ao início da seguinte."],
            ["showValues", "boolean", "true", "Valor junto da barra: acima nos aumentos e totais, abaixo nas quedas, com + e −."],
            ["selected", "number | null", "—", "Índice da barra selecionada; as outras esmaecem."],
            ["onSelect", "(index | null) => void", "—", "Torna as barras botões: setas percorrem, Enter seleciona, Esc solta."],
          ]}
        />
      </DocSection>

      <DocSection title="Coorte em degraus (HeatmapMatrix)" rule="Triângulo de retenção: `null` é o mês que a coorte ainda não alcançou (célula vazia). Escala em degraus com `scale` e legenda ligada com `legend`: passar o mouse num degrau destaca as células daquela faixa.">
        <Demo
          bare
          code={`<HeatmapMatrix
  rows={["jan", "fev", "mar"]} columns={["1", "2", "3"]}
  values={[[0.74, 0.63, 0.55], [0.75, 0.64, null], [0.76, null, null]]}
  rowsLabel="Coorte" rowMetaLabel="Espaços" rowMeta={["360", "386", "402"]}
  summaryRow={{ label: "Média", values: [0.75, 0.63, 0.55], meta: "1.148" }}
  scale={{ steps: 6, domain: [0.2, 0.8] }}
  legend legendTitle="% ativos"
  format={(n) => formatPercent(n, 0)} cell={44}
  label="Retenção por coorte"
/>`}
        >
          <ChartCard title="As coortes novas retêm melhor?" description="% de espaços ativos por mês desde o cadastro">
            <HeatmapMatrix
              rows={cohorts}
              columns={months}
              values={triangle}
              rowsLabel="Coorte"
              rowMetaLabel="Espaços"
              rowMeta={[360, 386, 402, 416, 395, 398].map((n) => formatNumber(n))}
              summaryRow={{ label: "Média", values: average, meta: formatNumber(2_357) }}
              scale={{ steps: 6, domain: [0.2, 0.8] }}
              legend
              legendTitle="% ativos"
              valueLabel="Ativos"
              format={(n) => formatPercent(n, 0)}
              cell={44}
              label="Retenção por coorte"
            />
          </ChartCard>
        </Demo>
        <PropsTable
          rows={[
            ["rowMeta", "ReactNode[]", "—", "Coluna depois do rótulo da linha (tamanho da coorte). Cabeçalho em `rowMetaLabel`."],
            ["rowsLabel", "string", "—", "Cabeçalho da coluna de rótulos (\"Coorte\")."],
            ["summaryRow", "{ label, values, meta? }", "—", "Linha separada no fim (\"Média\"), na mesma escala."],
            ["scale", "{ steps; domain? }", "—", "Degraus de limites redondos (`quantizeScale`); cor por `sequentialColor`."],
            ["legend", "boolean | ReactNode", "false", "`true` desenha o `ScaleLegend` ligado acima da matriz."],
            ["legendTitle / valueLabel", "string", "— / \"Valor\"", "Título da legenda e rótulo do valor no tooltip."],
          ]}
        />
        <p className="m-0 text-[13px] text-muted">Células com valor são focáveis: setas percorrem (pulando as vazias), Home e End vão ao início e ao fim da linha, e o tooltip mostra o valor.</p>
      </DocSection>

      <DocSection title="Curvas de retenção (RetentionCurves)" rule="O mesmo dado da coorte, lido como linhas: as coortes recentes ficam mais escuras e a média vem em destaque. Use quando a pergunta é a forma da curva (onde estabiliza), não o número de uma célula.">
        <Demo
          bare
          code={`<RetentionCurves
  rows={[{ label: "jan", values: [0.74, 0.63, 0.55] }, { label: "fev", values: [0.75, 0.64, null] }]}
  columns={["1", "2", "3"]}
  average={{ label: "Média", values: [0.745, 0.635, 0.55] }}
  label="Curvas de retenção por coorte"
/>`}
        >
          <ChartCard title="Onde a retenção estabiliza?" description="% de espaços ativos por mês desde o cadastro">
            <RetentionCurves rows={cohorts.map((c, i) => ({ label: c, values: triangle[i] }))} columns={months} average={{ label: "Média", values: average }} height={260} label="Curvas de retenção por coorte" />
          </ChartCard>
        </Demo>
        <PropsTable
          rows={[
            ["rows", "{ label; values: (number | null)[] }[]", "—", "Uma linha por coorte, da mais antiga para a mais recente."],
            ["columns", "string[]", "—", "Rótulos do eixo X (meses desde o cadastro)."],
            ["average", "{ label?; values }", "—", "Curva média, em destaque."],
            ["format / formatAxis", "(n) => string", "formatPercent(n, 0)", "Valores recebem fração."],
          ]}
        />
      </DocSection>

      <DocSection title="Jornada (SankeyChart)" rule="Selecionar um nó traça tudo o que chega e sai dele, recursivamente; o resto esmaece. Perdas com `color` neutro e nome próprio; meta em `ok`. Em telas estreitas, `minWidth` faz o gráfico rolar dentro do próprio contêiner.">
        <Demo
          bare
          code={`<SankeyChart
  nodes={[
    { id: "visita", label: "Visita", column: 0 },
    { id: "conta", label: "Conta criada", column: 1 },
    { id: "saiu", label: "Saiu", column: 1, color: "var(--ds-chart-6)" },
    { id: "pago", label: "Plano pago", column: 2, color: "var(--ds-ok)" },
  ]}
  links={links}
  nodeLabels="above" columnLabels={["Visita", "Conta", "Plano"]}
  selected={sel} onSelect={setSel} minWidth={520}
  label="Jornada até o plano pago"
/>`}
        >
          <SankeyDemo />
        </Demo>
        <PropsTable
          rows={[
            ["columnLabels", "string[]", "—", "Rótulo de cada coluna, embaixo."],
            ["nodeLabels", "\"side\" | \"above\"", "\"side\"", "`above`: nome e \"valor · %\" (sobre o total da 1ª coluna) acima do nó."],
            ["selected / onSelect", "string | null", "—", "Nó selecionado; com `onSelect`, nós viram botões (↑↓ na coluna, ←→ entre colunas)."],
            ["minWidth", "number", "—", "Largura mínima; abaixo dela rola no próprio contêiner."],
            ["SankeyNode.color", "string", "—", "Cor do nó e das faixas que chegam nele."],
          ]}
        />
      </DocSection>

      <DocSection title="Quando usar cada um">
        <Rules
          items={[
            { do: "Cascata com `axisBreak` só para ponte de saldo: início e fim grandes, movimentos pequenos (MRR, caixa, carteira).", dont: "Truncar o eixo de barras comuns para exagerar diferença, ou truncar sem a marca de quebra." },
            { do: "Coorte em triângulo com o tamanho de cada coorte ao lado e uma linha de média separada.", dont: "Escala contínua com dezenas de tons: use 5 a 7 degraus com limites redondos." },
            { do: "Curvas quando a pergunta é a forma (onde estabiliza); mapa quando é o número de uma coorte num mês.", dont: "Mais de 12 coortes em curvas: vira um borrão; agrupe por trimestre." },
            { do: "Sankey quando importa por onde cada parte passou, com perdas nomeadas e etapas embaixo.", dont: "Sankey para conversão simples entre etapas em linha: use FunnelChart." },
            { do: "Selecionar abre detalhe ao lado ou abaixo (contas do movimento, conversão da etapa).", dont: "Informação que só aparece no hover: o clique e o teclado precisam chegar ao mesmo lugar." },
          ]}
        />
      </DocSection>
    </DocPage>
  );
}
