import { useRef, useState } from "react";
import {
  AnswerCard,
  ArtifactCard,
  Disclaimer,
  RunSummary,
  SessionSidebar,
  SessionStatusGlyph,
  ToolsButton,
  MessageActions,
  ModelPicker,
  PermissionModeChip,
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
  type ModelEffort,
  type ModelOption,
  type PermissionMode,
  type SessionProject,
  type SessionSummary,
} from "@g4ai/ds";
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
  { id: "1", title: "Field Guide FC — atualização 30/09", time: "2m", status: "working", tags: ["Field Guide FC"], projectId: "fg", day: "Hoje" },
  { id: "2", title: "Conectar servidor MCP do Notion", time: "11m", tags: ["MCP"], projectId: "mcp", day: "Hoje" },
  { id: "3", title: "Atender solicitação de ajuda", time: "1h", status: "ready", projectId: "cx", day: "Hoje" },
  { id: "4", title: "Puxar dados da agenda", time: "59m", status: "error", projectId: "cx", day: "Hoje" },
  { id: "5", title: "Atualizar o Field Guide do funil", time: "1h", parentId: "1", projectId: "fg", day: "Ontem" },
];
const projects: SessionProject[] = [
  { id: "fg", name: "Field Guide FC" },
  { id: "mcp", name: "g4-os · MCP" },
  { id: "cx", name: "Atendimento e CX" },
];
const models: ModelOption[] = [
  { id: "sol", name: "Sol", group: "G4 OS", description: "Equilíbrio entre velocidade e cuidado" },
  { id: "sol-max", name: "Sol Max", group: "G4 OS", description: "Tarefas longas e análises profundas" },
  { id: "brisa", name: "Brisa", group: "G4 OS", description: "Respostas rápidas e baratas" },
];

export default function Page() {
  const [active, setActive] = useState("2");
  const [draft, setDraft] = useState("");
  const [agent, setAgent] = useState("os");
  const [voice, setVoice] = useState(false);
  const [permission, setPermission] = useState<PermissionMode>("aprovar");
  const [model, setModel] = useState("sol");
  const [effort, setEffort] = useState<ModelEffort>("padrao");
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

      <DocSection title="Agrupar por projeto" rule="Com projetos, um ícone no cabeçalho da lista (e o menu de filtro) alterna entre agrupar por data e por projeto. Uma linha por sessão; o projeto aparece só como pasta, nunca repetido em cada linha.">
        <Demo
          bare
          code={`<SessionSidebar
  density="clean"
  sessions={sessoes}                 // cada sessão com projectId
  projects={[{ id: "fg", name: "Field Guide FC" }, …]}
  defaultListMode="projects"         // ou listMode + onListModeChange (controlado)
  projectLimit={4}                   // “Mostrar mais N” depois disso
  projectActions={(p) => [{ label: "Nova sessão no projeto", onSelect: () => nova(p.id) }, { label: "Renomear" }, { label: "Arquivar" }]}
  activeId={id}
  onSelect={abrir}
  onNew={nova}
/>`}
        >
          <div className="grid gap-4 md:grid-cols-2">
            {(["projects", "recent"] as const).map((m) => (
              <div key={m} className="h-[360px] overflow-hidden rounded-2xl border border-line">
                <SessionSidebar
                  density="clean"
                  sessions={sessions}
                  projects={projects}
                  defaultListMode={m}
                  projectLimit={4}
                  projectActions={() => [{ label: "Nova sessão no projeto" }, { label: "Renomear" }, { label: "Arquivar" }]}
                  activeId={active}
                  onSelect={setActive}
                  onNew={() => undefined}
                />
              </div>
            ))}
          </div>
        </Demo>
        <PropsTable
          rows={[
            ["projects", "SessionProject[]", "—", "{ id, name, icon? }. Liga o agrupamento por projeto (sessões com projectId)."],
            ["listMode · defaultListMode · onListModeChange", '"recent" | "projects"', '"recent"', "Agrupamento; controlado ou interno."],
            ["projectActions", "(p) => MenuEntry[]", "—", "Menu ⋯ de cada pasta (nova sessão no projeto, renomear, arquivar)."],
            ["projectLimit", "number", "5", "Sessões por pasta antes de “Mostrar mais”."],
            ["headerExtra", "ReactNode", "—", "Controle extra no cabeçalho, antes do filtro."],
            ["ProjectGroup", "componente", "—", "Pasta isolada: project, count, active (abre sozinha), actions, limit, defaultOpen."],
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

      <DocSection
        title="Lista rica × lista clean"
        rule={
          <>
            <code>density="rich"</code> (padrão) mostra chips de status e etiquetas e o botão “Nova sessão”: bom quando a lista é a tela principal e a pessoa triagem por status.{" "}
            <code>density="clean"</code> deixa uma linha por sessão (título · glifo de status · tempo), etiquetas em texto discreto e ações em ícone no cabeçalho: bom quando a conversa e os artefatos são o foco.
          </>
        }
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <Demo bare title="rich" code={`<SessionSidebar sessions={sessoes} activeId={ativa} onSelect={abrir} onNew={nova} />`}>
            <div className="h-[420px] overflow-hidden rounded-2xl border border-line">
              <SessionSidebar sessions={sessions.map((x) => ({ ...x, day: "Hoje" }))} activeId={active} onSelect={setActive} onNew={() => undefined} />
            </div>
          </Demo>
          <Demo bare title="clean" code={`<SessionSidebar density="clean" sessions={sessoes} activeId={ativa} onSelect={abrir} onNew={nova} />`}>
            <div className="h-[420px] overflow-hidden rounded-2xl border border-line">
              <SessionSidebar density="clean" sessions={sessions.map((x) => ({ ...x, day: "Hoje" }))} activeId={active} onSelect={setActive} onNew={() => undefined} />
            </div>
          </Demo>
        </div>
        <Demo code={`<SessionStatusGlyph status="working" />  <SessionStatusGlyph status="ready" />  <SessionStatusGlyph status="error" />  <SessionStatusGlyph scheduled />`}>
          {(
            [
              ["working", "Trabalhando"],
              ["ready", "Resposta pronta"],
              ["error", "Falhou"],
            ] as const
          ).map(([st, l]) => (
            <span key={st} className="inline-flex items-center gap-1.5 text-[12.5px] text-muted">
              <SessionStatusGlyph status={st} /> {l}
            </span>
          ))}
          <span className="inline-flex items-center gap-1.5 text-[12.5px] text-muted">
            <SessionStatusGlyph scheduled /> Rotina agendada
          </span>
        </Demo>
      </DocSection>

      <DocSection
        title="Resposta em cartão × em fluxo"
        rule={
          <>
            <code>AnswerCard variant="card"</code> (padrão): moldura e rodapé de ações — conversas densas, respostas curtas, várias por tela.{" "}
            <code>variant="flow"</code>: sem moldura, coluna de leitura (~68ch), status da execução no topo, artefatos e continuações embaixo e ações que aparecem no hover (sempre no toque). Use quando a resposta produz artefatos ou é longa.
          </>
        }
      >
        <Demo
          bare
          code={`<AnswerCard
  variant="flow"
  run={<RunSummary status="done" durationMs={4600} steps={3} tools={3} tokens={9800} cost="R$ 0,13"><StepList … /></RunSummary>}
  artifacts={<ArtifactCard kind="sheet" title="Comparativo das conexões" meta="6 critérios" onOpen={abrir} />}
  actions={<MessageActions compact text={texto} markdown={md} onRetry={refazer} onBranch={ramificar} onFeedback={avaliar} />}
  suggestions={<button …>Testar escrita nas duas conexões</button>}
>
  <p><strong>Sim, havia uma atualização útil.</strong> Registrei a validação na <a href="#">GD-545</a>…</p>
</AnswerCard>`}
        >
          <div className="space-y-5 rounded-2xl border border-line bg-page p-5">
            <UserBubble>Precisa atualizar algo na issue? Se não, manda no Slack.</UserBubble>
            <StepGroup
              variant="line"
              title="Acompanhar o registro e a comunicação ao time"
              steps={[
                { id: "a", label: "Comentou a validação na GD-545", durationMs: 1600, status: "done" },
                { id: "b", label: "Atualizou a issue #1116", durationMs: 2100, status: "done" },
              ]}
            />
            <AnswerCard
              variant="flow"
              actionsVisible="always"
              run={<RunSummary status="done" durationMs={4600} steps={3} tools={3} tokens={9800} cost="R$ 0,13" />}
              artifacts={<ArtifactCard kind="sheet" title="Comparativo das conexões" meta="6 critérios · 1 divergência" onOpen={() => undefined} />}
              actions={<MessageActions compact text="Sim, havia uma atualização útil." markdown="**Sim, havia uma atualização útil.**" onRetry={() => undefined} onBranch={() => undefined} onFeedback={() => undefined} />}
              suggestions={["Testar escrita nas duas conexões", "Resumir para a DIREX"].map((t) => (
                <button key={t} type="button" className="inline-flex h-7 items-center rounded-full px-3 text-[12px] text-ink-soft ring-1 ring-line hover:bg-soft hover:text-ink">
                  {t}
                </button>
              ))}
            >
              <p>
                <strong>Sim, havia uma atualização útil.</strong> Registrei a validação na <a href="#">GD-545</a> e no <a href="#">GitHub #1116</a>, e enviei o resumo ao canal indicado no Slack.
              </p>
            </AnswerCard>
          </div>
        </Demo>
        <PropsTable
          rows={[
            ["variant", '"card" | "flow"', '"card"', "Moldura com rodapé ou resposta em fluxo."],
            ["run", "ReactNode", "—", "(flow) RunSummary no topo."],
            ["artifacts", "ReactNode", "—", "(flow) ArtifactCards em grade de 2 colunas."],
            ["suggestions", "ReactNode", "—", "(flow) Continuações sugeridas."],
            ["actionsVisible", '"hover" | "always"', '"hover"', "(flow) Use always na última resposta."],
            ["StepGroup.variant", '"group" | "line"', '"group"', "line = linha discreta com chevron, para fluxo."],
            ["MessageActions.compact", "boolean", "false", "Só ícones (fluxo)."],
            ["MessageActions.size", '"md" | "xs"', '"md"', "xs = ícones de 24px (fluxo denso, estilo agente de código); implica compact."],
            ["MessageActions.onShare", "() => void", "—", "Mostra o botão Compartilhar."],
            ["SessionSidebar.density / SessionItem.density", '"rich" | "clean"', '"rich"', "Lista com chips ou uma linha com glifo."],
          ]}
        />
      </DocSection>

      <DocSection title="Permissão e modelo" rule="O nível de permissão fica sempre visível no campo. “Acesso total” é âmbar e só liga depois de confirmar. Agente, modelo e esforço cabem num único chip.">
        <Demo
          code={`<PermissionModeChip value={permissao} onChange={setPermissao} />   // "ler" | "aprovar" | "total"
<ModelPicker models={modelos} value={modelo} onChange={setModelo} effort={esforco} onEffortChange={setEsforco} />
// Chip único do campo: agente + modelo + esforço
<ModelPicker agents={agentes} agent={agente} onAgentChange={setAgente} models={modelos} value={modelo} onChange={setModelo} effort={esforco} onEffortChange={setEsforco} />`}
        >
          <PermissionModeChip value={permission} onChange={setPermission} />
          <ModelPicker models={models} value={model} onChange={setModel} effort={effort} onEffortChange={setEffort} />
          <ModelPicker agents={agents} agent={agent} onAgentChange={setAgent} models={models} value={model} onChange={setModel} effort={effort} onEffortChange={setEffort} />
        </Demo>
        <PropsTable
          rows={[
            ["PermissionModeChip.value · onChange", '"ler" | "aprovar" | "total"', "—", "Somente leitura · Pedir aprovação · Acesso total (âmbar, com confirmação)."],
            ["ModelPicker.models", "ModelOption[]", "—", "{ id, name, group?, description?, icon? }; agrupado por group."],
            ["ModelPicker.value · onChange", "string · (id) => void", "—", "Modelo escolhido."],
            ["ModelPicker.effort · onEffortChange", '"leve" | "padrao" | "profundo"', "—", "Esforço (Leve · Padrão · Profundo) no fim do menu."],
            ["ModelPicker.agents · agent · onAgentChange", "AgentOption[] · string · (id) => void", "—", "Vira o chip único “G4 OS · Padrão” com avatar; o menu ganha a seção Agente."],
          ]}
        />
        <p className="m-0 mt-2 text-[12.5px] text-muted">
          Linha do campo (AgentComposer): <b className="font-medium text-ink-soft">+</b> (anexos e o submenu Ferramentas, com ponto rose se alguma falhou) · permissão … agente/modelo · ditar · enviar. No máximo ~5 controles, nenhum quebra texto; abaixo de 440px os chips viram só ícone. Voz fica no botão redondo fora do campo. Dica “/ para comandos” via <code className="font-mono text-[12px]">hint</code>, só com o campo vazio e largo.
        </p>
      </DocSection>

      <DocSection title="Ferramentas em botão" rule="No campo limpo, as ferramentas viram um botão “N ferramentas” (ponto rose se alguma falhou) que abre a lista com status e Reconectar — ou um submenu “Ferramentas” dentro do +.">
        <Demo code={`<ToolsButton tools={ferramentas} onManage={abrir} onReconnect={(t) => reconectar(t)} />`}>
          <ToolsButton tools={tools} onManage={() => undefined} onReconnect={() => undefined} />
          <span className="text-[12.5px] text-muted">Use dentro do AgentComposer (slot leading).</span>
        </Demo>
      </DocSection>

      <DocSection title="Minimapa da conversa" rule="Uma marca curta por mensagem, centralizada na calha esquerda (fica no meio enquanto a conversa rola). A atual é mais longa e escura; marcas perto do ponteiro crescem; clique rola até a mensagem. Some com menos de 2 mensagens e abaixo de 1024px.">
        <Demo bare code={`<ThreadMinimap items={[{ id: "msg-1", role: "user", preview: "…" }]} scrollRef={scrollerRef} />`}>
          <div className="relative h-56 overflow-hidden rounded-2xl border border-line bg-page">
            <div ref={box} tabIndex={0} role="region" aria-label="Conversa de exemplo" className="h-full overflow-y-auto py-3 pl-16 pr-5 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent/40">
              {mini.map((m) => (
                <div key={m.id} id={m.id} className={m.role === "user" ? "mb-3 ml-auto w-2/3 rounded-xl bg-ink/[0.05] px-3 py-2 text-[13px]" : "mb-3 rounded-xl border border-line bg-surface px-3 py-6 text-[13px]"}>
                  {m.preview}
                </div>
              ))}
            </div>
            <ThreadMinimap items={mini} scrollRef={box} />
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
            { do: "Cartão para conversa densa de respostas curtas; fluxo quando a resposta gera artefatos ou é longa.", dont: "Misturar cartão e fluxo na mesma conversa." },
            { do: "Lista clean quando a conversa e os artefatos são o foco; rica quando a lista é a tela de triagem.", dont: "Etiquetas coloridas e chips em toda linha de uma lista que só serve para trocar de sessão." },
            { do: "Acesso total sempre visível e em âmbar; mudar para ele pede confirmação.", dont: "Esconder a permissão num menu de configurações ou ligar acesso total com um clique." },
            { do: "Agrupar por projeto com pastas recolhíveis e “Mostrar mais”; um ícone no cabeçalho alterna.", dont: "Um segundo seletor “Por data | Por projeto” ocupando uma linha inteira da lista." },
            { do: "Campo com até ~5 controles, chips de um peso só, sem quebrar texto.", dont: "Ferramentas, agentes, modelo, voz e ditado lado a lado disputando a mesma linha." },
          ]}
        />
      </DocSection>
    </DocPage>
  );
}
