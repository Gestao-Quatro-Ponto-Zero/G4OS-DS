import { useState } from "react";
import { ArtifactPanel, ContextView, SheetArtifact, ReportSection, notify, type ArtifactTab, type ContextItem } from "@g4os/ds";
import { Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";

export const meta: PageMeta = { title: "Artefatos e contexto", group: "IA e interação", order: 21, description: "ArtifactPanel (abas de artefatos), SheetArtifact (planilha com o que o agente mudou) e ContextView (o que o agente usou para responder)." };

const ctx0: ContextItem[] = [
  { id: "1", kind: "record", title: "Negócios de PMEs · setembro", detail: "412 negócios", relevance: 0.94, citations: 4, pinned: true },
  { id: "2", kind: "doc", title: "Transcrições de 38 ligações", detail: "7 h 12 min", relevance: 0.81, citations: 5 },
  { id: "3", kind: "web", title: "Página de preços da Acme", detail: "versão de 02/09", relevance: 0.72, citations: 2 },
  { id: "4", kind: "tool", title: "crm.listar_negocios", detail: "3 chamadas", relevance: 0.6 },
];

export default function Page() {
  const [tabs, setTabs] = useState<ArtifactTab[]>([
    { id: "r", kind: "report", title: "Relatório" },
    { id: "c", kind: "context", title: "Contexto" },
    { id: "s", kind: "sheet", title: "Páginas com preço", closable: true },
    { id: "e", kind: "email", title: "E-mail para marketing", closable: true },
  ]);
  const [active, setActive] = useState("c");
  const [ctx, setCtx] = useState(ctx0);
  return (
    <DocPage title={meta.title} kicker="IA e interação" description={meta.description}>
      <DocSection title="ArtifactPanel" rule="Abas com ícone por tipo; fixas (Relatório, Contexto, Saída) não fecham, geradas fecham. ← → navegam entre abas.">
        <Demo
          bare
          code={`<ArtifactPanel tabs={tabs} active={active} onActiveChange={setActive}
  onCloseTab={(id) => setTabs((t) => t.filter((x) => x.id !== id))}
  addOptions={[{ label: "Planilha", kind: "sheet", onSelect: … }]}
  onCopy={…} onExport={…} onShare={…} onClose={…}>
  {views[active]}
</ArtifactPanel>`}
        >
          <div className="flex h-[420px] overflow-hidden rounded-xl border border-line">
            <ArtifactPanel
              tabs={tabs}
              active={active}
              onActiveChange={setActive}
              onCloseTab={(id) => setTabs((t) => t.filter((x) => x.id !== id))}
              addOptions={[{ label: "Planilha de páginas", kind: "sheet", onSelect: () => (setTabs((t) => (t.some((x) => x.id === "s") ? t : [...t, { id: "s", kind: "sheet", title: "Páginas com preço", closable: true }])), setActive("s")) }]}
              onCopy={() => notify("Copiado", undefined, "info")}
              onExport={() => notify("Exportando…", undefined, "info")}
              onShare={() => notify("Link copiado", undefined, "info")}
            >
              <div className="p-5">
                {active === "c" ? (
                  <ContextView items={ctx} onPinChange={(id, pinned) => setCtx((x) => x.map((i) => (i.id === id ? { ...i, pinned } : i)))} />
                ) : active === "s" ? (
                  <SheetArtifact
                    columns={[
                      { key: "p", label: "Página" },
                      { key: "v", label: "Visitas", align: "right" },
                      { key: "d", label: "Proposta" },
                    ]}
                    rows={[
                      { p: "/precos", v: "18.400", d: "R$ 89 por usuário/mês" },
                      { p: "/planos/pro", v: "5.100", d: "R$ 89 por usuário/mês" },
                      { p: "/enterprise", v: "2.300", d: "fale com vendas" },
                    ]}
                    changed={["0:d", "1:d"]}
                  />
                ) : (
                  <ReportSection title={tabs.find((t) => t.id === active)?.title}>
                    <p>Conteúdo da aba.</p>
                  </ReportSection>
                )}
              </div>
            </ArtifactPanel>
          </div>
        </Demo>
        <PropsTable
          rows={[
            ["tabs", "{ id, kind, title, closable? }[]", "—", "kind: report | sheet | doc | chart | code | email | deck | context | output."],
            ["active / onActiveChange", "string", "—", "Aba aberta (controlado)."],
            ["onCloseTab", "(id) => void", "—", "Mostra × nas abas closable."],
            ["addOptions", "{ label, kind, onSelect }[]", "—", "Menu “+”."],
            ["expanded / onExpandedChange", "boolean", "false", "Botão expandir (desktop)."],
            ["onClose, onCopy, onExport, onShare", "() => void", "—", "Cada handler liga o botão correspondente."],
          ]}
        />
      </DocSection>
      <DocSection title="Regras">
        <Rules
          items={[
            { do: "Destaque o que o agente alterou (SheetArtifact.changed) — a pessoa revisa só o que mudou.", dont: "Planilha nova sem dizer o que é dado original e o que é sugestão." },
            { do: "ContextView ordenado pelo peso na resposta; fixar mantém a fonte nas próximas perguntas.", dont: "Lista de fontes sem relevância, na ordem em que foram lidas." },
          ]}
        />
      </DocSection>
    </DocPage>
  );
}
