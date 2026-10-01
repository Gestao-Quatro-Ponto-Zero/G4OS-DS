import { useRef, useState } from "react";
import {
  AnswerCard,
  Disclaimer,
  MessageActions,
  SessionComposer,
  SessionItem,
  SessionStatusChip,
  StepGroup,
  ThreadMinimap,
  ToolsBar,
  UserBubble,
  VoiceModeButton,
  VoiceOverlay,
  type AgentOption,
  type ConnectedTool,
  type MinimapItem,
  type SessionSummary,
} from "@g4os/ds";
import { Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";

export const meta: PageMeta = {
  title: "Sessões agênticas",
  group: "IA e interação",
  order: 30,
  description: "Interface de trabalho com agente no estilo G4 OS / Codex / T3: lista de sessões com status ao vivo, conversa com passos recolhíveis, respostas copiáveis e ramificáveis, ferramentas conectadas à vista e modo voz.",
};

const tools: ConnectedTool[] = [
  { id: "n", name: "Notion", tint: "var(--ds-ink)" },
  { id: "d", name: "Google Drive", tint: "var(--ds-chart-2)" },
  { id: "s", name: "Slack", tint: "var(--ds-chart-4)" },
  { id: "g", name: "GitHub", tint: "var(--ds-ink-soft)" },
  { id: "l", name: "Linear", tint: "var(--ds-chart-5)" },
  { id: "a", name: "Google Agenda", tint: "var(--ds-chart-3)", status: "error" },
];
const agents: AgentOption[] = [
  { id: "os", name: "G4 OS", initials: "OS", tint: "var(--ds-accent)" },
  { id: "pq", name: "Pesquisa", initials: "PQ", tint: "var(--ds-blue)" },
];
const sessions: SessionSummary[] = [
  { id: "1", title: "Field Guide FC — atualização 30/09", time: "2m", status: "working", tags: ["Field Guide FC"] },
  { id: "2", title: "Conectar servidor MCP do Notion", time: "11m", tags: ["MCP"] },
  { id: "3", title: "Atender solicitação de ajuda", time: "1h", status: "ready" },
  { id: "4", title: "Puxar dados da agenda", time: "59m", status: "error" },
  { id: "5", title: "Atualizar o Field Guide do funil", time: "1h", parentId: "1" },
];

export default function Page() {
  const [active, setActive] = useState("2");
  const [draft, setDraft] = useState("");
  const [agent, setAgent] = useState("os");
  const [voice, setVoice] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const mini: MinimapItem[] = Array.from({ length: 8 }, (_, i) => ({ id: `mm-${i}`, role: i % 2 ? "assistant" : "user", preview: i % 2 ? `Resposta ${(i + 1) / 2}: resumo do que o agente fez.` : `Pergunta ${i / 2 + 1} da pessoa` }));
  return (
    <DocPage title={meta.title} kicker="IA e interação" description={meta.description}>
      <DocSection title="Anatomia" rule="Bloco pronto: Blocos › IA › Sessões do G4 OS (src/blocks/ai-sessions.tsx) e a tela inicial (ai-sessions-empty.tsx).">
        <div className="grid gap-3 text-[12.5px] md:grid-cols-[48px_220px_1fr_200px]">
          {[
            ["Trilho", "IconRail: apps do workspace"],
            ["SessionSidebar", "Nova sessão · abas · etiquetas · grupos por data · status ao vivo · workspace"],
            ["Conversa", "SessionHeader · balões da pessoa · StepGroup recolhível · AnswerCard com ações · ThreadMinimap · SessionComposer + ToolsBar · Disclaimer · VoiceModeButton"],
            ["SessionInfoPanel", "Modo · nome · etiquetas · notas · arquivos · navegador do agente"],
          ].map(([t, d]) => (
            <div key={t} className="rounded-xl border border-dashed border-line-strong p-3">
              <div className="font-medium">{t}</div>
              <div className="mt-1 text-muted">{d}</div>
            </div>
          ))}
        </div>
      </DocSection>

      <DocSection title="Lista de sessões" rule="O status é a informação mais importante da lista: a pessoa deixa o agente trabalhando e volta quando estiver pronto. Ativa = fundo tingido + marcador na borda (visível em qualquer tema).">
        <Demo
          className="block"
          code={`<SessionItem session={{ id, title, time: "2m", status: "working", tags: ["Field Guide FC"] }} active onSelect={open} />
<SessionStatusChip status="ready" />   // working · ready · error`}
        >
          <div className="grid gap-6 md:grid-cols-[300px_1fr]">
            <ul className="m-0 flex list-none flex-col gap-0.5 rounded-2xl bg-rail p-3 pl-4">
              {sessions.map((s) => (
                <SessionItem key={s.id} session={s} active={s.id === active} onSelect={setActive} actions={[{ label: "Favoritar" }, { label: "Arquivar" }]} />
              ))}
            </ul>
            <div className="flex flex-wrap content-start gap-2">
              <SessionStatusChip status="working" />
              <SessionStatusChip status="ready" />
              <SessionStatusChip status="error" />
            </div>
          </div>
        </Demo>
        <PropsTable
          rows={[
            ["SessionSidebar.sessions", "SessionSummary[]", "—", "id, title, time, status, tags, starred, archived, parentId, day, scheduled."],
            ["SessionSidebar.itemActions", "(s) => MenuEntry[]", "—", "Menu ⋯ de cada linha (favoritar, arquivar)."],
            ["SessionSidebar.footer", "ReactNode", "—", "WorkspaceSwitcher."],
            ["SessionItem.active", "boolean", "false", "Fundo tingido + marcador na cor de ação."],
          ]}
        />
      </DocSection>

      <DocSection title="Conversa" rule="Passos recolhidos, nunca escondidos. Toda resposta pode ser copiada (texto ou Markdown), refeita, avaliada e ramificada.">
        <Demo
          bare
          code={`<UserBubble>Então na prática funcionaram iguais né?</UserBubble>
<StepGroup title="Reunindo contexto" steps={[{ id, label, durationMs, status: "done" }]} />
<AnswerCard actions={<MessageActions text={plain} markdown={md} onBranch={branch} onRetry={retry} onFeedback={rate} />}>
  <p><strong>Para ler essa página, sim.</strong> A conexão <code>notion</code> …</p>
</AnswerCard>`}
        >
          <div className="space-y-4 rounded-2xl border border-line bg-page p-5">
            <UserBubble>Então na prática funcionaram iguais né?</UserBubble>
            <StepGroup
              title="Reunindo contexto"
              defaultOpen
              steps={[
                { id: "a", label: "Leu a página pela conexão notion", durationMs: 3200, status: "done" },
                { id: "b", label: "Leu a mesma página pela notion-official", durationMs: 3500, status: "done" },
                { id: "c", label: "Comparou textos, toggles e arquivos", status: "running" },
              ]}
              running
            />
            <AnswerCard actions={<MessageActions text="Para ler essa página, sim." markdown="**Para ler essa página, sim.**" onBranch={() => undefined} onRetry={() => undefined} onFeedback={() => undefined} />}>
              <p>
                <strong>Para ler essa página, sim: na prática, funcionaram igual.</strong> A conexão <code>notion</code> identificou o bloco como link para uma planilha; a <code>notion-official</code> mostrou uma página em branco. Registrei na <a href="#">GD-545</a>.
              </p>
            </AnswerCard>
          </div>
        </Demo>
      </DocSection>

      <DocSection title="Minimapa da conversa" rule="Uma marca por mensagem (curta = pessoa, longa = agente). Marcas perto do ponteiro crescem; a atual fica escura; clique rola até a mensagem.">
        <Demo bare code={`<ThreadMinimap items={[{ id: "msg-1", role: "user", preview: "…" }]} scrollRef={scrollerRef} />`}>
          <div className="relative h-56 overflow-hidden rounded-2xl border border-line bg-page">
            <div ref={box} className="h-full overflow-y-auto py-3 pl-14 pr-5">
              {mini.map((m) => (
                <div key={m.id} id={m.id} className={m.role === "user" ? "mb-3 ml-auto w-2/3 rounded-xl bg-ink/[0.05] px-3 py-2 text-[13px]" : "mb-3 rounded-xl border border-line bg-surface px-3 py-6 text-[13px]"}>
                  {m.preview}
                </div>
              ))}
            </div>
            <ThreadMinimap items={mini} scrollRef={box} className="absolute left-4 top-3" />
          </div>
        </Demo>
      </DocSection>

      <DocSection title="Campo, ferramentas e aviso" rule="Quem vai agir e com quais ferramentas fica sempre à vista. Ferramenta com erro aparece no próprio campo, antes de a pessoa pedir algo que depende dela.">
        <Demo bare code={`<SessionComposer value={v} onChange={setV} onSubmit={send} tools={tools} agents={agents} agent={agent} onAgentChange={setAgent} />
<Disclaimer />`}>
          <div className="rounded-2xl border border-line bg-page p-5">
            <SessionComposer value={draft} onChange={setDraft} onSubmit={() => setDraft("")} tools={tools} agents={agents} agent={agent} onAgentChange={setAgent} />
            <Disclaimer className="mt-2" />
          </div>
        </Demo>
        <Demo className="block" code={`<ToolsBar tools={[{ id: "notion", name: "Notion", tint: "var(--ds-ink)" }, …]} onManage={open} />`}>
          <ToolsBar tools={tools} onManage={() => undefined} />
        </Demo>
      </DocSection>

      <DocSection title="Modo voz" rule="Botão redondo no canto; a sobreposição mostra estado (ouvindo / falando), transcrição ao vivo, silenciar e encerrar. A transcrição volta para a sessão.">
        <Demo code={`<VoiceModeButton onClick={() => setVoice(true)} />\n<VoiceOverlay open={voice} transcript={linhas} onClose={(linhas) => salvar(linhas)} />`}>
          <VoiceModeButton onClick={() => setVoice(true)} />
          <span className="text-[13px] text-muted">Clique para abrir o modo voz (Esc fecha).</span>
          <VoiceOverlay open={voice} onClose={() => setVoice(false)} transcript={["Você: Quais reuniões eu tenho hoje?", "G4 OS: Quatro, duas sem pauta."]} />
        </Demo>
      </DocSection>

      <DocSection title="Regras">
        <Rules
          items={[
            { do: "Status na lista: Trabalhando, Resposta pronta, Falhou. A pessoa sai e volta.", dont: "Spinner só dentro da conversa (quem saiu não fica sabendo)." },
            { do: "Passos em grupo recolhível com resumo (“Reunindo contexto · 3 passos”).", dont: "Esconder o que o agente fez ou despejar o log inteiro na conversa." },
            { do: "Copiar, Copiar Markdown, refazer, avaliar e ramificar em toda resposta.", dont: "Resposta sem ações ou que só pode ser copiada selecionando o texto." },
            { do: "Mostrar o agente e as ferramentas conectadas no campo, com erro visível.", dont: "Descobrir que a ferramenta estava desconectada depois de pedir." },
            { do: "Aviso fixo “pode cometer erros” abaixo do campo; links para os registros que o agente alterou.", dont: "Afirmar que fez algo sem apontar onde (issue, canal, documento)." },
            { do: "Ativo com fundo tingido e marcador; campos sem caixa sem halo de foco.", dont: "Ativo = card branco com borda clara sobre fundo branco (some)." },
          ]}
        />
      </DocSection>
    </DocPage>
  );
}
