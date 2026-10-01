import { useState } from "react";
import { DateRangeFilter, KpiCard, KpiGrid, PageHeading, describeDateRange, formatCurrency, resolveDateRange, type DateRange } from "@g4os/ds";
import { Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";

export const meta: PageMeta = {
  title: "Período e datas",
  group: "Filtros e busca",
  order: 30,
  description: "DateRangeFilter: presets primeiro, intervalo personalizado por último. Em dashboard é o recorte da tela inteira; em lista é um filtro de data como outro qualquer.",
};

const now = new Date(2026, 8, 30);

export default function Page() {
  const [range, setRange] = useState<DateRange>(resolveDateRange("last30", now));
  const days = range.from && range.to ? Math.round((new Date(range.to).getTime() - new Date(range.from).getTime()) / 86400000) + 1 : 30;
  return (
    <DocPage title={meta.title} kicker="Filtros e busca" description={meta.description}>
      <DocSection title="Em dashboard: topo à direita, vale para tudo" rule="Um só período por tela, junto das ações do cabeçalho. Todo card e gráfico obedece. O subtítulo diz o período por extenso.">
        <Demo
          bare
          code={`const [range, setRange] = useState(resolveDateRange("last30"));

<PageHeading
  title="Vendas"
  description={\`\${describeDateRange(range)} · comparado ao período anterior\`}
  actions={<DateRangeFilter value={range} onChange={setRange} />}
/>`}
        >
          <div className="rounded-xl border border-line bg-surface p-5">
            <PageHeading sticky={false} compact title="Vendas" description={`${describeDateRange(range)} (${range.from.split("-").reverse().join("/")} a ${range.to.split("-").reverse().join("/")}) · comparado aos ${days} dias anteriores`} actions={<DateRangeFilter value={range} onChange={setRange} now={now} />} />
            <KpiGrid cols={3} className="mt-5">
              <KpiCard label="Receita" value={formatCurrency(41_300 * days, { compact: true })} delta={0.084} period={`vs. ${days} dias anteriores`} />
              <KpiCard label="Novos clientes" value={Math.round(days * 1.7)} delta={-0.05} period={`vs. ${days} dias anteriores`} />
              <KpiCard label="Ticket médio" value={formatCurrency(6842)} delta={0.021} period={`vs. ${days} dias anteriores`} />
            </KpiGrid>
          </div>
        </Demo>
      </DocSection>
      <DocSection title="API">
        <PropsTable
          rows={[
            ["value · onChange", "DateRange", "—", "{ preset, from, to } com datas ISO inclusivas."],
            ["presets", "DateRangePreset[]", "todos", "Recorte a lista: hoje, ontem, 7/30/90 dias, este mês, mês passado, trimestre, ano."],
            ["resolveDateRange(preset, now?)", "DateRange", "", "Converte preset em datas (use no servidor também)."],
            ["describeDateRange(range)", "string", "", "“Últimos 30 dias” ou “01 set – 15 set”."],
          ]}
        />
      </DocSection>
      <DocSection title="Regras">
        <Rules
          items={[
            { do: "Preset relativo como padrão (“Últimos 30 dias”): o link continua útil amanhã.", dont: "Datas fixas como padrão que envelhecem." },
            { do: "Comparação explícita no KPI (“vs. 30 dias anteriores”).", dont: "Delta sem dizer contra o quê." },
            { do: "Em lista, data é um campo do + Filtro (“Fechamento previsto nos últimos 30 dias”).", dont: "Período global numa lista que tem várias datas diferentes." },
          ]}
        />
      </DocSection>
    </DocPage>
  );
}
