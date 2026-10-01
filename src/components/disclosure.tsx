"use client";

import { Accordion as BaseAccordion } from "@base-ui/react/accordion";
import { Collapsible as BaseCollapsible } from "@base-ui/react/collapsible";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "../lib/cn";

/*
 * Revelação progressiva. Mostre o essencial; o resto fica a um clique.
 *   Accordion        várias seções do mesmo nível (FAQ, configurações longas)
 *   Collapsible      UMA seção opcional ("Opções avançadas")
 *   TreeView         hierarquia navegável (pastas, plano de contas, org chart)
 *   DescriptionToggle texto longo com "Ver mais"
 * Não esconda o que a pessoa precisa para decidir: erro, preço, prazo.
 */

const panelMotion =
  "h-[var(--accordion-panel-height)] overflow-hidden transition-[height] duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] data-ending-style:h-0 data-starting-style:h-0";

export type AccordionItem = { id: string; title: ReactNode; content: ReactNode; hint?: ReactNode; disabled?: boolean };

/**
 * Seções recolhíveis. `multiple` permite várias abertas. `variant="card"`
 * emoldura (FAQ, configurações); `plain` só com divisórias (dentro de card).
 */
export function Accordion({
  items,
  multiple = false,
  defaultOpen = [],
  variant = "card",
  className,
}: {
  items: AccordionItem[];
  multiple?: boolean;
  defaultOpen?: string[];
  variant?: "card" | "plain";
  className?: string;
}) {
  return (
    <BaseAccordion.Root
      multiple={multiple}
      defaultValue={defaultOpen}
      className={cn(variant === "card" ? "divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface" : "divide-y divide-line", className)}
    >
      {items.map((it) => (
        <BaseAccordion.Item key={it.id} value={it.id} disabled={it.disabled}>
          <BaseAccordion.Header className="m-0">
            <BaseAccordion.Trigger
              className={cn(
                "group flex w-full items-center gap-3 text-left outline-none hover:bg-soft/50 focus-visible:bg-soft/60 data-disabled:opacity-40",
                variant === "card" ? "px-4 py-3.5" : "py-3.5",
              )}
            >
              <span className="min-w-0 flex-1">
                <span className="block text-[13.5px] font-medium">{it.title}</span>
                {it.hint && <span className="mt-0.5 block text-[12px] text-muted">{it.hint}</span>}
              </span>
              <ChevronDown className="h-4 w-4 shrink-0 text-muted transition-transform duration-200 group-data-panel-open:rotate-180" aria-hidden />
            </BaseAccordion.Trigger>
          </BaseAccordion.Header>
          <BaseAccordion.Panel className={panelMotion}>
            <div className={cn("pb-4 text-[13px] leading-relaxed text-ink-soft", variant === "card" ? "px-4" : "")}>{it.content}</div>
          </BaseAccordion.Panel>
        </BaseAccordion.Item>
      ))}
    </BaseAccordion.Root>
  );
}

const collapsiblePanel =
  "h-[var(--collapsible-panel-height)] overflow-hidden transition-[height] duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] data-ending-style:h-0 data-starting-style:h-0 motion-reduce:transition-none";

/**
 * Uma seção opcional: "Opções avançadas", "Mostrar detalhes".
 * `variant`: `inline` (link discreto, padrão), `row` (linha cheia com
 * divisória, para listas de configurações) ou `card` (emoldurado).
 * `description` e `meta` aparecem no gatilho; `actions` à direita.
 * Para montar à mão (árvore de arquivos, painel com gatilho próprio), use
 * CollapsibleRoot + CollapsibleTrigger + CollapsibleContent.
 */
export function Collapsible({
  label,
  children,
  defaultOpen = false,
  open,
  onOpenChange,
  variant = "inline",
  description,
  meta,
  actions,
  icon,
  disabled,
  className,
}: {
  label: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  variant?: "inline" | "row" | "card";
  /** Linha de apoio sob o rótulo (row/card). */
  description?: ReactNode;
  /** Texto à direita do rótulo: "3 regras", "Opcional". */
  meta?: ReactNode;
  /** Ações à direita do gatilho (fora do botão). */
  actions?: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
  className?: string;
}) {
  if (variant === "inline")
    return (
      <BaseCollapsible.Root defaultOpen={defaultOpen} open={open} onOpenChange={(o) => onOpenChange?.(o)} disabled={disabled} className={className}>
        <div className="flex items-center gap-2">
          <BaseCollapsible.Trigger className="group -mx-1.5 inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[13px] font-medium text-ink-soft outline-none hover:bg-soft hover:text-ink focus-visible:ring-2 focus-visible:ring-accent/40 data-disabled:cursor-not-allowed data-disabled:text-muted">
            <ChevronRight className="h-3.5 w-3.5 text-muted transition-transform duration-200 group-data-panel-open:rotate-90" aria-hidden />
            {icon && <span className="inline-flex text-muted [&_svg]:h-4 [&_svg]:w-4">{icon}</span>}
            {label}
            {meta && <span className="font-normal text-muted">{meta}</span>}
          </BaseCollapsible.Trigger>
          {actions && <div className="ml-auto flex shrink-0 items-center gap-1">{actions}</div>}
        </div>
        <BaseCollapsible.Panel className={collapsiblePanel}>
          <div className="pt-3">{children}</div>
        </BaseCollapsible.Panel>
      </BaseCollapsible.Root>
    );
  return (
    <BaseCollapsible.Root
      defaultOpen={defaultOpen}
      open={open}
      onOpenChange={(o) => onOpenChange?.(o)}
      disabled={disabled}
      className={cn(variant === "card" ? "overflow-hidden rounded-xl border border-line bg-surface" : "border-b border-line", className)}
    >
      <div className={cn("flex items-center gap-2", variant === "card" ? "pr-3" : "")}>
        <BaseCollapsible.Trigger
          className={cn(
            "group flex min-w-0 flex-1 items-center gap-3 text-left outline-none hover:bg-soft/50 focus-visible:bg-soft/60 data-disabled:cursor-not-allowed data-disabled:text-muted",
            variant === "card" ? "px-4 py-3.5" : "py-3.5",
          )}
        >
          {icon && <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line bg-surface text-ink-soft [&_svg]:h-4 [&_svg]:w-4">{icon}</span>}
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-baseline gap-x-2 text-[13.5px] font-medium">
              <span className="min-w-0">{label}</span>
              {meta && <span className="shrink-0 text-[12px] font-normal text-muted">{meta}</span>}
            </span>
            {description && <span className="mt-0.5 block text-[12px] text-muted">{description}</span>}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted transition-transform duration-200 group-data-panel-open:rotate-180" aria-hidden />
        </BaseCollapsible.Trigger>
        {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
      </div>
      <BaseCollapsible.Panel className={collapsiblePanel}>
        <div className={cn("pb-4 text-[13px] leading-relaxed text-ink-soft", variant === "card" ? "px-4" : "")}>{children}</div>
      </BaseCollapsible.Panel>
    </BaseCollapsible.Root>
  );
}

/** Raiz componível (controlada com `open`/`onOpenChange`). */
export function CollapsibleRoot({
  children,
  open,
  defaultOpen,
  onOpenChange,
  disabled,
  className,
}: {
  children: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <BaseCollapsible.Root open={open} defaultOpen={defaultOpen} onOpenChange={(o) => onOpenChange?.(o)} disabled={disabled} className={className}>
      {children}
    </BaseCollapsible.Root>
  );
}

/**
 * Gatilho componível. Sem `className`, vem com o visual de linha (chevron
 * gira ao abrir via `group-data-panel-open:`). `chevron={false}` para um gatilho todo seu.
 */
export function CollapsibleTrigger({ children, chevron = true, className }: { children: ReactNode; chevron?: boolean; className?: string }) {
  return (
    <BaseCollapsible.Trigger
      className={cn(
        "group inline-flex min-w-0 items-center gap-1.5 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-accent/40 data-disabled:cursor-not-allowed data-disabled:text-muted",
        className,
      )}
    >
      {chevron && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted transition-transform duration-200 group-data-panel-open:rotate-90 motion-reduce:transition-none" aria-hidden />}
      {children}
    </BaseCollapsible.Trigger>
  );
}

/** Conteúdo componível com altura animada (respeita "reduzir movimento"). */
export function CollapsibleContent({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <BaseCollapsible.Panel className={collapsiblePanel}>
      <div className={className}>{children}</div>
    </BaseCollapsible.Panel>
  );
}

/* ------------------------------------------------------------------ */
/* TreeView                                                            */
/* ------------------------------------------------------------------ */

export type TreeNode = { id: string; label: string; icon?: ReactNode; meta?: ReactNode; children?: TreeNode[] };

/**
 * Árvore navegável (pastas, centros de custo, plano de contas, estrutura
 * de times). Teclado de árvore: ↑↓ move, → abre/entra, ← fecha/sobe,
 * Enter seleciona, Home/End.
 */
export function TreeView({
  nodes,
  selected,
  onSelect,
  defaultExpanded = [],
  label,
  className,
}: {
  nodes: TreeNode[];
  selected?: string;
  onSelect?: (node: TreeNode) => void;
  defaultExpanded?: string[];
  label: string;
  className?: string;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(defaultExpanded));
  const [focus, setFocus] = useState<string | undefined>(selected ?? nodes[0]?.id);
  const ref = useRef<HTMLUListElement>(null);

  const visible: { node: TreeNode; depth: number; parent?: string }[] = [];
  const walk = (list: TreeNode[], depth: number, parent?: string) => {
    for (const n of list) {
      visible.push({ node: n, depth, parent });
      if (n.children?.length && expanded.has(n.id)) walk(n.children, depth + 1, n.id);
    }
  };
  walk(nodes, 0);

  const toggle = (id: string, force?: boolean) =>
    setExpanded((s) => {
      const n = new Set(s);
      const next = force ?? !n.has(id);
      if (next) n.add(id);
      else n.delete(id);
      return n;
    });

  useEffect(() => {
    if (!ref.current?.contains(document.activeElement)) return;
    ref.current?.querySelector<HTMLElement>(`[data-id="${CSS.escape(focus ?? "")}"]`)?.focus();
  }, [focus]);

  const onKey = (e: KeyboardEvent) => {
    const i = visible.findIndex((v) => v.node.id === focus);
    const cur = visible[i];
    if (!cur) return;
    const has = !!cur.node.children?.length;
    const open = expanded.has(cur.node.id);
    const act: Record<string, () => void> = {
      ArrowDown: () => visible[i + 1] && setFocus(visible[i + 1].node.id),
      ArrowUp: () => visible[i - 1] && setFocus(visible[i - 1].node.id),
      ArrowRight: () => (has && !open ? toggle(cur.node.id, true) : has && visible[i + 1] && setFocus(visible[i + 1].node.id)),
      ArrowLeft: () => (has && open ? toggle(cur.node.id, false) : cur.parent && setFocus(cur.parent)),
      Home: () => setFocus(visible[0].node.id),
      End: () => setFocus(visible[visible.length - 1].node.id),
      Enter: () => (onSelect ? onSelect(cur.node) : has && toggle(cur.node.id)),
      " ": () => (onSelect ? onSelect(cur.node) : has && toggle(cur.node.id)),
    };
    if (act[e.key]) {
      e.preventDefault();
      act[e.key]();
    }
  };

  return (
    <ul ref={ref} role="tree" aria-label={label} onKeyDown={onKey} className={cn("list-none p-0", className)}>
      {visible.map(({ node, depth }) => {
        const has = !!node.children?.length;
        const open = expanded.has(node.id);
        const sel = selected === node.id;
        return (
          <li
            key={node.id}
            role="treeitem"
            aria-expanded={has ? open : undefined}
            aria-selected={onSelect ? sel : undefined}
            aria-level={depth + 1}
            data-id={node.id}
            tabIndex={focus === node.id ? 0 : -1}
            onFocus={() => setFocus(node.id)}
            onClick={() => {
              setFocus(node.id);
              if (onSelect) onSelect(node);
              else if (has) toggle(node.id);
            }}
            className={cn(
              "flex h-8 cursor-default select-none items-center gap-1.5 rounded-lg pr-2 text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-muted/40",
              sel ? "bg-surface font-medium text-ink shadow-surface ring-1 ring-line" : "text-ink-soft hover:bg-soft hover:text-ink",
            )}
            style={{ paddingLeft: 6 + depth * 16 }}
          >
            {has ? (
              <button
                type="button"
                tabIndex={-1}
                aria-hidden
                onClick={(e) => {
                  e.stopPropagation();
                  toggle(node.id);
                }}
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted hover:bg-black/5"
              >
                <ChevronRight className={cn("h-3.5 w-3.5 transition-transform duration-150", open && "rotate-90")} />
              </button>
            ) : (
              <span className="w-5 shrink-0" />
            )}
            {node.icon && <span className="flex shrink-0 items-center text-muted [&_svg]:h-4 [&_svg]:w-4">{node.icon}</span>}
            <span className="min-w-0 flex-1 truncate">{node.label}</span>
            {node.meta && <span className="shrink-0 text-[11.5px] tabular-nums text-muted">{node.meta}</span>}
          </li>
        );
      })}
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/* DescriptionToggle                                                   */
/* ------------------------------------------------------------------ */

/**
 * Texto longo recortado em `lines` linhas com "Ver mais"/"Ver menos".
 * O botão só aparece se o texto realmente passar do limite.
 */
export function DescriptionToggle({ children, lines = 3, className }: { children: ReactNode; lines?: number; className?: string }) {
  const [open, setOpen] = useState(false);
  const [overflow, setOverflow] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => setOverflow(el.scrollHeight > el.clientHeight + 1);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [children, lines]);
  return (
    <div className={className}>
      <div
        ref={ref}
        className="text-[13.5px] leading-relaxed text-ink-soft"
        style={open ? undefined : { display: "-webkit-box", WebkitLineClamp: lines, WebkitBoxOrient: "vertical", overflow: "hidden" }}
      >
        {children}
      </div>
      {(overflow || open) && (
        <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="mt-1 text-[12.5px] font-medium text-blue hover:underline">
          {open ? "Ver menos" : "Ver mais"}
        </button>
      )}
    </div>
  );
}
