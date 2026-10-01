import { Archive, Download, FolderInput, Pencil, Star, Trash2 } from "lucide-react";
import { Fragment, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  AnswerCard,
  Disclaimer,
  InputModal,
  MessageActions,
  ResizableSplit,
  SessionComposer,
  SessionHeader,
  SessionInfoPanel,
  SessionSidebar,
  StepGroup,
  ThreadMinimap,
  UserBubble,
  VoiceModeButton,
  VoiceOverlay,
  WorkspaceSwitcher,
  cn,
  notify,
  type MenuEntry,
  type MinimapItem,
  type SlashCommand,
} from "@g4os/ds";
import { agents, cannedReply, markdown, osUser, osWorkspace, plain, sessions as seed, tagSuggestions, tools, type OsSession, type Rich, type ThreadEntry } from "./data/os-sessions";
import { useFrameParam } from "./shells/frame-route";
import { OsShell, osRoutes } from "./shells/os-shell";

export const meta = {
  title: "Sessões do G4 OS (app agêntico)",
  description: "App desktop de sessões com agente: lista com status ao vivo, conversa com passos recolhíveis, respostas copiáveis e ramificáveis, ferramentas conectadas, painel de informações e modo voz.",
  category: "IA",
  height: 860,
  order: 1,
} as const;

/* ------------------------------------------------------------------ */
/* Texto rico das respostas                                           */
/* ------------------------------------------------------------------ */

function RichText({ body }: { body: Rich }) {
  return (
    <>
      {body.map((p, i) => (
        <p key={i}>
          {p.map((s, j) =>
            s.code ? (
              <code key={j}>{s.t}</code>
            ) : s.href ? (
              <a
                key={j}
                href={s.href}
                onClick={(e) => {
                  e.preventDefault();
                  notify(`Exemplo: abriria ${s.t}`, undefined, "info");
                }}
              >
                {s.t}
              </a>
            ) : s.b ? (
              <strong key={j}>{s.t}</strong>
            ) : (
              <Fragment key={j}>{s.t}</Fragment>
            ),
          )}
        </p>
      ))}
    </>
  );
}

const commands: SlashCommand[] = [
  { id: "resumo", label: "resumo", description: "Resumir esta sessão" },
  { id: "slack", label: "slack", description: "Enviar algo num canal" },
  { id: "tarefa", label: "tarefa", description: "Criar tarefa no Linear" },
];

const useMedia = (q: string) => {
  const [m, setM] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(q);
    const on = () => setM(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [q]);
  return m;
};

let seq = 0;
const uid = (p: string) => `${p}-${Date.now().toString(36)}-${++seq}`;

/* ------------------------------------------------------------------ */

export default function AiSessions() {
  const initialId = useFrameParam("id", "mcp-notion");
  const [list, setList] = useState<OsSession[]>(seed);
  const [activeId, setActiveId] = useState(initialId);
  const [mobileView, setMobileView] = useState<"list" | "thread">(useFrameParam("id") ? "thread" : "list");
  // No celular o painel abre por cima de tudo: começa fechado e só abre pelo botão ⓘ.
  const [infoOpen, setInfoOpen] = useState(() => typeof window === "undefined" || !window.matchMedia("(max-width: 767.98px)").matches);
  const [draft, setDraft] = useState("");
  const [agent, setAgent] = useState("os");
  const [recording, setRecording] = useState(false);
  const [voice, setVoice] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [streaming, setStreaming] = useState<{ sessionId: string; entryId: string; shown: number; full: string } | null>(null);
  const timers = useRef<number[]>([]);
  const scroller = useRef<HTMLDivElement>(null);
  const mobile = useMedia("(max-width: 767.98px)");
  const active = list.find((s) => s.id === activeId) ?? list[0];

  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  useEffect(() => {
    if (initialId) setActiveId(initialId);
  }, [initialId]);

  const patch = useCallback((id: string, p: Partial<OsSession> | ((s: OsSession) => Partial<OsSession>)) => {
    setList((l) => l.map((s) => (s.id === id ? { ...s, ...(typeof p === "function" ? p(s) : p) } : s)));
  }, []);

  const select = (id: string) => {
    setActiveId(id);
    setMobileView("thread");
    if (window.matchMedia("(max-width: 767.98px)").matches) setInfoOpen(false);
    // Abrir uma sessão com resposta pronta = lida.
    patch(id, (s) => (s.status === "ready" ? { status: "idle" } : {}));
  };

  // Rolar para o fim ao trocar de sessão ou chegar mensagem nova.
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTo({ top: el.scrollHeight });
  }, [activeId, active?.thread.length, streaming?.shown]);

  const newSession = () => {
    const s: OsSession = { id: uid("s"), title: "Nova sessão", time: "agora", status: "idle", day: "Hoje", mode: "executar", createdBy: osUser.name, notes: "", files: [], thread: [] };
    setList((l) => [s, ...l]);
    select(s.id);
    notify("Sessão criada");
  };

  const branch = (fromEntry: string) => {
    const idx = active.thread.findIndex((e) => e.id === fromEntry);
    const s: OsSession = {
      ...active,
      id: uid("b"),
      title: `Ramo: ${active.title}`,
      parentId: active.id,
      time: "agora",
      status: "idle",
      starred: false,
      archived: false,
      createdBy: `Ramificada de “${active.title}”`,
      thread: active.thread.slice(0, idx + 1),
    };
    const parent = active.id;
    setList((l) => {
      const at = l.findIndex((x) => x.id === parent);
      return [...l.slice(0, at + 1), s, ...l.slice(at + 1)];
    });
    select(s.id);
    notify("Conversa ramificada: nova sessão com o contexto até aqui", () => {
      setList((l) => l.filter((x) => x.id !== s.id));
      setActiveId(parent);
    });
  };

  const send = (text: string, targetId?: string) => {
    if (streaming) return;
    const sessionId = targetId ?? active.id;
    const reply = cannedReply(text);
    const userE: ThreadEntry = { kind: "user", id: uid("u"), text };
    const stepsId = uid("st");
    const answerId = uid("a");
    const runningSteps = reply.steps.map((s, i) => ({ ...s, status: i === 0 ? ("running" as const) : ("running" as const) }));
    patch(sessionId, (s) => ({
      title: s.title === "Nova sessão" ? text.slice(0, 48) : s.title,
      status: "working",
      time: "agora",
      thread: [...s.thread, userE, { kind: "steps", id: stepsId, title: reply.title, steps: runningSteps.slice(0, 1) }],
    }));
    setDraft("");
    // Passos aparecem um a um; depois a resposta "escreve".
    reply.steps.forEach((_, i) => {
      timers.current.push(
        window.setTimeout(() => {
          patch(sessionId, (s) => ({
            thread: s.thread.map((e) =>
              e.id === stepsId && e.kind === "steps"
                ? { ...e, steps: reply.steps.slice(0, i + 2).map((st, k) => ({ ...st, status: k <= i ? ("done" as const) : ("running" as const) })).slice(0, Math.min(reply.steps.length, i + 2)) }
                : e,
            ),
          }));
        }, 700 * (i + 1)),
      );
    });
    const full = plain(reply.body);
    timers.current.push(
      window.setTimeout(() => {
        patch(sessionId, (s) => ({ thread: [...s.thread.map((e) => (e.id === stepsId && e.kind === "steps" ? { ...e, steps: reply.steps } : e)), { kind: "answer", id: answerId, body: reply.body }] }));
        setStreaming({ sessionId, entryId: answerId, shown: 0, full });
      }, 700 * (reply.steps.length + 1)),
    );
  };

  // Escrita da resposta (caracteres por tick); ao terminar, status da sessão.
  useEffect(() => {
    if (!streaming) return;
    if (streaming.shown >= streaming.full.length) {
      const sid = streaming.sessionId;
      setStreaming(null);
      setList((l) => l.map((s) => (s.id === sid ? { ...s, status: s.id === activeRef.current ? "idle" : "ready" } : s)));
      if (sid !== activeRef.current) notify("Resposta pronta em outra sessão", undefined, "info");
      return;
    }
    const t = window.setTimeout(() => setStreaming((st) => (st ? { ...st, shown: Math.min(st.full.length, st.shown + 6) } : st)), 24);
    return () => clearTimeout(t);
  }, [streaming]);
  const activeRef = useRef(activeId);
  activeRef.current = activeId;

  const stop = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    if (streaming) setStreaming((st) => (st ? { ...st, shown: st.full.length } : st));
    patch(active.id, { status: "idle" });
    notify("Execução interrompida", undefined, "info");
  };

  // Vindo da tela inicial (#/frame/ai-sessions?novo=…): cria a sessão e já envia o pedido.
  const novo = useFrameParam("novo");
  const handledNovo = useRef<string | null>(null);
  useEffect(() => {
    if (!novo || handledNovo.current === novo) return;
    handledNovo.current = novo;
    const s: OsSession = { id: uid("s"), title: novo.slice(0, 48), time: "agora", status: "idle", day: "Hoje", mode: "executar", createdBy: osUser.name, notes: "", files: [], thread: [] };
    setList((l) => [s, ...l]);
    setActiveId(s.id);
    setMobileView("thread");
    window.setTimeout(() => sendRef.current(novo, s.id), 50);
  }, [novo]);
  const sendRef = useRef(send);
  sendRef.current = send;

  const busy = active.status === "working" && (streaming?.sessionId === active.id || timers.current.length > 0);

  const itemActions = (s: OsSession): MenuEntry[] => [
    { label: s.starred ? "Remover das favoritas" : "Favoritar", icon: <Star className="h-4 w-4" />, onSelect: () => patch(s.id, { starred: !s.starred }) },
    {
      label: s.archived ? "Desarquivar" : "Arquivar",
      icon: <Archive className="h-4 w-4" />,
      onSelect: () => {
        patch(s.id, { archived: !s.archived });
        notify(s.archived ? "Sessão desarquivada" : "Sessão arquivada", () => patch(s.id, { archived: s.archived }));
      },
    },
  ];

  const exportMd = () => {
    const md = [`# ${active.title}`, ...active.thread.map((e) => (e.kind === "user" ? `**Você:** ${e.text}` : e.kind === "answer" ? markdown(e.body) : `> ${e.title}`))].join("\n\n");
    const url = URL.createObjectURL(new Blob([md], { type: "text/markdown" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${active.title.replace(/[^\p{L}\d]+/gu, "-").toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    notify("Sessão exportada em Markdown");
  };

  const headerMenu: MenuEntry[] = [
    { label: "Renomear", icon: <Pencil className="h-4 w-4" />, onSelect: () => setRenaming(true) },
    { label: active.starred ? "Remover das favoritas" : "Favoritar", icon: <Star className="h-4 w-4" />, onSelect: () => patch(active.id, { starred: !active.starred }) },
    { type: "submenu", label: "Mover para pasta", icon: <FolderInput className="h-4 w-4" />, items: tagSuggestions.map((t) => ({ label: t, onSelect: () => (patch(active.id, (s) => ({ tags: Array.from(new Set([...(s.tags ?? []), t])) })), notify(`Movida para ${t}`)) })) },
    { label: "Exportar em Markdown", icon: <Download className="h-4 w-4" />, onSelect: exportMd },
    { type: "separator" },
    { label: "Arquivar", icon: <Archive className="h-4 w-4" />, onSelect: () => (patch(active.id, { archived: true }), notify("Sessão arquivada", () => patch(active.id, { archived: false }))) },
    {
      label: "Excluir sessão",
      icon: <Trash2 className="h-4 w-4" />,
      tone: "danger",
      onSelect: () => {
        const removed = active;
        setList((l) => l.filter((s) => s.id !== removed.id));
        setActiveId(list.find((s) => s.id !== removed.id)?.id ?? "");
        setMobileView("list");
        notify("Sessão excluída", () => setList((l) => [removed, ...l]));
      },
    },
  ];

  const minimap: MinimapItem[] = useMemo(
    () =>
      (active?.thread ?? [])
        .filter((e) => e.kind !== "steps")
        .map((e) => ({ id: `msg-${e.id}`, role: e.kind === "user" ? "user" : "assistant", preview: e.kind === "user" ? e.text : e.kind === "answer" ? plain(e.body).slice(0, 120) : "" })),
    [active],
  );

  const thread: ReactNode = (
    <div className="relative flex min-h-0 min-w-0 flex-1 flex-col bg-page">
      <SessionHeader
        title={active?.title ?? "Sessão"}
        menu={headerMenu}
        recording={recording}
        onRecordToggle={() => {
          setRecording((r) => !r);
          notify(recording ? "Gravação encerrada: a ata vai aparecer em Arquivos" : "Gravando a reunião (áudio do sistema e microfone)", undefined, "info");
        }}
        onBrowser={() => setInfoOpen(true)}
        onSearch={() => notify("Exemplo: buscaria dentro desta conversa (⌘F)", undefined, "info")}
        onShare={() => {
          navigator.clipboard?.writeText(location.href).catch(() => undefined);
          notify("Link da sessão copiado");
        }}
        infoOpen={infoOpen}
        onInfoToggle={() => setInfoOpen((o) => !o)}
        onBack={() => setMobileView("list")}
      />
      <div className="relative min-h-0 flex-1">
        <div ref={scroller} className="docs-scroll h-full overflow-y-auto overscroll-contain px-4 pb-20 pt-6 sm:px-8 sm:pb-6">
          <div className="mx-auto flex max-w-[760px] flex-col gap-4">
            {!active?.thread.length && (
              <div className="py-16 text-center">
                <p className="m-0 text-[18px] font-semibold tracking-tight">Por onde começamos, {osUser.first}?</p>
                <p className="m-0 mt-1.5 text-[13.5px] text-muted">Peça uma tarefa, cole um link ou use / para comandos.</p>
              </div>
            )}
            {active?.thread.map((e) => {
              if (e.kind === "user") return <UserBubble key={e.id} id={`msg-${e.id}`}>{e.text}</UserBubble>;
              if (e.kind === "steps") return <StepGroup key={e.id} title={e.title} steps={e.steps} running={e.steps.some((s) => s.status === "running")} />;
              const isStreaming = streaming?.entryId === e.id;
              return (
                <AnswerCard
                  key={e.id}
                  id={`msg-${e.id}`}
                  streaming={isStreaming}
                  actions={<MessageActions text={plain(e.body)} markdown={markdown(e.body)} onRetry={() => send("Refaça a última resposta")} onFeedback={(v) => notify(v === "up" ? "Obrigado pelo retorno" : "Vamos melhorar: conte o que faltou", undefined, "info")} onBranch={() => branch(e.id)} />}
                >
                  {isStreaming ? <p>{streaming!.full.slice(0, streaming!.shown)}</p> : <RichText body={e.body} />}
                </AnswerCard>
              );
            })}
          </div>
        </div>
        <ThreadMinimap items={minimap} scrollRef={scroller} className="absolute left-3 top-6 hidden lg:flex" />
      </div>
      <div className="relative shrink-0 px-4 pb-3 sm:px-8">
        <VoiceModeButton onClick={() => setVoice(true)} className="absolute -top-14 right-4 sm:hidden" />
        <div className="mx-auto flex max-w-[828px] items-end gap-3">
          <div className="min-w-0 flex-1">
          <SessionComposer
            value={draft}
            onChange={setDraft}
            onSubmit={(v) => send(v)}
            onStop={stop}
            busy={busy}
            tools={tools}
            agents={agents}
            agent={agent}
            onAgentChange={(id) => {
              setAgent(id);
              notify(`Agente: ${agents.find((a) => a.id === id)?.name}`, undefined, "info");
            }}
            onManageTools={() => notify("Exemplo: abriria Ferramentas conectadas (Google Agenda precisa reconectar)", undefined, "info")}
            onContext={() => notify("Exemplo: escolheria uma pasta do Drive ou do Notion como contexto", undefined, "info")}
            commands={commands}
          />
            <Disclaimer className="mt-2" />
          </div>
          <VoiceModeButton onClick={() => setVoice(true)} className="mb-7 hidden shrink-0 sm:grid" />
        </div>
      </div>
    </div>
  );

  const info = (
    <SessionInfoPanel
      key={active?.id}
      name={active?.title ?? ""}
      onNameChange={(v) => (patch(active.id, { title: v }), notify("Sessão renomeada"))}
      mode={active?.mode ?? "executar"}
      onModeChange={(m) => (patch(active.id, { mode: m }), notify(`Modo: ${m === "executar" ? "Executar" : m === "planejar" ? "Planejar" : "Perguntar"}`, undefined, "info"))}
      createdBy={active?.createdBy}
      tags={active?.tags ?? []}
      onTagsChange={(t) => patch(active.id, { tags: t })}
      tagSuggestions={tagSuggestions}
      notes={active?.notes ?? ""}
      onNotesChange={(v) => patch(active.id, { notes: v })}
      files={active?.files ?? []}
      browser={active?.browser}
      onMinimize={() => setInfoOpen(false)}
    />
  );

  const sidebar = (
    <SessionSidebar
      sessions={list}
      activeId={mobile && mobileView === "list" ? undefined : active?.id}
      onSelect={select}
      onNew={newSession}
      itemActions={itemActions}
      footer={
        <WorkspaceSwitcher
          name={osWorkspace}
          items={[
            { type: "label", label: "Workspaces" },
            { type: "checkbox", label: "G4 OS", checked: true, onCheckedChange: () => undefined },
            { type: "checkbox", label: "G4 Educação · Comercial", checked: false, onCheckedChange: () => notify("Exemplo: trocaria de workspace", undefined, "info") },
            { type: "separator" },
            { label: "Configurações do workspace", href: osRoutes.settings },
          ]}
        />
      }
    />
  );

  return (
    <OsShell current={osRoutes.sessions} hideTabbar={mobile && mobileView === "thread"}>
      <div className="flex min-h-0 flex-1">
        <div className={cn("min-h-0 shrink-0 border-r border-line md:w-[300px] lg:w-[320px]", mobile ? (mobileView === "list" ? "flex w-full" : "hidden") : "flex")}>{sidebar}</div>
        <div className={cn("min-h-0 min-w-0 flex-1", mobile && mobileView === "list" ? "hidden" : "flex")}>
          {active ? (
            <ResizableSplit left={thread} right={info} rightOpen={infoOpen} defaultSize={0.68} min={0.5} max={0.8} storageKey="os-sessions" label="Redimensionar painel de informações" />
          ) : (
            <div className="grid flex-1 place-items-center text-[13.5px] text-muted">Selecione ou crie uma sessão.</div>
          )}
        </div>
      </div>
      <InputModal
        open={renaming}
        onClose={() => setRenaming(false)}
        title="Renomear sessão"
        submitLabel="Renomear"
        initialValue={active?.title}
        placeholder="Nome da sessão"
        onSubmit={(v) => {
          patch(active.id, { title: v });
          setRenaming(false);
          notify("Sessão renomeada");
        }}
      />
      <VoiceOverlay
        open={voice}
        agentName="G4 OS"
        transcript={["Você: Quais reuniões eu tenho hoje sem pauta?", "G4 OS: Duas — o checkpoint com o time de CX às 14h e a 1:1 com a Carla às 16h.", "Você: Cria uma pauta para as duas a partir das últimas atas.", "G4 OS: Feito. Deixei como rascunho no Notion e te aviso no Slack."]}
        onClose={(lines) => {
          setVoice(false);
          if (lines.length) {
            patch(active.id, (s) => ({ thread: [...s.thread, { kind: "user", id: uid("v"), text: "🎙 Conversa por voz" }, { kind: "answer", id: uid("va"), body: lines.map((l) => [{ t: l }]) }] }));
            notify("Transcrição da conversa por voz adicionada à sessão");
          }
        }}
      />
    </OsShell>
  );
}
