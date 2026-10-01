"use client";

import { Ellipsis, Lock, Play, Plus, Sparkles, Upload, Wand2 } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../lib/cn";
import { Menu, type MenuEntry } from "./overlays-extra";
import { RichTextEditor } from "./rich-text";

/*
 * Construtor de agente: a "ficha" do agente ao lado da conversa com ele.
 * Seções fixas e nessa ordem: Gatilhos (quando roda) → Propriedades (com o
 * que trabalha: ferramentas, entrada, saída, verificações) → Instruções (o
 * que faz). Ver docs/padroes/agentes.md.
 */

/** Ícone de app/ferramenta: quadradinho com a inicial na cor da marca do app. */
export function ToolGlyph({ name, color, icon, size = 18, className }: { name: string; color?: string; icon?: ReactNode; size?: number; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-grid shrink-0 place-items-center rounded-[5px] font-semibold leading-none [&_svg]:h-[70%] [&_svg]:w-[70%]", className)}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.55),
        background: color ? `color-mix(in oklab, ${color} 16%, transparent)` : "var(--ds-soft)",
        color: color ? `color-mix(in oklab, ${color} 75%, var(--ds-ink))` : "var(--ds-ink-soft)",
      }}
    >
      {icon ?? name.slice(0, 1).toUpperCase()}
    </span>
  );
}

export type AgentStatus = "rascunho" | "publicado" | "alterado";
const statusText: Record<AgentStatus, string> = { rascunho: "Rascunho", publicado: "Publicado", alterado: "Alterações não publicadas" };

/**
 * Ações do construtor: status + Compartilhar · Testar · Publicar · ⋯.
 * "Publicar" é o primário; com alterações pendentes vira "Publicar alterações".
 */
export function PublishBar({
  status,
  onShare,
  onTest,
  onPublish,
  testing = false,
  menu,
  className,
}: {
  status: AgentStatus;
  onShare?: () => void;
  onTest?: () => void;
  onPublish?: () => void;
  testing?: boolean;
  menu?: MenuEntry[];
  className?: string;
}) {
  const dot = status === "publicado" ? "bg-ok" : status === "alterado" ? "bg-amber" : "bg-line-strong";
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <span className="mr-1 hidden items-center gap-1.5 text-[12px] text-muted md:inline-flex">
        <span aria-hidden className={cn("h-1.5 w-1.5 rounded-full", dot)} />
        {statusText[status]}
      </span>
      {onShare && (
        <button type="button" onClick={onShare} className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[12.5px] text-ink-soft hover:bg-soft hover:text-ink">
          <Lock className="h-3.5 w-3.5" /> <span className="max-sm:sr-only">Compartilhar</span>
        </button>
      )}
      {onTest && (
        <button
          type="button"
          onClick={onTest}
          disabled={testing}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-surface px-2.5 text-[12.5px] font-medium text-ink ring-1 ring-line hover:bg-soft disabled:opacity-60"
        >
          <Play className="h-3.5 w-3.5" /> {testing ? "Testando…" : "Testar"}
        </button>
      )}
      {onPublish && (
        <button
          type="button"
          onClick={onPublish}
          disabled={status === "publicado"}
          className="ui-button ui-button-primary inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-[12.5px] font-medium text-on-primary hover:bg-primary/90 disabled:opacity-50"
        >
          <Upload className="h-3.5 w-3.5" /> {status === "alterado" ? "Publicar alterações" : status === "publicado" ? "Publicado" : "Publicar"}
        </button>
      )}
      {menu && (
        <Menu label="Mais ações" align="end" triggerClassName="!h-8 !w-8 justify-center !px-0 !bg-transparent !ring-0 hover:!bg-soft text-muted" trigger={<Ellipsis />} items={menu} />
      )}
    </div>
  );
}

/** Cabeçalho do agente: ícone grande, nome, descrição (ambos editáveis inline se receber os handlers). */
export function AgentHeader({
  icon,
  title,
  description,
  onTitleChange,
  onDescriptionChange,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  onTitleChange?: (v: string) => void;
  onDescriptionChange?: (v: string) => void;
  className?: string;
}) {
  return (
    <header className={cn("min-w-0", className)}>
      <span className="grid h-12 w-12 place-items-center rounded-xl border border-line bg-surface text-blue shadow-surface [&_svg]:h-5 [&_svg]:w-5">
        {icon ?? <Sparkles />}
      </span>
      {onTitleChange ? (
        <input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          aria-label="Nome do agente"
          className="ds-bare -mx-1.5 mt-4 w-[calc(100%+12px)] rounded-md bg-transparent px-1.5 text-[24px] font-semibold tracking-[-0.02em] text-ink outline-none hover:bg-soft focus-visible:bg-soft focus-visible:ring-2 focus-visible:ring-muted/40"
          style={{ fontFamily: "var(--ds-font-display)" }}
        />
      ) : (
        <h1 className="m-0 mt-4 text-[24px] font-semibold tracking-[-0.02em]" style={{ fontFamily: "var(--ds-font-display)" }}>
          {title}
        </h1>
      )}
      {onDescriptionChange ? (
        <input
          value={description ?? ""}
          onChange={(e) => onDescriptionChange(e.target.value)}
          aria-label="Descrição do agente"
          placeholder="O que este agente faz, em uma frase"
          className="ds-bare -mx-1.5 mt-1 w-[calc(100%+12px)] rounded-md bg-transparent px-1.5 text-[14px] text-muted outline-none placeholder:text-muted hover:bg-soft focus-visible:bg-soft focus-visible:ring-2 focus-visible:ring-muted/40"
        />
      ) : (
        description && <p className="m-0 mt-1 text-[14px] text-muted">{description}</p>
      )}
    </header>
  );
}

/** Seção do construtor: título, selo opcional, descrição, ação à direita, conteúdo. */
export function BuilderSection({ title, description, badge, action, children, className }: { title: string; description?: ReactNode; badge?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("border-t border-line pt-6", className)}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="m-0 flex flex-wrap items-center gap-2 text-[14px] font-medium">
            {title}
            {badge}
          </h2>
          {description && <p className="m-0 mt-0.5 text-[12.5px] text-muted">{description}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children}
    </section>
  );
}

/** Botão "+ Adicionar" com menu (aceita submenus). */
export function AddPropertyMenu({ items, label = "Adicionar" }: { items: MenuEntry[]; label?: string }) {
  return (
    <Menu
      label={label}
      align="end"
      triggerClassName="!h-8 !px-2.5 !text-[12.5px] gap-1.5"
      trigger={
        <>
          <Plus /> {label}
        </>
      }
      items={items}
    />
  );
}

export type TriggerItem = { id: string; icon?: ReactNode; label: ReactNode };

/** Lista de gatilhos (quando o agente roda). Cada linha tem menu ⋯. */
export function TriggerList({ triggers, rowMenu, empty = "Nenhum gatilho: o agente só roda quando alguém pedir." }: { triggers: TriggerItem[]; rowMenu?: (t: TriggerItem) => MenuEntry[]; empty?: ReactNode }) {
  if (!triggers.length) return <p className="m-0 rounded-xl border border-dashed border-line px-4 py-3 text-[12.5px] text-muted">{empty}</p>;
  return (
    <ul className="list-none divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface p-0">
      {triggers.map((t) => (
        <TriggerRow key={t.id} icon={t.icon} menu={rowMenu?.(t)}>
          {t.label}
        </TriggerRow>
      ))}
    </ul>
  );
}

export function TriggerRow({ icon, children, menu }: { icon?: ReactNode; children: ReactNode; menu?: MenuEntry[] }) {
  return (
    <li className="group flex min-h-11 items-center gap-2.5 px-3.5 py-2 text-[13px]">
      {icon}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {menu && (
        <Menu
          label="Ações do gatilho"
          align="end"
          triggerClassName="!h-7 !w-7 justify-center !px-0 !bg-transparent !ring-0 text-muted hover:!bg-soft opacity-70 group-hover:opacity-100"
          trigger={<Ellipsis />}
          items={menu}
        />
      )}
    </li>
  );
}

export type ChipItem = { id: string; label: string; icon?: ReactNode };

/** Chips removíveis + "+" com menu para adicionar (ferramentas, saídas, skills). */
export function ChipPicker({ chips, onRemove, addItems, addLabel = "Adicionar", empty }: { chips: ChipItem[]; onRemove?: (id: string) => void; addItems?: MenuEntry[]; addLabel?: string; empty?: string }) {
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-1.5">
      {chips.map((c) => (
        <span key={c.id} className="group inline-flex h-8 items-center gap-1.5 rounded-lg bg-surface pl-2 pr-1.5 text-[12.5px] font-medium ring-1 ring-line">
          {c.icon}
          {c.label}
          {onRemove && (
            <button
              type="button"
              onClick={() => onRemove(c.id)}
              aria-label={`Remover ${c.label}`}
              className="ds-hit grid h-5 w-5 place-items-center rounded text-muted opacity-60 hover:bg-soft hover:text-ink group-hover:opacity-100"
            >
              ×
            </button>
          )}
        </span>
      ))}
      {!chips.length && empty && <span className="text-[12.5px] text-muted">{empty}</span>}
      {addItems && (
        <Menu label={addLabel} triggerClassName="!h-8 !w-8 justify-center !px-0 !bg-transparent !ring-0 text-muted hover:!bg-soft" trigger={<Plus />} items={addItems} />
      )}
    </div>
  );
}

/** Linha de propriedade: rótulo à esquerda (fixo) e valor/chips à direita; empilha no celular. */
export function PropertyRow({ label, children, hint }: { label: string; children: ReactNode; hint?: ReactNode }) {
  return (
    <div className="grid gap-1.5 py-2 sm:grid-cols-[140px_minmax(0,1fr)] sm:items-center sm:gap-4">
      <div className="text-[13px] text-ink-soft">
        {label}
        {hint && <div className="text-[11.5px] text-muted">{hint}</div>}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/** Instruções do agente: editor de texto rico com "Melhorar" (IA) no toolbar. */
export function AgentInstructions({ value, onChange, onEnhance, enhancing = false }: { value: string; onChange: (html: string) => void; onEnhance?: () => void; enhancing?: boolean }) {
  return (
    <RichTextEditor
      label="Instruções do agente"
      value={value}
      onChange={onChange}
      minHeight={220}
      placeholder="Descreva os passos: o que buscar, como decidir, o que entregar…"
      aside={
        onEnhance && (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={onEnhance}
            disabled={enhancing}
            className={cn("inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[12.5px] font-medium text-ink-soft hover:bg-soft hover:text-ink disabled:opacity-70", enhancing && "ds-shimmer")}
          >
            <Wand2 className="h-3.5 w-3.5" /> {enhancing ? "Melhorando…" : "Melhorar"}
          </button>
        )
      }
    />
  );
}
