import { Briefcase, Building2, FilePlus2, Keyboard, Moon, Search, Users } from "lucide-react";
import { useState } from "react";
import { Badge, Button, SearchPalette, formatCurrency, notify, type SearchResult, type SearchScope } from "@g4ai/ds";
import { CodeBlock, Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";
import { deals, owners } from "./_filtros-data";

export const meta: PageMeta = {
  title: "Busca global (⌘K)",
  group: "Filtros e busca",
  order: 40,
  description: "Uma caixa para achar qualquer coisa no app: registros de todos os tipos, páginas e ações. Escopos, prefixos, prévia, recentes e ponte para a lista filtrada.",
};

const scopes: SearchScope[] = [
  { id: "deals", label: "Negócios", icon: <Briefcase />, prefix: "#", noun: "negócios" },
  { id: "companies", label: "Empresas", icon: <Building2 />, prefix: "@", noun: "empresas" },
  { id: "actions", label: "Ações", icon: <Keyboard />, prefix: ">" },
];
const items: SearchResult[] = [
  ...deals.slice(0, 16).map((d) => ({
    id: `d${d.id}`,
    scope: "deals",
    title: `${d.name} · ${d.company.split(" ")[0]}`,
    subtitle: d.company,
    icon: <Briefcase />,
    meta: formatCurrency(d.value, { compact: true }),
    preview: {
      badge: <Badge>{d.stage}</Badge>,
      properties: [
        { label: "Valor", value: formatCurrency(d.value) },
        { label: "Responsável", value: owners.find((o) => o.value === d.owner)?.label },
        { label: "Cidade", value: d.city },
      ],
    },
    onSelect: () => notify(`Abrindo ${d.name}`, undefined, "info"),
  })),
  ...[...new Set(deals.map((d) => d.company))].map((c, i) => ({ id: `c${i}`, scope: "companies", title: c, subtitle: `${deals.filter((d) => d.company === c).length} negócios`, icon: <Building2 />, onSelect: () => notify(`Abrindo ${c}`, undefined, "info") })),
  { id: "a1", scope: "actions", title: "Criar negócio", icon: <FilePlus2 />, shortcut: ["C", "N"], onSelect: () => notify("Novo negócio") },
  { id: "a2", scope: "actions", title: "Convidar pessoa", icon: <Users />, keywords: ["time", "membro"], onSelect: () => notify("Convite") },
  { id: "a3", scope: "actions", title: "Alternar tema escuro", icon: <Moon />, keywords: ["dark", "aparência"], onSelect: () => notify("Tema") },
];

const keys: [string, string][] = [
  ["⌘K  /  Ctrl K", "Abre de qualquer tela (inclusive com foco num campo)"],
  ["↑ ↓", "Move entre resultados (inclui “Ver todos” e “Criar”)"],
  ["↵", "Abre o resultado · executa a ação"],
  ["⌘ ↵", "Abre em nova aba (registros com href)"],
  ["Tab · ⇧ Tab", "Próximo / anterior escopo"],
  ["#  @  >", "No início da busca, entra direto no escopo (registros, pessoas, ações)"],
  ["⌫ com busca vazia", "Sai do escopo e volta para Tudo"],
  ["→ no fim do texto", "Mostra/esconde a prévia"],
  ["Esc", "Fecha"],
];

export default function Page() {
  const [open, setOpen] = useState(false);
  return (
    <DocPage title={meta.title} kicker="Filtros e busca" description={meta.description}>
      <DocSection title="Experimente" rule="Use o botão (neste site, ⌘K abre a busca da documentação). Tente “aurora”, “#licenças”, “@vertice”, “>tema”, e Tab para trocar de escopo.">
        <Demo
          bare
          code={`const [open, setOpen] = useState(false);
useCommandShortcut(() => setOpen(true)); // ⌘K / Ctrl+K

<SearchPalette
  open={open}
  onClose={() => setOpen(false)}
  scopes={[
    { id: "deals", label: "Negócios", icon: <Briefcase />, prefix: "#" },
    { id: "contacts", label: "Contatos", icon: <Users />, prefix: "@" },
    { id: "actions", label: "Ações", icon: <Keyboard />, prefix: ">" },
  ]}
  items={localResults}               // navegação, ações, registros recentes
  source={searchApi}                 // (q, scope, signal) => Promise<SearchResult[]>
  recentQueries={["aurora", "PV-024861"]}
  recentItems={recent}
  onSelect={(r, { newTab }) => router.push(r.href!)}
  onSeeAll={(scope, q) => router.push(\`/\${scope.id}?q=\${encodeURIComponent(q)}\`)}
  onCreate={(q) => createDeal(q)}
/>`}
        >
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-surface p-5">
            <Button onClick={() => setOpen(true)}>
              <Search /> Abrir busca
            </Button>
            <SearchPalette open={open} onClose={() => setOpen(false)} scopes={scopes} items={items} recentQueries={["aurora", "licenças", "vértice"]} recentItems={[items[0], items[20]]} onSeeAll={(s, q) => notify(`Abrindo ${s.label} filtrados por “${q}”`, undefined, "info")} onCreate={(q) => notify(`Negócio “${q}” criado`)} createLabel={(q) => `Criar negócio “${q}”`} />
          </div>
        </Demo>
      </DocSection>

      <DocSection title="O que o ⌘K faz — e o que não faz">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-line bg-surface p-4 text-[13px] leading-relaxed">
            <p className="m-0 mb-2 font-medium">Faz</p>
            <ul className="m-0 space-y-1 pl-4 text-ink-soft">
              <li>Acha registros de <b className="font-medium text-ink">qualquer tipo</b> (negócio, contato, pedido, vaga, nota fiscal).</li>
              <li>Navega para páginas e executa ações (“Criar negócio”, “Alternar tema”).</li>
              <li>Mostra recentes quando vazio: buscas e registros abertos.</li>
              <li>Leva à lista filtrada: “Ver todos os 23 resultados em contatos” abre /contatos?q=…</li>
            </ul>
          </div>
          <div className="rounded-xl border border-line bg-surface p-4 text-[13px] leading-relaxed">
            <p className="m-0 mb-2 font-medium">Não faz</p>
            <ul className="m-0 space-y-1 pl-4 text-ink-soft">
              <li>Não filtra a tabela que está atrás (isso é a busca local “/”).</li>
              <li>Não substitui filtros estruturados (valor, data, etapa).</li>
              <li>Não mostra 200 resultados: 4 por tipo em “Tudo”, até 50 dentro de um escopo.</li>
              <li>Não pede confirmação dentro dele: ação destrutiva abre o fluxo normal.</li>
            </ul>
          </div>
        </div>
      </DocSection>

      <DocSection title="Anatomia do resultado" rule="Ícone do tipo · título com o trecho destacado · subtítulo com contexto (empresa, cargo) · meta à direita (valor, status, data). Ordenação: começa com > palavra começa com > contém > contexto contém.">
        <CodeBlock
          code={`type SearchResult = {
  id: string;
  scope: string;            // grupo: "deals", "contacts"…
  title: string;            // nome do registro
  subtitle?: string;        // contexto: empresa, cargo, cliente
  icon?: ReactNode;
  meta?: ReactNode;         // à direita: valor, status, data
  href?: string;            // ⌘↵ abre em nova aba
  keywords?: string[];      // sinônimos, e-mail, CNPJ sem pontuação
  shortcut?: string[];      // ações: ["C", "N"]
  preview?: { title?, subtitle?, badge?, properties?, body?, actions? };
  onSelect?: () => void;
};`}
        />
      </DocSection>

      <DocSection title="Teclado">
        <div className="overflow-hidden rounded-xl border border-line">
          <table className="w-full text-left text-[13px]">
            <tbody className="divide-y divide-line">
              {keys.map(([k, d]) => (
                <tr key={k}>
                  <td className="w-52 px-4 py-2 font-mono text-[12.5px] font-medium">{k}</td>
                  <td className="px-4 py-2 text-ink-soft">{d}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DocSection>

      <DocSection title="Fonte remota" rule="Para bases grandes, passe `source`: a paleta faz debounce (160 ms), cancela a busca anterior (AbortSignal), mostra carregando e erro com “Tentar de novo”, e mistura com os resultados locais.">
        <CodeBlock
          code={`const searchApi: SearchSource = async (q, scope, signal) => {
  const res = await fetch(\`/api/busca?q=\${encodeURIComponent(q)}&escopo=\${scope}\`, { signal });
  if (!res.ok) throw new Error("Servidor indisponível");
  return res.json(); // SearchResult[]
};`}
        />
        <PropsTable
          rows={[
            ["scopes", "SearchScope[]", "—", "“Tudo” é adicionado na frente. prefix = atalho (# @ >)."],
            ["items", "SearchResult[]", "[]", "Resultados locais (ações, navegação, registros em memória)."],
            ["source", "(q, scope, signal) => Promise<SearchResult[]>", "—", "Busca remota com debounce e cancelamento."],
            ["recentQueries · recentItems", "string[] · SearchResult[]", "[]", "O que aparece com a busca vazia."],
            ["onSeeAll", "(scope, q) => void", "—", "Liga a linha “Ver todos em X” (abre a lista filtrada)."],
            ["onCreate · createLabel", "(q, scope) => void", "—", "Linha “Criar … ‘q’” no fim."],
            ["perGroup · debounce", "number", "4 · 160", "Resultados por tipo em “Tudo”; atraso da fonte remota."],
            ["defaultPreview", "boolean", "true", "Prévia à direita (≥ 768px) quando o resultado tem preview."],
          ]}
        />
      </DocSection>

      <DocSection title="Regras">
        <Rules
          items={[
            { do: "Um só ⌘K no app inteiro, com o mesmo conteúdo em qualquer tela.", dont: "Um ⌘K diferente por módulo." },
            { do: "Busca tolerante: sem acento, só o começo, CNPJ/telefone com ou sem pontuação (keywords).", dont: "Exigir o nome exato." },
            { do: "Mostrar o tipo (ícone + grupo) e o contexto (empresa) — “Ana” pode ser 3 pessoas.", dont: "Lista plana só com nomes." },
            { do: "Botão “Buscar ⌘K” visível na sidebar: o atalho é para quem já conhece.", dont: "Recurso só por atalho." },
            { do: "“Ver todos em X” leva à lista com ?q= aplicado.", dont: "Beco sem saída depois de 4 resultados." },
          ]}
        />
      </DocSection>
    </DocPage>
  );
}
