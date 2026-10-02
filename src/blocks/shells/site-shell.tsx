import { Menu, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Button, ProductMark, cn } from "@g4ai/ds";
import { org } from "../data/workspace";
import { authRoutes } from "./auth-shell";
import { frameHref, goTo, useFrameQuery } from "./frame-route";

/*
 * Moldura do site público do Atlas (landing, preços): cabeçalho com navegação,
 * Entrar / Começar grátis e rodapé. Links de seção da landing funcionam de
 * qualquer página: #/frame/marketing-landing?secao=produto rola até a seção.
 */

type SiteLink = { label: string; section?: string; href?: string };
const links: SiteLink[] = [
  { label: "Produto", section: "produto" },
  { label: "Clientes", section: "clientes" },
  { label: "Preços", href: frameHref("marketing-pricing") },
  { label: "Assistente", href: frameHref("ai-chat") },
];

export function SiteShell({ current, children }: { current: "landing" | "pricing" | "legal"; children: ReactNode }) {
  const [menu, setMenu] = useState(false);
  const secao = useFrameQuery().get("secao");
  useEffect(() => {
    if (current === "landing" && secao) setTimeout(() => document.getElementById(secao)?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
  }, [current, secao]);

  const open = (l: SiteLink) => {
    setMenu(false);
    if (l.href) return goTo(l.href);
    if (current === "landing") document.getElementById(l.section!)?.scrollIntoView({ behavior: "smooth", block: "start" });
    else goTo(frameHref("marketing-landing", { secao: l.section }));
  };
  const isOn = (l: SiteLink) => (current === "pricing" && l.label === "Preços") || false;
  const item = (l: SiteLink, cls: string) => (
    <button key={l.label} type="button" onClick={() => open(l)} aria-current={isOn(l) ? "page" : undefined} className={cn(cls, "text-left", isOn(l) && "font-medium text-ink")}>
      {l.label}
    </button>
  );

  return (
    <div className="h-dvh overflow-y-auto bg-page text-ink">
      <header className="sticky top-0 z-30 border-b border-line bg-page/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-8 px-5 sm:px-8">
          <a href={authRoutes.landing} className="flex items-center gap-2">
            <ProductMark size={26} />
            <span className="text-[15px] font-semibold tracking-tight">{org.product}</span>
          </a>
          <nav aria-label="Principal" className="hidden items-center gap-6 md:flex">
            {links.map((l) => item(l, "text-[13.5px] text-muted hover:text-ink"))}
          </nav>
          <div className="ml-auto hidden items-center gap-2 md:flex">
            <Button variant="quiet" href={authRoutes.login}>
              Entrar
            </Button>
            <Button href={authRoutes.signup}>Começar grátis</Button>
          </div>
          <button type="button" onClick={() => setMenu((m) => !m)} aria-label={menu ? "Fechar menu" : "Abrir menu"} aria-expanded={menu} className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-soft md:hidden">
            {menu ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
        {menu && (
          <nav aria-label="Principal" className="flex flex-col gap-1 border-t border-line px-5 py-3 md:hidden">
            {links.map((l) => item(l, "rounded-lg px-2 py-2 text-[14px] hover:bg-soft"))}
            <Button variant="ghost" className="mt-2" href={authRoutes.login}>
              Entrar
            </Button>
            <Button href={authRoutes.signup}>Começar grátis</Button>
          </nav>
        )}
      </header>

      <main id="topo">{children}</main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-4 px-5 py-8 text-[12.5px] text-muted sm:px-8">
          <span className="flex items-center gap-2">
            <ProductMark size={20} /> © 2026 {org.product}
          </span>
          <nav aria-label="Rodapé" className="ml-auto flex flex-wrap gap-5">
            {[
              ["Preços", frameHref("marketing-pricing")],
              ["Status", frameHref("app-error-pages", { estado: "manutencao" })],
              ["Termos", authRoutes.terms],
              ["Privacidade", authRoutes.privacy],
              ["Entrar", authRoutes.login],
              ["Contato", "mailto:contato@atlas.app"],
            ].map(([l, href]) => (
              <a key={l} href={href} className="hover:text-ink">
                {l}
              </a>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
}
