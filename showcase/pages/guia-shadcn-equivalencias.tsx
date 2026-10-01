import { ArrowUpRight } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge, SearchInput, normalize } from "@g4ai/ds";
import shadcnMap from "../../scripts/data/shadcn-map.json";
import { DocPage, DocSection, Rules, type PageMeta } from "../kit";

export const meta: PageMeta = {
  title: "shadcn/ui ↔ G4OS-DS",
  group: "Começar",
  order: 4,
  description: "De/para dos componentes do shadcn/ui para os do DS. Recebeu um exemplo, um bloco ou um pedido escrito “em shadcn”? Traduza por esta tabela antes de instalar qualquer coisa.",
  shadcn: false,
};

const statusLabel: Record<string, { label: string; tone?: "accent" | "warn" | "info" }> = {
  equivalente: { label: "Equivalente" },
  parcial: { label: "Parcial", tone: "info" },
  ponte: { label: "Use com a ponte", tone: "warn" },
  fora: { label: "Fora do escopo", tone: "warn" },
};

export default function Page() {
  const [q, setQ] = useState("");
  const rows = useMemo(() => {
    const n = normalize(q.trim());
    if (!n) return shadcnMap.components;
    return shadcnMap.components.filter((c) => normalize([c.name, c.shadcn, ...c.ours, ...((c as { aliases?: string[] }).aliases ?? [])].join(" ")).includes(n));
  }, [q]);
  return (
    <DocPage title={meta.title} description={meta.description} kicker={meta.group}>
      <DocSection
        title={`${shadcnMap.components.length} componentes do shadcn/ui`}
        rule={
          <>
            Fonte: <code>scripts/data/shadcn-map.json</code> (também em <code>ai/shadcn-map.json</code> e no MCP: <code>search &#123; &quot;query&quot;: &quot;alert-dialog&quot; &#125;</code>). Cada página de componente mostra o selo “Equivalente no shadcn”.
          </>
        }
      >
        <label className="block max-w-sm">
          <span className="sr-only">Buscar equivalência</span>
          <SearchInput value={q} onChange={setQ} placeholder="Buscar: sheet, dialog, Combobox…" />
        </label>
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[760px] text-left text-[13px]">
            <thead className="border-b border-line bg-soft text-[12px] text-muted">
              <tr>
                <th className="px-3 py-2 font-medium">shadcn/ui</th>
                <th className="px-3 py-2 font-medium">G4OS-DS</th>
                <th className="px-3 py-2 font-medium">Situação</th>
                <th className="px-3 py-2 font-medium">Observação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((c) => {
                const st = statusLabel[c.status] ?? { label: c.status };
                return (
                  <tr key={c.shadcn} className="align-top">
                    <td className="whitespace-nowrap px-3 py-2.5">
                      <a href={`https://ui.shadcn.com/docs/components/${c.shadcn}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-ink no-underline hover:underline">
                        {c.name}
                        <ArrowUpRight aria-hidden className="h-3 w-3 text-muted" />
                        <span className="sr-only">(abre em nova aba)</span>
                      </a>
                    </td>
                    <td className="px-3 py-2.5">
                      {c.ours.length ? (
                        <div className="flex flex-wrap gap-1">
                          {c.ours.map((o, i) =>
                            c.pages[0] && i === 0 ? (
                              <a key={o} href={`#/p/${c.pages[0]}`} className="rounded-md bg-soft px-1.5 py-0.5 font-mono text-[12px] text-ink no-underline hover:bg-line">
                                {o}
                              </a>
                            ) : (
                              <code key={o} className="rounded-md bg-soft px-1.5 py-0.5 font-mono text-[12px] text-ink-soft">
                                {o}
                              </code>
                            ),
                          )}
                        </div>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5">
                      <Badge tone={st.tone}>{st.label}</Badge>
                    </td>
                    <td className="px-3 py-2.5 text-[12.5px] leading-relaxed text-muted">{c.notes.replace(/`/g, "")}</td>
                  </tr>
                );
              })}
              {!rows.length && (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-muted">
                    Nada encontrado para “{q}”.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </DocSection>

      <DocSection title="Só no G4OS-DS" rule="Componentes que o shadcn não tem e que apps de gestão pedem.">
        <ul className="m-0 grid list-none gap-2 p-0 sm:grid-cols-2">
          {shadcnMap.extras.map((e) => (
            <li key={e.name} className="rounded-xl border border-line bg-surface px-4 py-3">
              <a href={`#/p/${e.pages[0]}`} className="text-[13.5px] font-medium text-ink no-underline hover:underline">
                {e.name}
              </a>
              <span className="ml-2 font-mono text-[12px] text-muted">{e.ours.join(", ")}</span>
              <p className="m-0 mt-1 text-[12.5px] text-muted">{e.notes}</p>
            </li>
          ))}
        </ul>
      </DocSection>

      <DocSection title="Como traduzir">
        <Rules
          items={[
            { do: "Troque o componente pelo equivalente e ajuste as props (o DS pede label em campos e botões só-ícone).", dont: "Instalar do shadcn algo que já tem equivalente: duplica padrões e quebra tema/escrita." },
            { do: "Sem equivalente? Traga do shadcn com a ponte @g4ai/ds/shadcn.css e troque bg-accent/bg-muted por bg-soft.", dont: "Copiar classes de cor do shadcn (zinc-*, slate-*) sem passar pelos tokens." },
          ]}
        />
      </DocSection>
    </DocPage>
  );
}
