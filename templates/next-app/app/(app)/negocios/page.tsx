"use client";

import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Button,
  DataTable,
  Empty,
  Page,
  PageHeading,
  TableToolbar,
  formatCurrency,
  normalize,
  notify,
  type Column,
} from "@g4ai/ds";

type Deal = { id: string; name: string; company: string; value: number; stage: string };

const deals: Deal[] = [
  { id: "1", name: "Implantação do módulo fiscal", company: "Vértice Logística", value: 84000, stage: "Proposta" },
  { id: "2", name: "Expansão de licenças", company: "Rede Horizonte", value: 36000, stage: "Negociação" },
  { id: "3", name: "Diagnóstico comercial", company: "Santa Clara Saúde", value: 52000, stage: "Diagnóstico" },
];

const columns: Column<Deal>[] = [
  { key: "name", header: "Negócio", cell: (d) => d.name, primary: true },
  { key: "company", header: "Empresa", cell: (d) => d.company },
  { key: "stage", header: "Etapa", cell: (d) => d.stage },
  { key: "value", header: "Valor", cell: (d) => formatCurrency(d.value), align: "right", nowrap: true },
];

export default function NegociosPage() {
  const [query, setQuery] = useState("");
  const rows = useMemo(() => deals.filter((d) => normalize(`${d.name} ${d.company}`).includes(normalize(query))), [query]);
  return (
    <Page>
      <PageHeading
        title="Negócios"
        actions={
          <Button onClick={() => notify("Abra aqui o drawer de novo negócio", undefined, "info")}>
            <Plus /> Novo negócio
          </Button>
        }
      />
      <div className="mt-6 space-y-4">
        <TableToolbar query={query} onQuery={setQuery} shown={rows.length} total={deals.length} noun="negócio" dirty={!!query} onClear={() => setQuery("")} />
        <DataTable
          rows={rows}
          columns={columns}
          rowKey={(d) => d.id}
          onRowClick={(d) => notify(`Abrir ${d.name}`, undefined, "info")}
          rowLabel={(d) => `Abrir ${d.name}`}
          empty={<Empty framed={false} title="Nenhum negócio com essa busca" hint="Tente outro termo ou limpe a busca." />}
        />
      </div>
    </Page>
  );
}
