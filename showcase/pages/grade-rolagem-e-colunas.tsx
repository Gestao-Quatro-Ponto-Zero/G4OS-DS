import { DataGrid } from "@g4ai/ds";
import { Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";
import { contaColumns, makeContas } from "./_grid-data";

export const meta: PageMeta = { title: "DataGrid · rolagem e colunas", group: "Coleções", order: 31, description: "Rolagem interna com cabeçalho e rodapé fixos, colunas fixas à esquerda e à direita, redimensionar, ordenar, mostrar/ocultar e lembrar as preferências." };
const rows = makeContas(40);

export default function Page() {
  return (
    <DocPage title={meta.title} kicker="Coleções" description={meta.description}>
      <DocSection title="Rolagem interna e colunas fixas" rule="height fixa a grade; o conteúdo rola por dentro. pinned: 'left' | 'right' por coluna. A sombra na borda aparece só quando há conteúdo passando por baixo.">
        <Demo bare code={`<DataGrid label="Contas" rows={contas} rowKey={(c) => c.id} height={420}
  columns={[
    { key: "empresa", header: "Empresa", value: (c) => c.empresa, width: 220, pinned: "left", hideable: false },
    { key: "mrr", header: "MRR", value: (c) => c.mrr, align: "right", footer: (rows) => soma(rows) },
    { key: "acao", header: "Status", value: (c) => c.status, pinned: "right", width: 120 },
    …
  ]} />`}>
          <DataGrid label="Contas" rows={rows} columns={contaColumns.map((c) => (c.key === "status" ? { ...c, pinned: "right" as const } : c))} rowKey={(r) => r.id} rowLabel={(r) => r.empresa} height={420} columnMenu={false} />
        </Demo>
      </DocSection>
      <DocSection title="Redimensionar, mover, fixar, ocultar e lembrar" rule="Arraste a borda do cabeçalho (clique duplo ajusta ao conteúdo). A seta de cada cabeçalho (aparece no hover e no foco) ordena, move para os lados, fixa à esquerda e oculta. O menu Colunas mostra/oculta todas. Com storageKey, larguras, ordem, fixação e colunas ficam salvas por pessoa neste navegador; “Restaurar” volta ao padrão.">
        <Demo bare code={`<DataGrid storageKey="contas" … />   // localStorage: ds-grid:contas
// coluna: { width: 160, minWidth: 80, maxWidth: 480, resizable: true, hideable: true, defaultHidden: false, menu: true }
// menu do cabeçalho: Ordenar crescente/decrescente · Mover para a esquerda/direita · Fixar à esquerda · Ocultar coluna`}>
          <DataGrid label="Contas" rows={rows} columns={contaColumns} rowKey={(r) => r.id} rowLabel={(r) => r.empresa} height={360} storageKey="doc-colunas" defaultSort={{ key: "mrr", dir: "desc" }} />
        </Demo>
        <PropsTable
          rows={[
            ["height · maxHeight", "number | string", "—", "height = altura fixa (lista sempre cheia). maxHeight = cresce até o limite e então rola por dentro: prefira para listas que mudam com filtros (o total fica colado no fim)."],
            ["columns[].pinned", '"left" | "right"', "—", "Fixa a coluna. Seleção e expandir entram fixos à esquerda; ações, à direita."],
            ["columns[].width / minWidth / maxWidth", "number", "160 / 72 / 640", "Largura inicial e limites do redimensionamento."],
            ["columns[].value", "(row) => valor", "—", "Base para ordenar, exportar, copiar e destacar a busca."],
            ["columns[].tooltip", "string", "—", "Explica a métrica no cabeçalho (ícone ?)."],
            ["defaultSort · sort · onSortChange", "{ key, dir } | null", "—", "Ordenação não controlada ou controlada. manualSort para ordenar no servidor."],
            ["storageKey", "string", "—", "Persiste larguras, ordem, fixação e colunas visíveis."],
            ["columnMenu", "boolean", "true", "Mostra o menu Colunas e o menu de cada cabeçalho."],
            ["columns[].menu", "boolean", "true", "false tira o menu do cabeçalho daquela coluna."],
          ]}
        />
      </DocSection>
      <DocSection title="Regras">
        <Rules items={[{ do: "Números alinhados à direita, com tabular-nums, e o total embaixo da própria coluna.", dont: "Centralizar números ou texto longo." }, { do: "Deixe o nome da coluna curto; detalhe no tooltip.", dont: "Cabeçalho de duas linhas." }]} />
      </DocSection>
    </DocPage>
  );
}
