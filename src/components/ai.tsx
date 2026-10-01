"use client";

import {
  AlertTriangle,
  ArrowUp,
  Brain,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleDashed,
  Copy,
  FileText,
  Globe,
  Info,
  Loader2,
  Paperclip,
  RotateCcw,
  Search,
  Sparkles,
  Square,
  ThumbsDown,
  ThumbsUp,
  Wrench,
  X,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "../lib/cn";
import { formatNumber } from "../lib/format";

/*
 * Padrões de IA (docs/padroes/ia.md). Regras que valem para todos:
 *   · mostre o que o agente fez: ferramentas, fontes, passos (AgentTrace, ToolCallsSection)
 *   · cite a origem de todo fato que veio de dado do cliente (CitationChip, SourceList)
 *   · o usuário sempre pode parar, tentar de novo e corrigir (ChatComposer onStop, ChatMessage onRetry)
 *   · IA nunca bloqueia a tela: resposta aparece em painel, não em modal que prende
 *   · limites e erros explicam o motivo e o próximo passo (SystemMessage, RateLimitNotice)
 *   · movimento contido e desligado com prefers-reduced-motion
 */

/* ------------------------------------------------------------------ */
/* Utilidades                                                          */
/* ------------------------------------------------------------------ */

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setReduced(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

/** Duração legível: 820 ms, 3,4 s, 1 min 12 s. */
export function formatDuration(ms: number) {
  if (ms < 1000) return `${Math.round(ms)} ms`;
  if (ms < 60000) return `${formatNumber(ms / 1000, 1)} s`;
  const m = Math.floor(ms / 60000);
  const s = Math.round((ms % 60000) / 1000);
  return s ? `${m} min ${s} s` : `${m} min`;
}

/**
 * Simula streaming de texto (demos e protótipos). Em produção, renderize o
 * texto que chega do servidor e passe `streaming` ao ChatMessage.
 */
export function useStreamingText(text: string, { active = true, charsPerTick = 3, interval = 24 } = {}) {
  const reduced = useReducedMotion();
  const [n, setN] = useState(active ? 0 : text.length);
  useEffect(() => {
    if (!active || reduced) {
      setN(text.length);
      return;
    }
    setN(0);
    const id = window.setInterval(() => {
      setN((v) => {
        if (v >= text.length) {
          window.clearInterval(id);
          return v;
        }
        return Math.min(text.length, v + charsPerTick);
      });
    }, interval);
    return () => window.clearInterval(id);
  }, [text, active, reduced, charsPerTick, interval]);
  return { text: text.slice(0, n), done: n >= text.length };
}

/* ------------------------------------------------------------------ */
/* Selos e indicadores                                                 */
/* ------------------------------------------------------------------ */

/** Marca "gerado por IA". Use ao lado de conteúdo que a IA escreveu ou resumiu. */
export function AiBadge({ label = "IA", className }: { label?: string; className?: string }) {
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-1 rounded-md bg-accent-soft px-1.5 py-0.5 text-[11px] font-medium leading-4 text-accent-deep ring-1 ring-accent/25", className)}>
      <Sparkles className="h-3 w-3" aria-hidden />
      {label}
    </span>
  );
}

/** Marca do assistente (avatar redondo com brilho). */
export function AiMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-grid shrink-0 place-items-center rounded-full bg-primary text-on-primary", className)}
      style={{ width: size, height: size }}
    >
      <Sparkles style={{ width: size * 0.5, height: size * 0.5 }} strokeWidth={1.8} />
    </span>
  );
}

/** "Pensando…" com três pontos. Mostre o tempo decorrido acima de ~3 s. */
export function ThinkingIndicator({ label = "Pensando", startedAt, className }: { label?: string; startedAt?: number; className?: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!startedAt) return;
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(id);
  }, [startedAt]);
  const elapsed = startedAt ? now - startedAt : 0;
  return (
    <span role="status" aria-live="polite" className={cn("inline-flex items-center gap-2 text-[13px] text-muted", className)}>
      <span className="inline-flex items-center gap-1" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span key={i} className="h-1.5 w-1.5 rounded-full bg-line-strong motion-safe:animate-pulse" style={{ animationDelay: `${i * 160}ms` }} />
        ))}
      </span>
      {label}…
      {elapsed > 3000 && <span className="tabular-nums text-muted">{formatDuration(elapsed)}</span>}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Citações e fontes                                                   */
/* ------------------------------------------------------------------ */

export type AiSource = { id: string; title: string; href?: string; kind?: "web" | "doc" | "record" | "data"; domain?: string; snippet?: ReactNode };

const sourceIcon: Record<NonNullable<AiSource["kind"]>, LucideIcon> = { web: Globe, doc: FileText, record: Search, data: Brain };

/** Número de citação dentro do texto: “… 18 % [2]”. Hover mostra a fonte. */
export function CitationChip({ index, source, onClick }: { index: number; source?: AiSource; onClick?: () => void }) {
  const cls =
    "ds-hit mx-0.5 inline-flex h-4 min-w-4 -translate-y-px items-center justify-center rounded bg-soft px-1 align-middle text-[10.5px] font-medium tabular-nums text-ink-soft ring-1 ring-line hover:bg-line hover:text-ink";
  const label = source ? `Fonte ${index}: ${source.title}` : `Fonte ${index}`;
  if (source?.href)
    return (
      <a href={source.href} target="_blank" rel="noreferrer" className={cls} title={label} aria-label={label}>
        {index}
      </a>
    );
  return (
    <button type="button" className={cls} title={label} aria-label={label} onClick={onClick}>
      {index}
    </button>
  );
}

/** Lista de fontes abaixo de uma resposta. Numeração bate com os CitationChip. */
export function SourceList({ sources, title = "Fontes", compact = false, className }: { sources: AiSource[]; title?: string; compact?: boolean; className?: string }) {
  if (!sources.length) return null;
  return (
    <div className={cn("min-w-0", className)}>
      <p className="m-0 mb-2 text-[11px] font-medium uppercase tracking-[0.08em] text-muted">{title}</p>
      <ol className={cn("list-none p-0", compact ? "flex flex-wrap gap-1.5" : "grid gap-2 sm:grid-cols-2")}>
        {sources.map((s, i) => {
          const Icon = sourceIcon[s.kind ?? "doc"];
          const body = compact ? (
            <>
              <span className="text-[10.5px] font-medium tabular-nums text-muted">{i + 1}</span>
              <Icon className="h-3 w-3 text-muted" aria-hidden />
              <span className="max-w-[180px] truncate">{s.title}</span>
            </>
          ) : (
            <>
              <span className="flex items-center gap-1.5 text-[11px] text-muted">
                <span className="inline-grid h-4 min-w-4 place-items-center rounded bg-soft px-1 font-medium tabular-nums ring-1 ring-line">{i + 1}</span>
                <Icon className="h-3 w-3" aria-hidden />
                <span className="truncate">{s.domain ?? (s.kind === "record" ? "Registro" : s.kind === "data" ? "Dados" : "Documento")}</span>
              </span>
              <span className="mt-1 block truncate text-[12.5px] font-medium text-ink">{s.title}</span>
              {s.snippet && <span className="mt-0.5 line-clamp-2 block text-[12px] leading-relaxed text-muted">{s.snippet}</span>}
            </>
          );
          const cls = compact
            ? "inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-2 py-1 text-[12px] text-ink-soft hover:border-line-strong"
            : "block rounded-lg border border-line bg-surface px-3 py-2 hover:border-line-strong";
          return (
            <li key={s.id} className="min-w-0">
              {s.href ? (
                <a href={s.href} target="_blank" rel="noreferrer" className={cls}>
                  {body}
                </a>
              ) : (
                <div className={cls}>{body}</div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* SystemMessage                                                       */
/* ------------------------------------------------------------------ */

const systemTone = {
  info: { icon: Info, cls: "border-line bg-soft text-ink-soft", iconCls: "text-blue" },
  warn: { icon: AlertTriangle, cls: "border-amber/25 bg-amber-soft/60 text-ink-soft", iconCls: "text-amber" },
  error: { icon: XCircle, cls: "border-rose/25 bg-rose-soft/60 text-ink-soft", iconCls: "text-rose" },
  success: { icon: CheckCircle2, cls: "border-ok/25 bg-ok-soft/60 text-ink-soft", iconCls: "text-ok" },
} as const;

/**
 * Aviso do sistema dentro de uma conversa ou painel de IA (contexto trocado,
 * ferramenta indisponível, resposta interrompida). Não é fala do assistente.
 */
export function SystemMessage({
  tone = "info",
  title,
  children,
  action,
  onDismiss,
  className,
}: {
  tone?: keyof typeof systemTone;
  title?: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  onDismiss?: () => void;
  className?: string;
}) {
  const t = systemTone[tone];
  const Icon = t.icon;
  return (
    <div role={tone === "error" ? "alert" : "status"} className={cn("flex items-start gap-2.5 rounded-lg border px-3 py-2.5 text-[12.5px] leading-relaxed", t.cls, className)}>
      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", t.iconCls)} aria-hidden />
      <div className="min-w-0 flex-1">
        {title && <p className="m-0 font-medium text-ink">{title}</p>}
        {children && <div className={title ? "mt-0.5" : undefined}>{children}</div>}
      </div>
      {action && <div className="shrink-0 self-center">{action}</div>}
      {onDismiss && (
        <button type="button" onClick={onDismiss} aria-label="Dispensar aviso" className="-mr-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted hover:bg-ink/5 hover:text-ink">
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* ChatMessage                                                         */
/* ------------------------------------------------------------------ */

export type ChatRole = "user" | "assistant";

/**
 * Uma fala. Usuário: balão gelo à direita. Assistente: texto corrido à
 * esquerda com a marca, ações (copiar, refazer, avaliar) depois de terminar.
 * `children` recebe blocos extras: ToolCallsSection, SourceList, cards.
 */
export function ChatMessage({
  role,
  content,
  author,
  time,
  streaming = false,
  children,
  onRetry,
  onFeedback,
  copyText,
  className,
}: {
  role: ChatRole;
  content?: ReactNode;
  author?: { name: string; initials?: string };
  time?: string;
  streaming?: boolean;
  children?: ReactNode;
  onRetry?: () => void;
  onFeedback?: (value: "up" | "down") => void;
  /** Texto copiado pelo botão Copiar (padrão: content se for string). */
  copyText?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [vote, setVote] = useState<"up" | "down" | null>(null);
  const text = copyText ?? (typeof content === "string" ? content : undefined);
  if (role === "user")
    return (
      <div className={cn("flex justify-end", className)}>
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-soft px-3.5 py-2.5 text-[13.5px] leading-relaxed text-ink ring-1 ring-line">
          {content}
          {time && <div className="mt-1 text-right text-[10.5px] text-muted">{time}</div>}
        </div>
      </div>
    );
  const action = "inline-flex h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-soft hover:text-ink aria-pressed:text-ink";
  return (
    <div className={cn("flex gap-3", className)}>
      <AiMark size={26} className="mt-0.5" />
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2 text-[12px] text-muted">
          <span className="font-medium text-ink">{author?.name ?? "Assistente"}</span>
          {time && <span>{time}</span>}
        </div>
        {content != null && (
          <div className="text-[13.5px] leading-[1.65] text-ink [&_p]:m-0 [&_p+p]:mt-2 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:my-0.5 [&_strong]:font-semibold">
            {content}
            {streaming && <span aria-hidden className="ml-0.5 inline-block h-3.5 w-[7px] translate-y-0.5 rounded-[1px] bg-ink/70 motion-safe:animate-pulse" />}
          </div>
        )}
        {children && <div className="mt-3 space-y-3">{children}</div>}
        {!streaming && (text || onRetry || onFeedback) && (
          <div className="mt-2 flex items-center gap-0.5">
            {text && (
              <button
                type="button"
                className={action}
                aria-label={copied ? "Copiado" : "Copiar resposta"}
                title={copied ? "Copiado" : "Copiar"}
                onClick={() => {
                  navigator.clipboard?.writeText(text);
                  setCopied(true);
                  window.setTimeout(() => setCopied(false), 1400);
                }}
              >
                {copied ? <Check className="h-3.5 w-3.5 text-ok" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            )}
            {onRetry && (
              <button type="button" className={action} aria-label="Gerar de novo" title="Gerar de novo" onClick={onRetry}>
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            )}
            {onFeedback && (
              <>
                <button type="button" className={action} aria-label="Resposta útil" aria-pressed={vote === "up"} title="Útil" onClick={() => { setVote("up"); onFeedback("up"); }}>
                  <ThumbsUp className={cn("h-3.5 w-3.5", vote === "up" && "fill-current")} />
                </button>
                <button type="button" className={action} aria-label="Resposta ruim" aria-pressed={vote === "down"} title="Não ajudou" onClick={() => { setVote("down"); onFeedback("down"); }}>
                  <ThumbsDown className={cn("h-3.5 w-3.5", vote === "down" && "fill-current")} />
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Coluna de mensagens com rolagem própria que acompanha o fim enquanto o
 * usuário está no fim (não “puxa” se ele subiu para ler).
 */
export function ChatThread({ children, className, follow }: { children: ReactNode; className?: string; /** Muda a cada token novo para acompanhar. */ follow?: unknown }) {
  const ref = useRef<HTMLDivElement>(null);
  const pinned = useRef(true);
  useEffect(() => {
    const el = ref.current;
    if (el && pinned.current) el.scrollTop = el.scrollHeight;
  }, [follow, children]);
  return (
    <div
      ref={ref}
      role="log"
      aria-live="polite"
      aria-relevant="additions"
      onScroll={(e) => {
        const el = e.currentTarget;
        pinned.current = el.scrollHeight - el.scrollTop - el.clientHeight < 48;
      }}
      className={cn("min-h-0 flex-1 overflow-y-auto", className)}
    >
      <div className="space-y-6">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* PromptSuggestions                                                   */
/* ------------------------------------------------------------------ */

export type PromptSuggestion = { id: string; label: string; description?: string; icon?: ReactNode; prompt?: string };

/** Sugestões de pergunta para o estado vazio do assistente. 2–6 itens. */
export function PromptSuggestions({ items, onSelect, columns = 2, className }: { items: PromptSuggestion[]; onSelect: (item: PromptSuggestion) => void; columns?: 1 | 2; className?: string }) {
  return (
    <div className={cn("grid gap-2", columns === 2 && "sm:grid-cols-2", className)}>
      {items.map((it) => (
        <button
          key={it.id}
          type="button"
          onClick={() => onSelect(it)}
          className="surface-interactive flex items-start gap-2.5 rounded-xl border border-line bg-surface px-3 py-2.5 text-left hover:border-line-strong hover:bg-soft/50"
        >
          <span className="mt-0.5 shrink-0 text-muted [&_svg]:h-4 [&_svg]:w-4">{it.icon ?? <Sparkles aria-hidden />}</span>
          <span className="min-w-0">
            <span className="block text-[13px] font-medium leading-snug text-ink">{it.label}</span>
            {it.description && <span className="mt-0.5 block text-[12px] leading-snug text-muted">{it.description}</span>}
          </span>
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* ChatComposer                                                        */
/* ------------------------------------------------------------------ */

export type ComposerAttachment = { id: string; name: string; size?: string };

/**
 * Campo de pergunta. Enter envia, Shift+Enter quebra linha. Durante a
 * resposta o botão vira Parar. Chips de modelo/fonte e anexos opcionais.
 */
export function ChatComposer({
  value,
  onChange,
  onSubmit,
  onStop,
  busy = false,
  placeholder = "Pergunte qualquer coisa…",
  attachments,
  onRemoveAttachment,
  onAttach,
  chips,
  hint = "Enter envia · Shift+Enter quebra linha",
  disabled,
  autoFocus,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  onStop?: () => void;
  busy?: boolean;
  placeholder?: string;
  attachments?: ComposerAttachment[];
  onRemoveAttachment?: (id: string) => void;
  onAttach?: () => void;
  /** Chips à esquerda do rodapé: modelo, fontes, contexto. */
  chips?: ReactNode;
  hint?: ReactNode;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(200, el.scrollHeight)}px`;
  }, [value]);
  const send = () => {
    const v = value.trim();
    if (!v || busy || disabled) return;
    onSubmit(v);
  };
  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send();
    }
  };
  return (
    <div className={cn("min-w-0", className)}>
      <div className="focus-field rounded-2xl border border-line bg-surface shadow-surface transition-colors">
        {attachments && attachments.length > 0 && (
          <div className="flex flex-wrap gap-1.5 px-3 pt-3">
            {attachments.map((a) => (
              <span key={a.id} className="inline-flex max-w-[220px] items-center gap-1.5 rounded-lg border border-line bg-soft px-2 py-1 text-[12px] text-ink-soft">
                <FileText className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden />
                <span className="truncate">{a.name}</span>
                {a.size && <span className="shrink-0 text-muted">{a.size}</span>}
                {onRemoveAttachment && (
                  <button type="button" aria-label={`Remover ${a.name}`} onClick={() => onRemoveAttachment(a.id)} className="-mr-1 rounded p-0.5 text-muted hover:bg-line hover:text-ink">
                    <X className="h-3 w-3" />
                  </button>
                )}
              </span>
            ))}
          </div>
        )}
        <textarea
          ref={ref}
          rows={1}
          value={value}
          autoFocus={autoFocus}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKey}
          placeholder={placeholder}
          aria-label={placeholder}
          className="block max-h-[200px] min-h-[52px] w-full resize-none border-0 bg-transparent px-4 pb-1 pt-3.5 text-[14px] leading-relaxed text-ink outline-none placeholder:text-muted disabled:opacity-50"
        />
        <div className="flex items-center gap-1.5 px-2.5 pb-2.5">
          {onAttach && (
            <button type="button" onClick={onAttach} aria-label="Anexar arquivo" title="Anexar arquivo" className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-soft hover:text-ink">
              <Paperclip className="h-4 w-4" />
            </button>
          )}
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">{chips}</div>
          {busy && onStop ? (
            <button type="button" onClick={onStop} aria-label="Parar resposta" title="Parar" className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-on-primary hover:bg-primary/90">
              <Square className="h-3 w-3 fill-current" />
            </button>
          ) : (
            <button
              type="button"
              onClick={send}
              disabled={!value.trim() || disabled}
              aria-label="Enviar"
              title="Enviar"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-on-primary hover:bg-primary/90 disabled:opacity-30"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      {hint && <p className="m-0 mt-1.5 px-1 text-[11px] text-muted">{hint}</p>}
    </div>
  );
}

/** Chip do rodapé do composer (modelo, fonte, contexto). Clicável se tiver onClick. */
export function ComposerChip({ icon, children, onClick, onRemove, active }: { icon?: ReactNode; children: ReactNode; onClick?: () => void; onRemove?: () => void; active?: boolean }) {
  const cls = cn(
    "inline-flex h-7 max-w-[200px] items-center gap-1.5 whitespace-nowrap rounded-lg px-2 text-[12px] [&_svg]:h-3.5 [&_svg]:w-3.5 [&_svg]:shrink-0",
    active ? "bg-ink/[0.08] text-ink" : "bg-soft text-ink-soft",
    onClick && "hover:bg-ink/[0.08] hover:text-ink",
    onRemove && "pr-6",
  );
  const inner = (
    <>
      {icon}
      <span className="truncate">{children}</span>
      {onClick && !onRemove && <ChevronDown className="text-muted" aria-hidden />}
    </>
  );
  return (
    <span className="inline-flex items-center">
      {onClick ? (
        <button type="button" className={cls} onClick={onClick}>
          {inner}
        </button>
      ) : (
        <span className={cls}>{inner}</span>
      )}
      {onRemove && (
        <button type="button" onClick={onRemove} aria-label="Remover" className="-ml-6 mr-1 rounded p-0.5 text-muted hover:text-ink">
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Tool calls                                                          */
/* ------------------------------------------------------------------ */

export type ToolCallStatus = "running" | "success" | "error" | "queued";
export type ToolCall = {
  id: string;
  /** Nome técnico: crm.buscar_negocios */
  name: string;
  /** Rótulo humano: "Buscou negócios no CRM" */
  label?: string;
  icon?: ReactNode;
  status: ToolCallStatus;
  durationMs?: number;
  input?: unknown;
  output?: unknown;
  error?: string;
};

const statusMeta: Record<ToolCallStatus, { label: string; icon: ReactNode; cls: string }> = {
  queued: { label: "Na fila", icon: <CircleDashed className="h-3.5 w-3.5" />, cls: "text-muted" },
  running: { label: "Executando", icon: <Loader2 className="h-3.5 w-3.5 motion-safe:animate-spin" />, cls: "text-blue" },
  success: { label: "Concluída", icon: <CheckCircle2 className="h-3.5 w-3.5" />, cls: "text-ok" },
  error: { label: "Falhou", icon: <XCircle className="h-3.5 w-3.5" />, cls: "text-rose" },
};

/** JSON legível com realce mínimo (chave, string, número). */
export function JsonView({ value, maxHeight = 240, className }: { value: unknown; maxHeight?: number; className?: string }) {
  const html = useMemo(() => {
    const raw = typeof value === "string" ? value : JSON.stringify(value, null, 2) ?? "";
    const esc = raw.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return esc.replace(/("(?:[^"\\]|\\.)*")(\s*:)?|\b(-?\d+(?:\.\d+)?)\b|\b(true|false|null)\b/g, (m, str, colon, n, kw) => {
      if (str) return colon ? `<span class="text-blue">${str}</span>${colon}` : `<span class="text-ok">${str}</span>`;
      if (n) return `<span class="text-accent-deep">${n}</span>`;
      if (kw) return `<span class="text-clay">${kw}</span>`;
      return m;
    });
  }, [value]);
  return (
    <pre className={cn("m-0 overflow-auto rounded-lg border border-line bg-soft/70 p-3 font-mono text-[11.5px] leading-[1.6] text-ink-soft", className)} style={{ maxHeight }}>
      {/* g4os-ds-disable-next-line dangerous-html -- JSON escapado (&, <, >) antes do realce */}
      <code dangerouslySetInnerHTML={{ __html: html }} />
    </pre>
  );
}

/** Uma chamada de ferramenta: nome, status, duração; entrada e saída ao expandir. */
export function ToolCallCard({ call, defaultOpen = false }: { call: ToolCall; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  const st = statusMeta[call.status];
  return (
    <div className={cn("overflow-hidden rounded-lg border bg-surface", call.status === "error" ? "border-rose/30" : "border-line")}>
      <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-soft/60">
        <span className="inline-grid h-6 w-6 shrink-0 place-items-center rounded-md bg-soft text-ink-soft ring-1 ring-line [&_svg]:h-3.5 [&_svg]:w-3.5">{call.icon ?? <Wrench aria-hidden />}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[12.5px] font-medium text-ink">{call.label ?? call.name}</span>
          {call.label && <span className="block truncate font-mono text-[11px] text-muted">{call.name}</span>}
        </span>
        <span className={cn("inline-flex shrink-0 items-center gap-1 text-[11.5px]", st.cls)}>
          {st.icon}
          <span className="max-sm:sr-only">{st.label}</span>
        </span>
        {call.durationMs != null && <span className="w-14 shrink-0 text-right text-[11.5px] tabular-nums text-muted">{formatDuration(call.durationMs)}</span>}
        <ChevronRight className={cn("h-3.5 w-3.5 shrink-0 text-muted transition-transform duration-150", open && "rotate-90")} aria-hidden />
      </button>
      {open && (
        <div id={id} className="space-y-2.5 border-t border-line px-3 py-3">
          {call.input !== undefined && (
            <div>
              <p className="m-0 mb-1 text-[11px] font-medium uppercase tracking-[0.08em] text-muted">Entrada</p>
              <JsonView value={call.input} />
            </div>
          )}
          {call.error ? (
            <SystemMessage tone="error" title="Erro na ferramenta">
              {call.error}
            </SystemMessage>
          ) : (
            call.output !== undefined && (
              <div>
                <p className="m-0 mb-1 text-[11px] font-medium uppercase tracking-[0.08em] text-muted">Saída</p>
                <JsonView value={call.output} />
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Seção recolhível "Usou N ferramentas" com ícones empilhados. Aberta
 * mostra cada chamada (ToolCallCard). Fica fechada por padrão quando tudo
 * deu certo; abre sozinha se alguma falhou.
 */
export function ToolCallsSection({ calls, title, defaultOpen, className }: { calls: ToolCall[]; title?: string; defaultOpen?: boolean; className?: string }) {
  const failed = calls.some((c) => c.status === "error");
  const running = calls.some((c) => c.status === "running");
  const [open, setOpen] = useState(defaultOpen ?? failed);
  const id = useId();
  const total = calls.reduce((s, c) => s + (c.durationMs ?? 0), 0);
  const heading = title ?? (running ? `Usando ferramentas (${calls.filter((c) => c.status === "success").length}/${calls.length})` : `Usou ${calls.length} ${calls.length === 1 ? "ferramenta" : "ferramentas"}`);
  return (
    <div className={cn("min-w-0", className)}>
      <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)} className="group inline-flex max-w-full items-center gap-2 rounded-lg py-1 pr-2 text-[12.5px] text-muted hover:text-ink">
        <span className="flex shrink-0 -space-x-1.5" aria-hidden>
          {calls.slice(0, 4).map((c) => (
            <span key={c.id} className="inline-grid h-5 w-5 place-items-center rounded-full bg-surface text-ink-soft ring-1 ring-line [&_svg]:h-3 [&_svg]:w-3">
              {c.icon ?? <Wrench />}
            </span>
          ))}
        </span>
        <span className="truncate">{heading}</span>
        {running ? <Loader2 className="h-3.5 w-3.5 shrink-0 text-blue motion-safe:animate-spin" aria-hidden /> : failed ? <XCircle className="h-3.5 w-3.5 shrink-0 text-rose" aria-label="Com falha" /> : null}
        {!running && total > 0 && <span className="shrink-0 tabular-nums">· {formatDuration(total)}</span>}
        <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 transition-transform duration-150", open && "rotate-180")} aria-hidden />
      </button>
      {open && (
        <div id={id} className="relative mt-2 space-y-1.5 pl-4 before:absolute before:bottom-2 before:left-[9px] before:top-2 before:w-px before:bg-line">
          {calls.map((c) => (
            <ToolCallCard key={c.id} call={c} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* AgentTrace                                                          */
/* ------------------------------------------------------------------ */

export type TraceKind = "agent" | "thinking" | "tool" | "search" | "output" | "error";
export type TraceStep = {
  id: string;
  kind: TraceKind;
  title: string;
  detail?: ReactNode;
  /** Início relativo ao começo da execução, em ms. */
  startMs: number;
  durationMs: number;
  tokens?: number;
  /** Força um status; sem isso, o status vem do tempo (replay). */
  status?: "queued" | "running" | "done" | "error" | "skipped";
  children?: TraceStep[];
};

const kindIcon: Record<TraceKind, LucideIcon> = { agent: Sparkles, thinking: Brain, tool: Wrench, search: Search, output: FileText, error: XCircle };
const kindBar: Record<TraceKind, string> = {
  agent: "bg-ink/80",
  thinking: "bg-accent",
  tool: "bg-blue",
  search: "bg-chart-5",
  output: "bg-ok",
  error: "bg-rose",
};

function flatten(steps: TraceStep[], depth = 0, open: Set<string>, out: { step: TraceStep; depth: number }[] = []) {
  for (const s of steps) {
    out.push({ step: s, depth });
    if (s.children?.length && open.has(s.id)) flatten(s.children, depth + 1, open, out);
  }
  return out;
}
function allIds(steps: TraceStep[], out: string[] = []) {
  steps.forEach((s) => {
    out.push(s.id);
    if (s.children) allIds(s.children, out);
  });
  return out;
}

/**
 * Linha do tempo em cascata de uma execução de agente: cada passo (pensar,
 * ferramenta, busca, subagente) com barra proporcional ao tempo, tokens e
 * status. `replay` adiciona um cursor para rever a execução passo a passo.
 */
export function AgentTrace({
  steps,
  replay = true,
  label = "Execução do agente",
  onSelect,
  selectedId,
  className,
}: {
  steps: TraceStep[];
  replay?: boolean;
  label?: string;
  onSelect?: (step: TraceStep) => void;
  selectedId?: string;
  className?: string;
}) {
  const total = useMemo(() => {
    let max = 0;
    const walk = (list: TraceStep[]) =>
      list.forEach((s) => {
        max = Math.max(max, s.startMs + s.durationMs);
        if (s.children) walk(s.children);
      });
    walk(steps);
    return max || 1;
  }, [steps]);
  const [open, setOpen] = useState<Set<string>>(() => new Set(allIds(steps)));
  const [t, setT] = useState(total);
  const [playing, setPlaying] = useState(false);
  const reduced = useReducedMotion();
  useEffect(() => setT(total), [total]);
  useEffect(() => {
    if (!playing) return;
    if (reduced) {
      setT(total);
      setPlaying(false);
      return;
    }
    let raf = 0;
    let last = performance.now();
    const speed = total / 6000; // replay em ~6 s
    const tick = (now: number) => {
      setT((v) => {
        const next = v + (now - last) * speed;
        if (next >= total) {
          setPlaying(false);
          return total;
        }
        return next;
      });
      last = now;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, total, reduced]);

  const rows = flatten(steps, 0, open);
  const statusOf = (s: TraceStep) => {
    if (s.status === "error" || s.status === "skipped") return t >= s.startMs ? s.status : "queued";
    if (s.status === "running" && t >= total) return "running";
    if (t < s.startMs) return "queued";
    if (t < s.startMs + s.durationMs) return "running";
    return "done";
  };
  const tokensAt = (s: TraceStep) => (s.tokens ? Math.round(s.tokens * Math.max(0, Math.min(1, (t - s.startMs) / (s.durationMs || 1)))) : 0);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * total);
  return (
    <div className={cn("min-w-0 overflow-hidden rounded-xl border border-line bg-surface", className)} role="region" aria-label={label}>
      {replay && (
        <div className="flex flex-wrap items-center gap-3 border-b border-line bg-soft/50 px-3 py-2">
          <button
            type="button"
            onClick={() => {
              if (t >= total) setT(0);
              setPlaying((p) => !p);
            }}
            className="inline-flex h-7 items-center gap-1.5 rounded-md border border-line bg-surface px-2 text-[12px] font-medium text-ink-soft hover:bg-soft"
          >
            {playing ? <Square className="h-3 w-3 fill-current" /> : <RotateCcw className="h-3 w-3" />}
            {playing ? "Pausar" : t >= total ? "Rever execução" : "Continuar"}
          </button>
          <input
            type="range"
            min={0}
            max={total}
            step={total / 400}
            value={t}
            onChange={(e) => {
              setPlaying(false);
              setT(Number(e.target.value));
            }}
            aria-label="Posição na execução"
            aria-valuetext={formatDuration(t)}
            className="min-w-[120px] flex-1"
          />
          <span className="w-24 text-right text-[11.5px] tabular-nums text-muted">
            {formatDuration(t)} / {formatDuration(total)}
          </span>
        </div>
      )}
      {/* Em telas estreitas a cascata rola na horizontal em vez de espremer o eixo de tempo. */}
      <div className="overflow-x-auto">
        <div className="min-w-[620px]">
          <div className="grid grid-cols-[minmax(180px,38%)_1fr] border-b border-line px-3 py-1.5 text-[11px] text-muted">
            <span>Passo</span>
            <div className="relative mx-1 h-4">
              {ticks.map((v, i) => (
                <span key={i} className={cn("absolute top-0 tabular-nums", i === 0 ? "left-0" : i === ticks.length - 1 ? "right-0" : "-translate-x-1/2")} style={i > 0 && i < ticks.length - 1 ? { left: `${(v / total) * 100}%` } : undefined}>
                  {formatDuration(v)}
                </span>
              ))}
            </div>
          </div>
          <ul role="tree" aria-label={label} className="list-none p-0">
            {rows.map(({ step: s, depth }) => {
              const st = statusOf(s);
              const Icon = kindIcon[s.kind];
              const hasKids = !!s.children?.length;
              const isOpen = open.has(s.id);
              const visible = Math.max(0, Math.min(s.durationMs, t - s.startMs));
              return (
                <li
                  key={s.id}
                  role="treeitem"
                  aria-level={depth + 1}
                  aria-expanded={hasKids ? isOpen : undefined}
                  aria-selected={selectedId === s.id}
                  className={cn("grid grid-cols-[minmax(180px,38%)_1fr] items-center border-b border-line px-3 last:border-b-0", selectedId === s.id ? "bg-soft" : "hover:bg-soft/50", st === "queued" && "opacity-50")}
                >
                  <div className="flex min-w-0 items-center gap-1.5 py-2 pr-3" style={{ paddingLeft: depth * 16 }}>
                    {hasKids ? (
                      <button
                        type="button"
                        aria-label={isOpen ? "Recolher" : "Expandir"}
                        onClick={() =>
                          setOpen((o) => {
                            const n = new Set(o);
                            if (n.has(s.id)) n.delete(s.id);
                            else n.add(s.id);
                            return n;
                          })
                        }
                        className="ds-hit inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted hover:bg-line hover:text-ink"
                      >
                        <ChevronRight className={cn("h-3.5 w-3.5 transition-transform duration-150", isOpen && "rotate-90")} />
                      </button>
                    ) : (
                      <span className="w-5 shrink-0" />
                    )}
                    <span className={cn("inline-grid h-5 w-5 shrink-0 place-items-center rounded", st === "error" ? "text-rose" : "text-muted")}>
                      {st === "running" ? <Loader2 className="h-3.5 w-3.5 text-blue motion-safe:animate-spin" aria-label="Executando" /> : st === "error" ? <XCircle className="h-3.5 w-3.5" aria-label="Falhou" /> : <Icon className="h-3.5 w-3.5" aria-hidden />}
                    </span>
                    <button type="button" onClick={() => onSelect?.(s)} className={cn("min-w-0 truncate py-1 text-left text-[12.5px]", depth === 0 ? "font-medium text-ink" : "text-ink-soft", onSelect && "hover:underline")}>
                      {s.title}
                    </button>
                    {s.tokens != null && <span className="ml-auto shrink-0 pl-2 text-[11px] tabular-nums text-muted">{formatNumber(tokensAt(s))} tk</span>}
                  </div>
                  <div className="relative mx-1 h-8" aria-hidden>
                    <span className="absolute inset-y-0 w-px bg-accent/70" style={{ left: `${(t / total) * 100}%` }} />
                    <span className="absolute top-1/2 h-2.5 -translate-y-1/2 rounded-sm bg-line" style={{ left: `${(s.startMs / total) * 100}%`, width: `max(3px, ${(s.durationMs / total) * 100}%)` }} />
                    <span
                      className={cn("absolute top-1/2 h-2.5 -translate-y-1/2 rounded-sm", st === "error" ? "bg-rose" : kindBar[s.kind])}
                      style={{ left: `${(s.startMs / total) * 100}%`, width: visible > 0 ? `max(3px, ${(visible / total) * 100}%)` : 0 }}
                    />
                    {(() => {
                      const startPct = (s.startMs / total) * 100;
                      const endPct = ((s.startMs + s.durationMs) / total) * 100;
                      // Rótulo depois da barra; se não couber, dentro dela (barra larga) ou antes dela.
                      const style: CSSProperties =
                        endPct < 86 ? { left: `${endPct}%`, paddingLeft: 6 } : endPct - startPct > 18 ? { right: `${100 - endPct}%`, paddingRight: 6 } : { right: `${100 - startPct}%`, paddingRight: 6 };
                      const inside = endPct >= 86 && endPct - startPct > 18;
                      return (
                        <span className={cn("absolute top-1/2 z-[1] -translate-y-1/2 text-[10.5px] tabular-nums", inside ? "font-medium text-on-ink" : "text-muted")} style={style}>
                          {formatDuration(s.durationMs)}
                        </span>
                      );
                    })()}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Uso e limites                                                       */
/* ------------------------------------------------------------------ */

/** Consumo de tokens/créditos no período, com aviso a partir de 80 %. */
export function TokenUsageMeter({ used, limit, label = "Créditos de IA", unit = "créditos", resetsIn, className }: { used: number; limit: number; label?: string; unit?: string; resetsIn?: string; className?: string }) {
  const pct = limit ? used / limit : 0;
  const tone = pct >= 1 ? "bg-rose" : pct >= 0.8 ? "bg-amber" : "bg-primary";
  return (
    <div className={cn("min-w-0", className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 text-[12.5px]">
        <span className="whitespace-nowrap text-ink-soft">{label}</span>
        <span className="whitespace-nowrap tabular-nums text-muted">
          <span className="font-medium text-ink">{formatNumber(used)}</span> de {formatNumber(limit)} {unit}
        </span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line" role="progressbar" aria-label={label} aria-valuenow={Math.round(pct * 100)} aria-valuemin={0} aria-valuemax={100}>
        <div className={cn("h-full rounded-full transition-[width] duration-300", tone)} style={{ width: `${Math.min(100, pct * 100)}%` }} />
      </div>
      {resetsIn && <p className="m-0 mt-1 text-[11px] text-muted">Renova {resetsIn}</p>}
    </div>
  );
}

function useCountdown(seconds: number) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => {
    setLeft(seconds);
    if (seconds <= 0) return;
    const end = Date.now() + seconds * 1000;
    const id = window.setInterval(() => {
      const v = Math.max(0, Math.round((end - Date.now()) / 1000));
      setLeft(v);
      if (!v) window.clearInterval(id);
    }, 250);
    return () => window.clearInterval(id);
  }, [seconds]);
  return left;
}
/** 75 → "01:15" */
export const formatCountdown = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

/**
 * Aviso inline de limite atingido (dentro do chat ou acima do composer).
 * Conta o tempo até liberar e oferece a saída (plano, falar com admin).
 */
export function RateLimitNotice({ retryIn, onRetry, action, title = "Limite de uso atingido", children, className }: { retryIn: number; onRetry?: () => void; action?: ReactNode; title?: string; children?: ReactNode; className?: string }) {
  const left = useCountdown(retryIn);
  return (
    <SystemMessage
      tone="warn"
      title={title}
      className={className}
      action={
        <div className="flex items-center gap-2">
          {action}
          {onRetry && (
            <button
              type="button"
              disabled={left > 0}
              onClick={onRetry}
              className="inline-flex h-7 items-center gap-1.5 rounded-md border border-line bg-surface px-2 text-[12px] font-medium text-ink tabular-nums hover:bg-soft disabled:text-muted disabled:hover:bg-surface"
            >
              <RotateCcw className="h-3 w-3" />
              {left > 0 ? formatCountdown(left) : "Tentar de novo"}
            </button>
          )}
        </div>
      }
    >
      {children ?? <>Você fez muitas perguntas em pouco tempo. Libera em <span className="font-medium tabular-nums text-ink">{formatCountdown(left)}</span>.</>}
    </SystemMessage>
  );
}

/* ------------------------------------------------------------------ */
/* AskAI                                                               */
/* ------------------------------------------------------------------ */

/** Botão flutuante que abre o assistente (canto inferior direito). */
export function AskAILauncher({ onClick, open, label = "Perguntar à IA", className }: { onClick: () => void; open?: boolean; label?: string; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={open}
      className={cn(
        "ui-button-primary inline-flex h-11 items-center gap-2 rounded-full bg-primary pl-3 pr-4 text-[13.5px] font-medium text-on-primary shadow-toast transition-transform duration-150 hover:bg-primary/90 motion-safe:hover:-translate-y-0.5",
        className,
      )}
    >
      <Sparkles className="h-4 w-4" aria-hidden />
      {label}
    </button>
  );
}

/**
 * Painel do assistente: cabeçalho com contexto, conversa (ou sugestões no
 * estado vazio) e composer. Renderize dentro de um layout (coluna lateral)
 * ou num Sheet. Não é modal: a tela ao lado continua usável.
 */
export function AskAIPanel({
  title = "Assistente",
  context,
  onClose,
  empty,
  children,
  composer,
  footer,
  className,
}: {
  title?: string;
  /** Chip de contexto: sobre o que a IA está olhando ("Negócio: Grupo Aurora"). */
  context?: ReactNode;
  onClose?: () => void;
  /** Estado vazio (saudação + PromptSuggestions). Mostrado quando não há children. */
  empty?: ReactNode;
  /** Mensagens (ChatMessage…). */
  children?: ReactNode;
  composer: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  const hasMessages = Array.isArray(children) ? children.filter(Boolean).length > 0 : !!children;
  return (
    <section aria-label={title} className={cn("flex h-full min-h-0 flex-col bg-surface", className)}>
      <header className="flex shrink-0 items-center gap-2.5 border-b border-line px-4 py-3">
        <AiMark size={24} />
        <div className="min-w-0 flex-1">
          <h2 className="m-0 text-[13.5px] font-semibold leading-tight">{title}</h2>
          {context && <div className="mt-0.5 truncate text-[11.5px] text-muted">{context}</div>}
        </div>
        {onClose && (
          <button type="button" onClick={onClose} aria-label="Fechar assistente" className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-soft hover:text-ink">
            <X className="h-4 w-4" />
          </button>
        )}
      </header>
      {hasMessages ? <ChatThread className="px-4 py-4">{children}</ChatThread> : <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6">{empty}</div>}
      <div className="shrink-0 border-t border-line bg-surface p-3">
        {composer}
        {footer}
      </div>
    </section>
  );
}
