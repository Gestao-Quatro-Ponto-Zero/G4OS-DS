import { BadgeCheck, Check, Download, Plus, Star, Zap } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AgentComposer,
  AppAccessList,
  Badge,
  Button,
  Drawer,
  Empty,
  OperationButton,
  OperationFeedback,
  Page,
  PageHeading,
  PageToolbar,
  Popover,
  Select,
  Stepper,
  TableSearch,
  Tabs,
  ToolGlyph,
  collectionThresholds,
  formatCompact,
  formatNumber,
  normalize,
  useOperation,
  type AppAccessItem,
} from "@g4ai/ds";
import { apps, type AppId } from "./data/agent-builder";
import { agentById, templateCategories, templates, type AgentTemplate, type TemplateCategory } from "./data/agents";
import { AgentListError, AgentListSkeleton, AgentShell, agentRoutes, useAgentDemoState } from "./shells/agent-shell";
import { frameHref, go, setFrameQuery, useFrameParam } from "./shells/frame-route";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Descobrir agentes",
  description:
    "Galeria de modelos de agente por categoria: apps que cada um usa, modelo, nota, instalações e quem criou. 'Ver exemplo' mostra uma execução de 3 passos; 'Instalar' abre um fluxo curto (espaço de trabalho → acesso app a app → confirmação); 'Usar modelo' abre o construtor; campo de pedido para começar do zero.",
  category: "IA",
  order: 10.2,
  height: 1080,
  concept: {
    goal: "Quem ainda não sabe o que automatizar encontra um ponto de partida testado por outras equipes e sai com um agente instalado (ou um rascunho para personalizar) em minutos.",
    patterns: [
      "Anatomia A · Lista (galeria): cabeçalho fixo + PageToolbar com abas de categoria e busca por agente ou app (só com 12 modelos ou mais)",
      "Cartão = apps (glifos) e modelo, nome, uma frase, nota e instalações (formatCompact) e autor",
      "Ver exemplo em Popover: uma execução real em 3 passos antes de decidir",
      "Instalar em Drawer de 3 etapas (Stepper): espaço de trabalho (Select) → acesso app a app (AppAccessList) → confirmação com 'Abrir agente'",
      "Instalação com useOperation/OperationButton: erro vira OperationFeedback com 'Tentar novamente'; Cancelar aborta a instalação em andamento",
      "Instalado vira selo 'Instalado' + 'Abrir'; 'Usar modelo' segue abrindo o construtor (?modelo=) como rascunho",
    ],
    adapt: ["Galeria de automações, integrações, modelos de relatório, playbooks de atendimento"],
    avoid: [
      "Cartões com ilustração genérica no lugar dos apps reais",
      "Instalar pedindo todas as permissões de uma vez sem dizer o que o agente faz com cada app",
      "Abrir outro drawer de dentro do fluxo de instalação",
    ],
  },
} as const;

/* ------------------------------------------------------------------ */
/* Dados de exemplo                                                    */
/* ------------------------------------------------------------------ */

type Cat = "todos" | TemplateCategory;

/** Nota, instalações e modelo de cada modelo de agente (troque pela sua API). */
const stats: Record<string, { rating: number; installs: number; model: string }> = {
  "t-sdr": { rating: 4.9, installs: 18_200, model: "Sol" },
  "t-followup": { rating: 4.8, installs: 11_700, model: "Sol" },
  "t-churn": { rating: 4.6, installs: 5_100, model: "Sol Max" },
  "t-social": { rating: 4.7, installs: 9_400, model: "Brisa" },
  "t-cobranca": { rating: 4.8, installs: 14_300, model: "Sol" },
  "t-conc": { rating: 4.7, installs: 7_900, model: "Sol Max" },
  "t-nfe": { rating: 4.5, installs: 3_800, model: "Sol" },
  "t-triagem": { rating: 4.9, installs: 21_600, model: "Brisa" },
  "t-faq": { rating: 4.6, installs: 12_800, model: "Brisa" },
  "t-cv": { rating: 4.7, installs: 6_300, model: "Sol" },
  "t-onb": { rating: 4.4, installs: 2_900, model: "Sol" },
  "t-meet": { rating: 4.9, installs: 26_400, model: "Brisa" },
  "t-estoque": { rating: 4.5, installs: 1_700, model: "Sol" },
};
const statOf = (id: string) => stats[id] ?? { rating: 4.5, installs: 1_000, model: "Sol" };

/** Exemplo de execução (3 passos) para os modelos sem agente na frota. */
const examples: Record<string, string[]> = {
  "t-social": ["Leu o artigo “Como reduzir o churn de PMEs em 90 dias”", "Escreveu 3 rascunhos: LinkedIn, fio de 4 posts e comunidade", "Pediu sua aprovação antes de publicar"],
  "t-faq": ["Recebeu a dúvida “Como emito a segunda via do boleto?”", "Encontrou o artigo certo na base de conhecimento", "Respondeu no chat citando o artigo"],
  "t-onb": ["Viu a admissão de Marina Costa (Financeiro)", "Criou os acessos e agendou 4 conversas da primeira semana", "Abriu o checklist de onboarding para o gestor"],
  "t-estoque": ["Listou 37 SKUs sem giro há 90 dias", "Cruzou com margem e estoque em outras filiais", "Sugeriu 12 promoções e 5 transferências para aprovar"],
};
const exampleOf = (t: AgentTemplate) => {
  const live = agentById(t.basedOn);
  return live ? live.flow.slice(0, 3).map((f) => f.title) : (examples[t.id] ?? ["Recebeu o gatilho", "Buscou os dados nos apps conectados", "Entregou o resultado para revisão"]);
};

const workspaces = [
  { value: "comercial", label: "Comercial · Acme", description: "48 pessoas" },
  { value: "financeiro", label: "Financeiro · Acme", description: "12 pessoas" },
  { value: "sandbox", label: "Sandbox de testes", description: "Só você" },
];
/** Apps já conectados ao espaço (o resto pede "Conectar"). */
const connectedApps: AppId[] = ["g4crm", "gdrive", "slack", "notion"];
/** O que o agente faz em cada app, em linguagem simples. */
const scopeOf: Record<AppId, string> = {
  slack: "Ler mensagens dos canais escolhidos e postar respostas",
  linear: "Criar e atualizar issues",
  reddit: "Ler as regras das comunidades e salvar rascunhos",
  firecrawl: "Ler páginas públicas da web",
  linkedin: "Criar rascunhos de posts (não publica sozinho)",
  gdrive: "Ler arquivos das pastas compartilhadas com o agente",
  notion: "Ler páginas e criar rascunhos",
  hubspot: "Ler contatos e negócios e registrar atividades",
  sheets: "Ler e atualizar as planilhas escolhidas",
  g4crm: "Ler clientes e negócios e registrar atividades",
};

/** A primeira instalação da demonstração falha uma vez (mostra o erro com saída). */
let demoFailed = false;
const wait = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const t = window.setTimeout(resolve, ms);
    signal.addEventListener("abort", () => {
      window.clearTimeout(t);
      reject(new Error("Instalação cancelada."));
    });
  });

/* ------------------------------------------------------------------ */
/* Tela                                                                */
/* ------------------------------------------------------------------ */

export default function AiAgentTemplates() {
  const estado = useAgentDemoState();
  const filtro = useFrameParam("estado") === "filtro";
  const cat = (useFrameParam("categoria", "todos") as Cat) ?? "todos";
  const [q, setQ] = useState(filtro ? "folha de ponto" : "");
  const [prompt, setPrompt] = useState("");
  const [installing, setInstalling] = useState<AgentTemplate | null>(null);
  const [installed, setInstalled] = useState<Record<string, string>>({});
  const source = useMemo(() => (estado === "vazio" ? [] : templates), [estado]);
  const shown = useMemo(
    () =>
      source.filter(
        (t) => (cat === "todos" || t.category === cat) && (!q || normalize(`${t.name} ${t.description} ${t.author} ${t.apps.map((a) => apps[a].name).join(" ")} ${(t.extra ?? []).join(" ")}`).includes(normalize(q))),
      ),
    [source, cat, q],
  );
  const searchable = source.length >= collectionThresholds.search;
  const openHref = (t: AgentTemplate) => {
    const live = agentById(t.basedOn);
    return live ? frameHref("ai-agent", live.id) : frameHref("ai-agent-builder", { modelo: t.id });
  };

  return (
    <AgentShell current={agentRoutes.templates}>
      <Page>
        <PageHeading
          crumbs={[{ label: "Agentes", href: agentRoutes.agents }]}
          title="Descobrir agentes"
          description="Modelos prontos, testados por outras equipes. Instale com as configurações recomendadas ou use o modelo para personalizar um rascunho."
          actions={
            <Button variant="ghost" href={`${agentRoutes.builder}?novo=1`}>
              <Plus /> Começar do zero
            </Button>
          }
        />
        <section aria-label="Descrever um agente" className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
          <p className="m-0 mb-3 text-[14px] font-medium">Não achou? Descreva o que o agente deve fazer</p>
          <AgentComposer value={prompt} onChange={setPrompt} onSubmit={(v) => v.trim() && go("ai-agent-builder", { pedido: v.trim() })} placeholder="Ex.: quando um cliente pedir cancelamento, junte o histórico e avise o executivo da conta" />
        </section>

        <div className="mt-6 flex flex-col gap-4">
          <PageToolbar>
            <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
              <Tabs
                label="Categoria"
                overflow="scroll"
                className="min-w-0 flex-1"
                value={cat}
                onChange={(id) => setFrameQuery({ categoria: id === "todos" ? undefined : id })}
                items={[{ id: "todos", label: "Todos" }, ...templateCategories.map((c) => ({ id: c, label: c }))]}
              />
              {searchable && (
                <div className="w-full pb-1.5 sm:w-[280px]">
                  <TableSearch value={q} onChange={setQ} total={source.length} noun="modelo" searchIn="agente, app e autor" />
                </div>
              )}
            </div>
          </PageToolbar>

          {estado === "carregando" ? (
            <AgentListSkeleton rows={6} label="Carregando modelos" />
          ) : estado === "erro" ? (
            <AgentListError noun="os modelos" />
          ) : !source.length ? (
            <Empty title="Nenhum modelo publicado ainda" hint="Os modelos do Time G4 e os que sua equipe compartilhar aparecem aqui." action={<Button href={`${agentRoutes.builder}?novo=1`}>Começar do zero</Button>} />
          ) : !shown.length ? (
            <Empty
              title="Nenhum modelo com esses filtros"
              hint="Tente outro agente ou app, ou veja todas as categorias."
              action={
                <Button
                  variant="ghost"
                  onClick={() => {
                    setQ("");
                    setFrameQuery({ categoria: undefined, estado: undefined });
                  }}
                >
                  Limpar filtros
                </Button>
              }
            />
          ) : (
            <ul className="m-0 grid list-none gap-4 p-0 sm:grid-cols-2 xl:grid-cols-3">
              {shown.map((t) => {
                const s = statOf(t.id);
                const where = installed[t.id];
                return (
                  <li key={t.id} className="flex flex-col rounded-xl border border-line bg-surface p-4 transition-colors hover:border-line-strong">
                    <div className="flex items-start justify-between gap-2">
                      <span className="flex flex-wrap gap-1">
                        {t.apps.map((id) => (
                          <ToolGlyph key={id} name={apps[id].name} color={apps[id].color} size={22} />
                        ))}
                        {t.extra?.map((x) => (
                          <span key={x} className="inline-flex h-[22px] items-center rounded-md bg-soft px-1.5 text-[11px] text-muted ring-1 ring-line">
                            {x}
                          </span>
                        ))}
                        <span className="sr-only">Usa {[...t.apps.map((a) => apps[a].name), ...(t.extra ?? [])].join(", ")}</span>
                      </span>
                      <span className="inline-flex shrink-0 items-center gap-1 text-[12px] text-muted">
                        <Zap aria-hidden className="h-3.5 w-3.5 text-accent-deep" />
                        <span className="sr-only">Modelo:</span> {s.model}
                      </span>
                    </div>
                    <h2 className="m-0 mt-3 text-[15px] font-medium">{t.name}</h2>
                    <p className="m-0 mt-1 flex-1 text-[13px] leading-relaxed text-ink-soft">{t.description}</p>
                    <p className="m-0 mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] tabular-nums text-muted">
                      <span className="inline-flex items-center gap-1">
                        <Star aria-hidden className="h-3.5 w-3.5 fill-current text-ink-soft" />
                        <span className="sr-only">Nota</span> {formatNumber(s.rating, 1)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Download aria-hidden className="h-3.5 w-3.5" /> {formatCompact(s.installs)} <span className="sr-only">instalações</span>
                      </span>
                      <span className="inline-flex min-w-0 items-center gap-1">
                        {t.official && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-ink" aria-label="Oficial" />}
                        por {t.author}
                      </span>
                    </p>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
                      <Popover
                        trigger="Ver exemplo"
                        triggerLabel={`Ver exemplo de execução: ${t.name}`}
                        triggerClassName="-ml-1.5 h-8 text-[12.5px] text-ink-soft hover:text-ink"
                        title="Exemplo de execução"
                        align="start"
                        width={320}
                      >
                        <ExampleRun template={t} />
                      </Popover>
                      <span className="flex shrink-0 items-center gap-1">
                        {where ? (
                          <>
                            <Badge tone="ok" icon={<Check />}>
                              Instalado
                            </Badge>
                            <Button size="sm" variant="ghost" href={openHref(t)}>
                              Abrir
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button size="sm" variant="quiet" href={frameHref("ai-agent-builder", { modelo: t.id })}>
                              Usar modelo
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setInstalling(t)}>
                              Instalar
                            </Button>
                          </>
                        )}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </Page>
      {installing && (
        <InstallFlow
          key={installing.id}
          template={installing}
          openHref={openHref(installing)}
          onClose={() => setInstalling(null)}
          onInstalled={(ws) => setInstalled((m) => ({ ...m, [installing.id]: ws }))}
        />
      )}
    </AgentShell>
  );
}

/** Prévia: uma execução típica em 3 passos. */
function ExampleRun({ template }: { template: AgentTemplate }) {
  const live = agentById(template.basedOn);
  return (
    <div className="flex flex-col gap-3">
      <ol className="m-0 flex list-none flex-col gap-2.5 p-0">
        {exampleOf(template).map((step, i) => (
          <li key={i} className="flex items-start gap-2.5 text-[12.5px] leading-snug text-ink">
            <span aria-hidden className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-soft text-[11px] font-medium tabular-nums text-ink-soft ring-1 ring-line">
              {i + 1}
            </span>
            <span className="pt-0.5">{step}</span>
          </li>
        ))}
      </ol>
      <p className="m-0 text-[12px] text-muted">Nada sai para fora sem a sua aprovação na primeira semana.</p>
      {live && (
        <a href={frameHref("ai-runs", { agente: live.id })} className="text-[12.5px] font-medium text-ink underline-offset-2 hover:underline">
          Ver execuções reais na frota
        </a>
      )}
    </div>
  );
}

/** Instalar: espaço de trabalho → acesso app a app → confirmação. Tudo no mesmo drawer. */
function InstallFlow({ template, openHref, onClose, onInstalled }: { template: AgentTemplate; openHref: string; onClose: () => void; onInstalled: (workspace: string) => void }) {
  const [step, setStep] = useState(0);
  const [workspace, setWorkspace] = useState("comercial");
  const [access, setAccess] = useState<AppAccessItem[]>(() =>
    template.apps.map((id, i) => ({
      id,
      name: apps[id].name,
      color: apps[id].color,
      scope: scopeOf[id],
      connected: connectedApps.includes(id),
      granted: connectedApps.includes(id),
      required: i === 0,
    })),
  );
  const op = useOperation({ busyLabel: "Instalando…", fallback: "Não foi possível instalar o agente." });
  const ctrl = useRef<AbortController | null>(null);
  useEffect(() => () => ctrl.current?.abort(), []);
  const wsLabel = workspaces.find((w) => w.value === workspace)?.label ?? workspace;
  const missing = access.filter((a) => a.required && !(a.connected && a.granted));

  // O avanço para "Pronto" fica dentro da tarefa: assim "Tentar novamente" (op.retry) também conclui.
  const install = () => {
    const c = new AbortController();
    ctrl.current = c;
    void op.run(async () => {
      await wait(1400, c.signal);
      if (!demoFailed) {
        demoFailed = true;
        throw new Error(`Não foi possível conectar o agente ao espaço ${wsLabel}. A sessão do app expirou; tente de novo.`);
      }
      if (c.signal.aborted) return;
      onInstalled(workspace);
      setStep(2);
    });
  };
  const cancel = () => {
    if (op.busy) ctrl.current?.abort();
    onClose();
  };

  const steps = ["Espaço de trabalho", "Acesso aos apps", "Pronto"];
  const footer =
    step === 0 ? (
      <>
        <Button variant="ghost" onClick={cancel}>
          Cancelar
        </Button>
        <Button onClick={() => setStep(1)}>Continuar</Button>
      </>
    ) : step === 1 ? (
      <>
        <Button variant="ghost" onClick={op.busy ? cancel : () => (op.reset(), setStep(0))}>
          {op.busy ? "Cancelar" : "Voltar"}
        </Button>
        <OperationButton
          operation={op}
          disabled={missing.length > 0}
          disabledReason={missing.length ? `Conecte e permita ${missing.map((m) => m.name).join(" e ")}` : undefined}
          onClick={install}
        >
          Instalar agente
        </OperationButton>
      </>
    ) : (
      <>
        <Button variant="ghost" onClick={onClose}>
          Fechar
        </Button>
        <Button href={openHref}>Abrir agente</Button>
      </>
    );

  return (
    <Drawer open onClose={cancel} title={`Instalar ${template.name}`} kicker={`Modelo · ${template.category}`} footer={footer}>
      <div className="flex flex-col gap-6">
        <Stepper label="Etapas da instalação" steps={steps.map((label, i) => ({ id: String(i), label, state: i < step ? "done" : i === step ? "current" : "upcoming" }))} />
        {step === 0 && (
          <div className="flex flex-col gap-4">
            <Select label="Espaço de trabalho" options={workspaces} value={workspace} onValueChange={setWorkspace} hint="Quem está no espaço vê as execuções e aprova as ações do agente." />
            <section aria-label="O que será instalado" className="rounded-xl border border-line bg-soft/50 p-3.5">
              <p className="m-0 text-[13px] font-medium">{template.name}</p>
              <p className="m-0 mt-0.5 text-[12.5px] leading-relaxed text-ink-soft">{template.description}</p>
              <p className="m-0 mt-2 text-[12px] text-muted">
                Modelo {statOf(template.id).model} · configura em {formatNumber(template.setupMinutes)} min · pede aprovação antes de agir para fora
              </p>
            </section>
          </div>
        )}
        {step === 1 && (
          <div className="flex flex-col gap-3">
            <p className="m-0 text-[13px] text-ink-soft">O agente só acessa o que você permitir aqui. Dá para mudar depois na página dele.</p>
            <AppAccessList
              apps={access}
              onGrantChange={(id, granted) => setAccess((a) => a.map((x) => (x.id === id ? { ...x, granted } : x)))}
              onConnect={(id) => wait(1100, new AbortController().signal).then(() => setAccess((a) => a.map((x) => (x.id === id ? { ...x, connected: true, granted: true, error: undefined } : x))))}
            />
            <OperationFeedback operation={op} />
          </div>
        )}
        {step === 2 && (
          <div className="flex flex-col items-center gap-3 py-6 text-center" role="status">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-ok-soft text-ok">
              <Check className="h-6 w-6" strokeWidth={2.5} aria-hidden />
            </span>
            <h3 className="m-0 text-[18px] font-semibold tracking-tight">{template.name} instalado</h3>
            <p className="m-0 max-w-[340px] text-[13.5px] leading-relaxed text-ink-soft">
              Está ativo em {wsLabel} com acesso a {access.filter((a) => a.granted).map((a) => a.name).join(", ")}. Na primeira semana ele pede sua aprovação antes de agir para fora.
            </p>
          </div>
        )}
      </div>
    </Drawer>
  );
}
