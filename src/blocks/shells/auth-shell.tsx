import { useState, type ReactNode } from "react";
import { ProductMark, Spinner, cn } from "@g4ai/ds";
import { org } from "../data/workspace";
import { frameHref, goTo } from "./frame-route";
import { atlasRoutes } from "./atlas-shell";

/*
 * Molduras de autenticação do Atlas, compartilhadas por Entrar, Criar conta,
 * Código e Redefinir senha. Os fluxos se ligam por aqui:
 *   landing → criar conta (?plan=) → código (?next=cadastro) → configuração → início
 *   entrar → código (?next=entrar) → início          entrar → redefinir senha → entrar
 */

export const authRoutes = {
  landing: frameHref("marketing-landing"),
  pricing: frameHref("marketing-pricing"),
  login: frameHref("auth-login"),
  signup: frameHref("auth-signup"),
  forgot: frameHref("auth-forgot-password"),
  otp: (next: "entrar" | "cadastro", email?: string) => frameHref("auth-otp", { next, email }),
  wizard: frameHref("onboarding-wizard"),
  home: atlasRoutes.home,
} as const;

/** Marca no topo: volta para o site. */
export function AuthBrand({ className }: { className?: string }) {
  return (
    <a href={authRoutes.landing} className={cn("inline-flex items-center gap-2.5", className)}>
      <ProductMark />
      <span className="text-[15px] font-semibold tracking-tight">{org.product}</span>
    </a>
  );
}

/** Rodapé legal padrão (termos e privacidade levam ao site). */
export function AuthLegal() {
  return (
    <>
      Ao continuar você aceita os{" "}
      <a href={authRoutes.landing} className="underline underline-offset-2 hover:text-ink">
        Termos
      </a>{" "}
      e a{" "}
      <a href={authRoutes.landing} className="underline underline-offset-2 hover:text-ink">
        Política de privacidade
      </a>
      .
    </>
  );
}

/** Coluna única centralizada em fundo gelo: criar conta, código, redefinir senha. */
export function AuthCard({ children, below, width = 440, center = false }: { children: ReactNode; below?: ReactNode; width?: number; center?: boolean }) {
  return (
    <div className="h-dvh overflow-y-auto bg-soft/60">
      <div className="mx-auto flex min-h-full flex-col justify-center px-5 py-10" style={{ maxWidth: width }}>
        <AuthBrand className="mx-auto mb-8" />
        <main className={cn("enter rounded-2xl border border-line bg-surface p-6 shadow-raised sm:p-8", center && "text-center")}>{children}</main>
        {below}
      </div>
    </div>
  );
}

const brand = {
  quote: "Trocamos quatro planilhas e dois sistemas por um só lugar. O time comercial ganhou uma tarde por semana.",
  author: "Renata Farias",
  role: "Diretora de Operações · Grupo Aurora Alimentos",
  stats: [
    { value: "38%", label: "mais negócios fechados" },
    { value: "2,4 d", label: "de ciclo a menos" },
  ],
};

/** Formulário à esquerda + painel de marca navy à direita (some abaixo de 1024px). */
export function AuthSplit({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="grid h-dvh overflow-y-auto bg-page lg:grid-cols-[minmax(0,1fr)_minmax(0,560px)]">
      <div className="flex min-h-full flex-col px-6 py-6 sm:px-10">
        <AuthBrand className="self-start" />
        <main className="enter mx-auto flex w-full max-w-[380px] flex-1 flex-col justify-center py-10">{children}</main>
        <footer className="mx-auto w-full max-w-[380px] text-center text-[12px] text-muted">{footer ?? <AuthLegal />}</footer>
      </div>
      {/* ds-audit-ignore-start white-black: painel de marca bg-navy fica escuro nos dois temas */}
      <aside className="relative hidden overflow-hidden bg-navy p-10 text-white lg:flex lg:flex-col lg:justify-end">
        <svg aria-hidden className="absolute -right-24 -top-24 h-[420px] w-[420px] opacity-[0.12]" viewBox="0 0 200 200" fill="none">
          <circle cx="100" cy="100" r="99" stroke="currentColor" />
          <circle cx="100" cy="100" r="70" stroke="currentColor" />
          <circle cx="100" cy="100" r="41" stroke="var(--ds-accent)" />
          <path d="M40 130 100 55l60 75" stroke="currentColor" />
        </svg>
        <div className="relative">
          <div className="mb-8 grid grid-cols-2 gap-3">
            {brand.stats.map((s) => (
              <div key={s.label} className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
                <div className="text-[26px] font-semibold tabular-nums tracking-tight text-accent">{s.value}</div>
                <div className="mt-0.5 text-[12.5px] text-white/70">{s.label}</div>
              </div>
            ))}
          </div>
          <blockquote className="m-0 text-[18px] font-medium leading-snug tracking-tight">“{brand.quote}”</blockquote>
          <p className="m-0 mt-4 text-[13px] text-white/70">
            <span className="font-medium text-white">{brand.author}</span> · {brand.role}
          </p>
        </div>
      </aside>
      {/* ds-audit-ignore-end */}
    </div>
  );
}

/**
 * Botões de SSO. No exemplo, entram direto no produto após um instante
 * (no seu app: redirecione para o provedor OAuth).
 */
export function SsoButtons({ next = authRoutes.home }: { next?: string }) {
  const [busy, setBusy] = useState<string | null>(null);
  const go = (provider: string) => {
    setBusy(provider);
    setTimeout(() => goTo(next), 900);
  };
  const cls = "inline-flex h-10 w-full items-center justify-center gap-2.5 rounded-lg border border-line bg-surface text-[13.5px] font-medium text-ink hover:bg-soft disabled:opacity-60";
  // ds-audit-ignore-start hex-color: logos oficiais do Google e da Microsoft
  return (
    <div className="grid gap-2">
      <button type="button" className={cls} disabled={!!busy} onClick={() => go("google")}>
        {busy === "google" ? (
          <Spinner size="sm" />
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
            <path fill="#4285F4" d="M22.6 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h6a5.1 5.1 0 0 1-2.2 3.3v2.8h3.6c2-1.9 3.2-4.7 3.2-8.1Z" />
            <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.8c-1 .7-2.2 1.1-3.7 1.1-2.9 0-5.3-1.9-6.2-4.5H2.1v2.9A11 11 0 0 0 12 23Z" />
            <path fill="#FBBC05" d="M5.8 14.1a6.6 6.6 0 0 1 0-4.2V7H2.1a11 11 0 0 0 0 10l3.7-2.9Z" />
            <path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2A11 11 0 0 0 2.1 7l3.7 2.9C6.7 7.3 9.1 5.4 12 5.4Z" />
          </svg>
        )}
        {busy === "google" ? "Conectando ao Google…" : "Continuar com Google"}
      </button>
      <button type="button" className={cls} disabled={!!busy} onClick={() => go("microsoft")}>
        {busy === "microsoft" ? (
          <Spinner size="sm" />
        ) : (
          <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden>
            <path fill="#F25022" d="M1 1h10v10H1z" />
            <path fill="#7FBA00" d="M13 1h10v10H13z" />
            <path fill="#00A4EF" d="M1 13h10v10H1z" />
            <path fill="#FFB900" d="M13 13h10v10H13z" />
          </svg>
        )}
        {busy === "microsoft" ? "Conectando à Microsoft…" : "Continuar com Microsoft"}
      </button>
    </div>
  );
  // ds-audit-ignore-end
}

export function OrDivider({ label = "ou com e-mail" }: { label?: string }) {
  return (
    <div className="my-5 flex items-center gap-3 text-[12px] text-muted">
      <span className="h-px flex-1 bg-line" />
      {label}
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}
