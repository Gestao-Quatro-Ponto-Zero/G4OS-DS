import { BarChart3, Database, FileSpreadsheet, FileText, Mail, Menu, MessageSquarePlus, Search, Sparkles, Users, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  AiMark,
  Button,
  ChatComposer,
  ChatMessage,
  ChatThread,
  CitationChip,
  ComposerChip,
  LimitDialog,
  PromptSuggestions,
  RateLimitNotice,
  SourceList,
  SystemMessage,
  ThinkingIndicator,
  TokenUsageMeter,
  ToolCallsSection,
  cn,
  normalize,
  type AiSource,
  type ComposerAttachment,
  type PromptSuggestion,
  type ToolCall,
} from "@g4ai/ds";
import { me } from "./data/workspace";
import { AssistantShell, assistantRoutes } from "./shells/assistant-shell";
import { goTo, setFrameQuery, useFrameQuery } from "./shells/frame-route";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Chat com histórico",
  description: "Conversa em página inteira: histórico por data com busca, estado vazio com sugestões, respostas com ferramentas e fontes, avisos do sistema e limite de uso com contagem.",
  category: "IA",
  order: 3,
  height: 860,
  concept: {
    goal: "Conversar com o assistente em página inteira, com histórico pesquisável, para quem usa a IA como ferramenta de trabalho diária.",
    patterns: [
      "Anatomia G · App de altura total: histórico à esquerda, thread rola, composer fixo",
      "Histórico agrupado por data com busca",
      "Estado vazio com sugestões; avisos do sistema e limite de uso com contagem",
      "Respostas com ferramentas e fontes",
    ],
    adapt: [
      "Suporte interno, base de conhecimento, copiloto de vendas",
    ],
    avoid: [
      "Rolar a página inteira junto com a conversa (perde o composer)",
    ],
  },
} as const;

/* ------------------------------------------------------------------ */
/* Dados de exemplo                                                    */
/* ------------------------------------------------------------------ */

const history = [
  { id: "h1", title: "Receita por segmento no Q3", group: "Hoje" },
  { id: "h2", title: "Follow-up Grupo Aurora", group: "Hoje" },
  { id: "h3", title: "Candidatos para SDR Sênior", group: "Ontem" },
  { id: "h4", title: "Conciliação de setembro", group: "Ontem" },
  { id: "h5", title: "Resumo da reunião de diretoria", group: "Últimos 7 dias" },
  { id: "h6", title: "Estoque abaixo do mínimo", group: "Últimos 7 dias" },
  { id: "h7", title: "Política de reembolso", group: "Últimos 30 dias" },
  { id: "h8", title: "Comparar planos de saúde", group: "Últimos 30 dias" },
];

const suggestions: PromptSuggestion[] = [
  { id: "1", label: "Como fechamos o trimestre?", description: "Receita, margem e caixa", icon: <BarChart3 /> },
  { id: "2", label: "Quem está atrasado nas metas?", description: "Vendedores abaixo do ritmo", icon: <Users /> },
  { id: "3", label: "Resumir a planilha anexada", description: "Tabelas e conclusões", icon: <FileSpreadsheet /> },
  { id: "4", label: "Escrever um e-mail difícil", description: "Cobrança com cuidado", icon: <Mail /> },
];

const sources: AiSource[] = [
  { id: "s1", kind: "data", title: "DRE · 3º trimestre 2026", domain: "Financeiro", snippet: "Receita líquida R$ 12,4 mi; margem bruta 51 %." },
  { id: "s2", kind: "record", title: "Metas comerciais Q3", domain: "CRM", snippet: "Enterprise 104 %, Mid-market 92 %, PME 71 %." },
  { id: "s3", kind: "doc", title: "Ata da diretoria · 25/09", domain: "Arquivos" },
];

const calls: ToolCall[] = [
  { id: "c1", name: "financeiro.dre", label: "Consultou o DRE do trimestre", icon: <Database />, status: "success", durationMs: 640, input: { periodo: "2026-Q3" }, output: { receita_liquida: 12400000, margem_bruta: 0.51 } },
  { id: "c2", name: "crm.metas", label: "Leu as metas por segmento", icon: <BarChart3 />, status: "success", durationMs: 380, input: { trimestre: "Q3" }, output: { enterprise: 1.04, mid: 0.92, pme: 0.71 } },
  { id: "c3", name: "arquivos.buscar", label: "Buscou a ata da diretoria", icon: <FileText />, status: "success", durationMs: 820, input: { q: "ata diretoria setembro" }, output: { encontrados: 1 } },
];

const answer = (
  <>
    <p>
      O trimestre fechou com <strong>receita líquida de R$ 12,4 mi</strong> e margem bruta de 51 % <CitationChip index={1} source={sources[0]} />.
    </p>
    <ul>
      <li>Enterprise bateu a meta (104 %); PME ficou em 71 % <CitationChip index={2} source={sources[1]} />.</li>
      <li>A diretoria decidiu realocar dois vendedores de PME para Mid-market em outubro <CitationChip index={3} source={sources[2]} />.</li>
    </ul>
    <p>Quer que eu monte o painel do Q4 com essas metas?</p>
  </>
);

/* ------------------------------------------------------------------ */

type Msg = { id: string; role: "user" | "assistant" | "system" | "limit"; text?: string; rich?: boolean; streaming?: boolean };

export default function AiChat() {
  // Conversa aberta na URL (?id=h3): o histórico e links de outras telas abrem direto nela.
  const query = useFrameQuery();
  const active = query.get("id") ?? "h1";
  const setActive = (id: string) => setFrameQuery({ id });
  const [nav, setNav] = useState(false);
  const [q, setQ] = useState("");
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [limit, setLimit] = useState(false);
  const [count, setCount] = useState(0);
  const [files, setFiles] = useState<ComposerAttachment[]>([]);
  const [msgs, setMsgs] = useState<Msg[]>([
    { id: "1", role: "user", text: "Como fechamos o trimestre?" },
    { id: "2", role: "assistant", rich: true },
    { id: "3", role: "system", text: "O painel de metas foi atualizado há 5 minutos. As próximas respostas usam os números novos." },
  ]);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const conv = history.find((h) => h.id === active);
  const filtered = history.filter((h) => !q || normalize(h.title).includes(normalize(q)));
  const groups = [...new Set(filtered.map((h) => h.group))];

  const send = (text: string) => {
    const id = String(Date.now());
    setValue("");
    if (count >= 1) {
      // Simula o limite de uso na 2ª pergunta seguida.
      setMsgs((m) => [...m, { id: `u${id}`, role: "user", text }, { id: `l${id}`, role: "limit" }]);
      setLimit(true);
      return;
    }
    setCount((c) => c + 1);
    setBusy(true);
    setMsgs((m) => [...m, { id: `u${id}`, role: "user", text }, { id: `a${id}`, role: "assistant", streaming: true }]);
    timer.current = window.setTimeout(() => {
      setBusy(false);
      setMsgs((m) => m.map((x) => (x.id === `a${id}` ? { ...x, streaming: false, text: "Pronto: montei o painel do Q4 com as metas por segmento e compartilhei com a diretoria. Quer revisar antes de publicar?" } : x)));
    }, 2200);
  };
  const newChat = () => {
    setActive("novo");
    setMsgs([]);
    setNav(false);
  };

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-3 pb-3 pt-4">
        <span className="min-w-0 flex-1 truncate text-[13px] font-semibold tracking-tight">Conversas</span>
        <button type="button" onClick={() => setNav(false)} aria-label="Fechar histórico" className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-soft lg:hidden">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="space-y-2 px-3">
        <Button className="w-full" onClick={newChat}>
          <MessageSquarePlus /> Nova conversa
        </Button>
        <label className="focus-field flex h-9 items-center gap-2 rounded-lg border border-line bg-surface px-2.5">
          <Search className="h-3.5 w-3.5 text-muted" aria-hidden />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar conversas" aria-label="Buscar conversas" className="h-full min-w-0 flex-1 bg-transparent text-[12.5px] outline-none placeholder:text-muted" />
        </label>
      </div>
      <nav aria-label="Histórico" className="mt-3 min-h-0 flex-1 overflow-y-auto px-2 pb-4">
        {groups.map((g) => (
          <div key={g} className="mt-3 first:mt-0">
            <p className="m-0 px-2 pb-1 text-[10.5px] font-medium uppercase tracking-[0.1em] text-muted">{g}</p>
            <ul className="list-none space-y-px p-0">
              {filtered
                .filter((h) => h.group === g)
                .map((h) => (
                  <li key={h.id}>
                    <button
                      type="button"
                      aria-current={active === h.id ? "page" : undefined}
                      onClick={() => {
                        setActive(h.id);
                        setNav(false);
                      }}
                      className={cn("block w-full truncate rounded-lg px-2 py-1.5 text-left text-[13px]", active === h.id ? "bg-surface font-medium text-ink shadow-surface ring-1 ring-line" : "text-ink-soft hover:bg-soft hover:text-ink")}
                    >
                      {h.title}
                    </button>
                  </li>
                ))}
            </ul>
          </div>
        ))}
        {!filtered.length && <p className="px-2 py-6 text-center text-[12.5px] text-muted">Nenhuma conversa com “{q}”.</p>}
      </nav>
      <div className="border-t border-line px-3 py-3">
        <TokenUsageMeter used={9120} limit={10000} label="Créditos do mês" unit="" resetsIn="em 1º de outubro" />
      </div>
    </div>
  );

  return (
    <AssistantShell current={assistantRoutes.chat} collapsed>
    <div className="flex min-h-0 flex-1 overflow-hidden bg-page text-ink">
      <aside className={cn("z-40 w-[264px] shrink-0 border-r border-line bg-rail", nav ? "fixed inset-y-0 left-0 block" : "hidden lg:block")}>{sidebar}</aside>
      {nav && <button type="button" aria-label="Fechar histórico" onClick={() => setNav(false)} className="fixed inset-0 z-30 bg-[var(--ds-backdrop)] lg:hidden" />}
      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-line px-3 sm:px-5">
          <button type="button" onClick={() => setNav(true)} aria-label="Abrir histórico" className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-soft lg:hidden">
            <Menu className="h-4 w-4" />
          </button>
          <h1 className="m-0 min-w-0 flex-1 truncate text-[14px] font-semibold">{active === "novo" ? "Nova conversa" : conv?.title}</h1>
          <span className="hidden text-[12px] text-muted sm:inline">Vê: Financeiro, CRM, Arquivos</span>
        </header>

        {msgs.length === 0 ? (
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="mx-auto flex min-h-full max-w-[680px] flex-col justify-center px-5 py-10">
              <AiMark size={40} />
              <h2 className="m-0 mt-5 text-[26px] font-semibold tracking-[-0.03em]">Bom dia, {me.name.split(" ")[0]}. O que vamos resolver?</h2>
              <p className="m-0 mb-6 mt-2 text-[14px] text-muted">Pergunte sobre números, pessoas e documentos da Acme. Eu mostro de onde veio cada resposta.</p>
              <PromptSuggestions items={suggestions} onSelect={(s) => send(s.label)} />
            </div>
          </div>
        ) : (
          <ChatThread follow={msgs} className="px-4 py-6 sm:px-6">
            <div className="mx-auto max-w-[720px] space-y-6">
              {msgs.map((m) => {
                if (m.role === "user") return <ChatMessage key={m.id} role="user" content={m.text} />;
                if (m.role === "system") return <SystemMessage key={m.id} tone="info">{m.text}</SystemMessage>;
                if (m.role === "limit")
                  return (
                    <RateLimitNotice
                      key={m.id}
                      retryIn={48}
                      onRetry={() => setMsgs((x) => x.filter((y) => y.id !== m.id))}
                      action={
                        <Button size="sm" variant="ghost" onClick={() => setLimit(true)}>
                          Detalhes
                        </Button>
                      }
                    />
                  );
                return (
                  <ChatMessage
                    key={m.id}
                    role="assistant"
                    streaming={m.streaming}
                    content={m.streaming ? <ThinkingIndicator label="Consultando painéis" startedAt={Date.now()} /> : m.rich ? answer : <p>{m.text}</p>}
                    copyText={m.text ?? "O trimestre fechou com receita líquida de R$ 12,4 mi e margem bruta de 51 %."}
                    onRetry={() => send("Gere de novo")}
                    onFeedback={() => undefined}
                  >
                    {m.rich && (
                      <>
                        <ToolCallsSection calls={calls} />
                        <SourceList sources={sources} />
                      </>
                    )}
                  </ChatMessage>
                );
              })}
            </div>
          </ChatThread>
        )}

        <div className="shrink-0 px-4 pb-4 sm:px-6">
          <ChatComposer
            className="mx-auto max-w-[720px]"
            value={value}
            onChange={setValue}
            onSubmit={send}
            busy={busy}
            onStop={() => {
              window.clearTimeout(timer.current);
              setBusy(false);
              setMsgs((m) => m.map((x) => (x.streaming ? { ...x, streaming: false, text: "Resposta interrompida." } : x)));
            }}
            attachments={files}
            onRemoveAttachment={(id) => setFiles((f) => f.filter((x) => x.id !== id))}
            onAttach={() => setFiles((f) => (f.length ? f : [{ id: "a1", name: "metas-q4.xlsx", size: "48 KB" }]))}
            chips={
              <>
                <ComposerChip icon={<Sparkles />} onClick={() => goTo(assistantRoutes.models)}>
                  G4 Pro
                </ComposerChip>
                <ComposerChip icon={<Database />} onClick={() => goTo(assistantRoutes.models)}>3 fontes</ComposerChip>
              </>
            }
            hint="A IA pode errar. Confira números importantes nas fontes."
          />
        </div>
      </main>
      <LimitDialog open={limit} onClose={() => setLimit(false)} retryIn={48} usage={{ used: 60, limit: 60, unit: "perguntas por hora" }} onUpgrade={() => goTo(assistantRoutes.usage)} />
    </div>
    </AssistantShell>
  );
}
