"use client";

import { AlertCircle, CalendarDays, Check, ChevronDown, ChevronRight, Clock3, Flag, Plus, Sparkles, X } from "lucide-react";
import { useCallback, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { cn } from "../lib/cn";
import { formatDate, formatNumber } from "../lib/format";
import { useIsomorphicLayoutEffect as useLayoutEffect } from "../lib/layout-effect";
import { useEasedWidth, useReducedMotion, useVisibleInterval } from "../lib/motion";
import { formatDuration } from "./ai";
import { AgentOrb, AgentOrbStack, type AgentOrbShape } from "./agent-orb";
import { AgentRunSteps, type AgentRunStep } from "./agent-run";
import { FileCard } from "./media";
import { ActionMenu } from "./navigation";
import { Menu, type MenuEntry } from "./overlays-extra";
import { Badge, Button, IconButton } from "./primitives";

/*
 * Tarefas delegadas a agentes: a pessoa escolhe o que sai da mão dela, entrega
 * a um ou mais agentes e acompanha o trabalho ao vivo até o resultado.
 * Ver showcase "Tarefas delegadas" e o bloco ai-delegate.
 */

/* ------------------------------------------------------------------ */
/* Tipos                                                               */
/* ------------------------------------------------------------------ */

/** Um agente que recebe tarefas. `seed` decide o rosto (`AgentOrb`); sem ele, usa o `id`. */
export type AgentRef = {
  id: string;
  name: string;
  seed?: string;
  palette?: number;
  shape?: AgentOrbShape;
};

/**
 * Situação da tarefa. `aberta` é da pessoa; `delegada` está na fila do agente; `trabalhando`
 * está em execução; `aguardando` travou e pede você (aprovação, dado que falta); `falhou`
 * parou com erro; `concluida` terminou.
 */
export type DelegableTaskStatus = "aberta" | "delegada" | "trabalhando" | "aguardando" | "falhou" | "concluida";

/** Uma tarefa que pode ser delegada. */
export type DelegableTask = {
  id: string;
  title: string;
  /** Prazo. Vira "Hoje", "Amanhã", o dia da semana ou a data; atrasada aparece em tom com a palavra. */
  due?: Date | string;
  priority?: "alta" | "normal";
  /** Agente responsável depois de delegar. */
  agent?: AgentRef;
  status?: DelegableTaskStatus;
  /** O que o agente está fazendo agora ("Lendo o extrato do banco"); na falha, o motivo. */
  activity?: string;
  /** Agente sugerido quando a pessoa delega em "Automático". */
  suggestedAgentId?: string;
};

const ACTIVE: DelegableTaskStatus[] = ["delegada", "trabalhando", "aguardando", "falhou"];
const isActive = (t: DelegableTask) => !!t.agent && ACTIVE.includes(t.status ?? "aberta");
const canDelegate = (t: DelegableTask) => (t.status ?? "aberta") === "aberta";
const seedOf = (a: AgentRef) => a.seed ?? a.id;

/* ------------------------------------------------------------------ */
/* Prazo                                                               */
/* ------------------------------------------------------------------ */

const DAY = 86_400_000;
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
const toDay = (v: Date | string) => (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? new Date(`${v}T00:00:00`) : new Date(v));

/**
 * Prazo de tarefa em palavras: "Hoje", "Amanhã", "Sexta" (até 6 dias), "21 nov" depois disso e
 * "Atrasada" antes de hoje. `tone` diz se o chip pede atenção (`hoje`, `atrasada`).
 */
export function describeTaskDue(due: Date | string, now: Date = new Date()) {
  const date = toDay(due);
  const diff = Math.round((startOfDay(date) - startOfDay(now)) / DAY);
  const full = date.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  if (diff < 0)
    return {
      label: "Atrasada",
      full: `Atrasada desde ${full}`,
      tone: "atrasada" as const,
    };
  if (diff === 0) return { label: "Hoje", full: `Hoje, ${full}`, tone: "hoje" as const };
  if (diff === 1)
    return {
      label: "Amanhã",
      full: `Amanhã, ${full}`,
      tone: "normal" as const,
    };
  if (diff < 7) {
    const weekday = date.toLocaleDateString("pt-BR", { weekday: "long" }).replace(/-feira$/, "");
    return {
      label: weekday.charAt(0).toUpperCase() + weekday.slice(1),
      full,
      tone: "normal" as const,
    };
  }
  return {
    label: formatDate(date, { short: true }),
    full,
    tone: "normal" as const,
  };
}

const dueTone = {
  normal: "bg-soft text-muted",
  hoje: "bg-info-soft text-info",
  atrasada: "bg-rose-soft text-rose",
} as const;

function DueChip({ due, now }: { due: Date | string; now?: Date }) {
  const d = describeTaskDue(due, now);
  return (
    <span title={d.full} className={cn("inline-flex h-6 shrink-0 items-center gap-1 rounded-md px-1.5 text-[11.5px] font-medium", dueTone[d.tone])}>
      <CalendarDays aria-hidden className="h-3 w-3" />
      {d.label}
      <span className="sr-only">: prazo {d.full}</span>
    </span>
  );
}

function PriorityFlag() {
  return (
    <span title="Prioridade alta" className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-rose-soft text-rose">
      <Flag aria-hidden className="h-3 w-3" fill="currentColor" />
      <span className="sr-only">Prioridade alta</span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Indicador de trabalho                                               */
/* ------------------------------------------------------------------ */

/** Grade 3×3 de pontos em onda: o agente está trabalhando. Parada com movimento reduzido. */
function WorkGrid({ live = true, className }: { live?: boolean; className?: string }) {
  const box = useRef<HTMLSpanElement>(null);
  const reduce = useReducedMotion();
  useEffect(() => {
    const dots = Array.from(box.current?.children ?? []) as HTMLElement[];
    if (!live || reduce || !dots.length || typeof dots[0].animate !== "function") return;
    const running = dots.map((dot, i) =>
      dot.animate([{ opacity: 0.25 }, { opacity: 1 }, { opacity: 0.25 }], {
        duration: 1200,
        delay: ((i % 3) + Math.floor(i / 3)) * 140,
        iterations: Infinity,
        easing: "ease-in-out",
      }),
    );
    return () => running.forEach((a) => {
      a.finished.catch(() => {});
      a.cancel();
    });
  }, [live, reduce]);
  return (
    <span ref={box} aria-hidden className={cn("grid shrink-0 grid-cols-3 gap-[2px] text-muted", className)}>
      {Array.from({ length: 9 }, (_, i) => (
        <span key={i} className={cn("h-[3px] w-[3px] rounded-full bg-current", (!live || reduce) && (i % 2 ? "opacity-30" : "opacity-80"))} />
      ))}
    </span>
  );
}

/** Situação curta, sempre com palavra: ícone + texto. */
function StatusMark({ status }: { status: DelegableTaskStatus }) {
  if (status === "trabalhando")
    return (
      <span className="inline-flex items-center" title="Trabalhando">
        <WorkGrid />
        <span className="sr-only">Trabalhando</span>
      </span>
    );
  if (status === "delegada") return <span className="shrink-0 text-[11.5px] text-muted">Na fila</span>;
  if (status === "aguardando")
    return (
      <Badge tone="warn" icon={<Clock3 aria-hidden />}>
        Aguardando você
      </Badge>
    );
  if (status === "falhou")
    return (
      <Badge tone="bad" icon={<AlertCircle aria-hidden />}>
        Falhou
      </Badge>
    );
  return null;
}

/* ------------------------------------------------------------------ */
/* DelegableTaskList                                                   */
/* ------------------------------------------------------------------ */

type Mode = "add" | "remove";

/**
 * Lista de tarefas com seleção múltipla para delegar a agentes. Clique (ou arraste com o mouse)
 * para selecionar, Shift+clique para um intervalo; no teclado, setas movem, Espaço marca,
 * Shift+seta estende, Ctrl/⌘+A marca todas e Esc limpa. Com algo marcado, uma barra flutuante
 * oferece "Delegar (n)" e a escolha do agente. A linha delegada mostra o rosto do agente e a
 * situação; a concluída ganha o check, fica riscada e sai (com movimento reduzido, sai sem animar).
 */
export function DelegableTaskList({
  tasks,
  title = "Esta semana",
  agents = [],
  onDelegate,
  onComplete,
  onCreate,
  selected: selectedProp,
  onSelectedChange,
  now,
  showCompleted = false,
  className,
}: {
  tasks: DelegableTask[];
  /** Título do cartão. */
  title?: string;
  /** Agentes do seletor da barra. Sem agentes, delega em "Automático". */
  agents?: AgentRef[];
  /** Delegar as tarefas marcadas. `agentId` nulo = automático (cada tarefa vai ao `suggestedAgentId`). */
  onDelegate?: (ids: string[], agentId: string | null) => void;
  /** Marcar as tarefas como concluídas pela própria pessoa. Sem ele, a barra não oferece. */
  onComplete?: (ids: string[]) => void;
  /** Botão "+" do cabeçalho. */
  onCreate?: () => void;
  /** Seleção controlada (ids). */
  selected?: string[];
  onSelectedChange?: (ids: string[]) => void;
  /** Referência de "hoje" para os prazos. Padrão: agora. */
  now?: Date;
  /** Mantém as concluídas na lista (riscadas) em vez de tirá-las. */
  showCompleted?: boolean;
  className?: string;
}) {
  const titleId = useId();
  const [inner, setInner] = useState<string[]>([]);
  const selectedIds = selectedProp ?? inner;
  const setSelected = useCallback(
    (ids: string[]) => {
      if (selectedProp === undefined) setInner(ids);
      onSelectedChange?.(ids);
    },
    [selectedProp, onSelectedChange],
  );
  const [agentId, setAgentId] = useState<string | null>(null);

  /* Concluídas que já saíram (as que chegam concluídas não aparecem). */
  const [gone, setGone] = useState<Set<string>>(() => new Set(showCompleted ? [] : tasks.filter((t) => t.status === "concluida").map((t) => t.id)));
  const [announce, setAnnounce] = useState("");
  const previous = useRef(new Map(tasks.map((t) => [t.id, t.status])));
  useEffect(() => {
    const done: string[] = [];
    for (const t of tasks) {
      if (t.status === "concluida" && previous.current.get(t.id) !== "concluida") done.push(t.title);
      if (t.status !== "concluida" && gone.has(t.id)) setGone((g) => new Set([...g].filter((id) => id !== t.id)));
    }
    previous.current = new Map(tasks.map((t) => [t.id, t.status]));
    if (done.length) setAnnounce(`Concluída: ${done.join(", ")}`);
  }, [tasks, gone]);

  const visible = tasks.filter((t) => !gone.has(t.id));
  const selectable = visible.filter(canDelegate);
  const selectedSet = new Set(selectedIds.filter((id) => selectable.some((t) => t.id === id)));
  const selectedCount = selectedSet.size;

  /* Seleção: âncora para intervalos, arrasto com o mouse. */
  const anchor = useRef<string | null>(null);
  const drag = useRef<Mode | null>(null);
  const lastPointer = useRef<string>("");
  const [active, setActive] = useState<string | null>(null);
  const rows = useRef(new Map<string, HTMLLIElement>());

  useEffect(() => {
    const up = () => (drag.current = null);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, []);

  const apply = (ids: string[], mode: Mode, base = selectedSet) => {
    const next = new Set(base);
    for (const id of ids) {
      if (!selectable.some((t) => t.id === id)) continue;
      if (mode === "add") next.add(id);
      else next.delete(id);
    }
    setSelected(visible.filter((t) => next.has(t.id)).map((t) => t.id));
  };
  const range = (from: string, to: string) => {
    const a = visible.findIndex((t) => t.id === from);
    const b = visible.findIndex((t) => t.id === to);
    if (a < 0 || b < 0) return [to];
    return visible.slice(Math.min(a, b), Math.max(a, b) + 1).map((t) => t.id);
  };
  const toggle = (id: string, shift: boolean) => {
    if (shift && anchor.current) apply(range(anchor.current, id), "add");
    else {
      apply([id], selectedSet.has(id) ? "remove" : "add");
      anchor.current = id;
    }
  };

  const onPointerDown = (event: PointerEvent<HTMLLIElement>, task: DelegableTask) => {
    lastPointer.current = event.pointerType;
    if (event.pointerType !== "mouse" || event.button !== 0 || !canDelegate(task)) return;
    setActive(task.id);
    if (event.shiftKey && anchor.current) {
      apply(range(anchor.current, task.id), "add");
      return;
    }
    const mode: Mode = selectedSet.has(task.id) ? "remove" : "add";
    drag.current = mode;
    anchor.current = task.id;
    apply([task.id], mode);
  };
  const onPointerEnter = (task: DelegableTask) => {
    if (drag.current && canDelegate(task)) apply([task.id], drag.current);
  };
  const onClick = (event: { shiftKey: boolean }, task: DelegableTask) => {
    // Mouse já resolveu no pointerdown; toque e caneta resolvem aqui (sem arrasto, que rolaria a página).
    if (lastPointer.current === "mouse" || !canDelegate(task)) return;
    setActive(task.id);
    toggle(task.id, event.shiftKey);
  };

  const focusRow = (id: string) => {
    setActive(id);
    rows.current.get(id)?.focus();
  };
  const onKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    const ids = visible.map((t) => t.id);
    const current = active && ids.includes(active) ? active : ids[0];
    if (!current) return;
    const index = ids.indexOf(current);
    const move = (to: number) => {
      const id = ids[Math.max(0, Math.min(ids.length - 1, to))];
      event.preventDefault();
      if (event.shiftKey) {
        if (!anchor.current) anchor.current = current;
        apply(range(anchor.current, id), "add");
      }
      focusRow(id);
    };
    if (event.key === "ArrowDown") move(index + 1);
    else if (event.key === "ArrowUp") move(index - 1);
    else if (event.key === "Home") move(0);
    else if (event.key === "End") move(ids.length - 1);
    else if (event.key === " ") {
      event.preventDefault();
      toggle(current, event.shiftKey);
    } else if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "a") {
      event.preventDefault();
      apply(
        selectable.map((t) => t.id),
        "add",
        new Set(),
      );
    } else if (event.key === "Escape" && selectedCount) {
      event.preventDefault();
      setSelected([]);
    }
  };

  const delegate = () => {
    const ids = visible.filter((t) => selectedSet.has(t.id)).map((t) => t.id);
    if (!ids.length) return;
    onDelegate?.(ids, agentId);
    setSelected([]);
    anchor.current = null;
  };

  const chosen = agents.find((a) => a.id === agentId);
  const agentItems: MenuEntry[] = [
    {
      type: "radio",
      value: agentId ?? "",
      onValueChange: (value) => setAgentId(value || null),
      options: [
        {
          value: "",
          label: "Automático",
          icon: <Sparkles aria-hidden />,
          description: "Cada tarefa vai ao agente indicado",
        },
        ...agents.map((a) => ({
          value: a.id,
          label: a.name,
          icon: <AgentOrb seed={seedOf(a)} palette={a.palette} shape={a.shape} size={18} />,
        })),
      ],
    },
  ];

  const focusable = active && visible.some((t) => t.id === active) ? active : visible[0]?.id;

  return (
    <section aria-labelledby={titleId} className={cn("relative flex min-w-0 flex-col rounded-2xl border border-line bg-surface", className)}>
      <header className="flex items-center justify-between gap-3 px-4 pb-1 pt-3.5">
        <h2 id={titleId} className="m-0 text-[15px] font-semibold tracking-tight text-ink">
          {title}
        </h2>
        {onCreate && (
          <IconButton label="Criar tarefa" size="sm" onClick={onCreate} className="rounded-full bg-soft">
            <Plus />
          </IconButton>
        )}
      </header>
      <ul
        role="listbox"
        aria-multiselectable="true"
        aria-labelledby={titleId}
        aria-describedby={`${titleId}-hint`}
        onKeyDown={onKeyDown}
        className={cn("m-0 flex list-none flex-col p-1.5 transition-[padding] duration-200", selectedCount ? "pb-16" : "pb-1.5")}
      >
        {visible.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            now={now}
            selected={selectedSet.has(task.id)}
            tabIndex={task.id === focusable ? 0 : -1}
            refCallback={(el) => (el ? rows.current.set(task.id, el) : rows.current.delete(task.id))}
            onPointerDown={(e) => onPointerDown(e, task)}
            onPointerEnter={() => onPointerEnter(task)}
            onClick={(e) => onClick(e, task)}
            onFocus={() => setActive(task.id)}
            onGone={showCompleted ? undefined : () => setGone((g) => new Set(g).add(task.id))}
          />
        ))}
      </ul>
      <p id={`${titleId}-hint`} className="sr-only">
        Espaço marca a tarefa, Shift com as setas marca várias, Ctrl ou Command com A marca todas.
      </p>
      <p aria-live="polite" className="sr-only">
        {announce}
      </p>

      {selectedCount > 0 && (
        <div
          role="toolbar"
          aria-label="Ações das tarefas marcadas"
          className="enter absolute bottom-3 left-1/2 z-10 flex max-w-[calc(100%-1.5rem)] -translate-x-1/2 items-center gap-1 rounded-full border border-line bg-popover p-1 shadow-popup"
        >
          <span className="hidden whitespace-nowrap px-2 text-[12.5px] tabular-nums text-muted sm:inline">{selectedCount === 1 ? "1 marcada" : `${formatNumber(selectedCount)} marcadas`}</span>
          {agents.length > 0 && (
            <Menu
              label={`Agente: ${chosen?.name ?? "Automático"}`}
              triggerVariant="ghost"
              triggerClassName="h-8 rounded-full px-2.5"
              side="top"
              items={agentItems}
              trigger={
                <>
                  {chosen ? <AgentOrb seed={seedOf(chosen)} palette={chosen.palette} shape={chosen.shape} size={18} /> : <Sparkles aria-hidden />}
                  <span className="max-w-[9rem] truncate max-sm:sr-only">{chosen?.name ?? "Automático"}</span>
                  <ChevronDown aria-hidden className="text-muted" />
                </>
              }
            />
          )}
          {onComplete && (
            <Button
              size="sm"
              variant="quiet"
              className="min-h-8 rounded-full px-2.5 py-1"
              onClick={() => {
                onComplete(visible.filter((t) => selectedSet.has(t.id)).map((t) => t.id));
                setSelected([]);
              }}
            >
              <Check /> <span className="max-sm:sr-only">Concluir</span>
            </Button>
          )}
          <Button size="sm" className="min-h-8 rounded-full px-3 py-1 tabular-nums" onClick={delegate}>
            <Sparkles /> Delegar ({formatNumber(selectedCount)})
          </Button>
          <IconButton label="Limpar seleção" size="sm" className="rounded-full" onClick={() => setSelected([])}>
            <X />
          </IconButton>
        </div>
      )}
    </section>
  );
}

function TaskRow({
  task,
  now,
  selected,
  tabIndex,
  refCallback,
  onPointerDown,
  onPointerEnter,
  onClick,
  onFocus,
  onGone,
}: {
  task: DelegableTask;
  now?: Date;
  selected: boolean;
  tabIndex: number;
  refCallback: (el: HTMLLIElement | null) => void;
  onPointerDown: (e: PointerEvent<HTMLLIElement>) => void;
  onPointerEnter: () => void;
  onClick: (e: { shiftKey: boolean }) => void;
  onFocus: () => void;
  onGone?: () => void;
}) {
  const status = task.status ?? "aberta";
  const done = status === "concluida";
  const pickable = canDelegate(task);
  const el = useRef<HTMLLIElement | null>(null);
  const circle = useRef<HTMLSpanElement>(null);
  const reduce = useReducedMotion();
  const gone = useRef(onGone);
  gone.current = onGone;

  // Concluída: o check aparece, o texto fica riscado e, depois de uma pausa para ler, a linha fecha.
  useLayoutEffect(() => {
    const row = el.current;
    if (!done || !row || !gone.current) return;
    if (typeof row.animate !== "function") {
      gone.current();
      return;
    }
    if (!reduce) circle.current?.animate?.([{ transform: "scale(0.6)" }, { transform: "scale(1.12)" }, { transform: "scale(1)" }], { duration: 280, easing: "ease-out" });
    const leave = reduce
      ? row.animate([{ opacity: 1 }, { opacity: 0 }], {
          delay: 1400,
          duration: 1,
          fill: "forwards",
        })
      : row.animate(
          [
            { height: `${row.offsetHeight}px`, opacity: 1 },
            { height: `${row.offsetHeight}px`, opacity: 0, offset: 0.45 },
            { height: "0px", opacity: 0 },
          ],
          {
            delay: 1200,
            duration: 520,
            easing: "cubic-bezier(0.45, 0, 0.1, 1)",
            fill: "forwards",
          },
        );
    let cancelled = false;
    leave.finished.then(() => !cancelled && gone.current?.()).catch(() => {});
    return () => {
      cancelled = true;
      leave.cancel();
    };
  }, [done, reduce]);

  return (
    <li
      ref={(node) => {
        el.current = node;
        refCallback(node);
      }}
      role="option"
      aria-selected={pickable ? selected : false}
      aria-disabled={pickable ? undefined : true}
      tabIndex={tabIndex}
      data-status={status}
      onPointerDown={onPointerDown}
      onPointerEnter={onPointerEnter}
      onClick={onClick}
      onFocus={onFocus}
      className={cn(
        "group/task relative flex min-h-11 select-none items-center gap-3 overflow-hidden rounded-xl px-2.5 outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-accent/40",
        selected ? "bg-soft" : pickable ? "hover:bg-soft/60" : "",
        pickable ? "cursor-pointer" : "cursor-default",
      )}
    >
      <span
        ref={circle}
        aria-hidden
        className={cn(
          "grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full border-[1.5px] transition-colors duration-150",
          done ? "border-primary bg-primary text-on-primary" : selected ? "border-primary" : "border-line-strong",
        )}
      >
        {done ? <Check className="h-3 w-3" strokeWidth={3} /> : selected ? <span className="h-2 w-2 rounded-full bg-primary" /> : null}
      </span>
      <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1 self-stretch border-b border-line py-2.5 group-last/task:border-transparent">
        <span className={cn("min-w-[min(100%,11rem)] flex-1 text-[14px] leading-snug transition-colors duration-300 [overflow-wrap:anywhere]", done ? "text-muted line-through" : "text-ink")}>
          {task.title}
          {done && <span className="sr-only"> (concluída)</span>}
        </span>
        <span className={cn("ml-auto flex shrink-0 items-center gap-1.5 transition-opacity duration-300", done ? "opacity-50" : "opacity-100")}>
          {task.due != null && <DueChip due={task.due} now={now} />}
          {task.priority === "alta" && <PriorityFlag />}
          {task.agent && (
            <span title={`Delegada a ${task.agent.name}`} className="inline-flex">
              <AgentOrb seed={seedOf(task.agent)} palette={task.agent.palette} shape={task.agent.shape} size={20} motion={status === "trabalhando" ? "live" : "none"} />
              <span className="sr-only">, delegada a {task.agent.name}</span>
            </span>
          )}
          {task.agent && !done && <StatusMark status={status} />}
        </span>
      </span>
    </li>
  );
}

/* ------------------------------------------------------------------ */
/* AgentQueue                                                          */
/* ------------------------------------------------------------------ */

/**
 * Painel "Agentes": uma linha por tarefa delegada ainda em curso, com o rosto do agente, o título
 * e o que ele está fazendo agora (anunciado ao leitor de tela, troca com um fade curto). Quem trava
 * vira "Aguardando você" com "Revisar"; quem falha mostra o motivo e "Tentar de novo". Parar e Ver
 * detalhes ficam no ⋯. Recebe a mesma lista de tarefas da `DelegableTaskList`.
 */
export function AgentQueue({
  tasks,
  title = "Agentes",
  onStop,
  onOpen,
  onRetry,
  onReview,
  id,
  className,
}: {
  tasks: DelegableTask[];
  title?: string;
  /** Interromper o agente: a tarefa volta para você. */
  onStop?: (taskId: string) => void;
  onOpen?: (taskId: string) => void;
  onRetry?: (taskId: string) => void;
  /** Abrir o que o agente pede (aprovação, dado que falta). */
  onReview?: (taskId: string) => void;
  /** Para a pílula apontar (`aria-controls`). */
  id?: string;
  className?: string;
}) {
  const titleId = useId();
  const items = tasks.filter(isActive);
  return (
    <section id={id} aria-labelledby={titleId} className={cn("flex min-w-0 flex-col rounded-2xl border border-line bg-surface", className)}>
      <header className="flex items-center justify-between gap-3 px-4 pb-1 pt-3.5">
        <h2 id={titleId} className="m-0 text-[15px] font-semibold tracking-tight text-ink">
          {title}
        </h2>
        <span className="grid h-5 min-w-5 place-items-center rounded-full bg-soft px-1.5 text-[11px] font-medium tabular-nums text-ink-soft">
          {formatNumber(items.length)}
          <span className="sr-only"> {items.length === 1 ? "tarefa em curso" : "tarefas em curso"}</span>
        </span>
      </header>
      {items.length === 0 ? (
        <p className="m-0 px-4 pb-4 pt-2 text-[13px] text-muted">Nenhum agente trabalhando agora. Marque tarefas e delegue.</p>
      ) : (
        <ul className="m-0 flex list-none flex-col p-1.5">
          {items.map((t) => (
            <QueueRow key={t.id} task={t} onStop={onStop} onOpen={onOpen} onRetry={onRetry} onReview={onReview} />
          ))}
        </ul>
      )}
    </section>
  );
}

function QueueRow({
  task,
  onStop,
  onOpen,
  onRetry,
  onReview,
}: {
  task: DelegableTask;
  onStop?: (id: string) => void;
  onOpen?: (id: string) => void;
  onRetry?: (id: string) => void;
  onReview?: (id: string) => void;
}) {
  const agent = task.agent!;
  const status = task.status ?? "delegada";
  const activity = task.activity ?? (status === "delegada" ? "Na fila" : "");
  const actions = [...(onOpen ? [{ label: "Ver detalhes", onSelect: () => onOpen(task.id) }] : []), ...(onStop && status !== "falhou" ? [{ label: "Parar", onSelect: () => onStop(task.id) }] : [])];
  return (
    <li className="flex min-h-14 flex-wrap items-center gap-x-3 gap-y-1.5 rounded-xl px-2.5 py-2">
      <AgentOrb
        seed={seedOf(agent)}
        palette={agent.palette}
        shape={agent.shape}
        size={28}
        motion={status === "trabalhando" ? "live" : "none"}
        expression={status === "aguardando" ? "waiting" : undefined}
      />
      <div className="min-w-[min(100%,12rem)] flex-1 basis-0">
        <p className="m-0 truncate text-[13.5px] font-medium text-ink">{task.title}</p>
        <p aria-live="polite" className={cn("m-0 mt-0.5 truncate text-[12px]", status === "falhou" ? "text-rose" : "text-muted")}>
          <span className="sr-only">{agent.name}: </span>
          <span key={activity} className="animate-fade">
            {activity}
          </span>
        </p>
      </div>
      <div className="ml-auto flex shrink-0 items-center gap-1.5">
        {status === "aguardando" && onReview ? (
          <Button size="sm" variant="ghost" className="min-h-8 py-1" onClick={() => onReview(task.id)}>
            <Clock3 className="text-amber" /> Revisar
          </Button>
        ) : status === "falhou" && onRetry ? (
          <Button size="sm" variant="ghost" className="min-h-8 py-1" onClick={() => onRetry(task.id)}>
            <AlertCircle className="text-rose" /> Tentar de novo
          </Button>
        ) : status === "delegada" ? null : (
          <StatusMark status={status} />
        )}
        {actions.length > 0 && <ActionMenu label={`Mais ações: ${task.title}`} actions={actions} />}
      </div>
    </li>
  );
}

/* ------------------------------------------------------------------ */
/* DelegationPill                                                      */
/* ------------------------------------------------------------------ */

/**
 * Pílula flutuante do trabalho delegado: rostos dos agentes e uma frase ("2 agentes trabalhando",
 * "1 aguardando você", "Financeiro respondeu ✓"). Clicável para abrir o painel `AgentQueue` (no
 * celular, em folha). A largura acompanha a frase sem saltar. Some quando não há nada a dizer.
 */
export function DelegationPill({
  tasks,
  answered,
  onClick,
  expanded,
  controls,
  className,
}: {
  tasks: DelegableTask[];
  /** Agente que acabou de entregar: mostra "<nome> respondeu" quando ninguém mais trabalha. */
  answered?: AgentRef | null;
  onClick?: () => void;
  /** Painel aberto (folha no celular). */
  expanded?: boolean;
  /** Id do painel que a pílula abre. */
  controls?: string;
  className?: string;
}) {
  const active = tasks.filter(isActive);
  const waiting = active.filter((t) => t.status === "aguardando").length;
  const failed = active.filter((t) => t.status === "falhou").length;
  const working = active.length - waiting - failed;
  const agents = [...new Map(active.map((t) => [t.agent!.id, t.agent!])).values()];
  const box = useRef<HTMLButtonElement>(null);

  let label = "";
  let tail: ReactNode = null;
  if (waiting) {
    label = waiting === 1 ? "1 aguardando você" : `${formatNumber(waiting)} aguardando você`;
    tail = <Clock3 aria-hidden className="h-3.5 w-3.5 text-amber" />;
  } else if (failed) {
    label = failed === 1 ? "1 agente falhou" : `${formatNumber(failed)} agentes falharam`;
    tail = <AlertCircle aria-hidden className="h-3.5 w-3.5 text-rose" />;
  } else if (working) {
    const n = agents.length;
    label = n === 1 ? `${agents[0].name} trabalhando` : `${formatNumber(n)} agentes trabalhando`;
    tail = <WorkGrid />;
  } else if (answered) {
    label = `${answered.name} respondeu`;
    tail = <Check aria-hidden className="h-3.5 w-3.5 text-ok" strokeWidth={2.5} />;
  }
  useEasedWidth(box, label);
  const faces = agents.length ? agents : answered ? [answered] : [];
  if (!label) return <span aria-live="polite" className="sr-only" />;
  return (
    <>
      <button
        ref={box}
        type="button"
        onClick={onClick}
        aria-expanded={expanded}
        aria-controls={controls}
        className={cn(
          "inline-flex h-9 max-w-full items-center gap-2 overflow-hidden whitespace-nowrap rounded-full border border-line bg-popover pl-1.5 pr-3 text-[13px] font-medium text-ink shadow-popup outline-none transition-colors hover:bg-soft focus-visible:ring-2 focus-visible:ring-accent/40",
          className,
        )}
      >
        <AgentOrbStack
          agents={faces.map((a) => ({
            seed: seedOf(a),
            name: a.name,
            palette: a.palette,
            shape: a.shape,
          }))}
          size={22}
          max={3}
          ring="var(--color-popover)"
        />
        <span className="min-w-0 truncate">{label}</span>
        {tail}
      </button>
      <span aria-live="polite" className="sr-only">
        {label}
      </span>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* TaskResultCard                                                      */
/* ------------------------------------------------------------------ */

/** Arquivo entregue pelo agente, com destinos de "Abrir em". */
export type TaskResultFile = {
  name: string;
  /** Bytes. */
  size?: number;
  meta?: ReactNode;
  /** Aplicativos onde abrir ("Planilhas", "Excel"). Sem eles, não há menu. */
  openWith?: { label: string; icon?: ReactNode; onSelect?: () => void }[];
};

/** Tabela-resumo do resultado. Números puros saem com `formatNumber` e alinhados à direita. */
export type TaskResultTable = {
  columns: { label: string; align?: "start" | "end" }[];
  rows: (ReactNode | number)[][];
  /** Nome acessível da tabela. */
  caption?: string;
};

/**
 * Resultado de uma tarefa delegada: título, quem fez, "Trabalhou por 2 min 14 s ›" (abre os passos),
 * a frase de resultado, uma tabela-resumo opcional, os arquivos entregues (com "Abrir em") e, se a
 * entrega pede revisão, "Aprovar" e "Pedir ajuste".
 */
export function TaskResultCard({
  title,
  agent,
  durationMs,
  steps,
  children,
  table,
  files,
  needsReview = false,
  onApprove,
  onRequestChanges,
  actions,
  className,
}: {
  title: string;
  agent?: AgentRef;
  /** Tempo de trabalho do agente. */
  durationMs?: number;
  /** Passos (texto simples ou `AgentRunStep`) que abrem sob "Trabalhou por". */
  steps?: (string | AgentRunStep)[];
  /** A frase de resultado. */
  children?: ReactNode;
  table?: TaskResultTable;
  files?: TaskResultFile[];
  /** A entrega espera sua decisão: mostra Aprovar e Pedir ajuste. */
  needsReview?: boolean;
  onApprove?: () => void;
  onRequestChanges?: () => void;
  /** Ações extras no rodapé (ou no lugar das de revisão). */
  actions?: ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const stepsId = useId();
  const hasSteps = !!steps?.length;
  const runSteps = useMemo(() => (steps?.every((s) => typeof s !== "string") ? (steps as AgentRunStep[]) : null), [steps]);
  return (
    <article aria-label={title} className={cn("flex min-w-0 flex-col gap-3 rounded-2xl border border-line bg-surface p-4", className)}>
      <header className="flex items-start justify-between gap-3">
        <h3 className="m-0 min-w-0 text-[15px] font-semibold leading-snug tracking-tight text-ink">{title}</h3>
        {agent && <AgentOrb seed={seedOf(agent)} palette={agent.palette} shape={agent.shape} size={24} name={`Feito por ${agent.name}`} labelled />}
      </header>
      {durationMs != null && (
        <div className="-mt-1.5 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => hasSteps && setOpen((o) => !o)}
            aria-expanded={hasSteps ? open : undefined}
            aria-controls={hasSteps ? stepsId : undefined}
            disabled={!hasSteps}
            className="inline-flex items-center gap-0.5 self-start rounded-md text-[13px] tabular-nums text-muted outline-none hover:text-ink focus-visible:ring-2 focus-visible:ring-accent/40 disabled:hover:text-muted"
          >
            Trabalhou por {formatDuration(durationMs)}
            {hasSteps && <ChevronRight aria-hidden className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-90")} />}
          </button>
          {open && hasSteps && (
            <div id={stepsId} className="enter border-l border-line pl-3">
              {runSteps ? (
                <AgentRunSteps steps={runSteps} />
              ) : (
                <ol className="m-0 flex list-none flex-col gap-1.5 p-0 text-[12.5px] text-ink-soft">
                  {steps!.map((s, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ok" />
                      {typeof s === "string" ? s : s.label}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          )}
        </div>
      )}
      {children != null && <div className="text-[14px] leading-relaxed text-ink">{children}</div>}
      {table && (
        <div
          tabIndex={0}
          role="region"
          aria-label={table.caption ?? `Resumo: ${title}`}
          className="overflow-x-auto rounded-xl border border-line outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        >
          <table className="w-full border-collapse text-left">
            {table.caption && <caption className="sr-only">{table.caption}</caption>}
            <thead className="bg-soft/60">
              <tr>
                {table.columns.map((c, i) => (
                  <th key={i} scope="col" className={cn("border-b border-line px-3 py-2 text-[12.5px] font-medium text-ink-soft", c.align === "end" ? "text-right" : "text-left", i > 0 && "border-l")}>
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row, r) => (
                <tr key={r} className={r > 0 ? "border-t border-line" : undefined}>
                  {row.map((cell, i) => {
                    const numeric = typeof cell === "number" || table.columns[i]?.align === "end";
                    return (
                      <td key={i} className={cn("whitespace-nowrap px-3 py-2.5 text-[15px] font-medium text-ink", numeric ? "text-right tabular-nums" : "text-left", i > 0 && "border-l border-line")}>
                        {typeof cell === "number" ? formatNumber(cell) : cell}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {files?.map((f) => (
        <FileCard
          key={f.name}
          name={f.name}
          size={f.size}
          meta={f.meta}
          actions={
            f.openWith?.length ? (
              <Menu
                label={`Abrir ${f.name} em`}
                align="end"
                triggerVariant="button"
                triggerClassName="h-8 px-2.5"
                items={f.openWith.map((o) => ({
                  label: o.label,
                  icon: o.icon,
                  onSelect: o.onSelect,
                }))}
                trigger={
                  <>
                    Abrir em <ChevronDown aria-hidden className="text-muted" />
                  </>
                }
              />
            ) : undefined
          }
        />
      ))}
      {(needsReview || actions) && (
        <footer className="flex flex-wrap items-center gap-2 pt-1">
          {needsReview && (
            <>
              <Button size="sm" onClick={onApprove}>
                <Check /> Aprovar
              </Button>
              <Button size="sm" variant="ghost" onClick={onRequestChanges}>
                Pedir ajuste
              </Button>
            </>
          )}
          {actions}
        </footer>
      )}
    </article>
  );
}

/* ------------------------------------------------------------------ */
/* useDelegationDemo                                                   */
/* ------------------------------------------------------------------ */

/** Um passo do roteiro de demonstração: texto, ou texto que trava pedindo você ou que falha. */
export type DelegationDemoStep = string | { text: string; waitForYou?: boolean; fail?: boolean };

/**
 * Simula o ciclo de delegação para showcase, protótipo e testes de usabilidade: delegada → passos
 * do roteiro (um por compasso, só com a aba visível) → concluída. Um passo `waitForYou` deixa a
 * tarefa "aguardando" até `approve`; um passo `fail` a deixa "falhou" até `retry` (que pula a falha).
 * Em produção, troque pelo estado que chega do seu orquestrador de agentes.
 */
export function useDelegationDemo(
  initial: DelegableTask[],
  {
    agents,
    scripts,
    tickMs = 1800,
  }: {
    agents: AgentRef[];
    scripts: Record<string, DelegationDemoStep[]>;
    tickMs?: number;
  },
) {
  const [tasks, setTasks] = useState(initial);
  const cursor = useRef<Record<string, number>>({});
  const retried = useRef(new Set<string>());
  const [answered, setAnswered] = useState<{
    taskId: string;
    agent: AgentRef;
  } | null>(null);

  const stepOf = (id: string, i: number) => {
    const s = scripts[id]?.[i];
    return typeof s === "string" ? { text: s } : s;
  };

  const advance = useCallback(() => {
    setTasks((list) =>
      list.map((t) => {
        if (t.status === "delegada") {
          cursor.current[t.id] = 0;
          return {
            ...t,
            status: "trabalhando",
            activity: stepOf(t.id, 0)?.text ?? "Trabalhando",
          };
        }
        if (t.status !== "trabalhando") return t;
        const next = (cursor.current[t.id] ?? 0) + 1;
        cursor.current[t.id] = next;
        const step = stepOf(t.id, next);
        if (!step) return { ...t, status: "concluida", activity: undefined };
        if (step.fail) return retried.current.has(t.id) ? { ...t, activity: "Tentando de novo" } : { ...t, status: "falhou", activity: step.text };
        if (step.waitForYou) return { ...t, status: "aguardando", activity: step.text };
        return { ...t, activity: step.text };
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- o roteiro é lido na hora do compasso
  }, [scripts]);

  // O último que terminou vira a resposta (pílula "respondeu" e cartão de resultado).
  const previous = useRef(new Map(initial.map((t) => [t.id, t.status])));
  useEffect(() => {
    const finished = tasks.filter((t) => t.status === "concluida" && t.agent && previous.current.get(t.id) !== "concluida").pop();
    previous.current = new Map(tasks.map((t) => [t.id, t.status]));
    if (finished) setAnswered({ taskId: finished.id, agent: finished.agent! });
  }, [tasks]);

  const running = tasks.some((t) => t.status === "delegada" || t.status === "trabalhando");
  useVisibleInterval(advance, running ? tickMs : null);

  const update = (ids: string[], patch: (t: DelegableTask) => Partial<DelegableTask>) => setTasks((list) => list.map((t) => (ids.includes(t.id) ? { ...t, ...patch(t) } : t)));

  return {
    tasks,
    /** Ciclo terminado mais recente (para a pílula e o cartão de resultado). */
    answered,
    running,
    delegate: (ids: string[], agentId: string | null) =>
      update(ids, (t) => ({
        status: "delegada",
        activity: "Na fila",
        agent: agents.find((a) => a.id === agentId) ?? agents.find((a) => a.id === t.suggestedAgentId) ?? agents[0],
      })),
    approve: (id: string) => update([id], () => ({ status: "trabalhando" })),
    retry: (id: string) => {
      retried.current.add(id);
      update([id], () => ({ status: "delegada", activity: "Na fila" }));
    },
    stop: (id: string) =>
      update([id], () => ({
        status: "aberta",
        agent: undefined,
        activity: undefined,
      })),
    complete: (ids: string[]) => update(ids, () => ({ status: "concluida" })),
    /** Acrescenta uma tarefa aberta no topo. */
    add: (task: DelegableTask) => setTasks((list) => [task, ...list]),
    reset: () => {
      cursor.current = {};
      retried.current = new Set();
      setAnswered(null);
      previous.current = new Map(initial.map((t) => [t.id, t.status]));
      setTasks(initial);
    },
  };
}
