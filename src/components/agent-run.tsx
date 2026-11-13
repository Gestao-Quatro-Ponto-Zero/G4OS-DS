"use client";

import {
  AlertTriangle,
  Check,
  ChevronDown,
  CircleDashed,
  FileCode2,
  FileText,
  FlaskConical,
  ArrowUpRight,
  Hand,
  ListChecks,
  Loader2,
  PencilLine,
  RotateCcw,
  Search,
  Sparkles,
  Wrench,
  X,
} from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "../lib/cn";
import { parseDiff } from "../lib/diff";
import { formatNumber } from "../lib/format";
import { useReducedMotion, useVisibleInterval } from "../lib/motion";
import { JsonView, SystemMessage, formatDuration } from "./ai";
import { DiffView } from "./code";
import { TextareaField } from "./inputs";
import { Button, IconButton } from "./primitives";

/* ------------------------------------------------------------------ */
/* Tipos                                                               */
/* ------------------------------------------------------------------ */

/** O que o agente fez naquele passo. Define o ícone. */
export type RunStepKind = "plan" | "read" | "search" | "edit" | "test" | "tool";
/** Situação de um passo. `running` brilha (`.ds-shimmer`) enquanto acontece. */
export type RunStepStatus = "pending" | "running" | "done" | "error";

/** Um passo da execução: texto curto no particípio ("Leu src/api/rotas.ts"), duração e, se for ferramenta, entrada e saída. */
export type RunStep = {
  id: string;
  kind: RunStepKind;
  /** Texto do passo. No gerúndio enquanto roda fica natural ("Lendo…"), mas um texto só serve aos dois. */
  label: string;
  status?: RunStepStatus;
  durationMs?: number;
  /** Chamada de ferramenta: abre no lugar mostrando entrada e saída. */
  tool?: { name: string; input?: unknown; output?: unknown; error?: string };
  /** Detalhe livre que abre no lugar (raciocínio, trecho lido). */
  detail?: ReactNode;
};

/** Um arquivo da mudança proposta, como diff unificado. */
export type RunChangeFile = { path: string; diff: string };
/** A mudança que o agente quer aplicar e que espera aprovação. */
export type RunChange = { id: string; title: string; summary?: ReactNode; files: RunChangeFile[] };
/** Uma verificação ao fim da execução (testes, lint, conferência de saldo). */
export type RunCheck = { label: string; status: "passed" | "failed"; detail?: string };
/** O que a execução entregou. Os arquivos vêm da mudança aprovada quando `files` não vem. */
export type RunOutcome = {
  summary?: ReactNode;
  files?: { path: string; added: number; removed: number }[];
  checks?: RunCheck[];
  /** Rótulo do botão principal: "Abrir pull request", "Ver lançamentos". */
  openLabel?: string;
  /** Ícone do botão principal (ex.: `<GitPullRequest />`). Padrão: seta para fora. */
  openIcon?: ReactNode;
};

/** Situação da execução inteira. */
export type AgentRunStatus = "running" | "waiting" | "done" | "failed";

/** Estado controlado do AgentRunCard. */
export type AgentRunState = {
  status: AgentRunStatus;
  elapsedMs: number;
  steps: RunStep[];
  /** Mudança esperando decisão. Com ela, o status deve ser `waiting`. */
  approval?: RunChange;
  result?: RunOutcome;
  /** Por que falhou, em linguagem de gente. */
  error?: ReactNode;
};

/** Roteiro do modo demonstração: passos, onde o portão de aprovação para a execução e o resultado. */
export type AgentRunScript = {
  steps: RunStep[];
  /** A execução para para aprovação antes do passo com este índice (os passos seguintes aplicam e verificam). */
  approvalAt?: number;
  approval?: RunChange;
  result: RunOutcome;
};

const statusMeta: Record<AgentRunStatus, { label: string; dot: string; text: string }> = {
  running: { label: "Rodando", dot: "bg-blue", text: "text-ink-soft" },
  waiting: { label: "Aguardando você", dot: "bg-amber", text: "text-ink" },
  done: { label: "Concluída", dot: "bg-ok", text: "text-ink-soft" },
  failed: { label: "Falhou", dot: "bg-rose", text: "text-rose" },
};

const kindIcon: Record<RunStepKind, ReactNode> = {
  plan: <ListChecks />,
  read: <FileText />,
  search: <Search />,
  edit: <PencilLine />,
  test: <FlaskConical />,
  tool: <Wrench />,
};
const kindLabel: Record<RunStepKind, string> = { plan: "Planejar", read: "Ler", search: "Buscar", edit: "Editar", test: "Testar", tool: "Ferramenta" };

const clock = (ms: number) => {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

function Counts({ added, removed }: { added: number; removed: number }) {
  return (
    <span className="shrink-0 font-mono text-[12px] tabular-nums" aria-label={`${added} linhas adicionadas, ${removed} removidas`}>
      <span className="text-ok">+{added}</span>
      {removed > 0 && <span className="text-rose"> −{removed}</span>}
    </span>
  );
}

function fileCounts(file: RunChangeFile) {
  const parsed = parseDiff(file.diff);
  return { path: file.path, added: parsed?.reduce((n, f) => n + f.added, 0) ?? 0, removed: parsed?.reduce((n, f) => n + f.removed, 0) ?? 0 };
}

/* ------------------------------------------------------------------ */
/* RunStepList                                                         */
/* ------------------------------------------------------------------ */

function StepRow({ step, open, onToggle }: { step: RunStep; open: boolean; onToggle: () => void }) {
  const reduce = useReducedMotion();
  const id = useId();
  const status = step.status ?? "done";
  const expandable = !!step.tool || step.detail != null;
  const running = status === "running";
  const body = (
    <>
      <span aria-hidden className={cn("grid h-5 w-5 shrink-0 place-items-center [&_svg]:h-4 [&_svg]:w-4", running ? "text-ink" : "text-muted")}>
        {kindIcon[step.kind]}
      </span>
      <span className="sr-only">{kindLabel[step.kind]}: </span>
      <span className={cn("min-w-0 flex-1 text-[13.5px] [overflow-wrap:anywhere] sm:truncate", status === "pending" ? "text-muted" : "text-ink", running && !reduce && "ds-shimmer")}>{step.label}</span>
      {step.durationMs != null && status !== "pending" && status !== "running" && <span className="shrink-0 text-[12px] tabular-nums text-muted">{formatDuration(step.durationMs)}</span>}
      <span className="grid h-4 w-4 shrink-0 place-items-center [&_svg]:h-4 [&_svg]:w-4">
        {status === "done" ? (
          <Check className="text-ok" aria-label="Concluído" />
        ) : status === "error" ? (
          <X className="text-rose" aria-label="Falhou" />
        ) : running ? (
          <Loader2 className="text-muted motion-safe:animate-spin" aria-label="Em andamento" />
        ) : (
          <CircleDashed className="text-muted" aria-label="Na fila" />
        )}
      </span>
    </>
  );
  return (
    <li className="min-w-0">
      {expandable ? (
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={onToggle}
          className="flex w-full min-w-0 items-center gap-3 rounded-lg px-2 py-1.5 text-left outline-none hover:bg-soft focus-visible:ring-2 focus-visible:ring-muted/40"
        >
          {body}
          <ChevronDown aria-hidden className={cn("h-4 w-4 shrink-0 text-muted transition-transform duration-150", open && "rotate-180")} />
        </button>
      ) : (
        <div className="flex min-w-0 items-center gap-3 px-2 py-1.5">
          {body}
          <span aria-hidden className="w-4 shrink-0" />
        </div>
      )}
      {expandable && open && (
        <div id={id} className="mb-2 ml-10 mr-2 mt-1 flex min-w-0 flex-col gap-2.5">
          {step.detail != null && <div className="text-[12.5px] leading-relaxed text-ink-soft">{step.detail}</div>}
          {step.tool && (
            <>
              <p className="m-0 font-mono text-[11.5px] text-muted">{step.tool.name}</p>
              {step.tool.input !== undefined && (
                <div className="flex flex-col gap-1">
                  <p className="m-0 text-[11px] font-medium uppercase tracking-[0.08em] text-muted">Entrada</p>
                  <JsonView value={step.tool.input} maxHeight={180} />
                </div>
              )}
              {step.tool.error ? (
                <SystemMessage tone="error" title="Erro na ferramenta">
                  {step.tool.error}
                </SystemMessage>
              ) : (
                step.tool.output !== undefined && (
                  <div className="flex flex-col gap-1">
                    <p className="m-0 text-[11px] font-medium uppercase tracking-[0.08em] text-muted">Saída</p>
                    <JsonView value={step.tool.output} maxHeight={180} />
                  </div>
                )
              )}
            </>
          )}
        </div>
      )}
    </li>
  );
}

/**
 * Passos de uma execução de agente, um por linha: ícone do tipo (planejar, ler, buscar, editar,
 * testar, ferramenta), texto, duração e check. O passo em andamento brilha (`.ds-shimmer`, parado
 * com movimento reduzido) e é anunciado ao leitor de tela; passo de ferramenta ou com `detail` abre
 * no lugar com entrada e saída.
 */
export function RunStepList({ steps, label = "Passos da execução", className }: { steps: RunStep[]; /** Nome acessível da lista. */ label?: string; className?: string }) {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const current = steps.findIndex((s) => s.status === "running");
  const live = current >= 0 ? `Passo ${current + 1} de ${steps.length}: ${steps[current].label}` : "";
  return (
    <div className={cn("min-w-0", className)}>
      <ol aria-label={label} className="m-0 flex list-none flex-col p-0">
        {steps.map((s) => (
          <StepRow key={s.id} step={s} open={!!open[s.id]} onToggle={() => setOpen((o) => ({ ...o, [s.id]: !o[s.id] }))} />
        ))}
      </ol>
      <p aria-live="polite" className="sr-only">
        {live}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* DiffApproval                                                        */
/* ------------------------------------------------------------------ */

/**
 * Portão de aprovação de uma mudança proposta pelo agente: resumo, diff com uma aba por arquivo
 * (com +/−), "Aprovar e aplicar" e "Devolver com comentário" (abre o campo do motivo). Nada é
 * aplicado sem a decisão. Recebe o foco ao aparecer (`autoFocus`) se a pessoa não estava em outro
 * controle, para quem usa teclado ou leitor de tela saber que a execução parou.
 */
export function DiffApproval({
  change,
  onApprove,
  onReject,
  busy = false,
  autoFocus = false,
  className,
}: {
  change: RunChange;
  onApprove?: (change: RunChange) => void;
  /** Devolve ao agente com o comentário (obrigatório). */
  onReject?: (change: RunChange, reason: string) => void;
  /** Aplicando: os botões ficam ocupados. */
  busy?: boolean;
  /** Leva o foco ao portão quando ele aparece. */
  autoFocus?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const tabsId = useId();
  const [tab, setTab] = useState(0);
  const [composing, setComposing] = useState(false);
  const [reason, setReason] = useState("");
  const counts = useMemo(() => change.files.map(fileCounts), [change.files]);
  const file = change.files[Math.min(tab, change.files.length - 1)];

  useEffect(() => {
    if (!autoFocus) return;
    const el = ref.current;
    const active = typeof document !== "undefined" ? document.activeElement : null;
    // Só toma o foco se a pessoa não estava num controle fora do cartão.
    if (el && (!active || active === document.body || el.closest("[data-agent-run]")?.contains(active))) el.focus({ preventScroll: true });
  }, [autoFocus, change.id]);

  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    const n = change.files.length;
    const next = e.key === "ArrowRight" ? (tab + 1) % n : e.key === "ArrowLeft" ? (tab - 1 + n) % n : e.key === "Home" ? 0 : e.key === "End" ? n - 1 : -1;
    if (next < 0) return;
    e.preventDefault();
    setTab(next);
    (e.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>("[role=tab]")[next])?.focus();
  };

  return (
    <section ref={ref} tabIndex={-1} aria-label={`Aprovação: ${change.title}`} className={cn("flex min-w-0 flex-col gap-3 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-muted/40", className)}>
      <div className="flex min-w-0 items-start gap-3 px-2">
        <span aria-hidden className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center text-amber [&_svg]:h-4 [&_svg]:w-4">
          <Hand />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h3 className="m-0 text-[13.5px] font-medium text-ink">{change.title}</h3>
          {change.summary != null && <p className="m-0 text-[13px] leading-relaxed text-ink-soft">{change.summary}</p>}
        </div>
      </div>
      <div className="flex min-w-0 flex-col gap-0 sm:ml-10">
        {change.files.length > 1 && (
          <div role="tablist" aria-label="Arquivos alterados" className="flex min-w-0 gap-1 overflow-x-auto pb-2">
            {counts.map((c, i) => (
              <button
                key={c.path}
                type="button"
                role="tab"
                id={`${tabsId}-t${i}`}
                aria-selected={i === tab}
                aria-controls={`${tabsId}-p`}
                tabIndex={i === tab ? 0 : -1}
                onClick={() => setTab(i)}
                onKeyDown={onTabKey}
                className={cn(
                  "inline-flex shrink-0 items-center gap-2 rounded-md border px-2.5 py-1 font-mono text-[12px] outline-none focus-visible:ring-2 focus-visible:ring-muted/40",
                  i === tab ? "border-line-strong bg-surface text-ink" : "border-transparent text-muted hover:bg-soft hover:text-ink",
                )}
              >
                {c.path.split("/").pop()}
                <Counts added={c.added} removed={c.removed} />
              </button>
            ))}
          </div>
        )}
        <div id={`${tabsId}-p`} role={change.files.length > 1 ? "tabpanel" : undefined} aria-labelledby={change.files.length > 1 ? `${tabsId}-t${tab}` : undefined} className="min-w-0">
          {file && <DiffView diff={file.diff} title={file.path} maxHeight={320} />}
        </div>
      </div>
      {composing ? (
        <div className="flex min-w-0 flex-col gap-2 sm:ml-10">
          <TextareaField label="O que o agente deve mudar" value={reason} onChange={setReason} minRows={2} maxRows={6} placeholder="Ex.: use 100 requisições por minuto para clientes do plano Empresa" autoFocus />
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              disabled={!reason.trim() || busy}
              disabledReason={!reason.trim() ? "Escreva o que mudar" : undefined}
              onClick={() => {
                onReject?.(change, reason.trim());
                setComposing(false);
                setReason("");
              }}
            >
              Devolver ao agente
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setComposing(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2 sm:ml-10">
          <Button size="sm" disabled={busy} onClick={() => onApprove?.(change)}>
            <Check /> Aprovar e aplicar
          </Button>
          <Button size="sm" variant="ghost" disabled={busy} onClick={() => setComposing(true)}>
            Devolver com comentário
          </Button>
          <span className="text-[12px] text-muted">Nada é aplicado sem a sua aprovação.</span>
        </div>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* RunResult                                                           */
/* ------------------------------------------------------------------ */

/** Fim de uma execução: arquivos alterados com +/−, verificações que passaram, abrir o resultado e executar de novo. */
export function RunResult({ result, onOpen, onRestart, className }: { result: RunOutcome; onOpen?: () => void; onRestart?: () => void; className?: string }) {
  const files = result.files ?? [];
  const checks = result.checks ?? [];
  const failed = checks.filter((c) => c.status === "failed").length;
  return (
    <section aria-label="Resultado da execução" className={cn("flex min-w-0 flex-col gap-3", className)}>
      {result.summary != null && <p className="m-0 text-[13.5px] leading-relaxed text-ink">{result.summary}</p>}
      {files.length > 0 && (
        <div className="flex min-w-0 flex-col gap-1">
          <h4 className="m-0 text-[11px] font-medium uppercase tracking-[0.08em] text-muted">
            {files.length} {files.length === 1 ? "arquivo alterado" : "arquivos alterados"}
          </h4>
          <ul className="m-0 flex list-none flex-col overflow-hidden rounded-lg border border-line p-0">
            {files.map((f) => (
              <li key={f.path} className="flex min-w-0 items-center gap-2.5 border-b border-line px-3 py-2 last:border-b-0">
                <FileCode2 aria-hidden className="h-4 w-4 shrink-0 text-muted" />
                <span className="min-w-0 flex-1 truncate font-mono text-[12.5px] text-ink">{f.path}</span>
                <Counts added={f.added} removed={f.removed} />
              </li>
            ))}
          </ul>
        </div>
      )}
      {checks.length > 0 && (
        <div className="flex min-w-0 flex-col gap-1">
          <h4 className="m-0 text-[11px] font-medium uppercase tracking-[0.08em] text-muted">{failed ? `${failed} de ${checks.length} verificações falharam` : `${checks.length} verificações passaram`}</h4>
          <ul className="m-0 flex list-none flex-col gap-1 p-0">
            {checks.map((c) => (
              <li key={c.label} className="flex min-w-0 items-start gap-2 text-[13px]">
                {c.status === "passed" ? <Check className="mt-0.5 h-4 w-4 shrink-0 text-ok" aria-label="Passou" /> : <X className="mt-0.5 h-4 w-4 shrink-0 text-rose" aria-label="Falhou" />}
                <span className="min-w-0 text-ink">
                  {c.label}
                  {c.detail && <span className="text-muted"> · {c.detail}</span>}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {(onOpen || onRestart) && (
        <div className="flex flex-wrap gap-2">
          {onOpen && (
            <Button size="sm" onClick={onOpen}>
              {result.openIcon ?? <ArrowUpRight />} {result.openLabel ?? "Ver mudança"}
            </Button>
          )}
          {onRestart && (
            <Button size="sm" variant="ghost" onClick={onRestart}>
              <RotateCcw /> Executar de novo
            </Button>
          )}
        </div>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Modo demonstração                                                   */
/* ------------------------------------------------------------------ */

type Play = { index: number; inStep: number; elapsed: number; phase: "running" | "waiting" | "done"; extra: RunStep[]; approved: boolean };
const TICK = 100;

/** Executa o roteiro com o relógio da aba (só anda com ela visível). Movimento reduzido ou sem autoPlay: pula para cada parada. */
function useScriptedRun(script: AgentRunScript | undefined, animate: boolean) {
  const gate = script?.approval ? Math.min(script.approvalAt ?? script.steps.length, script.steps.length) : -1;
  const sumUntil = (end: number) => (script?.steps ?? []).slice(0, end).reduce((n, s) => n + (s.durationMs ?? 1000), 0);
  const initial = (): Play =>
    animate || !script
      ? { index: 0, inStep: 0, elapsed: 0, phase: "running", extra: [], approved: false }
      : gate >= 0
        ? { index: gate, inStep: 0, elapsed: sumUntil(gate), phase: "waiting", extra: [], approved: false }
        : { index: script.steps.length, inStep: 0, elapsed: sumUntil(script.steps.length), phase: "done", extra: [], approved: true };
  const [play, setPlay] = useState<Play>(initial);

  // Sequência: passos do roteiro até o portão, passos extras (revisões), passos depois do portão.
  const order = useMemo(() => {
    if (!script) return [];
    const before = gate >= 0 ? script.steps.slice(0, gate) : script.steps;
    const after = gate >= 0 ? script.steps.slice(gate) : [];
    return [...before, ...play.extra, ...after];
  }, [script, gate, play.extra]);
  const gateAt = gate >= 0 ? gate + play.extra.length : -1;

  useVisibleInterval(
    () =>
      setPlay((p) => {
        if (p.phase !== "running") return p;
        const step = order[p.index];
        if (!step) return { ...p, phase: "done" };
        const inStep = p.inStep + TICK;
        const elapsed = p.elapsed + TICK;
        if (inStep < (step.durationMs ?? 1000)) return { ...p, inStep, elapsed };
        const index = p.index + 1;
        if (index === gateAt && !p.approved) return { ...p, index, inStep: 0, elapsed, phase: "waiting" };
        if (index >= order.length) return { ...p, index, inStep: 0, elapsed, phase: "done" };
        return { ...p, index, inStep: 0, elapsed };
      }),
    script && animate && play.phase === "running" ? TICK : null,
  );

  const skipTo = (p: Play): Play => {
    if (animate) return p;
    // Sem animação: anda até a próxima parada de uma vez.
    let { index, elapsed } = p;
    const stop = !p.approved && gateAt >= 0 && index < gateAt ? gateAt : order.length;
    while (index < stop) elapsed += order[index++].durationMs ?? 1000;
    return { ...p, index, elapsed, inStep: 0, phase: stop === order.length ? "done" : "waiting" };
  };

  const state: AgentRunState | null = script
    ? {
        status: play.phase,
        elapsedMs: play.elapsed,
        // Só os passos que já chegaram: os concluídos e o que está rodando.
        steps: order.slice(0, play.phase === "running" ? play.index + 1 : play.index).map((s, i) => ({ ...s, status: i < play.index ? "done" : "running" })),
        approval: play.phase === "waiting" ? script.approval : undefined,
        result:
          play.phase === "done"
            ? { ...script.result, files: script.result.files ?? (play.approved && script.approval ? script.approval.files.map(fileCounts) : undefined) }
            : undefined,
      }
    : null;

  return {
    state,
    approve: () => setPlay((p) => skipTo({ ...p, approved: true, phase: p.index >= order.length ? "done" : "running" })),
    reject: (reason: string) =>
      setPlay((p) => {
        const extra: RunStep = { id: `rev-${p.extra.length + 1}`, kind: "edit", label: `Ajustou a mudança: “${reason}”`, durationMs: 2400 };
        // O passo de revisão entra antes do portão; o agente volta a pedir aprovação depois dele.
        return animate
          ? { ...p, extra: [...p.extra, extra], phase: "running" }
          : { ...p, extra: [...p.extra, extra], index: p.index + 1, elapsed: p.elapsed + extra.durationMs!, phase: "waiting" };
      }),
    restart: () => setPlay(initial()),
  };
}

/* ------------------------------------------------------------------ */
/* AgentRunCard                                                        */
/* ------------------------------------------------------------------ */

/**
 * Um cartão que acompanha uma execução de agente do começo ao fim: tarefa, agente e modelo, status
 * (ponto + palavra) e cronômetro; passos que chegam um a um (o atual brilha); portão de aprovação
 * com o diff quando o agente quer escrever (nunca aplica sem aprovação); ao concluir, os passos
 * recolhem numa linha ("9 passos · 41 s") e aparece o resultado. Controlado por `run`, ou em modo
 * demonstração com `script` (anda só com a aba visível; com movimento reduzido mostra cada parada pronta).
 */
export function AgentRunCard({
  title,
  agent,
  model,
  run: controlled,
  script,
  autoPlay = true,
  onApprove,
  onReject,
  onOpenResult,
  onRestart,
  className,
}: {
  /** A tarefa, como a pessoa pediu ("Adicionar limite de requisições na API pública"). */
  title: string;
  /** Nome do agente. */
  agent?: string;
  /** Modelo usado (nome do catálogo do app). */
  model?: string;
  /** Estado controlado: status, tempo, passos, aprovação pendente e resultado. */
  run?: AgentRunState;
  /** Modo demonstração: roteiro simulado quando `run` não vem. */
  script?: AgentRunScript;
  /** No modo demonstração, anda sozinho. `false` mostra cada parada pronta (como movimento reduzido). */
  autoPlay?: boolean;
  onApprove?: (change: RunChange) => void;
  onReject?: (change: RunChange, reason: string) => void;
  /** Abre o resultado (pull request, lançamentos). Mostra o botão principal do resultado. */
  onOpenResult?: () => void;
  /** Executar de novo. No modo demonstração recomeça o roteiro mesmo sem este callback. */
  onRestart?: () => void;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const demo = useScriptedRun(controlled ? undefined : script, autoPlay && !reduce);
  const run = controlled ?? demo.state ?? { status: "running" as const, elapsedMs: 0, steps: [] };
  const [showSteps, setShowSteps] = useState(false);
  const [interacted, setInteracted] = useState(false);
  // O portão que já estava na tela ao montar não toma o foco; o que aparece depois, sim.
  const gateAtMount = useRef(run.status === "waiting");
  useEffect(() => {
    if (run.status !== "waiting") gateAtMount.current = false;
  }, [run.status]);
  const st = statusMeta[run.status];
  const finished = run.status === "done" || run.status === "failed";
  const total = run.steps.reduce((n, s) => n + (s.durationMs ?? 0), 0);
  const restart =
    onRestart || (!controlled && script)
      ? () => {
          onRestart?.();
          if (!controlled) demo.restart();
          setShowSteps(false);
        }
      : undefined;

  const approve = (c: RunChange) => {
    setInteracted(true);
    onApprove?.(c);
    if (!controlled) demo.approve();
  };
  const reject = (c: RunChange, reason: string) => {
    setInteracted(true);
    onReject?.(c, reason);
    if (!controlled) demo.reject(reason);
  };

  return (
    <article data-agent-run aria-label={`Execução: ${title}`} className={cn("flex min-w-0 flex-col overflow-hidden rounded-xl border border-line bg-surface", className)}>
      <header className="flex min-w-0 flex-col gap-1.5 border-b border-line px-4 py-3.5 sm:px-5">
        <div className="flex min-w-0 items-start gap-2">
          <h2 className="m-0 min-w-0 flex-1 text-[15px] font-medium leading-snug text-ink">{title}</h2>
          {restart && !finished && (
            <IconButton label="Recomeçar a execução" size="sm" onClick={restart} className="-mr-1.5 -mt-1">
              <RotateCcw />
            </IconButton>
          )}
        </div>
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px]">
          {(agent || model) && (
            <span className="inline-flex min-w-0 flex-1 items-center gap-1.5 text-ink-soft">
              <Sparkles aria-hidden className="h-3.5 w-3.5 shrink-0 text-accent-deep" />
              <span className="truncate">{[agent, model].filter(Boolean).join(" · ")}</span>
            </span>
          )}
          <span className={cn("ml-auto inline-flex shrink-0 items-center gap-1.5", st.text)} role="status">
            {run.status === "waiting" ? <Hand aria-hidden className="h-3.5 w-3.5 text-amber" /> : run.status === "failed" ? <AlertTriangle aria-hidden className="h-3.5 w-3.5" /> : <span aria-hidden className={cn("h-1.5 w-1.5 rounded-full", st.dot)} />}
            {st.label}
          </span>
          <span className="shrink-0 tabular-nums text-muted" aria-label={`Tempo: ${formatDuration(run.elapsedMs)}`}>
            {clock(run.elapsedMs)}
          </span>
        </div>
      </header>

      <div className="flex min-w-0 flex-col gap-3 px-2 py-3 sm:px-3">
        {finished && run.steps.length > 0 ? (
          <div className="flex min-w-0 flex-col">
            <button
              type="button"
              aria-expanded={showSteps}
              onClick={() => setShowSteps((v) => !v)}
              className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left text-[13px] text-muted outline-none hover:bg-soft hover:text-ink focus-visible:ring-2 focus-visible:ring-muted/40"
            >
              <ListChecks aria-hidden className="h-4 w-4 shrink-0" />
              <span className="flex-1 tabular-nums">
                {formatNumber(run.steps.length)} {run.steps.length === 1 ? "passo" : "passos"} · {formatDuration(total || run.elapsedMs)}
              </span>
              <ChevronDown aria-hidden className={cn("h-4 w-4 shrink-0 transition-transform duration-150", showSteps && "rotate-180")} />
            </button>
            {showSteps && <RunStepList steps={run.steps} />}
          </div>
        ) : (
          run.steps.length > 0 && <RunStepList steps={run.steps} />
        )}

        {run.status === "waiting" && run.approval && <DiffApproval change={run.approval} onApprove={approve} onReject={reject} autoFocus={interacted || !gateAtMount.current} />}

        {run.status === "failed" && run.error != null && (
          <div className="px-2">
            <SystemMessage tone="error" title="A execução parou">
              {run.error}
            </SystemMessage>
          </div>
        )}

        {run.status === "done" && run.result && (
          <div className="border-t border-line px-2 pt-3">
            <RunResult result={run.result} onOpen={onOpenResult} onRestart={restart} />
          </div>
        )}
      </div>
    </article>
  );
}
