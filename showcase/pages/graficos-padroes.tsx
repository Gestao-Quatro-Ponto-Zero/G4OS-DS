import { CalendarHeatmap, GanttChart, HeatmapMatrix, ScatterChart } from "@g4ai/ds";
import { Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";
import * as d from "./_chart-data";

export const meta: PageMeta = { title: "Distribuição, padrões e tempo", group: "Gráficos", order: 24, description: "ScatterChart, HeatmapMatrix, CalendarHeatmap e GanttChart." };

export default function Page() {
  return (
    <DocPage title={meta.title} kicker="Gráficos" description={meta.description}>
      <DocSection title="ScatterChart" rule="Correlação entre duas medidas. size vira bolha; groups colore por segmento; quadrants traça as médias.">
        <Demo bare code={`<ScatterChart points={[{ id, label, x, y, size?, group? }]} xLabel="Valor (R$ mil)" yLabel="Ciclo (dias)" groups={["Enterprise", "Mid-market", "PME"]} quadrants />`}>
          <div className="rounded-xl border border-line bg-surface p-5">
            <ScatterChart points={d.deals} xLabel="Valor (R$ mil)" yLabel="Ciclo (dias)" groups={["Enterprise", "Mid-market", "PME"]} quadrants />
          </div>
        </Demo>
      </DocSection>
      <DocSection title="RadarChart" rule="Perfil em critérios ganhou página própria com 10 variantes.">
        <p className="m-0 text-[13px]"><a className="font-medium text-blue underline decoration-blue/40 underline-offset-2 hover:decoration-blue" href="#/p/graficos-radar">Ver Gráficos › Radar →</a></p>
      </DocSection>
      <DocSection title="HeatmapMatrix" rule="Duas dimensões: coorte × mês, dia × hora, pessoa × etapa. Uma cor, intensidade contínua, valor na célula.">
        <Demo bare code={`<HeatmapMatrix rows={["jan/26", …]} columns={["M0", "M1", …]} values={[[100, 88, …], …]} format={(n) => \`\${n}%\`} max={100} />`}>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-line bg-surface p-5">
              <HeatmapMatrix rows={d.cohorts.rows} columns={d.cohorts.columns} values={d.cohorts.values} format={(n) => `${n}%`} max={100} />
            </div>
            <div className="rounded-xl border border-line bg-surface p-5">
              <HeatmapMatrix rows={d.hours.rows} columns={d.hours.columns} values={d.hours.values} tone="accent" />
            </div>
          </div>
        </Demo>
      </DocSection>
      <DocSection title="CalendarHeatmap" rule="Intensidade por dia ao longo de semanas (atividade, vendas, entrevistas).">
        <Demo className="block" code={`<CalendarHeatmap values={[{ date: "2026-09-30", value: 6 }, …]} weeks={26} noun="atividades" tone="ink" />`}>
          <CalendarHeatmap values={d.activity} end={new Date(2026, 8, 30)} />
        </Demo>
      </DocSection>
      <DocSection title="GanttChart" rule="Cronograma com progresso, marcos e linha de hoje.">
        <Demo
          bare
          code={`<GanttChart tasks={[{ id: "1", label: "Integração fiscal", start: "2026-09-07", end: "2026-10-16", progress: 55 }, { id: "2", label: "Go-live", start: "2026-11-03", end: "2026-11-03", milestone: true }]} />`}
        >
          <GanttChart
            today={new Date(2026, 8, 30)}
            tasks={[
              { id: "1", label: "Levantamento", start: "2026-08-03", end: "2026-08-21", progress: 100, tone: "ok" },
              { id: "2", label: "Migração do cadastro", start: "2026-08-17", end: "2026-09-18", progress: 100, tone: "ok" },
              { id: "3", label: "Integração fiscal (NF-e)", start: "2026-09-07", end: "2026-10-16", progress: 55 },
              { id: "4", label: "Treinamento", start: "2026-10-05", end: "2026-10-30", progress: 10, tone: "accent" },
              { id: "5", label: "Go-live", start: "2026-11-03", end: "2026-11-03", milestone: true },
            ]}
          />
        </Demo>
        <PropsTable
          rows={[
            ["tasks", "{ id, label, start, end, progress?, tone?, milestone?, group? }[]", "—", "Datas ISO (AAAA-MM-DD)."],
            ["today", "Date", "new Date()", "Posição da linha dourada."],
          ]}
        />
      </DocSection>
      <DocSection title="Regras">
        <Rules items={[{ do: "Rotule os dois eixos de uma dispersão com unidade.", dont: "Radar com escalas diferentes por eixo." }]} />
      </DocSection>
    </DocPage>
  );
}
