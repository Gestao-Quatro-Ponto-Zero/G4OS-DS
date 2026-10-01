import { Archive, Mail, Phone, Tag, Trash2 } from "lucide-react";
import { DataGrid, notify, usePagination, Pagination } from "@g4os/ds";
import { Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";
import { contaColumns, makeContas } from "./_grid-data";

export const meta: PageMeta = { title: "DataGrid · seleção e ações", group: "Coleções", order: 32, description: "Seleção com shift+clique, “selecionar todos os N” além da página, barra de ações em massa, ações rápidas por linha e o mesmo conjunto no clique direito." };
const all = makeContas(312);

export default function Page() {
  const page = usePagination(all, 20);
  return (
    <DocPage title={meta.title} kicker="Coleções" description={meta.description}>
      <DocSection title="Seleção em massa" rule="Clique numa caixa e shift+clique noutra para marcar o intervalo. Marque o cabeçalho: aparece a faixa “Selecionar todos os 312”. A barra de ações flutua no pé da grade.">
        <Demo bare code={`<DataGrid selectable totalCount={312} onSelectAllMatching={() => …}
  bulkActions={(rows, { allMatching, count, clear }) => (
    <>
      <button onClick={() => marcar(rows)}><Tag /> Etiquetar</button>
      <button onClick={() => arquivar(allMatching ? "filtro atual" : rows)}><Archive /> Arquivar</button>
    </>
  )}
  footerSlot={<Pagination … />} … />`}>
          <DataGrid
            label="Contas"
            rows={page.rows}
            columns={contaColumns}
            rowKey={(r) => r.id}
            rowLabel={(r) => r.empresa}
            height={440}
            selectable
            totalCount={all.length}
            noun="conta" gender="f"
            bulkActions={(rows, { allMatching, count }) => (
              <>
                <button type="button" onClick={() => notify(`${count} contas etiquetadas`)}>
                  <Tag /> Etiquetar
                </button>
                <button type="button" onClick={() => notify(allMatching ? "Arquivando todas as 312 em segundo plano" : `${rows.length} contas arquivadas`)}>
                  <Archive /> Arquivar
                </button>
              </>
            )}
            footerSlot={<Pagination page={page.page} pageCount={page.pageCount} onPage={page.setPage} total={page.total} pageSize={page.pageSize} />}
            columnMenu={false}
          />
        </Demo>
      </DocSection>
      <DocSection title="Ações rápidas e clique direito" rule="inline: true mostra o ícone ao passar o mouse (sempre visível no toque). Todas as ações aparecem no ⋯ e no clique direito, junto com “Copiar valor” da célula e “Selecionar”.">
        <Demo bare code={`rowActions={(c) => [
  { label: "Ligar", icon: <Phone />, inline: true, onSelect: ligar },
  { label: "E-mail", icon: <Mail />, inline: true, onSelect: escrever },
  { label: "Excluir", icon: <Trash2 />, tone: "danger", separator: true, onSelect: pedirConfirmacao },
]}`}>
          <DataGrid
            label="Contas"
            rows={all.slice(0, 12)}
            columns={contaColumns.slice(0, 6)}
            rowKey={(r) => r.id}
            rowLabel={(r) => r.empresa}
            rowActions={(r) => [
              { label: "Ligar", icon: <Phone />, inline: true, onSelect: () => notify(`Ligando para ${r.contato}`, undefined, "info") },
              { label: "Enviar e-mail", icon: <Mail />, inline: true, onSelect: () => notify(`Rascunho para ${r.email}`, undefined, "info") },
              { label: "Excluir", icon: <Trash2 />, tone: "danger", separator: true, onSelect: () => notify("Exemplo: pediria confirmação (ConfirmDialog)", undefined, "info") },
            ]}
            columnMenu={false}
          />
        </Demo>
        <PropsTable
          rows={[
            ["selectable", "boolean", "false", "Coluna de seleção fixa à esquerda. Shift+clique marca intervalo."],
            ["selected · onSelectedChange", "Set<string>", "interno", "Seleção controlada (por rowKey)."],
            ["totalCount · onSelectAllMatching", "number · () => void", "—", "Habilita “Selecionar todos os N” (além da página)."],
            ["bulkActions", "(rows, { allMatching, count, clear }) => ReactNode", "—", "Botões da barra de massa."],
            ["rowActions", "(row) => { label, icon, onSelect, inline?, tone?, separator? }[]", "—", "Ações por linha: ícones (inline, até 3), ⋯ e clique direito."],
            ["noun · nounPlural", "string", '"item"', "Texto da barra: “3 contas selecionadas”."],
          ]}
        />
      </DocSection>
      <DocSection title="Regras">
        <Rules items={[{ do: "Ação em massa destrutiva abre ConfirmDialog com a contagem (“Arquivar 312 contas?”).", dont: "Executar em massa sem confirmar nem oferecer desfazer." }, { do: "Quando “todos os N” está ativo, a ação roda no filtro (servidor), não só nas linhas carregadas.", dont: "Dizer “312 selecionadas” e agir só nas 20 da página." }]} />
      </DocSection>
    </DocPage>
  );
}
