"use client";

import { AlertCircle, ArrowDown, Check, CheckCheck, Loader2, RotateCcw } from "lucide-react";
import {
  Children,
  cloneElement,
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type HTMLAttributes,
  type MutableRefObject,
  type RefObject,
  type ReactElement,
  type ReactNode,
} from "react";
import { cn } from "../lib/cn";
import { Tooltip } from "./overlays-extra";

/*
 * Conversa (equivalentes a Bubble, Marker e Message Scroller do shadcn/ui).
 *   Bubble / BubbleGroup     fala em balão: variantes, alinhamento, grupo de
 *                             falas seguidas, status de envio, reações, "Ver mais"
 *   Marker                    nota inline da conversa: status, aviso do sistema,
 *                             linha com borda ou separador rotulado ("Hoje")
 *   MessageScroller*          rolagem de conversa: abre no fim, acompanha o fim
 *                             enquanto a pessoa está lá, ancora o turno novo,
 *                             mantém a posição ao carregar mensagens antigas,
 *                             botão "Ir para o fim" com contagem de novas
 * Para o assistente de IA pronto (texto corrido + ações), use ChatMessage.
 */

/* ------------------------------------------------------------------ */
/* Bubble                                                              */
/* ------------------------------------------------------------------ */

export type BubbleVariant = "default" | "secondary" | "muted" | "tinted" | "outline" | "ghost" | "destructive";
export type BubbleStatus = "sending" | "sent" | "read" | "error";
type BubblePosition = "single" | "first" | "middle" | "last";

const bubbleVariant: Record<BubbleVariant, string> = {
  default: "bg-primary text-on-primary",
  secondary: "bg-soft text-ink ring-1 ring-line",
  muted: "bg-soft/70 text-ink-soft",
  tinted: "bg-[color-mix(in_oklab,var(--ds-primary)_9%,var(--ds-surface))] text-ink",
  outline: "bg-surface text-ink ring-1 ring-line",
  ghost: "bg-transparent px-0 text-ink",
  destructive: "bg-rose-soft text-rose ring-1 ring-rose/25",
};

const BubbleCtx = createContext<{ variant: BubbleVariant; align: "start" | "end"; position: BubblePosition; clamp?: number }>({
  variant: "secondary",
  align: "start",
  position: "single",
});

function corner(align: "start" | "end", position: BubblePosition) {
  // O canto do lado do autor afina: só no último (ou único) balão do grupo fica a "ponta".
  const tail = align === "end" ? "rounded-br-md" : "rounded-bl-md";
  const joinTop = align === "end" ? "rounded-tr-md" : "rounded-tl-md";
  const joinBottom = align === "end" ? "rounded-br-md" : "rounded-bl-md";
  if (position === "single") return tail;
  if (position === "first") return joinBottom;
  if (position === "middle") return cn(joinTop, joinBottom);
  return cn(joinTop, tail);
}

/**
 * Uma fala em balão. Use `align="end"` para quem está usando o app e
 * `start` para as outras pessoas. `variant` muda o peso: `secondary` (padrão,
 * gelo), `default` (cor de ação), `tinted`, `outline`, `muted`, `ghost`
 * (sem balão, largura total) e `destructive` (mensagem que falhou ou foi
 * removida). Sem `BubbleContent` nos filhos, o conteúdo é embrulhado.
 *
 *   <Bubble align="end" status="read" time="09:41">Proposta enviada.</Bubble>
 */
export function Bubble({
  children,
  variant = "secondary",
  align = "start",
  status,
  time,
  onRetry,
  clamp,
  tooltip,
  position = "single",
  className,
}: {
  children: ReactNode;
  variant?: BubbleVariant;
  align?: "start" | "end";
  /** Estado de envio (só faz sentido em `align="end"`). `error` mostra "Tentar de novo" com `onRetry`. */
  status?: BubbleStatus;
  /** Hora curta exibida embaixo ("09:41"). */
  time?: ReactNode;
  onRetry?: () => void;
  /** Limita a N linhas com "Ver mais". */
  clamp?: number;
  /** Dica ao passar o mouse ou focar o balão (hora completa, "Editada"). O balão vira focável. */
  tooltip?: ReactNode;
  /** Definido pelo BubbleGroup; ajusta os cantos de falas seguidas. */
  position?: BubblePosition;
  className?: string;
}) {
  const items = Children.toArray(children);
  const hasContent = items.some((c) => isValidElement(c) && c.type === BubbleContent);
  const reactions = items.filter((c) => isValidElement(c) && c.type === BubbleReactions);
  const rest = items.filter((c) => !(isValidElement(c) && c.type === BubbleReactions));
  const showMeta = (status || time) && (position === "single" || position === "last");
  return (
    <BubbleCtx.Provider value={{ variant, align, position, clamp }}>
      <div data-bubble="" data-align={align} className={cn("flex w-full flex-col", align === "end" ? "items-end" : "items-start", className)}>
        <div className={cn("relative flex min-w-0 flex-col", variant === "ghost" ? "w-full" : "max-w-[80%]", align === "end" ? "items-end" : "items-start")}>
          {hasContent ? (
            rest
          ) : tooltip ? (
            <Tooltip content={tooltip}>
              <BubbleContent render={<button type="button" />}>{rest}</BubbleContent>
            </Tooltip>
          ) : (
            <BubbleContent>{rest}</BubbleContent>
          )}
          {reactions}
        </div>
        {showMeta && <BubbleMeta align={align} status={status} time={time} onRetry={onRetry} />}
      </div>
    </BubbleCtx.Provider>
  );
}

function BubbleMeta({ align, status, time, onRetry }: { align: "start" | "end"; status?: BubbleStatus; time?: ReactNode; onRetry?: () => void }) {
  if (status === "error")
    return (
      <div role="alert" className={cn("mt-1 flex items-center gap-1.5 text-[11.5px] text-rose", align === "end" && "flex-row-reverse")}>
        <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span>Não enviada</span>
        {onRetry && (
          <button type="button" onClick={onRetry} className="ds-hit inline-flex items-center gap-1 rounded font-medium underline-offset-2 hover:underline">
            <RotateCcw className="h-3 w-3" aria-hidden />
            Tentar de novo
          </button>
        )}
      </div>
    );
  const label = status === "sending" ? "Enviando" : status === "read" ? "Lida" : status === "sent" ? "Enviada" : undefined;
  return (
    <div className="mt-1 flex items-center gap-1 text-[11px] tabular-nums text-muted">
      {time && <span>{time}</span>}
      {status === "sending" && <Loader2 className="h-3 w-3 motion-safe:animate-spin" aria-hidden />}
      {status === "sent" && <Check className="h-3.5 w-3.5" aria-hidden />}
      {status === "read" && <CheckCheck className="h-3.5 w-3.5 text-blue" aria-hidden />}
      {label && <span className="sr-only">{label}</span>}
    </div>
  );
}

/**
 * O balão em si. Use quando precisar de controle: `render` troca o elemento
 * (um link ou botão que abre a mensagem) mantendo o visual.
 */
export function BubbleContent({
  children,
  render,
  className,
  ...rest
}: { children?: ReactNode; render?: ReactElement<{ className?: string; children?: ReactNode }>; className?: string } & Omit<HTMLAttributes<HTMLElement>, "children" | "className">) {
  const { variant, align, position, clamp } = useContext(BubbleCtx);
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = textRef.current;
    if (!clamp || !el) return;
    setOverflows(el.scrollHeight > el.clientHeight + 1);
  }, [clamp, children]);
  const cls = cn(
    "min-w-0 whitespace-pre-wrap break-words rounded-2xl text-[13.5px] leading-relaxed",
    variant !== "ghost" && "px-3.5 py-2.5",
    bubbleVariant[variant],
    variant !== "ghost" && corner(align, position),
    render && "text-left no-underline outline-none hover:brightness-[0.98] focus-visible:ring-2 focus-visible:ring-accent/40",
    className,
  );
  const body = clamp ? (
    <>
      <div ref={textRef} style={expanded ? undefined : { display: "-webkit-box", WebkitLineClamp: clamp, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
        {children}
      </div>
      {(overflows || expanded) && (
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((v) => !v)}
          className={cn("mt-1 text-[12.5px] font-medium underline-offset-2 hover:underline", variant === "default" ? "text-on-primary" : "text-ink")}
        >
          {expanded ? "Ver menos" : "Ver mais"}
        </button>
      )}
    </>
  ) : (
    children
  );
  if (render) return cloneElement(render, { ...rest, className: cn(cls, render.props.className), children: body });
  return (
    <div {...rest} className={cls}>
      {body}
    </div>
  );
}

/** Linha de reações sobreposta à borda do balão. Use com BubbleReaction. */
export function BubbleReactions({ children, side = "bottom", align, className }: { children: ReactNode; side?: "top" | "bottom"; align?: "start" | "end"; className?: string }) {
  const ctx = useContext(BubbleCtx);
  const a = align ?? (ctx.align === "end" ? "start" : "end");
  return (
    <div
      role="group"
      aria-label="Reações"
      className={cn(
        "relative z-[1] flex flex-wrap gap-1",
        side === "bottom" ? "-mt-2" : "order-first -mb-2",
        a === "end" ? "self-end pr-2" : "self-start pl-2",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Uma reação: emoji + contagem. `active` = você reagiu; clique alterna. */
export function BubbleReaction({ emoji, count, active, onToggle, label }: { emoji: string; count?: number; active?: boolean; onToggle?: () => void; /** "Gostei", "Concordo"… para leitor de tela. */ label: string }) {
  const text = `${label}${count ? `: ${count}` : ""}`;
  const cls = cn(
    "inline-flex h-6 items-center gap-1 rounded-full border px-1.5 text-[12px] leading-none tabular-nums shadow-surface",
    active ? "border-primary/40 bg-[color-mix(in_oklab,var(--ds-primary)_10%,var(--ds-surface))] text-ink" : "border-line bg-surface text-ink-soft",
  );
  const inner = (
    <>
      <span aria-hidden>{emoji}</span>
      {count != null && count > 0 && <span aria-hidden>{count}</span>}
    </>
  );
  return onToggle ? (
    <button type="button" aria-pressed={!!active} aria-label={text} title={label} onClick={onToggle} className={cn(cls, "hover:border-line-strong")}>
      {inner}
    </button>
  ) : (
    <span role="img" aria-label={text} title={label} className={cls}>
      {inner}
    </span>
  );
}

/**
 * Falas seguidas da mesma pessoa: espaço menor entre balões, cantos
 * encaixados, avatar e nome uma vez só. Os balões herdam `align` e `variant`.
 */
export function BubbleGroup({
  children,
  align = "start",
  variant,
  author,
  avatar,
  className,
}: {
  children: ReactNode;
  align?: "start" | "end";
  variant?: BubbleVariant;
  /** Nome exibido acima do primeiro balão (grupo com várias pessoas). */
  author?: ReactNode;
  /** Avatar ao lado do último balão. */
  avatar?: ReactNode;
  className?: string;
}) {
  const bubbles = Children.toArray(children).filter(isValidElement) as ReactElement<{ align?: "start" | "end"; variant?: BubbleVariant; position?: BubblePosition }>[];
  const n = bubbles.length;
  return (
    <div data-bubble-group="" className={cn("flex items-end gap-2", align === "end" && "flex-row-reverse", className)}>
      {avatar && <div className="mb-0.5 shrink-0">{avatar}</div>}
      <div className={cn("flex min-w-0 flex-1 flex-col gap-0.5", align === "end" ? "items-end" : "items-start")}>
        {author && <div className={cn("mb-0.5 px-1 text-[12px] font-medium text-ink-soft", align === "end" && "text-right")}>{author}</div>}
        {bubbles.map((b, i) =>
          cloneElement(b, {
            key: b.key ?? i,
            align: b.props.align ?? align,
            variant: b.props.variant ?? variant,
            position: n === 1 ? "single" : i === 0 ? "first" : i === n - 1 ? "last" : "middle",
          }),
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Marker                                                              */
/* ------------------------------------------------------------------ */

export type MarkerTone = "neutral" | "ok" | "warn" | "bad" | "info";
const markerTone: Record<MarkerTone, string> = {
  neutral: "text-muted",
  ok: "text-ok",
  warn: "text-amber",
  bad: "text-rose",
  info: "text-blue",
};

/**
 * Nota inline numa conversa: "Ana entrou na conversa", "Contexto trocado",
 * "Pensando…" (`shimmer`), separador rotulado ("Hoje", "Novas mensagens") ou
 * linha com borda. `render` troca o elemento raiz (link ou botão) mantendo o
 * visual. Para aviso com ação e fechar, use SystemMessage.
 *
 *   <Marker variant="separator">Hoje</Marker>
 *   <Marker tone="ok"><MarkerIcon><Check /></MarkerIcon><MarkerContent>Tarefa concluída</MarkerContent></Marker>
 */
export function Marker({
  children,
  variant = "default",
  tone = "neutral",
  shimmer = false,
  align = "center",
  render,
  className,
}: {
  children: ReactNode;
  /** `default` linha discreta · `border` linha com borda e fundo · `separator` texto entre traços. */
  variant?: "default" | "border" | "separator";
  tone?: MarkerTone;
  /** Brilho correndo no texto: algo está acontecendo agora ("Pensando…"). */
  shimmer?: boolean;
  align?: "start" | "center";
  render?: ReactElement<{ className?: string; children?: ReactNode }>;
  className?: string;
}) {
  const wrapped = Children.toArray(children).some((c) => isValidElement(c) && (c.type === MarkerContent || c.type === MarkerIcon)) ? children : <MarkerContent>{children}</MarkerContent>;
  const cls = cn(
    "flex min-w-0 items-center gap-2 text-[12px] leading-snug",
    markerTone[tone],
    align === "center" ? "justify-center text-center" : "justify-start",
    variant === "border" && "rounded-lg border border-line bg-soft/50 px-3 py-2",
    variant === "separator" && "w-full before:h-px before:min-w-4 before:flex-1 before:bg-line after:h-px after:min-w-4 after:flex-1 after:bg-line",
    render && "rounded-md no-underline outline-none hover:text-ink focus-visible:ring-2 focus-visible:ring-accent/40",
    className,
  );
  const content = <MarkerShimmer.Provider value={shimmer}>{wrapped}</MarkerShimmer.Provider>;
  if (render) return cloneElement(render, { className: cn(cls, render.props.className), children: content });
  return (
    <div role={variant === "separator" ? "separator" : "note"} aria-label={variant === "separator" && typeof children === "string" ? children : undefined} className={cls}>
      {content}
    </div>
  );
}

const MarkerShimmer = createContext(false);

/** Ícone decorativo do Marker (escondido do leitor de tela). */
export function MarkerIcon({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span aria-hidden className={cn("inline-flex shrink-0 items-center [&_svg]:h-3.5 [&_svg]:w-3.5", className)}>
      {children}
    </span>
  );
}

/** Texto do Marker. */
export function MarkerContent({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span data-marker-content="" className={cn("min-w-0", useContext(MarkerShimmer) && "ds-shimmer", className)}>
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* MessageScroller                                                     */
/* ------------------------------------------------------------------ */

type ScrollAlign = "start" | "end" | "center";

type ScrollerState = {
  viewport: RefObject<HTMLDivElement | null>;
  autoScroll: boolean;
  anchorNewTurns: boolean;
  peek: number;
  defaultScrollPosition: "start" | "end" | "last-anchor";
  atEnd: boolean;
  atStart: boolean;
  unread: number;
  autoscrolling: boolean;
  visibleMessageIds: string[];
  currentAnchorId: string | null;
  setEdges: (start: boolean, end: boolean) => void;
  setUnread: (fn: (n: number) => number) => void;
  setAutoscrolling: (v: boolean) => void;
  setVisibility: (visible: string[], anchor: string | null) => void;
  pinned: MutableRefObject<boolean>;
  scrollToMessage: (id: string, opts?: { align?: ScrollAlign; behavior?: ScrollBehavior }) => void;
  scrollToEnd: (opts?: { behavior?: ScrollBehavior }) => void;
  scrollToStart: (opts?: { behavior?: ScrollBehavior }) => void;
};

const ScrollerCtx = createContext<ScrollerState | null>(null);

function useScroller(name: string) {
  const ctx = useContext(ScrollerCtx);
  if (!ctx) throw new Error(`${name} precisa estar dentro de MessageScrollerProvider.`);
  return ctx;
}

const reducedMotion = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * Estado compartilhado da rolagem de uma conversa. Envolva o MessageScroller
 * e quem precisar dos ganchos (sumário da conversa, botão no cabeçalho).
 *
 *   <MessageScrollerProvider>
 *     <MessageScroller label="Conversa com Ana">
 *       <MessageScrollerViewport>
 *         <MessageScrollerContent>
 *           {msgs.map((m) => <MessageScrollerItem key={m.id} messageId={m.id} scrollAnchor={m.role === "user"}>…</MessageScrollerItem>)}
 *         </MessageScrollerContent>
 *       </MessageScrollerViewport>
 *       <MessageScrollerButton />
 *     </MessageScroller>
 *   </MessageScrollerProvider>
 */
export function MessageScrollerProvider({
  children,
  autoScroll = true,
  anchorNewTurns = true,
  defaultScrollPosition = "end",
  scrollPreviousItemPeek = 0,
}: {
  children: ReactNode;
  /** Acompanha o fim enquanto a pessoa está nele (resposta em streaming). Se ela subir para ler, não puxa. */
  autoScroll?: boolean;
  /** Turno novo marcado com `scrollAnchor` sobe para o topo e a resposta cresce embaixo dele. */
  anchorNewTurns?: boolean;
  /** Onde abre: no fim (padrão), no começo ou no último turno marcado. */
  defaultScrollPosition?: "start" | "end" | "last-anchor";
  /** Ao ancorar um turno no topo, deixa N px do item anterior à vista (contexto). */
  scrollPreviousItemPeek?: number;
}) {
  const viewport = useRef<HTMLDivElement | null>(null);
  const pinned = useRef(true);
  const [edges, setEdgesState] = useState({ start: true, end: true });
  const [unread, setUnreadState] = useState(0);
  const [autoscrolling, setAutoscrolling] = useState(false);
  const [vis, setVis] = useState<{ visible: string[]; anchor: string | null }>({ visible: [], anchor: null });

  const scrollTo = useCallback((top: number, behavior?: ScrollBehavior) => {
    const el = viewport.current;
    if (!el) return;
    setAutoscrolling(true);
    el.scrollTo({ top, behavior: behavior ?? (reducedMotion() ? "auto" : "smooth") });
    window.setTimeout(() => setAutoscrolling(false), behavior === "auto" ? 0 : 400);
  }, []);

  const scrollToEnd = useCallback(
    (opts?: { behavior?: ScrollBehavior }) => {
      const el = viewport.current;
      if (!el) return;
      pinned.current = true;
      setUnreadState(0);
      scrollTo(el.scrollHeight, opts?.behavior);
    },
    [scrollTo],
  );
  const scrollToStart = useCallback((opts?: { behavior?: ScrollBehavior }) => scrollTo(0, opts?.behavior), [scrollTo]);
  const scrollToMessage = useCallback(
    (id: string, opts?: { align?: ScrollAlign; behavior?: ScrollBehavior }) => {
      const el = viewport.current;
      const item = el?.querySelector<HTMLElement>(`[data-message-id="${CSS.escape(id)}"]`);
      if (!el || !item) return;
      const top = item.getBoundingClientRect().top - el.getBoundingClientRect().top + el.scrollTop;
      const align = opts?.align ?? "start";
      const target = align === "start" ? top - scrollPreviousItemPeek : align === "end" ? top + item.offsetHeight - el.clientHeight : top - (el.clientHeight - item.offsetHeight) / 2;
      pinned.current = false;
      scrollTo(Math.max(0, target), opts?.behavior);
    },
    [scrollTo, scrollPreviousItemPeek],
  );

  const value = useMemo<ScrollerState>(
    () => ({
      viewport,
      autoScroll,
      anchorNewTurns,
      peek: scrollPreviousItemPeek,
      defaultScrollPosition,
      atEnd: edges.end,
      atStart: edges.start,
      unread,
      autoscrolling,
      visibleMessageIds: vis.visible,
      currentAnchorId: vis.anchor,
      setEdges: (start, end) => setEdgesState((s) => (s.start === start && s.end === end ? s : { start, end })),
      setUnread: (fn) => setUnreadState(fn),
      setAutoscrolling,
      setVisibility: (visible, anchor) =>
        setVis((s) => (s.anchor === anchor && s.visible.length === visible.length && s.visible.every((v, i) => v === visible[i]) ? s : { visible, anchor })),
      pinned,
      scrollToMessage,
      scrollToEnd,
      scrollToStart,
    }),
    [autoScroll, anchorNewTurns, scrollPreviousItemPeek, defaultScrollPosition, edges, unread, autoscrolling, vis, scrollToMessage, scrollToEnd, scrollToStart],
  );
  return <ScrollerCtx.Provider value={value}>{children}</ScrollerCtx.Provider>;
}

/** Ações de rolagem: `scrollToMessage(id)`, `scrollToEnd()`, `scrollToStart()` e o estado (`atEnd`, `unread`). */
export function useMessageScroller() {
  const s = useScroller("useMessageScroller");
  return { scrollToMessage: s.scrollToMessage, scrollToEnd: s.scrollToEnd, scrollToStart: s.scrollToStart, isAtEnd: s.atEnd, isAtStart: s.atStart, unread: s.unread };
}

/** O que está à vista: ids visíveis e o turno atual (último `scrollAnchor` que passou do topo). */
export function useMessageScrollerVisibility() {
  const s = useScroller("useMessageScrollerVisibility");
  return { currentAnchorId: s.currentAnchorId, visibleMessageIds: s.visibleMessageIds };
}

/** Se ainda dá para rolar para o começo (`start`) ou para o fim (`end`). */
export function useMessageScrollerScrollable() {
  const s = useScroller("useMessageScrollerScrollable");
  return { start: !s.atStart, end: !s.atEnd };
}

/** Moldura da conversa: posiciona o botão "Ir para o fim" sobre a rolagem. */
export function MessageScroller({ children, label, className }: { children: ReactNode; /** "Conversa com Ana Lopes". */ label: string; className?: string }) {
  const s = useScroller("MessageScroller");
  const scrollable = !s.atStart && !s.atEnd ? "both" : !s.atStart ? "start" : !s.atEnd ? "end" : undefined;
  return (
    <section aria-label={label} data-scrollable={scrollable} className={cn("relative flex min-h-0 flex-1 flex-col", className)}>
      {children}
    </section>
  );
}

/**
 * Área que rola. `preserveScrollOnPrepend` mantém a mensagem que a pessoa
 * está lendo no lugar quando mensagens antigas entram no topo.
 */
export function MessageScrollerViewport({
  children,
  preserveScrollOnPrepend = true,
  onReachStart,
  className,
  ...rest
}: {
  children: ReactNode;
  preserveScrollOnPrepend?: boolean;
  /** Chegou ao topo: carregue o histórico anterior. */
  onReachStart?: () => void;
  className?: string;
} & Omit<HTMLAttributes<HTMLDivElement>, "children" | "className" | "onScroll">) {
  const s = useScroller("MessageScrollerViewport");
  const [pending, setPending] = useState(true);
  const reachStart = useRef(onReachStart);
  reachStart.current = onReachStart;
  const opened = useRef(false);
  const { viewport, setEdges, pinned, setUnread, defaultScrollPosition, peek } = s;

  // Posição de abertura (uma vez, antes de pintar).
  useLayoutEffect(() => {
    const el = viewport.current;
    if (!el || opened.current) return;
    opened.current = true;
    if (defaultScrollPosition === "start") {
      el.scrollTop = 0;
      pinned.current = false;
    } else if (defaultScrollPosition === "last-anchor") {
      const anchors = el.querySelectorAll<HTMLElement>("[data-scroll-anchor]");
      const last = anchors[anchors.length - 1];
      if (last) {
        el.scrollTop = Math.max(0, last.getBoundingClientRect().top - el.getBoundingClientRect().top + el.scrollTop - peek);
        pinned.current = false;
      } else el.scrollTop = el.scrollHeight;
    } else el.scrollTop = el.scrollHeight;
    setPending(false);
  }, [viewport, defaultScrollPosition, pinned, peek]);

  const update = useCallback(() => {
    const el = viewport.current;
    if (!el) return;
    const atEnd = el.scrollHeight - el.scrollTop - el.clientHeight < 48;
    const atStart = el.scrollTop < 8;
    setEdges(atStart, atEnd);
    if (atEnd) {
      pinned.current = true;
      setUnread(() => 0);
    } else pinned.current = false;
    if (atStart && el.scrollHeight > el.clientHeight) reachStart.current?.();
  }, [viewport, setEdges, pinned, setUnread]);

  useEffect(() => {
    const el = viewport.current;
    if (!el) return;
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [viewport, update]);

  return (
    <div
      {...rest}
      ref={viewport}
      role="log"
      aria-live="polite"
      aria-relevant="additions"
      // A área rola pelo teclado (↑ ↓ PgUp PgDn) quando focada.
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
      tabIndex={0}
      data-pending-scroll={pending ? "" : undefined}
      data-autoscrolling={s.autoscrolling ? "" : undefined}
      data-preserve-scroll={preserveScrollOnPrepend ? "" : undefined}
      onScroll={update}
      className={cn("min-h-0 flex-1 overflow-y-auto overscroll-contain outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent/30", className)}
    >
      {children}
    </div>
  );
}

/**
 * Lista das mensagens. Acompanha o fim, ancora turnos novos e compensa a
 * rolagem quando itens entram no topo.
 */
export function MessageScrollerContent({ children, className }: { children: ReactNode; className?: string }) {
  const s = useScroller("MessageScrollerContent");
  const ref = useRef<HTMLDivElement>(null);
  const prev = useRef<{ first: string | null; last: string | null; height: number; count: number }>({ first: null, last: null, height: 0, count: 0 });
  const { viewport, autoScroll, anchorNewTurns, pinned, setUnread, scrollToMessage, setVisibility, peek } = s;

  // Espaço no fim para o último turno conseguir subir até o topo enquanto a resposta ainda é curta.
  const applySpacer = useCallback(() => {
    const el = viewport.current;
    const list = ref.current;
    if (!el || !list) return;
    let pad = 16;
    if (anchorNewTurns) {
      const anchors = list.querySelectorAll<HTMLElement>("[data-scroll-anchor]");
      const lastAnchor = anchors[anchors.length - 1];
      const items = list.querySelectorAll<HTMLElement>("[data-message-id]");
      const lastItem = items[items.length - 1];
      if (lastAnchor && lastItem) {
        const below = lastItem.getBoundingClientRect().bottom - lastAnchor.getBoundingClientRect().top;
        pad = Math.max(16, Math.round(el.clientHeight - below - peek - 16));
      }
    }
    if (Math.abs((parseFloat(list.style.paddingBottom) || 0) - pad) > 1) list.style.paddingBottom = `${pad}px`;
  }, [viewport, anchorNewTurns, peek]);

  // Entrou mensagem: no topo (histórico) compensa; no fim acompanha, ancora ou conta como nova.
  useLayoutEffect(() => {
    const el = viewport.current;
    const list = ref.current;
    if (!el || !list) return;
    const items = list.querySelectorAll<HTMLElement>("[data-message-id]");
    const first = items[0]?.dataset.messageId ?? null;
    const lastEl = items[items.length - 1];
    const last = lastEl?.dataset.messageId ?? null;
    applySpacer();
    const p = prev.current;
    if (p.count && first !== p.first && last === p.last && el.hasAttribute("data-preserve-scroll")) {
      el.scrollTop += el.scrollHeight - p.height;
    } else if (p.count && last !== p.last && items.length > p.count) {
      if (anchorNewTurns && lastEl?.hasAttribute("data-scroll-anchor")) scrollToMessage(last!, { align: "start" });
      else if (autoScroll && pinned.current) el.scrollTop = el.scrollHeight;
      else if (!pinned.current) setUnread((n) => n + (items.length - p.count));
    }
    prev.current = { first, last, height: el.scrollHeight, count: items.length };
  });

  // Conteúdo cresceu sem item novo (streaming de tokens): segue o fim se estava nele.
  useEffect(() => {
    const el = viewport.current;
    const list = ref.current;
    if (!el || !list) return;
    const ro = new ResizeObserver(() => {
      applySpacer();
      if (autoScroll && pinned.current) el.scrollTop = el.scrollHeight;
      prev.current.height = el.scrollHeight;
    });
    ro.observe(list);
    ro.observe(el);
    return () => ro.disconnect();
  }, [viewport, autoScroll, pinned, applySpacer]);

  // Visibilidade: ids à vista e turno atual.
  useEffect(() => {
    const el = viewport.current;
    const list = ref.current;
    if (!el || !list) return;
    const compute = () => {
      const box = el.getBoundingClientRect();
      const visible: string[] = [];
      let anchor: string | null = null;
      list.querySelectorAll<HTMLElement>("[data-message-id]").forEach((it) => {
        const r = it.getBoundingClientRect();
        if (r.bottom > box.top && r.top < box.bottom) visible.push(it.dataset.messageId!);
        if (it.hasAttribute("data-scroll-anchor") && r.top <= box.top + box.height * 0.4) anchor = it.dataset.messageId!;
      });
      if (!anchor) anchor = list.querySelector<HTMLElement>("[data-scroll-anchor]")?.dataset.messageId ?? null;
      setVisibility(visible, anchor);
    };
    compute();
    el.addEventListener("scroll", compute, { passive: true });
    const ro = new ResizeObserver(compute);
    ro.observe(list);
    return () => {
      el.removeEventListener("scroll", compute);
      ro.disconnect();
    };
  }, [viewport, setVisibility]);

  return (
    <div ref={ref} className={cn("flex flex-col gap-4 px-4 py-4", className)}>
      {children}
    </div>
  );
}

/** Uma linha da conversa. `scrollAnchor` marca o começo de um turno (a pergunta da pessoa). */
export function MessageScrollerItem({ messageId, scrollAnchor, children, className }: { messageId: string; scrollAnchor?: boolean; children: ReactNode; className?: string }) {
  return (
    <div data-message-id={messageId} data-scroll-anchor={scrollAnchor ? "" : undefined} className={cn("min-w-0 scroll-mt-4", className)}>
      {children}
    </div>
  );
}

/**
 * Botão flutuante "Ir para o fim": aparece quando a pessoa sobe para ler e
 * mostra quantas mensagens chegaram enquanto isso. `direction="start"` volta ao topo.
 */
export function MessageScrollerButton({ direction = "end", children, className }: { direction?: "start" | "end"; children?: ReactNode; className?: string }) {
  const s = useScroller("MessageScrollerButton");
  const show = direction === "end" ? !s.atEnd : !s.atStart;
  const label = children ?? (direction === "end" ? (s.unread > 0 ? `${s.unread} ${s.unread === 1 ? "mensagem nova" : "mensagens novas"}` : "Ir para o fim") : "Ir para o começo");
  return (
    <div className={cn("pointer-events-none absolute inset-x-0 flex justify-center", direction === "end" ? "bottom-3" : "top-3")}>
      <button
        type="button"
        tabIndex={show ? 0 : -1}
        aria-hidden={!show}
        onClick={() => (direction === "end" ? s.scrollToEnd() : s.scrollToStart())}
        className={cn(
          "inline-flex h-8 items-center gap-1.5 rounded-full border border-line bg-popover px-3 text-[12.5px] font-medium text-ink shadow-raised transition-[opacity,transform] duration-150 hover:bg-soft focus-visible:ring-2 focus-visible:ring-accent/40",
          show ? "pointer-events-auto translate-y-0 opacity-100" : "translate-y-1 opacity-0",
          s.unread > 0 && direction === "end" && "border-primary/30",
          className,
        )}
      >
        <ArrowDown className={cn("h-3.5 w-3.5", direction === "start" && "rotate-180")} aria-hidden />
        {label}
      </button>
    </div>
  );
}
