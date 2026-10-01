"use client";

import { Check } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../lib/cn";
import { toneDot, type Tone } from "./primitives";

/*
 * Status de trabalho. Paleta fixa de 5 estados (docs/fundamentos/cor.md):
 *   queued  fila       #9aa0a8
 *   active  em curso   #184560
 *   review  revisão    #b9915b
 *   done    entregue   #2e7d32
 *   blocked bloqueado  #b71c1c
 * Rótulos são do produto; as cores e a ordem são do sistema.
 */

export type WorkStatus = "queued" | "active" | "review" | "done" | "blocked";

export const statusColor: Record<WorkStatus, string> = {
  queued: "var(--ds-chart-6)",
  active: "var(--ds-blue)",
  review: "var(--ds-accent)",
  done: "var(--ds-ok)",
  blocked: "var(--ds-rose)",
};
export const statusOrder: WorkStatus[] = ["queued", "active", "review", "done", "blocked"];
export const statusLabel: Record<WorkStatus, string> = {
  queued: "Na fila",
  active: "Em curso",
  review: "Em revisão",
  done: "Concluído",
  blocked: "Bloqueado",
};

/** Ponto de status + rótulo. Sem fundo: status em lista é texto, não etiqueta. */
export function StatusLabel({ status, label }: { status: WorkStatus; label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[12.5px] text-ink-soft">
      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: statusColor[status] }} aria-hidden />
      {label ?? statusLabel[status]}
    </span>
  );
}

/** Saúde de uma entidade: ponto + palavra. Cor nunca sozinha. */
export function HealthDot({ tone, label }: { tone: Exclude<Tone, "accent" | "info">; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[12.5px] text-ink-soft">
      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", toneDot[tone])} aria-hidden />
      {label}
    </span>
  );
}

/**
 * Barra empilhada de distribuição (quantos em cada estado) + legenda.
 * Use para visão geral de uma carteira; não para progresso de um item.
 */
export function StatusBar({
  counts,
  labels = statusLabel,
  legend = true,
  className,
}: {
  counts: Partial<Record<WorkStatus, number>>;
  labels?: Record<WorkStatus, string>;
  legend?: boolean;
  className?: string;
}) {
  const total = statusOrder.reduce((s, k) => s + (counts[k] ?? 0), 0);
  const parts = statusOrder.filter((k) => (counts[k] ?? 0) > 0);
  const summary = parts.map((k) => `${counts[k]} ${labels[k].toLowerCase()}`).join(", ");
  return (
    <div className={cn("min-w-0", className)}>
      <div role="img" aria-label={total ? summary : "Sem itens"} className="flex h-2 w-full gap-[2px] overflow-hidden rounded-full bg-line">
        {parts.map((k) => (
          <span key={k} className="h-full first:rounded-l-full last:rounded-r-full" style={{ width: `${((counts[k] ?? 0) / total) * 100}%`, background: statusColor[k] }} />
        ))}
      </div>
      {legend && (
        <ul className="mt-2.5 flex list-none flex-wrap gap-x-4 gap-y-1 p-0 text-[12px] text-muted">
          {parts.map((k) => (
            <li key={k} className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: statusColor[k] }} aria-hidden />
              {labels[k]}
              <span className="font-medium tabular-nums text-ink">{counts[k]}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export type Step = { id: string; label: string; hint?: string; state: "done" | "current" | "upcoming" };

/**
 * Etapas de um ciclo/processo. Concluída = círculo ink com check; atual =
 * anel dourado (o "próximo passo" é o único uso de moldura dourada);
 * futura = anel line. Horizontal ≥ 640px, vertical abaixo.
 */
export function Stepper({ steps, label = "Etapas" }: { steps: Step[]; label?: string }) {
  return (
    <ol aria-label={label} className="flex list-none flex-col gap-3 p-0 sm:flex-row sm:gap-0">
      {steps.map((s, i) => (
        <li key={s.id} aria-current={s.state === "current" ? "step" : undefined} className="flex min-w-0 flex-1 items-start gap-2.5 sm:flex-col sm:gap-2">
          <div className="flex items-center sm:w-full">
            <span
              className={cn(
                "grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-medium tabular-nums",
                s.state === "done" && "bg-primary text-on-primary",
                s.state === "current" && "bg-surface text-ink ring-2 ring-accent",
                s.state === "upcoming" && "bg-surface text-muted ring-1 ring-line-strong",
              )}
            >
              {s.state === "done" ? <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> : i + 1}
            </span>
            {i < steps.length - 1 && <span aria-hidden className={cn("mx-2 hidden h-px flex-1 sm:block", s.state === "done" ? "bg-primary" : "bg-line")} />}
          </div>
          <div className="min-w-0 sm:pr-3">
            <div className={cn("text-[12.5px] leading-snug", s.state === "upcoming" ? "text-muted" : "font-medium text-ink")}>{s.label}</div>
            {s.hint && <div className="mt-0.5 text-[11px] text-muted">{s.hint}</div>}
          </div>
        </li>
      ))}
    </ol>
  );
}

/**
 * Moldura de "próximo passo": o único lugar em que o dourado emoldura algo.
 * Uma por tela, no máximo.
 */
export function NextStep({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <section className="rounded-xl border border-accent/40 bg-accent-soft/40 px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="m-0 text-[11px] font-medium uppercase tracking-[0.08em] text-accent-deep">Próximo passo</p>
          <p className="m-0 mt-1 text-[14px] font-medium">{title}</p>
          {children && <div className="mt-1 text-[13px] leading-relaxed text-ink-soft">{children}</div>}
        </div>
        {action}
      </div>
    </section>
  );
}

/** Linha do tempo vertical de eventos (atividade, histórico). */
export function Timeline({ items }: { items: { id: string; title: ReactNode; meta?: ReactNode; tone?: Tone; body?: ReactNode }[] }) {
  return (
    <ol className="list-none p-0">
      {items.map((it, i) => (
        <li key={it.id} className="relative flex gap-3 pb-5 last:pb-0">
          {i < items.length - 1 && <span aria-hidden className="absolute left-[3px] top-3 h-full w-px bg-line" />}
          <span aria-hidden className={cn("relative mt-1.5 h-[7px] w-[7px] shrink-0 rounded-full ring-2 ring-surface", toneDot[it.tone ?? "neutral"])} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
              <div className="text-[13.5px] font-medium">{it.title}</div>
              {it.meta && <div className="text-[11px] tabular-nums text-muted">{it.meta}</div>}
            </div>
            {it.body && <div className="mt-1 text-[13px] leading-relaxed text-ink-soft">{it.body}</div>}
          </div>
        </li>
      ))}
    </ol>
  );
}
