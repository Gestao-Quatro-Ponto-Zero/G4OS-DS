import { FileText, MessagesSquare, Share2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  ActionRequiredBanner,
  AvatarGroup,
  DateSeparator,
  ReadingDocument,
  SegmentedControl,
  TeamComposer,
  TeamMessage,
  TypingIndicator,
  cn,
  notify,
} from "@g4ai/ds";
import { AtlasShell, atlasRoutes } from "./shells/atlas-shell";
import { doc, initialMessages, me, others, replies, type TeamMsg } from "./data/collab";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Conversa do time + documento",
  description: "Conversa entre pessoas ao lado de um documento em tipografia de leitura: mensagens com nome e hora, separador de data, “digitando”, faixa de ação obrigatória com envio de arquivo e índice do documento.",
  category: "Aplicação",
  order: 9,
  height: 880,
  concept: {
    goal: "Discutir um documento com o time ao lado do próprio texto, com pendências claras (ex.: documento obrigatório que falta).",
    patterns: [
      "Anatomia G · App de altura total: conversa à esquerda, documento à direita",
      "Mensagens com nome e hora, separador de data e 'digitando'",
      "Faixa de ação obrigatória com envio de arquivo que se resolve sozinha",
      "Documento em tipografia de leitura com índice que acompanha",
    ],
    adapt: [
      "Due diligence, contratos, compliance (LGPD), revisão de propostas",
    ],
    avoid: [
      "Comentários soltos sem vínculo com o documento",
    ],
  },
} as const;

const hhmm = () => new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

export default function CollabDoc() {
  const [msgs, setMsgs] = useState<TeamMsg[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState<string | null>(null);
  const [uploaded, setUploaded] = useState<string | null>(null);
  const [view, setView] = useState<"conversa" | "documento">("conversa");
  const replyIdx = useRef(0);
  const timers = useRef<number[]>([]);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  useEffect(() => {
    // Chaves: scrollIntoView suave retorna Promise em navegadores novos; não pode virar "cleanup".
    end.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs, typing]);

  const someoneAnswers = () => {
    const who = replyIdx.current % 2 === 0 ? others.rafael : others.marina;
    timers.current.push(window.setTimeout(() => setTyping(who.name), 900));
    timers.current.push(
      window.setTimeout(() => {
        setTyping(null);
        setMsgs((m) => [...m, { id: `r${Date.now()}`, author: who, time: hhmm(), text: replies[replyIdx.current++ % replies.length] }]);
      }, 2800),
    );
  };

  const send = (text: string) => {
    setMsgs((m) => [...m, { id: `m${Date.now()}`, author: me, time: hhmm(), text }]);
    setDraft("");
    someoneAnswers();
  };

  const chat = (
    <section aria-label="Conversa do time" className="flex min-h-0 flex-1 flex-col rounded-2xl bg-soft/70 ring-1 ring-inset ring-line">
      <header className="flex items-center gap-2 border-b border-line px-4 py-3">
        <MessagesSquare className="h-4 w-4 text-muted" aria-hidden />
        <h2 className="m-0 min-w-0 flex-1 truncate text-[13.5px] font-medium">Adequação à LGPD</h2>
        <AvatarGroup people={[me, others.rafael, others.marina, others.elisa]} max={4} />
      </header>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-4 sm:px-4" aria-live="polite">
        {msgs.map((m) => (
          <div key={m.id} className="space-y-3">
            {m.day && <DateSeparator>{m.day}</DateSeparator>}
            <TeamMessage author={m.author} time={m.time} mine={m.author.id === me.id}>
              <p>{m.text}</p>
              {m.link && (
                <p>
                  <a href={m.link} target="_blank" rel="noreferrer">
                    {m.link.replace(/^https?:\/\//, "")}
                  </a>
                </p>
              )}
            </TeamMessage>
          </div>
        ))}
        {typing && <TypingIndicator name={typing} />}
        <div ref={end} />
      </div>
      <div className="space-y-3 border-t border-line p-3 sm:p-4">
        <ActionRequiredBanner
          title="Envie o RIPD assinado"
          description="Obrigatório para concluir a revisão jurídica."
          accept=".pdf,.doc,.docx"
          done={uploaded ? `${uploaded} enviado · revisão jurídica liberada` : undefined}
          onFiles={(files) => {
            const name = files[0].name;
            setUploaded(name);
            setMsgs((m) => [...m, { id: `u${Date.now()}`, author: me, time: hhmm(), text: `Enviei o ${name}.` }]);
            notify(`${name} anexado ao documento`, () => setUploaded(null));
            someoneAnswers();
          }}
        />
        <TeamComposer
          value={draft}
          onChange={setDraft}
          onSend={send}
          onAttach={(files, kind) => {
            setMsgs((m) => [...m, { id: `a${Date.now()}`, author: me, time: hhmm(), text: `${kind === "imagem" ? "🖼" : "📎"} ${files.map((f) => f.name).join(", ")}` }]);
            notify(`${files.length} ${kind === "imagem" ? "imagem" : "arquivo"} enviado`);
          }}
        />
      </div>
    </section>
  );

  const docPane = (
    <section aria-label="Documento" className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-surface ring-1 ring-inset ring-line">
      <header className="flex items-center gap-2 border-b border-line px-5 py-3">
        <FileText className="h-4 w-4 text-muted" aria-hidden />
        <span className="min-w-0 flex-1 truncate text-[13px] text-muted">Documentos / Jurídico</span>
        <button type="button" onClick={() => {
            void navigator.clipboard?.writeText(location.href).catch(() => undefined);
            notify("Link do documento copiado");
          }} className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[12.5px] ring-1 ring-line hover:bg-soft">
          <Share2 className="h-3.5 w-3.5" /> Compartilhar
        </button>
      </header>
      <div data-reading-scroll="" className="min-h-0 flex-1 overflow-y-auto px-5 py-8 sm:px-10">
        <ReadingDocument kicker={doc.kicker} title={doc.title}>
          {doc.sections.map((s) => (
            <section key={s.h}>
              <h2>{s.h}</h2>
              {s.body.map((b) => (
                <p key={b}>{b}</p>
              ))}
              {s.list && (
                <ul>
                  {s.list.map((l) => (
                    <li key={l}>{l}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </ReadingDocument>
      </div>
    </section>
  );

  return (
    <AtlasShell current={atlasRoutes.collab}>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-page">
        <div className="shrink-0 border-b border-line px-4 py-2.5 lg:hidden">
          <SegmentedControl
            label="Visualização"
            value={view}
            onChange={setView}
            options={[
              { value: "conversa", label: "Conversa" },
              { value: "documento", label: "Documento" },
            ]}
          />
        </div>
        <div className="grid min-h-0 flex-1 gap-4 p-3 sm:p-5 lg:grid-cols-[minmax(340px,440px)_minmax(0,1fr)]">
          <div className={cn("flex min-h-0", view !== "conversa" && "hidden lg:flex")}>{chat}</div>
          <div className={cn("flex min-h-0", view !== "documento" && "hidden lg:flex")}>{docPane}</div>
        </div>
      </div>
    </AtlasShell>
  );
}
