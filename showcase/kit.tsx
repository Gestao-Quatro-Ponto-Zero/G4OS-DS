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
import { Check, Copy, Maximize2, Monitor, Moon, RotateCw, Smartphone, Sun, Tablet } from "lucide-react";
import { useState, type ComponentType, type ReactNode } from "react";
import { cn } from "@g4os/ds";
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
export type PageMeta = { title: string; group: (typeof groups)[number]; order?: number; description?: string };
export type PageModule = { meta: PageMeta; default: ComponentType; slug: string; source: string };

export const blockCategories = ["SaaS", "CRM", "ATS", "ERP", "Financeiro", "Autenticação", "Configurações", "Onboarding", "Aplicação", "IA", "Marketing"] as const;
export type BlockMeta = { title: string; description: string; category: (typeof blockCategories)[number]; height?: number; order?: number };
export type BlockModule = { meta: BlockMeta; default: ComponentType; slug: string; source: string };

/* ------------------------------------------------------------------ */

export function DocPage({ title, description, children, kicker }: { title: string; description?: ReactNode; kicker?: string; children: ReactNode }) {
  return (
    <article className="mx-auto w-full max-w-[1120px]">
      <header className="border-b border-line pb-6">
        {kicker && <p className="m-0 mb-2 text-[11px] font-medium uppercase tracking-[0.1em] text-muted">{kicker}</p>}
        <h1 className="m-0 text-[25px] font-semibold tracking-[-0.035em]">{title}</h1>
        {description && <div className="m-0 mt-2 max-w-[680px] text-[13.5px] leading-relaxed text-muted">{description}</div>}
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
      {rule && <div className="m-0 mt-1.5 max-w-[720px] text-[13px] leading-relaxed text-muted">{rule}</div>}
      <div className="mt-5 space-y-6">{children}</div>
    </section>
  );
}

/** Exemplo vivo com aba de código. `code` é o trecho de uso (não o arquivo todo). */
export function Demo({ title, description, code, children, className, bare }: { title?: string; description?: ReactNode; code?: string; children: ReactNode; className?: string; bare?: boolean }) {
  const [tab, setTab] = useState<"preview" | "code">("preview");
  return (
    <div className="min-w-0">
      {(title || code) && (
        <div className="mb-2 flex items-end justify-between gap-3">
          <div className="min-w-0">
            {title && <p className="m-0 text-[11px] font-medium uppercase tracking-[0.08em] text-muted">{title}</p>}
            {description && <p className="m-0 mt-1 text-[12.5px] text-muted">{description}</p>}
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
    <div className="overflow-x-auto rounded-xl border border-line">
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

function highlight(code: string) {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const re = /((?<![:\w])\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`)|\b(import|from|export|default|function|return|const|let|type|if|else|for|of|new|as|await|async|true|false|null|undefined)\b|(<\/?[A-Z][A-Za-z0-9.]*)/g;
  let out = "";
  let last = 0;
  for (const m of code.matchAll(re)) {
    out += esc(code.slice(last, m.index));
    const [t, c, s, k, tag] = m;
    out += c ? `<span class="tk-c">${esc(c)}</span>` : s ? `<span class="tk-s">${esc(s)}</span>` : k ? `<span class="tk-k">${k}</span>` : tag ? `<span class="tk-t">${esc(tag)}</span>` : esc(t);
    last = (m.index ?? 0) + t.length;
  }
  return out + esc(code.slice(last));
}

export function CodeBlock({ code, maxHeight = 520, className }: { code: string; maxHeight?: number; className?: string }) {
  const [copied, setCopied] = useState(false);
  const text = code.replace(/^\n+|\s+$/g, "");
  return (
    <div className={cn("relative overflow-hidden rounded-xl border border-line bg-soft/50", className)}>
      <button
        type="button"
        onClick={() => {
          navigator.clipboard?.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1400);
        }}
        className="absolute right-2 top-2 z-10 inline-flex h-7 items-center gap-1.5 rounded-md border border-line bg-surface px-2 text-[11.5px] text-muted hover:text-ink"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-ok" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? "Copiado" : "Copiar"}
      </button>
      <pre className="code-view m-0 overflow-auto p-4 pr-24 font-mono text-[12px] leading-[1.65] text-ink" style={{ maxHeight }}>
        <code dangerouslySetInnerHTML={{ __html: highlight(text) }} />
      </pre>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Bloco: preview em iframe (responsivo de verdade) + código           */
/* ------------------------------------------------------------------ */

const viewports = { desktop: "100%", tablet: "820px", mobile: "390px" } as const;

export function BlockPreview({ block }: { block: BlockModule }) {
  const [tab, setTab] = useState<"preview" | "code">("preview");
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
        </div>
        <span aria-hidden className="hidden h-5 w-px bg-line sm:block" />
        <p className="m-0 min-w-0 flex-1 truncate text-[13.5px]" title={`${block.meta.title} — ${block.meta.description}`}>
          <a href={`#/blocos/${block.meta.category.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}#${block.slug}`} className="font-medium hover:underline">
            {block.meta.title}
          </a>
          <span className="text-muted"> — {block.meta.description}</span>
        </p>
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
            className="hidden h-8 items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 font-mono text-[11.5px] text-ink-soft hover:bg-soft lg:inline-flex"
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
      ) : (
        <BlockCode block={block} />
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
