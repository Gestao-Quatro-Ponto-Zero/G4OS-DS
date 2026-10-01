import { Archive, Mail, Phone, Trash2, UserRoundPen } from "lucide-react";
import { useMemo, useState } from "react";
import { DataGrid, SearchInput, matchesQuery, notify } from "@g4ai/ds";
import { Demo, DocPage, DocSection, Rules, type PageMeta } from "../kit";
import { contaColumns, makeContas, type Conta } from "./_grid-data";

export const meta: PageMeta = {
  title: "DataGrid · visão geral",
  group: "Coleções",
  order: 30,
  description: "A tabela de trabalho do DS: rola por dentro, fixa cabeçalho, colunas e totais, seleciona em massa, tem ações rápidas por linha, edita inline e aguenta 10 mil linhas.",
};

const all = makeContas(64);

export default function Page() {
  const [rows, setRows] = useState(all);
  const [q, setQ] = useState("");
  const shown = useMemo(() => (q ? rows.filter((r) => matchesQuery(q, [r.empresa, r.contato, r.dono])) : rows), [rows, q]);
  const remove = (targets: Conta[]) => {
    const ids = new Set(targets.map((t) => t.id));
    const before = rows;
    setRows((r) => r.filter((x) => !ids.has(x.id)));
    notify(`${targets.length} ${targets.length === 1 ? "conta arquivada" : "contas arquivadas"}`, () => setRows(before));
  };
  return (
    <DocPage title={meta.title} kicker="Coleções" description={meta.description}>
      <DocSection title="Exemplo completo" rule="Role dentro da grade (cabeçalho e total ficam), role para o lado (Empresa e ações ficam), selecione com shift+clique, passe o mouse numa linha para as ações rápidas, clique direito para o menu, redimensione arrastando a borda do cabeçalho.">
        <Demo
          bare
          code={`<DataGrid
  label="Contas"
  rows={contas}
  columns={colunas}              // { key, header, value, cell?, width, pinned, align, footer, editable… }
  rowKey={(c) => c.id}
  rowLabel={(c) => c.empresa}
  height={520}                   // rola por dentro; cabeçalho e rodapé fixos
  storageKey="contas"            // lembra larguras e colunas visíveis
  query={busca}                  // destaca o termo nas células
  toolbar={<SearchInput value={busca} onChange={setBusca} />}
  selectable
  bulkActions={(sel, { clear }) => <button onClick={() => arquivar(sel)}>Arquivar</button>}
  rowActions={(c) => [
    { label: "Ligar", icon: <Phone />, inline: true, onSelect: ligar },
    { label: "E-mail", icon: <Mail />, inline: true, onSelect: escrever },
    { label: "Arquivar", icon: <Trash2 />, tone: "danger", separator: true, onSelect: arquivar },
  ]}
  onRowOpen={(c) => router.push(\`/contas/\${c.id}\`)}
  exportFileName="contas"
  showDensity
/>`}
        >
          <DataGrid
            label="Contas"
            rows={shown}
            columns={contaColumns}
            rowKey={(r) => r.id}
            rowLabel={(r) => r.empresa}
            height={520}
            storageKey="doc-visao-geral"
            query={q}
            toolbar={<SearchInput value={q} onChange={setQ} placeholder="Buscar em 64 contas…" className="w-full sm:w-72" />}
            selectable
            noun="conta" gender="f"
            bulkActions={(sel) => (
              <>
                <button type="button" onClick={() => notify(`E-mail para ${sel.length} contatos na fila`)}>
                  <Mail /> Enviar e-mail
                </button>
                <button type="button" onClick={() => remove(sel)}>
                  <Archive /> Arquivar
                </button>
              </>
            )}
            rowActions={(r) => [
              { label: "Ligar", icon: <Phone />, inline: true, onSelect: () => notify(`Ligando para ${r.contato}…`, undefined, "info") },
              { label: "Enviar e-mail", icon: <Mail />, inline: true, onSelect: () => notify(`Rascunho para ${r.email}`, undefined, "info") },
              { label: "Trocar responsável", icon: <UserRoundPen />, onSelect: () => notify("Exemplo: abriria o seletor de pessoa", undefined, "info") },
              { label: "Arquivar", icon: <Trash2 />, tone: "danger", separator: true, onSelect: () => remove([r]) },
            ]}
            rowTone={(r) => (r.status === "risco" ? "warn" : undefined)}
            onRowOpen={(r) => notify(`Abrir ${r.empresa}`, undefined, "info")}
            exportFileName="contas"
            showDensity
            mobile="cards"
          />
        </Demo>
      </DocSection>
      <DocSection title="Anatomia">
        <ol className="m-0 grid list-decimal gap-2 pl-5 text-[13.5px] text-ink-soft md:grid-cols-2">
          <li><b className="text-ink">Barra</b>: busca/filtros à esquerda (toolbar); densidade, exportar e Colunas à direita.</li>
          <li><b className="text-ink">Faixa de seleção</b>: “Os 20 desta página… Selecionar todos os 312” quando há mais páginas.</li>
          <li><b className="text-ink">Cabeçalho fixo</b>: ordena no clique, ganha sombra quando o conteúdo passa por baixo, borda arrastável.</li>
          <li><b className="text-ink">Colunas fixas</b>: seleção + identificação à esquerda, ações à direita; sombra na borda ao rolar.</li>
          <li><b className="text-ink">Linha</b>: hover, foco de teclado, selecionada (tom primário a 7 %), tom de atenção (filete).</li>
          <li><b className="text-ink">Ações rápidas</b>: até 3 ícones no hover + ⋯ sempre. As mesmas no clique direito.</li>
          <li><b className="text-ink">Rodapé fixo</b>: totais da coluna (somam o filtro atual, não o banco).</li>
          <li><b className="text-ink">Barra de massa</b>: flutua no pé da grade enquanto houver seleção.</li>
        </ol>
      </DocSection>
      <DocSection title="DataTable ou DataGrid?">
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full text-left text-[13px]">
            <thead className="border-b border-line bg-soft/60 text-[12px] text-muted">
              <tr>
                <th className="px-4 py-2.5">Use</th>
                <th className="px-4 py-2.5">Quando</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              <tr>
                <td className="px-4 py-2.5 font-mono text-[12px]">DataTable</td>
                <td className="px-4 py-2.5 text-ink-soft">Até ~50 linhas, leitura, prévia em card ou seção de uma página; a página inteira rola; vira blocos rotulados no celular.</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-mono text-[12px]">DataGrid</td>
                <td className="px-4 py-2.5 text-ink-soft">A lista é a tela e a pessoa age nela: seleção em massa, ações por linha, edição, muitas colunas, centenas ou milhares de linhas, totais.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </DocSection>
      <DocSection title="Regras">
        <Rules
          items={[
            { do: "Uma coluna de identificação fixa à esquerda (nome, número do pedido) e as ações à direita.", dont: "Fixar metade das colunas: sobra pouca área para rolar." },
            { do: "Altura da grade = altura útil da tela (ex.: calc(100dvh - 220px)): cabeçalho e totais sempre à vista.", dont: "Grade com rolagem interna dentro de uma página que também rola (dois scrolls na mesma direção)." },
            { do: "Ação rápida inline só para o que se faz dezenas de vezes por dia (ligar, aprovar).", dont: "Destrutiva como ícone solto: ela vai para o ⋯, com separador e confirmação." },
            { do: "Totais do rodapé refletem o filtro atual; diga isso no tooltip da coluna.", dont: "Somar o que não é somável (percentuais, médias)." },
          ]}
        />
      </DocSection>
    </DocPage>
  );
}
