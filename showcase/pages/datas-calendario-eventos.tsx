import { useState } from "react";
import { MiniAgenda, MonthCalendar, notify, type AgendaEvent } from "@g4os/ds";
import { Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";

export const meta: PageMeta = {
  title: "Calendário de eventos",
  group: "Formulários",
  order: 46,
  description: "MonthCalendar (mês com eventos, “+N mais”, feriados) e MiniAgenda (lista por dia) — agenda comercial, entrevistas, entregas, vencimentos.",
};

const NOW = "2026-09-30";
const events: AgendaEvent[] = [
  { id: "1", date: "2026-09-30", time: "10:00", title: "Kickoff Grupo Aurora", tone: "accent", meta: "Sala 3 · 45 min" },
  { id: "2", date: "2026-09-30", time: "14:30", title: "Entrevista · Marina Costa", tone: "info", meta: "Google Meet" },
  { id: "3", date: "2026-09-30", time: "16:00", title: "Revisão de proposta", tone: "neutral" },
  { id: "4", date: "2026-09-30", time: "17:30", title: "1:1 com Bruno", tone: "neutral" },
  { id: "5", date: "2026-10-01", time: "09:00", title: "Vencimento NF 4821", tone: "bad", meta: "R$ 38.400" },
  { id: "6", date: "2026-10-02", time: "11:00", title: "Demo Vértice Log", tone: "accent" },
  { id: "7", date: "2026-10-06", title: "Fechamento do mês", tone: "warn" },
  { id: "8", date: "2026-10-08", time: "15:00", title: "Entrevista técnica · Rafael", tone: "info" },
  { id: "9", date: "2026-10-13", time: "10:00", title: "QBR Farmácias Sol", tone: "accent" },
  { id: "10", date: "2026-10-15", title: "Pagamento de fornecedores", tone: "bad" },
  { id: "11", date: "2026-10-20", time: "09:30", title: "Treinamento filial Sul", tone: "ok" },
  { id: "12", date: "2026-10-27", time: "14:00", title: "Comitê de crédito", tone: "neutral" },
  { id: "13", date: "2026-10-30", title: "Entrega do relatório trimestral", tone: "warn" },
];

export default function Page() {
  const [month, setMonth] = useState("2026-10-01");
  return (
    <DocPage title={meta.title} kicker="Formulários · Datas" description={meta.description}>
      <DocSection title="MonthCalendar" rule="Até 2 eventos por dia + “+N mais”. Feriados escritos no dia. Fim de semana levemente mais escuro. No celular vira MiniAgenda do mês.">
        <Demo
          bare
          code={`<MonthCalendar
  events={[{ id, date: "2026-10-02", time: "11:00", title: "Demo Vértice Log", tone: "accent" }, …]}
  onEventClick={(e) => abrir(e.id)}
  onDayClick={(dia) => criarEvento(dia)}
/>`}
        >
          <MonthCalendar events={events} month={month} onMonthChange={setMonth} now={NOW} onEventClick={(e) => notify(`Abrir: ${e.title}`, undefined, "info")} onDayClick={(d) => notify(`Novo evento em ${d}`, undefined, "info")} />
        </Demo>
        <PropsTable
          rows={[
            ["events", "AgendaEvent[]", "—", "{ id, date, title, time?, end?, tone?, meta? }."],
            ["month / onMonthChange", "IsoDate", "—", "Mês visível."],
            ["maxPerDay", "number", "2", "Acima disso, “+N mais” abre a lista do dia."],
            ["onEventClick · onDayClick", "fn", "—", "Abrir evento · criar no dia."],
            ["showHolidays", "boolean", "true", "Nome do feriado no dia."],
          ]}
        />
      </DocSection>
      <DocSection title="MiniAgenda" rule="Próximos compromissos em lista, agrupados por dia (painel lateral, home, celular).">
        <Demo className="block max-w-md" code={`<MiniAgenda events={proximos} limit={6} onEventClick={abrir} />`}>
          <MiniAgenda events={events} limit={7} now={NOW} onEventClick={(e) => notify(`Abrir: ${e.title}`, undefined, "info")} />
        </Demo>
      </DocSection>
      <DocSection title="Regras">
        <Rules
          items={[
            { do: "Cor do evento = tipo (reunião, entrevista, vencimento), com legenda na tela.", dont: "Cor aleatória por evento." },
            { do: "Horário antes do título; título curto.", dont: "Descrição longa dentro do chip." },
          ]}
        />
      </DocSection>
    </DocPage>
  );
}
