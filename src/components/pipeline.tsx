"use client";

import { Check } from "lucide-react";
import type { DragEvent, ReactNode } from "react";
import { cn } from "../lib/cn";
import { Avatar } from "./primitives";

/*
 * Pipelines: qualquer fluxo de registros por etapas — negócios (CRM),
 * candidatos (ATS), pedidos e compras (ERP), tickets. O quadro em si é
 * KanbanBoard + KanbanColumn (collections.tsx); aqui ficam o caminho de
 * etapas de um registro e o card genérico de registro.
 */

export type PathStage = { id: string; label: string };

/**
 * Caminho de etapas de UM registro (topo da página de negócio/candidato).
 * Concluídas = check em ink; atual = moldura dourada; futuras = neutras.
 * `outcome` fecha o caminho como ganho/perdido. Clicável com onSelect.
 */
export function StagePath({
  stages,
  current,
  onSelect,
  outcome,
  label = "Etapas",
  className,
}: {
  stages: PathStage[];
  current: string;
  onSelect?: (id: string) => void;
  outcome?: { tone: "ok" | "bad"; label: string };
  label?: string;
  className?: string;
}) {
  const idx = stages.findIndex((s) => s.id === current);
  return (
    <ol aria-label={label} className={cn("flex list-none gap-1 overflow-x-auto p-0", className)}>
      {stages.map((s, i) => {
        const state = outcome ? (i <= idx ? "done" : "skipped") : i < idx ? "done" : i === idx ? "current" : "upcoming";
        const inner = (
          <>
            {state === "done" && <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={2.4} aria-hidden />}
            <span className="truncate">{s.label}</span>
          </>
        );
        const cls = cn(
          "flex h-9 min-w-[96px] flex-1 items-center justify-center gap-1.5 whitespace-nowrap px-3 text-[12.5px] transition-colors",
          i === 0 ? "rounded-l-lg" : "",
          i === stages.length - 1 && !outcome ? "rounded-r-lg" : "",
          state === "done" && "bg-primary font-medium text-on-primary",
          state === "current" && "bg-accent-soft font-medium text-accent-deep ring-1 ring-inset ring-accent/50",
          state === "upcoming" && "bg-soft text-muted",
          state === "skipped" && "bg-soft text-muted/70",
          onSelect && state !== "current" && "hover:brightness-95",
        );
        return (
          <li key={s.id} className="flex min-w-fit flex-1 sm:min-w-0" aria-current={state === "current" ? "step" : undefined}>
            {onSelect ? (
              <button type="button" className={cls} onClick={() => onSelect(s.id)}>
                {inner}
              </button>
            ) : (
              <span className={cls}>{inner}</span>
            )}
          </li>
        );
      })}
      {outcome && (
        <li className="flex">
          <span
            className={cn(
              "flex h-9 items-center rounded-r-lg px-3 text-[12.5px] font-medium",
              outcome.tone === "ok" ? "bg-ok text-on-ink" : "bg-rose text-on-ink",
            )}
          >
            {outcome.label}
          </span>
        </li>
      )}
    </ol>
  );
}

/**
 * Card de registro em quadro: título, subtítulo (empresa, vaga, cliente),
 * valor em destaque, etiquetas, dono e data. Genérico: negócio, candidato,
 * pedido, ticket. Status muda arrastando ou no registro, não no card.
 */
export function RecordCard({
  title,
  subtitle,
  value,
  tags,
  owner,
  meta,
  leading,
  tone,
  onOpen,
  draggable = true,
  onDragStart,
  className,
}: {
  title: string;
  subtitle?: ReactNode;
  value?: ReactNode;
  tags?: ReactNode;
  owner?: { name: string; initials: string; tint?: string };
  /** Canto inferior direito: prazo, idade, score. */
  meta?: ReactNode;
  /** Marca à esquerda do título (EntityMark, Avatar). */
  leading?: ReactNode;
  /** Borda de atenção: parado há muito tempo (warn) ou bloqueado (bad). */
  tone?: "warn" | "bad";
  onOpen?: () => void;
  draggable?: boolean;
  onDragStart?: (event: DragEvent) => void;
  className?: string;
}) {
  return (
    <article
      draggable={draggable}
      role={onOpen ? "button" : undefined}
      tabIndex={onOpen ? 0 : undefined}
      aria-label={onOpen ? `Abrir: ${title}` : undefined}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (onOpen && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onOpen();
        }
      }}
      onDragStart={onDragStart}
      className={cn(
        "kanban-task surface-card w-full rounded-tile border bg-surface p-3 text-left",
        onOpen && "surface-interactive cursor-pointer hover:border-line-strong",
        draggable && "cursor-grab active:cursor-grabbing",
        tone === "bad" ? "border-rose/30" : tone === "warn" ? "border-amber/35" : "border-line",
        className,
      )}
    >
      <div className="flex items-start gap-2.5">
        {leading}
        <div className="min-w-0 flex-1">
          <div className="text-[13.5px] font-medium leading-snug">{title}</div>
          {subtitle && <div className="mt-0.5 truncate text-[12px] text-muted">{subtitle}</div>}
        </div>
      </div>
      {value != null && <div className="mt-2 text-[15px] font-semibold tabular-nums tracking-tight">{value}</div>}
      {tags && <div className="mt-2 flex flex-wrap gap-1">{tags}</div>}
      {(owner || meta) && (
        <div className="mt-2.5 flex items-center justify-between gap-2">
          {owner ? <Avatar initials={owner.initials} tint={owner.tint} name={owner.name} size="sm" /> : <span />}
          {meta && <span className="text-[11.5px] tabular-nums text-muted">{meta}</span>}
        </div>
      )}
    </article>
  );
}
