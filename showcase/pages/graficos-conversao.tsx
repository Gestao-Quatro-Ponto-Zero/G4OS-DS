import { FunnelChart, SankeyChart } from "@g4os/ds";
import { Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";
import * as d from "./_chart-data";

export const meta: PageMeta = { title: "Funil e fluxo", group: "Gráficos", order: 21, description: "FunnelChart para conversão entre etapas e SankeyChart para caminhos. Servem para CRM, ATS, e-commerce, onboarding e suporte." };

export default function Page() {
  return (
    <DocPage title={meta.title} kicker="Gráficos" description={meta.description}>
      <DocSection title="FunnelChart · barras" rule="Cabe em card estreito. Mostra valor, % do topo, conversão da etapa anterior e quantos saíram. A maior perda ganha âmbar.">
        <Demo
          bare
          code={`<FunnelChart
  stages={[
    { label: "Visitantes", value: 48200 },
    { label: "Leads", value: 6120, hint: "formulário ou chat" },
    { label: "Qualificados", value: 2380 },
    { label: "Propostas", value: 610 },
    { label: "Ganhos", value: 212 },
  ]}
/>`}
        >
          <div className="max-w-[640px] rounded-xl border border-line bg-surface p-5">
            <FunnelChart stages={d.funnel} />
          </div>
        </Demo>
      </DocSection>
      <DocSection title="FunnelChart · colunas" rule="Para dashboard largo: colunas com a faixa de perda entre elas e a conversão no topo.">
        <Demo bare code={`<FunnelChart variant="columns" stages={etapas} />`}>
          <div className="rounded-xl border border-line bg-surface p-5">
            <FunnelChart stages={d.hiring} variant="columns" />
          </div>
        </Demo>
        <PropsTable
          rows={[
            ["stages", "{ label, value, hint? }[]", "—", "Na ordem do processo. Valores decrescentes."],
            ["variant", '"bars" | "columns"', '"bars"', "Linhas horizontais ou colunas."],
            ["highlightDrop", "boolean", "true", "Destaca a etapa com menor conversão."],
            ["format", "(n) => string", "formatNumber", "Formato dos valores (use formatCurrency para funil de receita)."],
            ["label", "string", '"Funil de conversão"', "Resumo para leitor de tela."],
          ]}
        />
      </DocSection>
      <DocSection title="SankeyChart" rule="Quando importa POR ONDE cada parte passou (canal → qualificação → desfecho). Nós em colunas; a faixa herda a cor da origem.">
        <Demo
          bare
          code={`<SankeyChart
  nodes={[{ id: "org", label: "Orgânico", column: 0 }, { id: "qual", label: "Qualificado", column: 1 }, { id: "won", label: "Ganho", column: 2 }, …]}
  links={[{ source: "org", target: "qual", value: 520 }, { source: "qual", target: "won", value: 312 }, …]}
/>`}
        >
          <div className="rounded-xl border border-line bg-surface p-5">
            <SankeyChart nodes={d.sankey.nodes} links={d.sankey.links} height={280} />
          </div>
        </Demo>
      </DocSection>
      <DocSection title="Regras">
        <Rules
          items={[
            { do: "Nomeie etapas pelo estado da pessoa (“Qualificados”), não pela ação do time (“Qualificar”).", dont: "Misturar etapas de funis diferentes no mesmo gráfico." },
            { do: "Período explícito e coorte clara: “leads criados em setembro”.", dont: "Comparar etapas de períodos diferentes (dá conversão > 100 %)." },
          ]}
        />
      </DocSection>
    </DocPage>
  );
}
