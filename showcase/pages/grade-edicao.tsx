import { useState } from "react";
import { Badge, DataGrid, formatDate, notify, type GridColumn } from "@g4ai/ds";
import { Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";
import { brl, donoOptions, makeContas, statusLabel, statusOptions, statusTone, type Conta } from "./_grid-data";

export const meta: PageMeta = { title: "DataGrid · edição inline", group: "Coleções", order: 34, description: "Editar direto na célula: texto, número, moeda, lista e data. Clique (ou E no teclado), Enter confirma, Esc cancela; a alteração vira toast com desfazer." };

const cols: GridColumn<Conta>[] = [
  { key: "empresa", header: "Empresa", value: (r) => r.empresa, width: 220, pinned: "left", editable: { type: "text" } },
  { key: "status", header: "Situação", value: (r) => r.status, width: 140, cell: (r) => <Badge tone={statusTone[r.status]}>{statusLabel[r.status]}</Badge>, editable: { type: "select", options: statusOptions } },
  { key: "dono", header: "Responsável", value: (r) => r.dono, width: 170, editable: { type: "select", options: donoOptions } },
  { key: "mrr", header: "MRR", value: (r) => r.mrr, width: 140, align: "right", cell: (r) => <span className="tabular-nums">{brl(r.mrr)}</span>, editable: { type: "currency" }, footer: (rs) => brl(rs.reduce((s, r) => s + r.mrr, 0)) },
  { key: "usuarios", header: "Usuários", value: (r) => r.usuarios, width: 110, align: "right", editable: { type: "number" }, validate: (v) => (typeof v === "number" && (v < 1 || v > 5000) ? "Entre 1 e 5.000 usuários" : undefined) },
  { key: "ultimoContato", header: "Próximo contato", value: (r) => r.ultimoContato, width: 170, cell: (r) => <span className="tabular-nums">{formatDate(r.ultimoContato)}</span>, editable: { type: "date" } },
];

export default function Page() {
  const [rows, setRows] = useState(() => makeContas(18));
  return (
    <DocPage title={meta.title} kicker="Coleções" description={meta.description}>
      <DocSection title="Exemplo" rule="Passe o mouse: células editáveis ganham sublinhado pontilhado. Data aceita “sexta”, “+3d”, “15/10”.">
        <Demo bare code={`<DataGrid
  columns={[{ key: "dono", header: "Responsável", value: (c) => c.dono, editable: { type: "select", options } }, …]}
  onEdit={(row, key, value) => {
    const antes = row[key];
    salvar(row.id, key, value);                        // otimista
    notify("Responsável atualizado", () => salvar(row.id, key, antes));
  }} />

// validação: tente 0 ou 9000 em Usuários
{ key: "usuarios", editable: { type: "number" }, validate: (v) => (v < 1 || v > 5000 ? "Entre 1 e 5.000 usuários" : undefined) }`}>
          <DataGrid
            label="Contas editáveis"
            rows={rows}
            columns={cols}
            rowKey={(r) => r.id}
            rowLabel={(r) => r.empresa}
            height={440}
            columnMenu={false}
            onEdit={(row, key, value) => {
              const before = rows;
              setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, [key]: value } : r)));
              notify(`${cols.find((c) => c.key === key)?.header} de ${row.empresa} atualizado`, () => setRows(before));
            }}
          />
        </Demo>
        <PropsTable
          rows={[
            ["columns[].editable", '{ type: "text" | "number" | "currency" | "date" } | { type: "select", options }', "—", "Torna a célula editável."],
            ["onEdit", "(row, key, value) => void", "—", "Chamado ao confirmar (só se o valor mudou). Aplique otimista e ofereça desfazer."],
            ["columns[].validate", "(value, row) => string | undefined", "—", "Mensagem de erro abaixo da célula. Enter mantém o editor aberto com o erro; sair do campo desfaz. Número/data não reconhecidos já são barrados."],
          ]}
        />
      </DocSection>
      <DocSection title="Regras">
        <Rules items={[{ do: "Inline para campos curtos e frequentes (dono, status, prazo, valor).", dont: "Editar descrição longa ou campos com validação complexa na célula: use Drawer." }, { do: "Salve na hora, com toast e desfazer; em erro, volte o valor e explique.", dont: "Botão “Salvar tabela” com várias edições pendentes." }]} />
      </DocSection>
    </DocPage>
  );
}
