import { Bot, FolderOpen, Inbox, Mic, PanelRight, Share } from "lucide-react";
import { useState } from "react";
import {
  AgentAppLayout,
  AgentComposer,
  AnswerCard,
  ArtifactCard,
  ArtifactPanel,
  IconRail,
  ListToggle,
  MessageActions,
  ProductMark,
  ReportSection,
  RunSummary,
  SessionQuickSwitcher,
  SessionSidebar,
  ThreadDaySeparator,
  ThreadHeader,
  ThreadView,
  UserBubble,
  type ArtifactTab,
  type SessionProject,
  type SessionSummary,
} from "@g4os/ds";
import { CodeBlock, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";

export const meta: PageMeta = {
  title: "Layout de app agêntico",
  group: "IA e interação",
  order: 31,
  description: "AgentAppLayout monta trilho, lista, conversa e painel de artefatos com atalhos, larguras persistidas e comportamento de celular. ThreadHeader e ThreadView resolvem cabeçalho e rolagem da conversa.",
};

const projects: SessionProject[] = [
  { id: "receita", name: "Receita" },
  { id: "ops", name: "Operações" },
];
const sessions: SessionSummary[] = [
  { id: "1", title: "Queda de conversão no funil de PMEs", time: "2m", status: "working", day: "Hoje", tags: ["Receita"], projectId: "receita" },
  { id: "2", title: "Conectar servidor MCP do Notion", time: "11m", day: "Hoje", projectId: "ops" },
  { id: "3", title: "Resumo de CX", time: "1h", status: "ready", day: "Hoje", projectId: "ops" },
  { id: "4", title: "Puxar dados da agenda", time: "59m", status: "error", day: "Hoje", projectId: "ops" },
  { id: "5", title: "Morning Brief", time: "6h", scheduled: true, day: "Hoje" },
];
const earlier = ["O que mudou no funil de PMEs desde agosto?", "Separe por canal.", "E por tamanho de empresa?", "Compare com o mesmo mês do ano passado."];
const tabs: ArtifactTab[] = [
  { id: "rel", kind: "report", title: "Relatório", closable: true },
  { id: "ctx", kind: "context", title: "Contexto" },
  { id: "det", kind: "details", title: "Detalhes" },
];

function LiveDemo() {
  const [active, setActive] = useState("1");
  const [panel, setPanel] = useState(true);
  const [tab, setTab] = useState("rel");
  const [draft, setDraft] = useState("");
  const main = (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <ThreadHeader
        // Botão de recolher a lista + troca rápida (só aparece com a lista recolhida).
        leading={
          <>
            <ListToggle />
            <SessionQuickSwitcher sessions={sessions} activeId={active} onSelect={setActive} />
          </>
        }
        title={sessions.find((s) => s.id === active)?.title}
        menu={[{ label: "Renomear" }, { label: "Exportar em Markdown" }]}
        actions={[
          { id: "rec", label: "Gravar reunião", icon: <Mic />, onClick: () => undefined, showLabel: true, hideOnMobile: true },
          { id: "share", label: "Compartilhar", icon: <Share />, onClick: () => undefined },
          { id: "panel", label: "Artefatos (⌘.)", icon: <PanelRight />, onClick: () => setPanel((p) => !p), active: panel },
        ]}
      />
      <ThreadView resetKey={active} maxWidth={620} collapseBefore={earlier.length * 2}>
        {earlier.flatMap((q, i) => [
          <UserBubble key={`q${i}`}>{q}</UserBubble>,
          <AnswerCard key={`a${i}`} variant="flow">
            <p>Resposta anterior {i + 1}.</p>
          </AnswerCard>,
        ])}
        <ThreadDaySeparator label="Hoje" />
        <UserBubble>Por que a conversão de PMEs caiu em setembro?</UserBubble>
        <AnswerCard
          variant="flow"
          actionsVisible="always"
          run={<RunSummary variant="divider" status="done" durationMs={40200} steps={9} tools={5} tokens={48210} cost="R$ 0,62" />}
          artifacts={<ArtifactCard kind="report" title="Relatório" meta="3 seções · 1 gráfico" selected={panel && tab === "rel"} onOpen={() => (setPanel(true), setTab("rel"))} />}
          actions={<MessageActions size="xs" text="A conversão caiu 4,9 pontos." onRetry={() => undefined} onBranch={() => undefined} onShare={() => undefined} />}
        >
          <p>A conversão de PMEs caiu de 14,1 % para 9,2 %. A queda começa em 02/09, quando a página de preços trocou o valor mensal por “a partir de”.</p>
        </AnswerCard>
      </ThreadView>
      <div className="shrink-0 px-4 pb-3">
        <div className="mx-auto max-w-[620px]">
          <AgentComposer value={draft} onChange={setDraft} onSubmit={() => setDraft("")} placeholder="Pergunte ao agente…" />
        </div>
      </div>
    </div>
  );
  return (
    <div className="overflow-hidden rounded-2xl border border-line">
      <AgentAppLayout
        className="!h-[620px]"
        rail={
          <IconRail
            groups={[
              [
                { href: "#sessoes", label: "Sessões", icon: Inbox },
                { href: "#agentes", label: "Agentes", icon: Bot },
                { href: "#arquivos", label: "Arquivos", icon: FolderOpen },
              ],
            ]}
            currentPath="#sessoes"
            mark={<ProductMark size={28} />}
          />
        }
        list={<SessionSidebar density="clean" sessions={sessions} projects={projects} activeId={active} onSelect={setActive} onNew={() => undefined} />}
        defaultListWidth={260}
        main={main}
        panel={
          <ArtifactPanel tabs={tabs} active={tab} onActiveChange={setTab} onClose={() => setPanel(false)}>
            <div className="px-6 py-5">
              <ReportSection title={tabs.find((t) => t.id === tab)?.title}>
                <p>Conteúdo da aba. Arraste o divisor para redimensionar; ⌘. abre e fecha o painel; ⌘\ recolhe a lista.</p>
              </ReportSection>
            </div>
          </ArtifactPanel>
        }
        panelOpen={panel}
        onPanelOpenChange={setPanel}
        panelSize={0.6}
      />
    </div>
  );
}

export default function Page() {
  return (
    <DocPage title={meta.title} kicker="IA e interação" description={meta.description}>
      <DocSection title="Anatomia" rule="Quatro áreas; só o main é obrigatório. Bloco pronto: Blocos › IA › Sessões com artefatos (src/blocks/ai-sessions-artifacts.tsx).">
        <div className="grid gap-2 text-[12.5px] md:grid-cols-[56px_200px_1fr_220px]">
          {[
            ["rail", "IconRail · 56px", "Some no celular (vira mobileNav)."],
            ["list", "Lista · 240–420px", "SessionSidebar clean. ListToggle ou ⌘\\ recolhe (animado); arraste a borda; largura salva."],
            ["main", "Conversa", "ThreadHeader + ThreadView + AgentComposer + Disclaimer."],
            ["panel", "Painel", "ArtifactPanel (artefatos, contexto, detalhes). ⌘. abre/fecha."],
          ].map(([k, t, d], i) => (
            <div key={k} className={i === 0 ? "rounded-xl border border-line bg-rail p-2 text-center" : "rounded-xl border border-line bg-surface p-3"}>
              <code className="font-mono text-[11.5px] text-blue">{k}</code>
              {i > 0 && (
                <>
                  <div className="mt-1 font-medium">{t}</div>
                  <div className="mt-0.5 text-muted">{d}</div>
                </>
              )}
            </div>
          ))}
        </div>
      </DocSection>

      <DocSection title="Ao vivo" rule="Clique nas sessões, abra/feche o painel, arraste os divisores. Os atalhos funcionam com o foco nesta página.">
        <LiveDemo />
      </DocSection>

      <DocSection title="Lista recolhível" rule="O botão fica sempre no mesmo lugar (início do cabeçalho da conversa). Recolhida, a lista vira uma troca rápida de sessão ao lado do botão.">
        <CodeBlock
          code={`<ThreadHeader
  leading={
    <>
      <ListToggle />                       {/* dentro do AgentAppLayout: lê e muda o estado sozinho */}
      <SessionQuickSwitcher                {/* só aparece com a lista recolhida (desktop) */}
        sessions={sessoes}                 // { id, title, time?, status?, group? }
        activeId={id}
        onSelect={abrir}
      />
    </>
  }
  title={sessao.titulo}
/>

// Fora do AgentAppLayout (layout próprio): controle você mesmo
<ListToggle open={listaAberta} onToggle={() => setListaAberta((v) => !v)} label="sessões" />`}
        />
      </DocSection>

      <DocSection title="Conversas longas" rule="Só o final importa: o começo vira “N mensagens anteriores” e cada execução vira uma linha discreta que abre os passos.">
        <CodeBlock
          code={`<ThreadView resetKey={sessao.id} collapseBefore={mensagens.length > 8 ? mensagens.length - 5 : 0}>
  {mensagens}
</ThreadView>

<AnswerCard
  variant="flow"
  run={<RunSummary variant="divider" status="done" durationMs={214000}>{/* StepGroup com os passos */}</RunSummary>}
  actions={<MessageActions size="xs" text={texto} onShare={compartilhar} />}
>
  …
</AnswerCard>`}
        />
      </DocSection>

      <DocSection title="Uso">
        <CodeBlock
          code={`<AgentAppLayout
  storageKey="minhas-sessoes"          // persiste largura da lista, abertura e tamanho do painel
  rail={<IconRail groups={rail} currentPath={rota} mark={<ProductMark />} />}
  list={<SessionSidebar density="clean" sessions={sessoes} activeId={id} onSelect={abrir} onNew={nova} />}
  main={
    <>
      <ThreadHeader title={sessao.titulo} menu={menu} onBack={() => setView("list")} actions={acoes} />
      <ThreadView follow={mensagens.length} resetKey={sessao.id} minimap={mapa}>{mensagens}</ThreadView>
      <AgentComposer … />
    </>
  }
  panel={<ArtifactPanel tabs={abas} active={aba} onActiveChange={setAba} onClose={() => setPainel(false)}>{conteudo}</ArtifactPanel>}
  panelOpen={painel}
  onPanelOpenChange={setPainel}
  mobileView={view}                    // "list" | "main" — o app troca ao abrir/voltar
  mobileNav={<BottomNav items={abasCelular} currentPath={rota} />}
/>`}
        />
      </DocSection>

      <DocSection title="Teclado e celular">
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full text-left text-[13px]">
            <thead className="border-b border-line bg-soft/60 text-[12px] text-muted">
              <tr>
                <th className="px-4 py-2.5">Ação</th>
                <th className="px-4 py-2.5">Desktop</th>
                <th className="px-4 py-2.5">Celular (&lt; 768px)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {[
                ["Recolher/mostrar lista", "Botão no cabeçalho (ListToggle), ⌘\\ ou Ctrl+\\; divisor: ←/→, Enter recolhe", "A lista é a primeira tela"],
                ["Trocar de sessão com a lista recolhida", "SessionQuickSwitcher: busca + lista agrupada", "—"],
                ["Abrir/fechar painel", "⌘. ou Ctrl+.", "Painel em tela cheia por cima, fecha no ✕"],
                ["Redimensionar", "Arraste os divisores; duplo clique volta ao padrão", "—"],
                ["Voltar para a lista", "—", "Botão ‹ do ThreadHeader (onBack)"],
                ["Navegação do app", "IconRail", "mobileNav (BottomNav) só na lista"],
                ["Rolagem", "ThreadView segue o fim; se você subiu, aparece “Ir para o fim”", "Igual"],
              ].map(([a, d, m]) => (
                <tr key={a}>
                  <td className="px-4 py-2.5 font-medium">{a}</td>
                  <td className="px-4 py-2.5 text-ink-soft">{d}</td>
                  <td className="px-4 py-2.5 text-ink-soft">{m}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DocSection>

      <DocSection title="Props">
        <p className="m-0 text-[12px] font-medium uppercase tracking-[0.08em] text-muted">AgentAppLayout</p>
        <PropsTable
          rows={[
            ["main", "ReactNode", "—", "Obrigatório. Cabeçalho, conversa e campo."],
            ["rail · list · panel", "ReactNode", "—", "Áreas opcionais."],
            ["panelOpen / onPanelOpenChange", "boolean / (v) => void", "false", "Controle do painel; o handler habilita ⌘."],
            ["listOpen / onListOpenChange", "boolean / (v) => void", "interno", "Opcional; sem ele o layout guarda (e persiste) o estado."],
            ["defaultListWidth · minListWidth · maxListWidth", "number", "300 · 240 · 420", "Largura da lista (px)."],
            ["panelSize", "number", "0.58", "Fração do main quando o painel está aberto."],
            ["storageKey", "string", "—", "Persiste largura, abertura e tamanho do painel."],
            ["mobileView", '"list" | "main"', '"main"', "Tela mostrada no celular."],
            ["mobileNav", "ReactNode", "—", "BottomNav mostrada na lista no celular."],
          ]}
        />
        <p className="m-0 mt-4 text-[12px] font-medium uppercase tracking-[0.08em] text-muted">ThreadHeader</p>
        <PropsTable
          rows={[
            ["title", "ReactNode", "—", "Título da conversa."],
            ["menu", "MenuEntry[]", "—", "Menu no título (renomear, mover, exportar…)."],
            ["actions", "ThreadAction[]", "[]", "Ícones com tooltip; showLabel mostra texto ≥ 1024px; active/tone para estado."],
            ["onBack", "() => void", "—", "Botão ‹ no celular."],
            ["leading · trailing", "ReactNode", "—", "Antes do título / depois das ações."],
          ]}
        />
        <p className="m-0 mt-4 text-[12px] font-medium uppercase tracking-[0.08em] text-muted">ThreadView</p>
        <PropsTable
          rows={[
            ["follow", "unknown", "—", "Mude quando o conteúdo crescer: segue o fim se a pessoa estiver no fim."],
            ["resetKey", "unknown", "—", "Mude ao trocar de conversa: volta ao fim."],
            ["minimap", "MinimapItem[]", "—", "Minimapa à esquerda (≥ 1024px)."],
            ["maxWidth", "number", "760", "Largura da coluna de leitura."],
            ["scrollRef", "RefObject", "—", "Para rolar de fora (ex.: ir até uma mensagem)."],
            ["collapseBefore", "number", "0", "Recolhe os N primeiros filhos em “N mensagens anteriores”; o minimapa mostra só os visíveis."],
            ["collapsedLabel", "ReactNode", "“N mensagens anteriores”", "Texto do botão de expandir."],
          ]}
        />
        <p className="m-0 mt-4 text-[12px] font-medium uppercase tracking-[0.08em] text-muted">ListToggle</p>
        <PropsTable
          rows={[
            ["open · onToggle", "boolean · () => void", "do layout", "Opcionais dentro do AgentAppLayout (usa useAgentLayout)."],
            ["label", "string", '"lista"', "Completa o rótulo: “Recolher lista ⌘\\” / “Mostrar lista”."],
          ]}
        />
        <p className="m-0 mt-4 text-[12px] font-medium uppercase tracking-[0.08em] text-muted">SessionQuickSwitcher</p>
        <PropsTable
          rows={[
            ["sessions", "QuickSession[]", "—", "{ id, title, time?, status?, group? }; group vira cabeçalho (ex.: projeto)."],
            ["activeId · onSelect", "string · (id) => void", "—", "Sessão atual e troca."],
            ["always", "boolean", "false", "Mostrar mesmo com a lista aberta (ou fora do layout)."],
            ["label", "string", '"Sessões"', "Texto do gatilho."],
          ]}
        />
        <p className="m-0 mt-4 text-[12px] font-medium uppercase tracking-[0.08em] text-muted">RunSummary</p>
        <PropsTable
          rows={[
            ["variant", '"inline" | "divider"', '"inline"', "divider: “Trabalhou por 3 min 34 s ›” sobre uma linha; abre os passos (children) e as métricas."],
          ]}
        />
      </DocSection>

      <DocSection title="Regras">
        <Rules
          items={[
            { do: "Painel abre quando um artefato é aberto; a conversa continua visível ao lado.", dont: "Abrir artefato em modal por cima da conversa." },
            { do: "Persistir larguras e abertura (storageKey): cada pessoa arruma uma vez.", dont: "Voltar ao padrão a cada recarga." },
            { do: "Seguir o fim só se a pessoa estiver no fim; senão, mostrar “Ir para o fim”.", dont: "Puxar a rolagem enquanto ela relê uma resposta antiga." },
            { do: "No celular: lista → conversa → painel em tela cheia, com volta clara.", dont: "Três colunas espremidas em 390px." },
            { do: "Recolher a lista com um botão visível no cabeçalho, animado e lembrado entre visitas.", dont: "Recolher só por atalho escondido, ou sem um jeito de trocar de sessão depois." },
            { do: "Conversa longa: recolher o começo e mostrar cada execução como “Trabalhou por …”.", dont: "Despejar 60 mensagens e todos os passos abertos." },
          ]}
        />
      </DocSection>
    </DocPage>
  );
}
