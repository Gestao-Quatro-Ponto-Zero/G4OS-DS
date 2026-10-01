import { useState } from "react";
import { SlotPicker, isBusinessDay, timeSlots, type IsoDate, type Slot } from "@g4os/ds";
import { Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";

export const meta: PageMeta = {
  title: "Agendamento",
  group: "Formulários",
  order: 44,
  description: "SlotPicker: dias com disponibilidade e horários livres, no estilo Calendly — para entrevistas (ATS), reuniões (CRM), visitas técnicas e atendimentos.",
};

// Agenda fictícia determinística: ocupa alguns horários por dia.
function availability(iso: IsoDate, duration: number): Slot[] {
  if (!isBusinessDay(iso)) return [];
  const day = Number(iso.slice(8));
  return timeSlots("09:00", "18:00", duration >= 60 ? 60 : 30)
    .filter((t) => t !== "12:00" && t !== "12:30")
    .map((t, i) => ({ time: t, busy: (i * 7 + day) % 5 === 0 || (day % 6 === 0 && i < 4) }));
}

export default function Page() {
  const [slot, setSlot] = useState<{ date: IsoDate; time: string } | null>(null);
  return (
    <DocPage title={meta.title} kicker="Formulários · Datas" description={meta.description}>
      <DocSection title="SlotPicker" rule="Dias sem horário livre ficam desabilitados. Horário ocupado aparece riscado (não some: a pessoa entende a agenda). No celular os dias viram uma faixa rolável.">
        <Demo
          bare
          code={`<SlotPicker
  availability={(dia, duracao) => agenda.slots(dia, duracao)}   // [{ time: "09:00", busy?: true }]
  value={escolha}
  onChange={setEscolha}                                          // { date, time }
  durations={[30, 45, 60]}
  days={14}
/>`}
        >
          <SlotPicker availability={availability} value={slot} onChange={setSlot} now="2026-09-30" from="2026-10-01" days={21} timeZone="Horário de Brasília (GMT−3)" />
        </Demo>
        <PropsTable
          rows={[
            ["availability", "(iso, duração) => Slot[]", "—", "Slots do dia. busy = ocupado."],
            ["value / onChange", "{ date, time } | null", "—", "Escolha atual."],
            ["durations · duration · onDurationChange", "number[] · number", "[30,45,60]", "Duração da reunião."],
            ["from · days", "IsoDate · number", "hoje · 14", "Janela oferecida."],
            ["timeZone", "string", "fuso do navegador", "Mostrado no topo."],
          ]}
        />
      </DocSection>
      <DocSection title="Regras">
        <Rules
          items={[
            { do: "Mostre o resumo final: “quinta, 02/10/2026, das 14:00 às 14:45”.", dont: "Só destacar o botão do horário." },
            { do: "Fuso sempre visível em agendamento externo (candidato, cliente).", dont: "Assumir que todos estão em Brasília." },
            { do: "Primeiro dia com vaga já selecionado.", dont: "Abrir num dia sem horários." },
          ]}
        />
      </DocSection>
    </DocPage>
  );
}
