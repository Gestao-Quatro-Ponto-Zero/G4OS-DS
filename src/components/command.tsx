"use client";

import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { Loader2, Search } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { cn } from "../lib/cn";
import { normalize } from "../lib/text";
import { KbdGroup } from "./primitives";

/*
 * Command componível (equivalente ao Command do shadcn/ui, sem cmdk):
 * busca + lista com grupos, ↑ ↓ Home End Enter, vazio, carregando e atalhos.
 * Use inline (seletor de ação num painel, menu de "/" no editor, troca de
 * workspace) ou dentro de CommandDialog. Para a paleta ⌘K pronta a partir de
 * uma lista de comandos, CommandPalette continua sendo o caminho curto.
 *
 *   <CommandMenu label="Ações do negócio">
 *     <CommandInput placeholder="Buscar ação…" />
 *     <CommandList>
 *       <CommandEmpty>Nenhuma ação encontrada</CommandEmpty>
 *       <CommandGroup heading="Negócio">
 *         <CommandItem icon={<Pencil />} shortcut={["E"]} onSelect={editar}>Editar</CommandItem>
 *       </CommandGroup>
 *     </CommandList>
 *   </CommandMenu>
 */

type Ctx = {
  query: string;
  setQuery: (q: string) => void;
  active: string | null;
  setActive: (id: string | null) => void;
  listId: string;
  filter: boolean | ((text: string, query: string) => boolean);
  loop: boolean;
  visibleCount: number;
  listRef: RefObject<HTMLDivElement | null>;
};

const CommandCtx = createContext<Ctx | null>(null);

function useCommand(name: string) {
  const ctx = useContext(CommandCtx);
  if (!ctx) throw new Error(`${name} precisa estar dentro de CommandMenu.`);
  return ctx;
}

const subsequence = (word: string, q: string) => {
  let i = 0;
  for (const ch of word) if (ch === q[i]) i++;
  return i === q.length;
};

/**
 * Combina sem acento e sem caixa: cada palavra da busca aparece no texto;
 * ou, para erro de digitação ("confg"), as letras da busca em ordem dentro
 * de UMA palavra que começa com a mesma letra.
 */
export function commandMatch(text: string, query: string) {
  const q = normalize(query.trim());
  if (!q) return true;
  const hay = normalize(text);
  if (q.split(/\s+/).every((w) => hay.includes(w))) return true;
  if (q.length < 3 || /\s/.test(q)) return false;
  return hay.split(/[^\p{L}\p{N}]+/u).some((w) => w[0] === q[0] && w.length >= q.length && subsequence(w, q));
}

/** Raiz: guarda a busca e o item ativo. `filter={false}` quando a busca é no servidor (filtre você os itens). */
export function CommandMenu({
  children,
  label,
  value,
  onValueChange,
  filter = true,
  loop = true,
  className,
}: {
  children: ReactNode;
  /** Nome acessível: "Ações", "Trocar de workspace". */
  label: string;
  /** Texto da busca (controlado). */
  value?: string;
  onValueChange?: (value: string) => void;
  filter?: boolean | ((text: string, query: string) => boolean);
  /** ↓ no último volta ao primeiro. */
  loop?: boolean;
  className?: string;
}) {
  const [inner, setInner] = useState("");
  const query = value ?? inner;
  const setQuery = useCallback(
    (q: string) => {
      if (value === undefined) setInner(q);
      onValueChange?.(q);
    },
    [value, onValueChange],
  );
  const [active, setActive] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(0);
  const listRef = useRef<HTMLDivElement | null>(null);
  const listId = useId();

  // Depois de cada render: conta os itens visíveis e garante um ativo válido.
  // Sem dependências de propósito (os itens vêm do DOM); os setState só rodam quando o valor muda.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    const items = listRef.current ? Array.from(listRef.current.querySelectorAll<HTMLElement>("[data-command-item]")) : [];
    if (items.length !== visibleCount) setVisibleCount(items.length);
    const enabled = items.filter((el) => !el.hasAttribute("data-disabled"));
    if (!enabled.some((el) => el.id === active)) setActive(enabled[0]?.id ?? null);
  });

  const ctx = useMemo<Ctx>(() => ({ query, setQuery, active, setActive, listId, filter, loop, visibleCount, listRef }), [query, setQuery, active, listId, filter, loop, visibleCount]);
  return (
    <CommandCtx.Provider value={ctx}>
      <div role="search" aria-label={label} data-command-menu="" className={cn("flex min-w-0 flex-col overflow-hidden rounded-xl border border-line bg-popover text-ink", className)}>
        {children}
      </div>
    </CommandCtx.Provider>
  );
}

/** Campo de busca. Setas mudam o item ativo; Enter executa. */
export function CommandInput({ placeholder = "Buscar…", autoFocus, className }: { placeholder?: string; autoFocus?: boolean; className?: string }) {
  const c = useCommand("CommandInput");
  const move = (dir: 1 | -1 | "first" | "last") => {
    const items = Array.from(c.listRef.current?.querySelectorAll<HTMLElement>("[data-command-item]:not([data-disabled])") ?? []);
    if (!items.length) return;
    const i = items.findIndex((el) => el.id === c.active);
    let next = dir === "first" ? 0 : dir === "last" ? items.length - 1 : i + dir;
    if (next < 0) next = c.loop ? items.length - 1 : 0;
    if (next >= items.length) next = c.loop ? 0 : items.length - 1;
    c.setActive(items[next].id);
    items[next].scrollIntoView({ block: "nearest" });
  };
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") move(1);
    else if (e.key === "ArrowUp") move(-1);
    else if (e.key === "Home" && e.ctrlKey) move("first");
    else if (e.key === "End" && e.ctrlKey) move("last");
    else if (e.key === "Enter" && c.active) document.getElementById(c.active)?.click();
    else return;
    e.preventDefault();
  };
  return (
    <div className={cn("flex h-11 shrink-0 items-center gap-2.5 border-b border-line px-3.5 focus-within:ring-2 focus-within:ring-inset focus-within:ring-accent/40", className)}>
      <Search className="h-4 w-4 shrink-0 text-muted" aria-hidden />
      <input
        autoFocus={autoFocus}
        value={c.query}
        onChange={(e) => c.setQuery(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        aria-label={placeholder}
        role="combobox"
        aria-expanded="true"
        aria-autocomplete="list"
        aria-controls={c.listId}
        aria-activedescendant={c.active ?? undefined}
        className="ds-bare h-full min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-muted"
        style={{ boxShadow: "none", border: 0 }}
      />
    </div>
  );
}

/** Lista que rola (até `maxHeight`). */
export function CommandList({ children, maxHeight, className }: { children: ReactNode; /** Altura máxima em px (padrão 320). */ maxHeight?: number; className?: string }) {
  const c = useCommand("CommandList");
  return (
    <div ref={c.listRef} id={c.listId} role={c.visibleCount > 0 ? "listbox" : undefined} aria-label={c.visibleCount > 0 ? "Resultados" : undefined} className={cn("max-h-80 min-h-0 overflow-y-auto overscroll-contain p-1.5", className)} style={maxHeight ? { maxHeight } : undefined}>
      {children}
    </div>
  );
}

/** Aparece quando nenhum item combina com a busca. */
export function CommandEmpty({ children = "Nada encontrado", hint = "Tente outro termo, sem acento ou abreviado.", className }: { children?: ReactNode; hint?: ReactNode; className?: string }) {
  const c = useCommand("CommandEmpty");
  if (c.visibleCount > 0) return null;
  return (
    <div role="status" className={cn("px-4 py-8 text-center", className)}>
      <p className="m-0 text-[13.5px] font-medium">{children}</p>
      {hint && <p className="m-0 mt-1 text-[12.5px] text-muted">{hint}</p>}
    </div>
  );
}

/** Enquanto a busca no servidor responde. Renderize no lugar do CommandEmpty. */
export function CommandLoading({ children = "Buscando…", className }: { children?: ReactNode; className?: string }) {
  return (
    <div role="status" className={cn("flex items-center justify-center gap-2 px-4 py-6 text-[13px] text-muted", className)}>
      <Loader2 className="h-4 w-4 motion-safe:animate-spin" aria-hidden />
      {children}
    </div>
  );
}

/** Grupo com título. Some sozinho quando a busca esvazia todos os itens dele. */
export function CommandGroup({ heading, children, className }: { heading?: ReactNode; children: ReactNode; className?: string }) {
  // Lê o contexto para renderizar de novo a cada busca e reavaliar se ficou vazio.
  useCommand("CommandGroup");
  const ref = useRef<HTMLDivElement>(null);
  const [hasItems, setHasItems] = useState(true);
  const headingId = useId();
  // Some quando a busca esconde todos os itens (lidos do DOM a cada render; setState só na mudança).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    const has = !!ref.current?.querySelector("[data-command-item]");
    if (has !== hasItems) setHasItems(has);
  });
  return (
    <div ref={ref} role="group" aria-labelledby={heading ? headingId : undefined} hidden={!hasItems} className={cn("[&+&]:mt-1", className)}>
      {heading && (
        <div id={headingId} className="px-2.5 pb-1 pt-2 text-[10.5px] font-medium uppercase tracking-[0.08em] text-muted">
          {heading}
        </div>
      )}
      {children}
    </div>
  );
}

/** Linha entre grupos (escondida durante a busca). */
export function CommandSeparator({ className }: { className?: string }) {
  const c = useCommand("CommandSeparator");
  if (c.query.trim()) return null;
  // Decorativo (aria-hidden): role=separator não é filho permitido de listbox.
  return <div aria-hidden className={cn("-mx-1.5 my-1 h-px bg-line", className)} />;
}

/** Atalho à direita do item: ["⌘", "N"] ou ["mod", "N"] (⌘ no Mac, Ctrl nos outros). */
export function CommandShortcut({ keys, className }: { keys: string[]; className?: string }) {
  return <KbdGroup keys={keys} className={cn("ml-auto hidden shrink-0 sm:inline-flex", className)} />;
}

/**
 * Um item. `value` é o texto usado na busca (padrão: children, se for
 * texto); `keywords` acrescenta sinônimos e siglas.
 */
export function CommandItem({
  children,
  value,
  keywords,
  onSelect,
  disabled,
  icon,
  description,
  shortcut,
  meta,
  className,
}: {
  children: ReactNode;
  value?: string;
  keywords?: string[];
  onSelect?: (value: string) => void;
  disabled?: boolean;
  icon?: ReactNode;
  description?: ReactNode;
  shortcut?: string[];
  /** Texto à direita (contexto: empresa, módulo). */
  meta?: ReactNode;
  className?: string;
}) {
  const c = useCommand("CommandItem");
  const id = useId();
  const text = value ?? (typeof children === "string" ? children : "");
  const hay = [text, ...(keywords ?? [])].join(" ");
  const visible = !c.filter || !c.query.trim() || (typeof c.filter === "function" ? c.filter(hay, c.query) : commandMatch(hay, c.query));
  if (!visible) return null;
  const on = c.active === id;
  return (
    // opção de listbox com aria-activedescendant: o foco fica no campo de busca
    // eslint-disable-next-line jsx-a11y/interactive-supports-focus
    <div
      id={id}
      role="option"
      aria-selected={on}
      aria-disabled={disabled || undefined}
      data-command-item=""
      data-disabled={disabled ? "" : undefined}
      onPointerMove={() => !disabled && !on && c.setActive(id)}
      onClick={() => !disabled && onSelect?.(text)}
      className={cn(
        "flex cursor-default select-none items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13.5px]",
        on && "bg-soft",
        disabled && "cursor-not-allowed text-muted",
        className,
      )}
    >
      {icon && <span className={cn("flex h-4 w-4 shrink-0 items-center justify-center [&_svg]:h-4 [&_svg]:w-4", on ? "text-ink" : "text-muted")}>{icon}</span>}
      <span className="min-w-0 flex-1">
        <span className="block truncate">{children}</span>
        {description && <span className="mt-0.5 block truncate text-[12px] text-muted">{description}</span>}
      </span>
      {meta && <span className="hidden shrink-0 truncate text-[12px] text-muted sm:inline">{meta}</span>}
      {shortcut && <CommandShortcut keys={shortcut} />}
    </div>
  );
}

/**
 * Command dentro de um diálogo (a paleta montada à mão). Os filhos são as
 * partes (CommandInput, CommandList…); feche no `onSelect` dos itens.
 */
export function CommandDialog({
  open,
  onOpenChange,
  label,
  children,
  value,
  onValueChange,
  filter,
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  label: string;
  children: ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
  filter?: boolean | ((text: string, query: string) => boolean);
  className?: string;
}) {
  return (
    <BaseDialog.Root open={open} onOpenChange={(o) => onOpenChange(o)}>
      <BaseDialog.Portal>
        <BaseDialog.Backdrop className="fixed inset-0 z-[var(--z-backdrop)] min-h-dvh bg-black/20 backdrop-blur-[1px] transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <BaseDialog.Popup
          aria-label={label}
          className={cn(
            "fixed left-1/2 top-[12dvh] z-[var(--z-modal)] w-[calc(100vw-24px)] max-w-[580px] -translate-x-1/2 overflow-hidden rounded-2xl shadow-overlay outline-none transition-[opacity,scale] duration-150 data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0",
            className,
          )}
        >
          <BaseDialog.Title className="sr-only">{label}</BaseDialog.Title>
          <CommandMenu label={label} value={value} onValueChange={onValueChange} filter={filter} className="rounded-2xl [&_[role=listbox]]:max-h-[min(420px,64dvh)]">
            {children}
          </CommandMenu>
        </BaseDialog.Popup>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  );
}
