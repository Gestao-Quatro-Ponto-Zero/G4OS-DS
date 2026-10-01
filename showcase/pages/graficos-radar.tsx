import { RadarChart } from "@g4ai/ds";
import { DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";
import { ChartDemo, ChartGrid } from "./_chart-kit";
import * as d from "./_chart-data";

export const meta: PageMeta = {
  title: "Radar",
  group: "Gráficos",
  order: 6,
  description: "Perfil em 3 a 8 critérios na mesma escala: scorecard de candidato, avaliação de fornecedor, maturidade de processo.",
};

const axes = d.radarAxes;
const ideal = { ...d.radarIdeal, dashed: true, color: "var(--ds-accent)" };

export default function Page() {
  return (
    <DocPage title="Gráfico de radar" kicker="Gráficos" description={meta.description}>
      <DocSection title="Variantes">
        <ChartGrid>
          <ChartDemo title="Padrão" description="Média dos entrevistadores (0–5)" insight="Forte em técnica e cultura" code={`<RadarChart axes={["Técnica", "Comunicação", …]} series={[{ label: "Marina", values: [4.5, 4, …] }]} max={5} />`}>
            <RadarChart axes={axes} series={[d.radarA]} />
          </ChartDemo>
          <ChartDemo title="Sem pontos" description="Só a forma" code={`<RadarChart dots={false} … />`}>
            <RadarChart axes={axes} series={[d.radarA]} dots={false} />
          </ChartDemo>
          <ChartDemo title="Contra o perfil da vaga" description="Candidata × ideal tracejado" code={`<RadarChart series={[candidata, { ...perfil, dashed: true, color: "var(--ds-accent)" }]} />`}>
            <RadarChart axes={axes} series={[d.radarA, ideal]} />
          </ChartDemo>
          <ChartDemo title="Múltiplas" description="Dois candidatos" code={`<RadarChart series={[marina, rafael]} />`}>
            <RadarChart axes={axes} series={[d.radarA, d.radarB]} />
          </ChartDemo>
          <ChartDemo title="Só linhas" description="Sem preenchimento: compara sem sobrepor manchas" code={`<RadarChart fill={false} series={[marina, rafael]} />`}>
            <RadarChart axes={axes} series={[d.radarA, d.radarB]} fill={false} />
          </ChartDemo>
          <ChartDemo title="Grade circular" description="Anéis em vez de polígonos" code={`<RadarChart grid="circle" … />`}>
            <RadarChart axes={axes} series={[d.radarA]} grid="circle" />
          </ChartDemo>
          <ChartDemo title="Grade preenchida" description="Fundo suave no anel externo" code={`<RadarChart gridFill … />`}>
            <RadarChart axes={axes} series={[d.radarA]} gridFill />
          </ChartDemo>
          <ChartDemo title="Escala do raio" description="Valores de cada anel" code={`<RadarChart radiusAxis … />`}>
            <RadarChart axes={axes} series={[d.radarA]} radiusAxis rings={5} />
          </ChartDemo>
          <ChartDemo title="Valores nos eixos" description="Nota da série principal junto ao critério" code={`<RadarChart axisValues … />`}>
            <RadarChart axes={axes} series={[d.radarA]} axisValues />
          </ChartDemo>
          <ChartDemo title="Sem grade" description="Mínimo, para cards pequenos" code={`<RadarChart grid="none" size={220} … />`}>
            <RadarChart axes={axes} series={[d.radarA, ideal]} grid="none" size={240} />
          </ChartDemo>
        </ChartGrid>
      </DocSection>
      <DocSection title="Props">
        <PropsTable
          rows={[
            ["axes · series · max", "string[] · { label, values, color?, dashed? }[] · number", "— · — · 5", "Critérios, séries e topo da escala."],
            ["grid", '"polygon" | "circle" | "none"', '"polygon"', "Forma da grade."],
            ["gridFill · rings", "boolean · number", "false · 4", "Fundo do anel externo e quantidade de anéis."],
            ["fill · dots", "boolean", "true · true", "Preenchimento e pontos."],
            ["radiusAxis · axisValues", "boolean", "false", "Valores dos anéis; nota junto ao nome do eixo."],
            ["size · legend · format", "number · boolean · fn", "300 · 2+ séries · 1 casa", "Encolhe para caber no card."],
          ]}
        />
      </DocSection>
      <DocSection title="Regras">
        <Rules items={[{ do: "Mesma escala em todos os eixos; 3–8 eixos; até 3 séries.", dont: "Eixos em unidades diferentes (R$ × %)." }]} />
      </DocSection>
    </DocPage>
  );
}
