import { useState } from "react";
import { DataGrid, SegmentedControl, notify } from "@g4ai/ds";
import { Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";
import { contaColumns, makeContas } from "./_grid-data";

export const meta: PageMeta = { title: "DataGrid · teclado, estados e desempenho", group: "Coleções", order: 35, description: "10 mil linhas virtualizadas, navegação completa por teclado, estados de carregando/erro/vazio, carregar mais e cards no celular." };
const big = makeContas(10000);

export default function Page() {
  const [state, setState] = useState<"ok" | "loading" | "error" | "empty">("ok");
  const [loaded, setLoaded] = useState(() => makeContas(40));
  const [loadingMore, setLoadingMore] = useState(false);
  const more = () => {
    setLoadingMore(true);
    setTimeout(() => {
      setLoaded((l) => [...l, ...makeContas(l.length + 30).slice(l.length)]);
      setLoadingMore(false);
    }, 700);
  };
  return (
    <DocPage title={meta.title} kicker="Coleções" description={meta.description}>
      <DocSection title="10.000 linhas" rule="Acima de 200 itens a grade renderiza só o que está visível (+ margem). Cabeçalho, colunas fixas, seleção e teclado continuam funcionando.">
        <Demo bare code={`<DataGrid rows={dezMil} height={480} selectable onRowOpen={abrir} />   // virtualize é automático (> 200)`}>
          <DataGrid label="10 mil contas" rows={big} columns={contaColumns} rowKey={(r) => r.id} rowLabel={(r) => r.empresa} height={480} selectable onRowOpen={(r) => notify(`Abrir ${r.empresa}`, undefined, "info")} density="compact" columnMenu={false} />
        </Demo>
      </DocSection>
      <DocSection title="Teclado">
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full text-left text-[13px]">
            <tbody className="divide-y divide-line">
              {[
                ["Tab", "Entra na grade (na linha com foco) e sai dela"],
                ["↑ ↓ · PgUp PgDn · Home End", "Move entre linhas (rola sozinho)"],
                ["Enter", "Abre o registro (onRowOpen) ou expande"],
                ["→ ←", "Expande / recolhe o detalhe"],
                ["Espaço · X", "Seleciona a linha (Shift = intervalo)"],
                ["E", "Edita a primeira célula editável · Enter confirma · Esc cancela"],
                ["Esc", "Limpa a seleção"],
                ["Menu / clique direito", "Ações da linha, copiar valor, selecionar"],
              ].map(([k, v]) => (
                <tr key={k}>
                  <td className="w-64 px-4 py-2.5 font-mono text-[12px]">{k}</td>
                  <td className="px-4 py-2.5 text-ink-soft">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DocSection>
      <DocSection title="Estados" rule="Carregando usa esqueleto com a forma das colunas; erro oferece tentar de novo; vazio explica e oferece saída.">
        <SegmentedControl label="Estado" value={state} onChange={setState} options={[{ value: "ok", label: "Com dados" }, { value: "loading", label: "Carregando" }, { value: "error", label: "Erro" }, { value: "empty", label: "Vazio" }]} />
        <DataGrid
          label="Estados"
          rows={state === "empty" ? [] : loaded}
          columns={contaColumns.slice(0, 6)}
          rowKey={(r) => r.id}
          height={360}
          loading={state === "loading"}
          error={state === "error" ? { message: "O servidor demorou para responder. Suas alterações estão salvas.", onRetry: () => setState("ok") } : undefined}
          hasMore={state === "ok" && loaded.length < 160}
          loadingMore={loadingMore}
          onLoadMore={more}
          loadMode="infinite"
          footerSlot={<span className="text-[12px] tabular-nums text-muted">{loaded.length} de 160 carregadas · role até o fim para carregar mais</span>}
          columnMenu={false}
        />
        <PropsTable
          rows={[
            ["virtualize", "boolean", "auto (> 200)", "Renderiza só as linhas visíveis. Altura por densidade: 44 / 36px."],
            ["loading · error · empty", "boolean · { message, onRetry } · ReactNode", "—", "Estados do corpo."],
            ["hasMore · onLoadMore · loadingMore · loadMode", '… · "button" | "infinite"', '"button"', "Carregar mais por botão ou ao chegar no fim."],
            ["mobile", '"scroll" | "cards"', '"scroll"', "No celular: rolagem lateral com a 1ª coluna fixa, ou um card por linha."],
            ["exportFileName", "string", "—", "Botão Exportar: CSV pt-BR (;) do que está na tela ou dos selecionados."],
          ]}
        />
      </DocSection>
      <DocSection title="Regras">
        <Rules items={[{ do: "Paginação no servidor para bases grandes; virtualização resolve só a renderização.", dont: "Baixar 100 mil registros para o navegador." }, { do: "Carregar mais/infinito em feeds e listas de trabalho; paginação numerada quando a pessoa precisa voltar à “página 7”.", dont: "Rolagem infinita sem mostrar quantos existem." }]} />
      </DocSection>
    </DocPage>
  );
}
