import { ArrowRight, Blocks, BookOpen, Check, Copy, Menu, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { createRoot } from "react-dom/client";
import { Popover, Toaster, cn, normalize, notify, ProductMark, ThemeToggle, applyTheme, brandPresets, typePresets, useTheme, type ThemeMode } from "@g4ai/ds";
import { Palette } from "lucide-react";
import { blocks, pages } from "./.generated/registry";
import { BlockPreview, ShadcnContext, blockCategories, groups, type BlockModule, type PageModule } from "./kit";
import shadcnMap from "../scripts/data/shadcn-map.json";

const shadcnNames = new Map(shadcnMap.components.map((c) => [c.shadcn, c.name]));
/** Selo "Equivalente no shadcn": meta.shadcn da página ou o de/para (scripts/data/shadcn-map.json). */
function shadcnFor(page: PageModule) {
  const own = page.meta.shadcn;
  if (own === false) return [];
  const slugs = own ? (Array.isArray(own) ? own : [own]) : shadcnMap.components.filter((c) => c.pages.includes(page.slug)).map((c) => c.shadcn);
  return [...new Set(slugs)].map((slug) => ({ slug, name: shadcnNames.get(slug) ?? slug }));
}

/*
 * Site do design system, no modelo de ui.shadcn.com. Rotas (hash):
 *   #/                     início: hero + blocos em destaque
 *   #/blocos[/categoria]   galeria de blocos (telas prontas) por categoria
 *   #/p/<slug>             documentação (showcase/pages/<slug>.tsx), com menu lateral
 *   #/frame/<slug>         bloco sozinho em tela cheia (usado pelo iframe)
 */

const useHash = () => {
  const [hash, setHash] = useState(() => location.hash.slice(1) || "/");
  useEffect(() => {
    const on = () => setHash(location.hash.slice(1) || "/");
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return hash;
};

const docGroups = ["Começar", "Fundamentos"] as const;
const sortedPages = [...pages].sort(
  (a, b) => groups.indexOf(a.meta.group) - groups.indexOf(b.meta.group) || (a.meta.order ?? 50) - (b.meta.order ?? 50) || a.meta.title.localeCompare(b.meta.title),
);
const firstOf = (pred: (p: PageModule) => boolean) => sortedPages.find(pred)?.slug ?? sortedPages[0]?.slug;
const isDoc = (p: PageModule) => (docGroups as readonly string[]).includes(p.meta.group);
const byCategory = (cat: string) => blocks.filter((b) => b.meta.category === cat).sort((a, b) => (a.meta.order ?? 50) - (b.meta.order ?? 50));
const categories = blockCategories.filter((c) => byCategory(c).length);
const slugCat = (c: string) => normalize(c).replace(/\s+/g, "-");
const featuredSlugs = ["saas-dashboard", "crm-pipeline", "ats-pipeline", "erp-orders", "srv-work-orders", "fin-cashflow", "clm-contract", "comms-home", "ai-agents-dashboard", "ai-agent", "auth-login", "app-presentation"];
const featured = featuredSlugs.map((s) => blocks.find((b) => b.slug === s)).filter(Boolean) as BlockModule[];

/* ------------------------------------------------------------------ */
/* Cabeçalho                                                           */
/* ------------------------------------------------------------------ */

/** Aparência do site e dos blocos: modo, marca (cores + forma) e tipografia. */
function Appearance() {
  const t = useTheme("light");
  const current = brandPresets.find((b) => b.id === t.brand) ?? brandPresets[0];
  return (
    <Popover
      triggerLabel="Aparência: tema, marca e tipografia"
      triggerClassName="h-8 rounded-lg border border-line bg-surface px-2.5 text-ink hover:border-line-strong"
      width={340}
      align="end"
      trigger={
        <>
          <span aria-hidden className="h-3.5 w-3.5 rounded-full ring-1 ring-line" style={{ background: current.primary }} />
          <Palette className="h-3.5 w-3.5 text-muted" aria-hidden />
          <span className="hidden text-[12.5px] xl:inline">Aparência</span>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <p className="m-0 mb-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-muted">Modo</p>
          <ThemeToggle mode={t.mode} onChange={t.setMode} />
        </div>
        <div>
          <p className="m-0 mb-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-muted">Marca</p>
          <div className="grid grid-cols-2 gap-1.5">
            {brandPresets.map((b) => (
              <button
                key={b.id}
                type="button"
                aria-pressed={t.brand === b.id}
                onClick={() => t.setBrand(b.id)}
                className={cn("flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[12px] ring-1", t.brand === b.id ? "bg-soft font-medium text-ink ring-line-strong" : "text-ink-soft ring-line hover:bg-soft")}
              >
                <span aria-hidden className="flex shrink-0">
                  <span className="h-3.5 w-3.5 rounded-full ring-1 ring-surface" style={{ background: b.primary }} />
                  <span className="-ml-1 h-3.5 w-3.5 rounded-full ring-1 ring-surface" style={{ background: b.accent }} />
                </span>
                <span className="truncate">{b.label}</span>
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="m-0 mb-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-muted">Tipografia</p>
          <div className="space-y-1">
            {typePresets.map((y) => (
              <button
                key={y.id}
                type="button"
                aria-pressed={t.type === y.id}
                onClick={() => t.setType(y.id)}
                className={cn("flex w-full items-baseline justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left ring-1", t.type === y.id ? "bg-soft ring-line-strong" : "ring-transparent hover:bg-soft")}
              >
                <span className="text-[15px] text-ink" style={{ fontFamily: `"${y.sample}", system-ui` }}>
                  Aa
                </span>
                <span className="flex-1 truncate text-[12px] text-ink-soft">{y.label}</span>
              </button>
            ))}
          </div>
        </div>
        <a href="#/p/fund-temas" className="block text-[12px] font-medium text-blue underline decoration-blue/40 underline-offset-2 hover:decoration-blue">
          Criar a marca de um cliente →
        </a>
      </div>
    </Popover>
  );
}

function SiteHeader({ section, onMenu }: { section: string; onMenu: () => void }) {
  const links = [
    ["docs", "Docs", `#/p/${firstOf(isDoc)}`],
    ["componentes", "Componentes", `#/p/${firstOf((p) => !isDoc(p) && p.meta.group !== "Gráficos" && p.meta.group !== "Dashboards")}`],
    ["blocos", "Blocos", "#/blocos"],
    ["graficos", "Gráficos", `#/p/${firstOf((p) => p.meta.group === "Gráficos")}`],
    ["dashboards", "Dashboards", `#/p/${firstOf((p) => p.meta.group === "Dashboards")}`],
  ] as const;
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-page/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1440px] items-center gap-6 px-4 sm:px-6">
        <button type="button" onClick={onMenu} aria-label="Abrir menu" className="-ml-1 inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-soft lg:hidden">
          <Menu className="h-4 w-4" />
        </button>
        <a href="#/" className="flex shrink-0 items-center gap-2">
          <ProductMark size={24} />
          <span className="text-[14px] font-semibold tracking-tight">G4OS-DS</span>
        </a>
        <nav aria-label="Seções" className="hidden items-center gap-5 md:flex">
          {links.map(([id, label, href]) => (
            <a key={id} href={href} aria-current={section === id ? "page" : undefined} className={cn("text-[13px] transition-colors", section === id ? "font-medium text-ink" : "text-muted hover:text-ink")}>
              {label}
            </a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <SiteSearch />
          <Appearance />
          <span className="hidden rounded-md border border-line px-2 py-1 text-[11px] tabular-nums text-muted sm:inline">v0.2</span>
        </div>
      </div>
    </header>
  );
}

/** Busca global: páginas e blocos. ⌘K abre. Renderizada em portal no <body>:
 *  o cabeçalho usa backdrop-filter, que prenderia um `fixed` dentro dele. */
function SiteSearch() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, []);
  useEffect(() => {
    if (open) {
      setTimeout(() => input.current?.focus(), 0);
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
    setQ("");
    setIdx(0);
  }, [open]);
  const groupsOut = useMemo(() => {
    const n = normalize(q.trim());
    // Relevância: título começa com > palavra do título começa com > título contém > grupo/descrição.
    const score = (title: string, rest: string) => {
      if (!n) return 1;
      const t = normalize(title);
      if (t.startsWith(n)) return 4;
      if (t.split(/\s+/).some((w) => w.startsWith(n))) return 3;
      if (t.includes(n)) return 2;
      return normalize(rest).includes(n) ? 1 : 0;
    };
    const rank = <T,>(items: T[], f: (x: T) => [string, string]) =>
      items
        .map((x) => ({ x, s: score(...f(x)) }))
        .filter((r) => r.s > 0)
        .sort((a, b) => b.s - a.s)
        .map((r) => r.x);
    const pagesHit = rank(sortedPages, (p) => [p.meta.title, `${p.meta.group} ${p.meta.description ?? ""}`]).slice(0, n ? 8 : 6);
    const blocksHit = rank(blocks, (b) => [b.meta.title, `${b.meta.category} ${b.meta.description}`]).slice(0, n ? 8 : 5);
    return [
      { label: "Páginas", items: pagesHit.map((p) => ({ key: `p-${p.slug}`, href: `#/p/${p.slug}`, label: p.meta.title, kind: p.meta.group as string, Icon: BookOpen })) },
      { label: "Blocos", items: blocksHit.map((b) => ({ key: `b-${b.slug}`, href: `#/blocos/${slugCat(b.meta.category)}#${b.slug}`, label: b.meta.title, kind: b.meta.category as string, Icon: Blocks })) },
    ].filter((g) => g.items.length);
  }, [q]);
  const flat = groupsOut.flatMap((g) => g.items);
  useEffect(() => {
    list.current?.querySelector(`[data-idx="${idx}"]`)?.scrollIntoView({ block: "nearest" });
  }, [idx]);
  const go = (href: string) => {
    const [route, anchor] = href.slice(1).split("#");
    location.hash = route;
    setOpen(false);
    if (anchor) setTimeout(() => document.getElementById(anchor)?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
  };
  let i = -1;
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label="Buscar no DS (⌘K)" className="inline-flex h-8 min-w-0 shrink items-center gap-2 rounded-lg border border-line bg-surface px-2.5 text-[12.5px] text-muted hover:border-line-strong sm:w-52 lg:w-60">
        <Search className="h-3.5 w-3.5 shrink-0" />
        <span className="hidden min-w-0 flex-1 truncate whitespace-nowrap text-left sm:inline">Buscar no DS…</span>
        <kbd className="hidden shrink-0 rounded border border-line bg-soft px-1 font-sans text-[10.5px] sm:inline">⌘K</kbd>
      </button>
      {open &&
        createPortal(
          <div className="fixed inset-0 z-[95] flex items-start justify-center px-4 pt-[10vh]" role="presentation">
            <button type="button" aria-label="Fechar busca" className="animate-fade absolute inset-0 bg-black/25 backdrop-blur-[2px]" onClick={() => setOpen(false)} />
            <div role="dialog" aria-modal="true" aria-label="Buscar no design system" className="enter relative flex max-h-[70vh] w-full max-w-[600px] flex-col overflow-hidden rounded-2xl border border-line bg-popover shadow-overlay">
              <div className="flex items-center gap-2.5 border-b border-line px-4">
                <Search className="h-4 w-4 shrink-0 text-muted" />
                <input
                  ref={input}
                  value={q}
                  role="combobox"
                  aria-expanded="true"
                  aria-controls="site-search-list"
                  aria-activedescendant={flat[idx] ? `ss-${flat[idx].key}` : undefined}
                  onChange={(e) => {
                    setQ(e.target.value);
                    setIdx(0);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") setOpen(false);
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      setIdx((v) => Math.min(flat.length - 1, v + 1));
                    }
                    if (e.key === "ArrowUp") {
                      e.preventDefault();
                      setIdx((v) => Math.max(0, v - 1));
                    }
                    if (e.key === "Enter" && flat[idx]) go(flat[idx].href);
                  }}
                  placeholder="Buscar componentes, gráficos, blocos…"
                  autoComplete="off"
                  spellCheck={false}
                  data-1p-ignore=""
                  data-lpignore="true"
                  type="search"
                  className="ds-bare h-12 min-w-0 flex-1 appearance-none bg-transparent text-[14px] text-ink outline-none placeholder:text-muted [&::-webkit-search-cancel-button]:hidden"
                  aria-label="Buscar"
                />
                <kbd className="shrink-0 rounded border border-line bg-soft px-1.5 py-0.5 font-sans text-[10.5px] text-muted">esc</kbd>
              </div>
              <div ref={list} id="site-search-list" role="listbox" className="min-h-0 flex-1 overflow-y-auto p-1.5">
                {groupsOut.map((g) => (
                  <div key={g.label} role="group" aria-label={g.label} className="pb-1">
                    <p className="m-0 px-3 pb-1 pt-2.5 text-[10.5px] font-medium uppercase tracking-[0.08em] text-muted">{g.label}</p>
                    {g.items.map((r) => {
                      i += 1;
                      const me = i;
                      const on = me === idx;
                      return (
                        <button
                          key={r.key}
                          id={`ss-${r.key}`}
                          data-idx={me}
                          role="option"
                          aria-selected={on}
                          type="button"
                          onMouseMove={() => setIdx(me)}
                          onClick={() => go(r.href)}
                          className={cn("flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[13px]", on ? "bg-soft text-ink" : "text-ink-soft")}
                        >
                          <span className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-md border border-line", on ? "bg-surface" : "bg-soft/60")}>
                            <r.Icon className="h-3.5 w-3.5 text-muted" />
                          </span>
                          <span className="min-w-0 flex-1 truncate font-medium text-ink">{r.label}</span>
                          <span className="shrink-0 text-[11.5px] text-muted">{r.kind}</span>
                          {on && <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted" />}
                        </button>
                      );
                    })}
                  </div>
                ))}
                {!flat.length && (
                  <div className="px-3 py-10 text-center">
                    <p className="m-0 text-[13.5px] font-medium">Nada encontrado para “{q}”</p>
                    <p className="m-0 mt-1 text-[12.5px] text-muted">Tente “tabela”, “funil”, “login” ou o nome de um app (CRM, ERP…).</p>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4 border-t border-line bg-soft/50 px-4 py-2 text-[11.5px] text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <kbd className="rounded border border-line bg-surface px-1 font-sans">↑</kbd>
                  <kbd className="rounded border border-line bg-surface px-1 font-sans">↓</kbd> navegar
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <kbd className="rounded border border-line bg-surface px-1 font-sans">↵</kbd> abrir
                </span>
                <span className="ml-auto tabular-nums">{flat.length} resultados</span>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Início                                                              */
/* ------------------------------------------------------------------ */

const INSTALL = "pnpm add @g4ai/ds";

function InstallCommand() {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(INSTALL);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      notify(`Não foi possível copiar. Comando: ${INSTALL}`, undefined, "bad");
    }
  };
  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? "Comando copiado" : `Copiar comando: ${INSTALL}`}
      className="mx-auto mt-5 inline-flex h-10 items-center gap-3 rounded-lg bg-soft px-4 font-mono text-[13px] text-ink ring-1 ring-line transition-colors hover:bg-surface"
    >
      <span className="text-muted">$</span> {INSTALL}
      {copied ? <Check className="h-4 w-4 text-ok" aria-hidden /> : <Copy className="h-4 w-4 text-muted" aria-hidden />}
    </button>
  );
}

function Home() {
  const [tab, setTab] = useState(featured[0]?.slug);
  const current = featured.find((b) => b.slug === tab) ?? featured[0];
  return (
    <div className="mx-auto max-w-[1440px] px-4 sm:px-6">
      <section className="mx-auto max-w-[760px] py-14 text-center sm:py-20">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1 text-[12px] text-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" /> {blocks.length} blocos · {pages.length} páginas de componentes
        </span>
        <h1 className="m-0 mt-5 text-[34px] font-semibold leading-[1.1] tracking-[-0.04em] sm:text-[48px]">Construa qualquer produto G4 OS com os mesmos blocos</h1>
        <p className="mx-auto mt-4 max-w-[600px] text-[15px] leading-relaxed text-muted">
          CRM, ATS, ERP, financeiro, portais. Componentes React acessíveis, gráficos sem dependência e telas inteiras prontas para copiar — tudo na mesma linguagem visual.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-2">
          <a href="#/blocos" className="ui-button ui-button-primary inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-[13.5px] font-medium text-on-primary hover:bg-primary/90">
            Ver blocos <ArrowRight className="h-4 w-4" />
          </a>
          <a href={`#/p/${firstOf(isDoc)}`} className="inline-flex h-10 items-center rounded-lg bg-surface px-4 text-[13.5px] font-medium ring-1 ring-line hover:bg-soft">
            Começar
          </a>
        </div>
        <InstallCommand />
        <p className="m-0 mt-3 text-[12px] text-muted">
          Para agentes de IA: <a href="./llms.txt" className="text-blue underline decoration-blue/40 underline-offset-2 hover:decoration-blue">llms.txt</a> · <a href="#/p/guia-agentes" className="text-blue underline decoration-blue/40 underline-offset-2 hover:decoration-blue">servidor MCP</a>
        </p>
      </section>
      {current && (
        <section>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-line">
            {featured.map((b) => (
              <button
                key={b.slug}
                type="button"
                onClick={() => setTab(b.slug)}
                aria-pressed={b.slug === current.slug}
                className={cn("-mb-px border-b-2 pb-2.5 text-[13.5px]", b.slug === current.slug ? "border-ink font-medium text-ink" : "border-transparent text-muted hover:text-ink")}
              >
                {b.meta.category === "SaaS" ? "Dashboard" : b.meta.category}
              </button>
            ))}
            <a href="#/blocos" className="mb-2 ml-auto inline-flex h-8 items-center gap-1 rounded-lg bg-soft px-3 text-[12.5px] font-medium hover:bg-line">
              Todos os blocos <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
          <BlockPreview key={current.slug} block={current} />
        </section>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Blocos                                                              */
/* ------------------------------------------------------------------ */

function BlocksPage({ category }: { category?: string }) {
  const list = category ? byCategory(category) : featured;
  useEffect(() => {
    const anchor = location.hash.split("#")[2];
    if (anchor) setTimeout(() => document.getElementById(anchor)?.scrollIntoView(), 50);
  }, [category]);
  return (
    <div className="mx-auto max-w-[1440px] px-4 sm:px-6">
      <section className="py-10">
        <h1 className="m-0 text-[30px] font-semibold tracking-[-0.035em]">Blocos</h1>
        <p className="m-0 mt-2 max-w-[640px] text-[14px] leading-relaxed text-muted">
          Telas completas feitas só com componentes do DS. Copie o arquivo de <code className="font-mono text-[12.5px]">src/blocks/</code>, troque os dados de exemplo (topo do arquivo) pelos seus e ajuste.
        </p>
      </section>
      <nav aria-label="Categorias" className="sticky top-14 z-20 -mx-4 flex gap-1 overflow-x-auto border-b border-line bg-page/85 px-4 py-2.5 backdrop-blur-md [scrollbar-width:none] sm:-mx-6 sm:px-6">
        {[["Destaque", "#/blocos", !category] as const, ...categories.map((c) => [c, `#/blocos/${slugCat(c)}`, c === category] as const)].map(([label, href, on]) => (
          <a
            key={label}
            href={href}
            aria-current={on ? "page" : undefined}
            className={cn("shrink-0 rounded-lg px-3 py-1.5 text-[13px]", on ? "bg-primary font-medium text-on-primary" : "text-muted hover:bg-soft hover:text-ink")}
          >
            {label}
            {label !== "Destaque" && <span className={cn("ml-1.5 text-[11px] tabular-nums", on ? "text-on-primary/60" : "text-muted")}>{byCategory(label).length}</span>}
          </a>
        ))}
      </nav>
      <div className="divide-y divide-line pb-16">
        {list.map((b) => (
          <BlockPreview key={b.slug} block={b} />
        ))}
        {!list.length && <p className="py-16 text-center text-muted">Nenhum bloco nesta categoria ainda.</p>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Documentação                                                        */
/* ------------------------------------------------------------------ */

function DocsNav({ current, onNavigate }: { current?: string; onNavigate?: () => void }) {
  const ref = useRef<HTMLElement>(null);
  // Mantém a página atual visível no menu (sem mexer na rolagem da página).
  useEffect(() => {
    const nav = ref.current;
    const el = nav?.querySelector<HTMLElement>('[aria-current="page"]');
    const box = nav?.closest<HTMLElement>("[data-docs-scroll]");
    if (!el || !box) return;
    const top = el.offsetTop - box.offsetTop;
    if (top < box.scrollTop + 48 || top > box.scrollTop + box.clientHeight - 80) box.scrollTo({ top: top - box.clientHeight / 3 });
  }, [current]);
  return (
    <nav ref={ref} aria-label="Documentação" className="pb-10 pt-6">
      {groups.map((g) => {
        const items = sortedPages.filter((p) => p.meta.group === g);
        if (!items.length) return null;
        return (
          <div key={g} className="mb-5">
            <p className="m-0 mb-1.5 px-2 text-[12.5px] font-semibold text-ink">{g}</p>
            <ul className="m-0 list-none space-y-px p-0">
              {items.map((p) => (
                <li key={p.slug}>
                  <a
                    href={`#/p/${p.slug}`}
                    onClick={onNavigate}
                    aria-current={current === p.slug ? "page" : undefined}
                    className={cn("block rounded-md px-2 py-1 text-[13px]", current === p.slug ? "bg-soft font-medium text-ink" : "text-muted hover:text-ink")}
                  >
                    {p.meta.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}

/** "Nesta página": lê os h2 das seções e marca a que está sendo lida (scrollspy). */
function Toc({ deps }: { deps: string }) {
  const [items, setItems] = useState<{ id: string; text: string }[]>([]);
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    const t = setTimeout(() => {
      const hs = [...document.querySelectorAll<HTMLElement>("#doc-content h2[data-toc]")];
      setItems(
        hs.map((h, i) => {
          if (!h.id) h.id = `s-${i}-${normalize(h.textContent ?? "").replace(/[^a-z0-9]+/g, "-")}`;
          return { id: h.id, text: h.textContent ?? "" };
        }),
      );
      setActive(hs[0]?.id ?? null);
    }, 60);
    return () => clearTimeout(t);
  }, [deps]);
  useEffect(() => {
    if (!items.length) return;
    const onScroll = () => {
      // Seção ativa = último título que já passou de 30 % da altura da janela.
      const line = window.innerHeight * 0.3;
      let current = items[0].id;
      for (const it of items) {
        const el = document.getElementById(it.id);
        if (el && el.getBoundingClientRect().top <= line) current = it.id;
      }
      // No fim da página, marca a última seção.
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) current = items[items.length - 1].id;
      setActive(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [items]);
  // A coluna existe sempre (mesmo vazia) para o conteúdo não mudar de largura depois de medir gráficos.
  if (items.length < 2) return <div aria-hidden className="hidden w-52 shrink-0 xl:block" />;
  return (
    <nav aria-label="Nesta página" className="docs-scroll sticky top-14 hidden max-h-[calc(100dvh-3.5rem)] w-52 shrink-0 self-start overflow-y-auto overscroll-contain pb-8 pt-8 xl:block">
      <p className="m-0 mb-2 text-[12.5px] font-semibold">Nesta página</p>
      <ul className="m-0 list-none border-l border-line p-0">
        {items.map((it) => {
          const on = it.id === active;
          return (
            <li key={it.id}>
              <a
                href={`#${it.id}`}
                aria-current={on ? "location" : undefined}
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(it.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
                  setActive(it.id);
                }}
                className={cn("-ml-px block border-l py-1 pl-3 text-[12.5px] leading-snug transition-colors", on ? "border-ink font-medium text-ink" : "border-transparent text-muted hover:text-ink")}
              >
                {it.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function DocsLayout({ page }: { page: PageModule }) {
  const P = page.default;
  const i = sortedPages.indexOf(page);
  const prev = sortedPages[i - 1];
  const next = sortedPages[i + 1];
  return (
    <div className="mx-auto flex max-w-[1440px] gap-10 px-4 sm:px-6">
      <aside
        data-docs-scroll=""
        className="docs-scroll sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-56 shrink-0 overflow-y-auto overscroll-contain border-r border-line pr-4 lg:block"
      >
        <DocsNav current={page.slug} />
      </aside>
      <div id="doc-content" className="min-w-0 flex-1 pb-20 pt-8" data-ds-content="">
        <ShadcnContext.Provider value={shadcnFor(page)}>
          <P />
        </ShadcnContext.Provider>
        <div className="mx-auto mt-10 flex max-w-[1120px] justify-between gap-3 border-t border-line pt-6">
          {prev ? (
            <a href={`#/p/${prev.slug}`} className="rounded-lg border border-line px-3 py-2 text-[12.5px] hover:bg-soft">
              <span className="block text-[11px] text-muted">Anterior</span>
              {prev.meta.title}
            </a>
          ) : (
            <span />
          )}
          {next && (
            <a href={`#/p/${next.slug}`} className="rounded-lg border border-line px-3 py-2 text-right text-[12.5px] hover:bg-soft">
              <span className="block text-[11px] text-muted">Próxima</span>
              {next.meta.title}
            </a>
          )}
        </div>
      </div>
      <Toc deps={page.slug} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Frame (iframe dos blocos)                                           */
/* ------------------------------------------------------------------ */

/** Dentro do iframe de preview: nunca renderiza o site; links que sairiam do bloco viram aviso. */
const inPreview = typeof window !== "undefined" && window.self !== window.top;

function Frame({ block }: { block: BlockModule }) {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || e.defaultPrevented) return;
      const href = a.getAttribute("href") ?? "";
      if (href.startsWith("#/frame/") || /^https?:/.test(href) || href.startsWith("mailto:") || href.startsWith("tel:")) return;
      e.preventDefault();
      notify("Link de exemplo: no seu app, ele leva à rota correspondente.", undefined, "info");
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);
  useEffect(() => {
    document.documentElement.classList.add("ds-app");
    document.title = `${block.meta.title} · G4OS-DS`;
  }, [block]);
  const B = block.default;
  return (
    <>
      <B />
      <Toaster />
    </>
  );
}

/* ------------------------------------------------------------------ */

const scrollMemory = new Map<string, number>();

function App() {
  const navType = useRef<"push" | "pop">("push");
  useEffect(() => {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    const onPop = () => (navType.current = "pop");
    let last = location.hash;
    const remember = () => scrollMemory.set(last.slice(1).split("#")[0].split("?")[0] || "/", window.scrollY);
    const onHash = () => {
      last = location.hash;
    };
    window.addEventListener("popstate", onPop);
    window.addEventListener("scroll", remember, { passive: true });
    window.addEventListener("hashchange", onHash);
    return () => {
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("scroll", remember);
      window.removeEventListener("hashchange", onHash);
    };
  }, []);
  const hash = useHash();
  const [menu, setMenu] = useState(false);
  const theme = useTheme("light"); // aplica tema/marca salvos (site e iframes, sincronizados via storage)
  const [pathAndQuery] = hash.split("#");
  const [path, query = ""] = pathAndQuery.split("?");
  const [kind, slug] = path.replace(/^\//, "").split("/");
  // #/frame/<slug>?theme=dark&brand=oceano força tema/marca (screenshots, links de revisão)
  useEffect(() => {
    const q = new URLSearchParams(query);
    const t = q.get("theme") as ThemeMode | null;
    if (t || q.get("brand")) applyTheme(t ?? theme.mode, q.get("brand") ?? theme.brand);
  }, [query, theme.mode, theme.brand]);
  const lastFrame = useRef<BlockModule | undefined>(undefined);
  const frame = kind === "frame" ? blocks.find((b) => b.slug === slug) : inPreview ? lastFrame.current ?? blocks[0] : undefined;
  if (frame) lastFrame.current = frame;
  const page = kind === "p" ? pages.find((p) => p.slug === slug) : undefined;
  const category = kind === "blocos" && slug ? categories.find((c) => slugCat(c) === slug) : undefined;
  const section = kind === "blocos" ? "blocos" : page ? (isDoc(page) ? "docs" : page.meta.group === "Gráficos" ? "graficos" : page.meta.group === "Dashboards" ? "dashboards" : "componentes") : "";

  useEffect(() => {
    if (frame) return;
    // Nova página começa no topo; "voltar" do navegador restaura a posição salva.
    const saved = scrollMemory.get(path);
    if (!location.hash.split("#")[2]) window.scrollTo(0, navType.current === "pop" && saved != null ? saved : 0);
    navType.current = "push";
    document.title = `${page?.meta.title ?? category ?? (kind === "blocos" ? "Blocos" : "Início")} · G4OS-DS`;
    setMenu(false);
  }, [path, frame, page, category, kind]);

  if (frame) return <Frame block={frame} />;

  return (
    <div className="min-h-dvh bg-page">
      <SiteHeader section={section} onMenu={() => setMenu(true)} />
      {menu && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button type="button" aria-label="Fechar menu" className="absolute inset-0 bg-black/20" onClick={() => setMenu(false)} />
          <div className="absolute inset-y-0 left-0 w-[280px] overflow-y-auto border-r border-line bg-surface px-4">
            <div className="flex flex-col gap-1 border-b border-line py-4 text-[14px]">
              <a href="#/">Início</a>
              <a href="#/blocos">Blocos</a>
            </div>
            <DocsNav current={page?.slug} onNavigate={() => setMenu(false)} />
          </div>
        </div>
      )}
      {kind === "blocos" ? <BlocksPage category={category} /> : page ? <DocsLayout page={page} /> : <Home />}
      <Toaster />
    </div>
  );
}

// Preview com ?theme=/&brand= no hash: aplica antes da primeira pintura (sem piscar).
{
  const q = new URLSearchParams(location.hash.split("?")[1] ?? "");
  const t = q.get("theme") as ThemeMode | null;
  if (t || q.get("brand")) applyTheme(t ?? "light", q.get("brand") ?? undefined);
}

createRoot(document.getElementById("root")!).render(<App />);
