"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../lib/cn";

/*
 * Etiquetas coloridas (categoria, tipo, status) no estilo "banco de dados":
 * fundo suave + texto AA, 9 matizes em tokens (--ds-tag-*-bg/-fg), claros e
 * escuros. Regra (docs/padroes/tags.md): a cor agrupa, a palavra significa —
 * nunca use só a cor para dizer "erro" ou "pronto".
 */

export type TagColor = "gray" | "brown" | "orange" | "yellow" | "green" | "blue" | "purple" | "pink" | "red";
export const tagColors: TagColor[] = ["gray", "brown", "orange", "yellow", "green", "blue", "purple", "pink", "red"];

const bg: Record<TagColor, string> = {
  gray: "bg-tag-gray-bg text-tag-gray-fg",
  brown: "bg-tag-brown-bg text-tag-brown-fg",
  orange: "bg-tag-orange-bg text-tag-orange-fg",
  yellow: "bg-tag-yellow-bg text-tag-yellow-fg",
  green: "bg-tag-green-bg text-tag-green-fg",
  blue: "bg-tag-blue-bg text-tag-blue-fg",
  purple: "bg-tag-purple-bg text-tag-purple-fg",
  pink: "bg-tag-pink-bg text-tag-pink-fg",
  red: "bg-tag-red-bg text-tag-red-fg",
};
const dot: Record<TagColor, string> = {
  gray: "bg-tag-gray-fg",
  brown: "bg-tag-brown-fg",
  orange: "bg-tag-orange-fg",
  yellow: "bg-tag-yellow-fg",
  green: "bg-tag-green-fg",
  blue: "bg-tag-blue-fg",
  purple: "bg-tag-purple-fg",
  pink: "bg-tag-pink-fg",
  red: "bg-tag-red-fg",
};

/** Cor estável para um texto (mesma categoria = mesma cor em qualquer tela). */
export function tagColorFor(label: string): TagColor {
  let h = 0;
  for (const ch of label) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return tagColors[h % tagColors.length];
}

/**
 * Etiqueta. `variant="soft"` (padrão) = fundo colorido; `"dot"` = contorno
 * neutro com bolinha colorida (melhor em listas densas e ao lado de outras
 * etiquetas). `onRemove` mostra o ×.
 */
export function TagPill({
  children,
  color,
  variant = "soft",
  size = "md",
  icon,
  onRemove,
  className,
}: {
  children: ReactNode;
  /** Padrão: derivada do texto (tagColorFor). */
  color?: TagColor;
  variant?: "soft" | "dot";
  size?: "sm" | "md";
  icon?: ReactNode;
  onRemove?: () => void;
  className?: string;
}) {
  const c = color ?? (typeof children === "string" ? tagColorFor(children) : "gray");
  return (
    <span
      className={cn(
        "inline-flex min-w-0 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md font-medium leading-none [&_svg]:h-3 [&_svg]:w-3",
        size === "sm" ? "h-5 px-1.5 text-[11px]" : "h-6 px-2 text-[12px]",
        variant === "soft" ? bg[c] : "bg-surface text-ink-soft ring-1 ring-inset ring-line",
        onRemove && "pr-1",
        className,
      )}
    >
      {variant === "dot" && <span aria-hidden className={cn("h-1.5 w-1.5 shrink-0 rounded-full", dot[c])} />}
      {icon}
      <span className="truncate">{children}</span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remover ${typeof children === "string" ? children : "etiqueta"}`}
          className="ds-hit grid h-4 w-4 place-items-center rounded opacity-70 hover:bg-ink/10 hover:opacity-100"
        >
          <X />
        </button>
      )}
    </span>
  );
}

export type Priority = "urgente" | "alta" | "media" | "baixa" | "sem";
export const priorityLabel: Record<Priority, string> = { urgente: "Urgente", alta: "Alta", media: "Média", baixa: "Baixa", sem: "Sem prioridade" };

/**
 * Ícone de prioridade em barras (3 barras crescentes; urgente = quadrado com !).
 * Cor só reforça: o rótulo vem ao lado ou no aria-label.
 */
export function PriorityIcon({ priority, className, title }: { priority: Priority; className?: string; title?: string }) {
  const label = title ?? priorityLabel[priority];
  if (priority === "urgente")
    return (
      <svg viewBox="0 0 16 16" className={cn("h-3.5 w-3.5 shrink-0", className)} role="img" aria-label={label}>
        <rect x="1.5" y="1.5" width="13" height="13" rx="3" fill="var(--ds-rose)" />
        <rect x="7.25" y="4" width="1.5" height="5" rx=".75" fill="var(--ds-on-ink)" />
        <circle cx="8" cy="11.2" r=".95" fill="var(--ds-on-ink)" />
      </svg>
    );
  const on = { alta: 3, media: 2, baixa: 1, sem: 0 }[priority];
  const color = priority === "alta" ? "var(--ds-amber)" : "var(--ds-ink-soft)";
  return (
    <svg viewBox="0 0 16 16" className={cn("h-3.5 w-3.5 shrink-0", className)} role="img" aria-label={label}>
      {[0, 1, 2].map((i) => (
        <rect key={i} x={2 + i * 4.5} y={11 - i * 3.5} width="3" height={3 + i * 3.5} rx="1" fill={i < on ? color : "var(--ds-line-strong)"} />
      ))}
    </svg>
  );
}

/** Prioridade com ícone + rótulo (chip neutro). */
export function PriorityPill({ priority, size = "md", className }: { priority: Priority; size?: "sm" | "md"; className?: string }) {
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md bg-surface font-medium text-ink-soft ring-1 ring-inset ring-line", size === "sm" ? "h-5 px-1.5 text-[11px]" : "h-6 px-2 text-[12px]", className)}>
      <PriorityIcon priority={priority} />
      {priorityLabel[priority]}
    </span>
  );
}

export type TaskStatus = "nao-iniciado" | "em-andamento" | "em-revisao" | "concluido" | "bloqueado" | "sem-status";
const statusPreset: Record<TaskStatus, { label: string; color: TagColor }> = {
  "nao-iniciado": { label: "Não iniciado", color: "red" },
  "em-andamento": { label: "Em andamento", color: "yellow" },
  "em-revisao": { label: "Em revisão", color: "blue" },
  concluido: { label: "Concluído", color: "green" },
  bloqueado: { label: "Bloqueado", color: "red" },
  "sem-status": { label: "Sem status", color: "gray" },
};
export const taskStatusLabel = Object.fromEntries(Object.entries(statusPreset).map(([k, v]) => [k, v.label])) as Record<TaskStatus, string>;

/** Status de tarefa com cor fixa por estado (presets). `label` sobrescreve o texto. */
export function StatusPill({ status, label, size = "md", variant = "soft", className }: { status: TaskStatus; label?: string; size?: "sm" | "md"; variant?: "soft" | "dot"; className?: string }) {
  const p = statusPreset[status];
  return (
    <TagPill color={p.color} size={size} variant={status === "sem-status" ? "dot" : variant} className={className}>
      {label ?? p.label}
    </TagPill>
  );
}
