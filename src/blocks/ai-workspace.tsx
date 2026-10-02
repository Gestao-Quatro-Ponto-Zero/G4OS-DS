import { ChevronRight, Database, FileText, Globe, Link, Paperclip, PanelRightOpen, Sparkles, Table2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  AgentComposer,
  AgentMessage,
  AgentTrace,
  ArtifactCard,
  ArtifactPanel,
  CommandPalette,
  ComposerChip,
  ContextView,
  InputModal,
  InsightCard,
  JsonView,
  KpiPair,
  LineChart,
  Menu,
  MetricBar,
  RankedList,
  ReportSection,
  ResizableSplit,
  RunSummary,
  SheetArtifact,
  formatCurrency,
  notify,
  type ArtifactKind,
  type ArtifactTab,
  type ContextItem,
  formatPercent,
} from "@g4ai/ds";
import { AgentShell, agentRoutes } from "./shells/agent-shell";
import { saveText } from "./shells/download";
import { frameHref, useFrameParam } from "./shells/frame-route";
import { answer, context as baseContext, extraSources, followUps, insights, projectById, sheetChanged, sheetColumns, sheetRows, slashCommands, traceFor, visibility } from "./data/agent";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Workspace de agente",
  description: "Conversa com o agente à esquerda e artefatos à direita (relatório, contexto, saída, planilha) em painel redimensionável; resposta com tempo e trace, cartões que abrem abas, composer com comandos e voz.",
  category: "IA",
  order: 0,
  height: 900,
  concept: {
    goal: "Análise feita pelo agente que gera entregáveis: a conversa explica, os artefatos (relatório, planilha, contexto) ficam ao lado para revisar e exportar.",
    patterns: [
      "Anatomia Conversa + painel: ResizableSplit com conversa à esquerda e ArtifactPanel à direita",
      "Resposta em fluxo com RunSummary (tempo, passos, ferramentas, custo) que abre o trace",
      "Artefatos são cidadãos de primeira classe: cartões na conversa abrem abas no painel",
      "Contexto explícito: o que o agente usou, com relevância e citações",
      "Composer com comandos (/relatório) e voz",
    ],
    adapt: ["Análises de receita, funil, churn, inadimplência", "Pesquisa de mercado e due diligence", "Relatórios para cliente: o relatório vira entregável exportável"],
    avoid: ["Esconder quanto tempo e quanto custou a execução", "Artefato que só existe dentro da conversa (sem aba e sem exportar)"],
  },
} as const;

/* ------------------------------------------------------------------ */

type Msg =
  | { id: string; role: "user"; text: string }
  | { id: string; role: "agent"; text: string[]; status: "running" | "done"; startedAt: number; durationMs: number; artifacts: { id: string; kind: ArtifactKind; title: string; meta: string }[]; suggestions?: string[] };

const baseTabs: ArtifactTab[] = [
  { id: "report", kind: "report", title: "Relatório" },
  { id: "context", kind: "context", title: "Contexto" },
  { id: "output", kind: "output", title: "Saída" },
  { id: "sheet", kind: "sheet", title: "Páginas com preço", closable: true },
];

function useIsMobile() {
  const [m, setM] = useState(() => typeof window !== "undefined" && window.matchMedia("(max-width: 767.98px)").matches);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767.98px)");
    const on = () => setM(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return m;
}

export default function AiWorkspace() {
  const id = useFrameParam("id", "p1");
  const project = projectById(id);
  const trace = useMemo(() => traceFor(project), [project]);
  const mobile = useIsMobile();

  const [panelOpen, setPanelOpen] = useState(!mobile);
  const [expanded, setExpanded] = useState(false);
  const [tabs, setTabs] = useState<ArtifactTab[]>(baseTabs);
  const [active, setActive] = useState("report");
  const [ctx, setCtx] = useState<ContextItem[]>(baseContext);
  const [draft, setDraft] = useState("");
  const [agentName, setAgentName] = useState<string>(project.agent);
  const [linkOpen, setLinkOpen] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  /** Fonte nova entra no contexto já fixada (vira chip no campo). */
  const addContext = (items: ContextItem[], label: string) => {
    const ids = items.map((i) => i.id);
    setCtx((x) => [...x.filter((i) => !ids.includes(i.id)), ...items.map((i) => ({ ...i, pinned: true }))]);
    notify(label, () => setCtx((x) => x.filter((i) => !ids.includes(i.id))));
  };
  const [msgs, setMsgs] = useState<Msg[]>(() => [
    { id: "u1", role: "user", text: project.question },
    {
      id: "a1",
      role: "agent",
      text: answer,
      status: "done",
      startedAt: 0,
      durationMs: project.durationMs,
      artifacts: [
        { id: "report", kind: "report", title: "Relatório", meta: "3 seções · 1 gráfico" },
        { id: "sheet", kind: "sheet", title: "Páginas com preço", meta: "9 linhas · 7 alteradas" },
      ],
      suggestions: followUps,
    },
  ]);
  const running = msgs.some((m) => m.role === "agent" && m.status === "running");
  const scroller = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [msgs.length]);

  const openArtifact = (tabId: string, kind: ArtifactKind, title: string) => {
    setTabs((t) => (t.some((x) => x.id === tabId) ? t : [...t, { id: tabId, kind, title, closable: true }]));
    setActive(tabId);
    setPanelOpen(true);
  };

  const send = (text: string) => {
    const now = Date.now();
    const aid = `a${now}`;
    const cmd = text.match(/^\/(\w+)/)?.[1];
    const reply =
      cmd === "email"
        ? ["Redigi o e-mail para o time de marketing com os três achados e a lista de páginas. Está em Saída como rascunho — nada foi enviado."]
        : cmd === "resumo"
          ? ["Resumo: 1) PME caiu 4,9 pp; 2) começou em 02/09; 3) objeção nº 1 é preço pouco claro; 4) Mid-market estável; 5) proposta: preço final em 9 páginas."]
          : [
              `Sobre “${text.replace(/^\/\w+\s*/, "") || "a análise"}”: em setembro de 2025 a conversão de PMEs foi 13,6 %, então a queda deste ano não é sazonal.`,
              "Os vendedores mais afetados foram Carla (−6,1 pp) e Bruno (−5,4 pp), que concentram as demos de PMEs vindas do site.",
            ];
    const artifact = cmd === "email" ? { id: "email", kind: "email" as const, title: "E-mail para marketing", meta: "Rascunho · não enviado" } : { id: `cmp-${now}`, kind: "chart" as const, title: "Comparativo 2025 × 2026", meta: "2 séries · 12 meses" };
    setDraft("");
    setMsgs((m) => [...m, { id: `u${now}`, role: "user", text }, { id: aid, role: "agent", text: [], status: "running", startedAt: now, durationMs: 0, artifacts: [] }]);
    reply.forEach((p, i) => {
      timers.current.push(
        window.setTimeout(() => setMsgs((m) => m.map((x) => (x.id === aid && x.role === "agent" ? { ...x, text: [...x.text, p] } : x))), 1400 + i * 1100),
      );
    });
    timers.current.push(
      window.setTimeout(() => {
        setMsgs((m) => m.map((x) => (x.id === aid && x.role === "agent" ? { ...x, status: "done", durationMs: Date.now() - now, artifacts: [artifact], suggestions: ["Abrir no painel", "Refazer com dados de agosto"] } : x)));
      }, 1400 + reply.length * 1100 + 600),
    );
  };

  const stop = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setMsgs((m) => m.map((x) => (x.role === "agent" && x.status === "running" ? { ...x, status: "done", durationMs: Date.now() - x.startedAt, text: x.text.length ? x.text : ["(Interrompido. Nada foi alterado.)"] } : x)));
  };

  const conversation = (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex h-12 shrink-0 items-center gap-2 border-b border-line px-4 sm:px-5">
        <nav aria-label="Trilha" className="flex min-w-0 flex-1 items-center gap-1.5 text-[13px]">
          <a href={agentRoutes.projects} className="shrink-0 text-muted hover:text-ink">
            Projetos
          </a>
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden />
          <span className="truncate font-medium" aria-current="page">
            {project.title}
          </span>
        </nav>
        {!panelOpen && (
          <button type="button" onClick={() => setPanelOpen(true)} className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-[12.5px] text-ink-soft ring-1 ring-line hover:bg-soft" aria-label="Abrir artefatos">
            <PanelRightOpen className="h-4 w-4" />
            <span className="max-sm:sr-only">Artefatos</span>
            <span className="tabular-nums text-muted">{tabs.length}</span>
          </button>
        )}
      </div>
      <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[680px] space-y-7 px-4 py-6 sm:px-6">
          {msgs.map((m) =>
            m.role === "user" ? (
              <div key={m.id} className="flex justify-end">
                <p className="m-0 max-w-[85%] rounded-2xl rounded-br-md bg-soft px-3.5 py-2.5 text-[14px] leading-relaxed">{m.text}</p>
              </div>
            ) : (
              <AgentMessage
                key={m.id}
                streaming={m.status === "running" && m.text.length > 0}
                status={
                  <RunSummary status={m.status} startedAt={m.startedAt || undefined} durationMs={m.durationMs} steps={9} tools={5} tokens={m.status === "done" ? project.tokens : undefined} cost={m.status === "done" ? formatCurrency(project.cost) : undefined}>
                    <AgentTrace steps={trace} replay={false} label="O que o agente fez" />
                    <a href={`${agentRoutes.trace}?id=${project.id}`} className="mt-2 inline-block text-[12.5px] font-medium text-blue hover:underline">
                      Abrir no inspetor de execução →
                    </a>
                  </RunSummary>
                }
                artifacts={
                  m.artifacts.length > 0 &&
                  m.artifacts.map((a) => <ArtifactCard key={a.id} kind={a.kind} title={a.title} meta={a.meta} selected={panelOpen && active === a.id} onOpen={() => openArtifact(a.id, a.kind, a.title)} />)
                }
                suggestions={m.status === "done" ? m.suggestions : undefined}
                onSuggestion={(s) => (s === "Abrir no painel" ? m.artifacts[0] && openArtifact(m.artifacts[0].id, m.artifacts[0].kind, m.artifacts[0].title) : send(s))}
                onRetry={
                  m.status === "done" && !running
                    ? () => {
                        // Refaz: reenvia a pergunta que gerou esta resposta.
                        const i = msgs.findIndex((x) => x.id === m.id);
                        const q = msgs.slice(0, i).reverse().find((x) => x.role === "user");
                        if (q && q.role === "user") send(q.text);
                      }
                    : undefined
                }
                onFeedback={(v) => notify(v === "up" ? "Obrigado pelo retorno" : "Vamos usar isso para melhorar", undefined, "info")}
                copyText={m.text.join("\n\n")}
              >
                {m.text.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </AgentMessage>
            ),
          )}
        </div>
      </div>
      <div className="shrink-0 px-3 pb-3 pt-1 sm:px-5 sm:pb-4">
        <div className="mx-auto max-w-[680px]">
          <AgentComposer
            value={draft}
            onChange={setDraft}
            onSubmit={send}
            onStop={stop}
            busy={running}
            commands={slashCommands}
            placeholder="Pergunte ou dê uma tarefa ao agente… ( / para comandos)"
            attachOptions={[
              { label: "Arquivo do computador", icon: <Paperclip className="h-4 w-4" />, onSelect: () => fileInput.current?.click() },
              { label: "Dados do CRM", icon: <Database className="h-4 w-4" />, onSelect: () => setSourcesOpen(true) },
              { label: "Link (URL)", icon: <Link className="h-4 w-4" />, onSelect: () => setLinkOpen(true) },
            ]}
            agentChip={
              <Menu
                label="Agente"
                side="top"
                triggerClassName="!h-8 !gap-1.5 !rounded-full !px-2.5 !text-[12px] !font-normal !text-ink-soft [&_svg]:!h-3.5 [&_svg]:!w-3.5"
                trigger={
                  <>
                    <Sparkles className="h-3.5 w-3.5 text-accent-deep" /> {agentName}
                  </>
                }
                items={["Analista de receita", "Analista financeiro", "Pesquisa de mercado", "Operações"].map((a) => ({ type: "checkbox" as const, label: a, checked: a === agentName, onCheckedChange: () => setAgentName(a) }))}
              />
            }
            contextChips={
              ctx.some((c) => c.pinned) ? (
                <>
                  {ctx
                    .filter((c) => c.pinned)
                    .map((c) => (
                      <ComposerChip key={c.id} icon={<Database className="h-3 w-3" />} onRemove={() => setCtx((x) => x.map((i) => (i.id === c.id ? { ...i, pinned: false } : i)))}>
                        {c.title}
                      </ComposerChip>
                    ))}
                </>
              ) : undefined
            }
            onTranscribe={() => "Compare com o mesmo mês de 2025 e mostre por vendedor"}
          />
        </div>
      </div>
    </div>
  );

  const views: Record<string, ReactNode> = {
    report: <ReportPane />,
    context: (
      <div className="mx-auto max-w-[760px] px-5 py-6 sm:px-8">
        <ReportSection title="Contexto usado">
          <p>O que o agente leu para responder, pelo peso na resposta. Fixe um item para mantê-lo nas próximas perguntas.</p>
        </ReportSection>
        <ContextView
          className="mt-5"
          items={ctx}
          onPinChange={(cid, pinned) => setCtx((x) => x.map((i) => (i.id === cid ? { ...i, pinned } : i)))}
          onAdd={() => setSourcesOpen(true)}
        />
      </div>
    ),
    output: (
      <div className="mx-auto max-w-[760px] space-y-6 px-5 py-6 sm:px-8">
        <ReportSection title="Saída estruturada">
          <p>O mesmo resultado em formato de dados, para automações e integrações.</p>
        </ReportSection>
        <JsonView maxHeight={420} value={structuredOutput(project.title)} />
      </div>
    ),
    sheet: (
      <div className="px-5 py-6 sm:px-8">
        <ReportSection title="Páginas com preço" className="mb-4">
          <p>O agente leu as 9 páginas que citam preço e propôs o texto novo. Células em destaque foram alteradas por ele.</p>
        </ReportSection>
        <SheetArtifact columns={sheetColumns} rows={sheetRows} changed={sheetChanged} caption="Páginas com preço" />
      </div>
    ),
  };
  const activeTab = tabs.find((t) => t.id === active) ?? tabs[0];
  const view = views[activeTab?.id] ?? (
    <div className="mx-auto max-w-[760px] px-5 py-6 sm:px-8">
      <ReportSection title={activeTab?.title}>
        <p>{activeTab?.kind === "email" ? "Rascunho do e-mail para o time de marketing. Revise e envie pelo seu cliente de e-mail: o agente não envia nada sem aprovação." : "Comparativo gerado agora há pouco. Os dados vêm das mesmas fontes do relatório."}</p>
      </ReportSection>
      {activeTab?.kind === "chart" && (
        <div className="mt-5 rounded-xl border border-line bg-surface p-4">
          <LineChart
            label="Conversão PME 2025 × 2026"
            data={visibility.map((v, i) => ({ ...v, ano: 13.6 + Math.sin(i) * 0.6 }))}
            index="dia"
            series={[
              { key: "conv", label: "2026" },
              { key: "ano", label: "2025", dashed: true, color: "var(--ds-chart-6)" },
            ]}
            format={(n) => formatPercent(n / 100, 1)}
            height={220}
          />
        </div>
      )}
    </div>
  );

  const panel = (
    <ArtifactPanel
      tabs={tabs}
      active={activeTab?.id ?? "report"}
      onActiveChange={setActive}
      onCloseTab={(tid) => {
        setTabs((t) => t.filter((x) => x.id !== tid));
        if (active === tid) setActive("report");
      }}
      addOptions={[
        { label: "Planilha de páginas", kind: "sheet", onSelect: () => openArtifact("sheet", "sheet", "Páginas com preço") },
        { label: "Contexto usado", kind: "context", onSelect: () => openArtifact("context", "context", "Contexto") },
        { label: "Saída estruturada", kind: "output", onSelect: () => openArtifact("output", "output", "Saída") },
      ]}
      expanded={expanded}
      onExpandedChange={setExpanded}
      onClose={() => {
        setPanelOpen(false);
        setExpanded(false);
      }}
      onCopy={() => {
        const out = tabExport(activeTab ?? tabs[0], project.title, ctx);
        navigator.clipboard
          ?.writeText(out.text)
          .then(() => notify("Conteúdo da aba copiado"))
          .catch(() => notify("Não deu para copiar: o navegador bloqueou a área de transferência", undefined, "info"));
      }}
      onExport={() => {
        const out = tabExport(activeTab ?? tabs[0], project.title, ctx);
        saveText(out.name, out.text, out.type);
        notify(`${out.name} baixado`);
      }}
      onShare={() => {
        const link = `${location.href.split("#")[0]}${frameHref("ai-workspace", project.id)}`;
        navigator.clipboard
          ?.writeText(link)
          .then(() => notify("Link do projeto copiado"))
          .catch(() => notify("Não deu para copiar: o navegador bloqueou a área de transferência", undefined, "info"));
      }}
    >
      {view}
    </ArtifactPanel>
  );

  const sourceIcon = { record: Database, table: Table2, doc: FileText, web: Globe, tool: Database } as const;
  const dialogs = (
    <>
      <input
        ref={fileInput}
        type="file"
        hidden
        multiple
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = "";
          if (!files.length) return;
          addContext(
            files.map((f, i) => ({ id: `file-${Date.now()}-${i}`, kind: "doc" as const, title: f.name, detail: "Arquivo anexado agora" })),
            files.length === 1 ? `${files[0].name} adicionado ao contexto` : `${files.length} arquivos adicionados ao contexto`,
          );
        }}
      />
      <InputModal
        open={linkOpen}
        onClose={() => setLinkOpen(false)}
        title="Adicionar link ao contexto"
        description="O agente lê a página e usa nas próximas respostas."
        icon={<Link aria-hidden />}
        placeholder="acme.com.br/precos"
        submitLabel="Adicionar link"
        onSubmit={(v) => {
          const url = v.trim().replace(/^https?:\/\//, "");
          addContext([{ id: `web-${Date.now()}`, kind: "web", title: url, detail: "Link adicionado agora" }], "Link adicionado ao contexto");
        }}
      />
      <CommandPalette
        open={sourcesOpen}
        onClose={() => setSourcesOpen(false)}
        placeholder="Buscar registro, tabela ou documento…"
        emptyLabel="Nenhuma fonte com esse nome"
        commands={extraSources
          .filter((x) => !ctx.some((c) => c.id === x.id))
          .map((x) => {
            const Icon = sourceIcon[x.kind];
            return { id: x.id, label: x.title, group: "Fontes disponíveis", hint: typeof x.detail === "string" ? x.detail : undefined, icon: <Icon className="h-4 w-4" />, onSelect: () => addContext([x], `“${x.title}” adicionado ao contexto`) };
          })}
      />
    </>
  );

  return (
    <AgentShell current={agentRoutes.workspace}>
      {expanded && panelOpen && !mobile ? panel : <ResizableSplit left={conversation} right={panel} rightOpen={panelOpen} storageKey="ai-workspace" defaultSize={0.46} />}
      {dialogs}
    </AgentShell>
  );
}

/** Mesma saída da aba Saída, para exibir e exportar. */
function structuredOutput(title: string) {
  return {
    projeto: title,
    conclusao: "Queda de conversão PME ligada à página de preços sem valor final",
    evidencias: { conversao_pme: { agosto: 0.141, setembro: 0.092 }, objecao_principal: "preço pouco claro", mencoes: 17 },
    acoes: [
      { acao: "Publicar preço final", paginas: 7, prioridade: "alta" },
      { acao: "Preço no e-mail pós-demo", prioridade: "alta" },
    ],
  };
}

const csvCell = (c: unknown) => (/[",;\n]/.test(String(c)) ? `"${String(c).replace(/"/g, '""')}"` : String(c));

/** Conteúdo da aba como arquivo: planilha em CSV, saída em JSON, o resto em Markdown. */
function tabExport(tab: ArtifactTab, title: string, ctx: ContextItem[]): { name: string; text: string; type: string } {
  if (tab.id === "sheet") return { name: "paginas-com-preco.csv", type: "text/csv", text: [sheetColumns.map((c) => csvCell(c.label)).join(","), ...sheetRows.map((r) => sheetColumns.map((c) => csvCell(r[c.key as keyof typeof r])).join(","))].join("\r\n") };
  if (tab.id === "output") return { name: "saida.json", type: "application/json", text: JSON.stringify(structuredOutput(title), null, 2) };
  if (tab.kind === "chart") return { name: "comparativo-2025-2026.csv", type: "text/csv", text: ["dia,conversao_2026", ...visibility.map((v) => `${v.dia},${v.conv}`)].join("\r\n") };
  if (tab.id === "context") return { name: "contexto.md", type: "text/markdown", text: [`# Contexto · ${title}`, "", ...ctx.map((c) => `- ${c.title}${typeof c.detail === "string" ? ` (${c.detail})` : ""}${c.pinned ? " · fixado" : ""}`)].join("\n") };
  if (tab.id === "report") return { name: "relatorio.md", type: "text/markdown", text: [`# ${title}`, "", ...answer].join("\n\n") };
  return { name: `${tab.id}.md`, type: "text/markdown", text: [`# ${tab.title}`, "", ...answer].join("\n\n") };
}

/** Aba Relatório: resumo, dois achados, descrição e o indicador no tempo. */
function ReportPane() {
  return (
    <div className="mx-auto max-w-[820px] space-y-8 px-5 py-6 sm:px-8 sm:py-8">
      <ReportSection title="Relatório">
        <p>
          A conversão de PMEs caiu <strong className="font-medium text-ink">4,9 pontos</strong> em setembro (14,1 % → 9,2 %), enquanto Mid-market ficou estável. A queda começa em 02/09, dia em que a página de preços passou a mostrar “a partir de” no lugar do preço final.
        </p>
      </ReportSection>
      <div className="grid gap-3 lg:grid-cols-2">
        <InsightCard kicker="Objeções" title="Preço pouco claro virou a objeção nº 1 nas ligações perdidas" listLabel="Principais objeções" tone="bad">
          <RankedList items={insights.objections.map((o) => ({ label: o.label, badge: o.badge, value: o.value }))} />
        </InsightCard>
        <InsightCard kicker="Conversão" title="Só PMEs caíram; Mid-market segue estável" listLabel="Conversão por segmento" tone="bad">
          {insights.conversion.map((c, i) => (
            <MetricBar key={c.label} index={i + 1} label={c.label} value={c.value / 0.15} delta={c.delta} />
          ))}
          <p className="m-0 mt-1 text-[11.5px] text-muted">Barra = conversão em relação à meta de 15 %.</p>
        </InsightCard>
      </div>
      <ReportSection title="Descrição">
        <p>
          Em 38 ligações de negócios perdidos, “preço pouco claro” aparece 17 vezes e “falta de parcelamento” 6 vezes — ambos novos em relação a agosto. Concorrentes diretos mostram o preço final por usuário (R$ 59 a R$ 149). Quem chega à demo sem saber o valor sai para comparar e não volta: o
          tempo médio até a perda caiu de 21 para 9 dias.
        </p>
      </ReportSection>
      <KpiPair
        items={[
          { label: "Conversão PME hoje", value: "9,2 %", hint: "meta 15 %" },
          { label: "Negócios afetados", value: "121", hint: "perdidos em setembro" },
        ]}
      >
        <LineChart label="Conversão PME por dia, setembro" data={visibility} index="dia" series={[{ key: "conv", label: "Conversão PME", color: "var(--ds-ok)" }]} reference={{ value: 15, label: "Meta 15 %" }} format={(n) => formatPercent(n / 100, 1)} formatAxis={(n) => `${n}%`} height={200} />
      </KpiPair>
    </div>
  );
}
