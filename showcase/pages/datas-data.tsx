import { useState } from "react";
import { Calendar, DateInput, DatePicker, MultiDatePicker, WeekPicker, addDays, formatDateLong, type IsoDate } from "@g4ai/ds";
import { Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";

export const meta: PageMeta = {
  title: "Data",
  group: "Formulários",
  order: 41,
  description: "DateInput (digitável, com atalhos em português), DatePicker (botão), Calendar (grade base), MultiDatePicker e WeekPicker.",
};

const NOW = "2026-09-30";

export default function Page() {
  const [birth, setBirth] = useState<IsoDate | "">("1991-04-12");
  const [start, setStart] = useState<IsoDate | "">("");
  const [delivery, setDelivery] = useState<IsoDate | "">("2026-10-09");
  const [btn, setBtn] = useState("2026-10-15");
  const [cal, setCal] = useState<IsoDate>("2026-10-02");
  const [multi, setMulti] = useState<IsoDate[]>(["2026-10-13", "2026-10-20", "2026-10-27"]);
  const [week, setWeek] = useState<IsoDate>("2026-09-28");
  return (
    <DocPage title={meta.title} kicker="Formulários · Datas" description={meta.description}>
      <DocSection
        title="DateInput"
        rule={
          <>
            Digite <code>30/09/2026</code>, <code>3009</code>, <code>hoje</code>, <code>amanhã</code>, <code>sexta</code>, <code>próxima segunda</code>, <code>em 5 dias úteis</code>, <code>+3d</code>, <code>-2s</code>, <code>fim do mês</code> ou <code>15 out</code>. O campo confirma o dia da semana abaixo.
          </>
        }
      >
        <Demo
          className="grid gap-x-6 sm:grid-cols-3"
          code={`const [date, setDate] = useState<IsoDate | "">("");

<DateInput label="Data de início" value={date} onChange={setDate} min={todayIso()} />
<DateInput label="Entrega" value={date} onChange={setDate} businessDaysOnly />`}
        >
          <DateInput label="Data de nascimento" value={birth} onChange={setBirth} max={NOW} now={NOW} />
          <DateInput label="Início do contrato" value={start} onChange={setStart} min={NOW} now={NOW} hint="A partir de hoje. Tente “próxima segunda”." />
          <DateInput label="Entrega (só dias úteis)" value={delivery} onChange={setDelivery} businessDaysOnly min={NOW} now={NOW} />
        </Demo>
        <PropsTable
          rows={[
            ["value / onChange", 'IsoDate | ""', "—", "ISO só-data. Vazio = sem data."],
            ["min / max", "IsoDate", "—", "Limites; fora deles vira erro explicado."],
            ["businessDaysOnly", "boolean", "false", "Bloqueia fim de semana e feriados (nacionais + extraHolidays)."],
            ["extraHolidays", "Holiday[]", "[]", "Feriados estaduais/municipais/da empresa."],
            ["clearable", "boolean", "true", "Botão × quando há valor."],
            ["now", "IsoDate", "hoje", "Referência para “amanhã”, “sexta”… (útil em testes)."],
            ["label · hint · error · optional", "—", "—", "Mesma anatomia dos outros campos."],
          ]}
        />
      </DocSection>

      <DocSection title="DatePicker" rule="Botão que abre o calendário, sem digitação. Bom em filtros e células de tabela. Mesmo componente da v0.1, agora no calendário próprio.">
        <Demo code={`<DatePicker label="Vencimento" value={iso} onValueChange={setIso} businessDaysOnly />`}>
          <div className="w-56">
            <DatePicker label="Vencimento" value={btn} onValueChange={setBtn} />
          </div>
          <span className="text-[12.5px] text-muted first-letter:uppercase">{formatDateLong(btn)}</span>
        </Demo>
      </DocSection>

      <DocSection
        title="Calendar"
        rule="A grade base de todos os seletores. Setas movem o foco, PageUp/PageDown trocam o mês (Shift = ano), Home/End vão ao início/fim da semana. Clique no título para pular mês/ano. Pontos âmbar = feriado; traço dourado = hoje."
      >
        <Demo
          className="flex flex-wrap items-start gap-6"
          code={`<Calendar selected={iso} onDayClick={setIso} weekNumbers
  events={[{ date: "2026-10-02", tone: "accent" }, { date: "2026-10-06", tone: "bad" }]} />
<Calendar mode="range" months={2} range={{ from, to }} onDayClick={…} />`}
        >
          <div className="rounded-xl border border-line">
            <Calendar
              selected={cal}
              onDayClick={setCal}
              now={NOW}
              month="2026-10-01"
              weekNumbers
              events={[
                { date: "2026-10-02", tone: "accent" },
                { date: "2026-10-06", tone: "bad" },
                { date: "2026-10-06", tone: "info" },
                { date: "2026-10-21", tone: "ok" },
              ]}
            />
          </div>
          <div className="rounded-xl border border-line">
            <Calendar mode="range" range={{ from: "2026-10-05", to: addDays("2026-10-05", 11) }} now={NOW} month="2026-10-01" businessDaysOnly label="Somente dias úteis" />
          </div>
        </Demo>
        <PropsTable
          rows={[
            ["mode", '"single" | "range" | "multiple"', '"single"', "Como os dias selecionados são desenhados."],
            ["selected · range · values", "IsoDate · {from,to} · IsoDate[]", "—", "Valor por modo."],
            ["onDayClick", "(iso) => void", "—", "O seletor decide o que fazer (o Calendar é controlado)."],
            ["months", "1 | 2", "1", "Dois meses lado a lado (empilha no celular)."],
            ["month / onMonthChange", "IsoDate", "—", "Mês visível, controlado ou não."],
            ["min · max · isDisabled · businessDaysOnly", "—", "—", "Dias indisponíveis (riscados, sem foco)."],
            ["showHolidays · extraHolidays", "boolean · Holiday[]", "true · []", "Feriados marcados com ponto e nome no title."],
            ["weekNumbers", "boolean", "false", "Coluna com a semana ISO."],
            ["events", "{ date, tone }[]", "—", "Até 3 pontos por dia."],
            ["compare", "{ from, to }", "—", "Período de comparação tracejado."],
          ]}
        />
      </DocSection>

      <DocSection title="MultiDatePicker" rule="Dias soltos. Chips com dia da semana; limite opcional.">
        <Demo code={`<MultiDatePicker label="Datas das turmas" values={dias} onChange={setDias} max={6} businessDaysOnly />`} className="block">
          <MultiDatePicker label="Datas das turmas" values={multi} onChange={setMulti} max={6} businessDaysOnly min={NOW} now={NOW} className="mb-0" />
        </Demo>
      </DocSection>

      <DocSection title="WeekPicker" rule="Semana inteira (segunda a domingo), com número ISO. Valor é a segunda-feira.">
        <Demo code={`<WeekPicker value={segunda} onChange={setSegunda} />`}>
          <WeekPicker value={week} onChange={setWeek} now={NOW} />
        </Demo>
      </DocSection>

      <DocSection title="Regras">
        <Rules
          items={[
            { do: "DateInput em formulários; DatePicker quando o espaço é um botão (filtro, tabela).", dont: "Calendário aberto fixo ocupando o formulário." },
            { do: "Explique o erro: “A data mínima é 30/09/2026.”", dont: "Só borda vermelha." },
            { do: "Use `now` fixo em testes e prints: “amanhã” não muda de dia.", dont: "Depender do relógio do computador em snapshot." },
          ]}
        />
      </DocSection>
    </DocPage>
  );
}
