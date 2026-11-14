"use client";

import {
  AlertTriangle,
  ArrowUp,
  Brain,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDashed,
  Copy,
  CornerDownRight,
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
import { AiDots, G4OSSymbol } from "./g4os";
import { formatNumber } from "../lib/format";
import { useLinkedHighlight, type LinkedHighlight } from "./charts-kit";

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
    <span className={cn("inline-flex shrink-0 items-center gap-1 rounded-md bg-ai-accent-soft px-1.5 py-0.5 text-[11px] font-medium leading-4 text-blue ring-1 ring-ai-accent/25", className)}>
      <Sparkles className="h-3 w-3" aria-hidden />
      {label}
    </span>
  );
}

/** Marca do assistente: a esfera G4 OS num disco de gelo. `live` = pensando. */
export function AiMark({ size = 28, live = false, className }: { size?: number; live?: boolean; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-grid shrink-0 place-items-center rounded-full bg-surface ring-1 ring-line", className)}
      style={{ width: size, height: size }}
    >
      <G4OSSymbol size={size * 0.72} live={live} />
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
      <AiDots size={6} />
      {label}…
      {elapsed > 3000 && <span className="tabular-nums text-muted">{formatDuration(elapsed)}</span>}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Citações e fontes                                                   */
/* ------------------------------------------------------------------ */

export type AiSource = {
  id: string;
  title: string;
  href?: string;
  kind?: "web" | "doc" | "record" | "data";
  domain?: string;
  snippet?: ReactNode;
  /** Cor de identidade da fonte (marca do site/sistema) para o selo em SourceCards e SourceStack. Sem ela, o selo usa o ícone do tipo. */
  tint?: string;
};

const sourceIcon: Record<NonNullable<AiSource["kind"]>, LucideIcon> = { web: Globe, doc: FileText, record: Search, data: Brain };

/**
 * Link de fonte vindo de modelo ou da web: só http(s), mailto e caminhos
 * relativos viram <a>. `javascript:`, `data:` e afins são descartados.
 */
function safeSourceHref(href: string | undefined) {
  if (!href) return undefined;
  const h = href.trim();
  if (/^(https?:|mailto:)/i.test(h) || /^[/#?.]/.test(h)) return h;
  return /^[a-z][a-z0-9+.-]*:/i.test(h) ? undefined : h;
}

/**
 * Número de citação dentro do texto: “… 18 % [2]”. Hover mostra a fonte.
 * Com `onHighlight`, avisa quando o ponteiro ou o foco entra e sai (CitedText usa
 * para acender a frase sustentada); `active` pinta o número aceso.
 */
export function CitationChip({
  index,
  source,
  onClick,
  active,
  onHighlight,
}: {
  index: number;
  source?: AiSource;
  onClick?: () => void;
  /** Citação acesa (a frase ou a fonte dela está em destaque). */
  active?: boolean;
  /** Ponteiro/foco entrou (true) ou saiu (false) da citação. */
  onHighlight?: (on: boolean) => void;
}) {
  const cls = cn(
    "ds-hit mx-0.5 inline-flex h-4 min-w-4 -translate-y-px items-center justify-center rounded px-1 align-middle text-[10.5px] font-medium tabular-nums ring-1 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-muted/40",
    active ? "bg-accent-soft text-ink ring-accent/50" : "bg-soft text-ink-soft ring-line hover:bg-line hover:text-ink",
  );
  const label = source ? `Fonte ${index}: ${source.title}` : `Fonte ${index}`;
  const hl = onHighlight
    ? {
        onMouseEnter: () => onHighlight(true),
        onMouseLeave: () => onHighlight(false),
        onFocus: () => onHighlight(true),
        onBlur: () => onHighlight(false),
      }
    : {};
  const href = safeSourceHref(source?.href);
  if (href)
    return (
      <a href={href} target="_blank" rel="noreferrer" className={cls} title={label} aria-label={label} onClick={onClick} {...hl}>
        {index}
      </a>
    );
  return (
    <button type="button" className={cls} title={label} aria-label={label} onClick={onClick} {...hl}>
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
              {safeSourceHref(s.href) ? (
                <a href={safeSourceHref(s.href)} target="_blank" rel="noreferrer" className={cls}>
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
/* Resposta citada: selos de fonte, cartões, texto com citações        */
/* ------------------------------------------------------------------ */

/** Selo pequeno da fonte: inicial na cor de identidade (`tint`) ou ícone do tipo. Decorativo. */
function SourceMark({ source, size = "sm", className }: { source: AiSource; size?: "sm" | "md"; className?: string }) {
  const Icon = sourceIcon[source.kind ?? "doc"];
  const box = size === "md" ? "h-5 w-5 text-[11px] [&_svg]:h-3 [&_svg]:w-3" : "h-4 w-4 text-[10px] [&_svg]:h-2.5 [&_svg]:w-2.5";
  if (source.tint) {
    const letter = (source.domain ?? source.title).replace(/^www\./, "").trim().charAt(0).toUpperCase();
    return (
      <span
        aria-hidden
        className={cn("inline-grid shrink-0 place-items-center rounded-[5px] font-semibold leading-none", box, className)}
        style={{
          background: `color-mix(in oklab, ${source.tint} 20%, var(--color-surface))`,
          color: `color-mix(in oklab, ${source.tint} 72%, var(--color-ink))`,
        }}
      >
        {letter}
      </span>
    );
  }
  return (
    <span aria-hidden className={cn("inline-grid shrink-0 place-items-center rounded-[5px] bg-soft text-muted", box, className)}>
      <Icon />
    </span>
  );
}

const sourceOrigin = (s: AiSource) => s.domain ?? (s.kind === "record" ? "Registro" : s.kind === "data" ? "Dados" : s.kind === "web" ? "Web" : "Documento");

/**
 * Resumo compacto das fontes para o topo da resposta: selos sobrepostos +
 * "8 fontes ⌄". É um botão que abre e fecha os cartões (`SourceCards`).
 */
export function SourceStack({
  sources,
  expanded,
  onToggle,
  controls,
  max = 4,
  className,
}: {
  sources: AiSource[];
  /** Cartões abertos (gira a seta e informa `aria-expanded`). */
  expanded?: boolean;
  onToggle?: () => void;
  /** id dos cartões que o botão abre e fecha. */
  controls?: string;
  /** Quantos selos aparecem sobrepostos. */
  max?: number;
  className?: string;
}) {
  if (!sources.length) return null;
  const n = sources.length;
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={onToggle ? !!expanded : undefined}
      aria-controls={controls}
      className={cn(
        "inline-flex h-8 items-center gap-2 rounded-full pl-1.5 pr-2.5 text-[12.5px] text-ink-soft outline-none transition-colors hover:bg-soft hover:text-ink focus-visible:ring-2 focus-visible:ring-muted/40",
        className,
      )}
    >
      <span className="flex items-center" aria-hidden>
        {sources.slice(0, max).map((s, i) => (
          <SourceMark key={s.id} source={s} size="md" className={cn("ring-2 ring-page", i > 0 && "-ml-1")} />
        ))}
      </span>
      <span className="tabular-nums">{n === 1 ? "1 fonte" : `${formatNumber(n)} fontes`}</span>
      {onToggle && <ChevronDown className={cn("h-3.5 w-3.5 text-muted transition-transform", expanded && "rotate-180")} aria-hidden />}
    </button>
  );
}

/**
 * Fontes de uma resposta como cartões pequenos (selo, origem, título, número).
 * No celular viram uma linha rolável; acima disso, grade. Mostra `max` e um
 * "+N fontes" que expande. Com `highlight` (o mesmo de `CitedText`), passar o
 * ponteiro ou focar um cartão acende as frases que citam aquela fonte, e
 * citar uma fonte no texto acende o cartão.
 */
export function SourceCards({
  sources,
  highlight,
  max = 4,
  id,
  label = "Fontes",
  className,
}: {
  sources: AiSource[];
  /** Realce ligado (`useLinkedHighlight<number>()`), chave = número da fonte (1, 2, 3…). */
  highlight?: LinkedHighlight<number>;
  /** Células da grade; com mais fontes, a última vira "+N fontes". */
  max?: number;
  id?: string;
  /** Nome acessível da lista. */
  label?: string;
  className?: string;
}) {
  const [all, setAll] = useState(false);
  if (!sources.length) return null;
  // Com sobra, o "+N fontes" ocupa a última vaga: a grade fica com `max` células.
  const cut = sources.length > max ? Math.max(1, max - 1) : sources.length;
  const extra = sources.length - cut;
  const shown = all ? sources : sources.slice(0, cut);
  const card =
    "flex h-full min-h-[84px] flex-col gap-1.5 rounded-xl border border-line bg-surface px-3 py-2.5 text-left outline-none transition-colors hover:border-line-strong focus-visible:ring-2 focus-visible:ring-muted/40 data-active:border-accent/60 data-active:bg-accent-soft/40";
  return (
    <ol
      id={id}
      aria-label={label}
      className={cn(
        "-mx-1 flex list-none snap-x gap-2 overflow-x-auto px-1 pb-1 sm:mx-0 sm:grid sm:grid-cols-[repeat(auto-fill,minmax(150px,1fr))] sm:overflow-visible sm:px-0 sm:pb-0",
        className,
      )}
    >
      {shown.map((s) => {
        const n = sources.indexOf(s) + 1;
        const active = highlight?.active === n;
        const hover = highlight
          ? {
              onMouseEnter: () => highlight.setHover(n),
              onMouseLeave: () => highlight.setHover(null),
              onFocus: () => highlight.setHover(n),
              onBlur: () => highlight.setHover(null),
            }
          : {};
        const body = (
          <>
            <span className="flex min-w-0 items-center gap-1.5 text-[11.5px] text-muted">
              <SourceMark source={s} />
              <span className="min-w-0 flex-1 truncate">{sourceOrigin(s)}</span>
              <span className="tabular-nums" aria-hidden>
                {n}
              </span>
            </span>
            <span className="line-clamp-2 text-[12.5px] font-medium leading-snug text-ink">{s.title}</span>
          </>
        );
        const name = `Fonte ${n}: ${s.title} (${sourceOrigin(s)})`;
        return (
          <li key={s.id} className="w-[176px] shrink-0 snap-start sm:w-auto">
            {safeSourceHref(s.href) ? (
              <a href={safeSourceHref(s.href)} target="_blank" rel="noreferrer" aria-label={name} className={card} data-active={active || undefined} {...hover}>
                {body}
              </a>
            ) : highlight ? (
              <button type="button" aria-label={name} aria-pressed={highlight.pinned === n} className={cn(card, "w-full")} {...highlight.bind(n)}>
                {body}
              </button>
            ) : (
              <div className={card}>{body}</div>
            )}
          </li>
        );
      })}
      {extra > 0 && (
        <li className="w-[120px] shrink-0 snap-start sm:w-auto">
          <button
            type="button"
            onClick={() => setAll((v) => !v)}
            aria-expanded={all}
            className="flex h-full min-h-[84px] w-full flex-col items-start justify-between gap-1.5 rounded-xl border border-dashed border-line px-3 py-2.5 text-left text-[12.5px] text-ink-soft outline-none hover:border-line-strong hover:text-ink focus-visible:ring-2 focus-visible:ring-muted/40"
          >
            {!all && (
              <span className="flex items-center" aria-hidden>
                {sources.slice(cut, cut + 4).map((s, i) => (
                  <SourceMark key={s.id} source={s} className={cn("ring-2 ring-page", i > 0 && "-ml-0.5")} />
                ))}
              </span>
            )}
            <span className="font-medium tabular-nums">{all ? "Mostrar menos" : `+${formatNumber(extra)} fontes`}</span>
          </button>
        </li>
      )}
    </ol>
  );
}

/* ---------- Parser mínimo de marcação (sem HTML, sem dependência) ---------- */

type CiteInline = { t: "text"; v: string } | { t: "strong"; c: CiteInline[] } | { t: "em"; c: CiteInline[] } | { t: "code"; v: string } | { t: "cite"; n: number[] };

type CiteBlock =
  | { t: "p"; text: string }
  | { t: "h"; level: 1 | 2 | 3; text: string }
  | { t: "ol" | "ul"; items: string[]; start: number }
  | { t: "code"; lang: string; code: string }
  | { t: "table"; head: string[]; align: ("left" | "right" | "center")[]; rows: string[][] };

const INLINE_RE = /(`[^`\n]+`)|(\*\*[^*\n]+?\*\*)|(\*[^*\s][^*\n]*?\*)|(\[\d+(?:\s*,\s*\d+)*\])/g;

function parseInline(src: string): CiteInline[] {
  const out: CiteInline[] = [];
  let last = 0;
  for (const m of src.matchAll(INLINE_RE)) {
    const at = m.index ?? 0;
    if (at > last) out.push({ t: "text", v: src.slice(last, at) });
    const tok = m[0];
    if (m[1]) out.push({ t: "code", v: tok.slice(1, -1) });
    else if (m[2]) out.push({ t: "strong", c: parseInline(tok.slice(2, -2)) });
    else if (m[3]) out.push({ t: "em", c: parseInline(tok.slice(1, -1)) });
    else {
      const n = tok.slice(1, -1).split(",").map((x) => Number(x.trim()));
      const prev = out[out.length - 1];
      // [1][2] e [1] [2] viram uma citação só: [1, 2].
      if (prev?.t === "cite") prev.n.push(...n);
      else if (prev?.t === "text" && !prev.v.trim() && out[out.length - 2]?.t === "cite") {
        out.pop();
        (out[out.length - 1] as { t: "cite"; n: number[] }).n.push(...n);
      } else out.push({ t: "cite", n });
    }
    last = at + tok.length;
  }
  if (last < src.length) out.push({ t: "text", v: src.slice(last) });
  return out;
}

const splitRow = (line: string) =>
  line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => c.trim());

/** Divide a marcação simples em blocos: parágrafos, títulos (#), listas (1. / -), tabela (|) e código (```). */
function parseBlocks(src: string): CiteBlock[] {
  // Pontuação logo depois da citação vai para antes dela: "frase [1]." → "frase. [1]".
  const text = src.replace(/((?:\s*\[\d+(?:\s*,\s*\d+)*\])+)([.,;:!?])/g, "$2$1");
  const lines = text.split("\n");
  const blocks: CiteBlock[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed) {
      i++;
      continue;
    }
    const fence = /^```\s*([\w-]*)/.exec(trimmed);
    if (fence) {
      const code: string[] = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i].trim())) code.push(lines[i++]);
      i++;
      blocks.push({ t: "code", lang: fence[1], code: code.join("\n") });
      continue;
    }
    const h = /^(#{1,3})\s+(.*)$/.exec(trimmed);
    if (h) {
      blocks.push({ t: "h", level: h[1].length as 1 | 2 | 3, text: h[2] });
      i++;
      continue;
    }
    const listRe = /^(\d+)[.)]\s+(.*)$|^[-*]\s+(.*)$/;
    const li = listRe.exec(trimmed);
    if (li) {
      const ordered = li[1] != null;
      const items: string[] = [];
      while (i < lines.length) {
        const t = lines[i].trim();
        const m = listRe.exec(t);
        if (m && (m[1] != null) === ordered) items.push(m[2] ?? m[3]);
        else if (t && /^\s+/.test(lines[i]) && items.length) items[items.length - 1] += ` ${t}`;
        else break;
        i++;
      }
      blocks.push({ t: ordered ? "ol" : "ul", items, start: ordered ? Number(li[1]) : 1 });
      continue;
    }
    if (trimmed.startsWith("|")) {
      const rows: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) rows.push(lines[i++].trim());
      const sep = rows[1] && /^\|?\s*:?-{2,}/.test(rows[1]) ? splitRow(rows[1]) : null;
      const head = splitRow(rows[0]);
      const align = head.map((_, c) => {
        const s = sep?.[c] ?? "";
        return s.endsWith(":") ? (s.startsWith(":") ? "center" : "right") : "left";
      }) as ("left" | "right" | "center")[];
      blocks.push({ t: "table", head, align, rows: rows.slice(sep ? 2 : 1).map(splitRow) });
      continue;
    }
    const para: string[] = [];
    while (i < lines.length) {
      const t = lines[i].trim();
      if (!t || /^```|^#{1,3}\s|^\|/.test(t) || listRe.test(t)) break;
      para.push(t);
      i++;
    }
    blocks.push({ t: "p", text: para.join(" ") });
  }
  return blocks;
}

/** Texto puro (sem marcação nem citações) de uma resposta: para Copiar e leitores. */
export function citedPlainText(markdown: string) {
  return markdown
    .replace(/```[\w-]*\n?/g, "")
    .replace(/\s*\[\d+(?:\s*,\s*\d+)*\]/g, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^#{1,3}\s+/gm, "")
    .replace(/^\|?\s*:?-{2,}.*$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const streamCursor = <span aria-hidden className="ml-0.5 inline-block h-[1em] w-[7px] translate-y-[3px] rounded-[1px] bg-ink/70 motion-safe:animate-pulse" />;

/**
 * Resposta com marcação simples e citações [n]. Passar o ponteiro ou focar uma
 * citação acende a frase que ela sustenta (e o cartão da fonte, com o mesmo
 * `highlight` em `SourceCards`); clicar fixa, Esc solta.
 * Marcação aceita: parágrafos, `#`/`##`/`###`, listas `1.` e `-`, **negrito**,
 * *itálico*, `código`, blocos ``` e tabela com `|` (alinhamento com `:`).
 * Nada vira HTML: o texto é seguro mesmo vindo do modelo. Para streaming,
 * passe o texto parcial e `streaming` (cursor no fim).
 */
export function CitedText({
  text,
  sources = [],
  highlight: highlightProp,
  streaming = false,
  size = "md",
  headingLevel = 2,
  className,
}: {
  /** Marcação simples com citações [1], [2, 3]. */
  text: string;
  /** Fontes na ordem da numeração ([1] = sources[0]). */
  sources?: AiSource[];
  /** Realce ligado com `SourceCards` (`useLinkedHighlight<number>()`). Sem ele, o realce é só local. */
  highlight?: LinkedHighlight<number>;
  /** Texto ainda chegando: mostra o cursor no fim e esconde citação incompleta. */
  streaming?: boolean;
  /** md = artigo (15 px); sm = conversa (13,5 px). */
  size?: "md" | "sm";
  /** Nível do `#`/`##` da resposta (h2 por padrão; `###` vira um nível abaixo). */
  headingLevel?: 2 | 3 | 4;
  className?: string;
}) {
  const own = useLinkedHighlight<number>();
  const hl = highlightProp ?? own;
  const [seg, setSeg] = useState<string | null>(null);
  const body = streaming ? text.replace(/\[[\d,\s]*$/, "").replace(/\*{1,2}$/, "") : text;
  const blocks = useMemo(() => parseBlocks(body), [body]);
  const lastBlock = blocks.length - 1;
  const [copied, setCopied] = useState<number | null>(null);

  // Cada trecho entre citações é a "frase" que a citação seguinte sustenta.
  const renderRun = (src: string, key: string, cursor: boolean) => {
    const toks = parseInline(src);
    const segs: { toks: CiteInline[]; n: number[] }[] = [];
    let cur: CiteInline[] = [];
    for (const t of toks) {
      if (t.t === "cite") {
        segs.push({ toks: cur, n: t.n });
        cur = [];
      } else cur.push(t);
    }
    if (cur.length) segs.push({ toks: cur, n: [] });
    return (
      <>
        {segs.map((s, i) => {
          const id = `${key}.${i}`;
          const lit = s.n.length > 0 && (seg != null ? seg === id : hl.active != null && s.n.includes(hl.active));
          return (
            <span key={id}>
              <span
                data-cited={s.n.length ? s.n.join(" ") : undefined}
                className={cn("rounded-[3px] [box-decoration-break:clone] motion-safe:transition-colors motion-safe:duration-150", lit && "bg-accent-soft text-ink")}
              >
                {s.toks.map((t, j) => renderTok(t, j))}
              </span>
              {s.n.map((n) => (
                <CitationChip
                  key={n}
                  index={n}
                  source={sources[n - 1]}
                  active={hl.active === n && (seg == null || seg === id)}
                  onHighlight={(on) => {
                    setSeg(on ? id : null);
                    hl.setHover(on ? n : null);
                  }}
                  onClick={safeSourceHref(sources[n - 1]?.href) ? undefined : () => hl.setPinned(hl.pinned === n ? null : n)}
                />
              ))}
            </span>
          );
        })}
        {cursor && streamCursor}
      </>
    );
  };

  const renderTok = (t: CiteInline, k: number): ReactNode => {
    switch (t.t) {
      case "text":
        return t.v;
      case "code":
        return (
          <code key={k} className={cn("rounded-md border border-line bg-soft px-1.5 py-px font-mono", size === "md" ? "text-[13.5px]" : "text-[12.5px]")}>
            {t.v}
          </code>
        );
      case "strong":
        return (
          <strong key={k} className="font-semibold text-ink">
            {t.c.map(renderTok)}
          </strong>
        );
      case "em":
        return <em key={k}>{t.c.map(renderTok)}</em>;
      default:
        return null;
    }
  };

  const text15 = size === "md" ? "text-[15px] leading-[1.7]" : "text-[13.5px] leading-[1.65]";
  const hSize = (level: number) => (level <= 2 ? (size === "md" ? "text-[18px]" : "text-[15px]") : size === "md" ? "text-[15px]" : "text-[13.5px]");

  return (
    <div
      className={cn("flex min-w-0 flex-col gap-3.5 text-ink", text15, className)}
      aria-busy={streaming || undefined}
      onKeyDown={(e) => {
        if (e.key === "Escape" && hl.pinned != null) hl.setPinned(null);
      }}
    >
      {blocks.map((b, bi) => {
        const key = String(bi);
        const cursor = streaming && bi === lastBlock;
        switch (b.t) {
          case "h": {
            const lvl = Math.min(6, headingLevel + (b.level === 3 ? 1 : 0));
            const H = `h${lvl}` as "h2" | "h3" | "h4" | "h5";
            return (
              <H key={key} className={cn("m-0 pt-2 font-semibold tracking-tight text-ink", hSize(b.level === 3 ? 3 : 2))}>
                {renderRun(b.text, key, cursor)}
              </H>
            );
          }
          case "ol":
          case "ul": {
            const L = b.t;
            return (
              <L
                key={key}
                start={b.t === "ol" && b.start !== 1 ? b.start : undefined}
                className={cn("m-0 flex flex-col gap-2 pl-6 marker:text-muted", b.t === "ol" ? "list-decimal marker:tabular-nums" : "list-disc")}
              >
                {b.items.map((it, ii) => (
                  <li key={ii} className="pl-1">
                    {renderRun(it, `${key}.${ii}`, cursor && ii === b.items.length - 1)}
                  </li>
                ))}
              </L>
            );
          }
          case "code":
            return (
              <div key={key} className="relative min-w-0 overflow-hidden rounded-lg border border-line bg-soft">
                <div className="flex items-center justify-between border-b border-line px-3 py-1.5 text-[11.5px] text-muted">
                  <span className="font-mono">{b.lang || "código"}</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(b.code).catch(() => undefined);
                      setCopied(bi);
                      window.setTimeout(() => setCopied((c) => (c === bi ? null : c)), 1400);
                    }}
                    className="inline-flex h-6 items-center gap-1 rounded-md px-1.5 outline-none hover:bg-surface hover:text-ink focus-visible:ring-2 focus-visible:ring-muted/40"
                  >
                    {copied === bi ? <Check className="h-3 w-3 text-ok" aria-hidden /> : <Copy className="h-3 w-3" aria-hidden />}
                    {copied === bi ? "Copiado" : "Copiar"}
                  </button>
                </div>
                <div role="region" tabIndex={0} aria-label={`Código ${b.lang}`.trim()} className="overflow-x-auto outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-muted/40">
                  <pre className="m-0 w-max min-w-full px-3.5 py-3 font-mono text-[12.5px] leading-relaxed text-ink">
                    <code>{b.code}</code>
                    {cursor && streamCursor}
                  </pre>
                </div>
              </div>
            );
          case "table":
            return (
              <div key={key} tabIndex={0} role="region" aria-label="Tabela" className="min-w-0 overflow-x-auto rounded-lg border border-line outline-none focus-visible:ring-2 focus-visible:ring-muted/40">
                <table className="w-full border-collapse text-[13px] leading-snug">
                  <thead className="bg-soft">
                    <tr>
                      {b.head.map((c, ci) => (
                        <th key={ci} scope="col" className={cn("whitespace-nowrap border-b border-line px-3 py-2 font-medium text-ink-soft", b.align[ci] === "right" ? "text-right" : b.align[ci] === "center" ? "text-center" : "text-left")}>
                          {renderRun(c, `${key}.h${ci}`, false)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {b.rows.map((r, ri) => (
                      <tr key={ri} className="border-b border-line last:border-0">
                        {b.head.map((_, ci) => (
                          <td key={ci} className={cn("px-3 py-2 align-top text-ink", b.align[ci] === "right" ? "text-right tabular-nums" : b.align[ci] === "center" ? "text-center" : "text-left", ci === 0 && "font-medium")}>
                            {renderRun(r[ci] ?? "", `${key}.${ri}.${ci}`, false)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {cursor && <span className="block px-3 py-1">{streamCursor}</span>}
              </div>
            );
          default:
            return (
              <p key={key} className="m-0">
                {renderRun(b.text, key, cursor)}
              </p>
            );
        }
      })}
      {streaming && !blocks.length && <p className="m-0">{streamCursor}</p>}
    </div>
  );
}

/** Pager das versões de uma resposta: "‹ 2 de 3 ›". Some com uma versão só. `index` começa em 0. */
export function AnswerVersions({ index, count, onIndexChange: onChange, className }: { index: number; count: number; onIndexChange: (index: number) => void; className?: string }) {
  if (count < 2) return null;
  const btn =
    "grid h-7 w-7 place-items-center rounded-md text-muted outline-none transition-colors hover:bg-soft hover:text-ink focus-visible:ring-2 focus-visible:ring-muted/40 disabled:pointer-events-none disabled:opacity-40 [&_svg]:h-3.5 [&_svg]:w-3.5";
  return (
    <div role="group" aria-label="Versões da resposta" className={cn("inline-flex items-center", className)}>
      <button type="button" className={btn} aria-label="Versão anterior" disabled={index <= 0} onClick={() => onChange(index - 1)}>
        <ChevronLeft />
      </button>
      <span aria-live="polite" className="min-w-[44px] text-center text-[12px] tabular-nums text-muted">
        {formatNumber(index + 1)} de {formatNumber(count)}
      </span>
      <button type="button" className={btn} aria-label="Próxima versão" disabled={index >= count - 1} onClick={() => onChange(index + 1)}>
        <ChevronRight />
      </button>
    </div>
  );
}

/**
 * Depois da resposta: campo "Pergunte algo relacionado" (com rótulo visível) e
 * até três perguntas sugeridas. Tocar numa sugestão pergunta direto.
 */
export function RelatedQuestions({
  items,
  onAsk,
  label = "Pergunte algo relacionado",
  placeholder = "Ex.: e para quem não tem celular?",
  className,
}: {
  /** Perguntas sugeridas (mostra até três). */
  items: string[];
  onAsk: (question: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
}) {
  const [q, setQ] = useState("");
  const id = useId();
  const submit = () => {
    const v = q.trim();
    if (!v) return;
    onAsk(v);
    setQ("");
  };
  return (
    <div className={cn("flex min-w-0 flex-col gap-2", className)}>
      <label htmlFor={id} className="text-[12.5px] font-medium text-ink-soft">
        {label}
      </label>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="focus-field flex h-11 items-center gap-2 rounded-xl border border-line bg-surface pl-3.5 pr-1.5"
      >
        <input id={id} value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} className="h-full min-w-0 flex-1 bg-transparent text-[14px] text-ink outline-none placeholder:text-muted" />
        <button
          type="submit"
          aria-label="Perguntar"
          disabled={!q.trim()}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary text-on-primary outline-none transition-opacity focus-visible:ring-2 focus-visible:ring-muted/40 disabled:opacity-40"
        >
          <ArrowUp className="h-4 w-4" aria-hidden />
        </button>
      </form>
      {items.length > 0 && (
        <ul aria-label="Perguntas sugeridas" className="m-0 flex list-none flex-col p-0">
          {items.slice(0, 3).map((it) => (
            <li key={it} className="border-b border-line last:border-0">
              <button
                type="button"
                onClick={() => onAsk(it)}
                className="flex w-full items-center gap-2.5 rounded-md px-1 py-2.5 text-left text-[13.5px] text-ink-soft outline-none hover:text-ink focus-visible:ring-2 focus-visible:ring-muted/40"
              >
                <CornerDownRight className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden />
                <span className="min-w-0 flex-1">{it}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
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
            <button type="button" onClick={onStop} aria-label="Parar resposta" title="Parar" className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-send text-on-send hover:bg-send/90">
              <Square className="h-3 w-3 fill-current" />
            </button>
          ) : (
            <button
              type="button"
              onClick={send}
              disabled={!value.trim() || disabled}
              aria-label="Enviar"
              title="Enviar"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-send text-on-send hover:bg-send/90 disabled:opacity-30"
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
    "inline-flex h-7 max-w-[min(320px,100%)] items-center gap-1.5 whitespace-nowrap rounded-lg px-2 text-[12px] [&_svg]:h-3.5 [&_svg]:w-3.5 [&_svg]:shrink-0",
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
    <pre className={cn("overflow-auto rounded-lg border border-line bg-soft/70 p-3 font-mono text-[11.5px] leading-[1.6] text-ink-soft", className)} style={{ maxHeight }}>
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
