"use client";

import { Menu as BaseMenu } from "@base-ui/react/menu";
import { Check, ChevronRight, MoreHorizontal, PanelLeft, Search } from "lucide-react";
import { useEffect, useRef, type ComponentType, type ReactNode } from "react";
import { cn } from "../lib/cn";
import { usePortalContainer } from "../lib/portal";
import { popupClass } from "./overlays";
import { Avatar, DsLink } from "./primitives";

/* ================================================================== */
/* StickyHeader                                                        */
/* ================================================================== */

/**
 * Cabeçalho que gruda no topo do ancestral rolável e marca `data-stuck`
 * quando grudou. O CSS usa o atributo para compactar (esconder descrição,
 * reduzir título, mostrar a linha inferior). Também publica
 * `--pinned-header-height` no scroller, para o foco de teclado não ficar
 * escondido atrás do cabeçalho.
 */
export function StickyHeader({
  children,
  className,
  enabled = true,
  scroller: scrollerSelector,
  scrollerKey,
}: {
  children: ReactNode;
  className?: string;
  enabled?: boolean;
  /** Seletor de um irmão que rola no lugar do ancestral (cabeçalho fixo acima de painel rolável). */
  scroller?: string;
  /** Reanexa quando o irmão rolável é recriado (troca de rota). */
  scrollerKey?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const header = ref.current;
    if (!header || !enabled) return;
    let parent: HTMLElement | null = null;
    if (scrollerSelector) {
      parent = header.parentElement?.querySelector<HTMLElement>(scrollerSelector) ?? null;
    } else {
      parent = header.parentElement;
      while (parent && !/(auto|scroll|hidden)/.test(getComputedStyle(parent).overflowY)) parent = parent.parentElement;
    }
    if (!parent) return;
    const scroller = parent;
    const external = Boolean(scrollerSelector);
    let frame = 0;
    const sync = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const stuck = external
          ? scroller.scrollTop > 8
          : getComputedStyle(header).position === "sticky" &&
            scroller.scrollTop > 0 &&
            header.getBoundingClientRect().top <= scroller.getBoundingClientRect().top + 1;
        header.toggleAttribute("data-stuck", stuck);
        const prop = external ? "--outer-header-height" : "--pinned-header-height";
        const height = header.getBoundingClientRect().height;
        scroller.style.setProperty(prop, `${height + (external ? 0 : 12)}px`);
        // Altura exata do cabeçalho: PageToolbar gruda colado logo abaixo dele.
        if (!external) scroller.style.setProperty("--page-header-height", `${height}px`);
      });
    };
    scroller.addEventListener("scroll", sync, { passive: true });
    const observer = new ResizeObserver(sync);
    observer.observe(scroller);
    observer.observe(header);
    sync();
    return () => {
      cancelAnimationFrame(frame);
      scroller.removeEventListener("scroll", sync);
      observer.disconnect();
    };
  }, [enabled, scrollerSelector, scrollerKey]);
  return (
    <header ref={ref} className={cn(enabled && "sticky-page-header", className)}>
      {children}
    </header>
  );
}

/**
 * Barra da página (FilterBar, visões salvas, busca) que gruda COLADA abaixo do
 * cabeçalho fixo (PageHeading). Regra de anatomia: o que é da página fica
 * junto — se o título está visível, a barra que filtra a lista também está.
 * Use em listas com mais de uma tela de altura; abaixo disso, dispensável.
 *
 *   <PageHeading title="Clientes" actions={…} />
 *   <PageToolbar><SavedViews …/><FilterBar …/></PageToolbar>
 *   <DataTable … />
 */
export function PageToolbar({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const bar = ref.current;
    if (!bar) return;
    let scroller = bar.parentElement;
    while (scroller && !/(auto|scroll)/.test(getComputedStyle(scroller).overflowY)) scroller = scroller.parentElement;
    if (!scroller) return;
    const box = scroller;
    let frame = 0;
    const sync = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const headerH = parseFloat(getComputedStyle(box).getPropertyValue("--page-header-height")) || 0;
        const stuck = getComputedStyle(bar).position === "sticky" && box.scrollTop > 0 && bar.getBoundingClientRect().top <= box.getBoundingClientRect().top + headerH + 1;
        bar.toggleAttribute("data-stuck", stuck);
        box.toggleAttribute("data-toolbar-stuck", stuck);
      });
    };
    box.addEventListener("scroll", sync, { passive: true });
    sync();
    return () => {
      cancelAnimationFrame(frame);
      box.removeEventListener("scroll", sync);
      box.removeAttribute("data-toolbar-stuck");
    };
  }, []);
  return (
    <div ref={ref} className={cn("page-toolbar space-y-3", className)}>
      {children}
    </div>
  );
}

/* ================================================================== */
/* Breadcrumb / ContextBar                                             */
/* ================================================================== */

export type Crumb = { label: string; href?: string };

/**
 * Trilha. REGRA: só ancestrais, nunca a página atual (o título é a página
 * atual). Se o único ancestral é o item da sidebar, não renderize trilha.
 */
export function Breadcrumb({ items, className }: { items: Crumb[]; className?: string }) {
  if (!items.length) return null;
  return (
    <nav aria-label="Trilha de navegação" className={cn("flex flex-wrap items-center gap-x-1.5 text-[13px]", className)}>
      {items.map((item, i) => (
        <span key={`${item.label}-${i}`} className="inline-flex items-center gap-x-1.5">
          {i > 0 && <ChevronRight aria-hidden className="h-3.5 w-3.5 text-line-strong" />}
          {item.href ? (
            <DsLink href={item.href} className="text-muted hover:text-ink">
              {item.label}
            </DsLink>
          ) : (
            <span className="text-muted">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

/**
 * Barra de contexto de uma página de REGISTRO (ciclo, tarefa, reunião,
 * membro). Uma linha, 44px, ancestrais como links, marca da entidade raiz à
 * esquerda e sinais (alertas) à direita. Substitui o cabeçalho inteiro do pai.
 */
export function ContextBar({
  items,
  leading,
  trailing,
  className,
}: {
  items: Crumb[];
  leading?: ReactNode;
  trailing?: ReactNode;
  className?: string;
}) {
  return (
    <StickyHeader
      className={cn(
        "context-bar page-gutter flex min-h-11 flex-wrap items-center gap-x-2 gap-y-1 border-b border-line bg-surface text-[13px]",
        className,
      )}
    >
      <nav aria-label="Trilha de navegação" className="flex min-w-0 flex-1 flex-wrap items-center gap-x-1.5">
        {leading}
        {items.map((item, i) => (
          <span key={`${item.label}-${i}`} className="inline-flex min-w-0 items-center gap-x-1.5">
            {i > 0 && <ChevronRight aria-hidden className="h-3.5 w-3.5 shrink-0 text-line-strong" />}
            {item.href ? (
              <DsLink href={item.href} className={cn("truncate hover:text-ink", i === 0 ? "font-medium text-ink" : "text-muted")}>
                {item.label}
              </DsLink>
            ) : (
              <span className="truncate text-muted">{item.label}</span>
            )}
          </span>
        ))}
      </nav>
      {trailing}
    </StickyHeader>
  );
}

/* ================================================================== */
/* PageHeading                                                         */
/* ================================================================== */

/**
 * Título da tela + descrição opcional + ações à direita. Fixo por padrão.
 * `compact` = h2 de 18px para seções dentro de uma entidade (abas).
 */
export function PageHeading({
  title,
  description,
  actions,
  compact = false,
  sticky = true,
  crumbs,
  kicker,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  compact?: boolean;
  sticky?: boolean;
  crumbs?: Crumb[];
  /** Linha acima do título (ex.: data na home). */
  kicker?: ReactNode;
}) {
  const Heading = compact ? "h2" : "h1";
  return (
    <StickyHeader enabled={sticky} className={cn("page-heading", compact && "page-heading-compact")}>
      {crumbs && crumbs.length > 0 && <Breadcrumb items={crumbs} className="page-heading-crumbs" />}
      <div className="min-w-0">
        {kicker && <p className="m-0 mb-2 text-[11px] text-muted first-letter:uppercase">{kicker}</p>}
        <Heading>{title}</Heading>
        {description && <p data-header-description="">{description}</p>}
      </div>
      {actions && <div className="page-heading-actions">{actions}</div>}
    </StickyHeader>
  );
}

/* ================================================================== */
/* Tabs                                                                */
/* ================================================================== */

export type TabItem = {
  id: string;
  label: string;
  href?: string;
  /** Só quando pede ação (não lidas, bloqueadas). Nunca total. */
  count?: number;
};

/**
 * Abas de seção de uma entidade: sublinhado de 2px ink na ativa, 12px.
 * Com href viram links (aria-current=page); sem href, botões (aria-pressed).
 * Para alternar VISUALIZAÇÃO (lista/cards), use SegmentedControl, não Tabs.
 */
export function Tabs({
  items,
  value,
  onChange,
  label,
  className,
}: {
  items: TabItem[];
  value: string;
  onChange?: (id: string) => void;
  label: string;
  className?: string;
}) {
  return (
    <div className={cn("entity-tabs flex flex-wrap items-center gap-1", className)} aria-label={label} role="navigation">
      {items.map((t) => {
        const on = t.id === value;
        const cls = cn(
          "entity-tab shrink-0 rounded-t-lg border-b-2 px-2.5 pb-2.5 pt-2 text-[12px]",
          on ? "border-ink font-medium text-ink" : "border-transparent text-muted hover:text-ink",
        );
        const text = t.count ? `${t.label} (${t.count})` : t.label;
        return t.href ? (
          <DsLink key={t.id} href={t.href} aria-current={on ? "page" : undefined} className={cls}>
            {text}
          </DsLink>
        ) : (
          <button key={t.id} type="button" aria-pressed={on} onClick={() => onChange?.(t.id)} className={cls}>
            {text}
          </button>
        );
      })}
    </div>
  );
}

/* ================================================================== */
/* SegmentedControl                                                    */
/* ================================================================== */

/** Alterna visualização ou recorte (Lista | Cards; Plano | Ciclos | Cronograma). 2–4 opções. */
export function SegmentedControl<T extends string>({
  label,
  value,
  onChange,
  options,
  className,
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string; icon?: ReactNode }[];
  className?: string;
}) {
  return (
    <div className={cn("segmented-control", className)} role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" title={o.label} aria-pressed={value === o.value} onClick={() => onChange(o.value)}>
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ================================================================== */
/* ActionMenu                                                          */
/* ================================================================== */

export type MenuAction = {
  label: string;
  icon?: ReactNode;
  onSelect?: () => void;
  href?: string;
  disabled?: boolean;
  tone?: "neutral" | "danger";
  checked?: boolean;
  /** Separador acima deste item. */
  separator?: boolean;
};

export function actionMenuTriggerClass(variant: "ghost" | "primary" = "ghost", custom = false) {
  return cn(
    "inline-flex items-center justify-center gap-1.5 rounded-lg outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent/40",
    variant === "primary"
      ? "ui-button ui-button-primary h-9 bg-primary px-3 text-[13px] font-medium text-on-primary hover:bg-primary/90 data-popup-open:bg-primary/85"
      : "h-8 text-muted hover:bg-soft hover:text-ink data-popup-open:bg-soft data-popup-open:text-ink",
    variant === "ghost" && (custom ? "px-2.5 text-[12.5px]" : "w-8"),
  );
}

/**
 * Menu "⋯" de ações secundárias de linha, card ou cabeçalho. Ação principal
 * fica visível como botão; o resto entra aqui. Destrutiva por último, com
 * separador e tone=danger.
 */
export function ActionMenu({
  actions,
  label = "Mais ações",
  trigger,
  align = "end",
  className,
  variant = "ghost",
  defaultOpen,
}: {
  actions: MenuAction[];
  label?: string;
  trigger?: ReactNode;
  align?: "start" | "end";
  className?: string;
  variant?: "ghost" | "primary";
  defaultOpen?: boolean;
}) {
  const [triggerRef, container] = usePortalContainer();
  return (
    <BaseMenu.Root modal={false} defaultOpen={defaultOpen}>
      <BaseMenu.Trigger ref={triggerRef} aria-label={label} title={label} className={cn(actionMenuTriggerClass(variant, !!trigger), className)}>
        {trigger ?? <MoreHorizontal className="h-4 w-4" aria-hidden />}
      </BaseMenu.Trigger>
      <BaseMenu.Portal container={container}>
        <BaseMenu.Positioner align={align} sideOffset={6} collisionPadding={12} className="z-[100] outline-none">
          <BaseMenu.Popup className={cn(popupClass, "min-w-[180px] p-1.5")}>
            {actions.map((action, index) => {
              const cls = cn(
                "flex w-full cursor-default items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13.5px] outline-none data-highlighted:bg-soft data-disabled:opacity-40",
                action.tone === "danger" && "text-rose data-highlighted:bg-rose-soft/60",
              );
              const body = (
                <>
                  {action.icon && <span className="flex shrink-0 items-center [&_svg]:h-4 [&_svg]:w-4">{action.icon}</span>}
                  <span className="min-w-0 flex-1 truncate">{action.label}</span>
                  {action.checked && <Check className="h-4 w-4 shrink-0" aria-hidden />}
                </>
              );
              return (
                <div key={`${action.label}-${index}`}>
                  {action.separator && index > 0 && <BaseMenu.Separator className="my-1 h-px bg-line" />}
                  {action.href ? (
                    <BaseMenu.LinkItem href={action.href} closeOnClick className={cls}>
                      {body}
                    </BaseMenu.LinkItem>
                  ) : (
                    <BaseMenu.Item onClick={action.onSelect} disabled={action.disabled} className={cls}>
                      {body}
                    </BaseMenu.Item>
                  )}
                </div>
              );
            })}
          </BaseMenu.Popup>
        </BaseMenu.Positioner>
      </BaseMenu.Portal>
    </BaseMenu.Root>
  );
}

/* ================================================================== */
/* Sidebar                                                             */
/* ================================================================== */

export type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  /** Prefixo que marca o item como ativo; padrão = href. */
  match?: string;
  /** Contador de atenção (alertas). */
  badge?: number;
};
export type NavGroup = { label: string; items: NavItem[] };

/**
 * Navegação principal do app: marca + busca + grupos rotulados + rodapé com a
 * pessoa. 224px aberta, 64px recolhida (só ícones com title), drawer abaixo de
 * 768px. Item ativo = superfície branca com borda e sombra mínima.
 * Máximo recomendado: 10 itens em até 2 grupos.
 */
export function Sidebar({
  product,
  workspace,
  mark,
  groups,
  currentPath,
  collapsed = false,
  onToggle,
  onSearch,
  user,
  footer,
  mobileOpen = false,
}: {
  product: string;
  workspace?: string;
  mark?: ReactNode;
  groups: NavGroup[];
  currentPath: string;
  collapsed?: boolean;
  onToggle?: () => void;
  onSearch?: () => void;
  user?: { name: string; initials: string; role?: string; href?: string };
  footer?: ReactNode;
  mobileOpen?: boolean;
}) {
  const isActive = (item: NavItem) => {
    const base = (item.match ?? item.href).split("?")[0];
    return base === "/" ? currentPath === "/" : currentPath === base || currentPath.startsWith(`${base}/`);
  };
  const rail = collapsed && !mobileOpen;
  return (
    <aside
      aria-label="Menu principal"
      className={cn(
        "z-40 flex shrink-0 flex-col border-r border-line bg-rail transition-[width] duration-200",
        "fixed inset-y-12 bottom-0 left-0 md:static md:h-full",
        mobileOpen ? "flex w-[250px]" : "hidden md:flex",
        rail ? "md:w-[64px]" : "md:w-[224px]",
      )}
    >
      <div className={cn("pb-5 pt-5", rail ? "px-2" : "px-3.5")}>
        <div className={cn("flex items-center", rail ? "flex-col gap-3" : "justify-between gap-2")}>
          <div className="flex min-w-0 items-center gap-2.5">
            {mark ?? <ProductMark />}
            {!rail && (
              <div className="min-w-0">
                <div className="text-[14px] font-semibold tracking-tight">{product}</div>
                {workspace && <div className="mt-0.5 truncate text-[11px] text-muted">{workspace}</div>}
              </div>
            )}
          </div>
          {onToggle && (
            <button
              type="button"
              onClick={onToggle}
              aria-label={rail ? "Expandir menu" : "Recolher menu"}
              aria-expanded={!rail}
              className="hidden h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-soft md:inline-flex"
            >
              <PanelLeft className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        {onSearch && (
          <button
            type="button"
            onClick={onSearch}
            aria-label="Buscar"
            className={cn(
              "mt-4 flex h-9 w-full items-center gap-2 rounded-lg border border-line bg-surface text-[12.5px] text-muted hover:border-line-strong",
              rail ? "justify-center" : "px-2.5",
            )}
          >
            <Search className="h-4 w-4 shrink-0" />
            {!rail && (
              <>
                <span className="flex-1 text-left">Buscar…</span>
                <span className="text-[11px]">⌘K</span>
              </>
            )}
          </button>
        )}
      </div>
      <nav className="min-h-0 flex-1 overflow-y-auto px-2.5" aria-label="Navegação">
        {groups.map((group, gi) => (
          <div key={group.label}>
            {gi > 0 && <div className="mx-2.5 my-4 h-px bg-line" />}
            {!rail && (
              <p className="m-0 mb-2 px-2.5 text-[10px] font-medium uppercase tracking-[0.1em] text-muted">{group.label}</p>
            )}
            {group.items.map((item) => {
              const active = isActive(item);
              const Icon = item.icon;
              return (
                <DsLink
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  title={rail ? item.label : undefined}
                  className={cn(
                    "relative mb-1 flex h-9 items-center rounded-lg border text-[12.5px] transition-colors duration-150",
                    rail ? "justify-center" : "gap-2.5 px-2.5",
                    active
                      ? "border-line-strong bg-surface font-medium text-ink shadow-surface" // borda firme: visível mesmo quando rail ≈ surface (Ledger, escuro)
                      : "border-transparent text-muted hover:bg-soft hover:text-ink",
                  )}
                >
                  {/* Gesto de marca: marcador Royal Gold no item ativo (token --ds-nav-marker). */}
                  {active && <span aria-hidden className={cn("absolute top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r-full bg-nav-marker", rail ? "-left-2" : "-left-[10px]")} />}
                  <Icon className={cn("h-4 w-4 shrink-0", active ? "text-ink-soft" : "text-muted")} strokeWidth={1.65} />
                  {!rail && <span className="flex-1 truncate">{item.label}</span>}
                  {!!item.badge && (
                    <span
                      className={cn(
                        "rounded-full bg-amber-soft px-1.5 text-[10.5px] font-medium tabular-nums leading-[18px] text-amber",
                        rail && "sr-only",
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </DsLink>
              );
            })}
          </div>
        ))}
      </nav>
      {/* Rodapé com o mesmo respiro da navegação: qualquer filho (Button,
          SyncStatus, card de plano) cabe no trilho sem vazar pelas bordas. */}
      {footer && <div className={cn("mt-2 flex shrink-0 flex-col gap-2 pt-2 [&>.ui-button]:w-full", rail ? "items-center px-2" : "px-2.5")}>{footer}</div>}
      {user && (
        <DsLink
          href={user.href ?? "#"}
          title={user.name}
          className={cn(
            "mt-3 flex min-h-16 shrink-0 items-center border-t border-line px-4 py-3 transition-colors hover:bg-soft",
            rail ? "justify-center px-0" : "gap-3",
          )}
        >
          <Avatar initials={user.initials} tint="#28282e" size="sm" />
          {!rail && (
            <>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[12px] font-medium">{user.name}</div>
                {user.role && <div className="mt-0.5 text-[11px] text-muted">{user.role}</div>}
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-muted" />
            </>
          )}
        </DsLink>
      )}
    </aside>
  );
}

/** Marca-padrão (grafo de três nós, um dourado). Troque pela marca do produto. */
export function ProductMark({ size = 28 }: { size?: number }) {
  return (
    // ds-audit-ignore-start hex-color: logotipo (cores fixas da marca G4 OS)
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" aria-hidden>
      <rect width="28" height="28" rx="8" fill="var(--ds-ink)" />
      <path d="m9 12 10-2.5-2.5 9.5L9 12Z" stroke="var(--ds-page)" strokeWidth="1.1" />
      <circle cx="9" cy="12" r="2" fill="var(--ds-page)" />
      <circle cx="19" cy="9.5" r="2" fill="var(--ds-page)" />
      <circle cx="16.5" cy="19" r="2.3" fill="var(--ds-accent)" />
    </svg>
    // ds-audit-ignore-end
  );
}

/** Indicador de sincronização no pé da sidebar. */
export function SyncStatus({ state, label, collapsed }: { state: "ok" | "pending" | "error"; label: string; collapsed?: boolean }) {
  const dot = state === "error" ? "bg-rose" : state === "pending" ? "bg-amber" : "bg-ok";
  return (
    <div role="status" title={label} className={cn("flex items-center gap-2 px-4 text-[11px] text-muted", collapsed && "justify-center px-0")}>
      <span className={cn("inline-block h-1.5 w-1.5 shrink-0 rounded-full", dot)} />
      {!collapsed && <span className="truncate">{label}</span>}
    </div>
  );
}
