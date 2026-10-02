import { Bot, Cpu, Database, History, KeyRound, Plus, ShieldCheck, Wallet, Gauge } from "lucide-react";
import { useState } from "react";
import {
  Badge,
  Button,
  Callout,
  ConfirmDialog,
  CopyButton,
  CurrencyField,
  DataTable,
  Drawer,
  Meter,
  NumberField,
  OperationButton,
  OperationFeedback,
  Page,
  SegmentedControl,
  Select,
  SettingsLayout,
  SettingsSection,
  Slider,
  Switch,
  TextField,
  formatCurrency,
  formatNumber,
  formatPercent,
  notify,
  useOperation,
  type Column,
  type SettingsNavItem,
} from "@g4ai/ds";
import {
  agents,
  apiKeys as seedKeys,
  approvalPolicies,
  areaBudgets,
  creditPlan,
  modelById,
  models as seedModels,
  personOf,
  rateLimits as seedLimits,
  type ApprovalMode,
  type ModelId,
  type FleetAgent,
} from "./data/agents";
import { AgentShell, agentRoutes } from "./shells/agent-shell";
import { frameHref, useFrameParam } from "./shells/frame-route";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Governança de agentes",
  description: "Configurações da frota (?secao=): créditos do mês e orçamento por área e por agente com alerta, limites de uso, política de aprovação humana, modelos permitidos, dados e LGPD (retenção, mascaramento, região) e chaves de API.",
  category: "IA",
  order: 15,
  height: 1100,
  concept: {
    goal: "Quem responde pela IA na empresa define quanto cada agente pode gastar, o que exige uma pessoa, quais modelos valem e onde os dados ficam.",
    patterns: [
      "Anatomia D · Configurações: título fixo + subnavegação colada (SettingsLayout); seção na URL (?secao=)",
      "Créditos do mês com GoalMeter e 'Ver uso'; orçamento por área com Meter e por agente editável em Drawer",
      "Política de aprovação por tipo de ação: Sempre · Acima de um valor · Nunca",
      "Mudança arriscada (modelo fora do Brasil, revogar chave) pede ConfirmDialog",
      "Chave nova aparece uma única vez, com copiar",
    ],
    adapt: [
      "Governança de automações, limites de API de um SaaS, políticas de compras",
    ],
    avoid: [
      "Orçamento sem alerta antes de estourar",
      "Liberar modelo que envia dados para fora do Brasil sem avisar o impacto de LGPD",
      "Mostrar a chave inteira depois de criada",
    ],
  },
} as const;

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const money = (n: number) => formatCurrency(n, { cents: false });

type Section = "orcamento" | "limites" | "aprovacao" | "modelos" | "dados" | "chaves";
const sectionHref = (s: Section) => frameHref("ai-agent-governance", { secao: s });
const nav: SettingsNavItem[] = [
  { href: sectionHref("orcamento"), label: "Orçamento e créditos", icon: Wallet },
  { href: sectionHref("limites"), label: "Limites de uso", icon: Gauge },
  { href: sectionHref("aprovacao"), label: "Aprovação humana", icon: ShieldCheck },
  { href: sectionHref("modelos"), label: "Modelos permitidos", icon: Cpu },
  { href: sectionHref("dados"), label: "Dados e LGPD", icon: Database },
  { href: sectionHref("chaves"), label: "Chaves de API", icon: KeyRound },
];
const titles: Record<Section, { title: string; description: string }> = {
  orcamento: { title: "Orçamento e créditos", description: "Quanto a frota e cada agente podem gastar por mês, e quando avisar." },
  limites: { title: "Limites de uso", description: "Quantas execuções cada agente pode fazer por minuto e por dia." },
  aprovacao: { title: "Aprovação humana", description: "O que um agente só faz depois que uma pessoa aprova." },
  modelos: { title: "Modelos permitidos", description: "Quais modelos os agentes podem usar e qual é o padrão." },
  dados: { title: "Dados e LGPD", description: "Onde os agentes rodam, o que fica guardado e por quanto tempo." },
  chaves: { title: "Chaves de API", description: "Sistemas que disparam agentes por API." },
};

export default function AiAgentGovernance() {
  const raw = useFrameParam("secao", "orcamento");
  const section: Section = raw in titles ? (raw as Section) : "orcamento";
  const [budgets, setBudgets] = useState(() => Object.fromEntries(agents.map((a) => [a.id, a.budget])) as Record<string, number>);
  const [editing, setEditing] = useState<FleetAgent | null>(null);
  const [draftBudget, setDraftBudget] = useState<number | null>(null);
  const [alertAt, setAlertAt] = useState(80);
  const [pauseAtLimit, setPauseAtLimit] = useState(false);
  const [slackAlert, setSlackAlert] = useState(true);
  const [limits, setLimits] = useState(seedLimits);
  const [policies, setPolicies] = useState(approvalPolicies);
  const [policiesDirty, setPoliciesDirty] = useState(false);
  const [models, setModels] = useState(seedModels);
  const [defaultModel, setDefaultModel] = useState("g4-pro");
  const [confirmModel, setConfirmModel] = useState(false);
  const [retention, setRetention] = useState("90");
  const [mask, setMask] = useState(true);
  const [confirmMove, setConfirmMove] = useState(false);
  const [moved, setMoved] = useState(false);
  const [keys, setKeys] = useState(seedKeys);
  const [creating, setCreating] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [keyScope, setKeyScope] = useState("rascunhos");
  const [tried, setTried] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<(typeof seedKeys)[number] | null>(null);
  const op = useOperation();
  const keyOp = useOperation({ busyLabel: "Criando…" });

  const outside = agents.filter((a) => !a.region.brazil);
  const head = titles[section];

  const budgetColumns: Column<FleetAgent>[] = [
    {
      key: "agent",
      header: "Agente",
      primary: true,
      cell: (a) => (
        <span className="block min-w-0 text-[13.5px] leading-tight">
          <a href={frameHref("ai-agent", a.id)} className="block truncate font-medium hover:underline">
            {a.name}
          </a>
          <span className="block truncate text-[12px] font-normal text-muted">
            {a.area} · {personOf(a.owner).name}
          </span>
        </span>
      ),
    },
    {
      key: "use",
      header: "Uso do mês",
      cell: (a) => {
        const use = a.cost30d / budgets[a.id];
        return (
          <span className="block">
            <span className="flex items-baseline justify-between gap-2 text-[12.5px] tabular-nums">
              <span>
                {money(a.cost30d)} <span className="text-muted">de {money(budgets[a.id])}</span>
              </span>
              <span className={use * 100 >= alertAt ? "text-amber" : "text-muted"}>{formatPercent(use, 0)}</span>
            </span>
            <span className="mt-1.5 block">
              <Meter value={Math.min(100, use * 100)} tone={use >= 1 ? "bad" : use * 100 >= alertAt ? "warn" : "ink"} label={`${formatPercent(use, 0)} do orçamento`} />
            </span>
          </span>
        );
      },
    },
    {
      key: "edit",
      header: "",
      action: true,
      cell: (a) => (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            op.reset();
            setDraftBudget(budgets[a.id]);
            setEditing(a);
          }}
        >
          Editar
        </Button>
      ),
    },
  ];

  const keyColumns: Column<(typeof seedKeys)[number]>[] = [
    {
      key: "name",
      header: "Nome",
      primary: true,
      cell: (k) => (
        <span className="block min-w-0 text-[13.5px] leading-tight">
          <span className="block truncate font-medium">{k.name}</span>
          <span className="block font-mono text-[11.5px] font-normal text-muted">{k.prefix}••••••••</span>
        </span>
      ),
    },
    { key: "scope", header: "Pode", cell: (k) => <span className="text-[13px] text-ink-soft">{k.scope}</span> },
    { key: "by", header: "Criada por", nowrap: true, mobileHidden: true, cell: (k) => personOf(k.createdBy).name },
    { key: "used", header: "Último uso", nowrap: true, cell: (k) => <span className="text-muted">{k.lastUsed}</span> },
    {
      key: "revoke",
      header: "",
      action: true,
      cell: (k) => (
        <Button size="sm" variant="ghost" onClick={() => setRevoking(k)}>
          Revogar
        </Button>
      ),
    },
  ];

  return (
    <AgentShell current={agentRoutes.governance}>
      <Page>
        <SettingsLayout heading="Governança" headingDescription="Regras que valem para todos os agentes da Acme." nav={nav} navLabel="Seções de governança" current={sectionHref(section)} title={head.title} description={head.description}>
          {section === "orcamento" && (
            <>
              <SettingsSection title="Créditos do mês" description={`${creditPlan.plan}. Renova em 01/10.`}>
                <div className="rounded-xl border border-line bg-surface p-4">
                  <p className="m-0 flex items-baseline justify-between gap-2 text-[12.5px] text-muted">
                    <span>Créditos usados em setembro</span>
                    <span className="tabular-nums">
                      <span className="text-[15px] font-semibold text-ink">{money(creditPlan.used)}</span> de {money(creditPlan.limit)}
                    </span>
                  </p>
                  <div className="mt-2">
                    <Meter value={(creditPlan.used / creditPlan.limit) * 100} tone={creditPlan.used / creditPlan.limit * 100 >= alertAt ? "warn" : "ink"} label={`${formatPercent(creditPlan.used / creditPlan.limit, 0)} dos créditos usados`} />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[12.5px] text-muted">
                    <span>Ritmo atual termina o mês em {money(creditPlan.used * (30 / 29))}, abaixo do limite.</span>
                    <Button size="sm" variant="ghost" href={frameHref("settings-billing")}>
                      Ver uso e fatura
                    </Button>
                  </div>
                </div>
              </SettingsSection>
              <SettingsSection title="Por área" description="Soma dos orçamentos dos agentes de cada área.">
                <ul className="m-0 list-none divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface p-0">
                  {areaBudgets
                    .filter((b) => b.agents > 0)
                    .map((b) => (
                      <li key={b.area} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1.5 px-4 py-3 sm:grid-cols-[160px_minmax(0,1fr)_auto]">
                        <span className="text-[13.5px] font-medium">
                          {b.area}
                          <span className="block text-[12px] font-normal text-muted">
                            {b.agents} {b.agents === 1 ? "agente" : "agentes"}
                          </span>
                        </span>
                        <span className="order-3 col-span-2 sm:order-none sm:col-span-1">
                          <Meter value={Math.min(100, (b.spent / b.budget) * 100)} tone={b.spent / b.budget >= alertAt / 100 ? "warn" : "ink"} label={`${b.area}: ${formatPercent(b.spent / b.budget, 0)} do orçamento`} />
                        </span>
                        <span className="text-right text-[13px] tabular-nums">
                          {money(b.spent)} <span className="text-muted">de {money(b.budget)}</span>
                        </span>
                      </li>
                    ))}
                </ul>
              </SettingsSection>
              <SettingsSection title="Por agente" description="Ao passar do orçamento, o agente segue rodando e o dono é avisado, a não ser que você escolha pausar.">
                {/* Lista, não tabela: a coluna de conteúdo das Configurações é estreita para 3 colunas. */}
                <ul aria-label="Orçamento por agente" className="m-0 list-none divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface p-0">
                  {agents
                    .filter((a) => a.status !== "rascunho")
                    .map((a) => (
                      <li key={a.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,200px)_auto]">
                        {budgetColumns.map((c) => (
                          <div key={c.key} className={c.key === "use" ? "order-3 col-span-2 min-w-0 sm:order-none sm:col-span-1" : "min-w-0"}>
                            {c.cell(a)}
                          </div>
                        ))}
                      </li>
                    ))}
                </ul>
              </SettingsSection>
              <SettingsSection title="Alertas" description="Valem para todos os agentes.">
                <div className="space-y-4 rounded-xl border border-line bg-surface p-4">
                  <Slider label="Avisar o dono ao chegar em" value={alertAt} onChange={(v) => setAlertAt(v)} min={50} max={100} step={5} marks={[50, 80, 100]} format={(n) => `${n} %`} hint="Do orçamento do mês de cada agente" />
                  <Switch label="Avisar também em #agentes-custos no Slack" checked={slackAlert} onCheckedChange={(v) => (setSlackAlert(v), notify(v ? "Avisos no Slack ligados" : "Avisos no Slack desligados"))} />
                  <Switch label="Pausar o agente ao atingir 100 %" checked={pauseAtLimit} onCheckedChange={(v) => (setPauseAtLimit(v), notify(v ? "Agentes passam a pausar no limite" : "Agentes seguem rodando após o limite"))} />
                </div>
              </SettingsSection>
            </>
          )}

          {section === "limites" && (
            <SettingsSection title="Por agente" description="Protege conectores com limite próprio (Notion, WhatsApp) e evita laços que gastam créditos.">
              <ul className="m-0 list-none divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface p-0">
                {limits.map((l) => (
                  <li key={l.id} className="grid gap-3 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_140px_160px] sm:items-end">
                    <span className="text-[13.5px] font-medium">
                      {l.label}
                      {l.note && <span className="block text-[12px] font-normal text-muted">{l.note}</span>}
                    </span>
                    <NumberField label="Por minuto" value={l.perMinute} min={1} onChange={(v) => setLimits((all) => all.map((x) => (x.id === l.id ? { ...x, perMinute: v ?? 1 } : x)))} />
                    <NumberField label="Por dia" value={l.perDay} min={1} step={50} onChange={(v) => setLimits((all) => all.map((x) => (x.id === l.id ? { ...x, perDay: v ?? 1 } : x)))} />
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex justify-end">
                <OperationButton operation={op} onClick={() => void op.run(() => wait(700), "Limites de uso salvos")}>
                  Salvar limites
                </OperationButton>
              </div>
              <OperationFeedback operation={op} />
            </SettingsSection>
          )}

          {section === "aprovacao" && (
            <SettingsSection title="Quando pedir aprovação" description="Os pedidos vão para Aprovações e para o Slack de quem aprova. Expiram em 3 dias.">
              <ul className="m-0 list-none space-y-3 p-0">
                {policies.map((p) => (
                  <li key={p.id} className="rounded-xl border border-line bg-surface p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="m-0 text-[13.5px] font-medium">{p.label}</p>
                        <p className="m-0 mt-0.5 text-[12.5px] text-muted">{p.description}</p>
                        <p className="m-0 mt-1 text-[12px] text-muted">Quem aprova: {p.approver}</p>
                      </div>
                      <SegmentedControl<ApprovalMode>
                        label={`Aprovação para: ${p.label}`}
                        value={p.mode}
                        onChange={(mode) => {
                          setPolicies((all) => all.map((x) => (x.id === p.id ? { ...x, mode, threshold: mode === "acima" ? x.threshold ?? 10000 : x.threshold } : x)));
                          setPoliciesDirty(true);
                        }}
                        options={[
                          { value: "sempre", label: "Sempre" },
                          { value: "acima", label: "Acima de" },
                          { value: "nunca", label: "Nunca" },
                        ]}
                      />
                    </div>
                    {p.mode === "acima" && (
                      <div className="mt-3 max-w-[240px]">
                        <CurrencyField
                          label="Valor a partir do qual pede aprovação"
                          value={p.threshold ?? null}
                          onChange={(v) => {
                            setPolicies((all) => all.map((x) => (x.id === p.id ? { ...x, threshold: v ?? 0 } : x)));
                            setPoliciesDirty(true);
                          }}
                        />
                      </div>
                    )}
                  </li>
                ))}
              </ul>
              {policiesDirty && (
                <div className="sticky bottom-3 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-popover px-4 py-3 shadow-raised">
                  <span className="text-[13px]">Alterações não salvas nas políticas</span>
                  <span className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setPolicies(approvalPolicies);
                        setPoliciesDirty(false);
                      }}
                    >
                      Descartar
                    </Button>
                    <OperationButton size="sm" operation={op} onClick={() => void op.run(() => wait(700), "Políticas de aprovação salvas · valem para a próxima execução").then((err) => !err && setPoliciesDirty(false))}>
                      Salvar políticas
                    </OperationButton>
                  </span>
                </div>
              )}
              <OperationFeedback operation={op} />
            </SettingsSection>
          )}

          {section === "modelos" && (
            <>
              <SettingsSection title="Modelo padrão" description="Agentes novos começam com este modelo. Cada dono pode trocar por um permitido.">
                <div className="max-w-[320px]">
                  <Select
                    label="Modelo padrão"
                    value={defaultModel}
                    onValueChange={(v) => (setDefaultModel(v), notify(`Modelo padrão: ${modelById(v as ModelId).name}`))}
                    options={models.filter((m) => m.allowed).map((m) => ({ value: m.id, label: m.name }))}
                  />
                </div>
              </SettingsSection>
              <SettingsSection title="Permitidos" description="Preço em R$ por 1 milhão de tokens. Desligar um modelo não afeta agentes que já o usam até a próxima versão.">
                <ul className="m-0 list-none divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface p-0">
                  {models.map((m) => {
                    const using = agents.filter((a) => a.model === m.id).length;
                    return (
                      <li key={m.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                        <Bot className="h-4 w-4 shrink-0 text-muted" />
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-2 text-[13.5px] font-medium">
                            {m.name}
                            {m.id === defaultModel && <Badge>Padrão</Badge>}
                            {!m.dataInBrazil && <Badge tone="warn">Dados fora do Brasil</Badge>}
                          </span>
                          <span className="block text-[12px] text-muted">
                            {m.provider} · {m.note} · entrada {formatCurrency(m.input)} · saída {formatCurrency(m.output)}
                            {using ? ` · ${using} ${using === 1 ? "agente usa" : "agentes usam"}` : ""}
                          </span>
                        </span>
                        <Switch
                          label={`Permitir ${m.name}`}
                          hideLabel
                          checked={m.allowed}
                          disabled={m.id === defaultModel}
                          onCheckedChange={(v) => {
                            if (v && !m.dataInBrazil) return setConfirmModel(true);
                            setModels((all) => all.map((x) => (x.id === m.id ? { ...x, allowed: v } : x)));
                            notify(v ? `${m.name} permitido` : `${m.name} bloqueado para agentes novos`, () => setModels((all) => all.map((x) => (x.id === m.id ? { ...x, allowed: !v } : x))));
                          }}
                        />
                      </li>
                    );
                  })}
                </ul>
              </SettingsSection>
            </>
          )}

          {section === "dados" && (
            <>
              {outside.length > 0 && !moved && (
                <Callout
                  tone="warn"
                  title={`${outside.map((a) => a.name).join(", ")} roda fora do Brasil`}
                  action={
                    <Button size="sm" variant="ghost" onClick={() => setConfirmMove(true)}>
                      Mover para São Paulo
                    </Button>
                  }
                >
                  O agente lê listas de clientes (dado pessoal) e roda em {outside[0].region.dc}. Pela política da Acme, dados pessoais ficam no Brasil.
                </Callout>
              )}
              <SettingsSection title="Retenção" description="Entradas, saídas e traces das execuções. Depois disso, só ficam custo e status.">
                <div className="max-w-[320px]">
                  <Select
                    label="Guardar execuções por"
                    value={retention}
                    onValueChange={(v) => (setRetention(v), notify(`Execuções guardadas por ${v} dias`))}
                    options={[
                      { value: "30", label: "30 dias" },
                      { value: "90", label: "90 dias" },
                      { value: "180", label: "180 dias" },
                      { value: "365", label: "1 ano (auditoria)" },
                    ]}
                  />
                </div>
              </SettingsSection>
              <SettingsSection title="Privacidade" description="Vale para logs, traces e avaliações.">
                <div className="space-y-4 rounded-xl border border-line bg-surface p-4">
                  <Switch label="Mascarar CPF, e-mail e telefone nos logs" checked={mask} onCheckedChange={(v) => (setMask(v), notify(v ? "Dados pessoais mascarados nos logs" : "Logs passam a mostrar dados pessoais"))} />
                  <p className="m-0 text-[12.5px] text-muted">Pedidos de titular (LGPD) apagam as execuções da pessoa em até 15 dias. Encarregada: Marina Costa.</p>
                </div>
              </SettingsSection>
              <SettingsSection title="Onde cada agente roda">
                <ul className="m-0 list-none divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface p-0">
                  {agents.map((a) => {
                    const br = a.region.brazil || (moved && !a.region.brazil);
                    return (
                      <li key={a.id} className="flex flex-wrap items-center gap-3 px-4 py-2.5 text-[13.5px]">
                        <span className="min-w-0 flex-1">{a.name}</span>
                        <span className="text-[12.5px] text-muted">{moved && !a.region.brazil ? "Brasil · São Paulo (sa-east-1)" : a.region.dc}</span>
                        <Badge tone={br ? "neutral" : "warn"}>{br ? "Brasil" : "Fora do Brasil"}</Badge>
                      </li>
                    );
                  })}
                </ul>
                <Button className="mt-3" variant="ghost" href={frameHref("settings-audit-log")}>
                  <History /> Ver log de auditoria
                </Button>
              </SettingsSection>
            </>
          )}

          {section === "chaves" && (
            <SettingsSection title="Chaves ativas" description="Cada chave só dispara os agentes do escopo dela. Revogar corta o acesso na hora.">
              <div className="mb-3 flex justify-end">
                <Button
                  onClick={() => {
                    keyOp.reset();
                    setKeyName("");
                    setTried(false);
                    setNewKey(null);
                    setCreating(true);
                  }}
                >
                  <Plus /> Criar chave
                </Button>
              </div>
              <DataTable label="Chaves de API" rows={keys} columns={keyColumns} rowKey={(k) => k.id} empty={<p className="m-0 px-4 py-8 text-center text-[13px] text-muted">Nenhuma chave. Crie uma para disparar agentes a partir do ERP ou do site.</p>} />
            </SettingsSection>
          )}
        </SettingsLayout>

        <Drawer
          open={!!editing}
          onClose={() => setEditing(null)}
          title={editing ? `Orçamento · ${editing.name}` : "Orçamento"}
          kicker="Governança"
          footer={
            <>
              <Button variant="ghost" onClick={() => setEditing(null)}>
                Cancelar
              </Button>
              <OperationButton
                operation={op}
                onClick={() => {
                  if (!editing || !draftBudget) return;
                  const target = editing;
                  const value = draftBudget;
                  void op.run(() => wait(600), `Orçamento de ${target.name}: ${money(value)} por mês`).then((err) => {
                    if (err) return;
                    setBudgets((b) => ({ ...b, [target.id]: value }));
                    setEditing(null);
                  });
                }}
              >
                Salvar orçamento
              </OperationButton>
            </>
          }
        >
          {editing && (
            <div className="space-y-5">
              <OperationFeedback operation={op} />
              <CurrencyField label="Orçamento mensal" value={draftBudget} onChange={setDraftBudget} hint={`Gasto até agora: ${money(editing.cost30d)} · média de ${formatCurrency(editing.cost30d / Math.max(1, editing.runs30d))} por execução`} error={draftBudget != null && draftBudget < editing.cost30d ? "Menor que o já gasto no mês: o agente passa a contar como acima do orçamento." : undefined} />
              <p className="m-0 text-[12.5px] text-muted">
                No ritmo atual ({formatNumber(Math.round(editing.runs30d / 30))} execuções por dia), {draftBudget ? `o orçamento dura até o dia ${Math.min(30, Math.floor((draftBudget / editing.cost30d) * 30))}` : "defina um valor"}.
              </p>
            </div>
          )}
        </Drawer>

        <Drawer
          open={creating}
          onClose={() => setCreating(false)}
          title="Criar chave de API"
          kicker="Governança"
          footer={
            newKey ? (
              <Button onClick={() => setCreating(false)}>Concluir</Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => setCreating(false)}>
                  Cancelar
                </Button>
                <OperationButton
                  operation={keyOp}
                  onClick={() => {
                    setTried(true);
                    if (!keyName.trim()) return;
                    void keyOp.run(() => wait(700), `Chave “${keyName.trim()}” criada`).then((err) => {
                      if (err) return;
                      const prefix = `g4a_live_${Math.random().toString(16).slice(2, 6)}`;
                      setKeys((k) => [{ id: `k${Date.now()}`, name: keyName.trim(), prefix, scope: keyScope === "rascunhos" ? "Somente agentes em rascunho" : keyScope === "financeiro" ? "Disparar agentes de Financeiro e Fiscal" : "Disparar todos os agentes", createdBy: "joana", lastUsed: "nunca" }, ...k]);
                      setNewKey(`${prefix}${Math.random().toString(36).slice(2, 14)}${Math.random().toString(36).slice(2, 14)}`);
                    });
                  }}
                >
                  Criar chave
                </OperationButton>
              </>
            )
          }
        >
          {newKey ? (
            <div className="space-y-3">
              <Callout tone="warn" title="Copie agora">
                Esta é a única vez que a chave aparece inteira. Guarde no cofre de senhas do sistema que vai usá-la.
              </Callout>
              <div className="flex items-center gap-2 rounded-lg border border-line bg-soft px-3 py-2">
                <code className="min-w-0 flex-1 truncate font-mono text-[12.5px]">{newKey}</code>
                <CopyButton value={newKey} label="Copiar chave" />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <OperationFeedback operation={keyOp} />
              <TextField label="Nome" value={keyName} onChange={setKeyName} placeholder="Ex.: ERP Nexo (homologação)" error={tried && !keyName.trim() ? "Dê um nome para saber de onde vêm as chamadas." : undefined} />
              <Select
                label="O que a chave pode fazer"
                value={keyScope}
                onValueChange={setKeyScope}
                options={[
                  { value: "rascunhos", label: "Somente agentes em rascunho" },
                  { value: "financeiro", label: "Agentes de Financeiro e Fiscal" },
                  { value: "todos", label: "Todos os agentes" },
                ]}
              />
            </div>
          )}
        </Drawer>

        <ConfirmDialog
          open={confirmModel}
          onClose={() => setConfirmModel(false)}
          onConfirm={() => {
            setConfirmModel(false);
            setModels((all) => all.map((x) => (x.dataInBrazil ? x : { ...x, allowed: true })));
            notify("G4 Mini permitido só para agentes sem dados pessoais");
          }}
          title="Permitir um modelo que roda fora do Brasil?"
          description="O G4 Mini é hospedado nos EUA. Agentes que leem dados pessoais (clientes, candidatos, colaboradores) continuam bloqueados para ele; os demais poderão escolhê-lo."
          confirmLabel="Permitir com restrição"
        />
        <ConfirmDialog
          open={confirmMove}
          onClose={() => setConfirmMove(false)}
          onConfirm={() => {
            setConfirmMove(false);
            setMoved(true);
            notify(`${outside.map((a) => a.name).join(", ")} passa a rodar em São Paulo a partir da próxima execução`, () => setMoved(false));
          }}
          title="Mover para a região de São Paulo?"
          description="A próxima execução já roda no Brasil. A latência para Meta Ads e Google Ads sobe cerca de 120 ms por chamada; o custo não muda."
          confirmLabel="Mover para São Paulo"
        />
        <ConfirmDialog
          open={!!revoking}
          onClose={() => setRevoking(null)}
          onConfirm={() => {
            if (!revoking) return;
            const k = revoking;
            setKeys((all) => all.filter((x) => x.id !== k.id));
            setRevoking(null);
            notify(`Chave “${k.name}” revogada`);
          }}
          title={revoking ? `Revogar “${revoking.name}”?` : "Revogar chave?"}
          description="Chamadas com esta chave passam a ser recusadas na hora. Isso não pode ser desfeito: para voltar, crie uma chave nova."
          confirmLabel="Revogar chave"
          tone="danger"
        />
      </Page>
    </AgentShell>
  );
}
