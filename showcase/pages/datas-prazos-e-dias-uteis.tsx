import { useState } from "react";
import { Badge, DateBadge, DueDatePicker, RelativeTime, addBusinessDays, brHolidays, businessDaysBetween, describeDue, formatDateLong, formatIsoBr, type IsoDate } from "@g4ai/ds";
import { CodeBlock, Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";

export const meta: PageMeta = {
  title: "Prazos e dias úteis",
  group: "Formulários",
  order: 45,
  description: "DueDatePicker, leitura de prazo relativa, feriados nacionais (inclusive os móveis: Carnaval, Sexta-feira Santa, Corpus Christi) e aritmética de dias úteis.",
};

const NOW = "2026-09-30";

export default function Page() {
  const [due, setDue] = useState<IsoDate | "">("2026-10-07");
  const [due2, setDue2] = useState<IsoDate | "">("2026-09-26");
  const [due3, setDue3] = useState<IsoDate | "">("");
  return (
    <DocPage title={meta.title} kicker="Formulários · Datas" description={meta.description}>
      <DocSection title="DueDatePicker" rule="Atalhos que as pessoas usam de verdade. O gatilho já diz a situação: normal, perto (âmbar) ou vencido (rosa).">
        <Demo code={`<DueDatePicker value={prazo} onChange={setPrazo} />   // "vence em 4 dias úteis"`}>
          <DueDatePicker value={due} onChange={setDue} now={NOW} />
          <DueDatePicker value={due2} onChange={setDue2} now={NOW} />
          <DueDatePicker value={due3} onChange={setDue3} now={NOW} />
        </Demo>
        <PropsTable
          rows={[
            ["value / onChange", 'IsoDate | ""', "—", "Vazio = sem prazo (“Definir prazo”)."],
            ["businessDays", "boolean", "true", "Leitura em dias úteis (“vence em 3 dias úteis”)."],
            ["extraHolidays", "Holiday[]", "[]", "Feriados locais contam como não úteis."],
          ]}
        />
      </DocSection>
      <DocSection title="Leitura relativa e folhinha" rule="Em listas, a leitura relativa decide a prioridade; a data exata fica no title.">
        <Demo className="block space-y-2">
          {["2026-09-30", "2026-10-01", "2026-10-02", "2026-10-09", "2026-09-26"].map((d) => {
            const r = describeDue(d, NOW);
            return (
              <div key={d} className="flex items-center gap-3 rounded-lg border border-line px-3 py-2">
                <DateBadge date={d} tone={r.tone === "bad" ? "bad" : r.tone === "warn" ? "warn" : "neutral"} size="sm" />
                <span className="flex-1 text-[13px] first-letter:uppercase">{formatDateLong(d)}</span>
                <Badge tone={r.tone === "bad" ? "bad" : r.tone === "warn" ? "warn" : "neutral"}>{r.label}</Badge>
              </div>
            );
          })}
          <p className="m-0 pt-2 text-[12.5px] text-muted">
            RelativeTime: atualizado <RelativeTime date={new Date(Date.now() - 5 * 60_000)} className="text-ink" /> · criado <RelativeTime date={new Date(Date.now() - 26 * 3600_000)} className="text-ink" />
          </p>
        </Demo>
      </DocSection>
      <DocSection title="Feriados nacionais 2026" rule="Calculados (Páscoa por algoritmo), não digitados: funcionam para qualquer ano. Carnaval e Corpus Christi são ponto facultativo, mas contam como não úteis por padrão.">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {brHolidays(2026).map((h) => (
            <div key={h.date} className="flex items-center gap-3 rounded-lg border border-line bg-surface px-3 py-2">
              <DateBadge date={h.date} size="sm" tone={h.kind === "nacional" ? "neutral" : "accent"} />
              <div className="min-w-0">
                <div className="truncate text-[13px] font-medium">{h.name}</div>
                <div className="text-[11.5px] text-muted first-letter:uppercase">
                  {formatDateLong(h.date)} · {h.kind}
                </div>
              </div>
            </div>
          ))}
        </div>
      </DocSection>
      <DocSection title="Aritmética de dias úteis">
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            ["5 dias úteis depois de 09/10/2026", formatIsoBr(addBusinessDays("2026-10-09", 5)), "pula o feriado de 12/10"],
            ["Dias úteis em outubro/2026", String(businessDaysBetween("2026-10-01", "2026-10-31")), "22 dias de semana − 12/10"],
            ["10 dias úteis antes de 02/11/2026", formatIsoBr(addBusinessDays("2026-11-02", -10)), "02/11 é Finados"],
          ].map(([q, a, n]) => (
            <div key={q} className="rounded-xl border border-line bg-surface px-4 py-3">
              <div className="text-[12px] text-muted">{q}</div>
              <div className="mt-1 text-[18px] font-semibold tabular-nums">{a}</div>
              <div className="text-[11.5px] text-muted">{n}</div>
            </div>
          ))}
        </div>
        <CodeBlock
          code={`import { addBusinessDays, businessDaysBetween, isBusinessDay, brHolidays, describeDue } from "@g4ai/ds";

addBusinessDays("2026-10-09", 5)                  // "2026-10-19" (pula 12/10)
businessDaysBetween("2026-10-01", "2026-10-31")    // 21
isBusinessDay("2026-11-20")                        // false (Consciência Negra)
describeDue("2026-10-07", "2026-09-30")            // { label: "vence em 5 dias úteis", tone: "neutral" }

// Feriado municipal/da empresa
const sp: Holiday[] = [{ date: "2026-01-25", name: "Aniversário de São Paulo", kind: "nacional" }];
addBusinessDays("2026-01-23", 1, sp)               // "2026-01-26"`}
        />
      </DocSection>
      <DocSection title="Regras">
        <Rules
          items={[
            { do: "Contrato, SLA, prazo legal: diga “dias úteis” e use addBusinessDays.", dont: "Somar 5 dias corridos e chamar de “5 dias”." },
            { do: "Feriados locais via extraHolidays (vêm do cadastro da empresa).", dont: "Lista de feriados fixa no código do produto." },
            { do: "Vencido em rosa com a palavra (“venceu há 2 dias”).", dont: "Só a cor da data." },
          ]}
        />
      </DocSection>
    </DocPage>
  );
}
