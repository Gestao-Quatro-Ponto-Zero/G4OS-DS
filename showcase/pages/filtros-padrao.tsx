import { Command, Filter, Search, Bookmark } from "lucide-react";
import {
  Badge,
  DataTable,
  EmptyFilterResult,
  FilterBar,
  Highlight,
  Kbd,
  SavedViews,
  TableSearch,
  formatCurrency,
  formatDate,
  useFilters,
  useSavedViews,
  type Column,
} from "@g4ai/ds";
import { CodeBlock, Demo, DocPage, DocSection, Rules, type PageMeta } from "../kit";
import { dealFields, dealSearch, dealViews, deals, me, now, owners, type Deal } from "./_filtros-data";

export const meta: PageMeta = {
  title: "Padrão de filtros",
  group: "Filtros e busca",
  order: 0,
  description: "Como estreitar qualquer coleção — CRM, ATS, ERP, suporte — sempre do mesmo jeito: busca, atalhos de faceta, filtros por campo, visões salvas e estado na URL.",
};

const tools = [
  { icon: <Search />, name: "Busca local", key: "/", what: "Texto livre sobre a lista que está na tela.", when: "“Aquele da Aurora”, número de pedido, e-mail.", comp: "TableSearch" },
  { icon: <Filter />, name: "Filtro", key: "+ Filtro", what: "Campo + operador + valor. Estrutura, não texto.", when: "“Valor > R$ 100 mil”, “Etapa é Proposta”.", comp: "FilterBar" },
  { icon: <Bookmark />, name: "Visão salva", key: "abas", what: "Um recorte nomeado (busca + filtros).", when: "Recortes do dia a dia: “Meus”, “Atrasados”.", comp: "SavedViews" },
  { icon: <Command />, name: "Busca global", key: "⌘K", what: "Qualquer registro, página ou ação do app.", when: "Ir para algo que não está nesta lista.", comp: "SearchPalette" },
];

function Anatomy() {
  const n = (x: number) => <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-accent text-[11px] font-semibold text-on-ink">{x}</span>;
  const box = "flex h-10 items-center gap-2 rounded-lg border border-dashed border-line-strong bg-surface px-3 text-[12px] text-muted";
  return (
    <div className="rounded-xl border border-line bg-soft/50 p-5">
      <div className="flex flex-wrap items-center gap-2 border-b border-line pb-2">
        <span className="flex items-center gap-2 text-[12.5px] font-medium">{n(1)} Todos · Meus · Atrasados</span>
        <span className="ml-auto flex items-center gap-2 text-[12px] text-muted">{n(2)} + Salvar visão</span>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className={`${box} min-w-[220px] flex-1`}>{n(3)} Buscar em 312 contatos … <Kbd>/</Kbd></span>
        <span className={box}>{n(4)} Etapa ▾</span>
        <span className={box}>Responsável ▾</span>
        <span className={box}>{n(5)} + Filtro</span>
        <span className="ml-auto flex items-center gap-2 text-[12px] text-muted">{n(6)} 48 de 312</span>
        <span className={box}>{n(7)} Lista · Cards</span>
      </div>
      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        <span className="flex h-8 items-center gap-2 rounded-lg border border-dashed border-line-strong bg-surface px-2.5 text-[12px] text-muted">{n(8)} Valor &gt; R$ 100 mil ×</span>
        <span className="text-[12px] text-muted">Limpar tudo</span>
      </div>
      <ol className="mt-5 grid list-none gap-x-8 gap-y-2 p-0 text-[12.5px] leading-relaxed text-ink-soft md:grid-cols-2">
        <li><b className="font-medium text-ink">1 · Visões salvas.</b> Abas acima de tudo. A ativa ganha um ponto quando o recorte muda.</li>
        <li><b className="font-medium text-ink">2 · Salvar.</b> “Salvar alterações” (visão da pessoa) ou “Salvar como nova”.</li>
        <li><b className="font-medium text-ink">3 · Busca local.</b> Primeira coisa à esquerda. Placeholder diz o tamanho da lista. “/” foca.</li>
        <li><b className="font-medium text-ink">4 · Atalhos de faceta.</b> 1–3 campos mais usados (quick). Mostram o valor quando ativos.</li>
        <li><b className="font-medium text-ink">5 · + Filtro.</b> Todos os outros campos: escolhe campo → operador → valor.</li>
        <li><b className="font-medium text-ink">6 · Contagem.</b> “X de Y” em aria-live. Sempre visível.</li>
        <li><b className="font-medium text-ink">7 · Exibição.</b> Visualização, densidade, ordenação, exportar — à direita, depois da contagem.</li>
        <li><b className="font-medium text-ink">8 · Chips ativos.</b> Linha própria, só com filtros. Clique edita, × remove, “Limpar tudo” zera.</li>
      </ol>
    </div>
  );
}

function LiveExample() {
  const filters = useFilters(deals, { fields: dealFields, search: dealSearch, me, now });
  const views = useSavedViews(filters, dealViews);
  const q = filters.state.query;
  const columns: Column<Deal>[] = [
    { key: "name", header: "Negócio", primary: true, cell: (d) => <span><Highlight text={d.name} query={q} className="block" /><Highlight text={d.company} query={q} className="block text-[12px] font-normal text-muted" /></span> },
    { key: "stage", header: "Etapa", cell: (d) => <Badge>{d.stage}</Badge> },
    { key: "owner", header: "Responsável", cell: (d) => owners.find((o) => o.value === d.owner)?.label },
    { key: "value", header: "Valor", align: "right", nowrap: true, cell: (d) => <span className="font-medium tabular-nums">{formatCurrency(d.value, { cents: false })}</span> },
    { key: "closes", header: "Fechamento", nowrap: true, cell: (d) => <span className="tabular-nums text-muted">{formatDate(d.closes)}</span> },
  ];
  return (
    <div className="space-y-4">
      <SavedViews views={views} counts={Object.fromEntries(dealViews.map((v) => [v.id, filters.countFor(v.state)]))} />
      <FilterBar filters={filters} noun="negócio" search={<TableSearch value={q} onChange={filters.setQuery} total={deals.length} noun="negócio" searchIn="nome, empresa e cidade" />} />
      <DataTable rows={filters.rows.slice(0, 6)} columns={columns} rowKey={(d) => d.id} empty={<EmptyFilterResult filters={filters} noun="negócio" />} />
      {filters.rows.length > 6 && <p className="m-0 text-[12px] text-muted">Mostrando 6 de {filters.rows.length} (paginação omitida no exemplo).</p>}
    </div>
  );
}

export default function Page() {
  return (
    <DocPage title={meta.title} kicker="Filtros e busca" description={meta.description}>
      <DocSection title="Quatro ferramentas, quatro trabalhos" rule="Cada uma responde a uma intenção diferente. Não misture: a busca local não navega, o ⌘K não filtra a lista, o filtro não é texto livre.">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {tools.map((t) => (
            <div key={t.name} className="rounded-xl border border-line bg-surface p-4">
              <div className="flex items-center justify-between">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-soft text-ink-soft [&_svg]:h-4 [&_svg]:w-4">{t.icon}</span>
                <Kbd>{t.key}</Kbd>
              </div>
              <p className="m-0 mt-3 text-[14px] font-medium">{t.name}</p>
              <p className="m-0 mt-1 text-[12.5px] leading-relaxed text-ink-soft">{t.what}</p>
              <p className="m-0 mt-2 text-[12px] leading-relaxed text-muted">{t.when}</p>
              <code className="mt-3 inline-block rounded bg-soft px-1.5 py-0.5 font-mono text-[11.5px] text-blue">{t.comp}</code>
            </div>
          ))}
        </div>
        <p className="m-0 text-[13px] leading-relaxed text-ink-soft">
          Busca e filtros <b className="font-medium">combinam em E</b>: “aurora” + “Etapa é Proposta” mostra só propostas que contêm “aurora”. Dentro de um mesmo filtro de lista, os valores combinam em <b className="font-medium">OU</b> (“Etapa é Proposta, Negociação”).
        </p>
      </DocSection>

      <DocSection title="Anatomia da barra" rule="Uma linha de controles, uma linha de chips. A ordem é fixa em todo produto: quem usa um CRM G4 já sabe usar o ERP G4.">
        <Anatomy />
      </DocSection>

      <DocSection title="Exemplo vivo" rule="Experimente: digite “aurora”, abra Etapa, adicione “Valor maior que 100000”, troque de visão. Em telas estreitas os filtros viram um botão que abre um painel.">
        <Demo
          bare
          code={`const fields: FilterField<Deal>[] = [
  { key: "stage", label: "Etapa", type: "enum", quick: true, accessor: (d) => d.stage, options },
  { key: "owner", label: "Responsável", type: "person", quick: true, accessor: (d) => d.owner, options: owners },
  { key: "value", label: "Valor", type: "currency", accessor: (d) => d.value },
  { key: "closes", label: "Fechamento previsto", type: "date", accessor: (d) => d.closes },
];

const filters = useFilters(deals, { fields, search: (d) => [d.name, d.company], me: "ana", url: true });
const views = useSavedViews(filters, systemViews, "negocios-visoes");

<SavedViews views={views} />
<FilterBar
  filters={filters}
  noun="negócio"
  search={<TableSearch value={filters.state.query} onChange={filters.setQuery} total={deals.length} noun="negócio" />}
  actions={<DisplayControls … />}
/>
<DataTable rows={filters.rows} … empty={<EmptyFilterResult filters={filters} noun="negócio" />} />`}
        >
          <div className="rounded-xl border border-line bg-surface p-5">
            <LiveExample />
          </div>
        </Demo>
      </DocSection>

      <DocSection title="Onde colocar, por tipo de tela">
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full text-left text-[13px]">
            <thead className="border-b border-line bg-soft/60 text-[12px] text-muted">
              <tr>
                <th className="px-4 py-2.5">Tela</th>
                <th className="px-4 py-2.5">Filtros</th>
                <th className="px-4 py-2.5">Exemplo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {[
                ["Lista / tabela", "SavedViews + FilterBar completa acima da tabela. Busca local sempre que houver 12+ itens.", "Contatos, pedidos, chamados"],
                ["Dashboard", "UM período global no topo à direita (DateRangeFilter), junto das ações do cabeçalho. No máximo 1–2 facetas globais (equipe, unidade). Nada de filtro por card.", "Painel de vendas, DRE"],
                ["Quadro (kanban)", "Busca + facetas de dono e prioridade. A etapa é a própria coluna: nunca filtre por etapa num quadro.", "Pipeline, vagas"],
                ["Abas de situação", "Aba = recorte principal (Aprovados, Faturados). Busca e filtros atuam dentro da aba.", "Pedidos de venda"],
                ["Lista dentro de um registro", "Só busca local se passar de 12 itens. Sem visões salvas.", "Atividades de um cliente"],
                ["Celular (< 640px)", "Busca em linha inteira; atalhos e “+ Filtro” viram “Filtros (N)” que abre folha inferior com “Aplicar (N resultados)”. Chips continuam visíveis.", "Todas as listas"],
              ].map(([a, b, c]) => (
                <tr key={a}>
                  <td className="px-4 py-2.5 align-top font-medium">{a}</td>
                  <td className="px-4 py-2.5 align-top text-ink-soft">{b}</td>
                  <td className="px-4 py-2.5 align-top text-muted">{c}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DocSection>

      <DocSection title="Estado na URL" rule="Tudo que estreita a lista vai para a querystring. O link reproduz o recorte, o voltar do navegador funciona e recarregar não perde nada.">
        <CodeBlock
          code={`/contatos?q=aurora&f=stage~is~Proposta|Negociação&f=value~gt~100000&f=closes~range~2026-10-01..2026-10-31

useFilters(rows, { fields, url: true })       // lê e escreve ?q= e ?f=
useFilters(rows, { fields, url: "neg_" })     // prefixo quando há 2 listas na tela
serializeFilters(state) / parseFilters(params) // para montar links ou enviar ao servidor`}
        />
      </DocSection>

      <DocSection title="Regras">
        <Rules
          items={[
            { do: "Mesma ordem em toda lista: visões → busca → facetas → + Filtro → contagem → exibição.", dont: "Filtros à direita num produto e à esquerda no outro." },
            { do: "1–3 atalhos de faceta, os campos mais usados. O resto em “+ Filtro”.", dont: "Oito dropdowns em fila “porque sim”." },
            { do: "Contagem “X de Y” sempre visível e anunciada (aria-live).", dont: "Filtrar e deixar a pessoa adivinhar quanto sobrou." },
            { do: "Resultado vazio diz o recorte e oferece “Remover último filtro” e “Limpar”.", dont: "“Nenhum resultado.” e mais nada." },
            { do: "Filtro aplicado aparece como chip editável.", dont: "Filtro invisível que só se descobre abrindo o menu." },
            { do: "Opções de faceta com contagem quando for barato calcular.", dont: "Opções que levam a zero resultado sem aviso." },
            { do: "Mesma semântica no servidor (applyFilters é pura: espelhe os operadores).", dont: "Filtro no cliente sobre uma página de 20 itens do servidor." },
          ]}
        />
      </DocSection>
    </DocPage>
  );
}
