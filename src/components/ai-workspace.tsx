"use client";

import {
  ArrowUp,
  AudioLines,
  Brain,
  ChevronDown,
  ChevronRight,
  ChevronsRight,
  CircleCheck,
  CircleX,
  Code,
  Copy,
  Database,
  Download,
  Ellipsis,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  Globe,
  Info,
  Layers,
  Link,
  LoaderCircle,
  Mail,
  Maximize2,
  Mic,
  Minimize2,
  Paperclip,
  PanelRightClose,
  Pencil,
  Pin,
  PinOff,
  Plus,
  Presentation,
  RotateCcw,
  Share2,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Square,
  ThumbsDown,
  ThumbsUp,
  Wrench,
  X,
  ChartLine,
  type LucideIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "../lib/cn";
import { formatNumber, formatPercent } from "../lib/format";
import { formatDuration } from "./ai";
import { Menu, Tooltip, type MenuEntry } from "./overlays-extra";
import { DsLink } from "./primitives";

/*
 * Workspace de agente (docs: showcase › IA e interação › Workspace de agente).
 * A conversa fica à esquerda; o que o agente PRODUZ (relatório, planilha,
 * contexto usado) vira artefato de primeira classe num painel à direita,
 * redimensionável. Regras:
 *   · toda resposta diz quanto tempo levou e o que o agente fez (RunSummary → AgentTrace)
 *   · artefatos abrem em aba, nunca em modal; dá para copiar/exportar/compartilhar
 *   · ação irreversível só com aprovação humana explícita (ApprovalRequest)
 *   · sempre dá para parar, tentar de novo e corrigir (AgentComposer, AgentMessage)
 *   · fato que veio de dado do cliente tem origem visível (ContextView, CitationChip)
 */

function useMedia(query: string) {
  const [match, setMatch] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setMatch(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [query]);
  return match;
}

/* ================================================================== */
/* ResizableSplit                                                      */
/* ================================================================== */

/**
 * Dois painéis lado a lado com divisor arrastável (mouse, toque ou teclado:
 * ←/→ 2 %, Shift 10 %, Home/End nos limites, duplo clique volta ao padrão).
 * `size` = fração da LARGURA DO PAINEL ESQUERDO. Persiste por `storageKey`.
 * Abaixo de 768px o painel direito abre em tela cheia por cima (use o botão
 * de fechar do próprio painel para voltar).
 */
export function ResizableSplit({
  left,
  right,
  rightOpen = true,
  defaultSize = 0.46,
  min = 0.28,
  max = 0.72,
  storageKey,
  label = "Redimensionar painéis",
  className,
}: {
  left: ReactNode;
  right: ReactNode;
  rightOpen?: boolean;
  defaultSize?: number;
  min?: number;
  max?: number;
  storageKey?: string;
  label?: string;
  className?: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const mobile = useMedia("(max-width: 767.98px)");
  const [size, setSize] = useState(() => {
    if (typeof window === "undefined" || !storageKey) return defaultSize;
    try {
      const v = Number(localStorage.getItem(`ds-split:${storageKey}`));
      return v >= min && v <= max ? v : defaultSize;
    } catch {
      return defaultSize;
    }
  });
  const [dragging, setDragging] = useState(false);
  const clamp = useCallback((v: number) => Math.min(max, Math.max(min, v)), [min, max]);
  const commit = useCallback(
    (v: number | ((prev: number) => number)) => {
      setSize((prev) => {
        const c = clamp(typeof v === "function" ? v(prev) : v);
        if (storageKey)
          try {
            localStorage.setItem(`ds-split:${storageKey}`, String(c));
          } catch {
            /* sem persistência */
          }
        return c;
      });
    },
    [clamp, storageKey],
  );
  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDragging(true);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging || !box.current) return;
    const r = box.current.getBoundingClientRect();
    commit((e.clientX - r.left) / r.width);
  };
  const onKey = (e: KeyboardEvent) => {
    const step = e.shiftKey ? 0.1 : 0.02;
    if (e.key === "ArrowLeft") commit((v) => v - step);
    else if (e.key === "ArrowRight") commit((v) => v + step);
    else if (e.key === "Home") commit(min);
    else if (e.key === "End") commit(max);
    else return;
    e.preventDefault();
  };

  if (mobile) {
    return (
      <div className={cn("relative flex min-h-0 min-w-0 flex-1", className)}>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">{left}</div>
        {rightOpen && <div className="enter fixed inset-0 z-[45] flex flex-col bg-page">{right}</div>}
      </div>
    );
  }
  return (
    <div ref={box} className={cn("flex min-h-0 min-w-0 flex-1", dragging && "cursor-col-resize select-none", className)}>
      <div className="flex min-h-0 min-w-0 flex-col" style={{ width: rightOpen ? `${size * 100}%` : "100%" }}>
        {left}
      </div>
      {rightOpen && (
        <>
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label={label}
            aria-valuemin={Math.round(min * 100)}
            aria-valuemax={Math.round(max * 100)}
            aria-valuenow={Math.round(size * 100)}
            tabIndex={0}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={() => setDragging(false)}
            onPointerCancel={() => setDragging(false)}
            onDoubleClick={() => commit(defaultSize)}
            onKeyDown={onKey}
            className="group relative z-10 -mx-1 flex w-2 shrink-0 cursor-col-resize justify-center outline-none"
          >
            <span className={cn("h-full w-px transition-colors", dragging ? "bg-primary" : "bg-line group-hover:bg-line-strong group-focus-visible:bg-primary")} />
            <span
              aria-hidden
              className={cn(
                "absolute top-1/2 h-8 w-1.5 -translate-y-1/2 rounded-full border border-line bg-surface transition-colors",
                dragging ? "border-primary" : "group-hover:border-line-strong group-focus-visible:border-primary",
              )}
            />
          </div>
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">{right}</div>
        </>
      )}
    </div>
  );
}

/* ================================================================== */
/* IconRail                                                            */
/* ================================================================== */

export type RailItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  /** Ponto de atenção (novidade, execução terminou). */
  dot?: boolean;
  badge?: number;
  match?: string;
};

/**
 * Navegação compacta só com ícones (56px), rótulo no tooltip. Para apps de
 * trabalho focado (workspace de agente, editor) em que a área útil importa
 * mais que o menu. Use como `sidebar` do AppShell; no celular (gaveta aberta)
 * vira lista com rótulos. `onExpand` mostra o botão » no rodapé.
 */
export function IconRail({
  groups,
  currentPath,
  mark,
  footer,
  onExpand,
  mobileOpen = false,
  label = "Menu principal",
}: {
  groups: RailItem[][];
  currentPath: string;
  mark?: ReactNode;
  footer?: ReactNode;
  onExpand?: () => void;
  mobileOpen?: boolean;
  label?: string;
}) {
  const active = (it: RailItem) => {
    const base = (it.match ?? it.href).split("?")[0];
    return currentPath === base || currentPath.split("?")[0] === base || currentPath.startsWith(`${base}/`);
  };
  if (mobileOpen) {
    return (
      <nav aria-label={label} className="fixed inset-y-12 bottom-0 left-0 z-40 flex w-[250px] flex-col gap-4 overflow-y-auto border-r border-line bg-rail p-3 md:hidden">
        {groups.map((g, gi) => (
          <ul key={gi} className="list-none space-y-0.5 p-0">
            {g.map((it) => {
              const on = active(it);
              const Icon = it.icon;
              return (
                <li key={it.href}>
                  <DsLink
                    href={it.href}
                    aria-current={on ? "page" : undefined}
                    className={cn("flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px]", on ? "bg-ink/[0.08] font-medium text-ink" : "text-ink-soft hover:bg-ink/[0.05]")}
                  >
                    <Icon className="h-4 w-4 text-muted" />
                    <span className="flex-1">{it.label}</span>
                    {!!it.badge && <span className="text-[11px] tabular-nums text-muted">{it.badge}</span>}
                  </DsLink>
                </li>
              );
            })}
          </ul>
        ))}
      </nav>
    );
  }
  return (
    <nav aria-label={label} className="hidden h-full w-14 shrink-0 flex-col items-center border-r border-line bg-rail py-3 md:flex">
      {mark && <div className="mb-3">{mark}</div>}
      <div className="flex min-h-0 w-full flex-1 flex-col items-center gap-3 overflow-y-auto overflow-x-visible px-2">
        {groups.map((g, gi) => (
          <div key={gi} className={cn("flex flex-col items-center gap-1", gi > 0 && "border-t border-line pt-3")}>
            {g.map((it) => {
              const on = active(it);
              const Icon = it.icon;
              return (
                <Tooltip key={it.href} content={it.label} side="right" delay={200}>
                  <DsLink
                    href={it.href}
                    aria-label={it.label}
                    aria-current={on ? "page" : undefined}
                    className={cn(
                      "relative grid h-9 w-9 place-items-center rounded-lg transition-colors",
                      // Ativo: fundo tingido com a tinta (visível em qualquer tema/marca) + marcador na borda.
                      on ? "bg-ink/[0.08] text-ink" : "text-muted hover:bg-ink/[0.05] hover:text-ink",
                    )}
                  >
                    {on && <span aria-hidden className="absolute -left-[9px] top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r-full bg-nav-marker" />}
                    <Icon className="h-[17px] w-[17px]" strokeWidth={on ? 2 : 1.65} />
                    {(it.dot || !!it.badge) && <span aria-hidden className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-accent ring-2 ring-rail" />}
                  </DsLink>
                </Tooltip>
              );
            })}
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-col items-center gap-2">
        {onExpand && (
          <Tooltip content="Expandir menu" side="right">
            <button type="button" onClick={onExpand} aria-label="Expandir menu" className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-soft hover:text-ink">
              <ChevronsRight className="h-4 w-4" />
            </button>
          </Tooltip>
        )}
        {footer}
      </div>
    </nav>
  );
}

/* ================================================================== */
/* RunSummary                                                          */
/* ================================================================== */

export type RunStatus = "running" | "done" | "error" | "stopped";

/**
 * Linha de status de uma execução ("Concluído em 40 s ›"). Clique abre o que
 * o agente fez (passe o AgentTrace ou ToolCallsSection em `children`).
 * Com `startedAt` e status running, o cronômetro anda sozinho.
 */
export function RunSummary({
  status,
  durationMs,
  startedAt,
  steps,
  tools,
  tokens,
  cost,
  defaultOpen = false,
  children,
  variant = "inline",
  className,
}: {
  status: RunStatus;
  durationMs?: number;
  startedAt?: number;
  steps?: number;
  tools?: number;
  tokens?: number;
  /** Já formatado ("R$ 0,21"). */
  cost?: string;
  defaultOpen?: boolean;
  children?: ReactNode;
  /**
   * "inline" (padrão): "✓ Concluído em 40 s · 9 passos ›" com o trace num cartão.
   * "divider": linha discreta "Trabalhou por 1 min 1 s ›" com fio fino em toda a
   * largura (estilo Codex); o trace abre recuado, sem cartão. Para tarefas longas.
   */
  variant?: "inline" | "divider";
  className?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (status !== "running" || !startedAt) return;
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [status, startedAt]);
  const ms = status === "running" && startedAt ? now - startedAt : durationMs ?? 0;
  const label =
    status === "running" ? `Trabalhando… ${formatDuration(ms)}` : status === "error" ? `Falhou após ${formatDuration(ms)}` : status === "stopped" ? `Interrompido em ${formatDuration(ms)}` : `Concluído em ${formatDuration(ms)}`;
  const Icon = status === "running" ? LoaderCircle : status === "error" ? CircleX : status === "stopped" ? Square : CircleCheck;
  const meta = [steps != null && `${steps} passos`, tools != null && `${tools} ferramentas`, tokens != null && `${formatNumber(tokens)} tokens`, cost].filter(Boolean).join(" · ");
  if (variant === "divider") {
    const text =
      status === "running" ? `Trabalhando… ${formatDuration(ms)}` : status === "error" ? `Falhou depois de ${formatDuration(ms)}` : status === "stopped" ? `Interrompido em ${formatDuration(ms)}` : `Trabalhou por ${formatDuration(ms)}`;
    return (
      <div className={cn("min-w-0", className)}>
        <button
          type="button"
          onClick={() => children && setOpen((o) => !o)}
          aria-expanded={children ? open : undefined}
          title={meta || undefined}
          className={cn(
            "group flex w-full items-center gap-1 border-b border-line pb-2 text-left text-[13px] transition-colors",
            status === "error" ? "text-rose" : "text-muted",
            !!children && "hover:text-ink",
          )}
        >
          <span className={cn("whitespace-nowrap tabular-nums", status === "running" && "ds-shimmer")}>{text}</span>
          {children && <ChevronRight className={cn("h-3.5 w-3.5 shrink-0 transition-transform", open && "rotate-90")} aria-hidden />}
          {meta && open && <span className="ml-auto hidden truncate pl-3 text-[11.5px] sm:inline">{meta}</span>}
        </button>
        {open && children && <div className="enter mt-3 border-l border-line pl-4">{children}</div>}
      </div>
    );
  }
  return (
    <div className={cn("min-w-0", className)}>
      <button
        type="button"
        onClick={() => children && setOpen((o) => !o)}
        aria-expanded={children ? open : undefined}
        className={cn("group inline-flex max-w-full items-center gap-1.5 rounded-md py-0.5 text-[12.5px]", !!children && "hover:text-ink", status === "error" ? "text-rose" : "text-muted")}
      >
        <Icon className={cn("h-3.5 w-3.5 shrink-0", status === "running" && "animate-spin", status === "done" && "text-ok")} aria-hidden />
        <span className={cn("whitespace-nowrap font-medium tabular-nums", status === "running" && "ds-shimmer")}>{label}</span>
        {meta && <span className="hidden min-w-0 truncate sm:inline">· {meta}</span>}
        {children && <ChevronRight className={cn("h-3.5 w-3.5 shrink-0 transition-transform", open && "rotate-90")} aria-hidden />}
      </button>
      {open && children && <div className="enter mt-2 rounded-xl border border-line bg-surface p-3">{children}</div>}
    </div>
  );
}

/* ================================================================== */
/* Artefatos                                                           */
/* ================================================================== */

export type ArtifactKind = "report" | "sheet" | "doc" | "chart" | "code" | "email" | "deck" | "context" | "output" | "details" | "files";

export const artifactIcons: Record<ArtifactKind, LucideIcon> = {
  report: FileText,
  sheet: FileSpreadsheet,
  doc: FileText,
  chart: ChartLine,
  code: Code,
  email: Mail,
  deck: Presentation,
  context: Layers,
  output: Sparkles,
  details: Info,
  files: FolderOpen,
};
const artifactTint: Partial<Record<ArtifactKind, string>> = { sheet: "text-ok", chart: "text-blue", deck: "text-accent-deep", email: "text-clay" };

/** Ícone do tipo de artefato, em moldura. */
export function ArtifactIcon({ kind, className }: { kind: ArtifactKind; className?: string }) {
  const Icon = artifactIcons[kind];
  return (
    <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-line bg-surface", artifactTint[kind] ?? "text-ink-soft", className)}>
      <Icon className="h-4 w-4" aria-hidden />
    </span>
  );
}

/**
 * Cartão do que o agente produziu, dentro da resposta. "Abrir" leva ao painel
 * de artefatos. Gerando = brilho discreto e botão desabilitado.
 */
export function ArtifactCard({
  kind,
  title,
  meta,
  status = "ready",
  selected = false,
  onOpen,
  className,
}: {
  kind: ArtifactKind;
  title: string;
  meta?: ReactNode;
  status?: "ready" | "generating" | "error";
  selected?: boolean;
  onOpen?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 items-center gap-3 rounded-xl border bg-surface p-2.5 pr-2 transition-colors",
        selected ? "border-primary/50 ring-2 ring-primary/10" : "border-line hover:border-line-strong",
        className,
      )}
    >
      <ArtifactIcon kind={kind} />
      <div className="min-w-0 flex-1">
        <div className={cn("truncate text-[13.5px] font-medium", status === "generating" && "ds-shimmer")}>{title}</div>
        {(meta || status !== "ready") && (
          <div className={cn("truncate text-[11.5px]", status === "error" ? "text-rose" : "text-muted")}>{status === "generating" ? "Gerando…" : status === "error" ? "Não foi possível gerar" : meta}</div>
        )}
      </div>
      <button
        type="button"
        disabled={status !== "ready"}
        onClick={onOpen}
        aria-label={`Abrir ${title}`}
        className={cn(
          "inline-flex h-8 shrink-0 items-center rounded-lg px-3 text-[12.5px] font-medium ring-1 disabled:opacity-40",
          selected ? "bg-soft text-ink ring-line-strong" : "bg-surface text-ink ring-line hover:bg-soft",
        )}
      >
        {selected ? "Aberto" : "Abrir"}
      </button>
    </div>
  );
}

export type ArtifactTab = { id: string; kind: ArtifactKind; title: string; closable?: boolean };

/**
 * Painel de artefatos com abas (Relatório · Contexto · Saída · planilhas…).
 * Abas fecham, "+" adiciona uma visão, expandir ocupa a largura toda.
 * Ações de cabeçalho: copiar, exportar, compartilhar (passe os handlers).
 */
export function ArtifactPanel({
  tabs,
  active,
  onActiveChange,
  onCloseTab,
  addOptions,
  expanded = false,
  onExpandedChange,
  onClose,
  onCopy,
  onExport,
  onShare,
  children,
  className,
}: {
  tabs: ArtifactTab[];
  active: string;
  onActiveChange: (id: string) => void;
  onCloseTab?: (id: string) => void;
  addOptions?: { label: string; kind: ArtifactKind; onSelect: () => void }[];
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  onClose?: () => void;
  onCopy?: () => void;
  onExport?: () => void;
  onShare?: () => void;
  children: ReactNode;
  className?: string;
}) {
  const strip = useRef<HTMLDivElement>(null);
  // Abas não cabem → as inativas viram só ícone (com dica) e aparece o menu
  // "Todas as abas"; a ativa fica sempre inteira. `need` = largura com rótulos.
  const [overflow, setOverflow] = useState(false);
  const need = useRef(0);
  const tabKey = tabs.map((t) => t.title).join("|");
  useEffect(() => {
    const el = strip.current;
    if (!el) return;
    const check = () =>
      setOverflow((compact) => {
        if (!compact) {
          if (el.scrollWidth <= el.clientWidth + 1) return false;
          need.current = el.scrollWidth;
          return true;
        }
        return el.clientWidth < need.current;
      });
    // Abas mudaram: remede a partir do modo completo (com rótulos).
    setOverflow(false);
    const raf = requestAnimationFrame(check);
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [tabKey]);
  useEffect(() => {
    const el = strip.current;
    const tab = el?.querySelector<HTMLElement>('[aria-selected="true"]')?.parentElement;
    if (!el || !tab) return;
    // Rola só a faixa (scrollIntoView rolaria a página): aba ativa sempre inteira.
    if (tab.offsetLeft < el.scrollLeft) el.scrollLeft = tab.offsetLeft;
    else if (tab.offsetLeft + tab.offsetWidth > el.scrollLeft + el.clientWidth) el.scrollLeft = tab.offsetLeft + tab.offsetWidth - el.clientWidth + 24;
  }, [active, overflow]);
  const moreActions: MenuEntry[] = [
    ...(onCopy ? [{ label: "Copiar", icon: <Copy className="h-4 w-4" />, onSelect: onCopy }] : []),
    ...(onExport ? [{ label: "Exportar", icon: <Download className="h-4 w-4" />, onSelect: onExport }] : []),
    ...(onShare ? [{ label: "Compartilhar", icon: <Share2 className="h-4 w-4" />, onSelect: onShare }] : []),
  ];
  const onTabKey = (e: KeyboardEvent, i: number) => {
    const next = e.key === "ArrowRight" ? i + 1 : e.key === "ArrowLeft" ? i - 1 : -1;
    if (next < 0 || next >= tabs.length) return;
    e.preventDefault();
    onActiveChange(tabs[next].id);
    (strip.current?.querySelectorAll<HTMLElement>('[role="tab"]')[next])?.focus();
  };
  const iconBtn = "grid h-8 w-8 shrink-0 place-items-center self-center rounded-lg text-muted hover:bg-soft hover:text-ink";
  return (
    <section className={cn("@container/panel flex min-h-0 min-w-0 flex-1 flex-col bg-page", className)} aria-label="Artefatos">
      <header className="flex h-12 shrink-0 items-stretch gap-1 border-b border-line px-2">
        {onClose && (
          <button type="button" onClick={onClose} aria-label="Fechar painel" className={cn(iconBtn, "md:hidden")}>
            <X className="h-4 w-4" />
          </button>
        )}
        <div ref={strip} role="tablist" aria-label="Artefatos abertos" className="relative flex min-w-0 flex-1 items-stretch gap-1 overflow-x-auto [scrollbar-width:none]">
          {tabs.map((t, i) => {
            const on = t.id === active;
            const Icon = artifactIcons[t.kind];
            const iconOnly = overflow && !on;
            return (
              <div
                key={t.id}
                // Aba ativa = sublinhado de 2px alinhado à linha do cabeçalho (mesma convenção de Tabs).
                className={cn("group relative -mb-px flex shrink-0 items-center border-b-2", on ? "border-ink" : "border-transparent")}
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={on}
                  tabIndex={on ? 0 : -1}
                  onKeyDown={(e) => onTabKey(e, i)}
                  onClick={() => onActiveChange(t.id)}
                  aria-label={iconOnly ? t.title : undefined}
                  title={iconOnly ? t.title : undefined}
                  className={cn(
                    "my-1.5 flex h-8 max-w-[200px] items-center gap-1.5 rounded-md text-[12.5px] transition-colors",
                    iconOnly ? "w-8 justify-center" : cn("pl-2.5", t.closable && onCloseTab ? "pr-1" : "pr-2.5"),
                    on ? "font-medium text-ink" : "text-muted hover:bg-soft hover:text-ink",
                  )}
                >
                  <Icon className={cn("h-3.5 w-3.5 shrink-0", artifactTint[t.kind])} aria-hidden />
                  {!iconOnly && <span className="truncate">{t.title}</span>}
                </button>
                {t.closable && onCloseTab && !iconOnly && (
                  <button
                    type="button"
                    onClick={() => onCloseTab(t.id)}
                    aria-label={`Fechar ${t.title}`}
                    className={cn("mr-1 grid h-5 w-5 place-items-center rounded text-muted hover:bg-soft hover:text-ink", !on && "opacity-0 group-hover:opacity-100 focus-visible:opacity-100")}
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            );
          })}
          {addOptions && addOptions.length > 0 && (
            <Menu
              label="Adicionar visão"
              align="start"
              triggerClassName="!h-8 !w-8 shrink-0 self-center justify-center !gap-0 !rounded-lg !bg-transparent !px-0 !text-muted !ring-0 hover:!bg-soft hover:!text-ink"
              trigger={<Plus className="h-4 w-4" />}
              items={addOptions.map((o): MenuEntry => {
                const Icon = artifactIcons[o.kind];
                return { label: o.label, icon: <Icon className="h-4 w-4" />, onSelect: o.onSelect };
              })}
            />
          )}
        </div>
        {(overflow || tabs.length > 4) && (
          <Menu
            label="Todas as abas"
            align="end"
            triggerClassName="!h-8 !w-8 shrink-0 self-center justify-center !gap-0 !bg-transparent !px-0 !text-muted !ring-0 hover:!bg-soft hover:!text-ink"
            trigger={<ChevronDown className="h-4 w-4" />}
            items={tabs.map((t): MenuEntry => {
              const Icon = artifactIcons[t.kind];
              return { type: "checkbox", label: t.title, icon: <Icon className="h-4 w-4" />, checked: t.id === active, onCheckedChange: () => onActiveChange(t.id) };
            })}
          />
        )}
        {moreActions.length > 0 && <span aria-hidden className="mx-0.5 hidden h-5 w-px self-center bg-line @[440px]/panel:block" />}
        {/* Estreito: copiar/exportar/compartilhar vão para o ⋯. */}
        {onCopy && (
          <Tooltip content="Copiar" side="bottom">
            <button type="button" onClick={onCopy} aria-label="Copiar" className={cn(iconBtn, "hidden @[440px]/panel:grid")}>
              <Copy className="h-4 w-4" />
            </button>
          </Tooltip>
        )}
        {onExport && (
          <Tooltip content="Exportar" side="bottom">
            <button type="button" onClick={onExport} aria-label="Exportar" className={cn(iconBtn, "hidden @[440px]/panel:grid")}>
              <Download className="h-4 w-4" />
            </button>
          </Tooltip>
        )}
        {onShare && (
          <Tooltip content="Compartilhar" side="bottom">
            <button type="button" onClick={onShare} aria-label="Compartilhar" className={cn(iconBtn, "hidden @[440px]/panel:grid")}>
              <Share2 className="h-4 w-4" />
            </button>
          </Tooltip>
        )}
        {moreActions.length > 0 && (
          <span className="flex shrink-0 self-center @[440px]/panel:hidden">
            <Menu
              label="Mais ações do painel"
              align="end"
              triggerClassName="!h-8 !w-8 justify-center !gap-0 !rounded-lg !bg-transparent !px-0 !text-muted !ring-0 hover:!bg-soft hover:!text-ink"
              trigger={<Ellipsis className="h-4 w-4" />}
              items={moreActions}
            />
          </span>
        )}
        {onExpandedChange && (
          <Tooltip content={expanded ? "Reduzir" : "Expandir"} side="bottom">
            <button type="button" onClick={() => onExpandedChange(!expanded)} aria-label={expanded ? "Reduzir painel" : "Expandir painel"} className={cn(iconBtn, "hidden md:grid")}>
              {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
          </Tooltip>
        )}
        {onClose && (
          <Tooltip content="Fechar painel" side="bottom">
            <button type="button" onClick={onClose} aria-label="Fechar painel" className={cn(iconBtn, "hidden md:grid")}>
              <PanelRightClose className="h-4 w-4" />
            </button>
          </Tooltip>
        )}
      </header>
      <div role="tabpanel" className="min-h-0 flex-1 overflow-y-auto" data-ds-content="">
        {children}
      </div>
    </section>
  );
}

/* ================================================================== */
/* Peças de relatório                                                  */
/* ================================================================== */

/** Seção de relatório: título + corpo com largura de leitura. */
export function ReportSection({ title, children, className }: { title?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("min-w-0", className)}>
      {title && <h2 className="m-0 mb-2.5 text-[18px] font-semibold tracking-tight" style={{ fontFamily: "var(--ds-font-display)" }}>{title}</h2>}
      <div className="flex flex-col gap-3 text-[13.5px] leading-[1.7] text-ink-soft [&_p]:m-0">{children}</div>
    </section>
  );
}

/**
 * Achado do agente: rótulo (kicker), manchete e, embaixo, a evidência
 * (lista ranqueada, barra de métrica) com um marcador de tom.
 */
export function InsightCard({
  kicker,
  title,
  listLabel,
  tone = "bad",
  children,
  className,
}: {
  kicker: string;
  title: ReactNode;
  listLabel?: string;
  tone?: "ok" | "warn" | "bad" | "neutral";
  children?: ReactNode;
  className?: string;
}) {
  const dot = { ok: "bg-ok", warn: "bg-amber", bad: "bg-rose", neutral: "bg-line-strong" }[tone];
  return (
    <article className={cn("flex min-w-0 flex-col rounded-xl border border-line bg-surface p-4", className)}>
      <p className="m-0 text-[12px] text-muted">{kicker}</p>
      <h3 className="m-0 mt-1 text-[14px] font-medium leading-snug">{title}</h3>
      {children && (
        <div className="mt-auto pt-5">
          {listLabel && (
            <p className="m-0 mb-1.5 flex items-center gap-1.5 text-[11.5px] text-muted">
              <span aria-hidden className={cn("h-1.5 w-1.5 rounded-full", dot)} />
              {listLabel}
            </p>
          )}
          {children}
        </div>
      )}
    </article>
  );
}

/** Lista numerada com selo ("Novo") ou variação à direita. */
export function RankedList({
  items,
  className,
}: {
  items: { label: ReactNode; badge?: string; badgeTone?: "ok" | "warn" | "bad" | "neutral"; value?: ReactNode }[];
  className?: string;
}) {
  const tones = { ok: "bg-ok-soft text-ok ring-ok/15", warn: "bg-amber-soft text-amber ring-amber/15", bad: "bg-rose-soft text-rose ring-rose/15", neutral: "bg-soft text-ink-soft ring-line" };
  return (
    <ol className={cn("list-none divide-y divide-line p-0", className)}>
      {items.map((it, i) => (
        <li key={i} className="flex items-center gap-3 py-2 text-[13px]">
          <span className="w-4 shrink-0 text-right tabular-nums text-muted">{i + 1}.</span>
          <span className="min-w-0 flex-1 truncate">{it.label}</span>
          {it.value != null && <span className="shrink-0 tabular-nums text-ink-soft">{it.value}</span>}
          {it.badge && <span className={cn("shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-medium ring-1", tones[it.badgeTone ?? "ok"])}>{it.badge}</span>}
        </li>
      ))}
    </ol>
  );
}

/**
 * Métrica em barra dividida: parte boa (ok) e parte perdida (rose), com % e
 * variação. Ex.: acurácia 80 % (−3,5 pp). `value` em fração (0–1).
 */
export function MetricBar({
  label,
  value,
  delta,
  index,
  goodWhen = "up",
  className,
}: {
  label: ReactNode;
  value: number;
  /** Variação em pontos percentuais (fração): −0.035 = −3,5 pp. */
  delta?: number;
  index?: number;
  goodWhen?: "up" | "down";
  className?: string;
}) {
  const v = Math.max(0, Math.min(1, value));
  const good = delta == null ? null : delta === 0 ? null : (delta > 0) === (goodWhen === "up");
  return (
    <div className={cn("grid items-center gap-x-2.5 py-2 text-[13px]", index != null ? "grid-cols-[1rem_minmax(0,1.2fr)_minmax(28px,1fr)_auto_auto]" : "grid-cols-[minmax(0,1.2fr)_minmax(28px,1fr)_auto_auto]", className)}>
      {index != null && <span className="text-right tabular-nums text-muted">{index}.</span>}
      <span className="min-w-0 truncate">{label}</span>
      <span className="flex h-1.5 min-w-0 gap-[2px] overflow-hidden rounded-full" role="img" aria-label={`${formatPercent(v, 0)}`}>
        <span className="rounded-full bg-ok" style={{ flexGrow: v }} />
        <span className="rounded-full bg-rose" style={{ flexGrow: 1 - v }} />
      </span>
      <span className="text-right font-medium tabular-nums">{formatPercent(v, 0)}</span>
      {delta != null ? (
        <span className={cn("text-right text-[12px] tabular-nums", good == null ? "text-muted" : good ? "text-ok" : "text-rose")}>
          {delta > 0 ? "+" : delta < 0 ? "−" : ""}
          {formatNumber(Math.abs(delta * 100), 1)}%
        </span>
      ) : (
        <span />
      )}
    </div>
  );
}

/** Dois números lado a lado num mesmo card (e um gráfico embaixo em `children`). */
export function KpiPair({ items, children, className }: { items: { label: string; value: ReactNode; hint?: ReactNode }[]; children?: ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-xl border border-line bg-surface", className)}>
      <div className="grid divide-x divide-line" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
        {items.map((it) => (
          <div key={it.label} className="min-w-0 px-4 py-3">
            <div className="truncate text-[12.5px] text-muted">{it.label}</div>
            <div className="mt-0.5 text-[20px] font-semibold tabular-nums tracking-tight">{it.value}</div>
            {it.hint && <div className="text-[11.5px] text-muted">{it.hint}</div>}
          </div>
        ))}
      </div>
      {children && <div className="border-t border-line px-4 py-3">{children}</div>}
    </div>
  );
}

/* ================================================================== */
/* ContextView                                                         */
/* ================================================================== */

export type ContextItem = {
  id: string;
  kind: "doc" | "table" | "web" | "tool" | "record";
  title: string;
  detail?: ReactNode;
  /** 0–1: quanto pesou na resposta. */
  relevance?: number;
  pinned?: boolean;
  /** Quantas vezes foi citado na resposta. */
  citations?: number;
};

const contextMeta: Record<ContextItem["kind"], { label: string; icon: LucideIcon }> = {
  record: { label: "Registros", icon: Database },
  table: { label: "Tabelas", icon: FileSpreadsheet },
  doc: { label: "Documentos", icon: FileText },
  web: { label: "Web", icon: Globe },
  tool: { label: "Ferramentas", icon: Wrench },
};

/**
 * O que o agente usou para responder, agrupado por tipo, com peso relativo.
 * Fixar mantém o item no contexto das próximas perguntas.
 */
export function ContextView({
  items,
  onPinChange,
  onAdd,
  className,
}: {
  items: ContextItem[];
  onPinChange?: (id: string, pinned: boolean) => void;
  onAdd?: () => void;
  className?: string;
}) {
  const kinds = (Object.keys(contextMeta) as ContextItem["kind"][]).filter((k) => items.some((i) => i.kind === k));
  return (
    <div className={cn("space-y-5", className)}>
      {kinds.map((k) => {
        const { label, icon: Icon } = contextMeta[k];
        const list = items.filter((i) => i.kind === k).sort((a, b) => (b.relevance ?? 0) - (a.relevance ?? 0));
        return (
          <section key={k}>
            <h3 className="m-0 mb-2 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-muted">
              <Icon className="h-3.5 w-3.5" aria-hidden /> {label} <span className="tabular-nums">· {list.length}</span>
            </h3>
            <ul className="list-none divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface p-0">
              {list.map((it) => (
                <li key={it.id} className="flex items-center gap-3 px-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 truncate text-[13px] font-medium">
                      {it.pinned && <Pin className="h-3 w-3 shrink-0 text-accent-deep" aria-label="Fixado" />}
                      <span className="truncate">{it.title}</span>
                    </div>
                    {it.detail && <div className="truncate text-[11.5px] text-muted">{it.detail}</div>}
                  </div>
                  {it.citations != null && <span className="hidden shrink-0 text-[11.5px] tabular-nums text-muted sm:inline">{it.citations} citações</span>}
                  {it.relevance != null && (
                    <span className="flex w-20 shrink-0 items-center gap-1.5" title={`Relevância ${formatPercent(it.relevance, 0)}`}>
                      <span className="h-1 flex-1 overflow-hidden rounded-full bg-soft">
                        <span className="block h-full rounded-full bg-primary/70" style={{ width: `${it.relevance * 100}%` }} />
                      </span>
                      <span className="w-7 text-right text-[11px] tabular-nums text-muted">{Math.round(it.relevance * 100)}</span>
                    </span>
                  )}
                  {onPinChange && (
                    <button
                      type="button"
                      onClick={() => onPinChange(it.id, !it.pinned)}
                      aria-label={it.pinned ? `Desafixar ${it.title}` : `Fixar ${it.title}`}
                      className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-muted hover:bg-soft hover:text-ink"
                    >
                      {it.pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </section>
        );
      })}
      {onAdd && (
        <button type="button" onClick={onAdd} className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-[13px] font-medium text-ink ring-1 ring-line hover:bg-soft">
          <Plus className="h-4 w-4" /> Adicionar contexto
        </button>
      )}
    </div>
  );
}

/* ================================================================== */
/* SheetArtifact                                                       */
/* ================================================================== */

export type SheetColumn = { key: string; label: string; align?: "left" | "right"; format?: (v: unknown) => ReactNode; width?: number };

/**
 * Planilha compacta gerada pelo agente: letras de coluna, números de linha,
 * cabeçalho fixo. Células que o agente alterou ficam destacadas (`changed`:
 * "índiceDaLinha:chave").
 */
export function SheetArtifact({
  columns,
  rows,
  changed = [],
  caption,
  maxHeight = 480,
  className,
}: {
  columns: SheetColumn[];
  rows: Record<string, unknown>[];
  changed?: string[];
  caption?: ReactNode;
  maxHeight?: number;
  className?: string;
}) {
  const set = useMemo(() => new Set(changed), [changed]);
  const letter = (i: number) => String.fromCharCode(65 + (i % 26));
  return (
    <div className={cn("min-w-0", className)}>
      <div className="overflow-auto rounded-xl border border-line bg-surface" style={{ maxHeight }}>
        <table className="w-full border-separate border-spacing-0 text-[12.5px] tabular-nums">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead className="sticky top-0 z-[1]">
            <tr className="bg-soft text-[10.5px] text-muted">
              <th className="w-10 border-b border-r border-line bg-soft px-2 py-1 font-normal" aria-hidden />
              {columns.map((c, i) => (
                <th key={c.key} className="border-b border-r border-line bg-soft px-2 py-1 text-center font-normal last:border-r-0" aria-hidden>
                  {letter(i)}
                </th>
              ))}
            </tr>
            <tr className="text-[12px] text-ink">
              <th className="border-b border-r border-line bg-surface px-2 py-1.5 text-center text-[10.5px] font-normal text-muted">1</th>
              {columns.map((c) => (
                <th
                  key={c.key}
                  scope="col"
                  className={cn("whitespace-nowrap border-b border-r border-line bg-surface px-2.5 py-1.5 font-medium last:border-r-0", c.align === "right" ? "text-right" : "text-left")}
                  style={{ minWidth: c.width }}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, ri) => (
              <tr key={ri} className="hover:bg-soft/50">
                <th scope="row" className="border-b border-r border-line bg-soft/60 px-2 py-1.5 text-center text-[10.5px] font-normal text-muted">
                  {ri + 2}
                </th>
                {columns.map((c) => {
                  const hit = set.has(`${ri}:${c.key}`);
                  return (
                    <td
                      key={c.key}
                      className={cn(
                        "whitespace-nowrap border-b border-r border-line px-2.5 py-1.5 last:border-r-0",
                        c.align === "right" && "text-right",
                        hit && "bg-accent-soft font-medium text-accent-deep shadow-[inset_2px_0_0_var(--ds-accent)]",
                      )}
                      title={hit ? "Alterado pelo agente" : undefined}
                    >
                      {c.format ? c.format(r[c.key]) : String(r[c.key] ?? "")}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {changed.length > 0 && (
        <p className="m-0 mt-2 flex items-center gap-1.5 text-[12px] text-muted">
          <span aria-hidden className="h-2.5 w-2.5 rounded-[3px] bg-accent-soft shadow-[inset_2px_0_0_var(--ds-accent)]" />
          {changed.length} {changed.length === 1 ? "célula alterada" : "células alteradas"} pelo agente
        </p>
      )}
    </div>
  );
}

/* ================================================================== */
/* ReasoningBlock                                                      */
/* ================================================================== */

/**
 * Raciocínio do agente, recolhido por padrão ("Pensou por 8 s ›"). Enquanto
 * pensa, o rótulo brilha e as linhas aparecem. Não é o lugar da resposta:
 * mostre só o suficiente para a pessoa confiar (ou corrigir) o caminho.
 */
export function ReasoningBlock({
  lines,
  durationMs,
  streaming = false,
  defaultOpen = false,
  className,
}: {
  lines: ReactNode[];
  durationMs?: number;
  streaming?: boolean;
  defaultOpen?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(defaultOpen || streaming);
  useEffect(() => {
    if (streaming) setOpen(true);
  }, [streaming]);
  return (
    <div className={cn("min-w-0", className)}>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="inline-flex items-center gap-1.5 rounded-md py-0.5 text-[12.5px] text-muted hover:text-ink">
        <Brain className="h-3.5 w-3.5" aria-hidden />
        <span className={cn("font-medium", streaming && "ds-shimmer")}>{streaming ? "Pensando…" : `Pensou por ${formatDuration(durationMs ?? 0)}`}</span>
        <ChevronRight className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-90")} aria-hidden />
      </button>
      {open && (
        <ol className="enter mt-1.5 list-none space-y-1.5 border-l-2 border-line py-0.5 pl-3.5 text-[12.5px] leading-relaxed text-muted" aria-live={streaming ? "polite" : undefined}>
          {lines.map((l, i) => (
            <li key={i}>{l}</li>
          ))}
        </ol>
      )}
    </div>
  );
}

/* ================================================================== */
/* ApprovalRequest                                                     */
/* ================================================================== */

export type ApprovalState = "pending" | "approved" | "always" | "rejected";

/**
 * O agente pede permissão antes de uma ação com efeito externo (enviar e-mail,
 * alterar registros, cobrar). Mostra o que vai acontecer (preview), o impacto
 * e três saídas: aprovar (uma vez ou sempre para este tipo), editar, recusar.
 */
export function ApprovalRequest({
  title,
  description,
  preview,
  impact,
  risk = "medium",
  state = "pending",
  onApprove,
  onApproveAlways,
  onEdit,
  onReject,
  className,
}: {
  title: string;
  description?: ReactNode;
  preview?: ReactNode;
  /** "42 clientes", "R$ 18.400 em faturas". */
  impact?: ReactNode;
  risk?: "low" | "medium" | "high";
  state?: ApprovalState;
  onApprove?: () => void;
  onApproveAlways?: () => void;
  onEdit?: () => void;
  onReject?: () => void;
  className?: string;
}) {
  const pending = state === "pending";
  const done = state === "approved" || state === "always";
  return (
    <section
      aria-label={`Aprovação: ${title}`}
      className={cn(
        "min-w-0 overflow-hidden rounded-xl border bg-surface",
        pending ? (risk === "high" ? "border-rose/35" : "border-amber/40") : "border-line",
        className,
      )}
    >
      <header className="flex items-start gap-3 px-4 pt-3.5">
        <span className={cn("mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg", pending ? (risk === "high" ? "bg-rose-soft text-rose" : "bg-amber-soft text-amber") : done ? "bg-ok-soft text-ok" : "bg-soft text-muted")}>
          {pending ? <ShieldAlert className="h-4 w-4" /> : done ? <ShieldCheck className="h-4 w-4" /> : <X className="h-4 w-4" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="m-0 text-[11px] font-medium uppercase tracking-[0.08em] text-muted">{pending ? "Precisa da sua aprovação" : done ? (state === "always" ? "Aprovado · sempre para este tipo" : "Aprovado") : "Recusado"}</p>
          <h3 className="m-0 mt-0.5 text-[14px] font-medium leading-snug">{title}</h3>
          {description && <p className="m-0 mt-1 text-[12.5px] leading-relaxed text-muted">{description}</p>}
        </div>
        {impact && <span className="shrink-0 rounded-md bg-soft px-2 py-1 text-[11.5px] font-medium tabular-nums text-ink-soft ring-1 ring-line">{impact}</span>}
      </header>
      {preview && <div className={cn("mx-4 mt-3 rounded-lg border border-line bg-soft/60 p-3 text-[12.5px] leading-relaxed text-ink-soft", !pending && "opacity-70")}>{preview}</div>}
      {pending ? (
        <footer className="mt-3 flex flex-wrap items-center gap-2 border-t border-line bg-soft/40 px-4 py-3">
          <button type="button" onClick={onApprove} className="ui-button ui-button-primary inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-[13px] font-medium text-on-primary hover:bg-primary/90">
            <ShieldCheck className="h-4 w-4" /> Aprovar
          </button>
          {onApproveAlways && (
            <button type="button" onClick={onApproveAlways} className="inline-flex h-9 items-center rounded-lg px-3 text-[13px] font-medium text-ink ring-1 ring-line hover:bg-soft">
              Sempre aprovar este tipo
            </button>
          )}
          {onEdit && (
            <button type="button" onClick={onEdit} className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-[13px] font-medium text-ink ring-1 ring-line hover:bg-soft">
              <Pencil className="h-3.5 w-3.5" /> Editar
            </button>
          )}
          {onReject && (
            <button type="button" onClick={onReject} className="ml-auto inline-flex h-9 items-center rounded-lg px-3 text-[13px] font-medium text-muted hover:bg-soft hover:text-rose">
              Recusar
            </button>
          )}
        </footer>
      ) : (
        <div className="h-3.5" />
      )}
    </section>
  );
}

/* ================================================================== */
/* AgentPlan                                                           */
/* ================================================================== */

export type PlanStep = { id: string; label: string; status: "pending" | "active" | "done" | "error" | "skipped"; detail?: ReactNode };

/** Plano do agente antes/durante a execução: o que vai fazer, em que ordem, onde está. */
export function AgentPlan({ steps, title = "Plano", className }: { steps: PlanStep[]; title?: string; className?: string }) {
  const done = steps.filter((s) => s.status === "done").length;
  return (
    <div className={cn("rounded-xl border border-line bg-surface p-3.5", className)}>
      <div className="mb-2 flex items-center justify-between text-[12.5px]">
        <span className="font-medium">{title}</span>
        <span className="tabular-nums text-muted">
          {done} de {steps.length}
        </span>
      </div>
      <ol className="list-none space-y-1.5 p-0">
        {steps.map((s) => (
          <li key={s.id} className="flex items-start gap-2 text-[13px]">
            <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center" aria-hidden>
              {s.status === "done" ? (
                <CircleCheck className="h-4 w-4 text-ok" />
              ) : s.status === "active" ? (
                <LoaderCircle className="h-4 w-4 animate-spin text-primary" />
              ) : s.status === "error" ? (
                <CircleX className="h-4 w-4 text-rose" />
              ) : (
                <span className="h-3 w-3 rounded-full border border-line-strong" />
              )}
            </span>
            <span className="min-w-0">
              <span className={cn(s.status === "done" ? "text-muted" : s.status === "active" ? "font-medium text-ink ds-shimmer" : s.status === "skipped" ? "text-muted line-through" : "text-ink-soft")}>{s.label}</span>
              {s.detail && <span className="block text-[11.5px] text-muted">{s.detail}</span>}
            </span>
            <span className="sr-only">{{ pending: "a fazer", active: "em andamento", done: "feito", error: "falhou", skipped: "pulado" }[s.status]}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ================================================================== */
/* AgentMessage                                                        */
/* ================================================================== */

/**
 * Resposta do agente no workspace: status (RunSummary) no topo, texto,
 * artefatos, sugestões de continuação e ações (copiar, refazer, avaliar).
 * Sem balão: a resposta ocupa a largura de leitura.
 */
export function AgentMessage({
  status,
  children,
  artifacts,
  suggestions,
  onSuggestion,
  onRetry,
  onFeedback,
  copyText,
  streaming = false,
  className,
}: {
  status?: ReactNode;
  children?: ReactNode;
  artifacts?: ReactNode;
  suggestions?: string[];
  onSuggestion?: (s: string) => void;
  onRetry?: () => void;
  onFeedback?: (v: "up" | "down") => void;
  copyText?: string;
  streaming?: boolean;
  className?: string;
}) {
  const [fb, setFb] = useState<"up" | "down" | null>(null);
  const [copied, setCopied] = useState(false);
  const act = "grid h-7 w-7 place-items-center rounded-md text-muted hover:bg-soft hover:text-ink";
  return (
    <article className={cn("min-w-0", className)}>
      {status && <div className="mb-2">{status}</div>}
      {children && <div className={cn("flex flex-col gap-3 text-[14px] leading-[1.7] text-ink [&_p]:m-0", streaming && "after:ml-0.5 after:inline-block after:h-4 after:w-1.5 after:translate-y-0.5 after:animate-pulse after:rounded-sm after:bg-ink/60 after:content-['']")}>{children}</div>}
      {artifacts && <div className="mt-4 grid gap-2 sm:grid-cols-2">{artifacts}</div>}
      {!streaming && (suggestions?.length || onRetry || onFeedback || copyText) && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {copyText && (
            <button
              type="button"
              className={act}
              aria-label={copied ? "Copiado" : "Copiar resposta"}
              onClick={() => {
                navigator.clipboard?.writeText(copyText);
                setCopied(true);
                setTimeout(() => setCopied(false), 1200);
              }}
            >
              {copied ? <CircleCheck className="h-3.5 w-3.5 text-ok" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          )}
          {onRetry && (
            <button type="button" className={act} aria-label="Refazer" onClick={onRetry}>
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          )}
          {onFeedback && (
            <>
              <button type="button" className={cn(act, fb === "up" && "text-ok")} aria-pressed={fb === "up"} aria-label="Boa resposta" onClick={() => (setFb("up"), onFeedback("up"))}>
                <ThumbsUp className="h-3.5 w-3.5" />
              </button>
              <button type="button" className={cn(act, fb === "down" && "text-rose")} aria-pressed={fb === "down"} aria-label="Resposta ruim" onClick={() => (setFb("down"), onFeedback("down"))}>
                <ThumbsDown className="h-3.5 w-3.5" />
              </button>
            </>
          )}
          {suggestions?.map((s) => (
            <button key={s} type="button" onClick={() => onSuggestion?.(s)} className="inline-flex h-7 items-center rounded-full px-3 text-[12px] text-ink-soft ring-1 ring-line hover:bg-soft hover:text-ink">
              {s}
            </button>
          ))}
        </div>
      )}
    </article>
  );
}

/* ================================================================== */
/* AgentComposer                                                       */
/* ================================================================== */

export type SlashCommand = { id: string; label: string; description?: string; icon?: ReactNode };

/** Forma de onda animada (gravação, modo voz). Respeita movimento reduzido. */
export function Waveform({ active, className, barClassName = "bg-rose/80", bars: count = 28 }: { active: boolean; className?: string; barClassName?: string; bars?: number }) {
  const [bars, setBars] = useState<number[]>(() => Array.from({ length: count }, () => 0.2));
  useEffect(() => {
    if (!active) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setBars(Array.from({ length: count }, (_, i) => 0.3 + ((i * 7) % 5) / 10));
      return;
    }
    const t = setInterval(() => setBars((b) => [...b.slice(1), 0.15 + Math.random() * 0.85]), 90);
    return () => clearInterval(t);
  }, [active, count]);
  return (
    <span className={cn("flex h-6 flex-1 items-center gap-[3px] overflow-hidden", className)} aria-hidden>
      {bars.map((h, i) => (
        <span key={i} className={cn("w-[3px] shrink-0 rounded-full transition-[height] duration-100", barClassName)} style={{ height: `${Math.round(h * 100)}%` }} />
      ))}
    </span>
  );
}

/**
 * Campo de tarefa do agente: texto com autoaltura, "/" abre comandos, "+"
 * anexa (arquivo, dados do app, link), microfone grava com forma de onda e
 * cronômetro, seletor de agente/modelo e chips de contexto. Enter envia,
 * Shift+Enter quebra linha; durante a execução o botão vira Parar.
 */
export function AgentComposer({
  value,
  onChange,
  onSubmit,
  onStop,
  busy = false,
  placeholder = "Peça uma análise ou dê uma tarefa ao agente…",
  commands = [],
  attachOptions,
  agentChip,
  contextChips,
  onTranscribe,
  disabled,
  className,
  attachIcon,
  leading,
  trailing,
  footer,
  hint,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: (v: string) => void;
  onStop?: () => void;
  busy?: boolean;
  placeholder?: string;
  commands?: SlashCommand[];
  /** Itens do menu "+". Padrão: arquivo, dados do CRM, link. */
  attachOptions?: MenuEntry[];
  /** Chip do agente/modelo (use Menu ou ComposerChip). */
  agentChip?: ReactNode;
  contextChips?: ReactNode;
  /** Chamado ao terminar a gravação com a duração (ms). Retorne o texto transcrito. */
  onTranscribe?: (ms: number) => string | Promise<string>;
  disabled?: boolean;
  className?: string;
  /** Ícone do botão de anexar (padrão: +). Ex.: <Paperclip />. */
  attachIcon?: ReactNode;
  /** Botões logo após o anexar (ex.: pasta de contexto). */
  leading?: ReactNode;
  /** Antes do microfone, à direita (ex.: avatares de agentes/modelos). */
  trailing?: ReactNode;
  /** Linha extra no rodapé do campo (ex.: ToolsBar com ferramentas conectadas). */
  footer?: ReactNode;
  /** Dica discreta à direita da 1ª linha, só com o campo vazio e largo (≥ 640px). Ex.: "/ para comandos". */
  hint?: ReactNode;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [cmdIdx, setCmdIdx] = useState(0);
  const [recording, setRecording] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Vazio: altura natural (medir com o campo oculto/estreito dava altura errada).
    if (!value) {
      el.style.height = "";
      return;
    }
    el.style.height = "auto";
    el.style.height = `${Math.min(220, el.scrollHeight)}px`;
  }, [value]);
  useEffect(() => {
    if (recording == null) return;
    const t = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(t);
  }, [recording]);
  const slash = /^\/(\S*)$/.exec(value);
  const filtered = slash ? commands.filter((c) => c.label.toLowerCase().includes(slash[1].toLowerCase())) : [];
  const menuOpen = !!slash && filtered.length > 0;
  const pick = (c: SlashCommand) => {
    onChange(`/${c.label.replace(/^\//, "")} `);
    setCmdIdx(0);
    ref.current?.focus();
  };
  const send = () => {
    if (!value.trim() || busy || disabled) return;
    onSubmit(value.trim());
  };
  const stopRec = async (keep: boolean) => {
    const ms = recording ? Date.now() - recording : 0;
    setRecording(null);
    if (!keep) return;
    const text = onTranscribe ? await onTranscribe(ms) : "";
    if (text) onChange(value ? `${value} ${text}` : text);
    ref.current?.focus();
  };
  const recSecs = recording ? Math.max(0, Math.floor((now - recording) / 1000)) : 0;
  const attach: MenuEntry[] = attachOptions ?? [
    { label: "Arquivo do computador", icon: <Paperclip className="h-4 w-4" /> },
    { label: "Dados do CRM", icon: <Database className="h-4 w-4" /> },
    { label: "Link (URL)", icon: <Link className="h-4 w-4" /> },
  ];
  return (
    <div className={cn("@container/composer relative rounded-2xl border border-line bg-surface shadow-surface transition-colors focus-within:border-line-strong", className)}>
      {menuOpen && (
        <div role="listbox" aria-label="Comandos" className="absolute inset-x-2 bottom-full z-20 mb-2 overflow-hidden rounded-xl border border-line bg-popover p-1 shadow-popup">
          {filtered.map((c, i) => (
            <button
              key={c.id}
              type="button"
              role="option"
              aria-selected={i === cmdIdx}
              onMouseEnter={() => setCmdIdx(i)}
              onMouseDown={(e) => {
                e.preventDefault();
                pick(c);
              }}
              className={cn("flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left", i === cmdIdx && "bg-soft")}
            >
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md border border-line bg-surface text-muted [&_svg]:h-3.5 [&_svg]:w-3.5">{c.icon ?? <Sparkles />}</span>
              <span className="text-[13px] font-medium">/{c.label.replace(/^\//, "")}</span>
              {c.description && <span className="truncate text-[12px] text-muted">{c.description}</span>}
            </button>
          ))}
        </div>
      )}
      {contextChips && <div className="flex flex-wrap gap-1.5 px-3 pt-3">{contextChips}</div>}
      {recording != null ? (
        <div className="flex h-[52px] items-center gap-3 px-4" role="status" aria-live="polite">
          <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-rose" aria-hidden />
          <span className="w-10 shrink-0 text-[12.5px] tabular-nums text-ink-soft">
            {Math.floor(recSecs / 60)}:{String(recSecs % 60).padStart(2, "0")}
          </span>
          <Waveform active />
          <span className="sr-only">Gravando áudio</span>
        </div>
      ) : (
        <div className="relative">
        <textarea
          ref={ref}
          rows={1}
          value={value}
          disabled={disabled}
          aria-label={placeholder}
          placeholder={placeholder}
          onChange={(e) => {
            onChange(e.target.value);
            setCmdIdx(0);
          }}
          onKeyDown={(e) => {
            if (menuOpen) {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setCmdIdx((i) => (i + 1) % filtered.length);
                return;
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setCmdIdx((i) => (i - 1 + filtered.length) % filtered.length);
                return;
              }
              if (e.key === "Enter" || e.key === "Tab") {
                e.preventDefault();
                pick(filtered[cmdIdx]);
                return;
              }
              if (e.key === "Escape") {
                onChange("");
                return;
              }
            }
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              send();
            }
          }}
          className={cn(
            "block max-h-[220px] min-h-[52px] w-full resize-none bg-transparent px-4 pt-3.5 text-[14px] leading-relaxed text-ink outline-none placeholder:truncate placeholder:text-muted focus-visible:shadow-none",
            !!hint && !value && "@[640px]/composer:pr-40",
          )}
        />
        {hint && !value && (
          <span aria-hidden className="pointer-events-none absolute right-4 top-4 hidden whitespace-nowrap text-[12px] text-muted @[640px]/composer:inline-flex">
            {hint}
          </span>
        )}
        </div>
      )}
      {/* @container: os chips (permissão, modelo, ferramentas) compactam sozinhos quando o campo é estreito. */}
      <div className="@container flex items-center gap-1.5 px-2 pb-2 pt-1 [&>*]:shrink-0">
        {recording == null ? (
          <>
            <Menu
              label="Anexar"
              align="start"
              side="top"
              triggerClassName="!h-8 !w-8 justify-center !gap-0 !rounded-full !px-0 !text-muted hover:!text-ink"
              trigger={attachIcon ?? <Plus className="h-4 w-4" />}
              items={attach}
            />
            {leading}
            {agentChip}
            <span className="flex-1" />
            {trailing}
            <Tooltip content="Ditar" side="top">
              <button type="button" onClick={() => setRecording(Date.now())} aria-label="Gravar áudio" disabled={busy || disabled} className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-soft hover:text-ink disabled:opacity-40">
                <Mic className="h-4 w-4" />
              </button>
            </Tooltip>
            {busy ? (
              <button type="button" onClick={onStop} aria-label="Parar" className="grid h-8 w-8 place-items-center rounded-full bg-primary text-on-primary hover:bg-primary/90">
                <Square className="h-3 w-3 fill-current" />
              </button>
            ) : (
              <button type="button" onClick={send} disabled={!value.trim() || disabled} aria-label="Enviar" className="grid h-8 w-8 place-items-center rounded-full bg-primary text-on-primary hover:bg-primary/90 disabled:opacity-30">
                <ArrowUp className="h-4 w-4" />
              </button>
            )}
          </>
        ) : (
          <>
            <button type="button" onClick={() => stopRec(false)} className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] text-muted ring-1 ring-line hover:bg-soft hover:text-ink">
              <X className="h-3.5 w-3.5" /> Cancelar
            </button>
            <span className="flex-1 text-[11.5px] text-muted">
              <AudioLines className="mr-1 inline h-3.5 w-3.5" aria-hidden />
              Fale a tarefa; ao terminar vira texto editável
            </span>
            <button type="button" onClick={() => stopRec(true)} aria-label="Concluir gravação" className="inline-flex h-8 items-center gap-1.5 rounded-full bg-primary px-3 text-[12.5px] font-medium text-on-primary hover:bg-primary/90">
              <CircleCheck className="h-3.5 w-3.5" /> Pronto
            </button>
          </>
        )}
      </div>
      {footer && recording == null && <div className="border-t border-line px-3 py-2">{footer}</div>}
    </div>
  );
}
