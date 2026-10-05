import { useState } from "react";
import { AiNotes, AiNotesToggle, type NoteSection } from "@g4ai/ds";
import { Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";
import { notes as seed, turns } from "./_meeting-data";

export const meta: PageMeta = {
  title: "Notas aprimoradas",
  group: "IA e interação",
  order: 73,
  description: "AiNotes mostra as notas da reunião com autoria: o que a pessoa escreveu em tinta, o que a IA completou em tom suave com marcador dourado e o momento citado. AiNotesToggle alterna com 'Minhas notas'.",
};

export default function Page() {
  const [view, setView] = useState<"mine" | "enhanced">("enhanced");
  const [notes, setNotes] = useState<NoteSection[]>(seed);
  const toggle = (id: string, done: boolean) => setNotes((ss) => ss.map((s) => ({ ...s, items: s.items.map((i) => (i.id === id && i.task ? { ...i, task: { ...i.task, done } } : i)) })));
  return (
    <DocPage title={meta.title} kicker={meta.group} description={meta.description}>
      <DocSection title="Autoria visível" rule="A IA completa, nunca apaga: as notas da pessoa ficam como ela escreveu, e cada frase da IA aponta para o momento da transcrição.">
        <Demo
          code={`<AiNotesToggle value={versao} onChange={setVersao} />
<AiNotes
  sections={[
    { id: "pipeline", title: "Pipeline do Q4", items: [
      { id: "n1", author: "me", text: "3 travados no jurídico", children: [
        { id: "n2", author: "ai", text: "Todos esbarram na cláusula de multa…", citations: [{ t: 80, turnId: "t3" }] },
      ] },
    ] },
  ]}
  view={versao}
  turns={transcricao}
  onSeek={irPara}
  onToggleTask={marcarTarefa}
/>`}
        >
          <div className="max-w-2xl">
            <AiNotesToggle value={view} onChange={setView} />
            <AiNotes sections={notes} view={view} turns={turns} onSeek={() => {}} onToggleTask={toggle} className="mt-5" />
          </div>
        </Demo>
        <PropsTable
          rows={[
            ["sections", "NoteSection[]", "—", "`{ id, title, author?, items: NoteItem[] }`."],
            ["NoteItem", "{ id, text, author: 'me' | 'ai', citations?, task?, children? }", "—", "Bullet. `task: { done, owner? }` vira caixa de seleção."],
            ["view", '"mine" | "enhanced"', '"enhanced"', "`mine` mostra só o que a pessoa escreveu."],
            ["turns", "TranscriptTurn[]", "—", "Prévia do trecho nas citações."],
            ["onSeek", "(t) => void", "—", "Clique numa citação."],
            ["currentTime", "number", "—", "Marca a citação tocando agora."],
            ["onToggleTask", "(id, done) => void", "—", "Marcar próximo passo."],
            ["labels", "Partial<AiNotesLabels>", "aiNotesLabels", "Textos (também do AiNotesToggle)."],
          ]}
        />
      </DocSection>
      <DocSection title="Regras">
        <Rules
          items={[
            { do: "Texto da pessoa em text-ink; texto da IA em text-ink-soft com marcador dourado e legenda.", dont: "Cor forte ou fundo colorido em toda frase da IA (vira ruído)." },
            { do: "Dados estruturados (seções e bullets).", dont: "HTML gerado pela IA injetado na página." },
          ]}
        />
      </DocSection>
    </DocPage>
  );
}
