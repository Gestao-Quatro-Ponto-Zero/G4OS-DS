"use client";

import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  CloudOff,
  Compass,
  Info,
  Lock,
  Megaphone,
  RotateCw,
  ServerCrash,
  Wrench,
  X,
  XCircle,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "../lib/cn";
import { notify } from "./feedback";

/*
 * Estados de tela e avisos. Regra de escolha (docs/padroes/feedback.md):
 *   StateView       a área inteira não tem o que mostrar (404, erro, sem acesso)
 *   Empty           coleção vazia dentro de uma página que funciona (primitives)
 *   Banner          aviso de página/app que vale até ser resolvido ou dispensado
 *   Callout         aviso fixo dentro do conteúdo, perto do que afeta (feedback)
 *   AlertCard       aviso com lista de problemas e ações (validação, importação)
 *   InlineMessage   status curto ao lado de um campo, botão ou linha
 *   Toast (notify)  confirmação de ação que TERMINOU; some sozinho
 * Todo estado de erro oferece uma saída (tentar de novo, voltar, falar com alguém).
 */

type StateTone = "neutral" | "info" | "ok" | "warn" | "bad";
const toneIcon: Record<StateTone, string> = {
  neutral: "border-line bg-soft/70 text-ink-soft",
  info: "border-blue/15 bg-info-soft/60 text-blue",
  ok: "border-ok/15 bg-ok-soft text-ok",
  warn: "border-amber/20 bg-amber-soft/70 text-amber",
  bad: "border-rose/15 bg-rose-soft/70 text-rose",
};

/* ------------------------------------------------------------------ */
/* StateView e presets                                                 */
/* ------------------------------------------------------------------ */

/**
 * Estado que ocupa uma área inteira (página, painel, card grande).
 * Ícone em moldura, código opcional (404), título que diz o que aconteceu,
 * descrição que diz o que fazer, até duas ações (primária por último na
 * leitura: secundária à esquerda).
 */
export function StateView({
  icon,
  illustration,
  tone = "neutral",
  code,
  title,
  description,
  action,
  secondaryAction,
  children,
  size = "md",
  className,
}: {
  icon?: ReactNode;
  /** Substitui o ícone por uma ilustração/imagem própria. */
  illustration?: ReactNode;
  tone?: StateTone;
  /** Código curto acima do título: "404", "500". */
  code?: string;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  secondaryAction?: ReactNode;
  /** Conteúdo extra abaixo das ações (detalhes técnicos, links). */
  children?: ReactNode;
  /** `page` centraliza na altura toda; `md` para painel; `sm` para card. */
  size?: "sm" | "md" | "page";
  className?: string;
}) {
  return (
    <div
      role={tone === "bad" ? "alert" : "status"}
      className={cn(
        "flex flex-col items-center justify-center px-6 text-center",
        size === "page" ? "min-h-full py-16" : size === "md" ? "min-h-[320px] py-12" : "min-h-[180px] py-8",
        className,
      )}
    >
      {illustration ??
        (icon && (
          <span
            aria-hidden
            className={cn(
              "inline-flex items-center justify-center rounded-2xl border",
              size === "sm" ? "mb-3 h-10 w-10 [&_svg]:h-5 [&_svg]:w-5" : "mb-5 h-12 w-12 [&_svg]:h-6 [&_svg]:w-6",
              toneIcon[tone],
            )}
          >
            {icon}
          </span>
        ))}
      {code && <p className="m-0 mb-1.5 font-mono text-[12px] font-medium tracking-[0.08em] text-muted">{code}</p>}
      <h2 className={cn("m-0 font-semibold tracking-[-0.02em] text-ink", size === "sm" ? "text-[15px]" : size === "page" ? "text-[22px]" : "text-[18px]")}>{title}</h2>
      {description && <div className="m-0 mt-2 max-w-[420px] text-[13.5px] leading-relaxed text-muted">{description}</div>}
      {(action || secondaryAction) && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {secondaryAction}
          {action}
        </div>
      )}
      {children && <div className="mt-6 w-full max-w-[460px]">{children}</div>}
    </div>
  );
}

type PresetProps = Partial<Omit<Parameters<typeof StateView>[0], "tone" | "icon">>;

/** Página ou registro que não existe (link quebrado, registro excluído). */
export function NotFoundState(props: PresetProps) {
  return (
    <StateView
      icon={<Compass strokeWidth={1.6} />}
      code="404"
      title="Não encontramos esta página"
      description="O endereço pode ter mudado ou o registro foi excluído. Confira o link ou volte para o início."
      {...props}
    />
  );
}

/**
 * Falha ao carregar. Mostra o código e, recolhidos, os detalhes técnicos
 * (para copiar e mandar ao suporte). `onRetry` vira a ação principal.
 */
export function ErrorState({
  onRetry,
  details,
  retryLabel = "Tentar novamente",
  ...props
}: PresetProps & { onRetry?: () => void; details?: string; retryLabel?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <StateView
      tone="bad"
      icon={<ServerCrash strokeWidth={1.6} />}
      title="Não foi possível carregar"
      description="Algo deu errado do nosso lado. Nada do que você fez foi perdido."
      action={
        onRetry && (
          <button type="button" onClick={onRetry} className="ui-button ui-button-primary inline-flex min-h-9 items-center gap-2 rounded-lg bg-primary px-3 py-2 text-[13px] font-medium text-on-primary hover:bg-primary/90">
            <RotateCw className="h-4 w-4" aria-hidden />
            {retryLabel}
          </button>
        )
      }
      {...props}
    >
      {details && (
        <div className="text-left">
          <button
            type="button"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
            className="mx-auto flex items-center gap-1 rounded-md px-2 py-1 text-[12px] text-muted hover:bg-soft hover:text-ink"
          >
            Detalhes técnicos
            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} aria-hidden />
          </button>
          {open && (
            <pre className="m-0 mt-2 max-h-40 overflow-auto rounded-lg border border-line bg-soft/60 p-3 font-mono text-[11.5px] leading-relaxed text-ink-soft">
              {details}
            </pre>
          )}
        </div>
      )}
      {props.children}
    </StateView>
  );
}

/** Sem permissão. Diga quem pode dar acesso. */
export function ForbiddenState(props: PresetProps) {
  return (
    <StateView
      tone="warn"
      icon={<Lock strokeWidth={1.6} />}
      code="403"
      title="Você não tem acesso a esta área"
      description="Peça acesso a um administrador do seu workspace. Se acha que isto é um engano, avise o suporte."
      {...props}
    />
  );
}

/** Sem conexão. O app tenta de novo sozinho; diga isso. */
export function OfflineState(props: PresetProps) {
  return (
    <StateView
      icon={<CloudOff strokeWidth={1.6} />}
      title="Você está sem conexão"
      description="Vamos tentar de novo assim que a internet voltar. O que você já salvou está seguro."
      {...props}
    />
  );
}

/** Manutenção programada. Diga até quando. */
export function MaintenanceState(props: PresetProps & { until?: string }) {
  const { until, ...rest } = props;
  return (
    <StateView
      tone="info"
      icon={<Wrench strokeWidth={1.6} />}
      title="Estamos em manutenção"
      description={until ? `Voltamos até ${until}. Seus dados não são afetados.` : "Voltamos em instantes. Seus dados não são afetados."}
      {...rest}
    />
  );
}

/** Conclusão de um fluxo longo (importação, onboarding, pagamento). */
export function SuccessState(props: PresetProps) {
  return <StateView tone="ok" icon={<CheckCircle2 strokeWidth={1.6} />} title="Tudo certo" {...props} />;
}

/* ------------------------------------------------------------------ */
/* Carregando                                                          */
/* ------------------------------------------------------------------ */

/**
 * Indicador de espera indeterminada. Prefira Skeleton quando a forma do
 * conteúdo é conhecida; Spinner é para ações e áreas sem forma prevista.
 */
export function Spinner({ size = "md", className, label = "Carregando" }: { size?: "xs" | "sm" | "md" | "lg"; className?: string; label?: string }) {
  const dim = { xs: "h-3 w-3 border-[1.5px]", sm: "h-4 w-4 border-2", md: "h-5 w-5 border-2", lg: "h-8 w-8 border-[2.5px]" }[size];
  return (
    <span
      role="status"
      aria-label={label}
      className={cn("inline-block shrink-0 animate-spin rounded-full border-line-strong border-t-ink [animation-duration:700ms]", dim, className)}
    />
  );
}

/** Spinner + frase do que está acontecendo ("Carregando faturas…"). */
export function LoadingState({ label = "Carregando…", hint, className }: { label?: string; hint?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex min-h-[200px] flex-col items-center justify-center gap-3 px-6 py-10 text-center", className)} aria-live="polite">
      <Spinner size="lg" label={label} />
      <div>
        <p className="m-0 text-[13.5px] font-medium text-ink-soft">{label}</p>
        {hint && <p className="m-0 mt-1 text-[12.5px] text-muted">{hint}</p>}
      </div>
    </div>
  );
}

/**
 * Véu sobre um card/tabela enquanto recarrega (filtro trocado, página nova):
 * mantém o conteúdo anterior visível e indica a espera. O pai precisa de
 * `relative`.
 */
export function LoadingOverlay({ show, label = "Atualizando…" }: { show: boolean; label?: string }) {
  if (!show) return null;
  return (
    <div className="absolute inset-0 z-[5] flex items-center justify-center rounded-[inherit] bg-surface/65 backdrop-blur-[1px] animate-fade" aria-live="polite">
      <span className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-[12.5px] text-ink-soft shadow-raised">
        <Spinner size="sm" label={label} />
        {label}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Banner                                                              */
/* ------------------------------------------------------------------ */

type BannerTone = "info" | "warn" | "bad" | "ok" | "accent";
const bannerTone: Record<BannerTone, { cls: string; icon: ReactNode }> = {
  info: { cls: "border-blue/15 bg-info-soft/50 text-ink", icon: <Info className="text-blue" /> },
  warn: { cls: "border-amber/20 bg-amber-soft/60 text-ink", icon: <AlertTriangle className="text-amber" /> },
  bad: { cls: "border-rose/20 bg-rose-soft/60 text-ink", icon: <XCircle className="text-rose" /> },
  ok: { cls: "border-ok/15 bg-ok-soft/70 text-ink", icon: <CheckCircle2 className="text-ok" /> },
  accent: { cls: "border-navy bg-navy text-white", icon: <Megaphone className="text-accent" /> },
};

/**
 * Faixa de anúncio no topo de uma página ou do app (período de teste
 * acabando, fatura atrasada, novidade). Uma por vez. `accent` = novidade de
 * produto (fundo navy). Dispensável só se não for bloqueante.
 */
export function Banner({
  tone = "info",
  title,
  children,
  action,
  onDismiss,
  icon,
  className,
}: {
  tone?: BannerTone;
  title?: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  onDismiss?: () => void;
  icon?: ReactNode;
  className?: string;
}) {
  const t = bannerTone[tone];
  return (
    <div
      role={tone === "bad" ? "alert" : "status"}
      className={cn("flex flex-wrap items-center gap-x-3 gap-y-2 border-b px-4 py-2.5 text-[13px] sm:px-5", t.cls, className)}
    >
      <span aria-hidden className="shrink-0 [&_svg]:h-4 [&_svg]:w-4">
        {icon ?? t.icon}
      </span>
      <p className="m-0 min-w-0 flex-1 leading-snug">
        {title && <span className="font-medium">{title} </span>}
        {/* ds-audit-ignore white-black: tom accent do Banner é bg-navy (escuro nos dois temas) */}
        {children && <span className={tone === "accent" ? "text-white/75" : "text-ink-soft"}>{children}</span>}
      </p>
      {action && (
        <div
          className={cn(
            "shrink-0 [&_a]:font-medium [&_a]:underline-offset-2 hover:[&_a]:underline [&_button]:font-medium",
            tone === "accent" ? "[&_a]:text-accent [&_button]:text-accent" : "[&_a]:text-blue [&_button]:text-blue",
          )}
        >
          {action}
        </div>
      )}
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dispensar aviso"
          className={cn("-mr-1.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md", tone === "accent" ? "text-white/60 hover:bg-white/10 hover:text-white" : "text-muted hover:bg-black/5 hover:text-ink")}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* InlineMessage                                                       */
/* ------------------------------------------------------------------ */

/** Status curto em linha: "Salvo há 2 min", "3 campos com erro", "Sincronizando…". */
export function InlineMessage({
  tone = "neutral",
  children,
  busy,
  className,
}: {
  tone?: "neutral" | "info" | "ok" | "warn" | "bad";
  children: ReactNode;
  busy?: boolean;
  className?: string;
}) {
  const map = {
    neutral: ["text-muted", <Info key="i" />],
    info: ["text-blue", <Info key="i" />],
    ok: ["text-ok", <CheckCircle2 key="i" />],
    warn: ["text-amber", <AlertTriangle key="i" />],
    bad: ["text-rose", <XCircle key="i" />],
  } as const;
  const [cls, icon] = map[tone];
  return (
    <span role={tone === "bad" ? "alert" : "status"} className={cn("inline-flex items-center gap-1.5 text-[12.5px] leading-snug", cls, className)}>
      {busy ? <Spinner size="xs" label="" /> : <span aria-hidden className="shrink-0 [&_svg]:h-3.5 [&_svg]:w-3.5">{icon}</span>}
      <span>{children}</span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* AlertCard                                                           */
/* ------------------------------------------------------------------ */

/**
 * Aviso com lista de problemas e ações (importação com linhas inválidas,
 * formulário com vários erros, checklist de pendências). Cada item pode ter
 * uma ação própria ("Corrigir").
 */
export function AlertCard({
  tone = "warn",
  title,
  description,
  items,
  actions,
  onDismiss,
  className,
}: {
  tone?: "info" | "warn" | "bad" | "ok";
  title: string;
  description?: ReactNode;
  items?: { id: string; label: ReactNode; hint?: ReactNode; action?: ReactNode }[];
  actions?: ReactNode;
  onDismiss?: () => void;
  className?: string;
}) {
  const map = {
    info: { border: "border-blue/15", head: "bg-info-soft/45", icon: <Info className="text-blue" />, dot: "bg-blue" },
    warn: { border: "border-amber/25", head: "bg-amber-soft/50", icon: <AlertTriangle className="text-amber" />, dot: "bg-amber" },
    bad: { border: "border-rose/20", head: "bg-rose-soft/50", icon: <XCircle className="text-rose" />, dot: "bg-rose" },
    ok: { border: "border-ok/20", head: "bg-ok-soft/60", icon: <CheckCircle2 className="text-ok" />, dot: "bg-ok" },
  }[tone];
  return (
    <section role={tone === "bad" ? "alert" : "status"} className={cn("overflow-hidden rounded-xl border bg-surface", map.border, className)}>
      <header className={cn("flex items-start gap-3 px-4 py-3", map.head)}>
        <span aria-hidden className="mt-0.5 shrink-0 [&_svg]:h-4 [&_svg]:w-4">
          {map.icon}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="m-0 text-[13.5px] font-semibold leading-snug">{title}</h3>
          {description && <div className="mt-0.5 text-[12.5px] leading-relaxed text-ink-soft">{description}</div>}
        </div>
        {onDismiss && (
          <button type="button" onClick={onDismiss} aria-label="Dispensar" className="-mr-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted hover:bg-black/5 hover:text-ink">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </header>
      {items && items.length > 0 && (
        <ul className="list-none divide-y divide-line border-t border-line p-0">
          {items.map((it) => (
            <li key={it.id} className="flex items-center gap-3 px-4 py-2.5">
              <span aria-hidden className={cn("h-1.5 w-1.5 shrink-0 rounded-full", map.dot)} />
              <div className="min-w-0 flex-1">
                <div className="text-[13px] text-ink">{it.label}</div>
                {it.hint && <div className="text-[11.5px] text-muted">{it.hint}</div>}
              </div>
              {it.action && <div className="shrink-0 text-[12.5px]">{it.action}</div>}
            </li>
          ))}
        </ul>
      )}
      {actions && <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-line bg-soft/35 px-4 py-2.5">{actions}</footer>}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Contadores                                                          */
/* ------------------------------------------------------------------ */

/**
 * Contador de atenção (não lidas, pendências). Acima de `max` mostra "99+".
 * `tone="bad"` só para o que exige ação imediata.
 */
export function CountBadge({ count, max = 99, tone = "neutral", label, className }: { count: number; max?: number; tone?: "neutral" | "ink" | "bad" | "accent"; label?: string; className?: string }) {
  if (count <= 0) return null;
  const cls = {
    neutral: "bg-soft text-ink-soft ring-1 ring-line",
    ink: "bg-primary text-on-primary",
    bad: "bg-rose text-on-ink",
    accent: "bg-accent-soft text-accent-deep ring-1 ring-accent/25",
  }[tone];
  return (
    <span
      aria-label={label ?? `${count} novos`}
      className={cn("inline-flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-full px-1.5 text-[10.5px] font-semibold tabular-nums leading-none", cls, className)}
    >
      {count > max ? `${max}+` : count}
    </span>
  );
}

/**
 * Ponto de notificação sobre um ícone (sino, avatar). O pai precisa de
 * `relative`. Sempre acompanhe de texto acessível no gatilho.
 */
export function NotificationDot({ tone = "bad", pulse = false, className }: { tone?: "bad" | "accent" | "ok"; pulse?: boolean; className?: string }) {
  const bg = { bad: "bg-rose", accent: "bg-accent", ok: "bg-ok" }[tone];
  return (
    <span aria-hidden className={cn("absolute right-1 top-1 flex h-2 w-2", className)}>
      {pulse && <span className={cn("absolute inset-0 animate-ping rounded-full opacity-60", bg)} />}
      <span className={cn("relative h-2 w-2 rounded-full ring-2 ring-surface", bg)} />
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Toast de promessa                                                   */
/* ------------------------------------------------------------------ */

/**
 * Acompanha uma operação demorada em toast: "Exportando…" → "Relatório
 * exportado" (ou erro). Usa o mesmo Toaster de `notify` (um toast por vez).
 * Para salvar formulário, prefira OperationButton: quem informa é o botão.
 *
 *   await notifyPromise(exportar(), {
 *     loading: "Exportando relatório…",
 *     success: (r) => `Relatório exportado (${r.linhas} linhas)`,
 *     error: "Não foi possível exportar. Tente de novo.",
 *   });
 */
export async function notifyPromise<T>(
  promise: Promise<T>,
  messages: { loading: string; success: string | ((value: T) => string); error: string | ((error: unknown) => string); undo?: (value: T) => void },
): Promise<T> {
  notify(messages.loading, undefined, "info");
  try {
    const value = await promise;
    notify(typeof messages.success === "function" ? messages.success(value) : messages.success, messages.undo ? () => messages.undo?.(value) : undefined, "ok");
    return value;
  } catch (error) {
    notify(typeof messages.error === "function" ? messages.error(error) : messages.error, undefined, "bad");
    throw error;
  }
}
