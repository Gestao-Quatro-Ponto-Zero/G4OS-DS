import { useMemo, useState } from "react";
import { AppGrid, AppTile, Button, Empty, HalftoneBand, MarketplaceHero, Page, cn, normalize, notify } from "@g4os/ds";
import { appCategories, apps as seed, type AppCategory } from "./data/apps";
import { go, goTo } from "./shells/frame-route";
import { StudioShell, studioRoutes } from "./shells/studio-shell";

export const meta = {
  title: "Marketplace de apps",
  description: "Conecte as ferramentas do time: busca, categorias, faixa de exemplos de pedido e grade de apps com conectar/conectado.",
  category: "Aplicação",
  height: 900,
  order: 30,
  concept: {
    goal: "Descobrir e conectar as ferramentas que o time já usa, entendendo o que cada uma permite pedir à IA.",
    patterns: [
      "Catálogo: título central, busca e categorias em abas",
      "Faixa com exemplos de pedido por app (mostra o valor antes de conectar)",
      "Grade de apps com '+' ou ✓; conectar no lugar com desfazer",
      "Estado vazio quando a busca não acha",
    ],
    adapt: [
      "Loja de integrações, módulos de ERP, templates de relatório",
    ],
    avoid: [
      "Conectar sem mostrar permissões no detalhe",
    ],
  },
} as const;

/*
 * Marketplace de integrações do Estúdio G4. Conectar abre a autorização (aqui,
 * simulada com toast + desfazer); o nome do app leva ao detalhe da conexão.
 */
export default function AppMarketplace() {
  const [connected, setConnected] = useState<Record<string, boolean>>(() => Object.fromEntries(seed.map((a) => [a.id, a.connected])));
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<AppCategory | "Destaques" | "Conectados">("Destaques");
  const n = normalize(q.trim());
  const list = useMemo(
    () =>
      seed.filter((a) => {
        if (n && !normalize(`${a.name} ${a.description} ${a.category}`).includes(n)) return false;
        if (n) return true; // busca ignora a aba
        if (cat === "Destaques") return a.featured;
        if (cat === "Conectados") return connected[a.id];
        return a.category === cat;
      }),
    [n, cat, connected],
  );
  const connect = (id: string, name: string) => {
    setConnected((c) => ({ ...c, [id]: true }));
    notify(`${name} conectado`, () => setConnected((c) => ({ ...c, [id]: false })));
  };
  const heroApps = ["slack", "github", "gmail"].map((id) => seed.find((a) => a.id === id)!);
  const tabsList: (AppCategory | "Destaques" | "Conectados")[] = ["Destaques", "Conectados", ...appCategories];
  const connectedCount = Object.values(connected).filter(Boolean).length;

  return (
    <StudioShell current={studioRoutes.apps} mode="chat">
      <Page>
        <div className="relative mx-auto w-full max-w-[880px]">
          <HalftoneBand className="absolute inset-x-0 -top-8" height={110} />
          <header className="relative pt-6 text-center">
            <h1 className="m-0 text-balance text-[22px] font-medium tracking-[-0.02em] sm:text-[25px]">Conecte as ferramentas que seu time já usa</h1>
            <p className="m-0 mt-2 text-[13.5px] text-muted">
              {connectedCount} apps conectados · o agente só acessa o que você autorizar, por conta.
            </p>
            <label className="focus-field mx-auto mt-5 flex h-10 max-w-[560px] items-center gap-2 rounded-xl border border-line bg-surface px-3 text-left">
              <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-muted" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar no marketplace…"
                aria-label="Buscar no marketplace"
                autoComplete="off"
                className="ds-bare h-full min-w-0 flex-1 bg-transparent text-[14px] text-ink outline-none placeholder:text-muted"
              />
            </label>
          </header>

          {!n && (
            <MarketplaceHero
              className="mt-6"
              prompts={heroApps.map((a) => ({
                app: a,
                text: a.prompt,
                onClick: () => (connected[a.id] ? goTo(`${studioRoutes.sessions}?novo=${encodeURIComponent(`${a.name}: ${a.prompt}`)}`) : go("app-connection", a.id)),
              }))}
            />
          )}

          <div className="mt-8 flex items-center gap-1 overflow-x-auto pb-1 [scrollbar-width:none]" role="tablist" aria-label="Categorias">
            {tabsList.map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={!n && cat === t}
                onClick={() => {
                  setCat(t);
                  setQ("");
                }}
                className={cn("h-8 shrink-0 rounded-lg px-3 text-[13px] transition-colors", !n && cat === t ? "bg-ink/[0.07] font-medium text-ink" : "text-muted hover:bg-ink/[0.04] hover:text-ink")}
              >
                {t}
              </button>
            ))}
          </div>

          <h2 className="m-0 mb-1 mt-5 px-2.5 text-[15px] font-medium">{n ? `${list.length} resultados para “${q}”` : cat}</h2>
          {list.length ? (
            <AppGrid>
              {list.map((a) => (
                <AppTile
                  key={a.id}
                  app={a}
                  connected={connected[a.id]}
                  href={`#/frame/app-connection?id=${a.id}`}
                  onConnect={() => connect(a.id, a.name)}
                  badge={a.isNew ? <span className="text-[11.5px] font-medium text-rose">Novo</span> : undefined}
                />
              ))}
            </AppGrid>
          ) : (
            <Empty
              title={n ? `Nenhum app para “${q}”` : "Nenhum app conectado nesta categoria"}
              hint="Tente outro nome ou peça a integração ao time de plataforma."
              action={
                <Button size="sm" variant="ghost" onClick={() => (n ? setQ("") : setCat("Destaques"))}>
                  {n ? "Limpar busca" : "Ver destaques"}
                </Button>
              }
            />
          )}
        </div>
      </Page>
    </StudioShell>
  );
}
