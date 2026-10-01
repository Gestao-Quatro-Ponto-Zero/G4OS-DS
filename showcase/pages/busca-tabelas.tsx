import { useState } from "react";
import { DataTable, EmptyFilterResult, Highlight, TableSearch, formatCurrency, useFilters, useTableSearch, type Column } from "@g4ai/ds";
import { Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";
import { dealFields, dealSearch, deals, type Deal } from "./_filtros-data";

export const meta: PageMeta = {
  title: "Busca em tabelas",
  group: "Filtros e busca",
  order: 50,
  description: "A busca local (“/”) estreita a lista que está na tela, destaca o trecho nas células e combina com os filtros. Diferente do ⌘K, ela não sai da página.",
};

export default function Page() {
  const simple = useTableSearch(deals, dealSearch);
  const filters = useFilters(deals, { fields: dealFields, search: dealSearch, initial: { query: "zzzz", conditions: [{ id: "a", field: "value", op: "gt", value: 300000 }, { id: "b", field: "priority", op: "is", value: ["Alta"] }] } });
  const [hl, setHl] = useState("sao joao");
  const columns: Column<Deal>[] = [
    { key: "name", header: "Negócio", primary: true, cell: (d) => <Highlight text={d.name} query={simple.query} /> },
    { key: "company", header: "Empresa", cell: (d) => <Highlight text={d.company} query={simple.query} /> },
    { key: "city", header: "Cidade", cell: (d) => <Highlight text={d.city} query={simple.query} /> },
    { key: "value", header: "Valor", align: "right", nowrap: true, cell: (d) => <span className="tabular-nums">{formatCurrency(d.value, { cents: false })}</span> },
  ];
  return (
    <DocPage title={meta.title} kicker="Filtros e busca" description={meta.description}>
      <DocSection title="⌘K × / × filtros" rule="A regra que vale em todo produto G4.">
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full text-left text-[13px]">
            <thead className="border-b border-line bg-soft/60 text-[12px] text-muted">
              <tr>
                <th className="px-4 py-2.5" />
                <th className="px-4 py-2.5">⌘K · busca global</th>
                <th className="px-4 py-2.5">/ · busca local</th>
                <th className="px-4 py-2.5">Filtros</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {[
                ["Alcance", "O app inteiro, todos os tipos", "A lista na tela", "A lista na tela"],
                ["Entrada", "Texto + escopo", "Texto livre", "Campo + operador + valor"],
                ["Resultado", "Abre um registro ou executa ação", "Estreita a lista", "Estreita a lista"],
                ["Combina com", "—", "Filtros (E)", "Busca (E); entre filtros (E); dentro de um filtro (OU)"],
                ["Onde fica", "Sidebar (botão) + atalho", "Primeiro item da FilterBar", "FilterBar"],
                ["URL", "Não", "?q=", "?f="],
              ].map(([a, b, c, d]) => (
                <tr key={a}>
                  <td className="px-4 py-2.5 font-medium">{a}</td>
                  <td className="px-4 py-2.5 text-ink-soft">{b}</td>
                  <td className="px-4 py-2.5 text-ink-soft">{c}</td>
                  <td className="px-4 py-2.5 text-ink-soft">{d}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DocSection>

      <DocSection title="TableSearch" rule="Placeholder com o tamanho da lista, “/” visível, Esc limpa (e depois sai), dica ao focar dizendo onde procura e que ⌘K busca no app todo. Clique fora e aperte “/”.">
        <Demo
          bare
          code={`const search = useTableSearch(deals, (d) => [d.name, d.company, d.city]);

<TableSearch value={search.query} onChange={search.setQuery} total={deals.length} noun="negócio" searchIn="nome, empresa e cidade" />
<DataTable rows={search.rows} columns={[{ key: "name", header: "Negócio", cell: (d) => <Highlight text={d.name} query={search.query} /> }, …]} />`}
        >
          <div className="space-y-3 rounded-xl border border-line bg-surface p-5">
            <div className="flex items-center gap-3">
              <TableSearch value={simple.query} onChange={simple.setQuery} total={deals.length} noun="negócio" searchIn="nome, empresa e cidade" className="max-w-[360px] flex-1" />
              <span className="text-[12px] tabular-nums text-muted" aria-live="polite">
                {simple.shown} de {simple.total}
              </span>
            </div>
            <DataTable rows={simple.rows.slice(0, 6)} columns={columns} rowKey={(d) => d.id} />
          </div>
        </Demo>
      </DocSection>

      <DocSection title="Highlight" rule="Destaca todas as palavras buscadas, sem acento e sem caixa. Use na coluna principal e no contexto (empresa, número). Não destaque em números formatados.">
        <Demo className="block space-y-3" code={`<Highlight text="São João Metalúrgica" query="sao joao" />`}>
          <input value={hl} onChange={(e) => setHl(e.target.value)} aria-label="Termo" className="h-9 w-full max-w-[280px] rounded-lg border border-line bg-surface px-2.5 text-[13px]" />
          <div className="space-y-1 text-[14px]">
            <Highlight text="Padaria São João · São Paulo" query={hl} className="block" />
            <Highlight text="Construtora João Pessoa Ltda." query={hl} className="block" />
            <Highlight text="Associação dos Lojistas do Centro" query={hl} className="block" />
          </div>
        </Demo>
      </DocSection>

      <DocSection title="Nenhum resultado" rule="Diga o recorte (busca e quantos filtros), o total existente, e ofereça as duas saídas.">
        <Demo bare code={`<DataTable rows={filters.rows} … empty={<EmptyFilterResult filters={filters} noun="negócio" />} />`}>
          <div className="rounded-xl border border-line bg-surface">
            <EmptyFilterResult filters={filters} noun="negócio" />
          </div>
        </Demo>
        <PropsTable
          rows={[
            ["TableSearch.value · onChange", "string", "—", "Controlado. Com FilterBar, ligue a filters.state.query / filters.setQuery."],
            ["total · noun · nounPlural", "number · string", "—", "Placeholder “Buscar em 312 contatos”."],
            ["searchIn", "string", "—", "Onde procura, na dica ao focar."],
            ["shortcut", "string | null", '"/"', "Tecla que foca. null desliga (ex.: duas listas na tela)."],
            ["useTableSearch(rows, texts)", "{ query, setQuery, rows, shown, total }", "", "Busca local sem filtros estruturados."],
            ["matchesQuery(q, texts)", "boolean", "", "A regra: todas as palavras em algum texto, sem acento."],
          ]}
        />
      </DocSection>

      <DocSection title="Regras">
        <Rules
          items={[
            { do: "Busca como primeiro controle, à esquerda, ocupando o espaço livre.", dont: "Lupa escondida que abre um campo." },
            { do: "Busca a partir de 12 itens; abaixo disso, a lista cabe no olho.", dont: "Busca numa lista de 4 itens." },
            { do: "Pesquisar em nome + contexto (empresa, número, e-mail, CNPJ sem pontuação).", dont: "Só na primeira coluna." },
            { do: "Filtrar enquanto digita (local) ou com debounce de ~200 ms (servidor).", dont: "Exigir Enter ou botão “Buscar” para uma lista local." },
          ]}
        />
      </DocSection>
    </DocPage>
  );
}
