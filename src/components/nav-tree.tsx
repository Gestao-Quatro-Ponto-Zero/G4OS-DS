"use client";

import { Menu as BaseMenu } from "@base-ui/react/menu";
import { Check, ChevronDown, ChevronRight, ChevronsUpDown, MoreHorizontal, Plus, Search, X } from "lucide-react";
import { useCallback, useEffect, useId, useMemo, useRef, useState, type ComponentType, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "../lib/cn";
import { inertProps } from "../lib/inert";
import { usePortalContainer } from "../lib/portal";
import { normalize } from "../lib/text";
import { popupClass } from "./overlays";
import { Menu, type MenuEntry } from "./overlays-extra";
import { Avatar, DsLink, KbdGroup } from "./primitives";

/*
 * Navegação em árvore: item com subitens (até 2 níveis abaixo do item), grupos
 * recolhíveis, "Mais", ações por item, flyout no trilho recolhido, seletor de
 * workspace, menu da pessoa e navegação de seções (docs, ajuda, configurações).
 * Usado pela Sidebar (navigation.tsx), pelo IconRail e pela BottomNav.
 */

export type NavIcon = ComponentType<{ className?: string; strokeWidth?: number | string }>;

/** Subitem de um item da navegação. `items` aceita mais UM nível (máximo). */
export type NavSubItem = {
  href: string;
  label: string;
  /** Prefixo que marca o subitem como ativo; padrão = href. */
  match?: string;
  /** Contador de atenção. */
  badge?: number;
  /** Terceiro nível (o último): só para documentação longa. */
  items?: NavSubItem[];
};

export type NavItem = {
  /** Destino. Item-pai sem página própria? Use `NavParentItem` (sem href). */
  href: string;
  label: string;
  icon: NavIcon;
  /** Prefixo que marca o item como ativo; padrão = href. */
  match?: string;
  /** Contador de atenção (alertas). */
  badge?: number;
  /** Subitens (2–7). O item abre sozinho quando um subitem está ativo. */
  items?: NavSubItem[];
  /** Começa aberto. */
  defaultOpen?: boolean;
  /** Menu ⋯ do item (aparece no hover/foco): renomear, compartilhar, remover. */
  actions?: MenuEntry[];
};

/** Item-pai sem página própria ("Cadastros"): a linha inteira só abre e fecha os subitens. */
export type NavParentItem = Omit<NavItem, "href" | "items"> & { href?: undefined; items: NavSubItem[] };

/** Entrada de um grupo da Sidebar: item com destino (com ou sem subitens) ou item-pai sem destino. */
export type NavEntry = NavItem | NavParentItem;

export type NavGroupAction = { label: string; icon?: ReactNode; onSelect?: () => void; href?: string };

export type NavGroup = {
  label: string;
  items: NavEntry[];
  /** O rótulo do grupo vira um botão que recolhe o grupo. */
  collapsible?: boolean;
  /** Com `collapsible`: começa aberto (padrão true). */
  defaultOpen?: boolean;
  /** Botão + ao lado do rótulo ("Novo projeto"). */
  action?: NavGroupAction;
  /** Mostra só os N primeiros; o resto entra em "Mais". */
  limit?: number;
};

/* ------------------------------------------------------------------ */
/* Ativo                                                               */
/* ------------------------------------------------------------------ */

/** O caminho atual corresponde a este destino (exato ou prefixo de segmento)? */
export function navMatches(target: { href?: string; match?: string }, currentPath: string) {
  const raw = target.match ?? target.href;
  if (!raw) return false;
  const base = raw.split("?")[0];
  const path = currentPath.split("?")[0];
  return base === "/" ? path === "/" : path === base || path.startsWith(`${base}/`);
}

type Tree = { href?: string; match?: string; items?: NavSubItem[] };

/** Algum descendente (subitem, sub-subitem) está ativo? */
export function navHasActiveChild(item: Tree, currentPath: string): boolean {
  return !!item.items?.some((s) => navMatches(s, currentPath) || navHasActiveChild(s, currentPath));
}

/** O item ou um descendente está ativo. */
export function navActiveDeep(item: Tree, currentPath: string) {
  return navMatches(item, currentPath) || navHasActiveChild(item, currentPath);
}

/** Soma dos contadores dos subitens (todos os níveis). */
export function sumBadges(items?: NavSubItem[]): number {
  return (items ?? []).reduce((n, s) => n + (s.badge ?? 0) + sumBadges(s.items), 0);
}

/** Destino de um item: o próprio href ou o do primeiro subitem. */
export function navHref(item: Tree): string {
  return item.href ?? (item.items?.[0] ? navHref(item.items[0]) : "#");
}

/* ------------------------------------------------------------------ */
/* Estado aberto/fechado (persistido em localStorage com storageKey)   */
/* ------------------------------------------------------------------ */

/** Estado aberto/fechado da árvore (por id), persistido com `storageKey`. Usado pela Sidebar e pela SectionNav. */
export function useNavOpenState(storageKey?: string) {
  const [map, setMap] = useState<Record<string, boolean>>({});
  // Lê depois de montar: o HTML do servidor não conhece o localStorage.
  useEffect(() => {
    if (!storageKey) return;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) setMap(JSON.parse(raw) as Record<string, boolean>);
    } catch {
      /* armazenamento bloqueado: segue sem persistir */
    }
  }, [storageKey]);
  const set = useCallback(
    (id: string, open: boolean) =>
      setMap((m) => {
        if (m[id] === open) return m;
        const next = { ...m, [id]: open };
        if (storageKey) {
          try {
            window.localStorage.setItem(storageKey, JSON.stringify(next));
          } catch {
            /* ignora */
          }
        }
        return next;
      }),
    [storageKey],
  );
  return [map, set] as const;
}

/* ------------------------------------------------------------------ */
/* Estilos compartilhados                                              */
/* ------------------------------------------------------------------ */

const rowBase = "relative mb-1 flex h-9 items-center rounded-lg border text-[12.5px] transition-colors duration-150";
const rowActive = "border-line-strong bg-surface font-medium text-ink shadow-surface"; // borda firme: visível mesmo quando rail ≈ surface
const rowIdle = "border-transparent text-muted hover:bg-soft hover:text-ink";
const rowTrail = "border-transparent font-medium text-ink hover:bg-soft"; // um subitem está ativo

function Marker({ className, sub }: { className?: string; sub?: boolean }) {
  // Gesto de marca: marcador Royal Gold (token --ds-nav-marker). Em subitem, fica sobre a linha-guia.
  return <span aria-hidden className={cn("absolute top-1/2 w-[3px] -translate-y-1/2 bg-nav-marker", sub ? "-left-[14px] h-3.5 rounded-full" : "h-4 rounded-r-full", className)} />;
}

function Badge({ value, hidden }: { value?: number; hidden?: boolean }) {
  if (!value) return null;
  return <span className={cn("rounded-full bg-amber-soft px-1.5 text-[10.5px] font-medium tabular-nums leading-[18px] text-amber", hidden && "sr-only")}>{value}</span>;
}

/** Painel que abre e fecha com altura animada (grid 0fr → 1fr). Fechado = inerte. */
function Reveal({ id, open, children, className }: { id: string; open: boolean; children: ReactNode; className?: string }) {
  return (
    <div
      id={id}
      className={cn("grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none", open ? "grid-rows-[1fr]" : "grid-rows-[0fr]", className)}
      {...inertProps(!open)}
    >
      <div className="min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Subitens (lista com linha-guia)                                     */
/* ------------------------------------------------------------------ */

function SubList({
  items,
  currentPath,
  open,
  setOpen,
  idPrefix,
  depth,
  onNavigate,
  inset = "icon",
}: {
  items: NavSubItem[];
  currentPath: string;
  open: Record<string, boolean>;
  setOpen: (id: string, value: boolean) => void;
  idPrefix: string;
  depth: number;
  onNavigate?: () => void;
  /** "icon": linha-guia alinhada ao centro do ícone do pai; "text": recuo curto (seções sem ícone). */
  inset?: "icon" | "text";
}) {
  return (
    <ul className={cn("m-0 list-none border-l border-line p-0 py-0.5 pl-3", depth === 1 ? (inset === "icon" ? "mb-1 ml-[18px]" : "ml-2") : "ml-2.5")}>
      {items.map((sub) => {
        const id = `${idPrefix}/${sub.label}`;
        const self = navMatches(sub, currentPath);
        const childActive = navHasActiveChild(sub, currentPath);
        const active = self && !childActive;
        if (sub.items?.length && depth < 2) {
          const isOpen = open[id] ?? childActive;
          const panel = `nav-${id.replace(/[^a-z0-9]+/gi, "-")}`;
          return (
            <li key={sub.href} className="relative">
              <div className={cn("group/row flex h-8 items-center rounded-md text-[12.5px] transition-colors", active ? "bg-surface font-medium text-ink shadow-surface ring-1 ring-line-strong" : childActive ? "font-medium text-ink hover:bg-soft" : "text-muted hover:bg-soft hover:text-ink")}>
                {active && <Marker sub />}
                <DsLink href={sub.href} onClick={onNavigate} aria-current={active ? "page" : undefined} className="flex h-full min-w-0 flex-1 items-center gap-2 px-2 focus-visible:outline-offset-[-2px]">
                  <span className="min-w-0 flex-1 truncate">{sub.label}</span>
                  <Badge value={sub.badge} />
                </DsLink>
                <ToggleButton open={isOpen} label={sub.label} controls={panel} onToggle={(v) => setOpen(id, v)} small />
              </div>
              <Reveal id={panel} open={isOpen}>
                <SubList items={sub.items} currentPath={currentPath} open={open} setOpen={setOpen} idPrefix={id} depth={depth + 1} onNavigate={onNavigate} />
              </Reveal>
            </li>
          );
        }
        return (
          <li key={sub.href} className="relative">
            <DsLink
              href={sub.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              onKeyDown={(e) => {
                // ← volta ao item-pai (o botão que abriu esta lista).
                if (e.key !== "ArrowLeft") return;
                const toggle = e.currentTarget.closest("[data-nav-tree]")?.querySelector<HTMLElement>("[data-nav-toggle]");
                if (toggle) {
                  e.preventDefault();
                  toggle.focus();
                }
              }}
              className={cn(
                "relative mb-px flex h-8 items-center gap-2 rounded-md px-2 text-[12.5px] transition-colors focus-visible:outline-offset-[-2px]",
                active ? "bg-surface font-medium text-ink shadow-surface ring-1 ring-line-strong" : "text-muted hover:bg-soft hover:text-ink",
              )}
            >
              {active && <Marker sub />}
              <span className="min-w-0 flex-1 truncate">{sub.label}</span>
              <Badge value={sub.badge} />
            </DsLink>
          </li>
        );
      })}
    </ul>
  );
}

function ToggleButton({ open, label, controls, onToggle, small }: { open: boolean; label: string; controls: string; onToggle: (open: boolean) => void; small?: boolean }) {
  return (
    <button
      type="button"
      data-nav-toggle
      aria-expanded={open}
      aria-controls={controls}
      aria-label={`${open ? "Recolher" : "Expandir"} ${label}`}
      onClick={() => onToggle(!open)}
      onKeyDown={(e) => arrowToggle(e, open, onToggle)}
      className={cn("ds-hit grid shrink-0 place-items-center rounded-md text-muted hover:bg-ink/[0.06] hover:text-ink", small ? "mr-0.5 h-6 w-6" : "mr-1 h-7 w-7")}
    >
      <ChevronRight className={cn("h-3.5 w-3.5 transition-transform duration-200 motion-reduce:transition-none", open && "rotate-90")} aria-hidden />
    </button>
  );
}

/** → abre (ou entra no primeiro subitem, se já aberto); ← fecha. */
function arrowToggle(e: KeyboardEvent<HTMLElement>, open: boolean, onToggle: (open: boolean) => void) {
  if (e.key === "ArrowRight") {
    e.preventDefault();
    if (!open) onToggle(true);
    else {
      const panel = document.getElementById(e.currentTarget.getAttribute("aria-controls") ?? "");
      panel?.querySelector<HTMLElement>("a, button")?.focus();
    }
  } else if (e.key === "ArrowLeft" && open) {
    e.preventDefault();
    onToggle(false);
  }
}

/* ------------------------------------------------------------------ */
/* Item da sidebar aberta                                              */
/* ------------------------------------------------------------------ */

/** Peça interna da Sidebar (item aberto com subitens). Em app, use `Sidebar`. */
export function NavTreeItem({
  item,
  currentPath,
  open,
  setOpen,
  idPrefix,
  onNavigate,
}: {
  item: NavEntry;
  currentPath: string;
  open: Record<string, boolean>;
  setOpen: (id: string, value: boolean) => void;
  idPrefix: string;
  onNavigate?: () => void;
}) {
  const reactId = useId();
  const Icon = item.icon;
  const id = `${idPrefix}/${item.label}`;
  const childActive = navHasActiveChild(item, currentPath);
  const self = navMatches(item, currentPath);
  const active = self && !childActive;
  const hasItems = !!item.items?.length;
  const isOpen = hasItems ? (open[id] ?? (item.defaultOpen || childActive)) : false;
  const panel = `nav-panel${reactId.replace(/:/g, "")}`;
  const tone = active ? rowActive : childActive ? rowTrail : rowIdle;

  const actions = item.actions?.length ? (
    <Menu
      label={`Ações de ${item.label}`}
      trigger={<MoreHorizontal aria-hidden />}
      items={item.actions}
      side="right"
      triggerVariant="icon"
      triggerClassName="ds-hit !h-6 !w-6 shrink-0 opacity-0 group-hover/row:opacity-100 group-focus-within/row:opacity-100 data-popup-open:opacity-100 [@media(hover:none)]:opacity-100"
    />
  ) : null;

  // Fechado, o pai soma os contadores dos subitens (o que pede atenção não some).
  const badge = item.badge ?? (hasItems && !isOpen ? sumBadges(item.items) || undefined : undefined);
  const content = (
    <>
      <Icon className={cn("h-4 w-4 shrink-0", active || childActive ? "text-ink-soft" : "text-muted")} strokeWidth={1.65} />
      <span className="min-w-0 flex-1 truncate text-left">{item.label}</span>
      <Badge value={badge} />
    </>
  );

  if (!hasItems) {
    return (
      <div className={cn(rowBase, tone, "group/row")}>
        {active && <Marker className="-left-[11px]" />}
        <DsLink
          href={item.href ?? "#"}
          onClick={onNavigate}
          aria-current={active ? "page" : undefined}
          className={cn("flex h-full min-w-0 flex-1 items-center gap-2.5 rounded-[inherit] pl-2.5 focus-visible:outline-offset-[-2px]", actions ? "pr-1" : "pr-2.5")}
        >
          {content}
        </DsLink>
        {actions && <span className="mr-1 flex">{actions}</span>}
      </div>
    );
  }

  return (
    <div data-nav-tree>
      <div className={cn(rowBase, tone, "group/row")}>
        {active && <Marker className="-left-[11px]" />}
        {childActive && !isOpen && <Marker className="-left-[11px] opacity-60" />}
        {item.href ? (
          <>
            <DsLink
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className="flex h-full min-w-0 flex-1 items-center gap-2.5 rounded-[inherit] pl-2.5 pr-1 focus-visible:outline-offset-[-2px]"
            >
              {content}
            </DsLink>
            {actions}
            <ToggleButton open={isOpen} label={item.label} controls={panel} onToggle={(v) => setOpen(id, v)} />
          </>
        ) : (
          <>
            <button
              type="button"
              data-nav-toggle
              aria-expanded={isOpen}
              aria-controls={panel}
              onClick={() => setOpen(id, !isOpen)}
              onKeyDown={(e) => arrowToggle(e, isOpen, (v) => setOpen(id, v))}
              className="flex h-full min-w-0 flex-1 items-center gap-2.5 rounded-[inherit] pl-2.5 pr-1.5 focus-visible:outline-offset-[-2px]"
            >
              {content}
              <ChevronRight className={cn("h-3.5 w-3.5 shrink-0 text-muted transition-transform duration-200 motion-reduce:transition-none", isOpen && "rotate-90")} aria-hidden />
            </button>
            {actions && <span className="mr-1 flex">{actions}</span>}
          </>
        )}
      </div>
      <Reveal id={panel} open={isOpen}>
        <SubList items={item.items!} currentPath={currentPath} open={open} setOpen={setOpen} idPrefix={id} depth={1} onNavigate={onNavigate} />
      </Reveal>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Grupo da sidebar aberta (recolhível, ação +, limite com "Mais")     */
/* ------------------------------------------------------------------ */

/** Peça interna da Sidebar (grupo com recolher, + e “Mais”). Em app, use `Sidebar`. */
export function NavTreeGroup({
  group,
  currentPath,
  open,
  setOpen,
  onNavigate,
}: {
  group: NavGroup;
  currentPath: string;
  open: Record<string, boolean>;
  setOpen: (id: string, value: boolean) => void;
  onNavigate?: () => void;
}) {
  const reactId = useId();
  const gid = `group:${group.label}`;
  const groupOpen = group.collapsible ? (open[gid] ?? group.defaultOpen ?? true) : true;
  const limit = group.limit && group.items.length > group.limit + 1 ? group.limit : undefined;
  const hidden = limit ? group.items.slice(limit) : [];
  const moreId = `more:${group.label}`;
  const showAll = !limit || open[moreId] || hidden.some((it) => navActiveDeep(it, currentPath));
  const visible = showAll ? group.items : group.items.slice(0, limit);
  const panel = `nav-group${reactId.replace(/:/g, "")}`;
  const labelCls = "text-[10px] font-medium uppercase tracking-[0.1em] text-muted";
  const action = group.action;

  const header =
    !group.collapsible && !action ? (
      <p className={cn("m-0 mb-2 px-2.5", labelCls)}>{group.label}</p>
    ) : (
      <div className="mb-1.5 flex h-6 items-center gap-1 pl-2.5 pr-1">
        {group.collapsible ? (
          <button
            type="button"
            aria-expanded={groupOpen}
            aria-controls={panel}
            onClick={() => setOpen(gid, !groupOpen)}
            className={cn("ds-hit -ml-1 flex min-w-0 flex-1 items-center gap-1 rounded px-1 text-left hover:text-ink", labelCls)}
          >
            <span className="truncate">{group.label}</span>
            <ChevronDown className={cn("h-3 w-3 shrink-0 transition-transform duration-200 motion-reduce:transition-none", !groupOpen && "-rotate-90")} aria-hidden />
          </button>
        ) : (
          <p className={cn("m-0 min-w-0 flex-1 truncate", labelCls)}>{group.label}</p>
        )}
        {action &&
          (action.href ? (
            <DsLink href={action.href} aria-label={action.label} title={action.label} className="ds-hit grid h-6 w-6 shrink-0 place-items-center rounded-md text-muted hover:bg-soft hover:text-ink [&_svg]:h-3.5 [&_svg]:w-3.5">
              {action.icon ?? <Plus aria-hidden />}
            </DsLink>
          ) : (
            <button type="button" onClick={action.onSelect} aria-label={action.label} title={action.label} className="ds-hit grid h-6 w-6 shrink-0 place-items-center rounded-md text-muted hover:bg-soft hover:text-ink [&_svg]:h-3.5 [&_svg]:w-3.5">
              {action.icon ?? <Plus aria-hidden />}
            </button>
          ))}
      </div>
    );

  const list = (
    <>
      {visible.map((item) => (
        <NavTreeItem key={item.href ?? item.label} item={item} currentPath={currentPath} open={open} setOpen={setOpen} idPrefix={group.label} onNavigate={onNavigate} />
      ))}
      {limit && !hidden.some((it) => navActiveDeep(it, currentPath)) && (
        <button
          type="button"
          aria-expanded={!!open[moreId]}
          onClick={() => setOpen(moreId, !open[moreId])}
          className={cn(rowBase, rowIdle, "w-full gap-2.5 px-2.5 text-left")}
        >
          <MoreHorizontal className="h-4 w-4 shrink-0 text-muted" strokeWidth={1.65} aria-hidden />
          <span className="flex-1">{open[moreId] ? "Menos" : `Mais ${hidden.length}`}</span>
        </button>
      )}
    </>
  );

  return (
    <>
      {header}
      {group.collapsible ? (
        <Reveal id={panel} open={groupOpen}>
          {list}
        </Reveal>
      ) : (
        list
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Flyout (trilho recolhido)                                           */
/* ------------------------------------------------------------------ */

const flyItem =
  "flex w-full cursor-default select-none items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[13px] text-ink-soft outline-none data-highlighted:bg-soft data-highlighted:text-ink";

/**
 * Item com subitens no trilho recolhido: o ícone abre um menu à direita
 * (hover, clique, Enter/Espaço/↓ ou →) com o nome do item e os subitens.
 * Renderiza num portal: o overflow do trilho não corta o menu.
 */
export function NavFlyout({
  item,
  currentPath,
  triggerClassName,
  children,
  onNavigate,
}: {
  item: { href?: string; label: string; match?: string; items?: NavSubItem[] };
  currentPath: string;
  /** Classes do gatilho (o botão do ícone). */
  triggerClassName?: string;
  /** Conteúdo do gatilho (ícone, marcador, ponto). */
  children: ReactNode;
  onNavigate?: () => void;
}) {
  const [ref, container] = usePortalContainer();
  const [isOpen, setIsOpen] = useState(false);
  const rows: { sub: NavSubItem; depth: number }[] = [];
  const walk = (list: NavSubItem[] | undefined, depth: number) =>
    list?.forEach((sub) => {
      rows.push({ sub, depth });
      if (depth < 2) walk(sub.items, depth + 1);
    });
  walk(item.items, 1);
  const overviewActive = !!item.href && navMatches(item, currentPath) && !navHasActiveChild(item, currentPath);
  return (
    <BaseMenu.Root modal={false} open={isOpen} onOpenChange={setIsOpen}>
      <BaseMenu.Trigger
        ref={ref}
        openOnHover
        delay={80}
        aria-label={item.label}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") {
            e.preventDefault();
            setIsOpen(true);
          }
        }}
        className={triggerClassName}
      >
        {children}
      </BaseMenu.Trigger>
      <BaseMenu.Portal container={container}>
        <BaseMenu.Positioner side="right" align="start" sideOffset={10} alignOffset={-6} collisionPadding={12} className="z-[100] outline-none">
          <BaseMenu.Popup className={cn(popupClass, "max-h-[var(--available-height)] min-w-[208px] overflow-y-auto p-1.5")}>
            <BaseMenu.Group>
              <BaseMenu.GroupLabel className="px-2.5 pb-1.5 pt-1 text-[11px] font-medium uppercase tracking-[0.08em] text-muted">{item.label}</BaseMenu.GroupLabel>
              {item.href && (
                <BaseMenu.LinkItem
                  closeOnClick
                  onClick={onNavigate}
                  render={<DsLink href={item.href} aria-current={overviewActive ? "page" : undefined} />}
                  className={cn(flyItem, overviewActive && "font-medium text-ink")}
                >
                  <span className="min-w-0 flex-1 truncate">Visão geral</span>
                  {overviewActive && <Check className="h-3.5 w-3.5 shrink-0" aria-hidden />}
                </BaseMenu.LinkItem>
              )}
              {rows.map(({ sub, depth }) => {
                const on = navMatches(sub, currentPath) && !navHasActiveChild(sub, currentPath);
                return (
                  <BaseMenu.LinkItem
                    key={sub.href}
                    closeOnClick
                    onClick={onNavigate}
                    render={<DsLink href={sub.href} aria-current={on ? "page" : undefined} />}
                    className={cn(flyItem, depth === 2 && "pl-6 text-[12.5px]", on && "font-medium text-ink")}
                  >
                    <span className="min-w-0 flex-1 truncate">{sub.label}</span>
                    {!!sub.badge && <span className="rounded-full bg-amber-soft px-1.5 text-[10.5px] font-medium tabular-nums leading-[18px] text-amber">{sub.badge}</span>}
                    {on && <Check className="h-3.5 w-3.5 shrink-0" aria-hidden />}
                  </BaseMenu.LinkItem>
                );
              })}
            </BaseMenu.Group>
          </BaseMenu.Popup>
        </BaseMenu.Positioner>
      </BaseMenu.Portal>
    </BaseMenu.Root>
  );
}

/** Item do trilho recolhido da Sidebar: link com tooltip, ou flyout se tiver subitens. */
export function NavRailItem({ item, currentPath, onNavigate }: { item: NavEntry; currentPath: string; onNavigate?: () => void }) {
  const Icon = item.icon;
  const deep = navActiveDeep(item, currentPath);
  const cls = cn(rowBase, "w-full justify-center", deep ? rowActive : rowIdle, "data-popup-open:bg-soft data-popup-open:text-ink");
  const inner = (
    <>
      {deep && <Marker className="-left-2" />}
      <Icon className={cn("h-4 w-4 shrink-0", deep ? "text-ink-soft" : "text-muted")} strokeWidth={1.65} />
      {!!(item.badge ?? sumBadges(item.items)) && <span className="sr-only">{item.badge ?? sumBadges(item.items)}</span>}
      {!!item.items?.length && <span aria-hidden className="absolute bottom-1 right-1 h-0 w-0 border-b-[4px] border-l-[4px] border-b-current border-l-transparent opacity-40" />}
    </>
  );
  if (item.items?.length) {
    return (
      <NavFlyout item={item} currentPath={currentPath} triggerClassName={cls} onNavigate={onNavigate}>
        {inner}
      </NavFlyout>
    );
  }
  return (
    <DsLink href={item.href ?? "#"} onClick={onNavigate} aria-current={deep ? "page" : undefined} title={item.label} aria-label={item.label} className={cls}>
      {inner}
    </DsLink>
  );
}

/* ------------------------------------------------------------------ */
/* WorkspaceMenu                                                   */
/* ------------------------------------------------------------------ */

export type Workspace = {
  id: string;
  name: string;
  /** Segunda linha: plano, papel ou contagem ("Enterprise", "12 pessoas"). */
  plan?: string;
  /** Logo 32 px (img ou SVG). Sem ele, as iniciais sobre `primary`. */
  logo?: ReactNode;
};

function WorkspaceLogo({ ws, size = 32 }: { ws: Workspace; size?: 24 | 32 }) {
  if (ws.logo) return <span className={cn("grid shrink-0 place-items-center overflow-hidden rounded-lg [&>img]:h-full [&>img]:w-full [&>svg]:h-full [&>svg]:w-full", size === 32 ? "h-8 w-8" : "h-6 w-6 rounded-md")}>{ws.logo}</span>;
  const initials = ws.name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <span aria-hidden className={cn("grid shrink-0 place-items-center bg-primary font-semibold text-on-primary", size === 32 ? "h-8 w-8 rounded-lg text-[12px]" : "h-6 w-6 rounded-md text-[10px]")}>
      {initials}
    </span>
  );
}

/**
 * Seletor de workspace/empresa no topo da sidebar (`<Sidebar header={…}>`):
 * logo, nome e plano; o menu lista os workspaces com atalhos ⌘1…⌘9 e
 * "Adicionar workspace". Use só quando a pessoa tem mais de um workspace.
 */
export function WorkspaceMenu({
  workspaces,
  value,
  onValueChange,
  onAdd,
  addLabel = "Adicionar workspace",
  collapsed = false,
  shortcuts = true,
  label = "Trocar de workspace",
  className,
}: {
  workspaces: Workspace[];
  value: string;
  onValueChange: (id: string) => void;
  onAdd?: () => void;
  addLabel?: string;
  /** Trilho recolhido: só o logo. Repasse o `collapsed` da Sidebar. */
  collapsed?: boolean;
  /** ⌘1…⌘9 (Ctrl no Windows/Linux) trocam de workspace. */
  shortcuts?: boolean;
  label?: string;
  className?: string;
}) {
  const [ref, container] = usePortalContainer();
  const current = workspaces.find((w) => w.id === value) ?? workspaces[0];
  useEffect(() => {
    if (!shortcuts) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.altKey || e.shiftKey) return;
      const n = Number.parseInt(e.key, 10);
      if (!(n >= 1 && n <= 9) || !workspaces[n - 1]) return;
      e.preventDefault();
      onValueChange(workspaces[n - 1].id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shortcuts, workspaces, onValueChange]);
  if (!current) return null;
  return (
    <BaseMenu.Root modal={false}>
      <BaseMenu.Trigger
        ref={ref}
        aria-label={`${label}: ${current.name}`}
        className={cn(
          "flex min-w-0 items-center rounded-lg text-left transition-colors hover:bg-soft data-popup-open:bg-soft",
          collapsed ? "h-10 w-10 justify-center" : "w-full gap-2.5 p-1.5",
          className,
        )}
      >
        <WorkspaceLogo ws={current} />
        {!collapsed && (
          <>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-semibold leading-tight tracking-tight text-ink">{current.name}</span>
              {current.plan && <span className="mt-0.5 block truncate text-[11px] text-muted">{current.plan}</span>}
            </span>
            <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden />
          </>
        )}
      </BaseMenu.Trigger>
      <BaseMenu.Portal container={container}>
        <BaseMenu.Positioner side={collapsed ? "right" : "bottom"} align="start" sideOffset={6} collisionPadding={12} className="z-[100] outline-none">
          <BaseMenu.Popup className={cn(popupClass, "max-h-[var(--available-height)] min-w-[240px] overflow-y-auto p-1.5")} style={{ minWidth: collapsed ? undefined : "max(240px, var(--anchor-width))" }}>
            <BaseMenu.Group>
              <BaseMenu.GroupLabel className="px-2.5 pb-1.5 pt-1 text-[11px] font-medium text-muted">Workspaces</BaseMenu.GroupLabel>
              <BaseMenu.RadioGroup value={current.id} onValueChange={(v) => onValueChange(String(v))}>
                {workspaces.map((ws, i) => (
                  <BaseMenu.RadioItem key={ws.id} value={ws.id} closeOnClick className={cn(flyItem, "gap-2.5 py-2")}>
                    <WorkspaceLogo ws={ws} size={24} />
                    <span className="min-w-0 flex-1 truncate">{ws.name}</span>
                    <BaseMenu.RadioItemIndicator className="flex">
                      <Check className="h-3.5 w-3.5" aria-hidden />
                    </BaseMenu.RadioItemIndicator>
                    {shortcuts && i < 9 && <KbdGroup keys={["mod", String(i + 1)]} size="sm" className="ml-1 opacity-70" />}
                  </BaseMenu.RadioItem>
                ))}
              </BaseMenu.RadioGroup>
            </BaseMenu.Group>
            {onAdd && (
              <>
                <BaseMenu.Separator className="my-1 h-px bg-line" />
                <BaseMenu.Item onClick={onAdd} className={cn(flyItem, "gap-2.5 py-2 text-muted")}>
                  <span aria-hidden className="grid h-6 w-6 place-items-center rounded-md border border-line bg-surface">
                    <Plus className="h-3.5 w-3.5" />
                  </span>
                  {addLabel}
                </BaseMenu.Item>
              </>
            )}
          </BaseMenu.Popup>
        </BaseMenu.Positioner>
      </BaseMenu.Portal>
    </BaseMenu.Root>
  );
}

/* ------------------------------------------------------------------ */
/* Menu da pessoa (rodapé da sidebar)                                  */
/* ------------------------------------------------------------------ */

export type SidebarUser = {
  name: string;
  initials?: string;
  /** Papel ("Admin") ou segunda linha. */
  role?: string;
  email?: string;
  /** Foto. */
  avatar?: string;
  /** Sem `menu`: o rodapé é um link para o perfil. */
  href?: string;
  /** Menu da conta: Conta, Faturamento, Notificações, Sair (o último com separador). */
  menu?: MenuEntry[];
};

/** Rodapé com a pessoa logada; com `menu`, abre um menu (à direita no desktop, para cima no celular). */
export function SidebarUserMenu({ user, collapsed = false, mobile = false }: { user: SidebarUser; collapsed?: boolean; mobile?: boolean }) {
  const face = <Avatar initials={user.initials} name={user.name} src={user.avatar} tint="#28282e" size="sm" />;
  const second = user.email ?? user.role;
  const text = !collapsed && (
    <>
      <span className="min-w-0 flex-1 text-left">
        <span className="block truncate text-[12px] font-medium text-ink">{user.name}</span>
        {second && <span className="mt-0.5 block truncate text-[11px] text-muted">{second}</span>}
      </span>
      {user.menu ? <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden /> : <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden />}
    </>
  );
  const box = cn("flex min-h-16 w-full shrink-0 items-center border-t border-line px-4 py-3 transition-colors hover:bg-soft", collapsed ? "justify-center px-0" : "gap-3");
  if (!user.menu) {
    return (
      <DsLink href={user.href ?? "#"} title={user.name} className={box}>
        {face}
        {text}
      </DsLink>
    );
  }
  const header: MenuEntry = {
    type: "header",
    content: (
      <div className="flex items-center gap-2.5 px-1 py-1">
        <Avatar initials={user.initials} name={user.name} src={user.avatar} tint="#28282e" size="sm" />
        <div className="min-w-0">
          <div className="truncate text-[13px] font-medium text-ink">{user.name}</div>
          {user.email && <div className="truncate text-[12px] text-muted">{user.email}</div>}
        </div>
      </div>
    ),
  };
  return (
    <div className="shrink-0">
      <Menu
        label={`Conta de ${user.name}`}
        trigger={
          <>
            {face}
            {text}
          </>
        }
        items={[header, { type: "separator" }, ...user.menu]}
        side={mobile ? "top" : "right"}
        align="end"
        width={240}
        triggerVariant="bare"
        triggerClassName={cn(box, "!rounded-none data-popup-open:bg-soft")}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* SectionNav: navegação longa de seções (docs, ajuda, configurações)  */
/* ------------------------------------------------------------------ */

export type NavSection = {
  label: string;
  /** Título clicável (opcional). */
  href?: string;
  items: NavSubItem[];
};

/**
 * Navegação de seções para conteúdo longo (documentação, central de ajuda,
 * configurações com muitas páginas): só texto, títulos de seção, subitens na
 * linha-guia, filtro opcional fixo no topo e o item ativo sempre visível.
 * Rola sozinha: coloque numa coluna com altura definida.
 */
export function SectionNav({
  sections,
  currentPath,
  label = "Seções",
  search = false,
  searchPlaceholder = "Filtrar seções…",
  onNavigate,
  className,
}: {
  sections: NavSection[];
  currentPath: string;
  label?: string;
  /** Campo de filtro (use com 20+ itens). */
  search?: boolean;
  searchPlaceholder?: string;
  /** Chamado ao clicar num item (feche a gaveta no celular). */
  onNavigate?: () => void;
  className?: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useNavOpenState();
  const scroller = useRef<HTMLDivElement>(null);
  const q = normalize(query.trim());
  const filtered = useMemo(() => {
    if (!q) return sections;
    const keep = (list: NavSubItem[]): NavSubItem[] =>
      list.flatMap((it) => {
        const kids = it.items ? keep(it.items) : [];
        return normalize(it.label).includes(q) || kids.length ? [{ ...it, items: kids.length ? kids : it.items }] : [];
      });
    return sections.flatMap((s) => (normalize(s.label).includes(q) ? [s] : (() => {
      const items = keep(s.items);
      return items.length ? [{ ...s, items }] : [];
    })()));
  }, [sections, q]);
  // Mantém o item ativo visível (sem rolar a página: só a coluna).
  useEffect(() => {
    const box = scroller.current;
    const el = box?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!box || !el) return;
    const top = el.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop;
    if (top < box.scrollTop || top > box.scrollTop + box.clientHeight - 40) box.scrollTop = Math.max(0, top - box.clientHeight / 3);
  }, [currentPath]);
  // Com filtro, tudo aberto.
  const openMap = q ? new Proxy(open, { get: () => true }) : open;
  return (
    <nav aria-label={label} className={cn("flex min-h-0 flex-col", className)}>
      {search && (
        <div className="relative mb-2 shrink-0 px-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder.replace(/…$/, "")}
            className="h-9 w-full rounded-lg border border-line bg-surface pl-8 pr-8 text-[13px] text-ink placeholder:text-muted [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button type="button" onClick={() => setQuery("")} aria-label="Limpar filtro" className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-muted hover:bg-soft hover:text-ink">
              <X className="h-3.5 w-3.5" aria-hidden />
            </button>
          )}
        </div>
      )}
      <div ref={scroller} tabIndex={-1} className="min-h-0 flex-1 overflow-y-auto px-1 pb-4 outline-none">
        {filtered.length === 0 && <p className="m-0 px-2 py-6 text-center text-[12.5px] text-muted">Nada encontrado para “{query.trim()}”.</p>}
        {filtered.map((section) => (
          <div key={section.label} className="mb-3">
            {section.href ? (
              <DsLink
                href={section.href}
                onClick={onNavigate}
                aria-current={navMatches(section, currentPath) && !navHasActiveChild(section, currentPath) ? "page" : undefined}
                className="flex h-8 items-center rounded-md px-2 text-[12.5px] font-semibold text-ink hover:bg-soft focus-visible:outline-offset-[-2px]"
              >
                {section.label}
              </DsLink>
            ) : (
              <p className="m-0 flex h-8 items-center px-2 text-[12.5px] font-semibold text-ink">{section.label}</p>
            )}
            <SubList items={section.items} currentPath={currentPath} open={openMap} setOpen={setOpen} idPrefix={section.label} depth={1} onNavigate={onNavigate} inset="text" />
          </div>
        ))}
      </div>
    </nav>
  );
}
