import { useState } from "react";
import { ActionRequiredBanner, DateSeparator, ReadingDocument, TeamComposer, TeamMessage, TypingIndicator } from "@g4ai/ds";
import { Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";

export const meta: PageMeta = {
  title: "Conversa do time e documento",
  group: "Mídia e conteúdo",
  order: 40,
  description: "Mensagens entre pessoas (com nome e hora), separador de data, “digitando”, faixa de ação obrigatória com envio de arquivo, campo de mensagem e documento em tipografia de leitura.",
};

const ana = { name: "Ana Lopes", initials: "AL", tint: "#3f3f46" }; // ds-audit-ignore hex-color: tinta de avatar
const rafa = { name: "Rafael Queiroz", initials: "RQ", tint: "#031a26" }; // ds-audit-ignore hex-color: tinta de avatar

export default function Page() {
  const [draft, setDraft] = useState("");
  const [done, setDone] = useState<string>();
  return (
    <DocPage title={meta.title} kicker="Mídia e conteúdo" description={meta.description}>
      <DocSection title="Conversa" rule="Minhas mensagens à direita, dos outros à esquerda; sempre nome e hora. Ação obrigatória fica fixa acima do campo, não perdida no meio da conversa.">
        <Demo
          bare
          code={`<DateSeparator>12 mar</DateSeparator>
<TeamMessage author={rafael} time="11:04">Vou revisar a seção de segurança.</TeamMessage>
<TeamMessage author={eu} time="11:05" mine>Combinado.</TeamMessage>
<TypingIndicator name="Rafael" />
<ActionRequiredBanner title="Envie o RIPD assinado" onFiles={(f) => enviar(f)} done={enviado} />
<TeamComposer value={texto} onChange={setTexto} onSend={enviar} onAttach={anexar} />`}
        >
          <div className="max-w-[460px] space-y-3 rounded-2xl bg-soft/70 p-4 ring-1 ring-inset ring-line">
            <DateSeparator>12 mar</DateSeparator>
            <TeamMessage author={rafa} time="11:04">
              <p>Vou revisar a seção de segurança e atualizar o processo de incidentes.</p>
            </TeamMessage>
            <TeamMessage author={ana} time="11:05" mine>
              <p>Combinado. Coloquei as referências da ANPD no documento.</p>
            </TeamMessage>
            <TypingIndicator name="Rafael" />
            <ActionRequiredBanner title="Envie o RIPD assinado" onFiles={(f) => setDone(`${f[0].name} enviado`)} done={done} />
            <TeamComposer value={draft} onChange={setDraft} onSend={() => setDraft("")} onAttach={() => undefined} />
          </div>
        </Demo>
      </DocSection>
      <DocSection title="ReadingDocument" rule="Serifa editorial (--ds-font-reading), medida de ~68 caracteres e índice automático dos h2. Para políticas, relatórios e documentos longos.">
        <Demo bare code={`<ReadingDocument kicker="Política interna" title="Adequação à LGPD">\n  <h2>O que é a LGPD</h2><p>…</p>\n</ReadingDocument>`}>
          <div className="rounded-2xl border border-line bg-surface px-6 py-8">
            <ReadingDocument kicker="Política interna · v0.3" title="Adequação à LGPD" toc={false}>
              <h2>O que é a LGPD</h2>
              <p>A Lei Geral de Proteção de Dados estabelece regras para coleta, uso e compartilhamento de dados pessoais no Brasil.</p>
              <h2>Escopo</h2>
              <ul>
                <li>Clientes e contatos do CRM</li>
                <li>Candidatos em processos seletivos</li>
              </ul>
            </ReadingDocument>
          </div>
        </Demo>
        <PropsTable
          rows={[
            ["TeamMessage", "author, time, mine", "—", "author = { name, initials, tint }"],
            ["ActionRequiredBanner", "title, description, onFiles, accept, done", "—", "Botão tracejado aceita arrastar e soltar"],
            ["TeamComposer", "value, onChange, onSend, onAttach", "—", "Enter envia, Shift+Enter quebra linha"],
            ["ReadingDocument", "title, kicker, toc", "toc = true", "Índice com destaque da seção lida"],
          ]}
        />
      </DocSection>
      <DocSection title="Regras">
        <Rules
          items={[
            { do: "Conversa entre pessoas com nome e hora sempre visíveis.", dont: "Misturar mensagens da IA com as do time sem distinção." },
            { do: "Documentos longos na fonte de leitura, com índice.", dont: "Texto corrido de 1.000 palavras na fonte de interface em largura total." },
          ]}
        />
      </DocSection>
    </DocPage>
  );
}
