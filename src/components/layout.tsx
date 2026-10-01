"use client";

import { Ellipsis, Menu, X } from "lucide-react";
import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import { cn } from "../lib/cn";
import { Toaster } from "./feedback";
import { Breadcrumb, PageHeading, StickyHeader, Tabs, type Crumb, type NavItem, type TabItem } from "./navigation";
import { DsLink } from "./primitives";
import { EntityMark } from "./primitives";
import { inertProps } from "../lib/inert";

/**
 * Casca do app: sidebar à esquerda (ou topo+drawer no celular), conteúdo que
 * rola sozinho, toaster montado. Adicione `className="ds-app"` ao <html>
 * para travar a rolagem do documento (só o <main> rola).
 *
 *   <AppShell product="Acme CRM" sidebar={(p) => <Sidebar {...p} ... />}>
 *
 * Navegação no celular (< 768px), `mobileNav`:
 *   "drawer"  (padrão) cabeçalho com ☰ que abre a sidebar como gaveta.
 *   "tabbar"  pílula flutuante embaixo com 3–4 destinos principais (`tabs`);
 *             se houver mais itens na sidebar, o último vira "Mais" e abre a gaveta.
 *   "both"    ☰ no cabeçalho E pílula embaixo (apps com muitas seções, poucas frequentes).
 * Regra: pílula para o que a pessoa usa todo dia (≤ 4); o resto fica no menu.
 */
export function AppShell({
  product,
  workspace,
  sidebar,
  banner,
  children,
  mobileNav = "drawer",
  tabs,
  currentPath,
  headerActions,
}: {
  product: string;
  workspace?: string;
  /** Recebe mobileOpen e deve repassar para <Sidebar mobileOpen>. */
  sidebar: (state: { mobileOpen: boolean; close: () => void }) => ReactNode;
  /** Faixa de alerta global acima do conteúdo (armazenamento, conexão). */
  banner?: ReactNode;
  children: ReactNode;
  mobileNav?: "drawer" | "tabbar" | "both";
  /** Destinos da pílula (3–4). Use os mesmos NavItem da sidebar. */
  tabs?: NavItem[];
  /** Rota atual, para marcar a aba ativa. */
  currentPath?: string;
  /** Ações à direita no cabeçalho do celular (notificações, avatar). */
  headerActions?: ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMobileOpen(false);
    const desktop = window.matchMedia("(min-width: 768px)");
    const onChange = () => desktop.matches && setMobileOpen(false);
    desktop.addEventListener("change", onChange);
    window.addEventListener("keydown", onKey);
    return () => {
      desktop.removeEventListener("change", onChange);
      window.removeEventListener("keydown", onKey);
    };
  }, []);
  const close = () => setMobileOpen(false);
  const hasTabbar = mobileNav !== "drawer" && !!tabs?.length;
  const showBurger = mobileNav !== "tabbar" || !hasTabbar;
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-page md:flex-row">
      <a href="#main-content" className="sr-only z-[100] rounded-lg bg-surface px-4 py-2 focus:not-sr-only focus:fixed focus:left-3 focus:top-3">
        Pular para o conteúdo
      </a>
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-line bg-surface px-3 md:hidden">
        {showBurger && (
          <button
            type="button"
            aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((o) => !o)}
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-soft"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        )}
        <span className={cn("text-sm font-semibold", !showBurger && "pl-1")}>{product}</span>
        {headerActions ? <div className="ml-auto flex items-center gap-1">{headerActions}</div> : workspace && <span className="ml-auto truncate text-[10px] text-muted">{workspace}</span>}
      </header>
      {mobileOpen && <button type="button" aria-label="Fechar menu" onClick={close} className="fixed inset-x-0 bottom-0 top-12 z-30 bg-black/15 md:hidden" />}
      {sidebar({ mobileOpen, close })}
      <main
        {...inertProps(mobileOpen)}
        id="main-content"
        tabIndex={-1}
        className={cn("flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-page outline-none", hasTabbar && "max-md:pb-[calc(76px+env(safe-area-inset-bottom))]")}
      >
        {banner}
        {children}
      </main>
      {hasTabbar && (
        <BottomNav
          items={tabs!}
          currentPath={currentPath ?? ""}
          more={mobileNav === "tabbar" ? { open: mobileOpen, onToggle: () => setMobileOpen((o) => !o) } : undefined}
        />
      )}
      <Toaster />
    </div>
  );
}

/**
 * Barra de navegação em pílula, flutuando no rodapé (só no celular por padrão).
 * 3–4 destinos + "Mais" opcional. Ativo = cor de ação (primary) e rótulo em
 * peso 500. Contadores só para o que pede atenção.
 */
export function BottomNav({
  items,
  currentPath,
  more,
  className,
  alwaysVisible = false,
}: {
  items: NavItem[];
  currentPath: string;
  /** Mostra "Mais" como último item (abre a gaveta/menu completo). */
  more?: { open: boolean; onToggle: () => void; label?: string };
  className?: string;
  /** true = também no desktop (apps que só existem como mobile). */
  alwaysVisible?: boolean;
}) {
  const isActive = (item: NavItem) => {
    const base = (item.match ?? item.href).split("?")[0];
    return base === "/" ? currentPath === "/" : currentPath === base || currentPath.startsWith(`${base}/`);
  };
  const cell = "relative flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 text-[11px] leading-tight transition-colors";
  return (
    <nav
      aria-label="Navegação principal"
      className={cn(
        "fixed inset-x-3 z-[35] mx-auto flex max-w-[480px] items-stretch gap-1 rounded-2xl border border-line bg-popover/90 p-1.5 shadow-toast backdrop-blur-md",
        "bottom-[calc(12px+env(safe-area-inset-bottom))]",
        !alwaysVisible && "md:hidden",
        className,
      )}
    >
      {items.slice(0, more ? 4 : 5).map((item) => {
        const on = isActive(item);
        const Icon = item.icon;
        return (
          <DsLink
            key={item.href}
            href={item.href}
            aria-current={on ? "page" : undefined}
            className={cn(cell, on ? "bg-soft font-medium text-primary" : "text-muted hover:text-ink")}
          >
            <span className="relative">
              <Icon className="h-5 w-5" strokeWidth={on ? 2 : 1.65} />
              {!!item.badge && (
                <span className="absolute -right-2 -top-1 inline-grid h-4 min-w-4 place-items-center rounded-full bg-rose px-1 text-[10px] font-semibold tabular-nums text-on-ink ring-2 ring-popover">
                  {item.badge > 99 ? "99+" : item.badge}
                </span>
              )}
            </span>
            <span className="max-w-full truncate">{item.label}</span>
          </DsLink>
        );
      })}
      {more && (
        <button type="button" onClick={more.onToggle} aria-expanded={more.open} className={cn(cell, more.open ? "bg-soft font-medium text-primary" : "text-muted hover:text-ink")}>
          <Ellipsis className="h-5 w-5" strokeWidth={1.65} />
          <span>{more.label ?? "Mais"}</span>
        </button>
      )}
    </nav>
  );
}

/** Faixa de alerta global (topo do main). */
export function ShellBanner({ children, tone = "warn" }: { children: ReactNode; tone?: "warn" | "bad" }) {
  return (
    <div role="alert" className={cn("shrink-0 border-b px-5 py-2 text-[13px]", tone === "bad" ? "border-rose/20 bg-rose-soft text-rose" : "border-amber/20 bg-amber-soft text-amber")}>
      {children}
    </div>
  );
}

/**
 * Cabeçalho de uma ENTIDADE com seções (cliente, projeto, conta): trilha,
 * marca + nome + descrição + ações, abas. Gruda no topo e compacta ao rolar
 * (esconde trilha e descrição, reduz marca e título). Ações com rótulo
 * longo marcam o texto com `data-collapse-label` para sumir quando compacta.
 */
export function EntityHeader({
  name,
  description,
  mark,
  tint,
  crumbs,
  meta,
  actions,
  tabs,
  activeTab,
  onTabChange,
}: {
  name: string;
  description?: ReactNode;
  mark?: ReactNode;
  tint?: string;
  crumbs?: Crumb[];
  /** Linha de sinais ao lado do título (saúde, pessoas, badge de status). */
  meta?: ReactNode;
  actions?: ReactNode;
  tabs?: TabItem[];
  activeTab?: string;
  onTabChange?: (id: string) => void;
}) {
  return (
    <StickyHeader className="entity-header page-gutter border-b border-line bg-surface pt-5">
      {crumbs && crumbs.length > 0 && <Breadcrumb items={crumbs} className="entity-crumb mb-3" />}
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="flex min-w-0 items-start gap-3">
          {mark ?? <EntityMark name={name} tint={tint} className="h-10 w-10 text-[14px]" />}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h1 className="entity-title m-0 text-[22px] font-semibold leading-tight tracking-tight">{name}</h1>
              {meta}
            </div>
            {description && <p className="entity-description m-0 mt-1 max-w-[620px] text-[13px] leading-relaxed text-muted">{description}</p>}
          </div>
        </div>
        {actions && <div className="entity-actions flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {tabs && tabs.length > 0 ? (
        <Tabs items={tabs} value={activeTab ?? tabs[0].id} onChange={onTabChange} label={`Seções de ${name}`} className="mt-4" />
      ) : (
        <div className="pb-5" />
      )}
    </StickyHeader>
  );
}

/** Coluna de leitura (620px) centralizada, para páginas de texto e formulários longos. */
export function ReadingColumn({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mx-auto w-full max-w-[var(--reading-max,620px)]", className)}>{children}</div>;
}

/** Layout conteúdo + painel lateral (detalhe de registro). Empilha abaixo de 1024px. */
/**
 * Registro: conteúdo principal + coluna de propriedades. No desktop a coluna
 * gruda abaixo do cabeçalho fixo (anatomia "Registro"); se for mais alta que a
 * tela, rola sozinha. `stickyAside={false}` para colunas que devem rolar junto.
 */
export function SplitLayout({ main, aside, asideWidth = 320, stickyAside = true }: { main: ReactNode; aside: ReactNode; asideWidth?: number; stickyAside?: boolean }) {
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_var(--aside)]" style={{ ["--aside" as string]: `${asideWidth}px` }}>
      <div className="min-w-0">{main}</div>
      <aside className={cn("min-w-0 space-y-6", stickyAside && "page-aside")}>{aside}</aside>
    </div>
  );
}

export type SettingsNavItem = {
  href: string;
  label: string;
  icon?: ComponentType<{ className?: string; strokeWidth?: number | string }>;
  /** Marcador à direita (contagem, "Novo"). */
  badge?: ReactNode;
};

/**
 * Página de configurações: subnavegação à esquerda (vira faixa rolável de
 * abas abaixo de 1024px) e conteúdo com título da seção. Vai dentro de <Page>.
 *
 *   <Page><SettingsLayout nav={secoes} current="#/config/perfil" title="Perfil">…</SettingsLayout></Page>
 */
export function SettingsLayout({
  nav,
  current,
  title,
  description,
  actions,
  heading = "Configurações",
  headingDescription,
  navLabel = "Seções de configuração",
  children,
}: {
  nav: SettingsNavItem[];
  /** href do item ativo. */
  current: string;
  title: string;
  description?: ReactNode;
  /** Ações da seção (ao lado do título). */
  actions?: ReactNode;
  /** Título da página inteira. `null` esconde. */
  heading?: string | null;
  headingDescription?: string;
  navLabel?: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-[1080px]">
      {/* Título da página fixo (compacta ao rolar) e subnavegação fixa logo abaixo:
          o que é da página fica junto; só o conteúdo da seção rola. */}
      {heading && <PageHeading title={heading} description={headingDescription} />}
      <div className={cn("grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-8", heading && "mt-6")}>
        <nav
          aria-label={navLabel}
          className="-mx-1 flex gap-1 overflow-x-auto border-b border-line px-1 pb-2 lg:sticky lg:top-[var(--pinned-header-height,0px)] lg:mx-0 lg:flex-col lg:self-start lg:overflow-visible lg:border-0 lg:px-0 lg:pb-0 lg:transition-[top] lg:duration-200"
        >
          {nav.map((it) => {
            const on = it.href === current;
            const Icon = it.icon;
            return (
              <DsLink
                key={it.href}
                href={it.href}
                aria-current={on ? "page" : undefined}
                className={cn(
                  "flex h-9 shrink-0 items-center gap-2.5 rounded-lg border px-2.5 text-[13px]",
                  on ? "border-line bg-surface font-medium text-ink shadow-surface" : "border-transparent text-muted hover:bg-soft hover:text-ink",
                )}
              >
                {Icon && <Icon className="h-4 w-4 shrink-0" strokeWidth={1.65} />}
                <span className="truncate">{it.label}</span>
                {it.badge != null && <span className="ml-auto pl-2 text-[11px] tabular-nums text-muted">{it.badge}</span>}
              </DsLink>
            );
          })}
        </nav>
        <div className="min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="m-0 text-[18px] font-semibold tracking-tight">{title}</h2>
              {description && <p className="m-0 mt-1 text-[13px] leading-relaxed text-muted">{description}</p>}
            </div>
            {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
          </div>
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}

/** Seção de configuração: rótulo e explicação à esquerda, campos à direita (empilha abaixo de 1024px). */
export function SettingsSection({ title, description, children, className }: { title: string; description?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("grid gap-4 border-b border-line py-6 first:pt-0 last:border-0 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-8", className)}>
      <div>
        <h3 className="m-0 text-[13.5px] font-medium">{title}</h3>
        {description && <p className="m-0 mt-1 text-[12.5px] leading-relaxed text-muted">{description}</p>}
      </div>
      <div className="min-w-0 max-w-[560px]">{children}</div>
    </section>
  );
}
