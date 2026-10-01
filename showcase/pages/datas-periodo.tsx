import { useState } from "react";
import { DateRangePicker, MonthPicker, QuarterPicker, YearPicker, comparePeriod, formatRange, resolvePeriod, type DateRangeValue } from "@g4os/ds";
import { Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";

export const meta: PageMeta = {
  title: "Período",
  group: "Formulários",
  order: 42,
  description: "DateRangePicker com presets, dois meses, comparação e dias úteis — e seletores de mês, trimestre e ano para competência, metas e exercício.",
};

const NOW = "2026-09-30";

export default function Page() {
  const base = resolvePeriod("last30", NOW);
  const [range, setRange] = useState<DateRangeValue>({ ...base, preset: "last30", compare: "previous", compareRange: comparePeriod(base, "previous") });
  const [plain, setPlain] = useState<DateRangeValue>({ from: "2026-09-01", to: "2026-09-15" });
  const [month, setMonth] = useState("2026-09");
  const [mRange, setMRange] = useState<{ from: string; to?: string }>({ from: "2026-01", to: "2026-06" });
  const [quarter, setQuarter] = useState("2026-T3");
  const [year, setYear] = useState("2026");
  return (
    <DocPage title={meta.title} kicker="Formulários · Datas" description={meta.description}>
      <DocSection
        title="DateRangePicker"
        rule="Em dashboard: canto superior direito, vale para a tela toda. Aplica no botão (recalcular é caro). Dois meses no desktop; no celular, folha inferior com um mês."
      >
        <Demo
          className="flex flex-col items-start gap-4"
          code={`const [periodo, setPeriodo] = useState<DateRangeValue>({ ...resolvePeriod("last30"), preset: "last30" });

<DateRangePicker value={periodo} onChange={setPeriodo} />
// periodo.from, periodo.to, periodo.preset, periodo.compare, periodo.compareRange`}
        >
          <div className="flex flex-wrap items-center gap-3">
            <DateRangePicker value={range} onChange={setRange} now={NOW} align="start" />
            <DateRangePicker value={plain} onChange={setPlain} now={NOW} allowCompare={false} label="Emissão" align="start" />
          </div>
          <pre className="m-0 w-full overflow-x-auto rounded-lg bg-soft px-3 py-2 font-mono text-[11.5px] text-ink-soft">{JSON.stringify(range, null, 2)}</pre>
          <p className="m-0 text-[12.5px] text-muted">
            Leitura: <span className="text-ink">{formatRange(range)}</span>
            {range.compareRange && <> contra {formatRange(range.compareRange)}</>}
          </p>
        </Demo>
        <PropsTable
          rows={[
            ["value / onChange", "DateRangeValue", "—", "{ from, to, preset?, compare?, compareRange? }."],
            ["presets", "PeriodPreset[]", "11 mais usados", "Hoje, Ontem, 7/30/90 dias, semana, mês, mês passado, trimestre, ano até hoje, 12 meses (também last_week, last_quarter, this_year, last_year)."],
            ["allowCompare", "boolean", "true", "Mostra “Comparar com: Nada · Período anterior · Ano anterior”."],
            ["min · max · extraHolidays", "—", "—", "Limites e feriados para a contagem de dias úteis."],
            ["align", '"start" | "end"', '"end"', "Alinhamento do popover (end no topo direito de dashboards)."],
          ]}
        />
      </DocSection>

      <DocSection title="Como a comparação é calculada">
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[560px] text-left text-[13px]">
            <thead className="border-b border-line bg-soft/60 text-[12px] text-muted">
              <tr>
                <th className="px-4 py-2.5">Período</th>
                <th className="px-4 py-2.5">Período anterior</th>
                <th className="px-4 py-2.5">Ano anterior</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line tabular-nums">
              {[
                { from: "2026-09-01", to: "2026-09-30" },
                { from: "2026-07-01", to: "2026-09-30" },
                { from: "2026-09-01", to: "2026-09-15" },
                resolvePeriod("last7", NOW),
              ].map((r) => (
                <tr key={r.from + r.to}>
                  <td className="px-4 py-2.5">{formatRange(r)}</td>
                  <td className="px-4 py-2.5 text-ink-soft">{formatRange(comparePeriod(r, "previous")!)}</td>
                  <td className="px-4 py-2.5 text-ink-soft">{formatRange(comparePeriod(r, "year")!)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="m-0 text-[12.5px] text-muted">Meses cheios comparam com os meses cheios anteriores (setembro → agosto, não “30 dias antes”).</p>
      </DocSection>

      <DocSection title="Mês, trimestre e ano" rule="Quando a unidade do negócio não é o dia: competência, fechamento, metas, exercício.">
        <Demo
          code={`<MonthPicker value="2026-09" onChange={setMes} />
<MonthPicker value={de} range={{ end: ate }} onChange={(de, ate) => …} />
<QuarterPicker value="2026-T3" onChange={setTri} />
<YearPicker value="2026" onChange={setAno} />`}
        >
          <MonthPicker value={month} onChange={setMonth} now={NOW} label="Competência" />
          <MonthPicker value={mRange.from} range={{ end: mRange.to }} onChange={(from, to) => setMRange({ from, to })} now={NOW} label="Meses" />
          <QuarterPicker value={quarter} onChange={setQuarter} now={NOW} />
          <YearPicker value={year} onChange={setYear} now={NOW} />
        </Demo>
      </DocSection>

      <DocSection title="Regras">
        <Rules
          items={[
            { do: "Mostre o nome do preset (“Últimos 30 dias”) no gatilho; o intervalo exato aparece ao abrir.", dont: "Mostrar “01/09/2026 – 30/09/2026” quando a pessoa escolheu “Este mês”." },
            { do: "Mostre dias e dias úteis do período no rodapé.", dont: "Comparar meses com quantidades de dias úteis diferentes sem avisar." },
            { do: "Um período por tela; todos os gráficos obedecem a ele.", dont: "Cada card com o seu seletor de período." },
          ]}
        />
      </DocSection>
    </DocPage>
  );
}
