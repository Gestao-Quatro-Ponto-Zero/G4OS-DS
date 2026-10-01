"use client";

import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { ArrowRight, Clock, CornerDownLeft, Loader2, PanelRightClose, PanelRightOpen, Plus, Search, TriangleAlert, X } from "lucide-react";
import { Fragment, useEffect, useMemo, useRef, useState, type MouseEvent, type ReactNode, type RefObject } from "react";
import { cn } from "../lib/cn";
import { formatNumber } from "../lib/format";
import { normalize } from "../lib/text";
import { PropertyList } from "./data";
import { Highlight, matchesQuery } from "./filters";
import { Kbd } from "./primitives";

/*
 * Busca. Três ferramentas, três trabalhos (docs/padroes/busca.md):
 *
 *   ⌘K  SearchPalette   GLOBAL. Achar qualquer registro de qualquer tipo,
 *                       navegar e executar ações. Abre de qualquer tela.
 *                       Não altera a lista atual — mas "Ver todos em X"
 *                       leva à tabela de X já filtrada pela busca.
 *   /   TableSearch     LOCAL. Estreita a lista que está na tela, junto com
 *                       os filtros (E). Destaca o trecho nas células.
 *       FilterBar       ESTRUTURA. Campo + operador + valor (filters.tsx).
 *
 * Tudo que estreita uma lista vai para a URL (?q=…&f=…).
 */

/* ================================================================== */
/* Busca local da tabela                                               */
/* ================================================================== */

const typing = (el: EventTarget | null) => el instanceof HTMLElement && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName));

/** "/" foca o campo (fora de outro campo). Padrão de GitHub, Linear, Gmail. */
export function useSlashShortcut(ref: RefObject<HTMLInputElement | null>, enabled = true, key = "/") {
  useEffect(() => {
    if (!enabled) return;
    const on = (e: KeyboardEvent) => {
      if (e.key !== key || e.metaKey || e.ctrlKey || e.altKey || typing(e.target)) return;
      e.preventDefault();
      ref.current?.focus();
      ref.current?.select();
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, [ref, enabled, key]);
}

/** Busca livre local, sem filtros estruturados. Com FilterBar, use useFilters (que já inclui a busca). */
export function useTableSearch<T>(rows: T[], texts: (row: T) => (string | number | null | undefined)[], initial = "") {
  const [query, setQuery] = useState(initial);
  const filtered = useMemo(() => (query.trim() ? rows.filter((r) => matchesQuery(query, texts(r))) : rows), [rows, query, texts]);
  return { query, setQuery, rows: filtered, total: rows.length, shown: filtered.length };
}

/**
 * Campo de busca da lista. Placeholder com o tamanho da coleção ("Buscar
 * em 312 contatos"), atalho "/" visível, Esc limpa (e depois sai), e uma
 * dica ao focar dizendo onde a busca procura e que ⌘K busca no app todo.
 */
export function TableSearch({
  value,
  onChange,
  total,
  noun = "item",
  nounPlural,
  searchIn,
  placeholder,
  shortcut = "/",
  globalHint = true,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  total?: number;
  noun?: string;
  nounPlural?: string;
  /** Onde procura: "nome, empresa e e-mail". Aparece na dica. */
  searchIn?: string;
  placeholder?: string;
  /** Tecla de atalho; null desliga. */
  shortcut?: string | null;
  /** Mostra "⌘K busca em todo o app" na dica. */
  globalHint?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);
  useSlashShortcut(ref, !!shortcut, shortcut ?? "/");
  const plural = nounPlural ?? `${noun}s`;
  const ph = placeholder ?? (total != null ? `Buscar em ${formatNumber(total)} ${total === 1 ? noun : plural}` : `Buscar ${plural}`);
  return (
    <div className={cn("relative min-w-0", className)}>
      <label className="focus-field flex h-10 items-center gap-2 rounded-lg border border-line bg-surface px-2.5">
        <Search className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden />
        <input
          ref={ref}
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.stopPropagation();
              if (value) onChange("");
              else ref.current?.blur();
            }
          }}
          placeholder={ph}
          aria-label={ph}
          aria-keyshortcuts={shortcut ?? undefined}
          className="h-full min-w-0 flex-1 bg-transparent text-[13.5px] outline-none placeholder:text-muted [&::-webkit-search-cancel-button]:hidden"
          style={{ border: 0, boxShadow: "none" }}
        />
        {value ? (
          <button type="button" aria-label="Limpar busca" onMouseDown={(e) => e.preventDefault()} onClick={() => onChange("")} className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-muted hover:bg-soft hover:text-ink">
            <X className="h-3.5 w-3.5" />
          </button>
        ) : (
          shortcut && !focused && <Kbd>{shortcut}</Kbd>
        )}
      </label>
      {focused && !value && (searchIn || globalHint) && (
        <div className="enter pointer-events-none absolute left-0 right-0 top-full z-[15] mt-1.5 rounded-lg border border-line bg-popover px-3 py-2 text-[12px] leading-relaxed text-muted shadow-raised">
          {searchIn && (
            <p className="m-0">
              Procura por <span className="text-ink-soft">{searchIn}</span>. Sem acento também acha.
            </p>
          )}
          {globalHint && (
            <p className="m-0 mt-0.5 flex items-center gap-1">
              <Kbd>⌘</Kbd>
              <Kbd>K</Kbd> busca em todo o app
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/* ⌘K · SearchPalette                                                  */
/* ================================================================== */

export type SearchScope = {
  id: string;
  label: string;
  icon?: ReactNode;
  /** Prefixo que entra direto neste escopo: ">" ações, "@" pessoas, "#" registros. */
  prefix?: string;
  /** Plural para "Ver todos os N resultados em …" (padrão: label em minúsculas). */
  noun?: string;
};

export type SearchResult = {
  id: string;
  /** Id do escopo (grupo) a que pertence. */
  scope: string;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  /** À direita: status, data, valor. */
  meta?: ReactNode;
  href?: string;
  keywords?: string[];
  shortcut?: string[];
  /** Painel de prévia à direita (desktop). */
  preview?: { title?: string; subtitle?: string; badge?: ReactNode; icon?: ReactNode; properties?: { label: string; value?: ReactNode }[]; body?: ReactNode; actions?: ReactNode };
  onSelect?: () => void;
};

export type SearchSource = (query: string, scope: string, signal: AbortSignal) => Promise<SearchResult[]> | SearchResult[];

function score(q: string, r: SearchResult) {
  const n = normalize(q.trim());
  if (!n) return 1;
  const title = normalize(r.title);
  if (title.startsWith(n)) return 100;
  if (title.split(/\s+/).some((w) => w.startsWith(n))) return 80;
  if (matchesQuery(q, [r.title])) return 70;
  if (matchesQuery(q, [r.title, r.subtitle, ...(r.keywords ?? [])])) return 50;
  return 0;
}

type Row =
  | { kind: "result"; r: SearchResult }
  | { kind: "more"; scope: SearchScope; count: number; all?: boolean }
  | { kind: "query"; q: string }
  | { kind: "create" }
  | { kind: "all" };

/**
 * Busca global ⌘K. Escopos em abas (Tab alterna; prefixos ">" "@" "#"
 * entram direto), resultados agrupados por tipo com o trecho destacado,
 * prévia à direita, buscas recentes quando vazio, "Ver todos em X" que
 * leva à tabela filtrada. Fonte local (`items`) e/ou remota (`source`,
 * com debounce e cancelamento).
 */
export function SearchPalette({
  open,
  onClose,
  scopes,
  items = [],
  source,
  recentQueries: initialRecent = [],
  recentItems = [],
  onSelect,
  onSeeAll,
  onCreate,
  createLabel = (q: string) => `Criar “${q}”`,
  placeholder = "Buscar negócios, contatos, pedidos ou ações…",
  debounce = 160,
  perGroup = 4,
  initialQuery = "",
  initialScope = "all",
  defaultPreview = true,
  portalContainer,
}: {
  open: boolean;
  onClose: () => void;
  scopes: SearchScope[];
  items?: SearchResult[];
  source?: SearchSource;
  recentQueries?: string[];
  recentItems?: SearchResult[];
  onSelect?: (result: SearchResult, options: { newTab: boolean }) => void;
  onSeeAll?: (scope: SearchScope, query: string) => void;
  onCreate?: (query: string, scope: string) => void;
  createLabel?: (query: string, scope: string) => string;
  placeholder?: string;
  debounce?: number;
  perGroup?: number;
  initialQuery?: string;
  initialScope?: string;
  defaultPreview?: boolean;
  /** Onde montar (padrão: body). Útil para renderizar dentro de uma moldura. */
  portalContainer?: HTMLElement | null;
}) {
  const allScopes = useMemo(() => [{ id: "all", label: "Tudo", noun: "resultados" } as SearchScope, ...scopes], [scopes]);
  const [query, setQuery] = useState(initialQuery);
  const [scope, setScope] = useState(initialScope);
  const [active, setActive] = useState(0);
  const [remote, setRemote] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const [preview, setPreview] = useState(defaultPreview);
  const [recent, setRecent] = useState(initialRecent);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery(initialQuery);
      setScope(initialScope);
      setActive(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Fonte remota: debounce + cancelamento da busca anterior.
  useEffect(() => {
    if (!source || !open) return;
    const q = query.trim();
    if (!q) {
      setRemote([]);
      setLoading(false);
      setError(null);
      return;
    }
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);
    const t = setTimeout(async () => {
      try {
        const res = await source(q, scope, ctrl.signal);
        if (!ctrl.signal.aborted) setRemote(res);
      } catch (e) {
        if (!ctrl.signal.aborted) setError(e instanceof Error ? e.message : "Falha na busca");
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }, debounce);
    return () => {
      ctrl.abort();
      clearTimeout(t);
    };
  }, [query, scope, source, debounce, open, retry]);

  const scopeOf = (id: string) => allScopes.find((s) => s.id === id);
  const q = query.trim();

  const { rows, counts } = useMemo(() => {
    const out: Row[] = [];
    const counts: Record<string, number> = {};
    if (!q) {
      if (scope === "all") {
        recent.slice(0, 4).forEach((x) => out.push({ kind: "query", q: x }));
        recentItems.slice(0, 5).forEach((r) => out.push({ kind: "result", r }));
      }
      // escopo vazio: mostra o que existe nele (ex.: todas as ações)
      if (scope !== "all") items.filter((r) => r.scope === scope).slice(0, 12).forEach((r) => out.push({ kind: "result", r }));
      return { rows: out, counts };
    }
    const pool = [...items, ...remote.filter((r) => !items.some((i) => i.id === r.id))];
    const scored = pool
      .map((r) => ({ r, s: source && remote.includes(r) ? Math.max(40, score(q, r)) : score(q, r) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s);
    for (const x of scored) counts[x.r.scope] = (counts[x.r.scope] ?? 0) + 1;
    counts.all = scored.length;
    if (scope === "all") {
      for (const sc of scopes) {
        const inScope = scored.filter((x) => x.r.scope === sc.id);
        if (!inScope.length) continue;
        inScope.slice(0, perGroup).forEach((x) => out.push({ kind: "result", r: x.r }));
        if (inScope.length > perGroup && onSeeAll) out.push({ kind: "more", scope: sc, count: inScope.length });
      }
    } else {
      const inScope = scored.filter((x) => x.r.scope === scope);
      inScope.slice(0, 50).forEach((x) => out.push({ kind: "result", r: x.r }));
      if (onSeeAll && inScope.length && scope !== "actions") out.push({ kind: "more", scope: scopeOf(scope)!, count: inScope.length, all: inScope.length <= 50 });
      if (!inScope.length && counts.all) out.push({ kind: "all" });
    }
    if (onCreate && scope !== "actions") out.push({ kind: "create" });
    return { rows: out, counts };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, scope, items, remote, recent, recentItems, perGroup, scopes, onSeeAll, onCreate]);

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);
  useEffect(() => setActive(0), [q, scope]);

  const remember = () => q && setRecent((r) => [q, ...r.filter((x) => x !== q)].slice(0, 6));
  const run = (row: Row | undefined, newTab = false) => {
    if (!row) return;
    if (row.kind === "query") {
      setQuery(row.q);
      inputRef.current?.focus();
      return;
    }
    if (row.kind === "all") {
      setScope("all");
      return;
    }
    remember();
    if (row.kind === "more") {
      onClose();
      onSeeAll?.(row.scope, q);
      return;
    }
    if (row.kind === "create") {
      onClose();
      onCreate?.(q, scope);
      return;
    }
    if (newTab && row.r.href) window.open(row.r.href, "_blank", "noopener");
    else onClose();
    row.r.onSelect?.();
    onSelect?.(row.r, { newTab });
  };

  const cycle = (dir: 1 | -1) => {
    const i = allScopes.findIndex((s) => s.id === scope);
    setScope(allScopes[(i + dir + allScopes.length) % allScopes.length].id);
  };

  const current = rows[active];
  const currentPreview = current?.kind === "result" ? current.r : undefined;
  const showPreview = preview && !!currentPreview?.preview;
  const activeScope = scopeOf(scope);

  let lastGroup = "";
  return (
    <BaseDialog.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <BaseDialog.Portal container={portalContainer ?? undefined}>
        <BaseDialog.Backdrop className="fixed inset-0 z-[90] min-h-dvh bg-[var(--ds-backdrop,rgb(0_0_0/0.2))] backdrop-blur-[1px] transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <BaseDialog.Popup
          aria-label="Busca global"
          className={cn(
            "fixed left-1/2 top-[10dvh] z-[95] flex max-h-[min(620px,80dvh)] w-[calc(100vw-24px)] -translate-x-1/2 flex-col overflow-hidden rounded-2xl border border-line bg-popover text-ink shadow-overlay outline-none transition-[opacity,scale,max-width] duration-150 data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0",
            showPreview ? "max-w-[860px]" : "max-w-[640px]",
          )}
        >
          <BaseDialog.Title className="sr-only">Busca global</BaseDialog.Title>
          <div className="flex h-[54px] shrink-0 items-center gap-2.5 border-b border-line px-4">
            {activeScope && activeScope.id !== "all" ? (
              <button type="button" onClick={() => setScope("all")} className="inline-flex h-6 shrink-0 items-center gap-1 rounded-md bg-soft px-2 text-[12px] font-medium text-ink-soft ring-1 ring-line hover:text-ink" aria-label={`Escopo ${activeScope.label}. Remover escopo`}>
                {activeScope.prefix && <span className="text-muted">{activeScope.prefix}</span>}
                {activeScope.label}
                <X className="h-3 w-3 text-muted" />
              </button>
            ) : (
              <Search className="h-4 w-4 shrink-0 text-muted" aria-hidden />
            )}
            <input
              ref={inputRef}
              aria-label="Buscar"
              autoFocus
              value={query}
              onChange={(e) => {
                const v = e.target.value;
                const pre = scope === "all" && v.length >= 1 ? scopes.find((s) => s.prefix && v.startsWith(s.prefix)) : undefined;
                if (pre) {
                  setScope(pre.id);
                  setQuery(v.slice(pre.prefix!.length).trimStart());
                } else setQuery(v);
              }}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setActive((a) => (rows.length ? (a + 1) % rows.length : 0));
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setActive((a) => (rows.length ? (a - 1 + rows.length) % rows.length : 0));
                } else if (e.key === "Enter") {
                  e.preventDefault();
                  run(rows[active], e.metaKey || e.ctrlKey);
                } else if (e.key === "Tab") {
                  e.preventDefault();
                  cycle(e.shiftKey ? -1 : 1);
                } else if (e.key === "Backspace" && !query && scope !== "all") {
                  setScope("all");
                } else if (e.key === "ArrowRight" && e.currentTarget.selectionStart === query.length && currentPreview?.preview) {
                  e.preventDefault();
                  setPreview((p) => !p);
                }
              }}
              placeholder={activeScope && activeScope.id !== "all" ? `Buscar em ${activeScope.label.toLowerCase()}…` : placeholder}
              role="combobox"
              aria-expanded="true"
              aria-controls="search-results"
              aria-autocomplete="list"
              aria-activedescendant={rows[active] ? `sr-${active}` : undefined}
              className="h-full min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted"
              style={{ boxShadow: "none", border: 0 }}
            />
            {loading && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted" aria-label="Buscando" />}
            <Kbd>Esc</Kbd>
          </div>

          <div role="tablist" aria-label="Escopo da busca" className="flex shrink-0 items-center gap-1 overflow-x-auto border-b border-line px-3 py-2">
            {allScopes.map((s) => {
              const on = s.id === scope;
              const n = counts[s.id];
              return (
                <button
                  key={s.id}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  // Aba ativa entra no Tab (roving tabindex); setas trocam o escopo.
                  tabIndex={on ? 0 : -1}
                  onKeyDown={(e) => {
                    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
                    e.preventDefault();
                    const list = e.currentTarget.parentElement;
                    cycle(e.key === "ArrowRight" ? 1 : -1);
                    requestAnimationFrame(() => list?.querySelector<HTMLElement>('[aria-selected="true"]')?.focus());
                  }}
                  onClick={() => {
                    setScope(s.id);
                    inputRef.current?.focus();
                  }}
                  className={cn("inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-[12.5px] [&_svg]:h-3.5 [&_svg]:w-3.5", on ? "bg-primary font-medium text-on-primary" : "text-muted hover:bg-soft hover:text-ink")}
                >
                  {s.icon}
                  {s.label}
                  {q && n != null && <span className={cn("text-[11px] tabular-nums", on ? "text-on-primary/70" : "text-muted")}>{n}</span>}
                  {!q && s.prefix && <span className={cn("font-mono text-[11px]", on ? "text-on-primary/70" : "text-muted")}>{s.prefix}</span>}
                </button>
              );
            })}
          </div>

          <div className="flex min-h-0 flex-1">
            <div ref={listRef} id="search-results" role="listbox" aria-label="Resultados" className="min-h-0 min-w-0 flex-1 overflow-y-auto p-2">
              {error ? (
                <div className="px-4 py-10 text-center" role="alert">
                  <TriangleAlert className="mx-auto mb-2 h-5 w-5 text-amber" />
                  <p className="m-0 text-[13.5px] font-medium">A busca falhou</p>
                  <p className="m-0 mt-1 text-[12.5px] text-muted">{error}. Os resultados locais continuam abaixo.</p>
                  <button type="button" onClick={() => setRetry((r) => r + 1)} className="mt-3 rounded-lg px-3 py-1.5 text-[12.5px] font-medium ring-1 ring-line hover:bg-soft">
                    Tentar de novo
                  </button>
                </div>
              ) : null}
              {!rows.some((r) => r.kind !== "create") && !loading && (
                <div className="px-4 py-12 text-center">
                  <p className="m-0 text-[13.5px] font-medium">{q ? `Nada para “${q}”${activeScope && activeScope.id !== "all" ? ` em ${activeScope.label.toLowerCase()}` : ""}` : "Comece a digitar"}</p>
                  <p className="m-0 mt-1 text-[12.5px] text-muted">{q ? "Tente outra palavra, sem acento ou só o começo do nome." : "Busque por nome, empresa, número de pedido, e-mail ou ação."}</p>
                </div>
              )}
              {!rows.length && loading && (
                <div className="space-y-1.5 p-1" aria-hidden>
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3 rounded-lg px-2.5 py-2">
                      <span className="h-7 w-7 animate-pulse rounded-md bg-soft" />
                      <span className="h-3 flex-1 animate-pulse rounded bg-soft" style={{ maxWidth: `${60 - i * 8}%` }} />
                    </div>
                  ))}
                </div>
              )}
              {rows.map((row, i) => {
                const on = i === active;
                let header: ReactNode = null;
                const group =
                  row.kind === "query" ? "Buscas recentes" : row.kind === "result" ? (!q && scope === "all" ? "Abertos recentemente" : scopeOf(row.r.scope)?.label ?? "") : row.kind === "more" ? row.scope.label : row.kind === "create" ? "__create" : "__all";
                if (group !== lastGroup && !group.startsWith("__")) header = <div className="px-2.5 pb-1 pt-2.5 text-[10.5px] font-medium uppercase tracking-[0.08em] text-muted">{group}</div>;
                lastGroup = group;
                const common = {
                  id: `sr-${i}`,
                  role: "option" as const,
                  "aria-selected": on,
                  "data-index": i,
                  onPointerMove: () => setActive(i),
                  onClick: (e: MouseEvent) => run(row, e.metaKey || e.ctrlKey),
                };
                return (
                  <Fragment key={`${row.kind}-${i}`}>
                    {header}
                    {row.kind === "result" && (
                      <div {...common} className={cn("flex cursor-default items-center gap-3 rounded-lg px-2.5 py-2", on && "bg-soft")}>
                        <span className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-md border border-line bg-surface [&_svg]:h-3.5 [&_svg]:w-3.5", on ? "text-ink" : "text-muted")}>{row.r.icon}</span>
                        <span className="min-w-0 flex-1">
                          <Highlight text={row.r.title} query={q} className="block truncate text-[13.5px]" />
                          {row.r.subtitle && <Highlight text={row.r.subtitle} query={q} className="block truncate text-[12px] text-muted" />}
                        </span>
                        {row.r.meta && <span className="hidden shrink-0 text-[12px] text-muted sm:inline">{row.r.meta}</span>}
                        {row.r.shortcut && (
                          <span className="hidden shrink-0 gap-0.5 sm:inline-flex">
                            {row.r.shortcut.map((k) => (
                              <Kbd key={k}>{k}</Kbd>
                            ))}
                          </span>
                        )}
                        {on && <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden />}
                      </div>
                    )}
                    {row.kind === "query" && (
                      <div {...common} className={cn("flex cursor-default items-center gap-3 rounded-lg px-2.5 py-1.5 text-[13px] text-ink-soft", on && "bg-soft text-ink")}>
                        <Clock className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden />
                        <span className="min-w-0 flex-1 truncate">{row.q}</span>
                        {on && <span className="text-[11.5px] text-muted">buscar de novo</span>}
                      </div>
                    )}
                    {row.kind === "more" && (
                      <div {...common} className={cn("flex cursor-default items-center gap-2 rounded-lg px-2.5 py-2 text-[12.5px] text-blue", on && "bg-soft")}>
                        <ArrowRight className="ml-1.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                        {row.all ? `Abrir ${row.count === 1 ? "o resultado" : `os ${formatNumber(row.count)} resultados`} na lista de ${row.scope.noun ?? row.scope.label.toLowerCase()}` : `Ver todos os ${formatNumber(row.count)} resultados em ${row.scope.noun ?? row.scope.label.toLowerCase()}`}
                        <span className="ml-auto text-[11.5px] text-muted">abre a lista filtrada</span>
                      </div>
                    )}
                    {row.kind === "all" && (
                      <div {...common} className={cn("mt-1 flex cursor-default items-center gap-2 rounded-lg px-2.5 py-2 text-[12.5px] text-blue", on && "bg-soft")}>
                        <Search className="h-3.5 w-3.5" /> Buscar “{q}” em tudo ({formatNumber(counts.all ?? 0)})
                      </div>
                    )}
                    {row.kind === "create" && (
                      <div {...common} className={cn("mt-1 flex cursor-default items-center gap-3 rounded-lg border-t border-line px-2.5 py-2 text-[13px]", on && "bg-soft")}>
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md border border-dashed border-line-strong text-muted">
                          <Plus className="h-3.5 w-3.5" />
                        </span>
                        {createLabel(q, scope)}
                      </div>
                    )}
                  </Fragment>
                );
              })}
            </div>
            {showPreview && currentPreview?.preview && (
              <aside aria-label="Prévia" className="hidden w-[300px] shrink-0 overflow-y-auto border-l border-line bg-soft/40 p-4 md:block">
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-line bg-surface text-muted [&_svg]:h-4.5 [&_svg]:w-4.5">{currentPreview.preview.icon ?? currentPreview.icon}</span>
                  <div className="min-w-0">
                    <p className="m-0 text-[14px] font-semibold leading-snug">{currentPreview.preview.title ?? currentPreview.title}</p>
                    {(currentPreview.preview.subtitle ?? currentPreview.subtitle) && <p className="m-0 mt-0.5 text-[12px] text-muted">{currentPreview.preview.subtitle ?? currentPreview.subtitle}</p>}
                  </div>
                </div>
                {currentPreview.preview.badge && <div className="mt-3">{currentPreview.preview.badge}</div>}
                {currentPreview.preview.properties && (
                  <div className="mt-4 rounded-lg border border-line bg-surface px-3 py-2.5">
                    <PropertyList items={currentPreview.preview.properties} />
                  </div>
                )}
                {currentPreview.preview.body && <div className="mt-3 text-[12.5px] leading-relaxed text-ink-soft">{currentPreview.preview.body}</div>}
                {currentPreview.preview.actions && <div className="mt-4 flex flex-wrap gap-2">{currentPreview.preview.actions}</div>}
              </aside>
            )}
          </div>

          <footer className="hidden shrink-0 items-center gap-4 border-t border-line bg-soft/40 px-4 py-2 text-[11.5px] text-muted sm:flex">
            <span className="inline-flex items-center gap-1">
              <Kbd>↑</Kbd>
              <Kbd>↓</Kbd> navegar
            </span>
            <span className="inline-flex items-center gap-1">
              <Kbd>↵</Kbd> abrir
            </span>
            <span className="inline-flex items-center gap-1">
              <Kbd>⌘</Kbd>
              <Kbd>↵</Kbd> nova aba
            </span>
            <span className="inline-flex items-center gap-1">
              <Kbd>Tab</Kbd> escopo
            </span>
            {currentPreview?.preview && (
              <button type="button" onClick={() => setPreview((p) => !p)} className="ml-auto hidden items-center gap-1 rounded px-1 hover:text-ink md:inline-flex">
                {preview ? <PanelRightClose className="h-3.5 w-3.5" /> : <PanelRightOpen className="h-3.5 w-3.5" />}
                <Kbd>→</Kbd> prévia
              </button>
            )}
          </footer>
        </BaseDialog.Popup>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  );
}
