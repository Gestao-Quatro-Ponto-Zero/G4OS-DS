import { Download, Mail } from "lucide-react";
import {
  Badge,
  BulkBar,
  DataTable,
  Pagination,
  PropertyList,
  SortHeader,
  formatCurrency,
  notify,
  selectionColumn,
  usePagination,
  useSelection,
  useSort,
  type Column,
} from "@g4os/ds";
import { CodeBlock, Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";

export const meta: PageMeta = {
  title: "Ordenar, selecionar, paginar",
  group: "Coleções",
  order: 20,
  description: "Hooks e peças para tabela de verdade sem biblioteca: useSort + SortHeader, useSelection + selectionColumn + BulkBar, usePagination + Pagination. Compõem com DataTable.",
};

type Invoice = { id: string; customer: string; due: string; value: number; status: "pago" | "aberto" | "vencido" };
const customers = ["Construtora Pilar", "Vértice Logística", "Agro Cerrado", "Clínica Bem Viver", "Hotel Mar Azul", "Café Serra Alta", "Pet Mundo", "Escola Novo Saber"];
const invoices: Invoice[] = Array.from({ length: 23 }, (_, i) => ({
  id: String(i + 1),
  customer: customers[(i * 3) % customers.length],
  due: `${String(1 + ((i * 7) % 28)).padStart(2, "0")}/10/2026`,
  value: 1_200 + ((i * 7919) % 48_000),
  status: (["aberto", "pago", "vencido"] as const)[i % 3],
}));
const tone = { pago: "ok", aberto: "neutral", vencido: "bad" } as const;

export default function Page() {
  const sort = useSort(invoices, { cliente: (r) => r.customer, valor: (r) => r.value }, { key: "valor", dir: "desc" });
  const pages = usePagination(sort.rows, 6);
  const sel = useSelection(pages.rows.map((r) => r.id));
  const columns: Column<Invoice>[] = [
    selectionColumn<Invoice>(sel, (r) => r.id, (r) => `fatura de ${r.customer}`),
    { key: "customer", header: <SortHeader label="Cliente" {...sort.header("cliente")} />, primary: true, cell: (r) => r.customer },
    { key: "due", header: "Vencimento", nowrap: true, cell: (r) => <span className="tabular-nums text-muted">{r.due}</span> },
    { key: "value", header: <SortHeader label="Valor" align="right" {...sort.header("valor")} />, align: "right", nowrap: true, cell: (r) => <span className="font-medium tabular-nums">{formatCurrency(r.value)}</span> },
    { key: "status", header: "Situação", cell: (r) => <Badge tone={tone[r.status]}>{r.status[0].toUpperCase() + r.status.slice(1)}</Badge> },
  ];

  return (
    <DocPage title={meta.title} kicker="Coleções" description={meta.description}>
      <DocSection title="Exemplo completo" rule="Clique nos cabeçalhos com setas, marque linhas (a barra de ações aparece), troque de página.">
        <Demo
          bare
          code={`const sort = useSort(invoices, { cliente: (r) => r.customer, valor: (r) => r.value }, { key: "valor", dir: "desc" });
const pages = usePagination(sort.rows, 20);
const sel = useSelection(pages.rows.map((r) => r.id));   // "todos" = página visível

const columns: Column<Invoice>[] = [
  selectionColumn(sel, (r) => r.id, (r) => \`fatura de \${r.customer}\`),
  { key: "customer", header: <SortHeader label="Cliente" {...sort.header("cliente")} />, primary: true, cell: (r) => r.customer },
  { key: "value", header: <SortHeader label="Valor" align="right" {...sort.header("valor")} />, align: "right", cell: … },
];

<DataTable rows={pages.rows} columns={columns} rowKey={(r) => r.id} />
<Pagination page={pages.page} pageCount={pages.pageCount} onPage={pages.setPage} total={pages.total} pageSize={pages.pageSize} />
<BulkBar count={sel.count} noun="fatura" onClear={sel.clear}>
  <button type="button" onClick={cobrar}><Mail /> Enviar cobrança</button>
</BulkBar>`}
        >
          <div className="space-y-4">
            <DataTable rows={pages.rows} columns={columns} rowKey={(r) => r.id} />
            <Pagination page={pages.page} pageCount={pages.pageCount} onPage={pages.setPage} total={pages.total} pageSize={pages.pageSize} />
            <BulkBar count={sel.count} noun="fatura" onClear={sel.clear}>
              <button
                type="button"
                onClick={() => {
                  notify(`Cobrança enviada para ${sel.count} faturas`);
                  sel.clear();
                }}
              >
                <Mail /> Enviar cobrança
              </button>
              <button type="button">
                <Download /> Exportar
              </button>
            </BulkBar>
          </div>
        </Demo>
      </DocSection>

      <DocSection title="useSort + SortHeader" rule="Clique alterna crescente → decrescente → sem ordenação. Texto compara em pt-BR (acentos e caixa); nulos vão para o fim.">
        <PropsTable
          rows={[
            ["useSort(rows, by, initial?)", "—", "—", "by: { chave: (row) => string | number | Date }. Retorna rows, sort, toggle, header(chave)."],
            ["sort.header(chave)", "{ active, dir, onToggle }", "—", "Espalhe em <SortHeader label=… />."],
            ["SortHeader.align", '"left" | "right"', '"left"', "right em colunas numéricas (seta à esquerda do rótulo)."],
          ]}
        />
      </DocSection>

      <DocSection title="useSelection + selectionColumn + BulkBar" rule="“Selecionar todos” age sobre os ids visíveis (página ou filtro atual), nunca sobre registros que a pessoa não vê.">
        <PropsTable
          rows={[
            ["useSelection(visibleIds)", "—", "—", "selected, count, all, some, has, toggle, toggleAll, clear."],
            ["selectionColumn(sel, rowKey, rowLabel)", "Column<T>", "—", "Checkbox por linha + cabeçalho com estado parcial."],
            ["BulkBar", "{ count, noun, nounPlural?, onClear, children }", "—", "Barra escura flutuante no rodapé. Filhos: <button> com ícone + verbo."],
          ]}
        />
      </DocSection>

      <DocSection title="usePagination + Pagination" rule="No cliente até alguns milhares de linhas. Acima disso, pagine no servidor e use só Pagination.">
        <PropsTable
          rows={[
            ["usePagination(rows, pageSize = 20)", "—", "—", "page, pageCount, pageSize, total, rows (da página), setPage."],
            ["Pagination", "{ page, pageCount, onPage, total?, pageSize? }", "—", "“1–20 de 312” + anterior/próxima + páginas vizinhas."],
          ]}
        />
      </DocSection>

      <DocSection title="PropertyList" rule="Propriedades de um registro (lateral de contato, candidato, pedido). Vazio mostra “—”: a ausência também é informação.">
        <Demo className="grid gap-8 md:grid-cols-2" code={`<PropertyList items={[
  { label: "Valor", value: formatCurrency(460800), hint: "R$ 160 por usuário/mês" },
  { label: "Probabilidade", value: "75 %" },
  { label: "Concorrente", value: undefined },
]} />
<PropertyList stacked items={…} />`}>
          <PropertyList
            items={[
              { label: "Valor", value: <span className="font-semibold tabular-nums">{formatCurrency(460_800)}</span>, hint: "R$ 160 por usuário/mês · 12 meses" },
              { label: "Probabilidade", value: "75 %" },
              { label: "Responsável", value: "Ana Lopes" },
              { label: "Concorrente", value: undefined },
            ]}
          />
          <PropertyList
            stacked
            items={[
              { label: "CNPJ", value: "12.345.678/0001-90" },
              { label: "Segmento", value: "Indústria" },
              { label: "Cidade", value: "Joinville, SC" },
              { label: "Site", value: undefined },
            ]}
          />
        </Demo>
      </DocSection>

      <DocSection title="Receita: tabela de lista dedicada">
        <CodeBlock
          code={`// filtros → ordenação → paginação → seleção (nessa ordem)
const filtered = useMemo(() => rows.filter(matches), [rows, query, facets]);
const sort = useSort(filtered, by, { key: "data", dir: "desc" });
const pages = usePagination(sort.rows, 20);
const sel = useSelection(pages.rows.map(rowKey));`}
        />
        <Rules
          items={[
            { do: "Ordenação padrão que responde à tarefa (vencidos primeiro, maior valor primeiro).", dont: "Ordem de criação no banco como padrão." },
            { do: "Ações em massa com verbo e contagem (“Faturar 3 pedidos”); destrutivas passam por ConfirmDialog.", dont: "Ações em massa sempre visíveis, desabilitadas até alguém selecionar." },
            { do: "Colunas numéricas alinhadas à direita com tabular-nums.", dont: "Valores monetários centralizados." },
          ]}
        />
      </DocSection>
    </DocPage>
  );
}
