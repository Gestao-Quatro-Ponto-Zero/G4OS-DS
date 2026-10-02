import { ChevronRight, FileText, MessageSquare, FolderOpen, Globe, ListChecks, LogIn, Sparkles, Wand2, Wrench } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  AddPropertyMenu,
  AgentComposer,
  AgentHeader,
  AgentInstructions,
  AgentMessage,
  BuilderSection,
  ChipPicker,
  PropertyRow,
  Button,
  Modal,
  PublishBar,
  ResizableSplit,
  TextField,
  RunSummary,
  ToolGlyph,
  TriggerList,
  notify,
  type AgentStatus,
  type MenuEntry,
  type RunStatus,
} from "@g4ai/ds";
import { AgentShell, agentRoutes } from "./shells/agent-shell";
import { agentById, templateById, type FleetAgent } from "./data/agents";
import { go, useFrameParams } from "./shells/frame-route";
import {
  agent,
  apps,
  chatIntro,
  enhancedInstructions,
  initialChecks,
  initialInputs,
  initialInstructions,
  initialOutputs,
  initialTools,
  initialTriggers,
  outputOptions,
  toolOptions,
  triggerOptions,
  type Prop,
  type Trigger,
} from "./data/agent-builder";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Construtor de agentes",
  description: "Conversa com o agente à esquerda e a ficha dele à direita: gatilhos, propriedades (ferramentas, entrada, saída, verificações), instruções em editor rico com “Melhorar”, testar e publicar. Abre qualquer agente da frota (?id=), uma cópia (?de=), um modelo (?modelo=) ou um pedido (?pedido=).",
  category: "IA",
  order: 6,
  height: 900,
  concept: {
    goal: "Definir o que um agente faz sem sair da conversa com ele: quem configura automações monta gatilhos, ferramentas e instruções e testa na hora.",
    patterns: [
      "Anatomia G · App de altura total: conversa à esquerda, ficha à direita (ResizableSplit)",
      "Ficha em seções: Gatilhos → Propriedades → Instruções, cada uma com '+ Adicionar'",
      "Uma ação primária no topo: Publicar (estado rascunho/publicado/alterado)",
      "Testar roda dentro da conversa com RunSummary, sem trocar de tela",
      "Instruções em editor rico com 'Melhorar com IA'",
    ],
    adapt: [
      "Construtor de automações, regras de CRM, playbooks de atendimento: troque os tipos de gatilho e propriedade",
      "No celular, alterne Ficha/Conversa em vez de dividir a tela",
    ],
    avoid: [
      "Publicar sem estado visível (rascunho × publicado)",
      "Instruções em textarea sem estrutura para agentes complexos",
    ],
  },
} as const;

type Msg = { id: string; role: "user"; text: string } | { id: string; role: "agent"; text: string[]; status: RunStatus; startedAt: number; durationMs: number };

const glyph = (p: Prop | Trigger) => ("app" in p && p.app ? <ToolGlyph name={apps[p.app].name} color={apps[p.app].color} /> : <FileText className="h-3.5 w-3.5 text-muted" />);

type Seed = {
  name: string;
  description: string;
  status: AgentStatus;
  triggers: Trigger[];
  tools: Prop[];
  inputs: Prop[];
  outputs: Prop[];
  checks: Prop[];
  instructions: string;
  intro: { user: string; answer: string[] };
  /** Agente da frota aberto (para "Ver execuções" e a trilha). */
  fleetId?: string;
};

const instructionsOf = (a: FleetAgent) =>
  `<h2>Objetivo</h2><p>${a.purpose}</p><h2>Passos</h2><ol>${a.flow.map((f) => `<li>${f.title}${f.approval ? " <strong>(pede aprovação humana)</strong>" : ""}</li>`).join("")}</ol>`;
const fromFleet = (a: FleetAgent): Pick<Seed, "triggers" | "tools" | "inputs" | "outputs" | "checks" | "instructions"> => ({
  triggers: a.builder.triggers.map((t, i) => ({ id: `t${i}`, app: t.app, text: t.text })),
  tools: a.builder.tools.map((id) => ({ id, app: id, label: apps[id].name })),
  inputs: [{ id: "gatilho", label: "Dados do gatilho" }],
  outputs: a.flow.filter((f) => f.kind === "output").map((f) => ({ id: f.id, label: f.title })),
  checks: a.flow.filter((f) => f.approval).map((f) => ({ id: `chk-${f.id}`, label: `Aprovação humana: ${f.title.toLowerCase()}` })),
  instructions: instructionsOf(a),
});
const blank = { inputs: [] as Prop[], outputs: [] as Prop[], checks: [] as Prop[] };

/** Decide o que o construtor abre a partir da URL. */
function seedFrom(params: URLSearchParams): Seed {
  const fleet = agentById(params.get("id"));
  const copy = agentById(params.get("de"));
  const tpl = templateById(params.get("modelo"));
  const pedido = params.get("pedido");
  if (fleet && !pedido)
    return {
      name: fleet.name,
      description: fleet.purpose,
      status: fleet.version ? "publicado" : "rascunho",
      ...fromFleet(fleet),
      intro: { user: `Abra o ${fleet.name} para eu revisar.`, answer: [`Este é o ${fleet.name}, versão ${fleet.version ?? "em rascunho"}. ${fleet.purpose}`, "Qualquer mudança aqui vira uma versão nova em canário (10 % dos gatilhos) depois de passar nas avaliações. O que você quer ajustar?"] },
      fleetId: fleet.id,
    };
  if (fleet && pedido)
    return {
      name: fleet.name,
      description: fleet.purpose,
      status: "alterado",
      ...fromFleet(fleet),
      intro: { user: pedido, answer: [`Entendi o pedido para o ${fleet.name}. Preparei a mudança nas instruções; confira a seção Instruções e rode um teste antes de publicar.`] },
      fleetId: fleet.id,
    };
  if (copy)
    return {
      name: `Cópia de ${copy.name}`,
      description: copy.purpose,
      status: "rascunho",
      ...fromFleet(copy),
      intro: { user: `Duplique o ${copy.name}.`, answer: ["Cópia criada como rascunho, com os mesmos gatilhos, ferramentas e instruções. Os gatilhos só ligam quando você publicar."] },
    };
  if (tpl) {
    const base = agentById(tpl.basedOn);
    return {
      name: tpl.name,
      description: tpl.description,
      status: "rascunho",
      ...(base ? fromFleet(base) : { ...blank, triggers: initialTriggers, tools: tpl.apps.map((id) => ({ id, app: id, label: apps[id].name })), instructions: `<h2>Objetivo</h2><p>${tpl.description}</p>` }),
      intro: { user: `Quero usar o modelo “${tpl.name}”.`, answer: [`Montei o rascunho a partir do modelo “${tpl.name}” (${tpl.author}). Conecte as ferramentas marcadas, ajuste as instruções ao jeito da Acme e rode um teste com um caso real.`] },
    };
  }
  if (pedido || params.get("novo"))
    return {
      name: "Novo agente",
      description: pedido ?? "Descreva o que o agente faz em uma frase.",
      status: "rascunho",
      triggers: [],
      tools: [],
      ...blank,
      instructions: pedido ? `<h2>Objetivo</h2><p>${pedido.replace(/</g, "&lt;")}</p>` : "",
      intro: pedido
        ? { user: pedido, answer: ["Comecei o rascunho com esse objetivo. Para rodar sozinho ele precisa de um gatilho: quando isso deve acontecer?", "Sugestão: adicione as ferramentas que ele vai usar em Propriedades e eu escrevo os passos nas instruções."] }
        : { user: "Quero criar um agente novo.", answer: ["Vamos lá. Conte o que ele deve fazer, quando e com quais ferramentas. Eu monto a ficha ao lado."] },
    };
  return { name: agent.name, description: agent.description, status: agent.status, triggers: initialTriggers, tools: initialTools, inputs: initialInputs, outputs: initialOutputs, checks: initialChecks, instructions: initialInstructions, intro: chatIntro };
}

function useMobile() {
  const [m, setM] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767.98px)");
    const on = () => setM(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return m;
}

export default function AgentBuilder() {
  const params = useFrameParams();
  const key = ["id", "de", "modelo", "pedido", "novo"].map((k) => params.get(k) ?? "").join("|");
  return <Builder key={key} seed={seedFrom(params)} focus={params.get("secao")} />;
}

function Builder({ seed, focus }: { seed: Seed; focus: string | null }) {
  const mobile = useMobile();
  // Celular: uma tela por vez — a ficha do agente (padrão) ou a conversa.
  const [pane, setPane] = useState<"ficha" | "conversa">("ficha");
  const [name, setName] = useState(seed.name);
  const [description, setDescription] = useState(seed.description);
  const [status, setStatus] = useState<AgentStatus>(seed.status);
  const [triggers, setTriggers] = useState(seed.triggers);
  const [tools, setTools] = useState(seed.tools);
  const [editingTrigger, setEditingTrigger] = useState<Trigger | null>(null);
  const [triggerText, setTriggerText] = useState("");
  const [outputs, setOutputs] = useState(seed.outputs);
  const [inputs, setInputs] = useState(seed.inputs);
  const [checks, setChecks] = useState(seed.checks);
  const [instructions, setInstructions] = useState(seed.instructions);
  const [enhancing, setEnhancing] = useState(false);
  const [testing, setTesting] = useState(false);
  const [draft, setDraft] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([
    { id: "u0", role: "user", text: seed.intro.user },
    { id: "a0", role: "agent", text: seed.intro.answer, status: "done", startedAt: 0, durationMs: 40_000 },
  ]);
  const timers = useRef<number[]>([]);
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [msgs]);
  // ?secao=gatilhos (vindo de "Ajustar agenda ou gatilho"): rola até a seção.
  useEffect(() => {
    if (focus) document.getElementById(`secao-${focus}`)?.scrollIntoView({ block: "start" });
  }, [focus]);

  // Qualquer edição depois de publicado vira "alterações não publicadas".
  const touched = <T,>(set: (v: T) => void) => (v: T) => {
    set(v);
    setStatus((s) => (s === "publicado" ? "alterado" : s));
  };

  const run = (userText: string, reply: string[]) => {
    if (mobile) setPane("conversa");
    const now = Date.now();
    const aid = `a${now}`;
    setMsgs((m) => [...m, { id: `u${now}`, role: "user", text: userText }, { id: aid, role: "agent", text: [], status: "running", startedAt: now, durationMs: 0 }]);
    reply.forEach((p, i) => timers.current.push(window.setTimeout(() => setMsgs((m) => m.map((x) => (x.id === aid && x.role === "agent" ? { ...x, text: [...x.text, p] } : x))), 1200 + i * 1000)));
    timers.current.push(
      window.setTimeout(() => {
        setMsgs((m) => m.map((x) => (x.id === aid && x.role === "agent" ? { ...x, status: "done", durationMs: Date.now() - now } : x)));
        setTesting(false);
      }, 1200 + reply.length * 1000 + 400),
    );
  };

  const test = () => {
    setTesting(true);
    if (seed.fleetId) {
      const fleet = agentById(seed.fleetId);
      run(`Teste com o último caso real do ${name}.`, [
        `Rodei os ${fleet?.flow.length ?? 4} passos com a última entrada de produção, sem efeito externo (modo de teste).`,
        `Resultado igual ao da versão em produção em ${fleet?.flow.filter((f) => !f.approval).length ?? 3} passos; o passo que pede aprovação gerou a prévia e parou.`,
        "Rode as avaliações antes de publicar: a versão nova entra como canário para 10 % dos gatilhos.",
      ]);
      return;
    }
    run("Teste com o último artigo publicado: “Como reduzir o churn de PMEs em 90 dias”.", [
      "Li o artigo (1.840 palavras) com Firecrawl e separei 3 ideias e o dado principal: “clientes com onboarding guiado cancelam 38 % menos”.",
      "Gerei 3 rascunhos: LinkedIn (1.120 caracteres), fio de 4 posts para X e um post para r/SaaS — a comunidade permite estudos de caso.",
      "Tom checado contra o guia de voz: 1 ajuste sugerido no LinkedIn (“garantido” → “em média”). Nada foi publicado.",
    ]);
  };

  const send = (text: string) => {
    if (!text.trim()) return;
    setDraft("");
    run(text, ["Anotado. Atualizei as instruções do agente com esse ajuste — confira na seção Instruções e publique quando estiver de acordo."]);
    touched(setInstructions)(`${instructions}<p><em>Ajuste pedido no chat:</em> ${text.replace(/</g, "&lt;")}</p>`);
  };

  const addProp = (list: Prop[], set: (v: Prop[]) => void, p: Prop) => {
    if (list.some((x) => x.id === p.id)) return notify(`${p.label} já está no agente`, undefined, "info");
    touched(set)([...list, p]);
    notify(`${p.label} adicionado`);
  };
  const removeProp = (list: Prop[], set: (v: Prop[]) => void) => (id: string) => {
    const before = list;
    touched(set)(list.filter((x) => x.id !== id));
    notify("Removido do agente", () => set(before));
  };
  const asItems = (opts: Prop[], list: Prop[], set: (v: Prop[]) => void): MenuEntry[] =>
    opts.map((o) => ({ label: o.label, icon: glyph(o), onSelect: () => addProp(list, set, o) }));

  const addMenu: MenuEntry[] = [
    { type: "submenu", label: "Ferramentas", icon: <Wrench className="h-4 w-4" />, items: asItems(toolOptions, tools, setTools) },
    { type: "submenu", label: "Saída", icon: <FileText className="h-4 w-4" />, items: asItems(outputOptions, outputs, setOutputs) },
    {
      type: "submenu",
      label: "Entrada",
      icon: <LogIn className="h-4 w-4" />,
      items: [
        { label: "Texto livre", onSelect: () => addProp(inputs, setInputs, { id: "text", label: "Texto livre" }) },
        { label: "Arquivo", onSelect: () => addProp(inputs, setInputs, { id: "file", label: "Arquivo" }) },
      ],
    },
    { label: "Verificações de qualidade", icon: <ListChecks className="h-4 w-4" />, onSelect: () => addProp(checks, setChecks, { id: `chk${Date.now()}`, label: "Revisão humana antes de publicar" }) },
    { type: "submenu", label: "Skills", icon: <Sparkles className="h-4 w-4" />, items: [{ label: "Escrita persuasiva", onSelect: () => notify("Skill “Escrita persuasiva” adicionada") }, { label: "SEO para redes", onSelect: () => notify("Skill “SEO para redes” adicionada") }] },
    { type: "submenu", label: "Arquivos", icon: <FolderOpen className="h-4 w-4" />, items: [{ label: "Guia de voz da marca.pdf", onSelect: () => notify("Arquivo anexado ao agente") }, { label: "Do computador…", onSelect: () => notify("Exemplo: abriria o seletor de arquivos", undefined, "info") }] },
  ];

  const busy = msgs.some((m) => m.role === "agent" && m.status === "running");

  const chat = (
    <div className="flex min-h-0 flex-1 flex-col">
      {mobile && (
        <div className="flex h-12 shrink-0 items-center gap-2 border-b border-line px-3">
          <span className="min-w-0 flex-1 truncate text-[13px] font-medium">Conversa com o agente</span>
          <button type="button" onClick={() => setPane("ficha")} className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[12.5px] ring-1 ring-line hover:bg-soft">
            <Sparkles className="h-3.5 w-3.5" /> Ver ficha
          </button>
        </div>
      )}
      <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[640px] space-y-6 px-4 py-6 sm:px-6">
          {msgs.map((m) =>
            m.role === "user" ? (
              <div key={m.id} className="flex justify-end">
                <p className="m-0 max-w-[88%] rounded-2xl rounded-br-md bg-soft px-3.5 py-2.5 text-[13.5px] leading-relaxed">{m.text}</p>
              </div>
            ) : (
              <AgentMessage
                key={m.id}
                streaming={m.status === "running" && m.text.length > 0}
                status={<RunSummary status={m.status} startedAt={m.startedAt || undefined} durationMs={m.durationMs} steps={m.id === "a0" ? 7 : 4} tools={2} />}
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
      <div className="shrink-0 px-3 pb-3 sm:px-5 sm:pb-4">
        <div className="mx-auto max-w-[640px]">
          <AgentComposer value={draft} onChange={setDraft} onSubmit={send} busy={busy} placeholder="Peça um ajuste ao agente ou dê uma tarefa…" />
        </div>
      </div>
    </div>
  );

  const builder = (
    <section className="flex min-h-0 flex-1 flex-col bg-page" aria-label="Definição do agente">
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-line px-4">
        {mobile && (
          <button type="button" onClick={() => setPane("conversa")} aria-label="Abrir conversa com o agente" className="-ml-1 grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted hover:bg-soft">
            <MessageSquare className="h-4 w-4" />
          </button>
        )}
        <nav aria-label="Trilha" className="flex min-w-0 flex-1 items-center gap-1.5 text-[13px]">
          <a href={agentRoutes.agents} className="hidden shrink-0 text-muted hover:text-ink sm:inline">
            Agentes
          </a>
          <ChevronRight className="hidden h-3.5 w-3.5 shrink-0 text-muted sm:block" aria-hidden />
          <Sparkles className="h-3.5 w-3.5 shrink-0 text-blue" aria-hidden />
          <span className="truncate font-medium" aria-current="page">
            {name}
          </span>
        </nav>
        <PublishBar
          status={status}
          testing={testing}
          onShare={() => notify("Link de edição copiado · só pessoas da Acme acessam", undefined, "info")}
          onTest={test}
          onPublish={() => {
            setStatus("publicado");
            notify("Agente publicado · os gatilhos já estão ativos", () => setStatus("rascunho"));
          }}
          menu={[
            ...(seed.fleetId
              ? [
                  { label: "Abrir página do agente", onSelect: () => go("ai-agent", seed.fleetId) },
                  { label: "Duplicar agente", onSelect: () => go("ai-agent-builder", { de: seed.fleetId }) },
                ]
              : []),
            { label: "Ver execuções", onSelect: () => (seed.fleetId ? go("ai-runs", { agente: seed.fleetId }) : go("ai-runs")) },
            { type: "separator" },
            { label: "Arquivar", tone: "danger", onSelect: () => notify("Agente arquivado", () => undefined) },
          ]}
        />
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto bg-gradient-to-b from-info-soft/40 to-page to-[220px]">
        <div className="mx-auto max-w-[760px] space-y-8 px-5 py-8 sm:px-8">
          <AgentHeader icon={<Sparkles />} title={name} description={description} onTitleChange={touched(setName)} onDescriptionChange={touched(setDescription)} />
          <span id="secao-gatilhos" className="block scroll-mt-4" aria-hidden />
          <BuilderSection
            title="Gatilhos"
            badge={<span className="rounded-md bg-soft px-1.5 py-0.5 text-[11px] font-normal text-muted ring-1 ring-line">Visível só para você</span>}
            description="O agente roda quando qualquer uma destas condições acontecer. Ativa depois de publicar."
            action={
              <AddPropertyMenu
                items={triggerOptions.map((t) => ({
                  label: t.text,
                  icon: glyph(t),
                  onSelect: () => (triggers.some((x) => x.id === t.id) ? notify("Esse gatilho já existe", undefined, "info") : (touched(setTriggers)([...triggers, t]), notify("Gatilho adicionado"))),
                }))}
              />
            }
          >
            <TriggerList
              triggers={triggers.map((t) => ({ id: t.id, icon: glyph(t), label: t.text }))}
              rowMenu={(t) => [
                {
                  label: "Editar condição",
                  onSelect: () => {
                    const full = triggers.find((x) => x.id === t.id);
                    if (!full) return;
                    setTriggerText(full.text);
                    setEditingTrigger(full);
                  },
                },
                { label: "Testar este gatilho", onSelect: test },
                { type: "separator" },
                {
                  label: "Remover",
                  tone: "danger",
                  onSelect: () => {
                    const before = triggers;
                    touched(setTriggers)(triggers.filter((x) => x.id !== t.id));
                    notify("Gatilho removido", () => setTriggers(before));
                  },
                },
              ]}
            />
          </BuilderSection>
          <BuilderSection title="Propriedades" description="Dê ao agente acesso a apps e ferramentas." action={<AddPropertyMenu items={addMenu} />}>
            <div className="divide-y divide-line">
              <PropertyRow label="Ferramentas">
                <ChipPicker chips={tools.map((t) => ({ id: t.id, label: t.label, icon: glyph(t) }))} onRemove={removeProp(tools, setTools)} addItems={asItems(toolOptions, tools, setTools)} />
              </PropertyRow>
              <PropertyRow label="Entrada">
                <ChipPicker chips={inputs.map((t) => ({ id: t.id, label: t.label, icon: <Globe className="h-3.5 w-3.5 text-muted" /> }))} onRemove={removeProp(inputs, setInputs)} />
              </PropertyRow>
              <PropertyRow label="Saída">
                <ChipPicker chips={outputs.map((t) => ({ id: t.id, label: t.label, icon: glyph(t) }))} onRemove={removeProp(outputs, setOutputs)} addItems={asItems(outputOptions, outputs, setOutputs)} />
              </PropertyRow>
              <PropertyRow label="Verificações" hint="antes de entregar">
                <ChipPicker chips={checks.map((t) => ({ id: t.id, label: t.label, icon: <ListChecks className="h-3.5 w-3.5 text-ok" /> }))} onRemove={removeProp(checks, setChecks)} empty="Nenhuma" />
              </PropertyRow>
            </div>
          </BuilderSection>
          <BuilderSection title="Instruções" description="O que o agente faz quando roda. Use # para títulos e - para listas.">
            <AgentInstructions
              value={instructions}
              onChange={touched(setInstructions)}
              enhancing={enhancing}
              onEnhance={() => {
                setEnhancing(true);
                const before = instructions;
                window.setTimeout(() => {
                  touched(setInstructions)(enhancedInstructions);
                  setEnhancing(false);
                  notify("Instruções melhoradas: critérios de qualidade adicionados", () => setInstructions(before));
                }, 1600);
              }}
            />
            <p className="m-0 mt-2 flex items-center gap-1.5 text-[12px] text-muted">
              <Wand2 className="h-3.5 w-3.5" /> “Melhorar” reescreve com critérios verificáveis; você revisa antes de publicar.
            </p>
          </BuilderSection>
        </div>
      </div>
    </section>
  );

  return (
    <AgentShell current={agentRoutes.agents}>
      {mobile ? (
        pane === "ficha" ? builder : chat
      ) : (
        <ResizableSplit left={chat} right={builder} storageKey="ai-agent-builder" defaultSize={0.4} min={0.3} max={0.6} />
      )}
      <Modal
        open={!!editingTrigger}
        onClose={() => setEditingTrigger(null)}
        title="Editar condição do gatilho"
        description={editingTrigger ? `App: ${apps[editingTrigger.app].name}. Escreva quando o agente deve rodar.` : undefined}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditingTrigger(null)}>
              Cancelar
            </Button>
            <Button
              disabled={!triggerText.trim()}
              disabledReason="Descreva a condição"
              onClick={() => {
                if (!editingTrigger) return;
                const before = triggers;
                touched(setTriggers)(triggers.map((x) => (x.id === editingTrigger.id ? { ...x, text: triggerText.trim() } : x)));
                setEditingTrigger(null);
                notify("Condição do gatilho atualizada", () => setTriggers(before));
              }}
            >
              Salvar condição
            </Button>
          </>
        }
      >
        <TextField label="Quando rodar" value={triggerText} onChange={setTriggerText} placeholder="Ex.: mensagem com “lead” em #inbound" />
      </Modal>
    </AgentShell>
  );
}
