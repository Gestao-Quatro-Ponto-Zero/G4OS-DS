import {
  Archive,
  Plus,
  Settings2,
  Bot,
  CircleHelp,
  Download,
  FolderOpen,
  Inbox,
  LayoutGrid,
  Mic,
  PanelRight,
  Paperclip,
  Pencil,
  Search,
  Settings,
  Share,
  Sparkles,
  Star,
  Trash2,
  FileText,
  Database,
} from "lucide-react";
import { Fragment, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  AgentAppLayout,
  AgentComposer,
  AnswerCard,
  ArtifactCard,
  ArtifactPanel,
  BarChart,
  BarList,
  BottomNav,
  ComposerChip,
  ContextView,
  Disclaimer,
  IconRail,
  InputModal,
  InsightCard,
  ListToggle,
  MessageActions,
  ModelPicker,
  PermissionModeChip,
  ProductMark,
  PromptSuggestions,
  ReportSection,
  RunSummary,
  SessionDetails,
  SessionQuickSwitcher,
  SessionSidebar,
  SheetArtifact,
  StepGroup,
  ThreadHeader,
  ThreadView,
  VoiceModeButton,
  Tooltip,
  UserBubble,
  VoiceOverlay,
  WorkspaceSwitcher,
  cn,
  formatCurrency,
  formatNumber,
  notify,
  type ArtifactTab,
  type ContextItem,
  type MenuEntry,
  type MinimapItem,
  type ModelEffort,
  type NavItem,
  type PermissionMode,
  type RailItem,
  type RunStatus,
  type SlashCommand,
  type StepItem,
} from "@g4os/ds";
import {
  agents,
  artifactFor,
  artifactsByAnswer,
  cannedReply,
  connectionCompare,
  contextBySession,
  cxThemes,
  followUpsBySession,
  gavByUnit,
  markdown,
  osModels,
  osProjects,
  osUser,
  osWorkspace,
  plain,
  runByAnswer,
  sessions as seed,
  tagSuggestions,
  tokensByTask,
  tools,
  type OsSession,
  type Rich,
  type RunInfo,
  type SessionArtifact,
  type ThreadEntry,
} from "./data/os-sessions";
import { frameHref, useFrameParam } from "./shells/frame-route";
import { osRoutes } from "./shells/os-shell";

export const meta = {
  title: "Sessões com artefatos",
  description: "Lista de sessões enxuta + conversa em fluxo (status da execução, passos recolhíveis, artefatos que abrem em abas) + painel de artefatos e detalhes. Montada com AgentAppLayout, ThreadHeader e ThreadView.",
  category: "IA",
  height: 880,
  order: 2,
  concept: {
    goal: "Versão calma das sessões do G4 OS: mantém a lista de sessões, mas a leitura é em fluxo e as entregas viram artefatos no painel lateral.",
    patterns: [
      "AgentAppLayout: trilho + lista recolhível (botão no cabeçalho da conversa, ⌘\\) + conversa + painel (⌘.); lista recolhida = troca rápida de sessão",
      "Lista clean: uma linha por sessão (título + glifo de status + horário), agrupada por data ou por projeto pelo ícone do cabeçalho",
      "Respostas em fluxo com “Trabalhou por …” (RunSummary divider): os passos abrem sob demanda",
      "Histórico longo recolhido no topo (ThreadView collapseBefore)",
      "Campo enxuto: + (anexos e ferramentas) · permissão … agente/modelo · ditar · enviar; voz no botão redondo fora do campo",
      "Permissão sempre visível; “Acesso total” em âmbar e com confirmação",
      "Painel com abas que viram ícones quando falta espaço; a aba ativa fica sempre inteira",
      "Celular: lista → conversa em tela cheia → painel como folha",
    ],
    adapt: ["Qualquer app de agente com histórico + entregáveis", "Use a lista rica (Sessões do G4 OS) quando etiquetas e status detalhados importam mais que a leitura", "Para agentes de código (commit, deploy), veja “Agente de código (tarefas longas)”"],
    avoid: ["Misturar respostas em cartão e em fluxo na mesma tela", "Abrir o painel sem um artefato para mostrar", "Mais de ~5 controles na linha do campo ou chips quebrando texto", "Segunda linha de etiquetas em cada sessão da lista clean"],
  },
} as const;

/* ------------------------------------------------------------------ */
/* Navegação (trilho no desktop, pílula no celular)                    */
/* ------------------------------------------------------------------ */

const here = frameHref("ai-sessions-artifacts");
const rail: RailItem[][] = [
  [
    { href: here, label: "Sessões", icon: Inbox, dot: true },
    { href: osRoutes.home, label: "Nova sessão", icon: LayoutGrid },
    { href: osRoutes.agents, label: "Agentes e relatórios", icon: Bot },
    { href: osRoutes.files, label: "Arquivos", icon: FolderOpen },
  ],
];
const tabs: NavItem[] = [
  { href: here, label: "Sessões", icon: Inbox },
  { href: osRoutes.home, label: "Nova", icon: Sparkles },
  { href: osRoutes.agents, label: "Agentes", icon: Bot },
  { href: osRoutes.files, label: "Arquivos", icon: FolderOpen },
];

const commands: SlashCommand[] = [
  { id: "relatorio", label: "relatorio", description: "Gera um relatório com os achados" },
  { id: "planilha", label: "planilha", description: "Monta uma planilha a partir dos dados" },
  { id: "slack", label: "slack", description: "Prepara uma mensagem para um canal" },
];

/* ------------------------------------------------------------------ */
/* Texto rico das respostas                                            */
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

/** Passos da execução dentro do "Concluído em… ›". */
function StepList({ steps }: { steps: StepItem[] }) {
  return (
    <ol className="m-0 flex list-none flex-col gap-1.5 p-0">
      {steps.map((s) => (
        <li key={s.id} className="flex items-start justify-between gap-3 text-[12.5px]">
          <span className={cn("min-w-0", s.status === "error" ? "text-rose" : "text-ink-soft")}>
            {s.label}
            {s.detail && <span className="block text-[12px] text-muted">{s.detail}</span>}
          </span>
          {s.durationMs != null && <span className="shrink-0 tabular-nums text-muted">{(s.durationMs / 1000).toFixed(1).replace(".", ",")} s</span>}
        </li>
      ))}
    </ol>
  );
}

/* ------------------------------------------------------------------ */
/* Estado por resposta                                                 */
/* ------------------------------------------------------------------ */

type LiveArtifact = SessionArtifact & { status: "ready" | "generating" };
type Extra = { status: RunStatus; startedAt?: number; run?: RunInfo; artifacts: LiveArtifact[]; suggestions?: string[] };

const key = (sid: string, eid: string) => `${sid}:${eid}`;

function seedExtras(list: OsSession[]): Record<string, Extra> {
  const out: Record<string, Extra> = {};
  list.forEach((s) => {
    const answers = s.thread.filter((e) => e.kind === "answer");
    answers.forEach((e, i) => {
      const k = key(s.id, e.id);
      out[k] = {
        status: s.status === "working" && i === answers.length - 1 ? "running" : "done",
        startedAt: s.status === "working" ? Date.now() - 18_000 : undefined,
        run: runByAnswer[k],
        artifacts: (artifactsByAnswer[k] ?? []).map((a) => ({ ...a, status: s.status === "working" ? "generating" : "ready" })),
        suggestions: i === answers.length - 1 ? followUpsBySession[s.id] : undefined,
      };
    });
  });
  return out;
}

const fixedTabs: ArtifactTab[] = [
  { id: "context", kind: "context", title: "Contexto" },
  { id: "files", kind: "files", title: "Arquivos" },
  { id: "details", kind: "details", title: "Detalhes" },
];

let seq = 0;
const uid = (p: string) => `${p}-${Date.now().toString(36)}-${++seq}`;

/* ------------------------------------------------------------------ */

export default function AiSessionsArtifacts() {
  const initialId = useFrameParam("id", "mcp-notion");
  const [list, setList] = useState<OsSession[]>(seed);
  const [extras, setExtras] = useState<Record<string, Extra>>(() => seedExtras(seed));
  const [activeId, setActiveId] = useState(initialId);
  const [mobileView, setMobileView] = useState<"list" | "main">(useFrameParam("id") ? "main" : "list");
  const isMobile = () => typeof window !== "undefined" && window.matchMedia("(max-width: 767.98px)").matches;
  const [panelOpen, setPanelOpen] = useState(() => !isMobile());
  const [listOpen, setListOpen] = useState(true);
  const [openTabs, setOpenTabs] = useState<ArtifactTab[]>([]);
  const [activeTab, setActiveTab] = useState("details");
  const [ctx, setCtx] = useState<Record<string, ContextItem[]>>(contextBySession);
  const [draft, setDraft] = useState("");
  const [agent, setAgent] = useState("os");
  const [permission, setPermission] = useState<PermissionMode>("aprovar");
  const [model, setModel] = useState("sol");
  const [effort, setEffort] = useState<ModelEffort>("padrao");
  const [listMode, setListMode] = useState<"recent" | "projects">("projects");
  const [projects] = useState(osProjects);
  const [recording, setRecording] = useState(false);
  const [voice, setVoice] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [streaming, setStreaming] = useState<{ sessionId: string; entryId: string; shown: number; full: string } | null>(null);
  const timers = useRef<number[]>([]);
  const active = list.find((s) => s.id === activeId) ?? list[0];
  const activeRef = useRef(activeId);
  activeRef.current = activeId;
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const patch = useCallback((id: string, p: Partial<OsSession> | ((s: OsSession) => Partial<OsSession>)) => {
    setList((l) => l.map((s) => (s.id === id ? { ...s, ...(typeof p === "function" ? p(s) : p) } : s)));
  }, []);
  const patchExtra = useCallback((k: string, p: Partial<Extra> | ((e: Extra) => Partial<Extra>)) => {
    setExtras((x) => {
      const cur = x[k] ?? { status: "done", artifacts: [] };
      return { ...x, [k]: { ...cur, ...(typeof p === "function" ? p(cur) : p) } };
    });
  }, []);

  /** Artefatos da sessão (todas as respostas), do mais novo ao mais antigo. */
  const sessionArtifacts = useMemo(() => {
    if (!active) return [] as LiveArtifact[];
    return active.thread
      .filter((e) => e.kind === "answer")
      .flatMap((e) => extras[key(active.id, e.id)]?.artifacts ?? [])
      .reverse();
  }, [active, extras]);

  // Trocar de sessão: abas voltam a ser as da sessão; abre o artefato mais recente.
  useEffect(() => {
    const ready = sessionArtifacts.filter((a) => a.status === "ready");
    setOpenTabs(ready.slice(0, 1).map((a) => ({ id: a.id, kind: a.kind, title: a.title, closable: true })));
    setActiveTab(ready[0]?.id ?? "details");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  const openArtifact = (a: SessionArtifact) => {
    setOpenTabs((t) => (t.some((x) => x.id === a.id) ? t : [...t, { id: a.id, kind: a.kind, title: a.title, closable: true }]));
    setActiveTab(a.id);
    setPanelOpen(true);
  };

  const select = (id: string) => {
    setActiveId(id);
    setMobileView("main");
    if (isMobile()) setPanelOpen(false);
    patch(id, (s) => (s.status === "ready" ? { status: "idle" } : {}));
  };

  const newSession = (projectId?: string) => {
    const s: OsSession = { id: uid("s"), title: "Nova sessão", time: "agora", status: "idle", day: "Hoje", projectId, mode: "executar", createdBy: osUser.name, notes: "", files: [], thread: [] };
    setList((l) => [s, ...l]);
    select(s.id);
  };

  const branch = (fromEntry: string) => {
    const idx = active.thread.findIndex((e) => e.id === fromEntry);
    const s: OsSession = { ...active, id: uid("b"), title: `Ramo: ${active.title}`, parentId: active.id, time: "agora", status: "idle", starred: false, archived: false, createdBy: `Ramificada de “${active.title}”`, thread: active.thread.slice(0, idx + 1) };
    const parent = active.id;
    setExtras((x) => {
      const n = { ...x };
      s.thread.forEach((e) => {
        const from = x[key(parent, e.id)];
        if (from) n[key(s.id, e.id)] = { ...from, suggestions: undefined };
      });
      return n;
    });
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
    const stepsId = uid("st");
    const answerId = uid("a");
    const startedAt = Date.now();
    // Sugestões só na última resposta.
    setExtras((x) => {
      const n = { ...x };
      Object.keys(n).forEach((k) => k.startsWith(`${sessionId}:`) && (n[k] = { ...n[k], suggestions: undefined }));
      n[key(sessionId, answerId)] = { status: "running", startedAt, artifacts: [] };
      return n;
    });
    patch(sessionId, (s) => ({
      title: s.title === "Nova sessão" ? text.slice(0, 48) : s.title,
      status: "working",
      time: "agora",
      thread: [...s.thread, { kind: "user", id: uid("u"), text }, { kind: "steps", id: stepsId, title: reply.title, steps: reply.steps.slice(0, 1).map((st) => ({ ...st, status: "running" as const })) }],
    }));
    setDraft("");
    reply.steps.forEach((_, i) =>
      timers.current.push(
        window.setTimeout(() => {
          patch(sessionId, (s) => ({
            thread: s.thread.map((e) =>
              e.id === stepsId && e.kind === "steps" ? { ...e, steps: reply.steps.slice(0, Math.min(reply.steps.length, i + 2)).map((st, k) => ({ ...st, status: k <= i ? ("done" as const) : ("running" as const) })) } : e,
            ),
          }));
        }, 700 * (i + 1)),
      ),
    );
    timers.current.push(
      window.setTimeout(() => {
        patch(sessionId, (s) => ({ thread: [...s.thread.map((e) => (e.id === stepsId && e.kind === "steps" ? { ...e, steps: reply.steps } : e)), { kind: "answer", id: answerId, body: reply.body }] }));
        setStreaming({ sessionId, entryId: answerId, shown: 0, full: plain(reply.body) });
      }, 700 * (reply.steps.length + 1)),
    );
    pendingArtifact.current = { sessionId, answerId, prompt: text, startedAt, steps: reply.steps.length };
  };
  const pendingArtifact = useRef<{ sessionId: string; answerId: string; prompt: string; startedAt: number; steps: number } | null>(null);
  const sendRef = useRef(send);
  sendRef.current = send;

  // Escrita da resposta; ao terminar: status, artefato gerando → pronto, painel abre.
  useEffect(() => {
    if (!streaming) return;
    if (streaming.shown >= streaming.full.length) {
      const sid = streaming.sessionId;
      const p = pendingArtifact.current;
      setStreaming(null);
      if (p) {
        const art = artifactFor(p.prompt, ++seq);
        const k = key(sid, p.answerId);
        patchExtra(k, {
          status: "done",
          run: { durationMs: Date.now() - p.startedAt, steps: p.steps, tools: Math.max(1, p.steps - 1), tokens: 7_000 + p.prompt.length * 40, cost: formatCurrency(0.09 + p.prompt.length / 2000) },
          artifacts: [{ ...art, status: "generating" }],
          suggestions: ["Abrir no painel", "Resumir em 3 tópicos"],
        });
        timers.current.push(
          window.setTimeout(() => {
            patchExtra(k, (e) => ({ artifacts: e.artifacts.map((a) => ({ ...a, status: "ready" as const })) }));
            setList((l) => l.map((s) => (s.id === sid ? { ...s, status: s.id === activeRef.current ? "idle" : "ready" } : s)));
            if (sid === activeRef.current) {
              if (!isMobile()) openArtifact(art);
              else notify(`${art.title} pronto`, undefined, "info");
            } else notify("Resposta pronta em outra sessão", undefined, "info");
          }, 900),
        );
        pendingArtifact.current = null;
      }
      return;
    }
    const t = window.setTimeout(() => setStreaming((st) => (st ? { ...st, shown: Math.min(st.full.length, st.shown + 6) } : st)), 22);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streaming]);

  const stop = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    if (streaming) setStreaming((st) => (st ? { ...st, shown: st.full.length } : st));
    else {
      // Parou antes da resposta: marca a execução como interrompida.
      const p = pendingArtifact.current;
      if (p) patchExtra(key(p.sessionId, p.answerId), { status: "stopped", run: { durationMs: Date.now() - p.startedAt, steps: p.steps, tools: 1, tokens: 0, cost: "R$ 0,00" } });
      patch(active.id, { status: "idle" });
    }
    notify("Execução interrompida", undefined, "info");
  };

  // Vindo de outra tela (?novo=…): cria a sessão e já envia.
  const novo = useFrameParam("novo");
  const handledNovo = useRef<string | null>(null);
  useEffect(() => {
    if (!novo || handledNovo.current === novo) return;
    handledNovo.current = novo;
    const s: OsSession = { id: uid("s"), title: novo.slice(0, 48), time: "agora", status: "idle", day: "Hoje", mode: "executar", createdBy: osUser.name, notes: "", files: [], thread: [] };
    setList((l) => [s, ...l]);
    setActiveId(s.id);
    setMobileView("main");
    window.setTimeout(() => sendRef.current(novo, s.id), 50);
  }, [novo]);

  const running = !!active && active.status === "working" && (streaming?.sessionId === active.id || timers.current.length > 0);

  /* ---------------------------- Menus ------------------------------ */

  const itemActions = (s: OsSession): MenuEntry[] => [
    { label: s.starred ? "Remover das favoritas" : "Favoritar", icon: <Star className="h-4 w-4" />, onSelect: () => patch(s.id, { starred: !s.starred }) },
    { label: "Arquivar", icon: <Archive className="h-4 w-4" />, onSelect: () => (patch(s.id, { archived: true }), notify("Sessão arquivada", () => patch(s.id, { archived: false }))) },
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
    { label: active?.starred ? "Remover das favoritas" : "Favoritar", icon: <Star className="h-4 w-4" />, onSelect: () => patch(active.id, { starred: !active.starred }) },
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

  /* ---------------------------- Conversa --------------------------- */

  const thread = active?.thread ?? [];
  const lastAnswerId = [...thread].reverse().find((e) => e.kind === "answer")?.id;
  const minimap: MinimapItem[] = useMemo(
    () =>
      thread
        .filter((e) => e.kind !== "steps")
        .map((e) => ({ id: `msg-${e.id}`, role: e.kind === "user" ? "user" : "assistant", preview: e.kind === "user" ? e.text : e.kind === "answer" ? plain(e.body).slice(0, 120) : "" })),
    [thread],
  );

  const renderThread = () => {
    const out: ReactNode[] = [];
    for (let i = 0; i < thread.length; i++) {
      const e = thread[i];
      if (e.kind === "user") {
        out.push(
          <UserBubble key={e.id} id={`msg-${e.id}`}>
            {e.text}
          </UserBubble>,
        );
        continue;
      }
      if (e.kind === "steps") {
        const next = thread[i + 1];
        if (next?.kind === "answer") continue; // vira o "Concluído em… ›" da resposta
        // Ainda trabalhando: status ao vivo + passos aparecendo.
        const live = e.steps.some((s) => s.status === "running");
        const k = Object.keys(extras).find((x) => x.startsWith(`${active.id}:`) && extras[x].status !== "done" && !thread.some((t) => `${active.id}:${t.id}` === x));
        const x = k ? extras[k] : undefined;
        out.push(
          <div key={e.id} className="min-w-0 space-y-2">
            {x && <RunSummary variant="divider" status={x.status} startedAt={x.startedAt} durationMs={x.run?.durationMs} />}
            <StepGroup variant="line" title={e.title} steps={e.steps} running={live} defaultOpen />
          </div>,
        );
        continue;
      }
      const prev = thread[i - 1];
      const steps = prev?.kind === "steps" ? (prev as Extract<ThreadEntry, { kind: "steps" }>).steps : undefined;
      const x = extras[key(active.id, e.id)];
      const isStreaming = streaming?.entryId === e.id;
      const runStatus: RunStatus = isStreaming ? "running" : x?.status ?? "done";
      out.push(
        <AnswerCard
          key={e.id}
          id={`msg-${e.id}`}
          variant="flow"
          streaming={isStreaming}
          actionsVisible={e.id === lastAnswerId ? "always" : "hover"}
          run={
            (x?.run || steps || x?.status === "running") && (
              <RunSummary
                variant="divider"
                status={runStatus === "running" && !isStreaming && x?.status === "running" ? "running" : runStatus}
                startedAt={x?.startedAt}
                durationMs={x?.run?.durationMs ?? steps?.reduce((s, st) => s + (st.durationMs ?? 0), 0)}
                steps={x?.run?.steps ?? steps?.length}
                tools={x?.run?.tools}
                tokens={x?.run?.tokens}
                cost={x?.run?.cost}
              >
                {steps && <StepList steps={steps} />}
              </RunSummary>
            )
          }
          artifacts={
            x?.artifacts.length
              ? x.artifacts.map((a) => (
                  <ArtifactCard key={a.id} kind={a.kind} title={a.title} meta={a.meta} status={a.status} selected={panelOpen && activeTab === a.id} onOpen={() => openArtifact(a)} />
                ))
              : undefined
          }
          actions={
            <MessageActions
              compact
              text={plain(e.body)}
              markdown={markdown(e.body)}
              onRetry={() => send("Refaça a última resposta")}
              onFeedback={(v) => notify(v === "up" ? "Obrigado pelo retorno" : "Vamos melhorar: conte o que faltou", undefined, "info")}
              onBranch={() => branch(e.id)}
            />
          }
          suggestions={
            e.id === lastAnswerId && x?.suggestions?.length && !running
              ? x.suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => (s === "Abrir no painel" && x.artifacts[0] ? openArtifact(x.artifacts[0]) : send(s))}
                    className="inline-flex h-7 items-center rounded-full px-3 text-[12px] text-ink-soft ring-1 ring-line hover:bg-soft hover:text-ink"
                  >
                    {s}
                  </button>
                ))
              : undefined
          }
        >
          {isStreaming ? <p>{streaming!.full.slice(0, streaming!.shown)}</p> : <RichText body={e.body} />}
        </AnswerCard>,
      );
    }
    return out;
  };

  const header = (
    <ThreadHeader
      title={active?.title ?? "Sessão"}
      menu={headerMenu}
      onBack={() => setMobileView("list")}
      backLabel="Voltar para sessões"
      leading={
        <>
          <ListToggle label="sessões" />
          <SessionQuickSwitcher
            sessions={list
              .filter((x) => !x.archived)
              .map((x) => ({ id: x.id, title: x.title, time: x.time, status: x.status, group: projects.find((p) => p.id === x.projectId)?.name ?? "Sem projeto" }))
              .sort((a, b) => projects.findIndex((p) => p.name === a.group) - projects.findIndex((p) => p.name === b.group))}
            activeId={active?.id}
            onSelect={select}
          />
        </>
      }
      actions={[
        {
          id: "rec",
          label: recording ? "Gravando reunião" : "Gravar reunião",
          icon: recording ? <span aria-hidden className="h-2 w-2 rounded-full bg-rose motion-safe:animate-pulse" /> : <Mic />,
          onClick: () => {
            setRecording((r) => !r);
            notify(recording ? "Gravação encerrada: a ata vai aparecer em Arquivos" : "Gravando a reunião (áudio do sistema e microfone)", undefined, "info");
          },
          active: recording,
          tone: "danger",
          showLabel: true,
          hideOnMobile: true,
        },
        { id: "search", label: "Buscar na conversa", icon: <Search />, onClick: () => notify("Exemplo: buscaria dentro desta conversa (⌘F)", undefined, "info"), hideOnMobile: true },
        {
          id: "share",
          label: "Compartilhar",
          icon: <Share />,
          onClick: () => {
            navigator.clipboard?.writeText(location.href).catch(() => undefined);
            notify("Link da sessão copiado");
          },
        },
        { id: "panel", label: panelOpen ? "Fechar painel (⌘.)" : "Artefatos e detalhes (⌘.)", icon: <PanelRight />, onClick: () => setPanelOpen((o) => !o), active: panelOpen },
      ]}
    />
  );

  const pinned = (ctx[active?.id] ?? []).filter((c) => c.pinned);
  const toolErrors = tools.filter((t) => t.status === "error").length;
  // Linha do campo enxuta: + (anexos e ferramentas) · permissão … agente/modelo · ditar · enviar.
  const composer = (
    <div className="relative shrink-0 px-3 pb-3 pt-1 sm:px-8">
      <VoiceModeButton onClick={() => setVoice(true)} className="absolute -top-14 right-4 sm:hidden" />
      <div className="mx-auto flex max-w-[828px] items-end gap-3">
        <div className="min-w-0 flex-1">
          <AgentComposer
            value={draft}
            onChange={setDraft}
            onSubmit={(v) => send(v)}
            onStop={stop}
            busy={running}
            commands={commands}
            placeholder="Peça qualquer coisa ao G4 OS"
            hint={
              <>
                <kbd className="mr-1 rounded border border-line px-1 font-mono text-[11px]">/</kbd> para comandos
              </>
            }
            attachIcon={
              <span className="relative inline-grid">
                <Plus className="h-4 w-4" />
                {toolErrors > 0 && <span aria-hidden className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-rose ring-2 ring-surface" />}
              </span>
            }
            attachOptions={[
              { label: "Anexar arquivo", icon: <Paperclip className="h-4 w-4" />, onSelect: () => notify("Exemplo: abriria o seletor de arquivos", undefined, "info") },
              { label: "Contexto de uma pasta", icon: <FolderOpen className="h-4 w-4" />, onSelect: () => notify("Exemplo: escolheria uma pasta como contexto", undefined, "info") },
              { label: "Página do Notion", icon: <FileText className="h-4 w-4" />, onSelect: () => notify("Exemplo: buscaria uma página do Notion", undefined, "info") },
              { type: "separator" },
              {
                type: "submenu",
                label: `Ferramentas (${tools.length})${toolErrors ? ` · ${toolErrors} com erro` : ""}`,
                icon: <Settings2 className="h-4 w-4" />,
                items: [
                  ...tools.map((t) =>
                    t.status === "error"
                      ? { label: `${t.name} · reconectar`, tone: "danger" as const, onSelect: () => notify(`Exemplo: reconectaria ${t.name}`, undefined, "info") }
                      : { label: t.name, onSelect: () => notify(`${t.name} conectada`, undefined, "info") },
                  ),
                  { type: "separator" as const },
                  { label: "Gerenciar ferramentas", icon: <Settings2 className="h-4 w-4" />, onSelect: () => notify("Exemplo: abriria Ferramentas conectadas", undefined, "info") },
                ],
              },
            ]}
            leading={
              <PermissionModeChip
                value={permission}
                onChange={(m) => {
                  setPermission(m);
                  notify(m === "total" ? "Acesso total: o agente age sem pedir aprovação" : m === "ler" ? "Somente leitura" : "O agente vai pedir aprovação antes de agir", undefined, "info");
                }}
              />
            }
            contextChips={
              pinned.length ? (
                <>
                  {pinned.map((c) => (
                    <ComposerChip key={c.id} icon={<Database className="h-3 w-3" />} onRemove={() => setCtx((m) => ({ ...m, [active.id]: (m[active.id] ?? []).map((i) => (i.id === c.id ? { ...i, pinned: false } : i)) }))}>
                      {c.title}
                    </ComposerChip>
                  ))}
                </>
              ) : undefined
            }
            trailing={
              <ModelPicker
                agents={agents}
                agent={agent}
                onAgentChange={setAgent}
                models={osModels}
                value={model}
                onChange={(id) => (setModel(id), notify(`Modelo: ${osModels.find((m) => m.id === id)?.name}`, undefined, "info"))}
                effort={effort}
                onEffortChange={setEffort}
              />
            }
            onTranscribe={(ms) => (ms > 600 ? "Monta uma planilha comparando as duas conexões e manda o resumo no Slack" : "")}
          />
          <Disclaimer className="mt-2" />
        </div>
        <VoiceModeButton onClick={() => setVoice(true)} className="mb-7 hidden shrink-0 sm:grid" />
      </div>
    </div>
  );

  const nodes = active && thread.length ? renderThread() : [];
  const main = active ? (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-page">
      {header}
      <ThreadView
        follow={`${thread.length}:${streaming?.shown ?? 0}:${Object.keys(extras).length}`}
        resetKey={active.id}
        minimap={minimap}
        collapseBefore={nodes.length > 7 ? nodes.length - 4 : 0}
      >
        {thread.length ? (
          nodes
        ) : (
          <div className="py-12">
            <p className="m-0 text-center text-[20px] font-semibold tracking-tight">Por onde começamos, {osUser.first}?</p>
            <p className="m-0 mt-1.5 text-center text-[13.5px] text-muted">Peça uma tarefa; o que o agente produzir abre ao lado.</p>
            <PromptSuggestions
              className="mx-auto mt-6 max-w-[620px]"
              items={[
                { id: "1", label: "Comparar as duas conexões do Notion", description: "Gera uma planilha com as diferenças" },
                { id: "2", label: "Resumir os tickets de CX de ontem", description: "Relatório por tema" },
                { id: "3", label: "Preparar a mensagem para o #os-mcp", description: "Rascunho para revisar antes de enviar" },
                { id: "4", label: "Montar a pauta das reuniões sem pauta", description: "A partir das últimas atas" },
              ]}
              onSelect={(it) => send(it.label)}
            />
          </div>
        )}
      </ThreadView>
      {composer}
    </div>
  ) : (
    <div className="grid flex-1 place-items-center text-[13.5px] text-muted">Selecione ou crie uma sessão.</div>
  );

  /* ---------------------------- Painel ----------------------------- */

  const tabsAll: ArtifactTab[] = [...openTabs, ...fixedTabs];
  const current = tabsAll.find((t) => t.id === activeTab) ?? fixedTabs[2];
  const artifact = sessionArtifacts.find((a) => a.id === current.id);
  const pad = "mx-auto max-w-[760px] px-5 py-6 sm:px-8";
  const view: ReactNode =
    current.id === "details" ? (
      <div className={pad}>
        <SessionDetails
          key={active?.id}
          show="detalhes"
          title={null}
          name={active?.title ?? ""}
          onNameChange={(v) => (patch(active.id, { title: v }), notify("Sessão renomeada"))}
          mode={active?.mode ?? "executar"}
          onModeChange={(m) => patch(active.id, { mode: m })}
          createdBy={active?.createdBy}
          tags={active?.tags ?? []}
          onTagsChange={(t) => patch(active.id, { tags: t })}
          tagSuggestions={tagSuggestions}
          notes={active?.notes ?? ""}
          onNotesChange={(v) => patch(active.id, { notes: v })}
        />
      </div>
    ) : current.id === "files" ? (
      <div className={pad}>
        {sessionArtifacts.length > 0 && (
          <div className="mb-5">
            <p className="m-0 mb-2 text-[12px] font-medium text-muted">Gerados nesta sessão</p>
            <div className="grid gap-2">
              {sessionArtifacts.map((a) => (
                <ArtifactCard key={a.id} kind={a.kind} title={a.title} meta={a.meta} status={a.status} selected={activeTab === a.id} onOpen={() => openArtifact(a)} />
              ))}
            </div>
          </div>
        )}
        <SessionDetails
          key={`f-${active?.id}`}
          show="arquivos"
          title={null}
          name={active?.title ?? ""}
          onNameChange={() => undefined}
          mode={active?.mode ?? "executar"}
          onModeChange={() => undefined}
          createdBy={active?.createdBy}
          tags={[]}
          onTagsChange={() => undefined}
          notes=""
          onNotesChange={() => undefined}
          files={active?.files ?? []}
        />
      </div>
    ) : current.id === "context" ? (
      <div className={pad}>
        <ReportSection title="Contexto usado">
          <p>O que o agente leu nesta sessão, pelo peso nas respostas. Fixe um item para mantê-lo nas próximas perguntas.</p>
        </ReportSection>
        {(ctx[active?.id] ?? []).length ? (
          <ContextView
            className="mt-5"
            items={ctx[active.id]}
            onPinChange={(cid, pin) => setCtx((m) => ({ ...m, [active.id]: (m[active.id] ?? []).map((i) => (i.id === cid ? { ...i, pinned: pin } : i)) }))}
            onAdd={() => notify("Exemplo: abriria a busca de fontes", undefined, "info")}
          />
        ) : (
          <p className="m-0 mt-5 rounded-xl border border-dashed border-line px-3 py-6 text-center text-[12.5px] text-muted">Nenhuma fonte usada ainda nesta sessão.</p>
        )}
      </div>
    ) : (
      <ArtifactView artifact={artifact ?? { id: current.id, kind: current.kind, title: current.title, meta: "", status: "ready" }} session={active} />
    );

  const panel = (
    <ArtifactPanel
      tabs={tabsAll}
      active={current.id}
      onActiveChange={setActiveTab}
      onCloseTab={(tid) => {
        setOpenTabs((t) => t.filter((x) => x.id !== tid));
        if (activeTab === tid) setActiveTab("details");
      }}
      onClose={() => setPanelOpen(false)}
      onCopy={() => notify("Conteúdo da aba copiado", undefined, "info")}
      onExport={() => notify(`Exportando “${current.title}”…`, undefined, "info")}
      onShare={() => notify("Link de visualização copiado", undefined, "info")}
    >
      {view}
    </ArtifactPanel>
  );

  /* ---------------------------- Lista ------------------------------ */

  const sessionList = (
    <SessionSidebar
      density="clean"
      sessions={list}
      activeId={mobileView === "list" && isMobile() ? undefined : active?.id}
      onSelect={select}
      onNew={() => newSession(listMode === "projects" ? active?.projectId : undefined)}
      itemActions={itemActions}
      projects={projects}
      listMode={listMode}
      onListModeChange={setListMode}
      projectLimit={4}
      projectActions={(p) => [
        { label: "Nova sessão no projeto", icon: <Pencil className="h-4 w-4" />, onSelect: () => newSession(p.id) },
        {
          label: "Arquivar projeto",
          icon: <Archive className="h-4 w-4" />,
          onSelect: () => {
            const ids = list.filter((x) => x.projectId === p.id && !x.archived).map((x) => x.id);
            setList((l) => l.map((x) => (ids.includes(x.id) ? { ...x, archived: true } : x)));
            notify(`${ids.length} sessões de “${p.name}” arquivadas`, () => setList((l) => l.map((x) => (ids.includes(x.id) ? { ...x, archived: false } : x))));
          },
        },
      ]}
      footer={
        <div className="flex items-center gap-1">
          <div className="min-w-0 flex-1">
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
          </div>

        </div>
      }
    />
  );

  return (
    <>
      <AgentAppLayout
        storageKey="ai-sessions-artifacts"
        rail={
          <IconRail
            groups={rail}
            currentPath={here}
            mark={<ProductMark size={30} />}
            footer={
              <div className="flex flex-col items-center gap-2">
                <Tooltip content="Configurações" side="right">
                  <a href={osRoutes.settings} aria-label="Configurações" className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-ink/[0.05] hover:text-ink">
                    <Settings className="h-[17px] w-[17px]" />
                  </a>
                </Tooltip>
                <Tooltip content="Ajuda" side="right">
                  <button type="button" aria-label="Ajuda" onClick={() => notify("Exemplo: abriria a central de ajuda do G4 OS", undefined, "info")} className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-ink/[0.05] hover:text-ink">
                    <CircleHelp className="h-[17px] w-[17px]" />
                  </button>
                </Tooltip>
              </div>
            }
          />
        }
        list={sessionList}
        listOpen={listOpen}
        onListOpenChange={setListOpen}
        main={main}
        panel={panel}
        panelOpen={panelOpen}
        onPanelOpenChange={setPanelOpen}
        mobileView={mobileView}
        mobileNav={<BottomNav items={tabs} currentPath={here} />}
      />
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
          if (lines.length && active) {
            patch(active.id, (s) => ({ thread: [...s.thread, { kind: "user", id: uid("v"), text: "🎙 Conversa por voz" }, { kind: "answer", id: uid("va"), body: lines.map((l) => [{ t: l }]) }] }));
            notify("Transcrição da conversa por voz adicionada à sessão");
          }
        }}
      />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Conteúdo de cada artefato                                           */
/* ------------------------------------------------------------------ */

function ArtifactView({ artifact, session }: { artifact: LiveArtifact; session: OsSession }) {
  const pad = "mx-auto max-w-[780px] space-y-6 px-5 py-6 sm:px-8";
  if (artifact.status === "generating")
    return (
      <div className={pad}>
        <p className="ds-shimmer m-0 text-[14px] font-medium">Gerando “{artifact.title}”…</p>
        <div className="space-y-2" aria-hidden>
          {[92, 80, 86, 64].map((w, i) => (
            <div key={i} className="h-3 rounded bg-line" style={{ width: `${w}%` }} />
          ))}
        </div>
      </div>
    );
  switch (artifact.id) {
    case "mcp-sheet":
      return (
        <div className={pad}>
          <ReportSection title="Comparativo das conexões">
            <p>Mesma página lida pelas conexões notion e notion-official. A única divergência foi a prévia de link para a planilha.</p>
          </ReportSection>
          <SheetArtifact
            caption="notion × notion-official"
            columns={[
              { key: "criterio", label: "Critério", width: 190 },
              { key: "notion", label: "notion" },
              { key: "oficial", label: "notion-official" },
              { key: "ok", label: "Resultado", format: (v) => (v ? "Igual" : "Diverge") },
            ]}
            rows={connectionCompare}
            changed={["3:oficial", "3:ok"]}
          />
        </div>
      );
    case "gav-sheet":
      return (
        <div className={pad}>
          <ReportSection title="GAV por unidade">
            <p>Agosto × setembro. SP puxou a alta (+11 %); as demais ficaram estáveis.</p>
          </ReportSection>
          <SheetArtifact
            caption="GAV · R$"
            columns={[
              { key: "unidade", label: "Unidade", width: 170 },
              { key: "agosto", label: "Agosto", align: "right", format: (v) => formatCurrency(Number(v), { cents: false }) },
              { key: "setembro", label: "Setembro", align: "right", format: (v) => formatCurrency(Number(v), { cents: false }) },
            ]}
            rows={gavByUnit}
            changed={["0:setembro"]}
          />
        </div>
      );
    case "cx-report":
      return (
        <div className={pad}>
          <ReportSection title="Resumo de CX · 29/09">
            <p>
              142 tickets em 6 temas. <strong className="font-medium text-ink">Acesso ao portal</strong> e <strong className="font-medium text-ink">cobrança duplicada</strong> lideram; a duplicidade começou depois da troca de gateway em 28/09.
            </p>
          </ReportSection>
          <InsightCard kicker="Temas" title="Cobrança duplicada é nova e cresce" listLabel="Tickets por tema" tone="warn">
            <BarList items={cxThemes} />
          </InsightCard>
        </div>
      );
    case "tok-report":
      return (
        <div className={pad}>
          <ReportSection title="Tokens por tipo de tarefa">
            <p>Pesquisa consome 2,4× mais tokens que execução, puxada pela leitura de páginas longas.</p>
          </ReportSection>
          <div className="rounded-xl border border-line bg-surface p-4">
            <BarChart
              label="Tokens por tipo de tarefa e modelo"
              data={tokensByTask}
              index="tarefa"
              series={[
                { key: "opus", label: "Opus" },
                { key: "sonnet", label: "Sonnet" },
                { key: "haiku", label: "Haiku" },
              ]}
              format={(n) => formatNumber(n)}
              formatAxis={(n) => `${Math.round(n / 1000)} mil`}
              height={240}
            />
          </div>
        </div>
      );
    case "fg-doc":
      return (
        <div className={pad}>
          <ReportSection title="Field Guide FC v12">
            <p>Seções em revisão a partir da DIREX de 23/09.</p>
          </ReportSection>
          <ol className="m-0 space-y-3 pl-5 text-[14px] leading-relaxed text-ink-soft">
            <li>
              <strong className="font-medium text-ink">Qualificação:</strong> BANT completo obrigatório antes de avançar.
            </li>
            <li>
              <strong className="font-medium text-ink">SLA de primeiro contato:</strong> de 24 h para 4 h, com alerta no Slack.
            </li>
            <li>
              <strong className="font-medium text-ink">Perguntas de descoberta:</strong> 6 novas, por segmento.
            </li>
            <li>
              <strong className="font-medium text-ink">Passagem para CS:</strong> checklist de 5 itens.
            </li>
          </ol>
        </div>
      );
    case "mcp-msg":
      return (
        <div className={pad}>
          <ReportSection title="Resumo enviado no Slack">
            <p>Mensagem publicada em #os-mcp às 14:12 e confirmada.</p>
          </ReportSection>
          <div className="rounded-xl border border-line bg-surface p-4 text-[14px] leading-relaxed text-ink-soft">
            Validação do MCP do Notion: as duas conexões leram a página do Field Guide por inteiro. Única diferença: prévia de link para planilha (notion-official mostra página em branco). Issue #1116 segue aberta até validarmos o OAuth num build corrigido.
          </div>
        </div>
      );
    default: {
      const last = [...session.thread].reverse().find((e) => e.kind === "answer");
      const text = last && last.kind === "answer" ? plain(last.body) : "";
      if (artifact.kind === "sheet") {
        // Planilha gerada: usa os dados da sessão quando existem; senão, os passos da execução.
        const stepsEntry = [...session.thread].reverse().find((e) => e.kind === "steps");
        const fallback = stepsEntry && stepsEntry.kind === "steps" ? stepsEntry.steps.map((st, i) => ({ passo: `${i + 1}. ${st.label}`, tempo: st.durationMs ?? 0, situacao: st.status === "error" ? "Falhou" : "Concluído" })) : [];
        return (
          <div className={pad}>
            <ReportSection title={artifact.title}>
              <p>Gerada agora a partir da conversa. Células em destaque foram calculadas pelo agente.</p>
            </ReportSection>
            {session.id === "gav" ? (
              <SheetArtifact
                caption="GAV · R$"
                columns={[
                  { key: "unidade", label: "Unidade", width: 170 },
                  { key: "agosto", label: "Agosto", align: "right", format: (v) => formatCurrency(Number(v), { cents: false }) },
                  { key: "setembro", label: "Setembro", align: "right", format: (v) => formatCurrency(Number(v), { cents: false }) },
                  { key: "var", label: "Variação", align: "right", format: (v) => `${Number(v) >= 0 ? "+" : ""}${Number(v).toFixed(1).replace(".", ",")} %` },
                ]}
                rows={gavByUnit.map((r) => ({ ...r, var: ((r.setembro - r.agosto) / r.agosto) * 100 }))}
                changed={gavByUnit.map((_, i) => `${i}:var`)}
              />
            ) : (
              <SheetArtifact
                caption="Execução"
                columns={[
                  { key: "passo", label: "Passo", width: 260 },
                  { key: "tempo", label: "Tempo", align: "right", format: (v) => `${(Number(v) / 1000).toFixed(1).replace(".", ",")} s` },
                  { key: "situacao", label: "Situação" },
                ]}
                rows={fallback}
              />
            )}
          </div>
        );
      }
      return (
        <div className={pad}>
          <ReportSection title={artifact.title}>
            <p>{artifact.kind === "email" ? "Rascunho para revisar. O agente não envia nada sem a sua aprovação." : "Gerado a partir da última resposta e do contexto da sessão."}</p>
          </ReportSection>
          <div className="rounded-xl border border-line bg-surface p-4 text-[14px] leading-relaxed text-ink-soft">{text || "Sem conteúdo ainda."}</div>
        </div>
      );
    }
  }
}
