import { FilterBar, SavedViews, TableSearch, useFilters, useSavedViews } from "@g4os/ds";
import { Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";
import { dealFields, dealSearch, dealViews, deals, me, now } from "./_filtros-data";

export const meta: PageMeta = {
  title: "Visões salvas",
  group: "Filtros e busca",
  order: 20,
  description: "Recortes nomeados de uma lista (“Meus”, “Atrasados”, “Enterprise sem contato”). As do sistema vêm do código; as da pessoa ela mesma cria.",
};

export default function Page() {
  const filters = useFilters(deals, { fields: dealFields, search: dealSearch, me, now });
  const views = useSavedViews(filters, dealViews, "ds-doc-visoes");
  return (
    <DocPage title={meta.title} kicker="Filtros e busca" description={meta.description}>
      <DocSection title="Como funciona" rule="Escolher uma visão aplica busca + filtros dela. Mexeu no recorte? A aba ganha um ponto dourado e aparecem Descartar · Salvar alterações · Salvar como nova.">
        <Demo
          bare
          code={`const system: SavedView[] = [
  { id: "todos", label: "Todos", system: true, state: { query: "", conditions: [] } },
  { id: "meus", label: "Meus", system: true, state: { query: "", conditions: [{ id: "a", field: "owner", op: "me" }] } },
];
const views = useSavedViews(filters, system, "negocios-visoes"); // 3º arg: chave do localStorage
<SavedViews views={views} counts={{ todos: 312, meus: 48 }} />`}
        >
          <div className="space-y-4 rounded-xl border border-line bg-surface p-5">
            <SavedViews views={views} counts={Object.fromEntries(views.views.map((v) => [v.id, filters.countFor(v.state)]))} />
            <FilterBar filters={filters} noun="negócio" search={<TableSearch value={filters.state.query} onChange={filters.setQuery} total={deals.length} noun="negócio" shortcut={null} />} />
            <p className="m-0 text-[12.5px] text-muted">Experimente: escolha “Meus”, adicione um filtro e use “Salvar como nova”. A visão fica no seu navegador.</p>
          </div>
        </Demo>
      </DocSection>
      <DocSection title="API">
        <PropsTable
          rows={[
            ["useSavedViews(filters, system, storageKey?)", "SavedViewsApi", "", "Visões do sistema + da pessoa (localStorage). Troque por persistência no servidor para compartilhar com o time."],
            ["SavedView", "{ id, label, state, system? }", "", "system = não pode ser editada nem excluída."],
            ["views.select · saveAs · saveChanges · discard · remove", "", "", "Ações."],
            ["views.dirty", "boolean", "", "O recorte atual difere da visão ativa."],
            ["<SavedViews counts>", "Record<id, number>", "—", "Contagem ao lado de cada aba (use filters.countFor(view.state))."],
          ]}
        />
      </DocSection>
      <DocSection title="Regras">
        <Rules
          items={[
            { do: "2–5 visões do sistema que cobrem o trabalho diário. A primeira é o padrão.", dont: "Uma visão para cada combinação possível." },
            { do: "Nome pelo recorte, curto: “Meus”, “Vencidos”, “Sem responsável”.", dont: "“Visão 1”, “Filtro personalizado”." },
            { do: "Visões ficam ACIMA da barra, como abas: são o primeiro nível do recorte.", dont: "Esconder visões num menu “⋯”." },
            { do: "Abas de situação (Aprovados, Faturados) quando o status é O recorte da tela.", dont: "Visões salvas e abas de situação ao mesmo tempo." },
          ]}
        />
      </DocSection>
    </DocPage>
  );
}
