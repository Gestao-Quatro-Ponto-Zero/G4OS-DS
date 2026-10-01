import { CalendarDays, FileText, Mail, MessageSquareText, Search, Sparkles } from "lucide-react";
import { useState } from "react";
import { Disclaimer, FileCard, Page, SessionComposer, SessionStatusChip, ToolsBar, VoiceModeButton, notify, type SlashCommand } from "@g4ai/ds";
import { agents, osUser, sessions, tools } from "./data/os-sessions";
import { frameHref, go } from "./shells/frame-route";
import { OsShell, osRoutes } from "./shells/os-shell";

export const meta = {
  title: "Nova sessão do G4 OS",
  description: "Início de uma sessão: saudação, campo com agentes e ferramentas, tarefas sugeridas, sessões em andamento e arquivos recentes. Enviar abre a sessão já trabalhando.",
  category: "IA",
  height: 820,
  order: 2,
  concept: {
    goal: "Primeira tela de uma sessão: ajudar a pessoa a começar rápido, com sugestões do que o agente sabe fazer e o que já está em andamento.",
    patterns: [
      "Estado vazio produtivo: saudação + composer + tarefas sugeridas (nunca uma tela em branco)",
      "Momento de marca possível: a saudação pode usar BrandPanel",
      "Atalhos para retomar: sessões em andamento e arquivos recentes",
      "Ferramentas conectadas com aviso de reconexão quando algo falha",
    ],
    adapt: ["Home de qualquer copiloto (CRM, ATS, ERP): troque as sugestões pelas tarefas mais comuns do time", "Onboarding de agente novo: sugestões viram um tour guiado"],
    avoid: ["Mais de 4 sugestões", "Sugestões genéricas que não usam os dados do cliente"],
  },
} as const;

const suggestions = [
  { icon: CalendarDays, title: "Preparar meu dia", prompt: "Resume minhas reuniões de hoje e marca as que não têm pauta", hint: "Agenda + Notion" },
  { icon: MessageSquareText, title: "Responder o #ajuda", prompt: "Lê as perguntas abertas no #ajuda do Slack e rascunha respostas", hint: "Slack" },
  { icon: Search, title: "Pesquisar um tema", prompt: "Pesquisa como empresas de educação usam agentes de IA em vendas", hint: "Web + Drive" },
  { icon: Mail, title: "Follow-up de reunião", prompt: "Escreve o follow-up da reunião de ontem com a lista de próximos passos", hint: "Agenda + Gmail" },
];

const commands: SlashCommand[] = [
  { id: "resumo", label: "resumo", description: "Resumir um documento ou canal" },
  { id: "slack", label: "slack", description: "Enviar algo num canal" },
];

export default function AiSessionsEmpty() {
  const [draft, setDraft] = useState("");
  const [agent, setAgent] = useState("os");
  const start = (text: string) => go("ai-sessions", { novo: text });
  const hour = 9;
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  const live = sessions.filter((s) => s.status === "working" || s.status === "ready");
  return (
    <OsShell current={osRoutes.home}>
      <Page className="relative">
        <div className="mx-auto flex max-w-[760px] flex-col gap-8 pb-24 pt-6 sm:pt-12">
          <header className="text-center">
            <span className="mx-auto mb-4 grid h-11 w-11 place-items-center rounded-2xl bg-ink/[0.06] text-ink">
              <Sparkles className="h-5 w-5" />
            </span>
            <h1 className="m-0 text-[26px] font-semibold tracking-[-0.03em] sm:text-[30px]" style={{ fontFamily: "var(--ds-font-display)" }}>
              {greeting}, {osUser.first}
            </h1>
            <p className="m-0 mt-2 text-[14px] text-muted">O que o G4 OS pode fazer por você agora?</p>
          </header>

          <div>
            <SessionComposer
              value={draft}
              onChange={setDraft}
              onSubmit={start}
              tools={tools}
              agents={agents}
              agent={agent}
              onAgentChange={setAgent}
              commands={commands}
              onManageTools={() => notify("Exemplo: abriria Ferramentas conectadas", undefined, "info")}
              onContext={() => notify("Exemplo: escolheria uma pasta de contexto", undefined, "info")}
            />
            <Disclaimer className="mt-2" />
          </div>

          <section aria-label="Sugestões">
            <h2 className="m-0 mb-3 text-[12px] font-medium uppercase tracking-[0.08em] text-muted">Comece por aqui</h2>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {suggestions.map((s) => (
                <button
                  key={s.title}
                  type="button"
                  onClick={() => start(s.prompt)}
                  className="group flex items-start gap-3 rounded-2xl border border-line bg-surface p-4 text-left shadow-surface transition-colors hover:border-line-strong hover:bg-soft"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-ink/[0.05] text-ink-soft group-hover:bg-ink/[0.08]">
                    <s.icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[14px] font-medium">{s.title}</span>
                    <span className="mt-0.5 block text-[12.5px] leading-snug text-muted">{s.prompt}</span>
                    <span className="mt-2 inline-block rounded-md bg-ink/[0.05] px-1.5 py-0.5 text-[11px] text-muted">{s.hint}</span>
                  </span>
                </button>
              ))}
            </div>
          </section>

          <div className="grid gap-6 md:grid-cols-2">
            <section aria-label="Em andamento">
              <h2 className="m-0 mb-3 text-[12px] font-medium uppercase tracking-[0.08em] text-muted">Em andamento</h2>
              <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
                {live.map((s) => (
                  <li key={s.id}>
                    <a href={frameHref("ai-sessions", s.id)} className="flex items-center gap-3 rounded-xl border border-line bg-surface px-3.5 py-3 hover:border-line-strong hover:bg-soft">
                      <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium">{s.title}</span>
                      {s.status && <SessionStatusChip status={s.status} />}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
            <section aria-label="Arquivos recentes">
              <h2 className="m-0 mb-3 text-[12px] font-medium uppercase tracking-[0.08em] text-muted">Arquivos recentes</h2>
              <div className="flex flex-col gap-1.5">
                {sessions
                  .flatMap((s) => s.files.map((f) => ({ ...f, session: s })))
                  .slice(0, 3)
                  .map((f) => (
                    <FileCard key={`${f.session.id}-${f.id}`} name={f.name} size={f.size} meta={f.session.title} onOpen={() => go("ai-sessions", f.session.id)} />
                  ))}
              </div>
            </section>
          </div>

          <section aria-label="Ferramentas conectadas" className="rounded-2xl border border-line bg-surface px-4 py-3">
            <ToolsBar tools={tools} max={6} onManage={() => notify("Exemplo: abriria Ferramentas conectadas", undefined, "info")} />
            <p className="m-0 mt-2 flex items-center gap-1.5 text-[12px] text-muted">
              <FileText className="h-3.5 w-3.5" aria-hidden /> O Google Agenda precisa ser reconectado para as rotinas de agenda funcionarem.
            </p>
          </section>
        </div>
        <VoiceModeButton onClick={() => go("ai-sessions", { id: "mcp-notion" })} className="fixed bottom-[96px] right-5 md:bottom-6" label="Conversar por voz (abre a última sessão)" />
      </Page>
    </OsShell>
  );
}
