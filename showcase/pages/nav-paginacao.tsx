import { useMemo } from "react";
import { DataTable, Pagination, formatCurrency, usePagination, type Column } from "@g4ai/ds";
import { Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";

export const meta: PageMeta = {
  title: "Paginação",
  group: "Navegação",
  order: 50,
  description: "“1–20 de 312” + anterior/próxima + páginas vizinhas. usePagination fatia a lista no cliente; no servidor, passe page/total vindos da API.",
};

type Fat = { id: string; numero: string; cliente: string; valor: number };
const clientes = ["Acme Logística", "Vértice Saúde", "Rede Horizonte", "Norte Agro", "Lumen Educação", "Pátio Imóveis"];

export default function Page() {
  const all = useMemo<Fat[]>(() => Array.from({ length: 312 }, (_, i) => ({ id: String(i), numero: `NF ${String(1000 + i)}`, cliente: clientes[i % clientes.length], valor: 1200 + ((i * 7919) % 48000) })), []);
  const p = usePagination(all, 8);
  const cols: Column<Fat>[] = [
    { key: "n", header: "Número", cell: (r) => r.numero, primary: true, nowrap: true },
    { key: "c", header: "Cliente", cell: (r) => r.cliente },
    { key: "v", header: "Valor", cell: (r) => <span className="tabular-nums">{formatCurrency(r.valor)}</span>, align: "right", nowrap: true },
  ];
  return (
    <DocPage title={meta.title} description={meta.description} kicker={meta.group}>
      <DocSection title="Com tabela" rule="Abaixo da tabela, alinhada às bordas. O intervalo à esquerda diz onde a pessoa está.">
        <Demo
          className="block"
          code={`const p = usePagination(faturas, 20);
<DataTable rows={p.rows} … />
<Pagination page={p.page} pageCount={p.pageCount} onPage={p.setPage} total={p.total} pageSize={p.pageSize}
  pageSizeOptions={[20, 50, 100]} onPageSizeChange={p.setPageSize} noun="fatura" />`}
        >
          <DataTable label="Faturas" rows={p.rows} columns={cols} rowKey={(r) => r.id} />
          <Pagination className="mt-3" page={p.page} pageCount={p.pageCount} onPage={p.setPage} total={p.total} pageSize={p.pageSize} pageSizeOptions={[8, 20, 50]} onPageSizeChange={p.setPageSize} noun="fatura" />
        </Demo>
        <PropsTable
          rows={[
            ["page / pageCount", "number", "—", "Página atual (1-based) e total de páginas."],
            ["onPage", "(page: number) => void", "—", "Troca de página."],
            ["total / pageSize", "number", "—", "Mostra “1–20 de 312” quando informados."],
            ["usePagination(rows, pageSize?, { resetKey? })", "hook", "pageSize=20", "Retorna { rows, page, pageCount, pageSize, total, setPage, setPageSize }. resetKey (filtro, ordenação) volta à página 1."],
            ["Pagination pageSizeOptions · onPageSizeChange · noun", "number[] · (n) => void · string", "—", "“Por página” e “1–20 de 312 faturas”. No celular: “2 de 9” entre as setas."],
          ]}
        />
      </DocSection>
      <DocSection title="Regras">
        <Rules
          items={[
            { do: "Paginar a partir de ~50 linhas; até lá, uma lista só com busca.", dont: "Paginar 12 itens em páginas de 5." },
            { do: "Manter filtros e ordenação ao trocar de página (e página na URL).", dont: "Voltar para a página 1 ao abrir e fechar um registro." },
            { do: "Feeds e timelines: “Carregar mais” no fim.", dont: "Paginação numerada em feed de atividade." },
          ]}
        />
      </DocSection>
    </DocPage>
  );
}
