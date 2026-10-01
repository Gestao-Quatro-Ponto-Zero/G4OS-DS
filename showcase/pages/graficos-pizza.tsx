import { useState } from "react";
import { PieChart, Select, formatNumber } from "@g4os/ds";
import { DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";
import { ChartDemo, ChartGrid } from "./_chart-kit";
import * as d from "./_chart-data";

export const meta: PageMeta = {
  title: "Pizza e rosca",
  group: "Gráficos",
  order: 5,
  description: "Parte de um todo com 2 a 6 fatias. Rosca quando o total importa (vai no centro); pizza quando só a proporção importa.",
};

const items = d.pieChannels;

function Interactive() {
  const [sel, setSel] = useState("organico");
  const i = items.findIndex((it) => it.key === sel);
  return (
    <ChartDemo
      title="Origem dos leads · Interativo"
      description="Últimos 30 dias · escolha o canal"
      action={<Select size="compact" label="Canal" value={sel} onValueChange={setSel} options={items.map((it) => ({ value: it.key!, label: it.label }))} />}
      code={`const [sel, setSel] = useState("organico");
const i = itens.findIndex((it) => it.key === sel);

<PieChart
  label="Origem dos leads"
  items={itens}
  innerRadius={0.62}
  activeIndex={i}
  onActiveIndexChange={(n) => n != null && setSel(itens[n].key)}
  legend={false}
/>`}
    >
      <div className="flex justify-center">
        <PieChart label="Origem dos leads" items={items} innerRadius={0.62} activeIndex={i} onActiveIndexChange={(n) => n != null && setSel(items[n].key!)} legend={false} size={260} />
      </div>
    </ChartDemo>
  );
}

export default function Page() {
  return (
    <DocPage title="Pizza e rosca" kicker="Gráficos" description={meta.description}>
      <DocSection title="Variantes">
        <ChartGrid>
          <ChartDemo title="Pizza" description="Origem dos leads · 30 dias" insight="Orgânico lidera com 38 %" code={`<PieChart label="Origem dos leads" items={[{ label: "Orgânico", value: 2140 }, …]} />`}>
            <PieChart label="Origem dos leads" items={items} size={240} />
          </ChartDemo>
          <ChartDemo title="Rótulos internos" description="% dentro das fatias grandes" code={`<PieChart labels="inside" … />`}>
            <PieChart label="Origem dos leads" items={items} labels="inside" size={240} />
          </ChartDemo>
          <ChartDemo title="Lista de rótulos" description="Nome e valor com linha guia" code={`<PieChart labels="outside" legend={false} … />`}>
            <PieChart label="Origem dos leads" items={items.slice(0, 4)} labels="outside" legend={false} size={280} />
          </ChartDemo>
          <ChartDemo title="Rosca" description="Total no centro, fatia sob o cursor" code={`<PieChart innerRadius={0.62} … />`}>
            <PieChart label="Origem dos leads" items={items} innerRadius={0.62} size={240} />
          </ChartDemo>
          <ChartDemo title="Rosca com texto" description="Número e rótulo próprios no centro" insight="5.620 leads no mês" insightTrend="up" insightDetail="+12 % sobre agosto" code={`<PieChart innerRadius={0.7} centerValue="5.620" centerLabel="leads em setembro" … />`}>
            <PieChart label="Leads por origem" items={items} innerRadius={0.7} centerValue={formatNumber(5620)} centerLabel="leads em setembro" legend={false} size={240} />
          </ChartDemo>
          <Interactive />
          <ChartDemo title="Rosca empilhada" description="Mix de receita 2026 (fora) × 2025 (dentro)" code={`<PieChart rings={[{ label: "2026", items: … }, { label: "2025", items: … }]} … />`}>
            <PieChart label="Mix de receita por ano" rings={d.pieRings} size={240} />
          </ChartDemo>
          <ChartDemo title="Legenda ao lado" description="Com participação de cada fatia" code={`<PieChart legend="right" innerRadius={0.62} … />`}>
            <PieChart label="Origem dos leads" items={items} legend="right" innerRadius={0.62} size={200} />
          </ChartDemo>
        </ChartGrid>
      </DocSection>
      <DocSection title="Props">
        <PropsTable
          rows={[
            ["items", "{ key?, label, value, color? }[]", "—", "Fatias. Cores padrão chart-1…6."],
            ["rings", "{ label, items }[]", "—", "Roscas concêntricas (use no lugar de items)."],
            ["innerRadius", "0–0,9", "0", "Fração do raio: > 0 vira rosca."],
            ["labels", '"none" | "inside" | "outside"', '"none"', "% dentro ou nome + valor com linha guia."],
            ["centerValue · centerLabel", "ReactNode", "total · Total", "Texto do centro (rosca)."],
            ["activeIndex · onActiveIndexChange", "number · (i) => void", "—", "Destaque controlado (interativo)."],
            ["legend", '"bottom" | "right" | false', '"bottom"', "Posição da legenda."],
          ]}
        />
      </DocSection>
      <DocSection title="Regras">
        <Rules items={[{ do: "2–6 fatias, maior primeiro, “Outros” por último.", dont: "12 fatias finas: use barras." }, { do: "Rosca com o total no centro.", dont: "Pizza 3D, explodida ou com sombra." }]} />
      </DocSection>
    </DocPage>
  );
}
