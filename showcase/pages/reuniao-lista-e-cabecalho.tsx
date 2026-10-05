import { useState } from "react";
import { MeetingCard, MeetingHeader, TemplatePicker, meetingTemplates, notify } from "@g4ai/ds";
import { Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";
import { ana, bruno, people } from "./_meeting-data";

export const meta: PageMeta = {
  title: "Reuniões: lista, cabeçalho e modelo",
  group: "IA e interação",
  order: 74,
  description: "MeetingCard lista reuniões gravadas (sem depender de agenda), MeetingHeader abre a página da reunião e TemplatePicker escolhe o modelo das notas.",
};

export default function Page() {
  const [template, setTemplate] = useState("1-1");
  return (
    <DocPage title={meta.title} kicker={meta.group} description={meta.description}>
      <DocSection title="MeetingCard" rule="Estado só quando foge do normal: gravando, gerando notas, trechos sem áudio, falhou. A linha inteira abre a reunião.">
        <Demo code={`<MeetingCard title="Daily de vendas" time="09:30" duration="12 min" source="Google Meet" snippet="Meta da semana em 74 %" attendees={pessoas} onOpen={abrir} />`}>
          <div className="flex min-w-0 max-w-2xl flex-col">
            <MeetingCard title="Revisão do pipeline de vendas — Q4" time="14:00" status="live" source="Google Meet" attendees={people} onOpen={() => {}} />
            <MeetingCard title="Entrevista — SDR pleno" time="11:00" duration="45 min" status="processing" source="Zoom" attendees={[ana]} onOpen={() => {}} />
            <MeetingCard title="Daily de vendas" time="09:30" duration="12 min" source="Google Meet" snippet="Meta da semana em 74 %" attendees={people} onOpen={() => {}} />
            <MeetingCard title="Discovery — Grupo Vila" time="10:00" duration="41 min" status="gaps" source="Microsoft Teams" attendees={[bruno]} onOpen={() => {}} />
            <MeetingCard title="Treinamento do novo CRM" time="seg." status="failed" source="Zoom" snippet="O microfone foi desconectado" onOpen={() => {}} />
          </div>
        </Demo>
        <PropsTable
          rows={[
            ["title / time", "string", "—", "Título e horário já formatado (\"14:00\", \"seg.\")."],
            ["duration", "string", "—", "\"32 min\"."],
            ["status", '"live" | "processing" | "done" | "gaps" | "failed"', '"done"', "Estado da gravação."],
            ["source", "string", "—", "App da call ou \"Nova reunião\" (opcional)."],
            ["snippet", "string", "—", "Primeira linha das notas."],
            ["attendees", "MeetingPerson[]", "—", "Opcional (só aparece em telas largas)."],
            ["action / onOpen", "ReactNode / () => void", "—", "Ação à direita e abrir."],
          ]}
        />
      </DocSection>
      <DocSection title="MeetingHeader e TemplatePicker" rule="Título da reunião com data, duração, participantes e modelo. Perguntar e Exportar como ícones; Compartilhar é o primário.">
        <Demo
          code={`<MeetingHeader
  title="Revisão do pipeline de vendas — Q4"
  date="Hoje, 14:00"
  duration="32 min"
  attendees={pessoas}
  template={<TemplatePicker value={modelo} onChange={setModelo} />}
  onAsk={perguntar}
  onExport={exportar}
  onShare={compartilhar}
/>`}
        >
          <MeetingHeader
            title="Revisão do pipeline de vendas — Q4"
            date="Hoje, 14:00"
            duration="32 min"
            attendees={people}
            template={<TemplatePicker value={template} onChange={setTemplate} />}
            onAsk={() => {}}
            onExport={() => notify("Notas exportadas")}
            onShare={() => notify("Link copiado")}
          />
        </Demo>
        <PropsTable
          rows={[
            ["title / date / duration", "string", "—", "MeetingHeader: já formatados."],
            ["attendees", "MeetingPerson[]", "—", "Pilha de avatares e nomes."],
            ["template / status", "ReactNode", "—", "Chip do modelo e selo de estado."],
            ["onAsk / onExport / onShare", "() => void", "—", "Ações padrão; `actions` substitui."],
          ]}
        />
        <PropsTable
          rows={[
            ["value / onChange", "string / (id) => void", "—", "TemplatePicker: modelo escolhido."],
            ["templates", "MeetingTemplate[]", `meetingTemplates (${meetingTemplates.length})`, "`{ id, name, description?, sections }`."],
          ]}
        />
        <Rules items={[{ do: "Trocar o modelo reorganiza as notas da IA e mantém as da pessoa.", dont: "Puxar a agenda só para listar reuniões: a lista é do que foi gravado." }]} />
      </DocSection>
    </DocPage>
  );
}
