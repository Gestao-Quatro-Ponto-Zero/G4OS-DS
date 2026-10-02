import { Bot, ClipboardCheck, FlaskConical, FolderKanban, History, LayoutDashboard, LayoutGrid, ListChecks, MessagesSquare, Settings, ShieldCheck, Sparkles, SquareTerminal } from "lucide-react";
import type { ReactNode } from "react";
import { AppShell, Avatar, Dot, DsLink, ErrorState, IconRail, Skeleton, Tooltip, type NavItem, type RailItem } from "@g4ai/ds";
import { approvals, runStatusLabel, runStatusTone, type RunStatus } from "../data/agents";
import { me, org } from "../data/workspace";
import { frameHref, setFrameQuery, useFrameParam } from "./frame-route";

/*
 * Casca do "Agente G4": o workspace de análise E a gestão da frota de agentes
 * da Acme. Trilho de ícones à esquerda em três grupos:
 *   Trabalho   · Workspace, Projetos, Conversa, Tarefas, Chat livre
 *   Frota      · Painel, Agentes, Descobrir agentes, Execuções, Aprovações, Avaliações
 *   Governança · Custos e limites, Modelos e fontes
 * Aprovações ganha ponto de atenção só quando há pedido esperando alguém.
 * Celular: pílula com Workspace · Painel · Agentes · Aprovações; o resto no menu.
 */

export const agentRoutes = {
  workspace: frameHref("ai-workspace"),
  projects: frameHref("ai-projects"),
  trace: frameHref("ai-trace"),
  conversation: frameHref("ai-conversation"),
  chat: frameHref("ai-chat"),
  builder: frameHref("ai-agent-builder"),
  tasks: frameHref("ai-task-proposals"),
  dashboard: frameHref("ai-agents-dashboard"),
  agents: frameHref("ai-agents"),
  agent: (id: string) => frameHref("ai-agent", id),
  templates: frameHref("ai-agent-templates"),
  runs: frameHref("ai-runs"),
  run: (id: string) => frameHref("ai-agent-run", id),
  approvals: frameHref("ai-approvals"),
  evals: frameHref("ai-agent-evals"),
  governance: frameHref("ai-agent-governance"),
  settings: frameHref("settings-integrations", { id: "claude" }),
} as const;

const pending = approvals.length;

const rail: RailItem[][] = [
  [
    { href: agentRoutes.workspace, label: "Workspace", icon: Sparkles },
    { href: agentRoutes.projects, label: "Projetos", icon: FolderKanban, dot: true },
    { href: agentRoutes.conversation, label: "Conversa com aprovação", icon: MessagesSquare },
    { href: agentRoutes.tasks, label: "Tarefas propostas", icon: ListChecks },
    { href: agentRoutes.chat, label: "Chat livre", icon: SquareTerminal },
  ],
  [
    { href: agentRoutes.dashboard, label: "Painel da frota", icon: LayoutDashboard },
    { href: agentRoutes.agents, label: "Agentes", icon: Bot },
    { href: agentRoutes.templates, label: "Descobrir agentes", icon: LayoutGrid },
    { href: agentRoutes.runs, label: "Execuções", icon: History },
    { href: agentRoutes.approvals, label: "Aprovações", icon: ClipboardCheck, badge: pending },
    { href: agentRoutes.evals, label: "Avaliações", icon: FlaskConical },
  ],
  [
    { href: agentRoutes.governance, label: "Governança: custos e limites", icon: ShieldCheck },
    { href: agentRoutes.settings, label: "Modelos e fontes", icon: Settings },
  ],
];

const tabs: NavItem[] = [
  { href: agentRoutes.workspace, label: "Workspace", icon: Sparkles },
  { href: agentRoutes.dashboard, label: "Painel", icon: LayoutDashboard },
  { href: agentRoutes.agents, label: "Agentes", icon: Bot },
  { href: agentRoutes.approvals, label: "Aprovações", icon: ClipboardCheck, badge: pending },
];

export function AgentShell({ current, children }: { current: string; children: ReactNode }) {
  return (
    <AppShell
      product="Agente G4"
      workspace={org.name}
      mobileNav="tabbar"
      tabs={tabs}
      currentPath={current}
      sidebar={({ mobileOpen }) => (
        <IconRail
          groups={rail}
          currentPath={current}
          mobileOpen={mobileOpen}
          mark={
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-on-primary" role="img" aria-label="Agente G4">
              <Sparkles className="h-4 w-4" />
            </span>
          }
          footer={
            <Tooltip content={`${me.name} · ${me.title}`} side="right">
              <DsLink href={frameHref("settings-profile")} aria-label="Seu perfil" className="rounded-full">
                <Avatar initials={me.initials} tint={me.tint} size="sm" name={me.name} />
              </DsLink>
            </Tooltip>
          }
        />
      )}
    >
      {children}
    </AppShell>
  );
}

/* ------------------------------------------------------------------ */
/* Estados de lista (?estado=carregando|vazio|erro simula cada um)     */
/* ------------------------------------------------------------------ */

export type DemoState = "carregando" | "vazio" | "erro" | null;

export function useAgentDemoState(): DemoState {
  const v = useFrameParam("estado");
  return v === "carregando" || v === "vazio" || v === "erro" ? v : null;
}

/** Esqueleto com a forma da tabela (marca + duas linhas + números). */
export function AgentListSkeleton({ rows = 6, label = "Carregando lista" }: { rows?: number; label?: string }) {
  return (
    <div role="status" aria-label={label} className="overflow-hidden rounded-xl border border-line bg-surface">
      <div className="flex gap-4 border-b border-line bg-soft/60 px-4 py-2.5">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="ml-auto h-3 w-16" />
        <Skeleton className="h-3 w-16" />
      </div>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-b-0">
          <Skeleton className="h-7 w-7 rounded-lg" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <Skeleton className="h-3 w-2/5" />
            <Skeleton className="h-2.5 w-1/4" />
          </div>
          <Skeleton className="hidden h-3 w-16 sm:block" />
          <Skeleton className="h-3 w-20" />
        </div>
      ))}
    </div>
  );
}

/** Erro de carregamento com saída (tentar de novo). */
export function AgentListError({ noun }: { noun: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface">
      <ErrorState
        title={`Não foi possível carregar ${noun}`}
        description="O serviço de agentes não respondeu. Nada foi perdido; os agentes continuam rodando."
        onRetry={() => setFrameQuery({ estado: undefined })}
        details="GET /api/v1/agents · 503 Service Unavailable · req_4c19e2"
      />
    </div>
  );
}

/** Status de execução com ponto + palavra (azul = rodando agora). */
export function RunStatusLabel({ status }: { status: RunStatus }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[12.5px] text-ink-soft">
      <Dot tone={runStatusTone[status]} />
      {runStatusLabel[status]}
    </span>
  );
}
