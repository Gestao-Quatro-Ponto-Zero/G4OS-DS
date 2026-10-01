import { useState } from "react";
import { DateTimePicker, TimePicker, describeTimeZone, parseTimeInput } from "@g4ai/ds";
import { Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";

export const meta: PageMeta = {
  title: "Horário",
  group: "Formulários",
  order: 43,
  description: "TimePicker digitável em 24h com lista de sugestões e DateTimePicker com fuso explícito.",
};

export default function Page() {
  const [t, setT] = useState("09:30");
  const [t2, setT2] = useState("");
  const [dt, setDt] = useState("2026-10-02T14:00");
  return (
    <DocPage title={meta.title} kicker="Formulários · Datas" description={meta.description}>
      <DocSection
        title="TimePicker"
        rule={
          <>
            Aceita <code>9</code>, <code>930</code>, <code>9h30</code>, <code>14:30</code>, <code>21h</code>. A lista sugere horários a cada <code>step</code> minutos; fora do horário comercial fica mais claro.
          </>
        }
      >
        <Demo
          className="flex flex-wrap items-start gap-6"
          code={`<TimePicker label="Início" value={hora} onChange={setHora} step={30} />
<TimePicker label="Check-in" value={hora} onChange={setHora} step={15} min="06:00" max="22:00" showTimeZone />`}
        >
          <TimePicker label="Início" value={t} onChange={setT} step={30} />
          <TimePicker label="Check-in" value={t2} onChange={setT2} step={15} min="06:00" max="22:00" showTimeZone hint={undefined} />
          <div className="text-[12.5px] text-muted">
            <div>parseTimeInput("9h30") → {parseTimeInput("9h30")}</div>
            <div>parseTimeInput("1430") → {parseTimeInput("1430")}</div>
            <div>Fuso do navegador: {describeTimeZone()}</div>
          </div>
        </Demo>
        <PropsTable
          rows={[
            ["value / onChange", '"HH:MM"', "—", "24h."],
            ["step", "5 | 10 | 15 | 30 | 60", "30", "Intervalo das sugestões."],
            ["min · max", '"HH:MM"', '"00:00" · "24:00"', "Faixa aceita."],
            ["businessHours", "[inicio, fim]", '["08:00","18:00"]', "Destaque visual na lista."],
            ["showTimeZone", "boolean", "false", "Mostra o fuso abaixo do campo."],
          ]}
        />
      </DocSection>
      <DocSection title="DateTimePicker" rule="Compromissos com dia e hora. O fuso aparece sempre: quem marca e quem recebe podem estar em cidades diferentes.">
        <Demo className="block" code={`<DateTimePicker label="Reunião de kickoff" value="2026-10-02T14:00" onChange={setValor} step={15} />`}>
          <div className="max-w-md">
            <DateTimePicker label="Reunião de kickoff" value={dt} onChange={setDt} step={15} now="2026-09-30" />
          </div>
          <code className="font-mono text-[12px] text-muted">{dt}</code>
        </Demo>
      </DocSection>
      <DocSection title="Regras">
        <Rules
          items={[
            { do: "24h, sempre com dois dígitos: 09:30.", dont: "“9:30 AM”." },
            { do: "Deixe digitar; a lista é atalho.", dont: "Dois selects de hora e minuto." },
            { do: "Guarde data+hora local e o fuso separado quando importar.", dont: "Guardar “14:00” sem saber de qual cidade." },
          ]}
        />
      </DocSection>
    </DocPage>
  );
}
