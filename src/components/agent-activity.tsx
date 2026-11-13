"use client";

import { AlertTriangle, Check, FileText, Pause, Play, RotateCcw, Search, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { cn } from "../lib/cn";
import { wordDiff } from "../lib/diff";
import { formatCompact, formatCurrency } from "../lib/format";
import { useReducedMotion, useVisibleInterval } from "../lib/motion";
import { useStreamingText } from "./ai";
import { ModelPicker, type ModelOption } from "./ai-sessions";
import { formatMoment } from "./meeting";
import { ConfirmDialog } from "./overlays";
import { Button, IconButton } from "./primitives";

/*
 * Atividade do agente, por fases: um card compacto que mostra O QUE o agente
 * está fazendo agora (lendo, buscando, pensando, escrevendo, revisando), o
 * plano com o passo atual, o contexto da fase e quanto já custou.
 */

/* ------------------------------------------------------------------ */
/* Fases                                                               */
/* ------------------------------------------------------------------ */

/** Fase do agente. As cinco de trabalho + concluído, pausado, parado e falhou. */
export type AgentPhase = "lendo" | "buscando" | "pensando" | "escrevendo" | "revisando" | "concluido" | "pausado" | "parado" | "falhou";

type PhaseLook = { label: string; text: string; fill: string; soft: string; working: boolean };

/*
 * Cores por fase. As fases de trabalho são CATEGORIAS (não são bom/ruim), então usam a paleta
 * categórica de etiquetas (`tag-*`): o par `-fg`/`-bg` já é AA nos dois temas para texto.
 * Os tons de status ficam reservados para o que é status de verdade: concluído = `ok`,
 * falhou = `rose`, pausado/parado = `muted`. Lendo (roxo) e buscando (azul) são "trazer
 * informação"; pensando (laranja) é o momento de decisão; escrevendo (verde) é produzir;
 * revisando (rosa) é a segunda leitura. A cor nunca vai sozinha: sempre com a palavra.
 */
const phaseLook: Record<AgentPhase, PhaseLook> = {
  lendo: { label: "Lendo arquivo", text: "text-tag-purple-fg", fill: "bg-tag-purple-fg", soft: "bg-tag-purple-bg", working: true },
  buscando: { label: "Buscando na web", text: "text-tag-blue-fg", fill: "bg-tag-blue-fg", soft: "bg-tag-blue-bg", working: true },
  pensando: { label: "Pensando", text: "text-tag-orange-fg", fill: "bg-tag-orange-fg", soft: "bg-tag-orange-bg", working: true },
  escrevendo: { label: "Escrevendo", text: "text-tag-green-fg", fill: "bg-tag-green-fg", soft: "bg-tag-green-bg", working: true },
  revisando: { label: "Revisando", text: "text-tag-pink-fg", fill: "bg-tag-pink-fg", soft: "bg-tag-pink-bg", working: true },
  concluido: { label: "Concluído", text: "text-ok", fill: "bg-ok", soft: "bg-ok-soft", working: false },
  pausado: { label: "Pausado", text: "text-muted", fill: "bg-line-strong", soft: "bg-soft", working: false },
  parado: { label: "Parado", text: "text-muted", fill: "bg-line-strong", soft: "bg-soft", working: false },
  falhou: { label: "Falhou", text: "text-rose", fill: "bg-rose", soft: "bg-rose-soft", working: false },
};

/** Rótulo de cada fase ("Buscando na web"). Útil para anúncios e listas. */
export const agentPhaseLabel = (phase: AgentPhase) => phaseLook[phase].label;

/** A fase como ponto + palavra, na cor da fase. `label` troca a palavra ("Lendo tokens.css"). */
export function AgentPhaseBadge({ phase, label, className }: { phase: AgentPhase; label?: ReactNode; className?: string }) {
  const look = phaseLook[phase];
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-1.5 text-[13px] font-medium", look.text, className)}>
      <span aria-hidden className={cn("h-2 w-2 shrink-0 rounded-full", look.fill)} />
      <span className="truncate">{label ?? look.label}</span>
    </span>
  );
}

const MARK_REST = [0.7, 1, 0.55, 0.85];

/**
 * Marca do agente: quatro barras de equalizador na cor da fase. Mexe só enquanto
 * `live` e com a aba visível; com movimento reduzido fica parada.
 */
export function AgentMark({ phase = "concluido", live, size = 20, className }: { phase?: AgentPhase; /** Barras se movendo. Padrão: quando a fase é de trabalho. */ live?: boolean; size?: number; className?: string }) {
  const reduced = useReducedMotion();
  const moving = (live ?? phaseLook[phase].working) && !reduced;
  const [levels, setLevels] = useState(MARK_REST);
  const tick = useRef(0);
  useVisibleInterval(() => {
    tick.current += 1;
    const t = tick.current;
    // Determinístico (sem Math.random): quatro senoides fora de fase.
    setLevels(MARK_REST.map((_, i) => 0.3 + 0.7 * Math.abs(Math.sin(t * (0.9 + i * 0.37) + i * 1.3))));
  }, moving ? 170 : null);
  useEffect(() => {
    if (!moving) setLevels(MARK_REST);
  }, [moving]);
  const bar = Math.max(2, Math.round(size / 7));
  return (
    <span aria-hidden className={cn("inline-flex shrink-0 items-center", className)} style={{ height: size, gap: bar * 0.9 }}>
      {levels.map((l, i) => (
        <span
          key={i}
          className={cn("rounded-full transition-[height] duration-150 ease-out", phaseLook[phase].fill)}
          style={{ width: bar, height: Math.max(bar, Math.round(size * l)) }}
        />
      ))}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Tipos                                                               */
/* ------------------------------------------------------------------ */

/** Um passo do plano do agente. */
export type AgentPlanStep = { id: string; label: string; status: "pendente" | "atual" | "feito" };

/** O que a fase está mostrando: o arquivo lido, a busca, as ideias, o texto escrito, a revisão ou o resultado. */
export type AgentPhaseContext =
  | { kind: "arquivo"; path: string }
  | { kind: "busca"; query: string; results: { title: string; source: string }[] }
  | { kind: "ideias"; items: string[] }
  | { kind: "escrita"; path: string; text: string }
  | { kind: "revisao"; path: string; before: string; after: string }
  | { kind: "resultado"; title: string; summary: string; /** Arquivos ou itens que mudaram. */ changes?: string[] }
  | { kind: "erro"; title: string; detail?: string };

/** Ferramenta conectada ao agente; `active` realça a que está em uso. */
export type AgentTool = { id: string; label: string; active?: boolean };

/** Consumo da execução: tokens, custo (em reais) e tempo decorrido. */
export type AgentUsage = { tokens: number; cost: number; elapsedMs: number };

/* ------------------------------------------------------------------ */
/* Animações pequenas (todas respeitam movimento reduzido)             */
/* ------------------------------------------------------------------ */

/** Quantos de `count` itens já entraram, um a cada `ms`, depois de `after`. Sem animação: todos. */
function useReveal(count: number, { animate, ms = 450, ready = true }: { animate: boolean; ms?: number; ready?: boolean }) {
  const reduced = useReducedMotion();
  const still = !animate || reduced;
  const [shown, setShown] = useState(still ? count : 0);
  useVisibleInterval(() => setShown((n) => Math.min(count, n + 1)), !still && ready && shown < count ? ms : null);
  return still ? count : shown;
}

const fadeIn = "animate-[fade-in_220ms_ease-out]";
const caret = "ml-px inline-block h-[1.05em] w-[1.5px] translate-y-[0.15em] animate-pulse bg-current";

/** Junta as duas listas de `wordDiff` numa só sequência: igual, removido, incluído. */
function inlineDiff(before: string, after: string) {
  const [left, right] = wordDiff(before, after);
  const l = left.map((w) => ({ ...w }));
  const r = right.map((w) => ({ ...w }));
  const out: { text: string; kind: "same" | "del" | "ins" }[] = [];
  let i = 0;
  let j = 0;
  while (i < l.length || j < r.length) {
    const a = l[i];
    const b = r[j];
    if (a?.changed) {
      out.push({ text: a.text, kind: "del" });
      i++;
    } else if (b?.changed) {
      out.push({ text: b.text, kind: "ins" });
      j++;
    } else if (a && b) {
      const n = Math.min(a.text.length, b.text.length);
      out.push({ text: a.text.slice(0, n), kind: "same" });
      a.text = a.text.slice(n);
      b.text = b.text.slice(n);
      if (!a.text) i++;
      if (!b.text) j++;
    } else {
      out.push({ text: (a ?? b)!.text, kind: "same" });
      if (a) i++;
      else j++;
    }
  }
  // Trechos trocados separados só por espaço viram um bloco: "um azul fixo" → "o token de foco",
  // e não palavra a palavra intercalada.
  type Part = { text: string; kind: "same" | "del" | "ins" };
  const merged: Part[] = [];
  let k = 0;
  while (k < out.length) {
    if (out[k]!.kind === "same") {
      merged.push(out[k++]!);
      continue;
    }
    let del = "";
    let ins = "";
    while (k < out.length) {
      const p = out[k]!;
      if (p.kind === "del") del += p.text;
      else if (p.kind === "ins") ins += p.text;
      else if (!p.text.trim() && out[k + 1] && out[k + 1]!.kind !== "same") {
        del += p.text;
        ins += p.text;
      } else break;
      k++;
    }
    if (del.trim()) merged.push({ text: del.trim(), kind: "del" });
    if (del.trim() && ins.trim()) merged.push({ text: " ", kind: "same" });
    if (ins.trim()) merged.push({ text: ins.trim(), kind: "ins" });
  }
  return merged;
}

function FileTile({ look, children = <FileText /> }: { look: PhaseLook; children?: ReactNode }) {
  return <span aria-hidden className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-lg [&_svg]:h-4 [&_svg]:w-4", look.soft, look.text)}>{children}</span>;
}

function PathLine({ children }: { children: ReactNode }) {
  return <p className="m-0 truncate font-mono text-[12px] text-muted">{children}</p>;
}

function ContextPanel({ context, look, animate }: { context: AgentPhaseContext; look: PhaseLook; animate: boolean }) {
  const typed = useStreamingText(context.kind === "busca" ? context.query : context.kind === "escrita" ? context.text : "", {
    active: animate && (context.kind === "busca" || context.kind === "escrita"),
    charsPerTick: context.kind === "busca" ? 1 : 2,
    interval: context.kind === "busca" ? 45 : 30,
  });
  const count = context.kind === "busca" ? context.results.length : context.kind === "ideias" ? context.items.length : 0;
  const revealed = useReveal(count, { animate, ms: context.kind === "busca" ? 500 : 650, ready: context.kind !== "busca" || typed.done });
  const reduced = useReducedMotion();
  const [revisedNow, setRevised] = useState(false);
  const revised = revisedNow || !animate || reduced;
  useVisibleInterval(() => setRevised(true), context.kind === "revisao" && !revised ? 900 : null);

  switch (context.kind) {
    case "arquivo":
      return (
        <div className="flex gap-3">
          <FileTile look={look} />
          <div className="flex min-w-0 flex-1 flex-col gap-2 pt-0.5">
            <PathLine>{context.path}</PathLine>
            <div aria-hidden className="flex flex-col gap-1.5">
              {[92, 70, 84, 58].map((w, i) => (
                <span key={i} className={cn("h-1.5 rounded-full", look.soft)} style={{ width: `${w}%` }} />
              ))}
            </div>
            <span className="sr-only">Lendo {context.path}</span>
          </div>
        </div>
      );
    case "busca":
      return (
        <div className="flex flex-col gap-2.5">
          <p className={cn("m-0 inline-flex max-w-full items-center gap-2 self-start rounded-lg px-2.5 py-1.5 font-mono text-[12.5px]", look.soft, look.text)}>
            <Search className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="sr-only">Busca: </span>
            <span className="min-w-0 truncate">
              {typed.text}
              {!typed.done || animate ? <span aria-hidden className={caret} /> : null}
            </span>
          </p>
          {revealed > 0 && (
            <ul aria-label="Resultados" className="m-0 flex list-none flex-col gap-1.5 p-0">
              {context.results.slice(0, revealed).map((r) => (
                <li key={r.title + r.source} className={cn("flex min-w-0 items-baseline gap-2 text-[13px]", animate && fadeIn)}>
                  <span aria-hidden className={cn("h-1.5 w-1.5 shrink-0 -translate-y-px rounded-full", look.fill)} />
                  <span className="shrink-0 font-medium text-ink">{r.title}</span>
                  <span className="min-w-0 truncate font-mono text-[11.5px] text-muted">{r.source}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      );
    case "ideias":
      return (
        <ul aria-label="Ideias" className="m-0 flex list-none flex-wrap gap-1.5 p-0">
          {context.items.slice(0, revealed).map((idea) => (
            <li key={idea} className={cn("rounded-lg px-2.5 py-1 text-[12.5px] font-medium", look.soft, look.text, animate && fadeIn)}>
              {idea}
            </li>
          ))}
        </ul>
      );
    case "escrita":
      return (
        <div className="flex gap-3">
          <FileTile look={look} />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <PathLine>{context.path}</PathLine>
            <p className="m-0 text-[13.5px] leading-relaxed text-ink">
              {typed.text}
              {animate && <span aria-hidden className={cn(caret, look.text)} />}
            </p>
          </div>
        </div>
      );
    case "revisao": {
      const parts = inlineDiff(context.before, context.after);
      return (
        <div className="flex gap-3">
          <FileTile look={look} />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <PathLine>{context.path} · revisado</PathLine>
            <p className="m-0 text-[13.5px] leading-relaxed text-ink">
              {parts.map((p, i) =>
                p.kind === "same" ? (
                  <span key={i}>{p.text}</span>
                ) : p.kind === "del" ? (
                  <del key={i} className={cn("transition-colors duration-300", revised ? "text-muted line-through" : "text-ink no-underline")}>
                    {p.text}
                  </del>
                ) : revised ? (
                  <ins key={i} className={cn("rounded-sm font-medium no-underline", look.text, animate && fadeIn)}>
                    {p.text}
                  </ins>
                ) : null,
              )}
            </p>
          </div>
        </div>
      );
    }
    case "resultado":
      return (
        <div className="flex gap-3">
          <span aria-hidden className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-ok-soft text-ok">
            <Check className="h-5 w-5" strokeWidth={2.4} />
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <div className="flex flex-col">
              <p className="m-0 text-[15px] font-semibold text-ink">{context.title}</p>
              <p className="m-0 text-[12.5px] tabular-nums text-muted">{context.summary}</p>
            </div>
            {context.changes?.length ? (
              <ul aria-label="O que mudou" className="m-0 flex list-none flex-wrap gap-1.5 p-0">
                {context.changes.map((c) => (
                  <li key={c} className="rounded-md bg-soft px-1.5 py-0.5 font-mono text-[11.5px] text-ink-soft">
                    {c}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      );
    case "erro":
      return (
        <div className="flex gap-3">
          <span aria-hidden className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-rose-soft text-rose">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div className="flex min-w-0 flex-1 flex-col">
            <p className="m-0 text-[15px] font-semibold text-ink">{context.title}</p>
            {context.detail && <p className="m-0 text-[12.5px] text-muted">{context.detail}</p>}
          </div>
        </div>
      );
  }
}

function StepIcon({ status, look, phase }: { status: AgentPlanStep["status"]; look: PhaseLook; phase: AgentPhase }) {
  if (status === "feito")
    return (
      <span aria-hidden className={cn("grid h-4 w-4 shrink-0 place-items-center rounded-full text-surface", look.fill)}>
        <Check className="h-2.5 w-2.5" strokeWidth={3.5} />
      </span>
    );
  if (status === "atual") {
    if (phase === "falhou") return <AlertTriangle aria-hidden className="h-4 w-4 shrink-0 text-rose" />;
    return (
      <span
        aria-hidden
        className={cn(
          "h-4 w-4 shrink-0 rounded-full border-2 border-transparent border-t-current border-r-current [animation-duration:900ms]",
          look.text,
          look.working ? "animate-spin" : "opacity-70",
        )}
      />
    );
  }
  return <span aria-hidden className="h-4 w-4 shrink-0 rounded-full border-[1.5px] border-line-strong" />;
}

const stepStatusLabel = { pendente: "pendente", atual: "em andamento", feito: "concluído" } as const;

const panel = "rounded-xl border border-line bg-surface";

/**
 * Card de atividade do agente, por fases: marca + fase no topo, barra de progresso
 * na cor da fase, plano com o passo atual, o contexto da fase (arquivo, busca,
 * ideias, escrita, revisão, resultado), ferramentas, modelo e consumo (tokens,
 * custo e tempo) com Pausar e Parar sempre ao alcance. Controlado: o app passa a
 * fase e os dados; para demonstração, use `useAgentActivityDemo()`.
 */
export function AgentActivityCard({
  phase,
  progress,
  task,
  plan,
  context,
  tools,
  model,
  usage,
  onPause,
  onResume,
  onStop,
  onRestart,
  unsavedChanges = false,
  agentName = "Agente de código",
  phaseLabel,
  animate = true,
  label,
  className,
}: {
  phase: AgentPhase;
  /** Progresso da tarefa, de 0 a 1. */
  progress: number;
  /** Título da tarefa ("Adicionar alternador de tema escuro"). */
  task: string;
  plan: AgentPlanStep[];
  /** Painel da fase atual. Sem ele, o card mostra só o plano. */
  context?: AgentPhaseContext;
  tools?: AgentTool[];
  /** Nome do modelo (chip estático) ou o `ModelPicker` controlado. */
  model?: string | { models: ModelOption[]; value: string; onChange: (id: string) => void };
  usage: AgentUsage;
  onPause?: () => void;
  onResume?: () => void;
  onStop?: () => void;
  /** "Executar de novo" depois de concluído, parado ou falhou. */
  onRestart?: () => void;
  /** Há alterações não salvas: Parar pede confirmação antes. */
  unsavedChanges?: boolean;
  agentName?: string;
  /** Troca a palavra da fase no cabeçalho ("Lendo tokens.css"). */
  phaseLabel?: string;
  /** `false` mostra cada painel já no estado final (documentação, listas, impressão). */
  animate?: boolean;
  /** Nome acessível do card. Padrão: "<agente>: <tarefa>". */
  label?: string;
  className?: string;
}) {
  const look = phaseLook[phase];
  const done = plan.filter((s) => s.status === "feito").length;
  const pct = Math.round(Math.min(1, Math.max(0, progress)) * 100);
  const ended = phase === "concluido" || phase === "parado" || phase === "falhou";
  const [confirming, setConfirming] = useState(false);

  // Anúncio para leitor de tela: troca de fase e passo concluído (não a cada token).
  const [announce, setAnnounce] = useState("");
  const prev = useRef({ phase, done });
  useEffect(() => {
    const p = prev.current;
    if (p.phase === phase && p.done === done) return;
    const parts: string[] = [];
    if (done > p.done) {
      const last = plan.filter((s) => s.status === "feito").at(-1);
      if (last) parts.push(`Passo concluído: ${last.label}.`);
    }
    if (p.phase !== phase) parts.push(`${phaseLabel ?? look.label}.`);
    prev.current = { phase, done };
    if (parts.length) setAnnounce(parts.join(" "));
  }, [phase, done, plan, phaseLabel, look.label]);

  const stop = () => (unsavedChanges ? setConfirming(true) : onStop?.());

  return (
    <section aria-label={label ?? `${agentName}: ${task}`} className={cn("flex min-w-0 flex-col gap-1.5 rounded-2xl border border-line bg-soft p-1.5", className)}>
      <div className="flex flex-col gap-2.5 px-3 pb-1.5 pt-2.5">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <AgentMark phase={phase} live={look.working} size={18} />
            <span className="truncate text-[15px] font-semibold text-ink">{agentName}</span>
          </div>
          <AgentPhaseBadge phase={phase} label={phaseLabel} />
        </div>
        <div role="progressbar" aria-label="Progresso da tarefa" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} className="h-[3px] overflow-hidden rounded-full bg-line">
          <div className={cn("h-full rounded-full transition-[width] duration-500 ease-out", look.fill)} style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className={cn(panel, "flex flex-col gap-3 p-4")}>
        <h3 className="m-0 flex min-w-0 items-baseline gap-2 text-[14px] font-semibold text-ink">
          <span className="min-w-0 truncate">{task}</span>
          <span className="shrink-0 text-[12.5px] font-normal tabular-nums text-muted" aria-label={`${done} de ${plan.length} passos`}>
            {done} / {plan.length}
          </span>
        </h3>
        <ol className="m-0 flex list-none flex-col gap-2 p-0">
          {plan.map((s) => (
            <li key={s.id} className="flex min-w-0 items-center gap-2.5 text-[13.5px]">
              <StepIcon status={s.status} look={look} phase={phase} />
              <span className={cn("min-w-0", s.status === "feito" ? "text-muted line-through decoration-line-strong" : s.status === "atual" ? "font-medium text-ink" : "text-ink-soft")}>
                {s.label}
                <span className="sr-only"> ({stepStatusLabel[s.status]})</span>
              </span>
            </li>
          ))}
        </ol>
      </div>

      {context && (
        <div key={context.kind} className={cn(panel, "min-h-[88px] p-4", animate && fadeIn)}>
          <ContextPanel context={context} look={look} animate={animate} />
        </div>
      )}

      <div className={cn(panel, "flex flex-col")}>
        {(tools?.length || model) && (
          <div className="flex min-w-0 items-center justify-between gap-2 border-b border-line px-2.5 py-2">
            {tools?.length ? (
              <ul aria-label="Ferramentas" className="m-0 flex min-w-0 list-none flex-wrap gap-0.5 p-0">
                {tools.map((t) => (
                  <li
                    key={t.id}
                    aria-current={t.active ? "true" : undefined}
                    className={cn("rounded-md px-2 py-0.5 text-[12.5px] transition-colors duration-150", t.active ? cn("font-medium", look.soft, look.text) : "text-ink-soft")}
                  >
                    {t.label}
                    {t.active && <span className="sr-only"> (em uso)</span>}
                  </li>
                ))}
              </ul>
            ) : (
              <span />
            )}
            {typeof model === "string" ? (
              <span className="shrink-0 whitespace-nowrap text-[12.5px] text-ink-soft">
                <span className="sr-only">Modelo: </span>
                {model}
              </span>
            ) : model ? (
              <ModelPicker models={model.models} value={model.value} onChange={model.onChange} />
            ) : null}
          </div>
        )}
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-2 px-3 py-2.5">
          <p className="m-0 flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1 whitespace-nowrap font-mono text-[12px] tabular-nums text-muted">
            <span aria-hidden className={cn("h-1.5 w-1.5 shrink-0 rounded-full", look.working ? look.fill : "bg-line-strong")} />
            <span>
              {formatCompact(usage.tokens)} <span className="font-sans">tokens</span>
            </span>
            <span>
              <span className="sr-only">Custo: </span>
              {formatCurrency(usage.cost)}
            </span>
            <span>
              <span className="sr-only">Tempo: </span>
              <time dateTime={`PT${Math.floor(usage.elapsedMs / 1000)}S`}>{formatMoment(usage.elapsedMs / 1000)}</time>
            </span>
          </p>
          <div className="ml-auto flex shrink-0 items-center gap-1.5">
            {ended ? (
              onRestart && (
                <Button size="sm" onClick={onRestart}>
                  <RotateCcw aria-hidden />
                  Executar de novo
                </Button>
              )
            ) : (
              <>
                {phase === "pausado"
                  ? onResume && (
                      <Button size="sm" onClick={onResume}>
                        <Play aria-hidden />
                        Retomar
                      </Button>
                    )
                  : onPause && (
                      <Button size="sm" variant="ghost" onClick={onPause}>
                        <Pause aria-hidden />
                        Pausar
                      </Button>
                    )}
                {onStop && (
                  <IconButton label="Parar o agente" onClick={stop} className="h-9 w-9 ring-1 ring-inset ring-line">
                    <X />
                  </IconButton>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        {announce}
      </p>
      {onStop && (
        <ConfirmDialog
          open={confirming}
          onClose={() => setConfirming(false)}
          onConfirm={() => {
            setConfirming(false);
            onStop();
          }}
          title="Parar o agente?"
          description="Há alterações em andamento que ainda não foram salvas. Ao parar, elas são descartadas."
          confirmLabel="Parar agente"
          tone="danger"
        />
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Demonstração                                                        */
/* ------------------------------------------------------------------ */

const demoPlan = ["Ler os tokens do tema", "Buscar exemplos de código aberto", "Escolher a estratégia de tokens", "Implementar o alternador", "Corrigir contraste no hover"];

const demoTools: AgentTool[] = [
  { id: "github", label: "GitHub" },
  { id: "arquivos", label: "Arquivos" },
  { id: "figma", label: "Figma" },
  { id: "linear", label: "Linear" },
  { id: "npm", label: "npm" },
];

type DemoBeat = { phase: AgentPhase; step: number; tool?: string; context: AgentPhaseContext };

const demoBeats: { from: number; beat: DemoBeat }[] = [
  { from: 0, beat: { phase: "lendo", step: 0, tool: "arquivos", context: { kind: "arquivo", path: "src/styles/tokens.css" } } },
  {
    from: 2,
    beat: {
      phase: "buscando",
      step: 1,
      tool: "github",
      context: {
        kind: "busca",
        query: "estratégia de tokens para tema escuro",
        results: [
          { title: "Temas com variáveis CSS", source: "docs.exemplo.dev/temas" },
          { title: "Padrões de modo escuro", source: "tailwindcss.com" },
          { title: "Alternador de tema acessível", source: "github.com/exemplo/tema" },
        ],
      },
    },
  },
  { from: 5, beat: { phase: "pensando", step: 2, context: { kind: "ideias", items: ["Variáveis CSS, não troca de classe", "Seguir a preferência do sistema", "Guardar a escolha no navegador", "Transição suave de cor"] } } },
  {
    from: 8,
    beat: {
      phase: "escrevendo",
      step: 3,
      tool: "arquivos",
      context: { kind: "escrita", path: "src/components/theme-toggle.tsx", text: "O alternador troca as cores por variáveis CSS. A preferência do sistema vale por padrão e a escolha fica guardada no navegador." },
    },
  },
  {
    from: 12,
    beat: {
      phase: "revisando",
      step: 4,
      tool: "arquivos",
      context: {
        kind: "revisao",
        path: "theme-toggle.tsx",
        before: "O alternador guarda o tema em useState. O anel de foco usa um azul fixo, ilegível no escuro.",
        after: "O alternador guarda o tema em useTheme. O anel de foco usa o token de foco, legível nos dois temas.",
      },
    },
  },
];

const DEMO_END = 15;
const TOKENS_PER_S = 700;
const COST_PER_TOKEN = 0.000016;

/**
 * Percorre as fases do `AgentActivityCard` em ~15 s (só com a aba visível), com
 * Pausar, Retomar, Parar e Executar de novo funcionando. Devolve as props do card:
 * `<AgentActivityCard {...useAgentActivityDemo()} />`. Com movimento reduzido,
 * começa no fim (concluído). `loop` recomeça sozinho 4 s depois de concluir.
 */
export function useAgentActivityDemo({ task = "Lançar alternador de tema escuro", loop = false, autoplay = true }: { task?: string; loop?: boolean; autoplay?: boolean } = {}) {
  const reduced = useReducedMotion();
  const [t, setT] = useState(0);
  const [state, setState] = useState<"rodando" | "pausado" | "parado">(autoplay ? "rodando" : "pausado");
  useEffect(() => {
    if (reduced) setT(DEMO_END);
  }, [reduced]);
  const running = state === "rodando" && !reduced;
  useVisibleInterval(() => setT((v) => (v >= DEMO_END ? (loop ? (v >= DEMO_END + 4 ? 0 : v + 1) : v) : v + 1)), running && (t < DEMO_END || loop) ? 1000 : null);

  const restart = useCallback(() => {
    setT(0);
    setState("rodando");
  }, []);

  return useMemo(() => {
    const finished = t >= DEMO_END;
    const beat = [...demoBeats].reverse().find((b) => t >= b.from)!.beat;
    const step = finished ? demoPlan.length : beat.step;
    const seconds = Math.min(t, DEMO_END);
    const tokens = Math.round(seconds * TOKENS_PER_S + (seconds ? 352 : 0));
    const phase: AgentPhase = finished ? "concluido" : state === "pausado" ? "pausado" : state === "parado" ? "parado" : beat.phase;
    const context: AgentPhaseContext = finished
      ? { kind: "resultado", title: "Tema escuro entregue", summary: `${demoPlan.length} passos · ${formatCompact(tokens)} tokens · ${formatMoment(seconds)}`, changes: ["theme-toggle.tsx", "tokens.css", "layout.tsx"] }
      : state === "parado"
        ? { kind: "erro", title: "Execução parada", detail: "Nada foi salvo. Os passos concluídos continuam no histórico." }
        : beat.context;
    return {
      phase,
      task,
      progress: seconds / DEMO_END,
      plan: demoPlan.map((label, i): AgentPlanStep => ({ id: `p${i}`, label, status: i < step ? "feito" : i === step ? "atual" : "pendente" })),
      context,
      tools: demoTools.map((tool) => ({ ...tool, active: !finished && state === "rodando" && tool.id === beat.tool })),
      model: "Sol",
      usage: { tokens, cost: tokens * COST_PER_TOKEN, elapsedMs: seconds * 1000 },
      unsavedChanges: !finished && (beat.phase === "escrevendo" || beat.phase === "revisando"),
      onPause: () => setState("pausado"),
      onResume: () => setState("rodando"),
      onStop: () => setState("parado"),
      onRestart: restart,
    };
  }, [t, state, task, restart]);
}

/** Um quadro estático de cada fase da demonstração (para documentação e estados). */
export function agentActivitySample(phase: AgentPhase): Omit<Parameters<typeof AgentActivityCard>[0], "onPause" | "onResume" | "onStop" | "onRestart"> {
  const at: Record<AgentPhase, number> = { lendo: 1, buscando: 3, pensando: 6, escrevendo: 10, revisando: 13, concluido: DEMO_END, pausado: 9, parado: 9, falhou: 13 };
  const t = at[phase];
  const beat = [...demoBeats].reverse().find((b) => t >= b.from)!.beat;
  const finished = phase === "concluido";
  const step = finished ? demoPlan.length : beat.step;
  const tokens = Math.round(t * TOKENS_PER_S + 352);
  const context: AgentPhaseContext = finished
    ? { kind: "resultado", title: "Tema escuro entregue", summary: `${demoPlan.length} passos · ${formatCompact(tokens)} tokens · ${formatMoment(t)}`, changes: ["theme-toggle.tsx", "tokens.css", "layout.tsx"] }
    : phase === "falhou"
      ? { kind: "erro", title: "Não deu para salvar theme-toggle.tsx", detail: "O repositório recusou a escrita (sem permissão na branch main). Peça acesso ou escolha outra branch." }
      : phase === "parado"
        ? { kind: "erro", title: "Execução parada", detail: "Nada foi salvo. Os passos concluídos continuam no histórico." }
        : beat.context;
  return {
    phase,
    task: "Lançar alternador de tema escuro",
    progress: t / DEMO_END,
    plan: demoPlan.map((label, i): AgentPlanStep => ({ id: `p${i}`, label, status: i < step ? "feito" : i === step ? "atual" : "pendente" })),
    context,
    tools: demoTools.map((tool) => ({ ...tool, active: phaseLook[phase].working && tool.id === beat.tool })),
    model: "Sol",
    usage: { tokens, cost: tokens * COST_PER_TOKEN, elapsedMs: t * 1000 },
  };
}
