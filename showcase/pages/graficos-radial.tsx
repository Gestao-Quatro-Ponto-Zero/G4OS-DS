import { GaugeChart, ProgressRing, RadialBars, RadialChart, formatNumber } from "@g4os/ds";
import { DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";
import { ChartDemo, ChartGrid } from "./_chart-kit";

export const meta: PageMeta = {
  title: "Radial",
  group: "Gráficos",
  order: 7,
  description: "Um número contra um máximo (uso do plano, meta, score), em anel, semicírculo ou três quartos. Para várias metas, anéis concêntricos.",
};

export default function Page() {
  return (
    <DocPage title="Gráfico radial" kicker="Gráficos" description={meta.description}>
      <DocSection title="Variantes">
        <ChartGrid>
          <ChartDemo title="Anel com texto" description="Uso do plano" insight="870 de 1.000 usuários" insightDetail="Renova em 12/11" code={`<RadialChart value={870} max={1000} label="Usuários ativos" caption="de 1.000 no plano" />`}>
            <div className="flex justify-center">
              <RadialChart value={870} max={1000} label="Usuários ativos" caption="de 1.000 no plano" />
            </div>
          </ChartDemo>
          <ChartDemo title="Semicírculo" description="Atingimento da meta trimestral" code={`<RadialChart shape="half" value={78} format={(n) => \`\${n}%\`} … />`}>
            <div className="flex justify-center">
              <RadialChart shape="half" value={78} label="Meta do trimestre" caption="da meta atingida" format={(n) => `${formatNumber(n)} %`} />
            </div>
          </ChartDemo>
          <ChartDemo title="Três quartos" description="Score de saúde da conta" code={`<RadialChart shape="three-quarter" value={64} color="var(--ds-amber)" … />`}>
            <div className="flex justify-center">
              <RadialChart shape="three-quarter" value={64} label="Saúde da conta" caption="atenção: abaixo de 70" color="var(--ds-amber)" />
            </div>
          </ChartDemo>
          <ChartDemo title="Empilhado" description="Mesmo arco, várias partes" code={`<RadialChart segments={[{ label: "Online", value: 420 }, { label: "Loja", value: 260 }]} max={1000} shape="half" … />`}>
            <div className="flex justify-center">
              <RadialChart shape="half" max={1000} label="Pedidos do mês" segments={[{ label: "Online", value: 420 }, { label: "Loja", value: 260 }]} />
            </div>
          </ChartDemo>
          <ChartDemo title="Anéis concêntricos" description="% de meta por área" code={`<RadialBars items={[{ label: "Vendas", value: 92 }, …]} />`}>
            <RadialBars
              items={[
                { label: "Vendas", value: 92, hint: "R$ 1,1 mi" },
                { label: "Customer Success", value: 78, hint: "NRR 108 %" },
                { label: "Marketing", value: 64, hint: "2.380 MQLs" },
              ]}
              center={
                <div>
                  <div className="text-[20px] font-semibold tabular-nums">78 %</div>
                  <div className="text-[11px] text-muted">média</div>
                </div>
              }
            />
          </ChartDemo>
          <ChartDemo title="Medidor com faixas" description="NPS contra zonas" code={`<GaugeChart value={72} min={-100} max={100} bands={[…]} />`}>
            <div className="flex justify-center">
              <GaugeChart value={72} min={-100} max={100} label="NPS" bands={[{ to: 0, tone: "bad", label: "Crítica" }, { to: 50, tone: "warn", label: "Aperfeiçoamento" }, { to: 100, tone: "ok", label: "Excelência" }]} />
            </div>
          </ChartDemo>
          <ChartDemo title="Anel compacto" description="Em linhas de tabela e cards pequenos" code={`<ProgressRing value={74} label="Recebido" tone="ok" />`}>
            <div className="flex flex-wrap items-center justify-center gap-5 py-6">
              <ProgressRing value={32} label="Onboarding" />
              <ProgressRing value={74} label="Recebido" tone="ok" size={56} />
              <ProgressRing value={91} label="Capacidade" tone="warn" size={64} />
              <ProgressRing value={100} label="Concluído" tone="accent" size={72} thickness={6} />
            </div>
          </ChartDemo>
        </ChartGrid>
      </DocSection>
      <DocSection title="Props (RadialChart)">
        <PropsTable
          rows={[
            ["value · max", "number", "— · 100", "Valor e topo."],
            ["segments", "{ label, value, color? }[]", "—", "Partes empilhadas no mesmo arco."],
            ["shape", '"full" | "half" | "three-quarter"', '"full"', "Forma do arco."],
            ["label · caption · format", "string · ReactNode · fn", "—", "Acessível, linha abaixo do número, formato."],
            ["size · thickness · color · rounded", "number · number · string · boolean", "220 · 16 · chart-1 · true", "Aparência."],
          ]}
        />
      </DocSection>
      <DocSection title="Regras">
        <Rules items={[{ do: "Um radial por card, com o número no centro.", dont: "Grade de 8 radiais: use BulletChart em lista." }]} />
      </DocSection>
    </DocPage>
  );
}
