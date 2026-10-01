import { Archive, CheckCircle2, Clock, Ellipsis, FolderClosed, GitCommitHorizontal, GitPullRequest, Globe, House, Inbox, Pencil, Rocket, Settings, SquarePen, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  AgentAppLayout,
  AgentComposer,
  AnswerCard,
  BottomNav,
  Disclaimer,
  IconRail,
  InputModal,
  ListToggle,
  MessageActions,
  ModelPicker,
  PermissionModeChip,
  ProductMark,
  RunSummary,
  SessionQuickSwitcher,
  SessionSidebar,
  StepGroup,
  ThreadHeader,
  ThreadView,
  Tooltip,
  UserBubble,
  VoiceModeButton,
  VoiceOverlay,
  WorkspaceSwitcher,
  cn,
  notify,
  type MenuEntry,
  type ModelEffort,
  type NavItem,
  type PermissionMode,
  type RailItem,
  type StepItem,
} from "@g4os/ds";
import { codexModels, codexProjects, codexRun, codexSessions, type CodexEntry, type CodexResult, type CodexSession } from "./data/codex";
import { frameHref, useFrameParam } from "./shells/frame-route";

export const meta = {
  title: "Agente de código (tarefas longas)",
  description: "Estilo Codex: sessões agrupadas por repositório, lista recolhível (⌘\\), conversa em fluxo com “Trabalhou por …”, histórico longo recolhido, resultados (commit, deploy, testes), permissão e modelo no campo.",
  category: "IA",
  height: 880,
  order: 3,
  concept: {
    goal: "Acompanhar um agente que trabalha por minutos em um repositório (corrige, testa, publica): ver o que ele fez, o resultado verificável e decidir o próximo passo sem se perder em conversas longas.",
    patterns: [
      "Anatomia Conversa (AgentAppLayout): trilho + lista por projeto recolhível (⌘\\) + conversa; troca rápida de sessão quando a lista está fechada",
      "Lista “Por projeto”: pastas = repositórios, sessões aninhadas, “Mostrar mais”, ⋯ por projeto",
      "Execução como linha discreta (RunSummary divider): “Trabalhou por 1 min 1 s ›” abre os passos",
      "Histórico longo recolhido no topo (ThreadView collapseBefore): só o final importa",
      "Resultados verificáveis em lista (commit, deploy, testes) com links, não só texto",
      "Permissão sempre visível no campo; “Acesso total” em âmbar e com confirmação",
    ],
    adapt: [
      "Agentes de dados (consultas, notebooks): projetos viram bases; resultados viram tabelas e gráficos",
      "Operações (deploys, incidentes): resultados com status ok/falhou e link do painel",
      "Use “Sessões com artefatos” quando a entrega principal for um documento e não uma ação",
    ],
    avoid: ["Esconder que o agente tem acesso total", "Mostrar o histórico inteiro sempre aberto", "Resultado sem evidência (hash, link, contagem de testes)"],
  },
} as const;

const here = frameHref("ai-codex");
const rail: RailItem[][] = [
  [
    { href: here, label: "Sessões", icon: Inbox },
    { href: frameHref("ai-sessions-empty"), label: "Início", icon: House },
    { href: frameHref("ai-agent-run"), label: "Execuções", icon: Clock },
    { href: frameHref("ai-projects"), label: "Projetos", icon: FolderClosed },
  ],
];
const tabs: NavItem[] = [
  { href: here, label: "Sessões", icon: Inbox },
  { href: frameHref("ai-sessions-empty"), label: "Início", icon: House },
  { href: frameHref("ai-agent-run"), label: "Execuções", icon: Clock },
  { href: frameHref("ai-projects"), label: "Projetos", icon: FolderClosed },
];

let seq = 0;
const uid = (p: string) => `${p}-${Date.now().toString(36)}-${++seq}`;
const isMobile = () => typeof window !== "undefined" && window.matchMedia("(max-width: 767.98px)").matches;

const resultIcon: Record<CodexResult["kind"], typeof Rocket> = { commit: GitCommitHorizontal, deploy: Rocket, tests: CheckCircle2, pr: GitPullRequest, link: Globe };

/** Lista de resultados verificáveis (commit, deploy, testes) de uma execução. */
function Results({ items }: { items: CodexResult[] }) {
  return (
    <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
      {items.map((r, i) => {
        const Icon = resultIcon[r.kind];
        return (
          <li key={i} className="flex items-start gap-2 text-[15px] leading-relaxed">
            <Icon className={cn("mt-[5px] h-4 w-4 shrink-0", r.ok ? "text-ok" : "text-muted")} aria-hidden />
            <span className="min-w-0">
              {r.href ? (
                <a
                  href={r.href}
                  onClick={(e) => {
                    e.preventDefault();
                    notify(`Exemplo: abriria ${r.text}`, undefined, "info");
                  }}
                >
                  {r.text}
                </a>
              ) : (
                r.text
              )}
              {r.code && (
                <>
                  {" "}
                  <code>{r.code}</code>
                  {r.kind === "commit" && (
                    <>
                      {" "}e push em <code>main</code>.
                    </>
                  )}
                </>
              )}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export default function AiCodex() {
  const initialId = useFrameParam("id", "permissoes");
  const [list, setList] = useState<CodexSession[]>(codexSessions);
  const [activeId, setActiveId] = useState(initialId);
  const [mobileView, setMobileView] = useState<"list" | "main">(useFrameParam("id") ? "main" : "list");
  const [projects, setProjects] = useState(codexProjects);
  const [listMode, setListMode] = useState<"recent" | "projects">("projects");
  const [draft, setDraft] = useState("");
  const [permission, setPermission] = useState<PermissionMode>("total");
  const [model, setModel] = useState("sol-light");
  const [effort, setEffort] = useState<ModelEffort>("leve");
  const [voice, setVoice] = useState(false);
  const [renaming, setRenaming] = useState<{ kind: "session" | "project"; id: string } | null>(null);
  const [running, setRunning] = useState<{ sessionId: string; entryId: string; startedAt: number; steps: StepItem[]; shown: number; full: string[] } | null>(null);
  const timers = useRef<number[]>([]);
  const active = list.find((s) => s.id === activeId) ?? list[0];

  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  useEffect(() => {
    if (initialId) setActiveId(initialId);
  }, [initialId]);

  const patch = useCallback((id: string, p: Partial<CodexSession> | ((s: CodexSession) => Partial<CodexSession>)) => {
    setList((l) => l.map((s) => (s.id === id ? { ...s, ...(typeof p === "function" ? p(s) : p) } : s)));
  }, []);

  const select = (id: string) => {
    setActiveId(id);
    setMobileView("main");
    const s = list.find((x) => x.id === id);
    if (s?.status === "ready") patch(id, { status: "idle" });
  };

  const newSession = (projectId?: string) => {
    const s: CodexSession = { id: uid("s"), title: "Nova sessão", time: "agora", status: "idle", day: "Hoje", projectId: projectId ?? active?.projectId, thread: [] };
    setList((l) => [s, ...l]);
    select(s.id);
  };

  const send = (text: string) => {
    const t = text.trim();
    if (!t || !active || running) return;
    const sid = active.id;
    const run = codexRun(t);
    const entryId = uid("a");
    patch(sid, (s) => ({
      title: s.thread.length ? s.title : t.length > 48 ? `${t.slice(0, 46)}…` : t,
      status: "working",
      time: "agora",
      thread: [...s.thread, { kind: "user", id: uid("u"), text: t }],
    }));
    setDraft("");
    const startedAt = Date.now();
    setRunning({ sessionId: sid, entryId, startedAt, steps: [], shown: 0, full: run.paragraphs });
    // Passos aparecem um a um; depois a resposta "escreve" e os resultados entram.
    run.steps.forEach((st, i) => {
      timers.current.push(
        window.setTimeout(() => setRunning((r) => (r && r.entryId === entryId ? { ...r, steps: [...r.steps.map((x) => ({ ...x, status: "done" as const })), { ...st, status: "running" }] } : r)), 500 + i * 900),
      );
    });
    const total = run.paragraphs.join("\n").length;
    const begin = 500 + run.steps.length * 900;
    for (let c = 0; c <= total; c += 6) timers.current.push(window.setTimeout(() => setRunning((r) => (r && r.entryId === entryId ? { ...r, shown: c } : r)), begin + c * 8));
    timers.current.push(
      window.setTimeout(() => {
        const durationMs = Date.now() - startedAt;
        patch(sid, (s) => ({
          status: s.id === activeIdRef.current ? "idle" : "ready",
          thread: [...s.thread, { kind: "answer", id: entryId, durationMs, steps: run.steps, paragraphs: run.paragraphs, results: run.results }],
        }));
        setRunning(null);
      }, begin + total * 8 + 300),
    );
  };
  const activeIdRef = useRef(activeId);
  activeIdRef.current = activeId;

  const stop = () => {
    if (!running) return;
    timers.current.forEach(clearTimeout);
    timers.current = [];
    const { sessionId, entryId, startedAt, steps } = running;
    patch(sessionId, (s) => ({ status: "idle", thread: [...s.thread, { kind: "answer", id: entryId, durationMs: Date.now() - startedAt, steps, paragraphs: ["Interrompido a pedido. Nada foi enviado."] }] }));
    setRunning(null);
    notify("Execução interrompida", undefined, "info");
  };

  const itemActions = (s: CodexSession): MenuEntry[] => [
    { label: "Renomear", icon: <Pencil className="h-4 w-4" />, onSelect: () => setRenaming({ kind: "session", id: s.id }) },
    { label: "Arquivar", icon: <Archive className="h-4 w-4" />, onSelect: () => (patch(s.id, { archived: true }), notify("Sessão arquivada", () => patch(s.id, { archived: false }))) },
    { type: "separator" },
    {
      label: "Excluir",
      icon: <Trash2 className="h-4 w-4" />,
      tone: "danger",
      onSelect: () => {
        setList((l) => l.filter((x) => x.id !== s.id));
        notify("Sessão excluída", () => setList((l) => [s, ...l]));
      },
    },
  ];

  /* ------------------------------ Conversa ------------------------------ */

  const entries: CodexEntry[] = active?.thread ?? [];
  const lastAnswer = [...entries].reverse().find((e) => e.kind === "answer")?.id;
  const nodes: ReactNode[] = entries.map((e) =>
    e.kind === "user" ? (
      <UserBubble key={e.id} id={`msg-${e.id}`}>
        {e.text}
      </UserBubble>
    ) : (
      <AnswerCard
        key={e.id}
        id={`msg-${e.id}`}
        variant="flow"
        actionsVisible={e.id === lastAnswer ? "always" : "hover"}
        run={
          e.durationMs != null && (
            <RunSummary variant="divider" status="done" durationMs={e.durationMs} steps={e.steps?.length}>
              {e.steps && <StepGroup variant="line" title={`${e.steps.length} passos`} steps={e.steps} defaultOpen />}
            </RunSummary>
          )
        }
        actions={
          <MessageActions
            size="xs"
            text={[...e.paragraphs, ...(e.results ?? []).map((r) => `- ${r.text}${r.code ? ` ${r.code}` : ""}`)].join("\n")}
            onFeedback={(v) => notify(v === "up" ? "Obrigado pelo retorno" : "Vamos melhorar: conte o que faltou", undefined, "info")}
            onShare={() => {
              navigator.clipboard?.writeText(`${location.href}#msg-${e.id}`).catch(() => undefined);
              notify("Link da resposta copiado");
            }}
          />
        }
      >
        {e.paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
        {e.results && <Results items={e.results} />}
      </AnswerCard>
    ),
  );
  if (running && running.sessionId === active?.id) {
    const text = running.full.join("\n").slice(0, running.shown);
    nodes.push(
      <AnswerCard
        key="running"
        variant="flow"
        streaming={running.shown > 0}
        run={
          <RunSummary variant="divider" status="running" startedAt={running.startedAt} defaultOpen>
            {running.steps.length ? <StepGroup variant="line" title="Passos" steps={running.steps} running defaultOpen /> : undefined}
          </RunSummary>
        }
      >
        {text ? text.split("\n").map((p, i) => <p key={i}>{p}</p>) : null}
      </AnswerCard>,
    );
  }

  const projectName = projects.find((p) => p.id === active?.projectId)?.name;

  const main = active ? (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-page">
      <ThreadHeader
        title={
          <span className="flex min-w-0 items-center gap-2">
            <FolderClosed className="h-4 w-4 shrink-0 text-muted" aria-hidden />
            {projectName && <span className="hidden shrink-0 font-normal text-muted sm:inline">{projectName} /</span>}
            <span className="truncate">{active.title}</span>
          </span>
        }
        menu={[
          { label: "Renomear", icon: <Pencil className="h-4 w-4" />, onSelect: () => setRenaming({ kind: "session", id: active.id }) },
          { label: "Arquivar", icon: <Archive className="h-4 w-4" />, onSelect: () => (patch(active.id, { archived: true }), notify("Sessão arquivada", () => patch(active.id, { archived: false }))) },
        ]}
        onBack={() => setMobileView("list")}
        backLabel="Voltar para sessões"
        leading={
          <>
            <ListToggle label="sessões" />
            <SessionQuickSwitcher
              sessions={list
                .filter((x) => !x.archived)
                .sort((a, b) => projects.findIndex((p) => p.id === a.projectId) - projects.findIndex((p) => p.id === b.projectId))
                .map((x) => ({ id: x.id, title: x.title, time: x.time, status: x.status, group: projects.find((p) => p.id === x.projectId)?.name }))}
              activeId={active.id}
              onSelect={select}
            />
          </>
        }
        actions={[{ id: "more", label: "Mais ações", icon: <Ellipsis />, onClick: () => notify("Exemplo: abriria abrir no editor, ver diff, copiar link", undefined, "info"), hideOnMobile: true }]}
      />
      <ThreadView
        follow={`${entries.length}:${running?.shown ?? 0}:${running?.steps.length ?? 0}`}
        resetKey={active.id}
        collapseBefore={nodes.length > 8 ? nodes.length - 5 : 0}
        minimap={entries.map((e) => ({ id: `msg-${e.id}`, role: e.kind === "user" ? "user" : "assistant", preview: e.kind === "user" ? e.text : e.paragraphs[0] }))}
      >
        {nodes.length ? (
          nodes
        ) : (
          <div className="py-16 text-center">
            <p className="m-0 text-[20px] font-semibold tracking-tight">O que vamos fazer em {projectName ?? "este projeto"}?</p>
            <p className="m-0 mt-1.5 text-[13.5px] text-muted">Descreva a tarefa. O agente trabalha, testa e mostra o que mudou antes de publicar.</p>
          </div>
        )}
      </ThreadView>
      <div className="relative shrink-0 px-3 pb-3 pt-1 sm:px-8">
        <VoiceModeButton onClick={() => setVoice(true)} className="absolute -top-14 right-4 sm:hidden" />
        <div className="mx-auto flex max-w-[828px] items-end gap-3">
          <div className="min-w-0 flex-1">
          <AgentComposer
            value={draft}
            onChange={setDraft}
            onSubmit={send}
            onStop={stop}
            busy={!!running}
            placeholder="Peça qualquer coisa ao agente"
            attachOptions={[
              { label: "Arquivo do repositório", icon: <FolderClosed className="h-4 w-4" />, onSelect: () => notify("Exemplo: escolheria um arquivo do repositório", undefined, "info") },
              { label: "Issue ou PR", icon: <GitPullRequest className="h-4 w-4" />, onSelect: () => notify("Exemplo: buscaria uma issue ou PR", undefined, "info") },
            ]}
            leading={
              <PermissionModeChip
                value={permission}
                onChange={(m) => {
                  setPermission(m);
                  notify(m === "total" ? "Acesso total: o agente faz commit, push e deploy sem perguntar" : m === "ler" ? "Somente leitura" : "O agente vai pedir aprovação antes de commit, push e deploy", undefined, "info");
                }}
              />
            }
            trailing={<ModelPicker models={codexModels} value={model} onChange={setModel} effort={effort} onEffortChange={setEffort} />}
            onTranscribe={(ms) => (ms > 600 ? "Roda os testes de novo e me diz se algo ficou instável" : "")}
          />
          <Disclaimer className="mt-2">O agente usa IA e pode errar. Revise o que muda antes de publicar.</Disclaimer>
          </div>
          <VoiceModeButton onClick={() => setVoice(true)} className="mb-7 hidden shrink-0 sm:grid" />
        </div>
      </div>
    </div>
  ) : (
    <div className="grid flex-1 place-items-center text-[13.5px] text-muted">Selecione ou crie uma sessão.</div>
  );

  const sessionList = (
    <SessionSidebar
      density="clean"
      title="Agente de código"
      sessions={list}
      activeId={mobileView === "list" && isMobile() ? undefined : active?.id}
      onSelect={select}
      onNew={() => newSession()}
      itemActions={itemActions}
      projects={projects}
      listMode={listMode}
      onListModeChange={setListMode}
      projectLimit={4}
      projectActions={(p) => [
        { label: "Nova sessão no projeto", icon: <SquarePen className="h-4 w-4" />, onSelect: () => newSession(p.id) },
        { label: "Renomear projeto", icon: <Pencil className="h-4 w-4" />, onSelect: () => setRenaming({ kind: "project", id: p.id }) },
        { type: "separator" },
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
        <WorkspaceSwitcher
          name="G4 OS · Engenharia"
          items={[
            { type: "label", label: "Workspaces" },
            { type: "checkbox", label: "G4 OS · Engenharia", checked: true, onCheckedChange: () => undefined },
            { type: "checkbox", label: "Pessoal", checked: false, onCheckedChange: () => notify("Exemplo: trocaria de workspace", undefined, "info") },
          ]}
        />
      }
    />
  );

  const renameTarget = renaming?.kind === "project" ? projects.find((p) => p.id === renaming.id)?.name : list.find((s) => s.id === renaming?.id)?.title;

  return (
    <>
      <AgentAppLayout
        storageKey="ai-codex"
        rail={
          <IconRail
            groups={rail}
            currentPath={here}
            mark={<ProductMark size={30} />}
            footer={
              <Tooltip content="Configurações" side="right">
                <a href={frameHref("settings-profile")} aria-label="Configurações" className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-ink/[0.05] hover:text-ink">
                  <Settings className="h-[17px] w-[17px]" />
                </a>
              </Tooltip>
            }
          />
        }
        list={sessionList}
        main={main}
        mobileView={mobileView}
        mobileNav={<BottomNav items={tabs} currentPath={here} />}
      />
      <InputModal
        open={!!renaming}
        onClose={() => setRenaming(null)}
        title={renaming?.kind === "project" ? "Renomear projeto" : "Renomear sessão"}
        submitLabel="Renomear"
        initialValue={renameTarget}
        placeholder="Nome"
        onSubmit={(v) => {
          if (renaming?.kind === "project") setProjects((ps) => ps.map((p) => (p.id === renaming.id ? { ...p, name: v } : p)));
          else if (renaming) patch(renaming.id, { title: v });
          setRenaming(null);
          notify("Renomeado");
        }}
      />
      <VoiceOverlay
        open={voice}
        agentName="Agente de código"
        transcript={["Você: Os testes de agenda ainda estão instáveis?", "Agente: Dois dependem do fuso. Fixei o fuso nos testes; a suíte passou 3 vezes seguidas."]}
        onClose={(lines) => {
          setVoice(false);
          if (lines.length && active) {
            patch(active.id, (s) => ({ thread: [...s.thread, { kind: "user", id: uid("v"), text: "🎙 Conversa por voz" }, { kind: "answer", id: uid("va"), paragraphs: lines }] }));
            notify("Transcrição adicionada à sessão");
          }
        }}
      />
    </>
  );
}
