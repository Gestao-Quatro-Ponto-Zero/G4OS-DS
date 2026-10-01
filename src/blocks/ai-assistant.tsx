import { CalendarClock, Database, FileText, KanbanSquare, Mail, TrendingUp } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  AiBadge,
  AskAILauncher,
  AskAIPanel,
  Badge,
  ChatComposer,
  ChatMessage,
  CitationChip,
  ComposerChip,
  DataTable,
  EntityMark,
  KpiCard,
  KpiGrid,
  Page,
  PageHeading,
  PromptSuggestions,
  SourceList,
  SystemMessage,
  ThinkingIndicator,
  ToolCallsSection,
  formatCurrency,
  type AiSource,
  type Column,
  type PromptSuggestion,
  type ToolCall,
} from "@g4os/ds";
import { deals as crmDeals } from "./data/crm";
import { CrmShell } from "./shells/crm-shell";
import { frameHref, goTo } from "./shells/frame-route";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Assistente sobre a tela",
  description: "Painel Ask AI ao lado de uma tela de CRM: sugestões, resposta com ferramentas usadas e fontes citadas, streaming e parar. A tela continua usável.",
  category: "IA",
  order: 1,
  height: 860,
  concept: {
    goal: "Pedir ajuda à IA sobre a tela que já está aberta (aqui, o CRM) sem perder o contexto nem a tela.",
    patterns: [
      "Painel lateral de IA ao lado da tela: a tela continua usável",
      "Respostas com ferramentas usadas e fontes citadas",
      "Streaming com Parar; sugestões de pergunta no início",
      "No celular o painel abre fechado e ocupa a tela quando aberto",
    ],
    adapt: [
      "Qualquer tela de lista ou registro (ERP, ATS, financeiro): troque as sugestões pelo contexto da tela",
    ],
    avoid: [
      "Modal de IA que cobre a tela que a pessoa quer analisar",
    ],
  },
} as const;

/* ------------------------------------------------------------------ */
/* Dados de exemplo                                                    */
/* ------------------------------------------------------------------ */

type Deal = { id: string; company: string; tint: string; title: string; stage: string; value: number; owner: string; days: number };
const deals: Deal[] = [
  { id: "1", company: "Grupo Aurora Alimentos", tint: "#842e20", title: "Licenças anuais · 240 usuários", stage: "Negociação", value: 460800, owner: "Ana Lopes", days: 18 },
  { id: "2", company: "Vértice Logística", tint: "#184560", title: "Expansão para 3 CDs", stage: "Proposta", value: 128000, owner: "Bruno Takeda", days: 21 },
  { id: "3", company: "Agro Cerrado", tint: "#5f7f6f", title: "Implantação completa", stage: "Proposta", value: 312000, owner: "Carla Nogueira", days: 45 },
  { id: "4", company: "Hospital São Lucas", tint: "#202124", title: "Contrato 24 meses", stage: "Negociação", value: 540000, owner: "Ana Lopes", days: 28 },
  { id: "5", company: "Rede Horizonte Educação", tint: "#8c6a3a", title: "Plano Pro · renovação", stage: "Fechamento", value: 104160, owner: "Ana Lopes", days: 34 },
  { id: "6", company: "Farmácias Vida Plena", tint: "#3f3f46", title: "Integração com ERP", stage: "Diagnóstico", value: 54600, owner: "Bruno Takeda", days: 6 },
];

const suggestions: PromptSuggestion[] = [
  { id: "1", label: "Quais negócios estão parados?", description: "Mais de 30 dias na mesma etapa", icon: <CalendarClock /> },
  { id: "2", label: "Previsão do mês", description: "Receita ponderada por etapa", icon: <TrendingUp /> },
  { id: "3", label: "Rascunhar follow-ups", description: "Para os 3 maiores negócios", icon: <Mail /> },
  { id: "4", label: "Resumir o Grupo Aurora", description: "Histórico, riscos, próximo passo", icon: <FileText /> },
];

const sources: AiSource[] = [
  { id: "s1", kind: "record", title: "Agro Cerrado · Implantação completa", domain: "CRM" },
  { id: "s2", kind: "record", title: "Rede Horizonte · Plano Pro", domain: "CRM" },
  { id: "s3", kind: "data", title: "Regra de estagnação do pipeline", domain: "Configurações" },
];

const calls: ToolCall[] = [
  { id: "c1", name: "crm.listar_negocios", label: "Listou negócios abertos", icon: <Database />, status: "success", durationMs: 380, input: { status: "aberto", responsavel: "todos" }, output: { total: 12 } },
  { id: "c2", name: "crm.historico_etapas", label: "Leu o histórico de etapas", icon: <KanbanSquare />, status: "success", durationMs: 910, input: { negocios: 12 }, output: { parados_30d: 2 } },
];

const firstAnswer = (
  <>
    <p>
      Dois negócios estão parados há mais de 30 dias <CitationChip index={3} source={sources[2]} />:
    </p>
    <ul>
      <li>
        <strong>Agro Cerrado</strong> · Proposta há 45 dias, R$ 312 mil. Sem resposta desde o envio <CitationChip index={1} source={sources[0]} />.
      </li>
      <li>
        <strong>Rede Horizonte</strong> · Fechamento há 34 dias, R$ 104 mil. Aguardando assinatura <CitationChip index={2} source={sources[1]} />.
      </li>
    </ul>
    <p>Sugiro uma ligação para a Agro Cerrado hoje e um lembrete de assinatura para a Rede Horizonte.</p>
  </>
);

const reply =
  "Previsão ponderada de outubro: R$ 1,22 mi. Negociação responde por 62 % do valor (Aurora e São Lucas). Se o Hospital São Lucas escorregar para novembro, a previsão cai para R$ 815 mil.";

/* ------------------------------------------------------------------ */

type Msg = { id: string; role: "user" | "assistant"; content: ReactNode; rich?: boolean; streaming?: boolean; time: string };

export default function AiAssistant() {
  // Aberto no desktop; no celular começa fechado (o painel ocuparia a tela toda).
  const [open, setOpen] = useState(() => typeof window === "undefined" || window.matchMedia("(min-width: 1024px)").matches);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    { id: "u1", role: "user", content: "Quais negócios estão parados?", time: "09:41" },
    { id: "a1", role: "assistant", content: firstAnswer, rich: true, time: "09:41" },
  ]);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearInterval(timer.current), []);

  const ask = (q: string) => {
    const id = String(Date.now());
    setMsgs((m) => [...m, { id: `u${id}`, role: "user", content: q, time: "agora" }, { id: `a${id}`, role: "assistant", content: "", streaming: true, time: "agora" }]);
    setValue("");
    setBusy(true);
    let n = 0;
    window.clearInterval(timer.current);
    timer.current = window.setInterval(() => {
      n += 4;
      const done = n >= reply.length;
      setMsgs((m) => m.map((x) => (x.id === `a${id}` ? { ...x, content: reply.slice(0, n), streaming: !done } : x)));
      if (done) {
        window.clearInterval(timer.current);
        setBusy(false);
      }
    }, 28);
  };
  const stop = () => {
    window.clearInterval(timer.current);
    setBusy(false);
    setMsgs((m) => m.map((x) => (x.streaming ? { ...x, streaming: false } : x)));
  };

  const columns: Column<Deal>[] = [
    {
      key: "company",
      header: "Negócio",
      primary: true,
      cell: (d) => (
        <span className="flex min-w-0 items-center gap-2.5">
          <EntityMark name={d.company} tint={d.tint} className="h-7 w-7 text-[11px]" />
          <span className="min-w-0">
            <span className="block truncate font-medium">{d.company}</span>
            <span className="block truncate text-[12px] font-normal text-muted">{d.title}</span>
          </span>
        </span>
      ),
    },
    { key: "stage", header: "Etapa", cell: (d) => <Badge>{d.stage}</Badge> },
    { key: "days", header: "Na etapa", nowrap: true, cell: (d) => <span className={d.days > 30 ? "font-medium text-amber" : "text-muted"}>{d.days} dias</span> },
    { key: "value", header: "Valor", align: "right", nowrap: true, cell: (d) => <span className="tabular-nums">{formatCurrency(d.value, { cents: false })}</span> },
  ];

  const panel = (
    <AskAIPanel
      title="Assistente de vendas"
      context={
        <span className="inline-flex items-center gap-1">
          <KanbanSquare className="h-3 w-3" /> Pipeline · 12 negócios abertos
        </span>
      }
      onClose={() => setOpen(false)}
      empty={
        <div>
          <p className="m-0 text-[15px] font-semibold">Como posso ajudar?</p>
          <p className="m-0 mb-4 mt-1 text-[12.5px] text-muted">Eu vejo o pipeline, os contatos e o histórico de cada negócio.</p>
          <PromptSuggestions items={suggestions} columns={1} onSelect={(s) => ask(s.label)} />
        </div>
      }
      composer={
        <ChatComposer
          value={value}
          onChange={setValue}
          onSubmit={ask}
          busy={busy}
          onStop={stop}
          placeholder="Pergunte sobre o pipeline…"
          chips={<ComposerChip icon={<Database />}>CRM</ComposerChip>}
          hint={null}
        />
      }
    >
      {msgs.length > 0 && <SystemMessage tone="info">Contexto: pipeline de vendas (Sudeste). Eu só leio; nada é alterado sem sua confirmação.</SystemMessage>}
      {msgs.map((m) =>
        m.role === "user" ? (
          <ChatMessage key={m.id} role="user" content={m.content} time={m.time} />
        ) : (
          <ChatMessage
            key={m.id}
            role="assistant"
            time={m.time}
            streaming={m.streaming}
            content={m.content === "" ? <ThinkingIndicator label="Consultando o CRM" /> : typeof m.content === "string" ? <p>{m.content}</p> : m.content}
            copyText={typeof m.content === "string" ? m.content : "Dois negócios estão parados há mais de 30 dias: Agro Cerrado e Rede Horizonte."}
            onRetry={() => ask("Gere de novo a última resposta")}
            onFeedback={() => undefined}
          >
            {m.rich && (
              <>
                <ToolCallsSection calls={calls} />
                <SourceList sources={sources} compact />
              </>
            )}
          </ChatMessage>
        ),
      )}
    </AskAIPanel>
  );

  return (
    <CrmShell current={frameHref("crm-pipeline")}>
      <div className="flex min-h-0 flex-1">
        <Page className="min-w-0 flex-1">
          <PageHeading
            title="Pipeline"
            description="Negócios abertos do time Sudeste."
            actions={!open && <AskAILauncher onClick={() => setOpen(true)} label="Perguntar à IA" className="h-10 shadow-none" />}
          />
          <div className="mt-6 space-y-6">
            <KpiGrid cols={3}>
              <KpiCard label="Em aberto" value={formatCurrency(1935260, { compact: true })} delta={0.084} period="vs. setembro" />
              <KpiCard
                label="Previsão ponderada"
                value={formatCurrency(1216684, { compact: true })}
                hint={
                  <span className="inline-flex items-center gap-1.5">
                    <AiBadge label="Estimativa IA" /> 62 % em Negociação
                  </span>
                }
              />
              <KpiCard label="Parados há +30 dias" value="2" delta={1} goodWhen="down" period="vs. semana passada" />
            </KpiGrid>
            <DataTable
              rows={deals}
              columns={columns}
              rowKey={(d) => d.id}
              // Mesmo negócio do CRM (dados compartilhados): abre a página do negócio.
              onRowClick={(d) => goTo(frameHref("crm-deal", { id: crmDeals.find((x) => x.title === d.title)?.id }))}
              rowLabel={(d) => `Abrir ${d.company} · ${d.title}`}
            />
          </div>
        </Page>
        {open && (
          <aside className="fixed inset-0 z-50 flex flex-col bg-surface lg:static lg:z-auto lg:w-[400px] lg:shrink-0 lg:border-l lg:border-line">
            {panel}
          </aside>
        )}
      </div>
    </CrmShell>
  );
}
