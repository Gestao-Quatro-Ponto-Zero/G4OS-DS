import {
  BarChart3,
  Bell,
  Code2,
  House,
  LayoutGrid,
  Mail,
  MessageSquare,
  MessagesSquare,
  NotebookPen,
  PanelLeft,
  PenTool,
  Pin,
  Rocket,
  Search,
  Sparkles,
  UserPlus,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { useState, type ComponentType, type ReactNode } from "react";
import {
  AppIcon,
  AppShell,
  Avatar,
  CommandPalette,
  Menu,
  QuickActionsField,
  SidebarProgressCard,
  TrialBanner,
  cn,
  notify,
  useCommandShortcut,
  type Command,
  type NavItem,
} from "@g4os/ds";
import { apps } from "../data/apps";
import { me, org } from "../data/workspace";
import { frameHref, go, goTo } from "./frame-route";

/*
 * Casca do "Estúdio G4": o agente de marketing e operações da Acme.
 * Sidebar com workspace, ações rápidas (⌘K), navegação, ferramentas (glifos
 * coloridos), conversas fixadas e recentes, e no rodapé o progresso de
 * "Primeiros passos" e o teste grátis. Barra superior com os modos
 * (Chat · Agente · Código · Design), busca e convite.
 * Celular: pílula com Início · Apps · E-mail · Chat (o resto em "Mais").
 */

export const studioRoutes = {
  home: frameHref("ai-agent-connections"),
  analytics: frameHref("ai-projects"),
  apps: frameHref("app-marketplace"),
  connection: (id: string) => frameHref("app-connection", id),
  compose: frameHref("ai-compose-email"),
  sessions: frameHref("ai-sessions"),
  workspace: frameHref("ai-workspace"),
  trace: frameHref("ai-trace"),
  chat: frameHref("ai-chat"),
  conversation: frameHref("ai-conversation"),
  onboarding: frameHref("onboarding-checklist"),
  billing: frameHref("settings-billing"),
  team: frameHref("settings-team"),
  profile: frameHref("settings-profile"),
  notifications: frameHref("app-notifications"),
} as const;

export type StudioMode = "chat" | "agent" | "code" | "design";
const modes: { id: StudioMode; label: string; icon: LucideIcon; href: string }[] = [
  { id: "chat", label: "Chat", icon: MessageSquare, href: studioRoutes.sessions },
  { id: "agent", label: "Agente", icon: Sparkles, href: studioRoutes.home },
  { id: "code", label: "Código", icon: Code2, href: studioRoutes.trace },
  { id: "design", label: "Design", icon: PenTool, href: studioRoutes.workspace },
];

const nav: (NavItem & { isNew?: boolean })[] = [
  { href: studioRoutes.home, label: "Início", icon: House },
  { href: studioRoutes.analytics, label: "Análises", icon: BarChart3 },
  { href: studioRoutes.apps, label: "Apps", icon: LayoutGrid, match: "#/frame/app-", isNew: true },
];

// ds-audit-ignore-start hex-color: cores dos glifos de ferramentas (identidade de cada ferramenta)
const tools = [
  { label: "E-mails", icon: Mail, color: "#d93025", href: studioRoutes.compose },
  { label: "Análises de mídia", icon: BarChart3, color: "#0866ff", href: studioRoutes.workspace },
  { label: "Sessões", icon: MessagesSquare, color: "#5e8e3e", href: studioRoutes.sessions },
  { label: "Workflows", icon: Workflow, color: "#7c3aed", href: studioRoutes.trace },
];
// ds-audit-ignore-end

const pinned = [
  { label: "Criar 6 criativos para a campanha de outubro", href: studioRoutes.conversation },
  { label: "Relatório semanal de mídia", href: studioRoutes.workspace },
];
const recents = [
  { label: "Lançar a campanha Black Friday", href: studioRoutes.chat },
  { label: "Revisar a página de preços", href: studioRoutes.workspace },
  { label: "Pesquisa com clientes PME", href: studioRoutes.sessions },
  { label: "Apresentação para o comitê", href: frameHref("app-presentation") },
];

const tabs: NavItem[] = [
  { href: studioRoutes.home, label: "Início", icon: House },
  { href: studioRoutes.apps, label: "Apps", icon: LayoutGrid, match: "#/frame/app-" },
  { href: studioRoutes.compose, label: "E-mail", icon: Mail },
  { href: studioRoutes.sessions, label: "Chat", icon: MessageSquare },
];

const isActive = (current: string, item: { href: string; match?: string }) => current === item.href || (item.match ? current.startsWith(item.match) : current.startsWith(`${item.href}?`));

function SideLink({ href, label, icon: Icon, active, leading, trailing }: { href: string; label: string; icon?: ComponentType<{ className?: string; strokeWidth?: number }>; active?: boolean; leading?: ReactNode; trailing?: ReactNode }) {
  return (
    <a
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-[13.5px] transition-colors",
        active ? "bg-ink/[0.07] font-medium text-ink" : "text-ink-soft hover:bg-ink/[0.04] hover:text-ink",
      )}
    >
      {active && <span aria-hidden className="absolute -left-[10px] top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r-full bg-nav-marker" />}
      {leading ?? (Icon && <Icon className={cn("h-4 w-4 shrink-0", active ? "text-ink" : "text-muted")} strokeWidth={1.75} />)}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {trailing}
    </a>
  );
}

function SideGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-5">
      <p className="m-0 mb-1 px-2.5 text-[12px] text-muted">{title}</p>
      {children}
    </div>
  );
}

function StudioSidebar({ current, mobileOpen, onQuick }: { current: string; mobileOpen: boolean; onQuick: () => void }) {
  const connectedApps = apps.filter((a) => a.connected).slice(0, 6);
  return (
    <aside
      aria-label="Menu principal"
      className={cn(
        "z-40 shrink-0 flex-col border-r border-line bg-rail",
        "fixed inset-y-12 bottom-0 left-0 md:static md:h-full",
        mobileOpen ? "flex w-[272px]" : "hidden md:flex",
        "md:w-[256px]",
      )}
    >
      <div className="px-3 pb-3 pt-4">
        <div className="flex items-center gap-1">
          <Menu
            label={`Workspace: Estúdio ${org.name}`}
            align="start"
            triggerClassName="!h-9 min-w-0 flex-1 !justify-start !gap-2 !rounded-lg !bg-transparent !px-1.5 !text-[14.5px] !font-semibold !ring-0 hover:!bg-ink/[0.05]"
            trigger={
              <>
                <AppIcon letter="G4" color="var(--ds-accent)" size="sm" variant="soft" />
                <span className="truncate">Estúdio {org.name}</span>
              </>
            }
            items={[
              { type: "label", label: "Workspaces" },
              { label: `Estúdio ${org.name}`, onSelect: () => notify(`Você já está no Estúdio ${org.name}`, undefined, "info") },
              { label: "Acme Outlet", onSelect: () => notify("Exemplo: trocaria para o workspace Acme Outlet", undefined, "info") },
              { type: "separator" },
              { label: "Configurações do workspace", onSelect: () => goTo(studioRoutes.profile) },
            ]}
          />
          <button type="button" onClick={() => notify("Exemplo: recolhe a barra lateral (⌘\\)", undefined, "info")} aria-label="Recolher menu" className="hidden h-8 w-8 shrink-0 place-items-center rounded-lg text-muted hover:bg-ink/[0.05] hover:text-ink md:grid">
            <PanelLeft className="h-4 w-4" />
          </button>
        </div>
        <QuickActionsField onOpen={onQuick} className="mt-3" />
      </div>
      <nav aria-label="Navegação" className="min-h-0 flex-1 overflow-y-auto px-2.5 pb-4">
        {nav.map((n) => (
          <SideLink key={n.href} {...n} active={isActive(current, n)} trailing={n.isNew ? <span className="text-[12px] font-medium text-rose">Novo</span> : undefined} />
        ))}
        <SideGroup title="Ferramentas">
          {tools.map((t) => (
            <SideLink key={t.label} href={t.href} label={t.label} active={current === t.href} leading={<AppIcon icon={t.icon} color={t.color} size="xs" variant="soft" className="!h-[22px] !w-[22px]" />} />
          ))}
        </SideGroup>
        <SideGroup title="Fixados">
          {pinned.map((p) => (
            <SideLink key={p.label} href={p.href} label={p.label} icon={Pin} />
          ))}
        </SideGroup>
        <SideGroup title="Conversas">
          {recents.map((r) => (
            <SideLink key={r.label} href={r.href} label={r.label} leading={<span className="w-0" />} />
          ))}
        </SideGroup>
      </nav>
      <div className="space-y-3 border-t border-line px-3 pb-3 pt-3">
        {!current.startsWith("#/frame/app-") && (
          <a href={studioRoutes.apps} className="block rounded-xl px-2.5 py-2 hover:bg-ink/[0.04]">
            <span className="block text-[13px] font-medium">Conectar apps</span>
            <span className="mt-0.5 block text-[12px] leading-snug text-muted">Apps externos como Figma, GitHub e Drive.</span>
            <span className="mt-2 flex gap-1">
              {connectedApps.map((a) => (
                <AppIcon key={a.id} icon={a.icon} color={a.color} size="xs" />
              ))}
            </span>
          </a>
        )}
        <SidebarProgressCard done={2} total={5} href={studioRoutes.onboarding} />
        <TrialBanner daysLeft={14} icon={<Rocket />} onUpgrade={() => goTo(studioRoutes.billing)} />
      </div>
    </aside>
  );
}

/** Barra superior (desktop): modos, busca, avisos, notas, convite, perfil. */
function StudioTopBar({ mode, onQuick }: { mode?: StudioMode; onQuick: () => void }) {
  return (
    <div className="hidden h-[52px] shrink-0 items-center gap-3 border-b border-line bg-page px-4 md:flex">
      <nav aria-label="Modos" className="flex items-center gap-1">
        {modes.map((m) => {
          const on = m.id === mode;
          return (
            <a
              key={m.id}
              href={m.href}
              aria-current={on ? "page" : undefined}
              className={cn("inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[13px] transition-colors", on ? "bg-ink/[0.07] font-medium text-ink" : "text-muted hover:bg-ink/[0.04] hover:text-ink")}
            >
              <m.icon className="h-3.5 w-3.5" />
              {m.label}
            </a>
          );
        })}
      </nav>
      <button type="button" onClick={onQuick} className="mx-auto flex h-8 w-full max-w-[320px] items-center gap-2 rounded-lg bg-surface px-2.5 text-[13px] text-muted ring-1 ring-line hover:ring-line-strong">
        <Search className="h-3.5 w-3.5" />
        <span className="flex-1 text-left">Buscar</span>
        <kbd className="rounded border border-line bg-soft px-1 font-sans text-[10.5px]">⌘K</kbd>
      </button>
      <div className="flex items-center gap-1">
        <a href={studioRoutes.notifications} aria-label="Notificações" title="Notificações" className="relative grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-ink/[0.05] hover:text-ink">
          <Bell className="h-4 w-4" />
          <span aria-hidden className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-rose ring-2 ring-page" />
        </a>
        <button type="button" onClick={() => notify("Exemplo: abre o bloco de notas do workspace", undefined, "info")} aria-label="Notas" title="Notas" className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-ink/[0.05] hover:text-ink">
          <NotebookPen className="h-4 w-4" />
        </button>
        <a href={studioRoutes.team} className="ml-1 inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[13px] text-ink-soft hover:bg-ink/[0.05] hover:text-ink">
          <UserPlus className="h-4 w-4" />
          Convidar
        </a>
        <a href={studioRoutes.profile} aria-label={`Perfil de ${me.name}`} className="ml-1 rounded-full outline-offset-2">
          <Avatar initials={me.initials} tint={me.tint} size="sm" name={me.name} />
        </a>
      </div>
    </div>
  );
}

const commands: Command[] = [
  { id: "home", label: "Ir para Início (agente Williams)", group: "Navegar", icon: <House className="h-4 w-4" />, onSelect: () => goTo(studioRoutes.home) },
  { id: "apps", label: "Abrir o marketplace de apps", group: "Navegar", icon: <LayoutGrid className="h-4 w-4" />, onSelect: () => goTo(studioRoutes.apps) },
  { id: "compose", label: "Escrever e-mail com IA", group: "Criar", icon: <Mail className="h-4 w-4" />, shortcut: ["E"], onSelect: () => goTo(studioRoutes.compose) },
  { id: "session", label: "Nova sessão de chat", group: "Criar", icon: <MessageSquare className="h-4 w-4" />, onSelect: () => goTo(studioRoutes.sessions) },
  ...apps.slice(0, 12).map((a) => ({ id: `app-${a.id}`, label: a.name, group: "Apps", hint: a.connected ? "Conectado" : a.category, keywords: [a.category, a.description], icon: <AppIcon icon={a.icon} color={a.color} size="xs" variant="plain" />, onSelect: () => go("app-connection", a.id) })),
];

export function StudioShell({ current, mode, children }: { current: string; mode?: StudioMode; children: ReactNode }) {
  const [palette, setPalette] = useState(false);
  useCommandShortcut(() => setPalette(true));
  return (
    <AppShell
      product={`Estúdio ${org.name}`}
      workspace={org.domain}
      mobileNav="tabbar"
      tabs={tabs}
      currentPath={current}
      sidebar={({ mobileOpen }) => <StudioSidebar current={current} mobileOpen={mobileOpen} onQuick={() => setPalette(true)} />}
    >
      <StudioTopBar mode={mode} onQuick={() => setPalette(true)} />
      <div className="min-h-0 flex-1">{children}</div>
      <CommandPalette open={palette} onClose={() => setPalette(false)} commands={commands} recent={["compose", "apps"]} placeholder="Buscar apps, ações, conversas…" />
    </AppShell>
  );
}
