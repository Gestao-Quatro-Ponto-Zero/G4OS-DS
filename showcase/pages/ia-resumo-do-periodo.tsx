import { useState } from "react";
import { Button, CatchUpDone, CatchUpRow, CatchUpRowSkeleton, CatchUpSection, CatchUpSources, ToolGlyph, type CatchUpItem } from "@g4ai/ds";
import { Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";

export const meta: PageMeta = {
  title: "Resumo do período",
  group: "IA e interação",
  order: 42,
  description: "\"Enquanto você estava fora\": as fontes lidas, e o resumo em quatro seções (Precisa de você, Decisões tomadas, Entregue, Para saber), com a oferta da IA nas linhas que esperam a pessoa.",
};

const slack = <ToolGlyph name="Slack" color="var(--ds-tag-purple-fg)" />;
const github = <ToolGlyph name="GitHub" color="var(--ds-ink)" />;

const items: CatchUpItem[] = [
  {
    id: "a",
    section: "needs-you",
    source: "Slack",
    sourceIcon: slack,
    text: "O Rafael espera sua revisão do plano de onboarding desde sexta.",
    context: "#ops-clientes",
    when: "sex., 17:42",
    people: [{ name: "Rafael Lima" }, { name: "Beatriz Ramos" }],
    href: "#",
  },
  {
    id: "b",
    section: "shipped",
    source: "GitHub",
    sourceIcon: github,
    text: "Exportação de CSV com mais de 50 mil linhas foi para produção.",
    context: "PR #418",
    when: "seg., 09:12",
    href: "#",
  },
];

export default function Page() {
  const [read, setRead] = useState<string[]>([]);
  const left = items.filter((i) => !read.includes(i.id));
  return (
    <DocPage title={meta.title} kicker="IA e interação" description={meta.description}>
      <DocSection title="CatchUpSources" rule="Antes do resumo: cada fonte com a contagem do período e o estado da leitura. O número explica o tamanho do resumo.">
        <Demo
          code={`<CatchUpSources sources={[
  { id: "slack", label: "Slack", icon, count: 86, unit: "mensagens", state: "done" },
  { id: "gmail", label: "Gmail", icon, count: 7, unit: "conversas", state: "reading" },
  { id: "github", label: "GitHub", icon, count: 18, unit: "PRs", state: "error" },
]} />`}
        >
          <div className="max-w-[520px]">
            <CatchUpSources
              sources={[
                { id: "slack", label: "Slack", icon: slack, count: 86, unit: "mensagens", state: "done" },
                { id: "gmail", label: "Gmail", icon: <ToolGlyph name="Gmail" color="var(--ds-rose)" />, count: 7, unit: "conversas", state: "reading" },
                { id: "github", label: "GitHub", icon: github, count: 18, unit: "PRs", state: "error" },
                { id: "linear", label: "Linear", icon: <ToolGlyph name="Linear" color="var(--ds-tag-blue-fg)" />, count: 31, unit: "tarefas" },
              ]}
            />
          </div>
        </Demo>
      </DocSection>

      <DocSection title="CatchUpSection + CatchUpRow" rule="Quatro seções fixas, nesta ordem: Precisa de você, Decisões tomadas, Entregue, Para saber. Só Precisa de você leva a oferta da IA, com o primário da linha.">
        <Demo
          bare
          code={`<div data-catch-up="">
  <CatchUpSection section="needs-you" count={1}>
    <CatchUpRow item={item} onRead={marcarLido}
      action={<Button size="sm" onClick={pedir}>Revisar</Button>}>
      <p>Posso ler o plano e deixar três comentários no fio.</p>
    </CatchUpRow>
  </CatchUpSection>
</div>`}
        >
          <div className="max-w-[560px] rounded-xl border border-line bg-surface px-4 py-4" data-catch-up="">
            {left.length === 0 ? (
              <CatchUpDone action={<Button variant="ghost" size="sm" onClick={() => setRead([])} data-catch-up-fallback="">Ver de novo</Button>}>
                Nada mais desde sexta.
              </CatchUpDone>
            ) : (
              <div className="flex flex-col gap-4">
                {(["needs-you", "shipped"] as const).map((section) => {
                  const rows = left.filter((i) => i.section === section);
                  if (!rows.length) return null;
                  return (
                    <CatchUpSection key={section} section={section} count={rows.length}>
                      {rows.map((item) => (
                        <CatchUpRow
                          key={item.id}
                          item={item}
                          onOpen={() => undefined}
                          onRead={(id) => setRead((r) => [...r, id])}
                          action={section === "needs-you" ? <Button size="sm" onClick={() => setRead((r) => [...r, item.id])}>Revisar</Button> : undefined}
                        >
                          {section === "needs-you" && <p className="m-0 rounded-lg bg-soft px-2.5 py-2 text-[12.5px] text-ink-soft">Posso ler o plano e deixar três comentários no fio com os pontos em aberto.</p>}
                        </CatchUpRow>
                      ))}
                    </CatchUpSection>
                  );
                })}
              </div>
            )}
          </div>
        </Demo>
        <PropsTable
          rows={[
            ["item", "CatchUpItem", "—", "id, section, source, sourceIcon, text, context, when, people (até 3), href"],
            ["action", "ReactNode", "—", "A ação da linha: a oferta da IA em Precisa de você"],
            ["onRead", "(id) => void", "—", "Mostra “Marcar como lido”; a linha recolhe em 200 ms e o foco vai para a próxima"],
            ["onOpen", "(item) => void", "abre href em aba nova", "“Abrir” aparece com href ou onOpen"],
            ["children", "ReactNode", "—", "Detalhe abaixo da frase (a oferta, uma citação)"],
          ]}
        />
      </DocSection>

      <DocSection title="Enquanto o resumo chega" rule="Reserve a altura das linhas com CatchUpRowSkeleton: nada pula quando o texto chega.">
        <Demo code={`<CatchUpSection section="decisions"><CatchUpRowSkeleton /><CatchUpRowSkeleton /></CatchUpSection>`}>
          <div className="max-w-[560px]">
            <CatchUpSection section="decisions">
              <CatchUpRowSkeleton />
              <CatchUpRowSkeleton />
            </CatchUpSection>
          </div>
        </Demo>
      </DocSection>

      <DocSection title="Regras">
        <Rules
          items={[
            { do: "Mostrar as fontes e a contagem do período antes do resumo.", dont: "Um resumo sem dizer o que foi lido." },
            { do: "Uma frase por linha, com onde, quando e quem.", dont: "Parágrafos que repetem a mensagem original." },
            { do: "Oferta da IA só em Precisa de você, executada só no toque.", dont: "Propor trabalho em Decisões, Entregue ou Para saber." },
            { do: "Fonte que falhou aparece como falha, e o resumo sai sem ela.", dont: "Esconder a fonte que não respondeu." },
          ]}
        />
      </DocSection>
    </DocPage>
  );
}
