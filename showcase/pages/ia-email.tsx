import { useState } from "react";
import { CalendarClock, Clock } from "lucide-react";
import { ComposeEmail, PersonChip, RecipientInput, SplitButton, notify, type ComposeStatus, type Person } from "@g4ai/ds";
import { Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";

export const meta: PageMeta = {
  title: "E-mail com IA",
  group: "IA e interação",
  order: 41,
  description: "Compositor de e-mail: remetente, destinatários com busca e sugestões, assunto, corpo, modelo usado no rascunho, estado e envio com agendamento.",
};

// ds-audit-ignore-start hex-color: tintas de avatar nos dados de exemplo
const people: Person[] = [
  { id: "renata", name: "Renata Farias", email: "renata@grupoaurora.com.br", initials: "RF", tint: "#842e20", verified: true },
  { id: "paulo", name: "Paulo Menezes", email: "paulo@grupoaurora.com.br", initials: "PM", tint: "#184560", verified: true },
  { id: "saulo", name: "Saulo Kyoto", email: "saulo@verticelog.com.br", initials: "SK", tint: "#3f3f46" },
  { id: "tania", name: "Tânia Kuroda", email: "tania@hospitalsaolucas.org", initials: "TK", tint: "#8c6a3a", verified: true },
];
const joana: Person = { id: "joana", name: "Joana Ribeiro", email: "joana@acme.com.br", initials: "JR", tint: "#3f3f46", verified: true };
// ds-audit-ignore-end

export default function Page() {
  const [to, setTo] = useState<Person[]>([people[0]]);
  const [to2, setTo2] = useState<Person[]>([people[0], people[1]]);
  const [subject, setSubject] = useState("Proposta revisada: SLA de 99,9 %");
  const [body, setBody] = useState("Olá, Renata e Paulo,\n\nRevisamos a proposta com os pontos que o jurídico pediu…\n\nAbraço,\nJoana");
  const [status, setStatus] = useState<ComposeStatus>("draft");
  return (
    <DocPage title={meta.title} kicker="IA e interação" description={meta.description}>
      <DocSection title="Compositor" rule="O rascunho da IA aparece como RASCUNHO até a pessoa enviar. Enviar é a ação principal; agendar e “enviar com follow-up” ficam no menu ⌄.">
        <Demo
          bare
          code={`<ComposeEmail
  from={eu} to={para} onToChange={setPara} directory={pessoas} suggestions={frequentes}
  subject={assunto} onSubjectChange={setAssunto} body={corpo} onBodyChange={setCorpo}
  model={{ name: "Opus 4.5" }} status="draft"
  onSend={enviar} sendOptions={[{ label: "Agendar para amanhã, 08:00", onSelect: agendar }]}
/>
// Em modal: <ComposeEmailDialog open={aberto} onClose={fechar} … />`}
        >
          <ComposeEmail
            from={joana}
            to={to2}
            onToChange={setTo2}
            directory={people}
            suggestions={people.slice(2)}
            subject={subject}
            onSubjectChange={setSubject}
            body={body}
            onBodyChange={setBody}
            model={{ name: "Opus 4.5" }}
            status={status}
            onSend={() => {
              setStatus("sent");
              notify("E-mail enviado", () => setStatus("draft"));
            }}
            sendOptions={[
              {
                label: "Agendar para amanhã, 08:00",
                icon: <CalendarClock className="h-4 w-4" />,
                onSelect: () => {
                  setStatus("scheduled");
                  notify("Envio agendado", () => setStatus("draft"));
                },
              },
              { label: "Escolher data e hora…", icon: <Clock className="h-4 w-4" />, onSelect: () => notify("Abriria o DateTimePicker", undefined, "info") },
            ]}
            notice="Rascunho do agente Williams · negócio sem resposta há 6 dias"
            className="min-h-[460px]"
          />
        </Demo>
      </DocSection>

      <DocSection title="Destinatários" rule="Chips com nome e selo de verificado. Digitar abre duas seções: e-mails que batem com o texto e sugestões frequentes. Enter escolhe (ou cria o endereço digitado), Backspace no vazio remove o último.">
        <Demo className="block" code={`<RecipientInput value={para} onChange={setPara} directory={pessoas} suggestions={frequentes} />`}>
          <RecipientInput value={to} onChange={setTo} directory={people} suggestions={people.slice(1)} />
        </Demo>
        <Demo code={`<PersonChip person={pessoa} onRemove={remover} />\n<SplitButton onClick={enviar} items={[{ label: "Agendar", onSelect }]}>Enviar</SplitButton>`}>
          <PersonChip person={people[0]} />
          <PersonChip person={people[2]} onRemove={() => notify("Removeria o destinatário", undefined, "info")} />
          <SplitButton onClick={() => notify("Enviado")} items={[{ label: "Agendar para amanhã", onSelect: () => notify("Agendado") }]}>
            Enviar
          </SplitButton>
        </Demo>
        <PropsTable
          rows={[
            ["RecipientInput", "value, onChange, directory, suggestions?, placeholder?, label?", "—", "Chips + autocompletar acessível (combobox/listbox)."],
            ["PersonChip", "person { name, email?, initials?, tint?, verified? }, onRemove?", "—", "Chip de pessoa com avatar de 20px."],
            ["SplitButton", "children, onClick, items: MenuEntry[], disabled?", "—", "Ação principal + menu ⌄ de alternativas."],
            ["ComposeEmail", "from, to, directory, subject, body, model?, status?, onSend, sendOptions?, addOptions?, notice?", "draft", "Compositor completo (página, drawer ou ComposeEmailDialog)."],
          ]}
        />
      </DocSection>

      <DocSection title="Regras">
        <Rules
          items={[
            { do: "Diga de onde veio o rascunho (agente, negócio, reunião) numa faixa acima do corpo.", dont: "Rascunho da IA sem contexto, parecendo escrito pela pessoa." },
            { do: "Estado visível no rodapé: RASCUNHO, AGENDADO, ENVIADO.", dont: "Enviar automaticamente o que a IA escreveu." },
            { do: "Desfazer no toast logo após enviar ou agendar.", dont: "Envio sem volta nem confirmação do que saiu." },
          ]}
        />
      </DocSection>
    </DocPage>
  );
}
