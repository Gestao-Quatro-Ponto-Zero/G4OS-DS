import { Badge, DataGrid, formatDate, type GridColumn } from "@g4ai/ds";
import { Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";
import { brl, contaColumns, makeContas, statusLabel, type Conta } from "./_grid-data";

export const meta: PageMeta = { title: "DataGrid · linhas", group: "Coleções", order: 33, description: "Expandir detalhe, agrupar com subtotal, totais no rodapé fixo, tom de atenção e zebra." };
const rows = makeContas(36);
const cols: GridColumn<Conta>[] = contaColumns.map((c) => (c.key === "mrr" ? { ...c, aggregate: (rs) => brl(rs.reduce((s, r) => s + r.mrr, 0)) } : c.key === "usuarios" ? { ...c, aggregate: (rs) => rs.reduce((s, r) => s + r.usuarios, 0), footer: (rs) => rs.reduce((s, r) => s + r.usuarios, 0) } : c));

export default function Page() {
  return (
    <DocPage title={meta.title} kicker="Coleções" description={meta.description}>
      <DocSection title="Agrupar com subtotal" rule="groupBy agrupa; o cabeçalho do grupo recolhe e mostra contagem e `aggregate` de cada coluna. O rodapé soma tudo o que está filtrado.">
        <Demo bare code={`<DataGrid groupBy={(c) => c.segmento} groupOrder={["Enterprise", "Mid-market", "PME"]}
  columns={[…, { key: "mrr", aggregate: (rows) => soma(rows), footer: (rows) => soma(rows) }]} />`}>
          <DataGrid label="Contas por segmento" rows={rows} columns={cols} rowKey={(r) => r.id} rowLabel={(r) => r.empresa} height={460} groupBy={(r) => r.segmento} groupOrder={["Enterprise", "Mid-market", "PME"]} columnMenu={false} />
        </Demo>
      </DocSection>
      <DocSection title="Expandir detalhe e tom" rule="renderExpanded mostra um painel sob a linha (→/← no teclado). rowTone pinta um filete: warn (atenção), bad (problema), ok.">
        <Demo bare code={`<DataGrid renderExpanded={(c) => <Resumo conta={c} />} rowTone={(c) => c.status === "risco" ? "warn" : c.status === "cancelada" ? "bad" : undefined} zebra />`}>
          <DataGrid
            label="Contas"
            rows={rows.slice(0, 14)}
            columns={contaColumns.slice(0, 7)}
            rowKey={(r) => r.id}
            rowLabel={(r) => r.empresa}
            zebra
            rowTone={(r) => (r.status === "risco" ? "warn" : r.status === "cancelada" ? "bad" : undefined)}
            renderExpanded={(r) => (
              <div className="grid gap-4 text-[13px] sm:grid-cols-4">
                <div>
                  <div className="text-[11.5px] text-muted">Situação</div>
                  <Badge tone={r.status === "risco" ? "warn" : "neutral"}>{statusLabel[r.status]}</Badge>
                </div>
                <div>
                  <div className="text-[11.5px] text-muted">Contato</div>
                  {r.contato} · {r.email}
                </div>
                <div>
                  <div className="text-[11.5px] text-muted">Último contato</div>
                  {formatDate(r.ultimoContato)}
                </div>
                <div>
                  <div className="text-[11.5px] text-muted">ARR</div>
                  <span className="font-semibold tabular-nums">{brl(r.mrr * 12)}</span>
                </div>
              </div>
            )}
            columnMenu={false}
          />
        </Demo>
        <PropsTable
          rows={[
            ["renderExpanded", "(row) => ReactNode", "—", "Painel sob a linha; fica fixo ao rolar para o lado."],
            ["groupBy · groupOrder · groupLabel", "(row) => string · string[] · (g, rows) => ReactNode", "—", "Agrupamento com cabeçalho recolhível."],
            ["defaultCollapsedGroups", "string[]", "[]", "Grupos que começam fechados."],
            ["columns[].aggregate · footer", "(rows) => ReactNode", "—", "Subtotal no grupo · total no rodapé fixo."],
            ["footerLabel", "string", '"Total"', "Rótulo na primeira coluna do rodapé."],
            ["rowTone", '(row) => "warn" | "bad" | "ok"', "—", "Filete de 2px na lateral da linha."],
            ["zebra", "boolean", "false", "Linhas alternadas (útil em grades largas e densas)."],
          ]}
        />
      </DocSection>
      <DocSection title="Regras">
        <Rules items={[{ do: "Tom só para exceção (5–10 % das linhas); a cor aparece junto de uma palavra na linha.", dont: "Pintar todas as linhas de verde/amarelo/vermelho." }, { do: "Expandir para detalhe curto; registro completo abre em Drawer ou página.", dont: "Formulário longo dentro da linha expandida." }]} />
      </DocSection>
    </DocPage>
  );
}
