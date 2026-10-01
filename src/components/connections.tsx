"use client";

import { Check, CheckCircle2, ChevronDown, Command as CommandIcon, Plus, ShieldCheck } from "lucide-react";
import { useId, useState, type ComponentType, type CSSProperties, type ReactNode } from "react";
import { cn } from "../lib/cn";
import { ProgressRing } from "./charts";
import { Switch } from "./forms";
import { FileIcon } from "./media";
import { Badge, DsLink, Kbd } from "./primitives";

/*
 * Conexões e apps: marketplace de integrações, detalhe da conexão,
 * permissões por conta e o "cartão do agente" (o que ele acessa, quem ele
 * aciona, o que entrega). Regras (docs/padroes/conexoes.md):
 *   · mostre o que cada ferramenta PODE fazer antes de conectar
 *   · leitura e escrita sempre separadas; escrita pede confirmação
 *   · permissão é por conta, não por app
 *   · tudo reversível: desconectar e revogar têm desfazer
 */

type IconLike = ComponentType<{ className?: string; strokeWidth?: number }>;

/* ------------------------------------------------------------------ */
/* AppIcon                                                             */
/* ------------------------------------------------------------------ */

const iconSizes = {
  xs: { box: "h-5 w-5 rounded-chip", glyph: "h-3 w-3", text: "text-[10px]" },
  sm: { box: "h-7 w-7 rounded-lg", glyph: "h-3.5 w-3.5", text: "text-[10.5px]" },
  md: { box: "h-9 w-9 rounded-tile", glyph: "h-[18px] w-[18px]", text: "text-[12px]" },
  lg: { box: "h-10 w-10 rounded-xl", glyph: "h-5 w-5", text: "text-[13px]" },
  xl: { box: "h-14 w-14 rounded-2xl", glyph: "h-7 w-7", text: "text-[17px]" },
} as const;

/**
 * Ícone de app/integração. `tile` = quadrado claro com contorno e glifo na cor
 * do app (marketplace, detalhe); `soft` = fundo tingido com a cor (sidebar,
 * listas densas); `plain` = só o glifo (dentro de pílulas).
 * `color` é qualquer cor CSS (token ou a cor da marca vinda dos dados).
 */
export function AppIcon({
  icon: Icon,
  letter,
  color = "var(--ds-ink)",
  size = "md",
  variant = "tile",
  label,
  className,
}: {
  icon?: IconLike;
  /** Alternativa ao ícone: 1–2 letras. */
  letter?: string;
  color?: string;
  size?: keyof typeof iconSizes;
  variant?: "tile" | "soft" | "plain";
  /** Nome do app para leitor de tela (omita se o nome já aparece ao lado). */
  label?: string;
  className?: string;
}) {
  const s = iconSizes[size];
  const style: CSSProperties =
    variant === "soft"
      ? { background: `color-mix(in oklab, ${color} 14%, transparent)`, color: `color-mix(in oklab, ${color} 58%, var(--ds-ink))` }
      : { color };
  return (
    <span
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn(
        "inline-grid shrink-0 place-items-center font-semibold leading-none",
        variant !== "plain" && s.box,
        variant === "tile" && "bg-surface shadow-surface ring-1 ring-line",
        s.text,
        className,
      )}
      style={style}
    >
      {Icon ? <Icon className={s.glyph} strokeWidth={2} /> : letter}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Marketplace                                                         */
/* ------------------------------------------------------------------ */

export type AppInfo = { id: string; name: string; description: string; icon?: IconLike; letter?: string; color?: string; category?: string };

/**
 * Linha de app no marketplace: ícone, nome, descrição de uma linha e a ação.
 * Conectado = check discreto (já está feito, não chama atenção); disponível =
 * botão quadrado "+". O nome leva ao detalhe (link esticado sobre a linha).
 */
export function AppTile({
  app,
  connected,
  href,
  onOpen,
  onConnect,
  badge,
  className,
}: {
  app: AppInfo;
  connected?: boolean;
  href?: string;
  onOpen?: () => void;
  onConnect?: () => void;
  /** Selo ao lado do nome ("Novo", "Beta"). */
  badge?: ReactNode;
  className?: string;
}) {
  const title = (
    <>
      <span className="absolute inset-0 rounded-xl" aria-hidden />
      {app.name}
    </>
  );
  return (
    <div className={cn("group relative flex items-center gap-3.5 rounded-xl px-2.5 py-3 transition-colors hover:bg-ink/[0.035]", className)}>
      <AppIcon icon={app.icon} letter={app.letter} color={app.color} size="lg" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {href ? (
            <DsLink href={href} className="truncate py-0.5 text-[14px] font-medium text-ink outline-none focus-visible:underline">
              {title}
            </DsLink>
          ) : onOpen ? (
            <button type="button" onClick={onOpen} className="truncate py-0.5 text-left text-[14px] font-medium text-ink outline-none focus-visible:underline">
              {title}
            </button>
          ) : (
            <span className="truncate text-[14px] font-medium text-ink">{app.name}</span>
          )}
          {badge}
        </div>
        <p className="m-0 mt-0.5 truncate text-[12.5px] text-muted">{app.description}</p>
      </div>
      {connected ? (
        <span className="relative grid h-8 w-8 shrink-0 place-items-center text-muted" title="Conectado" aria-label={`${app.name} conectado`} role="img">
          <Check className="h-4 w-4" strokeWidth={2} />
        </span>
      ) : (
        onConnect && (
          <button
            type="button"
            onClick={onConnect}
            aria-label={`Conectar ${app.name}`}
            title="Conectar"
            className="relative z-[1] grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-soft text-ink-soft ring-1 ring-line transition-colors hover:bg-surface hover:text-ink hover:ring-line-strong"
          >
            <Plus className="h-4 w-4" />
          </button>
        )
      )}
    </div>
  );
}

/** Grade de apps: 1 coluna no celular, 2 no desktop, linhas com respiro. */
export function AppGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("grid gap-x-8 gap-y-1 md:grid-cols-2", className)}>{children}</div>;
}

/**
 * Pílula de prompt com o app em destaque: "[Slack] Resumir as atualizações…".
 * Clicável: inicia uma conversa já com o pedido.
 */
export function PromptPill({ app, children, onClick, className }: { app: Pick<AppInfo, "name" | "icon" | "letter" | "color">; children: ReactNode; onClick?: () => void; className?: string }) {
  const color = app.color ?? "var(--ds-ink)";
  const body = (
    <>
      <span
        className="inline-flex shrink-0 items-center gap-1.5 rounded-full py-0.5 pl-1.5 pr-2.5 text-[12.5px] font-medium"
        style={{ background: `color-mix(in oklab, ${color} 13%, transparent)`, color: `color-mix(in oklab, ${color} 78%, var(--ds-ink))` }}
      >
        <AppIcon icon={app.icon} letter={app.letter} color={color} size="xs" variant="plain" />
        {app.name}
      </span>
      <span className="min-w-0 truncate text-[13px] text-ink">{children}</span>
    </>
  );
  const cls = cn(
    "flex min-w-0 max-w-full items-center gap-2.5 rounded-full bg-popover/95 py-1.5 pl-1.5 pr-4 shadow-raised ring-1 ring-line backdrop-blur",
    onClick && "transition-transform hover:-translate-y-px hover:ring-line-strong",
    className,
  );
  return onClick ? (
    <button type="button" onClick={onClick} className={cls}>
      {body}
    </button>
  ) : (
    <div className={cls}>{body}</div>
  );
}

/**
 * Faixa de abertura do marketplace: degradê suave (tokens accent + info +
 * série 2, funciona no escuro) com 1–3 pílulas de exemplo do que dá para pedir.
 */
export function MarketplaceHero({
  prompts,
  height = 172,
  className,
  children,
}: {
  prompts: { app: Pick<AppInfo, "name" | "icon" | "letter" | "color">; text: string; onClick?: () => void }[];
  height?: number;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={cn("relative isolate flex flex-col items-center justify-center gap-2.5 overflow-hidden rounded-2xl px-4 py-6 ring-1 ring-line", className)}
      style={{
        minHeight: height,
        background: [
          "radial-gradient(55% 90% at 12% 20%, color-mix(in oklab, var(--ds-accent) 34%, transparent), transparent 70%)",
          "radial-gradient(45% 80% at 88% 75%, color-mix(in oklab, var(--ds-info) 30%, transparent), transparent 70%)",
          "radial-gradient(40% 70% at 55% 110%, color-mix(in oklab, var(--ds-chart-2) 26%, transparent), transparent 70%)",
          "var(--ds-soft)",
        ].join(","),
      }}
    >
      {prompts.slice(0, 3).map((p, i) => (
        <PromptPill key={p.text} app={p.app} onClick={p.onClick} className={cn("w-[min(100%,440px)]", i === 1 && "sm:translate-x-6", i === 2 && "sm:-translate-x-3")}>
          {p.text}
        </PromptPill>
      ))}
      {children}
    </div>
  );
}

/**
 * Faixa decorativa pontilhada (meio-tom) que some para baixo. Fica acima de
 * títulos de página de marketplace/boas-vindas. Só tokens; aria-hidden.
 */
export function HalftoneBand({ height = 96, className }: { height?: number; className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none w-full", className)}
      style={{
        height,
        backgroundImage: "radial-gradient(circle at center, color-mix(in oklab, var(--ds-ink) 22%, transparent) 0.9px, transparent 1.4px)",
        backgroundSize: "7px 7px",
        maskImage: "radial-gradient(60% 100% at 50% 0%, black 20%, transparent 75%)",
        WebkitMaskImage: "radial-gradient(60% 100% at 50% 0%, black 20%, transparent 75%)",
      }}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Estado da conexão                                                    */
/* ------------------------------------------------------------------ */

export type ConnectionState = "connected" | "pending" | "error" | "disconnected";

/** Selo de estado de uma conexão. Sempre com palavra, nunca só cor. */
export function ConnectionStatus({ status, label }: { status: ConnectionState; label?: string }) {
  const map = {
    connected: { tone: "ok", text: "Conectado" },
    pending: { tone: "warn", text: "Aguardando autorização" },
    error: { tone: "bad", text: "Erro na conexão" },
    disconnected: { tone: "neutral", text: "Desconectado" },
  } as const;
  const m = map[status];
  return <Badge tone={m.tone}>{label ?? m.text}</Badge>;
}

/* ------------------------------------------------------------------ */
/* Detalhe da conexão                                                   */
/* ------------------------------------------------------------------ */

/**
 * Tabela chave/valor do que está sincronizado. Valores clicáveis levam à
 * lista filtrada (ex.: os 15 produtos sincronizados).
 */
export function DataSyncTable({ rows, className }: { rows: { label: string; value: ReactNode; icon?: IconLike; href?: string; onClick?: () => void; hint?: ReactNode }[]; className?: string }) {
  return (
    <dl className={cn("m-0 overflow-hidden rounded-xl border border-line bg-surface", className)}>
      {rows.map((r) => {
        const Icon = r.icon;
        const value = r.href ? (
          <DsLink href={r.href} className="font-medium tabular-nums text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">
            {r.value}
          </DsLink>
        ) : r.onClick ? (
          <button type="button" onClick={r.onClick} className="font-medium tabular-nums text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">
            {r.value}
          </button>
        ) : (
          <span className="font-medium tabular-nums">{r.value}</span>
        );
        return (
          <div key={r.label} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] border-b border-line text-[13.5px] last:border-b-0 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
            <dt className="flex min-w-0 items-center gap-2.5 border-r border-line px-4 py-3 text-ink-soft">
              {Icon && <Icon className="h-4 w-4 shrink-0 text-muted" />}
              <span className="truncate">{r.label}</span>
            </dt>
            <dd className="m-0 flex min-w-0 items-center gap-2 px-4 py-3">
              {value}
              {r.hint && <span className="truncate text-[12px] text-muted">{r.hint}</span>}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

/**
 * Conta conectada (loja, workspace, perfil de anúncios). Com `children`
 * expande para mostrar as permissões daquela conta.
 */
export function AccountRow({
  mark,
  name,
  url,
  href,
  meta,
  children,
  defaultOpen = false,
  actions,
}: {
  mark?: ReactNode;
  name: string;
  url?: string;
  href?: string;
  meta?: ReactNode;
  children?: ReactNode;
  defaultOpen?: boolean;
  actions?: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <div className="border-b border-line last:border-b-0">
      <div className="flex min-h-14 items-center gap-3 px-4 py-2.5">
        {mark}
        <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-3 gap-y-0.5">
          <span className="truncate text-[14px] font-medium">{name}</span>
          {url && (
            <a href={href ?? `https://${url}`} target="_blank" rel="noreferrer" className="truncate text-[13px] text-blue underline decoration-blue/40 underline-offset-4 hover:decoration-blue">
              {url}
            </a>
          )}
          {meta && <span className="text-[12px] text-muted">{meta}</span>}
        </div>
        {actions}
        {children && (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls={id}
            className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg px-2 text-[12.5px] text-muted hover:bg-soft hover:text-ink"
          >
            <span className="max-sm:sr-only">Permissões</span>
            <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
          </button>
        )}
      </div>
      {children && open && (
        <div id={id} className="mx-3 mb-3 rounded-xl bg-soft px-4 py-4 sm:mx-4 sm:px-5">
          {children}
        </div>
      )}
    </div>
  );
}

export type ToolPermission = { id: string; title: string; description: string; scope: "read" | "write"; enabled: boolean };

/**
 * Permissões das ferramentas de UMA conta, separadas em leitura e escrita.
 * Ativada = check verde ao lado do título + switch ligado. Escrita traz o
 * aviso de que altera dados no app de origem.
 */
export function ToolPermissionList({
  items,
  onChange,
  title = "Permissões das ferramentas",
  appName,
}: {
  items: ToolPermission[];
  onChange: (id: string, enabled: boolean) => void;
  title?: string;
  /** Nome do app para os textos de ajuda ("altera dados no Shopify"). */
  appName?: string;
}) {
  const groups = [
    { scope: "read" as const, label: "Leitura", hint: "Consulta dados; não altera nada." },
    { scope: "write" as const, label: "Escrita", hint: `Altera dados${appName ? ` no ${appName}` : " no app de origem"}. Cada ação pede sua aprovação na primeira vez.` },
  ].filter((g) => items.some((i) => i.scope === g.scope));
  return (
    <section aria-label={title}>
      <h4 className="m-0 text-[14px] font-medium">{title}</h4>
      <div className="mt-3 space-y-5">
        {groups.map((g) => (
          <div key={g.scope}>
            <p className="m-0 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.08em] text-muted">
              {g.label}
              {g.scope === "write" && <span className="rounded bg-amber-soft px-1.5 py-px text-[10.5px] normal-case tracking-normal text-amber">altera dados</span>}
            </p>
            <p className="m-0 mt-0.5 text-[12px] text-muted">{g.hint}</p>
            <ul className="m-0 mt-2 list-none divide-y divide-line p-0">
              {items
                .filter((i) => i.scope === g.scope)
                .map((p) => (
                  <li key={p.id} className="flex items-start gap-4 py-3 first:pt-1">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 text-[13.5px] font-medium">
                        {p.title}
                        {p.enabled && <ShieldCheck className="h-4 w-4 shrink-0 text-ok" aria-label="Permitido" />}
                      </div>
                      <p className="m-0 mt-0.5 text-[12.5px] leading-relaxed text-muted">{p.description}</p>
                    </div>
                    <Switch label={p.title} hideLabel checked={p.enabled} onCheckedChange={(v) => onChange(p.id, v)} className="h-6 shrink-0" />
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Cartão do agente                                                     */
/* ------------------------------------------------------------------ */

export type AgentConnection = { id: string; name: string; icon?: IconLike; letter?: string; color?: string; status: "connected" | "available" | "active"; onConnect?: () => void; onClick?: () => void };
export type Subagent = { id: string; name: string; icon?: IconLike; letter?: string; color?: string; status: "running" | "idle" | "done" | "error"; onClick?: () => void };
export type AgentResult = { id: string; name: string; fileName?: string; onClick?: () => void; meta?: ReactNode };

const subStatus = {
  running: { cls: "bg-amber", ring: "ring-amber/25", label: "Executando" },
  idle: { cls: "bg-line-strong", ring: "ring-line", label: "Parado" },
  done: { cls: "bg-ok", ring: "ring-ok/25", label: "Concluído" },
  error: { cls: "bg-rose", ring: "ring-rose/25", label: "Falhou" },
};

function CardRow({ children, onClick, active }: { children: ReactNode; onClick?: () => void; active?: boolean }) {
  const cls = cn("flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left", active ? "bg-ink/[0.06]" : onClick && "hover:bg-ink/[0.035]");
  return onClick ? (
    <button type="button" onClick={onClick} className={cls}>
      {children}
    </button>
  ) : (
    <div className={cls}>{children}</div>
  );
}

/** Linha de conexão dentro do cartão do agente. */
export function AgentConnectionRow({ c }: { c: AgentConnection }) {
  return (
    <CardRow onClick={c.status === "available" ? undefined : c.onClick} active={c.status === "active"}>
      <AppIcon icon={c.icon} letter={c.letter} color={c.color} size="sm" variant={c.status === "active" ? "soft" : "plain"} />
      <span className="min-w-0 flex-1 truncate text-[14px] text-ink-soft">{c.name}</span>
      {c.status === "connected" && <CheckCircle2 className="h-5 w-5 shrink-0 fill-ok text-surface" aria-label="Conectado" />}
      {c.status === "available" && (
        <button type="button" onClick={c.onConnect} className="h-8 shrink-0 rounded-full bg-primary px-4 text-[13px] font-medium text-on-primary hover:bg-primary/90">
          Conectar
        </button>
      )}
    </CardRow>
  );
}

/** Subagente com ponto de estado (âmbar pulsando = executando). */
export function SubagentRow({ s }: { s: Subagent }) {
  const st = subStatus[s.status];
  return (
    <CardRow onClick={s.onClick}>
      <AppIcon icon={s.icon} letter={s.letter} color={s.color} size="sm" variant="soft" />
      <span className="min-w-0 flex-1 truncate text-[14px] text-ink-soft">{s.name}</span>
      <span role="img" aria-label={st.label} title={st.label} className={cn("relative h-2.5 w-2.5 shrink-0 rounded-full ring-4", st.cls, st.ring, s.status === "running" && "motion-safe:animate-pulse")} />
    </CardRow>
  );
}

/** Resultado entregue pelo agente (documento, PDF, planilha). */
export function ResultRow({ r }: { r: AgentResult }) {
  return (
    <CardRow onClick={r.onClick}>
      <FileIcon name={r.fileName ?? `${r.name}.doc`} size="sm" />
      <span className="min-w-0 flex-1 truncate text-[14px] text-ink-soft">{r.name}</span>
      {r.meta && <span className="shrink-0 text-[12px] tabular-nums text-muted">{r.meta}</span>}
    </CardRow>
  );
}

/**
 * Cartão do agente: faixa de cabeçalho (avatar, nome, escopo) sobre um cartão
 * interno com o que ele acessa (conexões), quem ele aciona (subagentes) e o
 * que ele entrega (resultados). Seções vazias somem.
 */
export function ConnectionsCard({
  name,
  avatar,
  scope,
  connections = [],
  subagents = [],
  results = [],
  footer,
  className,
}: {
  name: string;
  avatar?: ReactNode;
  /** "Global", "Time Comercial"… */
  scope?: ReactNode;
  connections?: AgentConnection[];
  subagents?: Subagent[];
  results?: AgentResult[];
  footer?: ReactNode;
  className?: string;
}) {
  const sections = [
    connections.length ? { key: "c", title: undefined as string | undefined, body: connections.map((c) => <AgentConnectionRow key={c.id} c={c} />) } : null,
    subagents.length ? { key: "s", title: "Subagentes", body: subagents.map((s) => <SubagentRow key={s.id} s={s} />) } : null,
    results.length ? { key: "r", title: "Resultados", body: results.map((r) => <ResultRow key={r.id} r={r} />) } : null,
  ].filter(Boolean) as { key: string; title?: string; body: ReactNode }[];
  return (
    <section className={cn("rounded-[22px] bg-soft p-1.5 ring-1 ring-line", className)} aria-label={`Agente ${name}`}>
      <header className="flex items-center gap-3 px-4 pb-3 pt-2.5">
        {avatar}
        <h3 className="m-0 min-w-0 flex-1 truncate text-[17px] font-semibold tracking-tight">{name}</h3>
        {scope && <span className="shrink-0 text-[13px] text-muted">{scope}</span>}
      </header>
      <div className="rounded-[18px] bg-surface p-2 shadow-surface ring-1 ring-line">
        {sections.map((s, i) => (
          <div key={s.key} className={cn(i > 0 && "mt-2 border-t border-line pt-3")}>
            {s.title && <p className="m-0 px-3 pb-1 text-[13px] font-medium text-muted">{s.title}</p>}
            {s.body}
          </div>
        ))}
        {footer && <div className="mt-2 border-t border-line px-3 pb-1 pt-3">{footer}</div>}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Peças de sidebar                                                     */
/* ------------------------------------------------------------------ */

/** Campo de "Ações rápidas" que abre a paleta (⌘K). */
export function QuickActionsField({ onOpen, label = "Ações rápidas", className }: { onOpen: () => void; label?: string; className?: string }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn("flex h-9 w-full items-center gap-2 rounded-lg bg-surface px-2.5 text-[13px] text-muted ring-1 ring-line transition-colors hover:text-ink hover:ring-line-strong", className)}
    >
      <CommandIcon className="h-3.5 w-3.5 shrink-0" />
      <span className="min-w-0 flex-1 truncate text-left">{label}</span>
      <Kbd>⌘K</Kbd>
    </button>
  );
}

/** Cartão "Primeiros passos" no rodapé da sidebar: anel + contagem. */
export function SidebarProgressCard({ title = "Primeiros passos", done, total, onClick, href }: { title?: string; done: number; total: number; onClick?: () => void; href?: string }) {
  const body = (
    <>
      <ProgressRing value={(done / Math.max(1, total)) * 100} size={20} thickness={2.5} tone="accent" label={`${title}: ${done} de ${total}`}>
        {""}
      </ProgressRing>
      <span className="min-w-0 flex-1 truncate text-left text-[13px] font-medium">{title}</span>
      <span className="shrink-0 text-[12px] tabular-nums text-muted">
        {done} de {total}
      </span>
    </>
  );
  const cls = "flex h-10 w-full items-center gap-2.5 rounded-xl bg-surface px-3 shadow-surface ring-1 ring-line transition-colors hover:ring-line-strong";
  return href ? (
    <DsLink href={href} className={cls}>
      {body}
    </DsLink>
  ) : (
    <button type="button" onClick={onClick} className={cls}>
      {body}
    </button>
  );
}

/** Linha de teste grátis/plano no rodapé da sidebar. */
export function TrialBanner({ daysLeft, onUpgrade, icon, upgradeLabel = "Assinar" }: { daysLeft: number; onUpgrade: () => void; icon?: ReactNode; upgradeLabel?: string }) {
  return (
    <div className="flex items-center gap-2.5 px-1">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-ink text-on-ink [&_svg]:h-3.5 [&_svg]:w-3.5">{icon ?? <ShieldCheck />}</span>
      <span className="min-w-0 flex-1 truncate text-[13px] font-medium">
        {daysLeft} {daysLeft === 1 ? "dia restante" : "dias restantes"}
      </span>
      <button type="button" onClick={onUpgrade} className="h-7 shrink-0 rounded-lg bg-primary px-3 text-[12.5px] font-medium text-on-primary hover:bg-primary/90">
        {upgradeLabel}
      </button>
    </div>
  );
}
