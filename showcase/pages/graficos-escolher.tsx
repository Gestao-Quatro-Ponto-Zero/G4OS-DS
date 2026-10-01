import { DocPage, DocSection, Rules, type PageMeta } from "../kit";

export const meta: PageMeta = { title: "Qual gráfico usar", group: "Gráficos", order: 1, description: "Comece pela pergunta, não pelo gráfico. Esta tabela liga a pergunta de negócio ao componente certo." };

const rows: [string, string, string, string][] = [
  ["Como evoluiu no tempo?", "AreaChart · LineChart", "Receita mensal, visitantes, vagas abertas", "Área = volume; linha = taxa/preço. Até 3 séries. Interativo: período + legenda interativa."],
  ["Qual a participação de cada parte ao longo do tempo?", "AreaChart · BarChart (stackOffset=\"expand\")", "Mix de canais por mês", "Empilhado 100 %: eixo e tooltip em %."],
  ["Como se compara entre categorias ou meses?", "BarChart", "Vendas por mês, contratações por área", "Até ~16 barras. Negativos permitidos (caixa). Interativo: ChartCardTotals."],
  ["Ranking com nomes longos?", "BarChart layout=\"horizontal\" · BarList", "Vendas por região, top produtos", "Categorias à esquerda, rótulo de valor no fim."],
  ["Qual é o ranking?", "BarList · Leaderboard", "Origem de leads, top produtos, top vendedores", "Ordene do maior ao menor. Rótulo dentro da barra."],
  ["Quanto cada parte representa do todo?", "PieChart (pizza/rosca) · ProportionBar", "Mix de receita, status de faturas", "Até 6 partes; rosca com total no centro. Mais que isso: BarList ou Treemap."],
  ["Um número contra o máximo?", "RadialChart · GaugeChart · ProgressRing", "Uso do plano, meta do trimestre, NPS", "Um por card; faixas só no Gauge."],
  ["Composição com muitas partes ou hierarquia?", "Treemap", "Estoque por categoria, gasto por centro de custo", "Área = valor. Rótulo só onde cabe; resto no hover."],
  ["Onde perco gente no processo?", "FunnelChart", "Lead → cliente, candidatura → contratação", "A maior perda aparece em âmbar: é onde agir."],
  ["Por onde cada parte passou?", "SankeyChart", "Canal → qualificação → desfecho", "≤ 5 colunas, ≤ 20 nós."],
  ["O que explica a diferença entre dois totais?", "WaterfallChart", "DRE, ponte de caixa, variação de margem", "Subtotais com kind: total."],
  ["Estamos na meta?", "GoalMeter · BulletChart · GaugeChart", "Quota, orçamento, NPS, SLA", "Lista → Bullet. Um número isolado → Gauge."],
  ["Volume e taxa juntos?", "ComboChart", "Pedidos + ticket médio, receita + margem", "Dois eixos: rotule os dois."],
  ["Há relação entre duas medidas?", "ScatterChart", "Ticket × ciclo de venda, salário × tempo", "Bolha = 3ª dimensão. Quadrantes pela média."],
  ["Como é o perfil em vários critérios?", "RadarChart", "Scorecard de candidato, avaliação de fornecedor", "3–8 eixos, mesma escala, até 3 séries."],
  ["Quando acontece mais?", "HeatmapMatrix · CalendarHeatmap", "Hora × dia, coorte × mês, atividade diária", "Uma cor só, intensidade contínua."],
  ["Quando cada coisa acontece?", "GanttChart", "Cronograma de implantação, plano de projeto", "Linha de hoje em dourado; marcos em losango."],
  ["Só a tendência, ao lado de um número", "Sparkline (dentro de KpiCard)", "MRR, churn, CAC", "Nunca sozinha, sempre com o número."],
];

export default function Page() {
  return (
    <DocPage title={meta.title} kicker="Gráficos" description={meta.description}>
      <DocSection title="Da pergunta ao componente">
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full text-left text-[13px]">
            <thead className="border-b border-line bg-soft/60 text-[12px] text-muted">
              <tr>
                <th className="px-4 py-2.5">Pergunta</th>
                <th className="px-4 py-2.5">Componente</th>
                <th className="px-4 py-2.5">Exemplos</th>
                <th className="px-4 py-2.5">Regra</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map(([q, c, e, r]) => (
                <tr key={q}>
                  <td className="px-4 py-2.5 font-medium">{q}</td>
                  <td className="px-4 py-2.5 font-mono text-[12px] text-blue">{c}</td>
                  <td className="px-4 py-2.5 text-ink-soft">{e}</td>
                  <td className="px-4 py-2.5 text-muted">{r}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DocSection>
      <DocSection title="Regras que valem para todos">
        <Rules
          items={[
            { do: "Título do card = a pergunta respondida (“De onde vêm os leads?”). Descrição = período e unidade.", dont: "Título genérico (“Gráfico 1”, “Dados”) ou sem período." },
            { do: "Série principal em ink (chart-1). Comparação em azul (chart-2) ou tracejada (meta, período anterior).", dont: "Arco-íris: cada série de uma cor viva sem motivo." },
            { do: "Eixo Y começando em zero em barras e áreas.", dont: "Eixo “aproximado” que transforma 2 % em um penhasco." },
            { do: "Formate com formatCurrency / formatCompact / formatPercent: o número é o mesmo na tabela e no gráfico.", dont: "Valores crus (1234567.8) ou em inglês (1,234.5)." },
            { do: "Cor semântica (ok/rose) só quando o sinal importa: entrada × saída, positivo × negativo.", dont: "Verde e vermelho para categorias neutras." },
            { do: "Sem dado é “—” ou célula vazia; zero é zero.", dont: "Tratar ausência como zero (derruba a linha)." },
          ]}
        />
      </DocSection>
    </DocPage>
  );
}
