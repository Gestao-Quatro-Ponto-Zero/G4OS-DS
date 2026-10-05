import { Captions, Plus, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AiMark,
  AiNotes,
  AiNotesToggle,
  ArtifactCard,
  AudioPlayer,
  Button,
  CallDetectedPrompt,
  ChatComposer,
  FilterChip,
  IconButton,
  LiveRecordingIndicator,
  MeetingCard,
  MeetingHeader,
  MomentCitation,
  Page,
  PageHeading,
  ResizableSplit,
  SegmentedControl,
  TemplatePicker,
  TranscriptView,
  findTurnAt,
  notify,
  type AudioMarker,
  type AudioPlayerHandle,
  type MeetingPerson,
  type MeetingStatus,
  type NoteSection,
  type RecordingState,
  type TranscriptSpeaker,
  type TranscriptTurn,
} from "@g4ai/ds";
import { frameHref, setFrameQuery, useFrameParams } from "./shells/frame-route";
import { OsShell } from "./shells/os-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Notas de reunião com IA",
  description:
    "Reunião como página do G4 OS: aviso de call detectada, gravação com saúde do áudio (Você · Outros), notas escritas pela pessoa e aprimoradas pela IA com citação do momento, transcrição sincronizada com o áudio e perguntas sobre a reunião.",
  category: "Aplicação",
  order: 12,
  height: 900,
  concept: {
    goal: "Deixar a pessoa prestar atenção na conversa: ela anota pouco, o app grava com o áudio sob controle e, ao final, a IA completa as notas com a transcrição, sempre mostrando o que foi a pessoa e o que foi a IA, e de onde veio cada frase.",
    patterns: [
      "Anatomia G · App de altura total: documento à esquerda, transcrição e áudio à direita (ResizableSplit; no celular a transcrição abre por cima)",
      "Notas primeiro: durante a call só o editor e a pílula de gravação; nada de transcrição rolando por padrão",
      "Gravação mostra saúde, não só 'gravando': nível real por faixa e aviso com a ação ('verifique a saída de som')",
      "Autoria visível: texto da pessoa em tinta, texto da IA em tom suave com marcador dourado e citação '12:04' que leva ao momento",
      "Sem agenda: gravar começa pela call detectada, por 'Nova reunião' ou dentro de uma página existente",
    ],
    adapt: [
      "Entrevistas (ATS): modelo 'Entrevista' e notas por critério",
      "Discovery de vendas (CRM): modelo 'Vendas' e próximos passos viram tarefas no negócio",
      "Atendimento e 1:1 de gestão: mesmo fluxo, outro modelo",
    ],
    avoid: [
      "Gravar sozinho ao detectar a call (sempre pergunte)",
      "Misturar texto da IA com o da pessoa sem distinção",
      "Bullet da IA sem citação do momento",
      "Pílula de gravação sem nível de áudio (a pessoa só descobre o silêncio no fim)",
    ],
  },
} as const;

/* ------------------------------------------------------------------ */
/* Dados de exemplo                                                     */
/* ------------------------------------------------------------------ */

const me: TranscriptSpeaker = { name: "Você", initials: "JV", kind: "me" };
const ana: TranscriptSpeaker = { name: "Ana Ribeiro", tint: "#8a5a2b", kind: "other" };
const bruno: TranscriptSpeaker = { name: "Bruno Carvalho", tint: "#2f5d8a", kind: "other" };
const camila: TranscriptSpeaker = { name: "Camila Duarte", tint: "#5b4a8a", kind: "other" };
const attendees: MeetingPerson[] = [{ name: "João Vitor", initials: "JV" }, ana, bruno, camila];

const meeting = { title: "Revisão do pipeline de vendas — Q4", date: "Hoje, 14:00", duration: "32 min", seconds: 1932 };

const turns: TranscriptTurn[] = [
  { id: "t1", speaker: me, start: 12, text: "Bom, a ideia hoje é passar o pipeline do Q4 negócio a negócio e sair com o que precisa destravar." },
  { id: "t2", speaker: ana, start: 31, text: "Fechado. Hoje temos 2,1 milhões em aberto para o trimestre, 38 negócios. O que me preocupa são os três que estão parados no jurídico há mais de duas semanas." },
  { id: "t3", speaker: camila, start: 80, text: "Os três esbarram na mesma minuta, a cláusula de multa por rescisão. Se a gente padronizar a cláusula, destrava os três de uma vez." },
  { id: "t4", speaker: me, start: 125, text: "Quem consegue puxar isso com o jurídico essa semana?" },
  { id: "t5", speaker: camila, start: 132, text: "Eu falo com a Dra. Paula até quinta e trago uma versão padrão." },
  { id: "t6", speaker: bruno, start: 280, text: "Sobre topo de funil: os SDRs estão com 140 contas cada, o ideal seria 90. A gente está deixando lead quente esfriar." },
  { id: "t7", speaker: ana, start: 318, text: "Os dados confirmam: o tempo até o primeiro contato subiu de 4 para 11 horas em setembro." },
  { id: "t8", speaker: me, start: 362, text: "Então a contratação de mais um SDR entra na conta do Q4, não do Q1." },
  { id: "t9", speaker: ana, start: 375, text: "Concordo. Abro a vaga até sexta." },
  { id: "t10", speaker: bruno, start: 570, text: "O Grupo Vila pediu 18% de desconto para fechar em outubro. A gente costuma dar no máximo 12." },
  { id: "t11", speaker: ana, start: 605, text: "Dá para chegar em 15 se eles assinarem por 24 meses em vez de 12." },
  { id: "t12", speaker: me, start: 724, text: "Fechado: 15% com contrato de 24 meses. Bruno, você leva a proposta?" },
  { id: "t13", speaker: bruno, start: 740, text: "Levo. Mando até amanhã à tarde." },
  { id: "t14", speaker: camila, start: 1122, text: "Uma coisa do forecast: a previsão de 1,4 milhão considera os três do jurídico. Sem eles, cai para 1,1." },
  { id: "t15", speaker: ana, start: 1170, text: "Vou mostrar os dois cenários na reunião de diretoria de segunda." },
  { id: "t16", speaker: me, start: 1450, text: "Ana, me manda até domingo o forecast com os dois cenários, que eu reviso antes." },
  { id: "t17", speaker: ana, start: 1465, text: "Mando. E preciso da sua aprovação do desconto do Vila por escrito." },
  { id: "t18", speaker: me, start: 1910, text: "Ótimo. Obrigado, pessoal." },
];

const notes: NoteSection[] = [
  {
    id: "pipeline",
    title: "Pipeline do Q4",
    items: [
      { id: "n1", author: "me", text: "2,1 mi em aberto" },
      { id: "n2", author: "ai", text: "38 negócios no trimestre; três estão parados no jurídico há mais de duas semanas.", citations: [{ t: 31, turnId: "t2" }] },
      {
        id: "n3",
        author: "me",
        text: "3 travados no jurídico",
        children: [{ id: "n3a", author: "ai", text: "Os três esbarram na mesma cláusula de multa por rescisão: padronizar destrava todos de uma vez.", citations: [{ t: 80, turnId: "t3" }] }],
      },
      { id: "n4", author: "ai", text: "O forecast de R$ 1,4 mi conta com esses três; sem eles, cai para R$ 1,1 mi.", citations: [{ t: 1122, turnId: "t14" }] },
    ],
  },
  {
    id: "sdr",
    title: "Time de SDR",
    items: [
      { id: "n5", author: "me", text: "bruno quer +1 sdr" },
      { id: "n6", author: "ai", text: "SDRs com 140 contas cada (ideal: 90); o primeiro contato passou de 4 h para 11 h em setembro.", citations: [{ t: 280, turnId: "t6" }, { t: 318, turnId: "t7" }] },
      { id: "n7", author: "ai", text: "A contratação foi antecipada do Q1 para o Q4.", citations: [{ t: 362, turnId: "t8" }] },
    ],
  },
  {
    id: "decisoes",
    title: "Decisões",
    author: "ai",
    items: [
      { id: "n8", author: "ai", text: "Grupo Vila: 15 % de desconto com contrato de 24 meses (o pedido era 18 %).", citations: [{ t: 724, turnId: "t12" }] },
      { id: "n9", author: "ai", text: "Vaga de SDR aberta ainda no Q4.", citations: [{ t: 375, turnId: "t9" }] },
    ],
  },
  {
    id: "passos",
    title: "Próximos passos",
    author: "ai",
    items: [
      { id: "p1", author: "ai", text: "Padronizar a cláusula de multa com o jurídico", task: { done: false, owner: "Camila · até qui." }, citations: [{ t: 132, turnId: "t5" }] },
      { id: "p2", author: "ai", text: "Enviar a proposta ao Grupo Vila", task: { done: false, owner: "Bruno · amanhã" }, citations: [{ t: 740, turnId: "t13" }] },
      { id: "p3", author: "ai", text: "Abrir a vaga de SDR", task: { done: true, owner: "Ana · até sex." }, citations: [{ t: 375, turnId: "t9" }] },
      { id: "p4", author: "ai", text: "Forecast com os dois cenários para a diretoria", task: { done: false, owner: "Ana · até dom." }, citations: [{ t: 1450, turnId: "t16" }] },
      { id: "p5", author: "ai", text: "Aprovar por escrito o desconto do Vila", task: { done: false, owner: "Você" }, citations: [{ t: 1465, turnId: "t17" }] },
    ],
  },
];

const markers: AudioMarker[] = [
  { t: 362, label: "Decisão: SDR no Q4" },
  { t: 724, label: "Decisão: desconto do Vila" },
];

const myLiveNotes = "2,1 mi em aberto\n3 travados no jurídico\nbruno quer +1 sdr\n";

type Recent = { id: string; title: string; time: string; duration?: string; source?: string; snippet?: string; status?: MeetingStatus; people?: MeetingPerson[] };
const recent: { day: string; items: Recent[] }[] = [
  {
    day: "Hoje",
    items: [
      { id: "r1", title: "Entrevista — SDR pleno (Rafael Moura)", time: "11:00", duration: "45 min", source: "Zoom", status: "processing", people: [{ name: "Rafael Moura", tint: "#3f6b4f" }, ana] },
      { id: "r2", title: "Daily de vendas", time: "09:30", duration: "12 min", source: "Google Meet", snippet: "Meta da semana em 74 %; dois negócios foram para proposta", people: [ana, bruno, camila, { name: "Diego Lima" }, { name: "Paula Sá" }] },
    ],
  },
  {
    day: "Ontem",
    items: [
      { id: "r3", title: "1:1 com Ana Ribeiro", time: "16:00", duration: "28 min", source: "Nova reunião", snippet: "Plano de carreira e metas do Q4", people: [ana] },
      { id: "r4", title: "Discovery — Grupo Vila", time: "10:00", duration: "41 min", source: "Microsoft Teams", status: "gaps", snippet: "Pediram 18 % de desconto para fechar em outubro", people: [bruno, { name: "Marcos Vila" }] },
    ],
  },
  {
    day: "Esta semana",
    items: [
      { id: "r5", title: "Planejamento comercial 2027", time: "seg.", duration: "1 h 5 min", source: "Nova reunião", snippet: "Três cenários de meta e o plano de contratação", people: attendees },
      { id: "r6", title: "Treinamento do novo CRM", time: "seg.", duration: "—", source: "Zoom", status: "failed", snippet: "O microfone foi desconectado no início" },
    ],
  },
];

const suggestions = ["Quais foram as decisões?", "Escreva o follow-up", "O que ficou pendente com a Ana?"];

type Answer = { q: string; intro: string; items: { text: string; t: number; turnId: string }[] };
const answers: Record<string, Omit<Answer, "q">> = {
  "Quais foram as decisões?": {
    intro: "Foram duas decisões:",
    items: [
      { text: "Grupo Vila fecha com 15 % de desconto em contrato de 24 meses.", t: 724, turnId: "t12" },
      { text: "A vaga de mais um SDR abre ainda no Q4.", t: 362, turnId: "t8" },
    ],
  },
  "Escreva o follow-up": {
    intro: "Rascunhei o e-mail de follow-up para Ana, Bruno e Camila com as decisões e os cinco próximos passos. Está em “Follow-up por e-mail (rascunho)”, logo acima.",
    items: [],
  },
  "O que ficou pendente com a Ana?": {
    intro: "Duas coisas com a Ana:",
    items: [
      { text: "Ela manda o forecast com os dois cenários até domingo.", t: 1450, turnId: "t16" },
      { text: "Ela precisa da sua aprovação por escrito do desconto do Vila.", t: 1465, turnId: "t17" },
    ],
  },
};

/** WAV mudo do tamanho da reunião (o showcase não carrega áudio real). No app, use a URL da gravação. */
function useSilentRecording(seconds: number, enabled: boolean) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    if (!enabled) return;
    const rate = 4000;
    const n = rate * seconds;
    const buf = new Uint8Array(44 + n).fill(128);
    const v = new DataView(buf.buffer);
    const w = (o: number, s: string) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
    w(0, "RIFF");
    v.setUint32(4, 36 + n, true);
    w(8, "WAVEfmt ");
    v.setUint32(16, 16, true);
    v.setUint16(20, 1, true);
    v.setUint16(22, 1, true);
    v.setUint32(24, rate, true);
    v.setUint32(28, rate, true);
    v.setUint16(32, 1, true);
    v.setUint16(34, 8, true);
    w(36, "data");
    v.setUint32(40, n, true);
    const u = URL.createObjectURL(new Blob([buf], { type: "audio/wav" }));
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [seconds, enabled]);
  return url;
}

type Phase = "inicio" | "durante" | "depois";

export default function AppMeetingNotes() {
  const params = useFrameParams();
  const phaseParam = params.get("fase");
  const phase: Phase = phaseParam === "durante" || phaseParam === "depois" ? phaseParam : "inicio";
  const setPhase = (p: Phase) => setFrameQuery({ fase: p === "inicio" ? undefined : p, audio: undefined });
  const [template, setTemplate] = useState("geral");

  return (
    <OsShell current={frameHref("app-meeting-notes")} hideTabbar={phase !== "inicio"}>
      <div className="flex h-full min-h-0 flex-col bg-page">
        <div className="flex shrink-0 items-center gap-3 border-b border-line px-4 py-2 sm:px-6">
          <span className="hidden text-[12.5px] text-muted sm:inline">Protótipo</span>
          <SegmentedControl
            label="Momento da reunião"
            value={phase}
            onChange={setPhase}
            options={[
              { value: "inicio", label: "Início" },
              { value: "durante", label: "Durante" },
              { value: "depois", label: "Depois" },
            ]}
          />
          {phase === "durante" && (
            <div className="ml-auto">
              <FilterChip on={params.get("audio") === "alerta"} onClick={() => setFrameQuery({ audio: params.get("audio") === "alerta" ? undefined : "alerta" })}>
                Simular falta de áudio
              </FilterChip>
            </div>
          )}
        </div>
        <div className="flex min-h-0 flex-1 flex-col">
          {phase === "inicio" && <Start onRecord={() => setPhase("durante")} onOpen={() => setPhase("depois")} />}
          {phase === "durante" && <During warning={params.get("audio") === "alerta"} template={template} onTemplate={setTemplate} onDone={() => setPhase("depois")} />}
          {phase === "depois" && <After template={template} onTemplate={setTemplate} />}
        </div>
      </div>
    </OsShell>
  );
}

/* ------------------------------------------------------------------ */
/* Início                                                               */
/* ------------------------------------------------------------------ */

function Start({ onRecord, onOpen }: { onRecord: () => void; onOpen: () => void }) {
  const [callOpen, setCallOpen] = useState(true);
  return (
    <Page width="reading">
      <PageHeading
        title="Reuniões"
        description="Anote o essencial; a IA completa com a transcrição quando a reunião acaba."
        actions={
          <Button onClick={onRecord}>
            <Plus className="h-4 w-4" aria-hidden /> Nova reunião
          </Button>
        }
      />
      <div className="flex flex-col gap-8 pb-16 pt-2">

        {callOpen && (
          <CallDetectedPrompt
            app="Google Meet"
            host="Chrome"
            onRecord={onRecord}
            onDismiss={() => setCallOpen(false)}
            onNever={() => {
              setCallOpen(false);
              notify("Não vamos mais perguntar para o Google Meet");
            }}
          />
        )}

        {recent.map((group) => (
          <section key={group.day} aria-labelledby={`dia-${group.day}`}>
            <h2 id={`dia-${group.day}`} className="m-0 mb-1 px-3 text-[12.5px] font-medium text-muted">
              {group.day}
            </h2>
            <div className="flex flex-col">
              {group.items.map((m) => (
                <MeetingCard
                  key={m.id}
                  title={m.title}
                  time={m.time}
                  duration={m.duration}
                  source={m.source}
                  snippet={m.snippet}
                  status={m.status}
                  attendees={m.people}
                  onOpen={onOpen}
                />
              ))}
            </div>
          </section>
        ))}

        <p className="m-0 border-t border-line pt-4 text-[12.5px] text-muted">
          Para gravar dentro de uma página que já existe, digite <span className="font-medium text-ink-soft">/reunião</span> na página.
        </p>
      </div>
    </Page>
  );
}

/* ------------------------------------------------------------------ */
/* Durante                                                              */
/* ------------------------------------------------------------------ */

const liveStart = 9;

function During({ warning, template, onTemplate, onDone }: { warning: boolean; template: string; onTemplate: (id: string) => void; onDone: () => void }) {
  const [draft, setDraft] = useState(myLiveNotes);
  const [state, setState] = useState<RecordingState>("recording");
  const [shown, setShown] = useState(liveStart);
  const [partial, setPartial] = useState(false);
  const [dock, setDock] = useState<"none" | "transcript" | "health">("none");
  const [levels, setLevels] = useState({ mic: 0.1, system: 0.4 });
  const [startedAt] = useState(() => Date.now() - 9 * 60_000 - 40_000);
  const timers = useRef<number[]>([]);
  const area = useRef<HTMLTextAreaElement>(null);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const effective: RecordingState = state === "recording" && warning ? "warning" : state;
  const running = effective === "recording" || effective === "warning";
  const live = useMemo(() => turns.slice(0, shown).map((t, i) => (i === shown - 1 && partial ? { ...t, partial: true, text: t.text.split(" ").slice(0, 6).join(" ") } : t)), [shown, partial]);
  const speaking = live[live.length - 1]?.speaker.kind;

  // Nível simulado: no app, venha do RMS do microfone e do áudio do sistema.
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      const talk = () => 0.35 + Math.random() * 0.55;
      const idle = () => 0.03 + Math.random() * 0.06;
      setLevels({ mic: speaking === "me" ? talk() : idle(), system: warning ? 0 : speaking === "other" ? talk() : idle() });
    }, 110);
    return () => window.clearInterval(id);
  }, [running, speaking, warning]);

  // Transcrição chegando: um trecho novo a cada poucos segundos (primeiro provisório).
  useEffect(() => {
    if (!running || warning || shown >= 13) return;
    const id = window.setTimeout(() => {
      if (partial) setPartial(false);
      else {
        setShown((n) => n + 1);
        setPartial(true);
      }
    }, partial ? 1600 : 3200);
    return () => window.clearTimeout(id);
  }, [running, warning, shown, partial]);

  useEffect(() => {
    const el = area.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(280, el.scrollHeight)}px`;
  }, [draft]);

  const words = 120 + shown * 4;
  const health = warning ? "Sem áudio dos outros participantes há 45 s — verifique a saída de som" : `ouvindo · ${words} palavras no último minuto`;
  const tracks = [
    { id: "mic" as const, level: levels.mic, ok: true },
    { id: "system" as const, level: levels.system, ok: !warning },
  ];
  const stop = () => {
    setState("processing");
    setDock("none");
    timers.current.push(window.setTimeout(onDone, 1600));
  };
  const last = live[live.length - 1];

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[720px] px-4 pb-48 pt-8 sm:px-8 sm:pt-12">
          <MeetingHeader
            title={meeting.title}
            date={meeting.date}
            attendees={attendees}
            template={<TemplatePicker value={template} onChange={onTemplate} />}
            actions={<span />}
          />
          <label htmlFor="notas-durante" className="sr-only">
            Suas notas
          </label>
          <textarea
            ref={area}
            id="notas-durante"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Escreva o que importa. A IA completa depois com a transcrição."
            className="mt-8 block w-full resize-none border-0 bg-transparent p-0 text-[15px] leading-[1.75] text-ink outline-none placeholder:text-muted"
          />
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center gap-2 px-4 pb-4 sm:pb-6">
        {dock === "transcript" && (
          <section aria-label="Transcrição ao vivo" className="pointer-events-auto flex h-72 w-full max-w-[560px] flex-col rounded-xl border border-line bg-popover shadow-raised">
            <header className="flex shrink-0 items-center gap-2 border-b border-line py-1.5 pl-4 pr-1.5">
              <h2 className="m-0 flex-1 text-[13px] font-medium">Transcrição ao vivo</h2>
              <IconButton size="sm" label="Fechar transcrição" onClick={() => setDock("none")}>
                <X />
              </IconButton>
            </header>
            <TranscriptView turns={live} live className="min-h-0 flex-1 py-2" />
          </section>
        )}
        {dock === "health" && (
          <LiveRecordingIndicator
            variant="panel"
            state={effective}
            startedAt={startedAt}
            tracks={tracks}
            healthText={health}
            onPause={() => setState("paused")}
            onResume={() => setState("recording")}
            onStop={stop}
            className="pointer-events-auto w-full max-w-[400px] shadow-raised"
          />
        )}
        {dock === "none" && last && running && (
          <button
            type="button"
            onClick={() => setDock("transcript")}
            className="pointer-events-auto max-w-[520px] truncate rounded-md px-2 py-0.5 text-[12.5px] text-muted hover:text-ink"
            aria-label="Abrir a transcrição ao vivo"
          >
            <span className="font-medium text-ink-soft">{last.speaker.name}:</span> {last.partial ? `${last.text}…` : last.text}
          </button>
        )}
        <div className="pointer-events-auto flex max-w-full items-center gap-2">
          <LiveRecordingIndicator
            state={effective}
            startedAt={startedAt}
            tracks={tracks}
            healthText={health}
            onOpen={() => setDock((d) => (d === "health" ? "none" : "health"))}
            onPause={() => setState("paused")}
            onResume={() => setState("recording")}
            onStop={stop}
            className="min-w-0"
          />
          <IconButton
            label={dock === "transcript" ? "Fechar transcrição" : "Transcrição ao vivo"}
            aria-pressed={dock === "transcript"}
            onClick={() => setDock((d) => (d === "transcript" ? "none" : "transcript"))}
            className="!h-10 !w-10 !rounded-full border border-line bg-popover shadow-raised"
          >
            <Captions />
          </IconButton>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Depois                                                               */
/* ------------------------------------------------------------------ */

function After({ template, onTemplate }: { template: string; onTemplate: (id: string) => void }) {
  const [view, setView] = useState<"mine" | "enhanced">("enhanced");
  const [sections, setSections] = useState(notes);
  const [time, setTime] = useState(0);
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [thread, setThread] = useState<Answer[]>([]);
  const [followUpSelected, setFollowUpSelected] = useState(false);
  const [rightOpen, setRightOpen] = useState(() => (typeof window === "undefined" ? true : window.innerWidth >= 768));
  const player = useRef<AudioPlayerHandle>(null);
  const composer = useRef<HTMLDivElement>(null);
  const src = useSilentRecording(meeting.seconds, true);
  const byId = useMemo(() => new Map(turns.map((t) => [t.id, t])), []);
  const playing = findTurnAt(turns, time)?.id;

  const seek = (t: number) => {
    setTime(t);
    player.current?.seekTo(t);
    setRightOpen(true);
  };
  const ask = (q: string) => {
    const a = answers[q] ?? { intro: "Pela transcrição, o ponto mais discutido foi o forecast: R$ 1,4 mi com os três negócios do jurídico, R$ 1,1 mi sem eles.", items: [{ text: "Camila trouxe os dois números.", t: 1122, turnId: "t14" }] };
    setThread((th) => [...th, { q, ...a }]);
    if (q === "Escreva o follow-up") setFollowUpSelected(true);
    setDraft("");
  };
  const toggleTask = (id: string, done: boolean) =>
    setSections((ss) => ss.map((s) => ({ ...s, items: s.items.map((i) => (i.id === id && i.task ? { ...i, task: { ...i.task, done } } : i)) })));

  const left = (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[720px] px-4 pb-8 pt-8 sm:px-8 sm:pt-10">
          <MeetingHeader
            title={meeting.title}
            date={meeting.date}
            duration={meeting.duration}
            attendees={attendees}
            template={<TemplatePicker value={template} onChange={onTemplate} />}
            onAsk={() => composer.current?.querySelector("textarea")?.focus()}
            onExport={() => notify("Notas exportadas em Markdown")}
            onShare={() => notify("Link das notas copiado")}
          />
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <AiNotesToggle value={view} onChange={setView} />
            {!rightOpen && (
              <Button size="sm" variant="ghost" className="ml-auto" aria-label="Abrir a transcrição" onClick={() => setRightOpen(true)}>
                <Captions className="h-3.5 w-3.5" aria-hidden /> <span className="hidden sm:inline">Transcrição</span>
              </Button>
            )}
          </div>
          <AiNotes sections={sections} view={view} turns={turns} onSeek={seek} currentTime={time > 0 ? time : undefined} onToggleTask={toggleTask} className="mt-6" />

          <section aria-labelledby="gerados" className="mt-10">
            <h2 id="gerados" className="m-0 mb-2 text-[12.5px] font-medium text-muted">
              Gerado a partir desta reunião
            </h2>
            <div className="grid gap-2 sm:grid-cols-2">
              <ArtifactCard kind="email" title="Follow-up por e-mail (rascunho)" meta="Para Ana, Bruno e Camila · 5 próximos passos" selected={followUpSelected} onOpen={() => setFollowUpSelected(true)} />
              <ArtifactCard kind="doc" title="Resumo para o #vendas" meta="4 linhas · pronto para colar" onOpen={() => notify("Resumo copiado")} />
            </div>
          </section>

          {thread.length > 0 && (
            <section aria-label="Perguntas sobre a reunião" className="mt-10 space-y-6 border-t border-line pt-6">
              {thread.map((a, i) => (
                <div key={i} className="space-y-3">
                  <p className="m-0 ml-auto w-fit max-w-[85%] rounded-2xl bg-soft px-3.5 py-2 text-[14px] text-ink">{a.q}</p>
                  <div className="flex gap-3">
                    <AiMark size={24} />
                    <div className="min-w-0 flex-1 text-[14px] leading-relaxed text-ink-soft">
                      <p className="m-0">{a.intro}</p>
                      {a.items.length > 0 && (
                        <ul className="m-0 mt-1.5 list-disc space-y-1 pl-5 marker:text-line-strong">
                          {a.items.map((it) => (
                            <li key={it.turnId}>
                              {it.text}
                              <MomentCitation t={it.t} turn={byId.get(it.turnId)} onSeek={seek} active={playing === it.turnId && time > 0} className="ml-1.5" />
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </section>
          )}
        </div>
      </div>
      <div ref={composer} className="shrink-0 border-t border-line bg-page">
        <div className="mx-auto w-full max-w-[720px] px-4 pb-3 pt-3 sm:px-8">
          <div className="mb-2 flex gap-1.5 overflow-x-auto pb-0.5">
            {suggestions.map((s) => (
              <button key={s} type="button" onClick={() => ask(s)} className="inline-flex h-7 shrink-0 items-center rounded-full px-3 text-[12.5px] text-ink-soft ring-1 ring-line hover:bg-soft hover:text-ink">
                {s}
              </button>
            ))}
          </div>
          <ChatComposer value={draft} onChange={setDraft} onSubmit={ask} placeholder="Pergunte sobre esta reunião" hint={null} />
        </div>
      </div>
    </div>
  );

  const right = (
    <aside aria-label="Transcrição e áudio" className="flex min-h-0 flex-1 flex-col bg-surface md:bg-page">
      <header className="flex shrink-0 items-center gap-2 py-2 pl-4 pr-2 sm:pl-5">
        <h2 className="m-0 flex-1 text-[13.5px] font-medium">Transcrição</h2>
        <IconButton label="Fechar transcrição" onClick={() => setRightOpen(false)}>
          <X />
        </IconButton>
      </header>
      <div className="shrink-0 px-4 pb-3 sm:px-5">
        <AudioPlayer ref={player} src={src} title="Gravação da reunião" duration={meeting.seconds} currentTime={time} onTimeUpdate={setTime} markers={markers} />
      </div>
      <TranscriptView
        turns={turns}
        currentTime={time > 0 ? time : undefined}
        onSeek={seek}
        query={query}
        onQueryChange={setQuery}
        className="min-h-0 flex-1 px-2 pb-3 sm:px-3 [&>div:first-child]:px-2"
      />
    </aside>
  );

  return <ResizableSplit left={left} right={right} rightOpen={rightOpen} defaultSize={0.62} min={0.45} max={0.75} label="Redimensionar notas e transcrição" />;
}

