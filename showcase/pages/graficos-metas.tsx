import { BulletChart, GaugeChart, WaterfallChart, formatCurrency } from "@g4ai/ds";
import { Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";
import * as d from "./_chart-data";

export const meta: PageMeta = { title: "Metas e pontes", group: "Gráficos", order: 23, description: "WaterfallChart (DRE, ponte de caixa), BulletChart (realizado × meta em lista) e GaugeChart (um número contra faixas)." };
const brl = (n: number) => formatCurrency(n, { compact: true });

export default function Page() {
  return (
    <DocPage title={meta.title} kicker="Gráficos" description={meta.description}>
      <DocSection title="WaterfallChart" rule="Explica a diferença entre dois totais. Verde soma, rosa subtrai, ink é total/subtotal (kind: 'total').">
        <Demo
          bare
          code={`<WaterfallChart
  steps={[
    { label: "Receita bruta", value: 1033000, kind: "total" },
    { label: "Impostos", value: -142000 },
    { label: "Custos", value: -371000 },
    { label: "Margem", value: 520000, kind: "total" },
    …
  ]}
  format={(n) => formatCurrency(n, { compact: true })}
/>`}
        >
          <div className="rounded-xl border border-line bg-surface p-5">
            <WaterfallChart steps={d.dre} format={brl} />
          </div>
        </Demo>
      </DocSection>
      <DocSection title="BulletChart" rule="Realizado (barra), meta (traço) e faixas qualitativas numa linha. Verde se bateu, ink se perto, âmbar se longe.">
        <Demo className="block space-y-3" code={`<BulletChart label="Ana Lopes" hint="Enterprise" value={412000} target={380000} format={brl} />`}>
          <BulletChart label="Ana Lopes" hint="Enterprise" value={412000} target={380000} format={brl} />
          <BulletChart label="Bruno Takeda" hint="Mid-market" value={296000} target={320000} format={brl} />
          <BulletChart label="Carla Nogueira" hint="PME" value={148000} target={250000} format={brl} />
        </Demo>
        <PropsTable
          rows={[
            ["value · target", "number", "—", "Realizado e meta."],
            ["ranges", "[number, number]", "[0.6, 0.9]", "Limites das faixas como fração da meta."],
            ["max", "number", "115 % do maior", "Fim da escala."],
          ]}
        />
      </DocSection>
      <DocSection title="GaugeChart" rule="Um número isolado com faixas (NPS, SLA, uso do plano). Nunca uma grade de gauges.">
        <Demo code={`<GaugeChart value={72} min={-100} max={100} label="NPS" bands={[{ to: 0, tone: "bad" }, { to: 50, tone: "warn" }, { to: 100, tone: "ok" }]} />`}>
          <GaugeChart value={72} min={-100} max={100} label="NPS" bands={[{ to: 0, tone: "bad" }, { to: 50, tone: "warn" }, { to: 100, tone: "ok" }]} />
          <GaugeChart value={87} label="Uso do plano" format={(n) => `${n}%`} bands={[{ to: 70, tone: "ok" }, { to: 90, tone: "warn" }, { to: 100, tone: "bad" }]} caption="870 de 1.000 usuários" />
          <GaugeChart value={96.2} label="SLA de resposta" format={(n) => `${n.toLocaleString("pt-BR")}%`} min={80} max={100} />
        </Demo>
      </DocSection>
      <DocSection title="Regras">
        <Rules items={[{ do: "Deixe claro o que é meta e de onde ela vem (“meta do trimestre: R$ 1,2 mi”).", dont: "Faixas coloridas sem legenda de significado." }]} />
      </DocSection>
    </DocPage>
  );
}
