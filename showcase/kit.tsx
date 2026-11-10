/*
 * Kit de documentação do showcase. NÃO faz parte do pacote: são as molduras
 * que as páginas (showcase/pages/*.tsx) usam para mostrar componentes.
 *
 * Contrato de página (showcase/pages/<slug>.tsx):
 *   export const meta: PageMeta = { title, group, order?, description? };
 *   export default function Page() { return <DocPage …>…</DocPage>; }
 *
 * Contrato de bloco (src/blocks/<slug>.tsx):
 *   export const meta: BlockMeta = { title, description, category, height? };
 *   export default function Block() { … }   // tela inteira, dados de exemplo no topo do arquivo
 */
import { ArrowUpRight, Check, Copy, Maximize2, Monitor, Moon, RotateCw, Smartphone, Sun, Tablet } from "lucide-react";
import { createContext, useContext, useEffect, useRef, useState, type ComponentType, type ReactNode } from "react";
import { CodeBlock as DsCodeBlock, cn, normalize } from "@g4ai/ds";
import { blockFiles } from "./.generated/registry";

export const groups = [
  "Começar",
  "Fundamentos",
  "Ações e exibição",
  "Formulários",
  "Navegação",
  "Sobreposições",
  "Feedback e estados",
  "Coleções",
  "Filtros e busca",
  "Gráficos",
  "Dashboards",
  "Mídia e conteúdo",
  "IA e interação",
] as const;
export type PageMeta = {
  title: string;
  group: (typeof groups)[number];
  order?: number;
  description?: string;
  /**
   * Componente(s) equivalente(s) no shadcn/ui (slug de ui.shadcn.com/docs/components/<slug>).
   * Opcional: sem ele, o selo vem de scripts/data/shadcn-map.json (campo `pages`).
   * `false` esconde o selo.
   */
  shadcn?: string | string[] | false;
};

/** Equivalentes no shadcn da página atual (preenchido pelo DocsLayout). */
export const ShadcnContext = createContext<{ slug: string; name: string }[]>([]);

function ShadcnChips() {
  const items = useContext(ShadcnContext);
  if (!items.length) return null;
  return (
    <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[12px] text-muted">
      <span>Equivalente no shadcn:</span>
      {items.map((it) => (
        <a
          key={it.slug}
          href={`https://ui.shadcn.com/docs/components/${it.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-full border border-line bg-surface px-2 py-0.5 font-medium text-ink-soft no-underline hover:border-line-strong hover:text-ink"
        >
          {it.name}
          <ArrowUpRight aria-hidden className="h-3 w-3" />
          <span className="sr-only">(abre ui.shadcn.com em nova aba)</span>
        </a>
      ))}
    </div>
  );
}
export type PageModule = { meta: PageMeta; default: ComponentType; slug: string; source: string };

export const blockCategories = ["SaaS", "CRM", "ATS", "ERP", "Serviços", "Financeiro", "Contratos", "Comunicação", "Autenticação", "Configurações", "Onboarding", "Aplicação", "IA", "Marketing"] as const;
/** Conceito do bloco: o que ele quer passar, para reaproveitar com intenção. */
export type BlockConcept = {
  /** Problema que a tela resolve e para quem. */
  goal: string;
  /** Padrões de layout/interação aplicados ("cabeçalho fixo que compacta", …). */
  patterns?: readonly string[];
  /** Em que apps faz sentido e o que adaptar. */
  adapt?: readonly string[];
  /** O que evitar ao copiar. */
  avoid?: readonly string[];
};
export type BlockMeta = { title: string; description: string; category: (typeof blockCategories)[number]; height?: number; order?: number; concept?: BlockConcept };
export type BlockModule = { meta: BlockMeta; default: ComponentType; slug: string; source: string };

/* ------------------------------------------------------------------ */

export function DocPage({ title, description, children, kicker }: { title: string; description?: ReactNode; kicker?: string; children: ReactNode }) {
  return (
    <article className="mx-auto w-full max-w-[1120px]">
      <header className="border-b border-line pb-6">
        {kicker && <p className="m-0 mb-2 text-[11px] font-medium uppercase tracking-[0.1em] text-muted">{kicker}</p>}
        <h1 className="m-0 text-[25px] font-semibold tracking-[-0.035em]">{title}</h1>
        {description && <div className="m-0 mt-2 max-w-[680px] text-[13.5px] leading-relaxed text-muted">{description}</div>}
        <ShadcnChips />
      </header>
      <div className="divide-y divide-line">{children}</div>
    </article>
  );
}

/** Seção com título, regra de uso e conteúdo. */
export function DocSection({ id, title, rule, children }: { id?: string; title: string; rule?: ReactNode; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20 py-9">
      <h2 data-toc="" className="m-0 scroll-mt-20 text-[18px] font-semibold tracking-tight">{title}</h2>
      {rule && <div className="m-0 mt-1.5 max-w-[720px] text-[13px] leading-relaxed text-muted">{typeof rule === "string" ? inlineCode(rule) : rule}</div>}
      <div className="mt-5 space-y-6">{children}</div>
    </section>
  );
}

/** Exemplo vivo com aba de código. `code` é o trecho de uso (não o arquivo todo). */
/** `trecho` em descrições de string vira <code>. */
function inlineCode(text: string): ReactNode {
  if (!text.includes("`")) return text;
  return text.split("`").map((part, i) => (i % 2 ? <code key={i} className="rounded bg-soft px-1 font-mono text-[11.5px] text-ink-soft">{part}</code> : part));
}

export function Demo({ title, description, code, children, className, bare }: { title?: string; description?: ReactNode; code?: string; children: ReactNode; className?: string; bare?: boolean }) {
  const [tab, setTab] = useState<"preview" | "code">("preview");
  return (
    <div className="min-w-0">
      {(title || code) && (
        <div className="mb-2 flex items-end justify-between gap-3">
          <div className="min-w-0">
            {title && <p className="m-0 text-[11px] font-medium uppercase tracking-[0.08em] text-muted">{title}</p>}
            {description && <p className="m-0 mt-1 text-[12.5px] text-muted">{typeof description === "string" ? inlineCode(description) : description}</p>}
          </div>
          {code && (
            <div className="segmented-control shrink-0" role="group" aria-label="Visualização">
              <button type="button" aria-pressed={tab === "preview"} onClick={() => setTab("preview")}>
                Preview
              </button>
              <button type="button" aria-pressed={tab === "code"} onClick={() => setTab("code")}>
                Código
              </button>
            </div>
          )}
        </div>
      )}
      {tab === "code" && code ? (
        <CodeBlock code={code} />
      ) : bare ? (
        children
      ) : (
        <div className={cn("rounded-xl border border-line bg-surface p-5", className ?? "flex flex-wrap items-center gap-3")}>{children}</div>
      )}
    </div>
  );
}

/** Especificação rápida: rótulo + moldura. */
export function Specimen({ label, children, className }: { label?: string; children: ReactNode; className?: string }) {
  return (
    <div className="min-w-0">
      {label && <p className="m-0 mb-2 text-[11px] font-medium uppercase tracking-[0.08em] text-muted">{label}</p>}
      <div className={className ?? "flex flex-wrap items-center gap-3 rounded-xl border border-line bg-surface p-5"}>{children}</div>
    </div>
  );
}

export function Swatch({ name, value, note }: { name: string; value: string; note?: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface">
      <div className="h-14 border-b border-line" style={{ background: value }} />
      <div className="px-3 py-2">
        <div className="text-[12.5px] font-medium">{name}</div>
        <div className="font-mono text-[11px] text-muted">{value}</div>
        {note && <div className="mt-0.5 text-[11px] leading-snug text-muted">{note}</div>}
      </div>
    </div>
  );
}

/** Faça / Não faça. */
export function Rules({ items }: { items: { do: ReactNode; dont?: ReactNode }[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {items.map((it, i) => (
        <div key={i} className="contents">
          <div className="rounded-xl border border-ok/20 bg-ok-soft/40 px-4 py-3 text-[13px] leading-relaxed">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.08em] text-ok">Faça</span>
            {it.do}
          </div>
          {it.dont ? (
            <div className="rounded-xl border border-rose/20 bg-rose-soft/40 px-4 py-3 text-[13px] leading-relaxed">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.08em] text-rose">Evite</span>
              {it.dont}
            </div>
          ) : (
            <span className="hidden md:block" />
          )}
        </div>
      ))}
    </div>
  );
}

/** Tabela de props: [nome, tipo, padrão, descrição]. */
export function PropsTable({ rows }: { rows: [string, string, string, string][] }) {
  return (
    <div tabIndex={0} role="region" aria-label="Props" className="overflow-x-auto rounded-xl border border-line outline-none focus-visible:ring-2 focus-visible:ring-muted/50">
      <table className="w-full text-left text-[12.5px]">
        <thead className="border-b border-line bg-soft/60 text-[11.5px] text-muted">
          <tr>
            <th className="px-3 py-2">Prop</th>
            <th className="px-3 py-2">Tipo</th>
            <th className="px-3 py-2">Padrão</th>
            <th className="px-3 py-2">Descrição</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map(([n, t, d, desc]) => (
            <tr key={n}>
              <td className="px-3 py-2 font-mono text-[12px] font-medium">{n}</td>
              <td className="px-3 py-2 font-mono text-[11.5px] text-blue">{t}</td>
              <td className="px-3 py-2 font-mono text-[11.5px] text-muted">{d}</td>
              <td className="px-3 py-2 text-ink-soft">{desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Código                                                              */
/* ------------------------------------------------------------------ */

/** Código do site: o CodeBlock do próprio DS (copiar, altura limitada, realce mínimo). */
export function CodeBlock({ code, maxHeight = 520, title, className }: { code: string; maxHeight?: number; title?: string; className?: string }) {
  return <DsCodeBlock language="tsx" title={title} code={code} maxHeight={maxHeight} className={className} />;
}

/* ------------------------------------------------------------------ */
/* Bloco: preview em iframe (responsivo de verdade) + código           */
/* ------------------------------------------------------------------ */

const viewports = { desktop: "100%", tablet: "820px", mobile: "390px" } as const;

/** As nove anatomias de docs/padroes/anatomia-de-pagina.md, pela letra que abre `concept.patterns`. */
export const anatomies = {
  A: "Lista",
  B: "Painel",
  C: "Registro",
  D: "Configurações",
  E: "Quadro",
  F: "Mestre-detalhe",
  G: "App de altura total",
  H: "Fluxo focado",
  I: "Público",
} as const;
export type AnatomyId = keyof typeof anatomies;
/** Anatomia do bloco, lida do primeiro padrão do conceito ("Anatomia C · Registro com abas…"). */
export function anatomyOf(block: BlockModule): AnatomyId | null {
  const first = block.meta.concept?.patterns?.[0] ?? "";
  const letter = /^Anatomia ([A-I]) ·/.exec(first)?.[1] as AnatomyId | undefined;
  if (letter) return letter;
  const n = normalize(first);
  if (n.includes("publico")) return "I";
  if (n.includes("conversa") || n.includes("casca de app")) return "G";
  return null;
}
export const categorySlug = (c: string) => normalize(c).replace(/\s+/g, "-");
export const blockHref = (b: BlockModule) => `#/blocos/${categorySlug(b.meta.category)}/${b.slug}`;

const THUMB_W = 1280;
const THUMB_H = 800;

/**
 * Miniatura viva do bloco: o próprio bloco num iframe de 1280×800 reduzido para caber no card.
 * O iframe só é montado quando o card chega perto da tela e não recebe clique nem foco.
 */
export function BlockThumb({ block, theme }: { block: BlockModule; theme?: "light" | "dark" }) {
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  const [near, setNear] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => setScale(el.clientWidth / THUMB_W);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: "600px 0px" },
    );
    io.observe(el);
    return () => {
      ro.disconnect();
      io.disconnect();
    };
  }, []);
  return (
    <div ref={box} aria-hidden className="relative overflow-hidden rounded-lg border border-line bg-soft" style={{ aspectRatio: `${THUMB_W} / ${THUMB_H}` }}>
      {near && scale > 0 && (
        <iframe
          title={`Miniatura de ${block.meta.title}`}
          tabIndex={-1}
          src={`${location.pathname}#/frame/${block.slug}${theme ? `?theme=${theme}` : ""}`}
          onLoad={() => setReady(true)}
          className={cn("pointer-events-none absolute left-0 top-0 origin-top-left border-0 bg-surface transition-opacity duration-300", ready ? "opacity-100" : "opacity-0")}
          style={{ width: THUMB_W, height: THUMB_H, transform: `scale(${scale})` }}
        />
      )}
    </div>
  );
}

/** Card da galeria: miniatura, título, descrição e a anatomia. O card inteiro abre a página do bloco. */
export function BlockCard({ block }: { block: BlockModule }) {
  const anatomy = anatomyOf(block);
  return (
    <a href={blockHref(block)} className="group block rounded-2xl border border-line bg-surface p-2 transition-colors hover:border-line-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-muted">
      <BlockThumb block={block} />
      <div className="px-2 pb-2 pt-3">
        <div className="flex items-start justify-between gap-3">
          <h3 className="m-0 min-w-0 truncate text-[14px] font-medium text-ink">{block.meta.title}</h3>
          <ArrowUpRight aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
        </div>
        <p className="m-0 mt-1 line-clamp-2 min-h-[2.6em] text-[12.5px] leading-[1.3] text-muted">{block.meta.description}</p>
        <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] text-muted">
          {anatomy && <span className="rounded-md bg-soft px-1.5 py-0.5 text-ink-soft">{anatomies[anatomy]}</span>}
          <code className="truncate font-mono text-[11px]">{block.slug}.tsx</code>
        </div>
      </div>
    </a>
  );
}

export function BlockPreview({ block, bare = false }: { block: BlockModule; /** Na página do próprio bloco: sem repetir título, descrição e caminho, que já estão no cabeçalho. */ bare?: boolean }) {
  const [tab, setTab] = useState<"preview" | "code" | "concept">("preview");
  const [vp, setVp] = useState<keyof typeof viewports>("desktop");
  const [reload, setReload] = useState(0);
  const [copied, setCopied] = useState(false);
  /** Tema só deste preview; null = segue o site. */
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);
  const src = `${location.pathname}#/frame/${block.slug}${theme ? `?theme=${theme}` : ""}`;
  const path = `src/blocks/${block.slug}.tsx`;
  const tool = "inline-flex h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-soft hover:text-ink aria-pressed:bg-surface aria-pressed:text-ink aria-pressed:shadow-surface";
  return (
    <section id={block.slug} className="scroll-mt-32 py-8">
      <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2">
        <div className="segmented-control" role="group" aria-label="Visualização">
          <button type="button" aria-pressed={tab === "preview"} onClick={() => setTab("preview")}>
            Preview
          </button>
          <button type="button" aria-pressed={tab === "code"} onClick={() => setTab("code")}>
            Código
          </button>
          <button type="button" aria-pressed={tab === "concept"} onClick={() => setTab("concept")}>
            Conceito
          </button>
        </div>
{bare ? (
          <span className="flex-1" />
        ) : (
          <>
        <span aria-hidden className="hidden h-5 w-px bg-line sm:block" />
        <p className="m-0 min-w-0 flex-1 truncate text-[13.5px]" title={`${block.meta.title} — ${block.meta.description}`}>
          <a href={blockHref(block)} className="font-medium hover:underline">
            {block.meta.title}
          </a>
          <span className="text-muted"> — {block.meta.description}</span>
        </p>
          </>
        )}
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-0.5 rounded-lg border border-line bg-soft/60 p-0.5 md:flex" role="group" aria-label="Largura">
            {(
              [
                ["desktop", Monitor, "Desktop"],
                ["tablet", Tablet, "Tablet"],
                ["mobile", Smartphone, "Celular"],
              ] as const
            ).map(([k, Icon, label]) => (
              <button key={k} type="button" className={tool} aria-pressed={tab === "preview" && vp === k} onClick={() => { setTab("preview"); setVp(k); }} title={label} aria-label={label}>
                <Icon className="h-3.5 w-3.5" />
              </button>
            ))}
            <span aria-hidden className="mx-0.5 h-4 w-px bg-line" />
            {(
              [
                ["light", Sun, "Ver em modo claro"],
                ["dark", Moon, "Ver em modo escuro"],
              ] as const
            ).map(([k, Icon, label]) => (
              <button key={k} type="button" className={tool} aria-pressed={theme === k} onClick={() => setTheme((t) => (t === k ? null : k))} title={label} aria-label={label}>
                <Icon className="h-3.5 w-3.5" />
              </button>
            ))}
            <span aria-hidden className="mx-0.5 h-4 w-px bg-line" />
            <a href={src} target="_blank" rel="noreferrer" className={tool} title="Abrir em tela cheia" aria-label="Abrir em tela cheia">
              <Maximize2 className="h-3.5 w-3.5" />
            </a>
            <button type="button" className={tool} onClick={() => setReload((r) => r + 1)} title="Recarregar" aria-label="Recarregar">
              <RotateCw className="h-3.5 w-3.5" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(path);
              setCopied(true);
              setTimeout(() => setCopied(false), 1400);
            }}
            className={cn("hidden h-8 items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 font-mono text-[11.5px] text-ink-soft hover:bg-soft", !bare && "lg:inline-flex")}
            title="Copiar caminho do arquivo"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-ok" /> : <Copy className="h-3.5 w-3.5 text-muted" />}
            {path}
          </button>
        </div>
      </div>
      {tab === "preview" ? (
        <div className="overflow-hidden rounded-2xl border border-line bg-soft/70 p-1.5">
          <iframe
            key={reload}
            title={block.meta.title}
            src={src}
            loading="lazy"
            className="mx-auto block rounded-xl border border-line bg-surface transition-[width] duration-300"
            style={{ width: viewports[vp], maxWidth: "100%", height: block.meta.height ?? 760 }}
          />
        </div>
      ) : tab === "code" ? (
        <BlockCode block={block} />
      ) : (
        <BlockConceptView block={block} />
      )}
    </section>
  );
}

/** Aba Código: o bloco + os arquivos locais que ele importa (casca do produto, dados). */
function BlockCode({ block }: { block: BlockModule }) {
  const deps = [...block.source.matchAll(/from "\.\/((?:shells|data)\/[\w-]+)"/g)]
    .map((m) => m[1])
    .flatMap((base) => Object.keys(blockFiles).filter((k) => k.replace(/\.(tsx?|json)$/, "") === base));
  const files = [`${block.slug}.tsx`, ...Array.from(new Set(deps))];
  const [active, setActive] = useState(files[0]);
  const code = active === files[0] ? block.source : blockFiles[active];
  return (
    <div>
      {files.length > 1 && (
        <div className="mb-2 flex flex-wrap items-center gap-1" role="tablist" aria-label="Arquivos">
          {files.map((f) => (
            <button
              key={f}
              type="button"
              role="tab"
              aria-selected={active === f}
              onClick={() => setActive(f)}
              className={cn("rounded-md px-2.5 py-1 font-mono text-[11.5px]", active === f ? "bg-primary text-on-primary" : "text-muted ring-1 ring-line hover:bg-soft hover:text-ink")}
            >
              {f === files[0] ? f : `blocks/${f}`}
            </button>
          ))}
          <span className="ml-2 text-[11.5px] text-muted">Copie todos para src/blocks/ do seu app (mesma estrutura).</span>
        </div>
      )}
      <CodeBlock code={code} maxHeight={block.meta.height ?? 760} />
    </div>
  );
}

/** Aba Conceito: objetivo, padrões, adaptação e componentes usados (extraídos do import). */
function BlockConceptView({ block }: { block: BlockModule }) {
  const c = block.meta.concept;
  const imports = Array.from(
    new Set(
      [...block.source.matchAll(/import\s*\{([^}]*)\}\s*from\s*"@g4ai\/ds"/g)]
        .flatMap((m) => m[1].split(","))
        .map((x) => x.trim().replace(/^type\s+/, ""))
        .filter((x) => /^[A-Z]/.test(x)),
    ),
  ).sort((a, b) => a.localeCompare(b));
  const locals = Array.from(new Set([...block.source.matchAll(/from "\.\/((?:shells|data)\/[\w-]+)"/g)].map((m) => m[1])));
  const list = (title: string, items?: readonly string[]) =>
    items && items.length ? (
      <div>
        <p className="m-0 mb-2 text-[11px] font-medium uppercase tracking-[0.08em] text-muted">{title}</p>
        <ul className="m-0 list-none space-y-1.5 p-0">
          {items.map((it) => (
            <li key={it} className="flex gap-2 text-[13px] leading-relaxed text-ink-soft">
              <span aria-hidden className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-accent" />
              {it}
            </li>
          ))}
        </ul>
      </div>
    ) : null;
  return (
    <div className="grid gap-6 rounded-2xl border border-line bg-surface p-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <div className="space-y-6">
        <div>
          <p className="m-0 mb-2 text-[11px] font-medium uppercase tracking-[0.08em] text-muted">Objetivo</p>
          <p className="m-0 text-[15px] leading-relaxed text-ink">{c?.goal ?? block.meta.description}</p>
        </div>
        {list("Padrões aplicados", c?.patterns)}
        {list("Quando usar e o que adaptar", c?.adapt)}
        {list("Evite ao copiar", c?.avoid)}
        {!c && <p className="m-0 text-[12.5px] text-muted">Este bloco ainda não tem o conceito descrito (meta.concept).</p>}
      </div>
      <div className="space-y-5 lg:border-l lg:border-line lg:pl-6">
        <div>
          <p className="m-0 mb-2 text-[11px] font-medium uppercase tracking-[0.08em] text-muted">Componentes do DS ({imports.length})</p>
          <div className="flex flex-wrap gap-1.5">
            {imports.map((name) => (
              <code key={name} className="rounded-md border border-line bg-soft px-1.5 py-0.5 font-mono text-[11.5px] text-ink-soft">
                {name}
              </code>
            ))}
          </div>
        </div>
        <div>
          <p className="m-0 mb-2 text-[11px] font-medium uppercase tracking-[0.08em] text-muted">Arquivos</p>
          <ul className="m-0 list-none space-y-1 p-0 font-mono text-[11.5px] text-ink-soft">
            <li>src/blocks/{block.slug}.tsx</li>
            {locals.map((l) => (
              <li key={l}>src/blocks/{l}.ts{l.startsWith("shells") ? "x" : ""}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
