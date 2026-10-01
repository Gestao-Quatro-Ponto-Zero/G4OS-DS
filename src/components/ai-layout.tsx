"use client";

import { Popover as BasePopover } from "@base-ui/react/popover";
import { ArrowDown, ChevronDown, ChevronLeft, ChevronRight, ListTree, PanelLeft, PanelLeftClose, Search } from "lucide-react";
import { Children, createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode, type RefObject } from "react";
import { cn } from "../lib/cn";
import { normalize } from "../lib/text";
import { SessionStatusGlyph, ThreadMinimap, type MinimapItem, type SessionStatus } from "./ai-sessions";
import { ResizableSplit } from "./ai-workspace";
import { popupClass } from "./overlays";
import { Menu, Tooltip, type MenuEntry } from "./overlays-extra";

/*
 * Layout de app agêntico (docs: IA e interação › Layout de app agêntico).
 * Quatro áreas, todas opcionais exceto `main`:
 *
 *   ┌──────┬──────────┬──────────────────────────┬───────────────┐
 *   │ rail │  list    │  main                    │  panel        │
 *   │ 56px │ 240–420  │  cabeçalho · conversa ·  │  artefatos,   │
 *   │      │ (⌘\)     │  campo                   │  detalhes (⌘.)│
 *   └──────┴──────────┴──────────────────────────┴───────────────┘
 *
 * Celular (< 768px): a lista é a primeira tela; abrir um item mostra o
 * `main` em tela cheia (volte com o onBack do ThreadHeader); o painel abre
 * por cima, em tela cheia; o trilho vira `mobileNav` (BottomNav) na lista.
 */

function useMedia(query: string) {
  const [match, setMatch] = useState(() => typeof window !== "undefined" && window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setMatch(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [query]);
  return match;
}

const readNumber = (key: string | undefined, fallback: number, min: number, max: number) => {
  if (!key || typeof window === "undefined") return fallback;
  try {
    const v = Number(localStorage.getItem(key));
    return v >= min && v <= max ? v : fallback;
  } catch {
    return fallback;
  }
};

/* ================================================================== */
/* AgentAppLayout                                                      */
/* ================================================================== */

export type AgentMobileView = "list" | "main";

type AgentLayoutState = { hasList: boolean; listOpen: boolean; setListOpen: (open: boolean) => void; mobile: boolean };
const AgentLayoutContext = createContext<AgentLayoutState | null>(null);

/**
 * Estado da lista do AgentAppLayout mais próximo (aberta, alternar, celular).
 * Fora do layout devolve null. Use para montar controles próprios.
 */
export function useAgentLayout() {
  return useContext(AgentLayoutContext);
}

export function AgentAppLayout({
  rail,
  list,
  main,
  panel,
  panelOpen = false,
  onPanelOpenChange,
  listOpen: listOpenProp,
  onListOpenChange,
  defaultListWidth = 300,
  minListWidth = 240,
  maxListWidth = 420,
  panelSize = 0.58,
  storageKey,
  mobileView = "main",
  mobileNav,
  className,
}: {
  /** Trilho de ícones (IconRail). Some no celular: use `mobileNav`. */
  rail?: ReactNode;
  /** Lista (SessionSidebar, lista de projetos). Recolhível com ⌘\ e redimensionável. */
  list?: ReactNode;
  /** Área principal: ThreadHeader + ThreadView + campo. */
  main: ReactNode;
  /** Painel à direita (ArtifactPanel, SessionInfoPanel). */
  panel?: ReactNode;
  panelOpen?: boolean;
  /** Alternar com ⌘. (ou Ctrl+.). Sem handler, o atalho não age. */
  onPanelOpenChange?: (open: boolean) => void;
  /** Controlado. Sem ele, o layout guarda o estado (e persiste com `storageKey`). */
  listOpen?: boolean;
  onListOpenChange?: (open: boolean) => void;
  defaultListWidth?: number;
  minListWidth?: number;
  maxListWidth?: number;
  /** Fração da largura do `main` quando o painel está aberto (0–1). */
  panelSize?: number;
  /** Persiste largura/abertura da lista e do painel no localStorage. */
  storageKey?: string;
  /** Celular: qual tela mostrar ("list" = lista; "main" = conversa). O app troca ao selecionar/voltar. */
  mobileView?: AgentMobileView;
  /** Celular: navegação inferior (BottomNav) mostrada só na tela da lista. */
  mobileNav?: ReactNode;
  className?: string;
}) {
  const mobile = useMedia("(max-width: 767.98px)");
  const listKey = storageKey ? `ds-agent-list:${storageKey}` : undefined;
  const [ownOpen, setOwnOpen] = useState(() => {
    if (!listKey || typeof window === "undefined") return true;
    try {
      return localStorage.getItem(`${listKey}:open`) !== "0";
    } catch {
      return true;
    }
  });
  const listOpen = listOpenProp ?? ownOpen;
  const setListOpen = useCallback(
    (v: boolean) => {
      if (listOpenProp === undefined) setOwnOpen(v);
      onListOpenChange?.(v);
      if (listKey)
        try {
          localStorage.setItem(`${listKey}:open`, v ? "1" : "0");
        } catch {
          /* sem persistência */
        }
    },
    [listOpenProp, onListOpenChange, listKey],
  );
  const [width, setWidth] = useState(() => readNumber(listKey ? `${listKey}:w` : undefined, defaultListWidth, minListWidth, maxListWidth));
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);
  const startW = useRef(width);
  const commitWidth = (w: number) => {
    const c = Math.round(Math.min(maxListWidth, Math.max(minListWidth, w)));
    setWidth(c);
    if (listKey)
      try {
        localStorage.setItem(`${listKey}:w`, String(c));
      } catch {
        /* sem persistência */
      }
  };

  // Atalhos: ⌘\ lista, ⌘. painel.
  const stateRef = useRef({ listOpen, panelOpen });
  stateRef.current = { listOpen, panelOpen };
  useEffect(() => {
    const on = (e: globalThis.KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.altKey) return;
      if (e.key === "\\" && list) {
        e.preventDefault();
        setListOpen(!stateRef.current.listOpen);
      } else if (e.key === "." && panel && onPanelOpenChange) {
        e.preventDefault();
        onPanelOpenChange(!stateRef.current.panelOpen);
      }
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, [list, panel, onPanelOpenChange, setListOpen]);

  const onSepKey = (e: KeyboardEvent) => {
    const step = e.shiftKey ? 40 : 12;
    if (e.key === "ArrowLeft") commitWidth(width - step);
    else if (e.key === "ArrowRight") commitWidth(width + step);
    else if (e.key === "Home") commitWidth(minListWidth);
    else if (e.key === "End") commitWidth(maxListWidth);
    else if (e.key === "Enter") setListOpen(false);
    else return;
    e.preventDefault();
  };

  const ctx = useMemo<AgentLayoutState>(() => ({ hasList: !!list, listOpen, setListOpen, mobile }), [list, listOpen, setListOpen, mobile]);

  if (mobile) {
    const showList = !!list && mobileView === "list";
    return (
      <AgentLayoutContext.Provider value={ctx}>
      <div className={cn("flex h-dvh min-h-0 flex-col overflow-hidden bg-page", className)}>
        {showList ? (
          <>
            <div className={cn("flex min-h-0 flex-1", !!mobileNav && "pb-[calc(76px+env(safe-area-inset-bottom))]")}>{list}</div>
            {mobileNav}
          </>
        ) : (
          <div className={cn("flex min-h-0 flex-1", !list && !!mobileNav && "pb-[calc(76px+env(safe-area-inset-bottom))]")}>
            <ResizableSplit left={main} right={panel ?? null} rightOpen={!!panel && panelOpen} storageKey={storageKey ? `${storageKey}:panel` : undefined} />
          </div>
        )}
        {!showList && !list && mobileNav}
      </div>
      </AgentLayoutContext.Provider>
    );
  }

  return (
    <AgentLayoutContext.Provider value={ctx}>
    <div className={cn("flex h-dvh min-h-0 overflow-hidden bg-page", dragging && "cursor-col-resize select-none", className)}>
      {rail}
      {list && (
        // Recolher anima a largura (o conteúdo fica com largura fixa e é recortado),
        // e a lista sai da ordem de foco/leitura quando fechada.
        <div
          className={cn("relative flex min-h-0 shrink-0 overflow-hidden", listOpen && "border-r border-line", !dragging && "transition-[width] duration-200 ease-out motion-reduce:transition-none")}
          style={{ width: listOpen ? width : 0 }}
          inert={!listOpen}
          aria-hidden={!listOpen || undefined}
        >
          <div className="flex min-h-0 shrink-0" style={{ width }}>{list}</div>
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Largura da lista (Enter recolhe)"
            aria-valuemin={minListWidth}
            aria-valuemax={maxListWidth}
            aria-valuenow={width}
            tabIndex={0}
            onKeyDown={onSepKey}
            onPointerDown={(e) => {
              e.preventDefault();
              (e.target as HTMLElement).setPointerCapture(e.pointerId);
              startX.current = e.clientX;
              startW.current = width;
              setDragging(true);
            }}
            onPointerMove={(e) => dragging && commitWidth(startW.current + (e.clientX - startX.current))}
            onPointerUp={() => setDragging(false)}
            onPointerCancel={() => setDragging(false)}
            onDoubleClick={() => commitWidth(defaultListWidth)}
            className="group absolute right-0 inset-y-0 z-10 flex w-2 cursor-col-resize justify-end outline-none"
          >
            <span className={cn("h-full w-px transition-colors", dragging ? "bg-primary" : "bg-transparent group-hover:bg-line-strong group-focus-visible:bg-primary")} />
          </div>
        </div>
      )}
      <div className="flex min-h-0 min-w-0 flex-1">
        <ResizableSplit
          left={main}
          right={panel ?? null}
          rightOpen={!!panel && panelOpen}
          defaultSize={panelSize}
          min={0.36}
          max={0.78}
          storageKey={storageKey ? `${storageKey}:panel` : undefined}
          label="Redimensionar painel"
        />
      </div>
    </div>
    </AgentLayoutContext.Provider>
  );
}

/* ================================================================== */
/* ListToggle e troca rápida de sessão                                 */
/* ================================================================== */

/**
 * Botão de recolher/mostrar a lista do AgentAppLayout (⌘\). Sem props, lê o
 * estado do layout mais próximo; passe `open`/`onToggle` para controlar fora
 * dele. Some no celular (lá a lista é uma tela própria). Coloque no `leading`
 * do ThreadHeader.
 */
export function ListToggle({ open, onToggle, label = "lista", className }: { open?: boolean; onToggle?: () => void; label?: string; className?: string }) {
  const layout = useAgentLayout();
  const isOpen = open ?? layout?.listOpen ?? true;
  const toggle = onToggle ?? (() => layout?.setListOpen(!isOpen));
  if (!onToggle && !layout?.hasList) return null;
  const text = isOpen ? `Recolher ${label}` : `Mostrar ${label}`;
  return (
    <Tooltip content={`${text} (⌘\\)`} side="bottom">
      <button
        type="button"
        onClick={toggle}
        aria-label={text}
        aria-expanded={isOpen}
        className={cn("hidden h-8 w-8 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-ink/[0.06] hover:text-ink md:grid [&_svg]:h-4 [&_svg]:w-4", className)}
      >
        {isOpen ? <PanelLeftClose /> : <PanelLeft />}
      </button>
    </Tooltip>
  );
}

export type QuickSession = { id: string; title: string; time?: string; status?: SessionStatus; group?: string };

/**
 * Troca rápida de sessão (⌘K-lite) para quando a lista está recolhida: botão
 * que abre um popover com busca, setas e Enter. Agrupa por `group` (projeto ou
 * dia). Aparece só no desktop com a lista recolhida, a não ser que `always`.
 */
export function SessionQuickSwitcher({
  sessions,
  activeId,
  onSelect,
  always = false,
  label = "Sessões",
  className,
}: {
  sessions: QuickSession[];
  activeId?: string;
  onSelect: (id: string) => void;
  always?: boolean;
  label?: string;
  className?: string;
}) {
  const layout = useAgentLayout();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);
  const visible = useMemo(() => {
    const n = normalize(q.trim());
    return n ? sessions.filter((s) => normalize(`${s.title} ${s.group ?? ""}`).includes(n)) : sessions;
  }, [q, sessions]);
  useEffect(() => {
    if (!open) {
      setQ("");
      setIdx(0);
    } else setIdx(Math.max(0, visible.findIndex((s) => s.id === activeId)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  useEffect(() => {
    listRef.current?.querySelector(`[data-idx="${idx}"]`)?.scrollIntoView({ block: "nearest" });
  }, [idx]);
  if (!always && (!layout || layout.mobile || layout.listOpen)) return null;
  const pick = (id: string) => {
    onSelect(id);
    setOpen(false);
  };
  let lastGroup: string | undefined;
  return (
    <BasePopover.Root open={open} onOpenChange={setOpen}>
      <Tooltip content={`${label} (troca rápida)`} side="bottom">
        <BasePopover.Trigger
          aria-label={`${label}: trocar de sessão`}
          className={cn(
            "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2 text-[12.5px] text-muted outline-none transition-colors hover:bg-ink/[0.06] hover:text-ink focus-visible:ring-2 focus-visible:ring-muted/40 data-popup-open:bg-ink/[0.06] data-popup-open:text-ink [&_svg]:h-4 [&_svg]:w-4",
            className,
          )}
        >
          <ListTree />
          <span className="hidden xl:inline">{label}</span>
        </BasePopover.Trigger>
      </Tooltip>
      <BasePopover.Portal>
        <BasePopover.Positioner side="bottom" align="start" sideOffset={6} collisionPadding={12} className="z-[100]">
          <BasePopover.Popup className={cn(popupClass, "flex max-h-[min(460px,var(--available-height))] w-[340px] max-w-[calc(100vw-24px)] flex-col overflow-hidden bg-popover")}>
            <label className="flex items-center gap-2 border-b border-line px-3">
              <Search className="h-4 w-4 shrink-0 text-muted" aria-hidden />
              <input
                autoFocus
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setIdx(0);
                }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setIdx((v) => Math.min(visible.length - 1, v + 1));
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setIdx((v) => Math.max(0, v - 1));
                  } else if (e.key === "Enter" && visible[idx]) {
                    e.preventDefault();
                    pick(visible[idx].id);
                  }
                }}
                placeholder="Ir para sessão…"
                aria-label="Buscar sessão"
                role="combobox"
                aria-expanded="true"
                aria-controls="quick-session-list"
                autoComplete="off"
                className="ds-bare h-11 min-w-0 flex-1 bg-transparent text-[13.5px] outline-none placeholder:text-muted"
              />
            </label>
            <ul ref={listRef} id="quick-session-list" role="listbox" aria-label={label} className="m-0 min-h-0 flex-1 list-none overflow-y-auto p-1.5">
              {visible.map((s, i) => {
                const header = s.group && s.group !== lastGroup ? s.group : null;
                lastGroup = s.group;
                return (
                  <li key={s.id} role="presentation">
                    {header && <p className="m-0 px-2.5 pb-1 pt-2 text-[11px] font-medium text-muted">{header}</p>}
                    <button
                      type="button"
                      role="option"
                      aria-selected={s.id === activeId}
                      data-idx={i}
                      onMouseMove={() => setIdx(i)}
                      onClick={() => pick(s.id)}
                      className={cn("flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[13px]", i === idx ? "bg-ink/[0.06]" : "", s.id === activeId ? "font-medium text-ink" : "text-ink-soft")}
                    >
                      <span className="min-w-0 flex-1 truncate">{s.title}</span>
                      <SessionStatusGlyph status={s.status} />
                      {s.time && <span className="shrink-0 text-[11.5px] tabular-nums text-muted">{s.time}</span>}
                    </button>
                  </li>
                );
              })}
              {!visible.length && <li className="px-3 py-6 text-center text-[12.5px] text-muted">Nenhuma sessão com “{q}”.</li>}
            </ul>
          </BasePopover.Popup>
        </BasePopover.Positioner>
      </BasePopover.Portal>
    </BasePopover.Root>
  );
}

/* ================================================================== */
/* ThreadHeader                                                        */
/* ================================================================== */

export type ThreadAction = {
  id: string;
  label: string;
  icon: ReactNode;
  onClick: () => void;
  /** Estado ligado (painel aberto, gravando). */
  active?: boolean;
  /** Mostra o rótulo a partir de 1024px. */
  showLabel?: boolean;
  /** Esconde abaixo de 640px. */
  hideOnMobile?: boolean;
  /** Destaque de estado (gravando = rose). */
  tone?: "neutral" | "danger";
};

/**
 * Cabeçalho da conversa: voltar (celular), título com menu (renomear, mover,
 * exportar…) e ações compactas em ícone com tooltip. `leading` aceita uma
 * trilha (Sessões ›) ou um botão de recolher a lista.
 */
export function ThreadHeader({
  title,
  menu,
  leading,
  onBack,
  backLabel = "Voltar",
  actions = [],
  trailing,
  className,
}: {
  title: ReactNode;
  menu?: MenuEntry[];
  leading?: ReactNode;
  onBack?: () => void;
  backLabel?: string;
  actions?: ThreadAction[];
  trailing?: ReactNode;
  className?: string;
}) {
  const icon = "grid h-8 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-ink/[0.06] hover:text-ink [&_svg]:h-4 [&_svg]:w-4";
  return (
    <header className={cn("flex h-12 shrink-0 items-center gap-1 border-b border-line px-2 sm:px-3", className)}>
      {onBack && (
        <button type="button" onClick={onBack} aria-label={backLabel} className={cn(icon, "w-8 md:hidden")}>
          <ChevronLeft />
        </button>
      )}
      {leading}
      <div className="flex min-w-0 flex-1 items-center">
        {menu ? (
          <Menu
            label="Ações da conversa"
            align="start"
            triggerClassName="!h-8 min-w-0 max-w-full !gap-1 !rounded-lg !bg-transparent !px-2 !text-[13.5px] !font-semibold !text-ink !ring-0 hover:!bg-ink/[0.05]"
            trigger={
              <>
                <span className="truncate">{title}</span>
                <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted" />
              </>
            }
            items={menu}
          />
        ) : (
          <h1 className="m-0 truncate px-2 text-[13.5px] font-semibold">{title}</h1>
        )}
      </div>
      {actions.map((a) => {
        const btn = (
          <button
            key={a.id}
            type="button"
            onClick={a.onClick}
            aria-pressed={a.active}
            aria-label={a.label}
            className={cn(
              icon,
              a.showLabel ? "w-8 gap-1.5 lg:w-auto lg:px-2.5 lg:text-[12.5px] lg:font-medium" : "w-8",
              a.hideOnMobile && "hidden sm:grid",
              a.active && (a.tone === "danger" ? "bg-rose-soft text-rose hover:bg-rose-soft hover:text-rose" : "bg-ink/[0.07] text-ink"),
              a.showLabel && "lg:flex lg:items-center",
            )}
          >
            {a.icon}
            {a.showLabel && <span className="hidden lg:inline">{a.label}</span>}
          </button>
        );
        return a.showLabel ? (
          btn
        ) : (
          <Tooltip key={a.id} content={a.label} side="bottom">
            {btn}
          </Tooltip>
        );
      })}
      {trailing}
    </header>
  );
}

/* ================================================================== */
/* ThreadView                                                          */
/* ================================================================== */

/** Separador de dia na conversa ("Hoje", "12 mar"). */
export function ThreadDaySeparator({ label, className }: { label: string; className?: string }) {
  return (
    <div role="separator" aria-label={label} className={cn("flex items-center gap-3 py-1 text-[11.5px] font-medium text-muted", className)}>
      <span aria-hidden className="h-px flex-1 bg-line" />
      {label}
      <span aria-hidden className="h-px flex-1 bg-line" />
    </div>
  );
}

/**
 * Área rolável da conversa. Segue o fim enquanto a pessoa está no fim (novas
 * mensagens, resposta escrevendo); se ela subiu para reler, NÃO puxa de volta
 * e mostra "Ir para o fim". `resetKey` (ex.: id da sessão) volta ao fim na
 * troca. Minimapa opcional à esquerda (cada mensagem precisa de `id`).
 */
export function ThreadView({
  children,
  follow,
  resetKey,
  minimap,
  maxWidth = 760,
  scrollRef: externalRef,
  className,
  contentClassName,
  bottomOffset = 0,
  collapseBefore = 0,
  collapsedLabel = (n: number) => `${n} ${n === 1 ? "mensagem anterior" : "mensagens anteriores"}`,
}: {
  children: ReactNode;
  /** Muda quando o conteúdo cresce (nº de mensagens, caracteres escritos). */
  follow?: unknown;
  /** Muda ao trocar de conversa: rola até o fim sem animação. */
  resetKey?: unknown;
  minimap?: MinimapItem[];
  /** Largura máxima da coluna de leitura (px). */
  maxWidth?: number;
  scrollRef?: RefObject<HTMLDivElement | null>;
  className?: string;
  contentClassName?: string;
  /** Espaço reservado embaixo (ex.: botão flutuante no celular). */
  bottomOffset?: number;
  /**
   * Recolhe os N primeiros filhos numa linha "N mensagens anteriores ›" (conversas
   * longas: mostra só o final). Clique expande. Volta a recolher ao trocar `resetKey`.
   */
  collapseBefore?: number;
  collapsedLabel?: (count: number) => string;
}) {
  const own = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  useEffect(() => setExpanded(false), [resetKey]);
  const items = Children.toArray(children);
  const hidden = !expanded && collapseBefore > 0 && items.length > collapseBefore ? collapseBefore : 0;
  const ref = externalRef ?? own;
  const [atBottom, setAtBottom] = useState(true);
  const atBottomRef = useRef(true);
  const onScroll = () => {
    const el = ref.current;
    if (!el) return;
    const v = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    atBottomRef.current = v;
    setAtBottom(v);
  };
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight });
    atBottomRef.current = true;
    setAtBottom(true);
  }, [resetKey, ref]);
  useEffect(() => {
    const el = ref.current;
    if (el && atBottomRef.current) el.scrollTo({ top: el.scrollHeight });
  }, [follow, ref]);
  return (
    <div className={cn("relative min-h-0 flex-1", className)}>
      <div ref={ref} onScroll={onScroll} className="docs-scroll h-full overflow-y-auto overscroll-contain px-4 pt-6 sm:px-8" style={{ paddingBottom: 24 + bottomOffset }}>
        <div className={cn("mx-auto flex flex-col gap-5", contentClassName)} style={{ maxWidth }}>
          {hidden > 0 && <CollapsedHistory label={collapsedLabel(hidden)} onExpand={() => setExpanded(true)} />}
          {hidden > 0 ? items.slice(hidden) : children}
        </div>
      </div>
      {minimap && (
        <ThreadMinimap
          // Com histórico recolhido, só as mensagens visíveis (as últimas) entram no minimapa.
          items={hidden > 0 ? minimap.slice(Math.max(0, minimap.length - (items.length - hidden))) : minimap}
          scrollRef={ref}
          className="absolute left-3 top-6 hidden lg:flex"
        />
      )}
      {!atBottom && (
        <button
          type="button"
          onClick={() => ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: "smooth" })}
          className="enter absolute bottom-3 left-1/2 z-10 inline-flex h-8 -translate-x-1/2 items-center gap-1.5 rounded-full border border-line bg-popover px-3 text-[12px] font-medium text-ink-soft shadow-raised hover:text-ink"
        >
          <ArrowDown className="h-3.5 w-3.5" /> Ir para o fim
        </button>
      )}
    </div>
  );
}

/**
 * Linha "67 mensagens anteriores ›" com fio fino: histórico recolhido no topo
 * de uma conversa longa. Usada pelo ThreadView (`collapseBefore`), mas
 * funciona sozinha.
 */
export function CollapsedHistory({ label, onExpand, className }: { label: string; onExpand: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onExpand}
      aria-label={`${label}: mostrar`}
      className={cn("group flex w-full items-center gap-1 border-b border-line pb-2 text-left text-[13px] text-muted transition-colors hover:text-ink", className)}
    >
      {label}
      <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
    </button>
  );
}
