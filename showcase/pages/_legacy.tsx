import {
  AlertTriangle,
  Archive,
  Bell,
  Building2,
  CalendarDays,
  Download,
  Pencil,
  Plus,
  Settings,
  Trash2,
  Users,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import {
  ActionMenu,
  Avatar,
  AvatarGroup,
  Badge,
  Breadcrumb,
  Button,
  Callout,
  Card,
  CardAction,
  Checkbox,
  Combobox,
  ConfirmDialog,
  CriticalFlag,
  DataTable,
  DatePicker,
  DisplayControls,
  Dot,
  Drawer,
  Empty,
  EntityHeader,
  EntityMark,
  FacetFilter,
  FactLine,
  Field,
  FieldBlock,
  FieldGrid,
  FilterChip,
  HealthDot,
  IconButton,
  KanbanBoard,
  KanbanCard,
  KanbanColumn,
  Kbd,
  LinkedCard,
  ListPanel,
  ListRow,
  Meter,
  Metric,
  Modal,
  NextStep,
  OperationButton,
  OperationFeedback,
  PageHeading,
  Popover,
  SegmentedControl,
  Select,
  Skeleton,
  StatCell,
  StatGrid,
  StatusBar,
  StatusLabel,
  Stepper,
  Switch,
  TableToolbar,
  Tabs,
  Timeline,
  UncertainFailure,
  areaClass,
  fieldClass,
  notify,
  statusColor,
  tokens,
  useOperation,
  type Column,
  type CollectionView,
  type Density,
  type WorkStatus,
} from "@g4ai/ds";

/* ------------------------------------------------------------------ */
/* Dados de exemplo                                                    */
/* ------------------------------------------------------------------ */

const people = [
  { value: "ana", label: "Ana Beatriz Lopes", description: "Gerente de projetos" },
  { value: "bruno", label: "Bruno Takeda", description: "Analista" },
  { value: "carla", label: "Carla Nogueira", description: "Líder de squad" },
  { value: "diego", label: "Diego Araújo", description: "Especialista em dados" },
  { value: "elisa", label: "Elisa Monteiro", description: "Analista" },
];

type Row = { id: string; name: string; owner: string; initials: string; status: WorkStatus; due: string; progress: number; critical?: boolean };
const rows: Row[] = [
  { id: "1", name: "Levantamento de requisitos", owner: "Ana Beatriz Lopes", initials: "AL", status: "done", due: "12/09", progress: 100 },
  { id: "2", name: "Mapa de processos de vendas", owner: "Bruno Takeda", initials: "BT", status: "active", due: "03/10", progress: 60 },
  { id: "3", name: "Configurar integrações", owner: "Carla Nogueira", initials: "CN", status: "review", due: "30/09", progress: 85 },
  { id: "4", name: "Painel de indicadores", owner: "Diego Araújo", initials: "DA", status: "blocked", due: "25/09", progress: 30, critical: true },
  { id: "5", name: "Treinamento do time", owner: "Elisa Monteiro", initials: "EM", status: "queued", due: "15/10", progress: 0 },
];

const statusOptions = [
  { value: "queued", label: "Na fila" },
  { value: "active", label: "Em curso" },
  { value: "review", label: "Em revisão" },
  { value: "done", label: "Concluído" },
  { value: "blocked", label: "Bloqueado" },
].map((o) => ({ ...o, icon: <span className="h-1.5 w-1.5 rounded-full" style={{ background: statusColor[o.value as WorkStatus] }} /> }));

/* ------------------------------------------------------------------ */
/* Moldura de documentação                                             */
/* ------------------------------------------------------------------ */

function Block({ id, title, rule, children }: { id: string; title: string; rule?: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-6 border-t border-line py-10 first:border-t-0">
      <h2 className="m-0 text-[18px] font-semibold tracking-tight">{title}</h2>
      {rule && <p className="m-0 mt-1.5 max-w-[680px] text-[13px] leading-relaxed text-muted">{rule}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}
function Specimen({ label, children, className }: { label?: string; children: ReactNode; className?: string }) {
  return (
    <div className="min-w-0">
      {label && <p className="m-0 mb-2 text-[11px] font-medium uppercase tracking-[0.08em] text-muted">{label}</p>}
      <div className={className ?? "flex flex-wrap items-center gap-3 rounded-xl border border-line bg-surface p-5"}>{children}</div>
    </div>
  );
}
function Swatch({ name, value, text = "#202124" }: { name: string; value: string; text?: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface">
      <div className="h-14 border-b border-line" style={{ background: value, color: text }} />
      <div className="px-3 py-2">
        <div className="text-[12.5px] font-medium">{name}</div>
        <div className="font-mono text-[11px] text-muted">{value}</div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Seções                                                              */
/* ------------------------------------------------------------------ */

export function Foundations() {
  const c = tokens.color;
  return (
    <>
      <Block id="cor" title="Cor" rule="Neutros brancos e gelo fazem 90 % da tela. Ação principal e seleção usam tinta escura, não cor. Dourado só preenche (progresso, foco, próximo passo); texto dourado usa accent-deep.">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {(["page", "soft", "rail", "line", "lineStrong", "muted", "inkSoft", "ink", "navy", "blue", "accent", "accentDeep", "accentSoft", "clay"] as const).map((k) => (
            <Swatch key={k} name={k} value={c[k]} />
          ))}
        </div>
        <p className="m-0 mb-3 mt-6 text-[12px] font-medium text-muted">Semânticas (forte / suave)</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(["ok", "amber", "rose", "info"] as const).map((k) => (
            <div key={k} className="grid grid-cols-2 gap-2">
              <Swatch name={k} value={c[k]} />
              <Swatch name={`${k}Soft`} value={c[`${k}Soft`]} />
            </div>
          ))}
        </div>
        <p className="m-0 mb-3 mt-6 text-[12px] font-medium text-muted">Status de trabalho (ordem fixa)</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {(Object.keys(statusColor) as WorkStatus[]).map((k) => (
            <Swatch key={k} name={k} value={statusColor[k]} />
          ))}
        </div>
      </Block>

      <Block id="tipografia" title="Tipografia" rule="Figtree. Escala nomeada por papel, não por tamanho. 13.5px é o corpo; 12px o metadado. Peso 500 para ênfase, 600 só em títulos e números.">
        <div className="divide-y divide-line rounded-xl border border-line bg-surface">
          {(Object.entries(tokens.text) as [string, number][]).reverse().map(([name, px]) => (
            <div key={name} className="flex items-baseline gap-6 px-5 py-3">
              <code className="w-24 shrink-0 font-mono text-[11px] text-muted">text-{name}</code>
              <code className="w-12 shrink-0 font-mono text-[11px] text-muted">{px}px</code>
              <span style={{ fontSize: px, fontWeight: px >= 18 ? 600 : 400, letterSpacing: px >= 18 ? "-0.01em" : undefined }} className="truncate">
                Pedido #4821 · Implantação do ERP
              </span>
            </div>
          ))}
        </div>
      </Block>

      <Block id="forma" title="Forma, espaço e profundidade" rule="Bordas separam superfícies; sombra só em elementos que flutuam (popup, toast, drawer). Gaps preferidos: 8, 12, 6, 4, 16px.">
        <div className="grid gap-4 sm:grid-cols-5">
          {(Object.entries(tokens.radius) as [string, number][]).map(([k, r]) => (
            <div key={k} className="text-center">
              <div className="mx-auto h-16 w-full border border-line-strong bg-soft" style={{ borderRadius: r }} />
              <div className="mt-2 text-[12.5px] font-medium">rounded-{k}</div>
              <div className="font-mono text-[11px] text-muted">{r}px</div>
            </div>
          ))}
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-4">
          {[
            ["shadow-surface", "Card em repouso"],
            ["shadow-raised", "Card em hover"],
            ["shadow-popup", "Menu, select, popover"],
            ["shadow-overlay", "Modal, drawer"],
          ].map(([cls, use]) => (
            <div key={cls} className={`rounded-xl border border-line bg-surface p-4 text-[12.5px] ${cls}`}>
              <div className="font-mono text-[11px]">{cls}</div>
              <div className="mt-1 text-muted">{use}</div>
            </div>
          ))}
        </div>
      </Block>
    </>
  );
}

export function Actions() {
  const [chips, setChips] = useState({ mine: true, late: false });
  return (
    <Block id="acoes" title="Botões e ações" rule="Um primário (tinta) por área. Demais ações em ghost. Destrutivo só dentro de confirmação. Ações secundárias de linha vão no menu ⋯.">
      <div className="grid gap-4 lg:grid-cols-2">
        <Specimen label="Variantes">
          <Button>
            <Plus /> Nova tarefa
          </Button>
          <Button variant="ghost">
            <Download /> Exportar
          </Button>
          <Button variant="quiet">Cancelar</Button>
          <Button variant="danger">Excluir projeto</Button>
          <Button disabled>Desabilitado</Button>
        </Specimen>
        <Specimen label="Tamanho sm · ícone · split · menu">
          <Button size="sm">Salvar</Button>
          <Button size="sm" variant="ghost">
            Descartar
          </Button>
          <IconButton label="Editar">
            <Pencil />
          </IconButton>
          <span className="inline-flex">
            <Button variant="split-left" size="sm">
              Registrar
            </Button>
            <Button variant="split-right" size="sm" aria-label="Outras formas de registrar">
              <Plus />
            </Button>
          </span>
          <ActionMenu
            actions={[
              { label: "Editar", icon: <Pencil /> },
              { label: "Arquivar", icon: <Archive />, onSelect: () => notify("Tarefa arquivada", () => notify("Arquivamento desfeito", undefined, "info")) },
              { label: "Excluir", icon: <Trash2 />, tone: "danger", separator: true },
            ]}
          />
        </Specimen>
        <Specimen label="Filtros binários">
          <FilterChip on={chips.mine} onClick={() => setChips((c) => ({ ...c, mine: !c.mine }))}>
            Minhas
          </FilterChip>
          <FilterChip on={chips.late} onClick={() => setChips((c) => ({ ...c, late: !c.late }))}>
            Atrasadas
          </FilterChip>
          <span className="text-[12px] text-muted">
            Atalho <Kbd>⌘</Kbd> <Kbd>K</Kbd>
          </span>
        </Specimen>
        <Specimen label="Popover explicativo">
          <Popover trigger={<><AlertTriangle className="h-3.5 w-3.5 text-amber" /> Atenção</>} triggerLabel="Por que atenção" title="Por que este cliente está em atenção">
            <p className="m-0 text-[13px] leading-relaxed text-muted">Duas tarefas atrasadas há mais de 7 dias e nenhuma interação nas últimas duas semanas.</p>
          </Popover>
        </Specimen>
      </div>
    </Block>
  );
}

export function Display() {
  return (
    <Block id="exibicao" title="Identidade, estado e números" rule="Cor sempre acompanhada de palavra. Badge neutro é o padrão. Número bom não grita: só warn/bad pintam o valor.">
      <div className="grid gap-4 lg:grid-cols-2">
        <Specimen label="Pessoas e entidades">
          <Avatar initials="AL" name="Ana Beatriz Lopes" tint="#202124" />
          <Avatar initials="BT" name="Bruno Takeda" />
          <Avatar initials="CN" name="Carla" size="lg" />
          <AvatarGroup people={rows.map((r) => ({ name: r.owner, initials: r.initials }))} max={3} />
          <EntityMark name="Santa Clara Alimentos" tint="#842e20" />
          <EntityMark name="Rede Horizonte" tint="#184560" />
        </Specimen>
        <Specimen label="Badges e pontos">
          <Badge>Rascunho</Badge>
          <Badge tone="ok">Ativo</Badge>
          <Badge tone="warn">Atenção</Badge>
          <Badge tone="bad">Em risco</Badge>
          <Badge tone="info">Novo</Badge>
          <Badge tone="accent">Premium</Badge>
          <span className="inline-flex items-center gap-1.5 text-[12.5px]">
            <Dot tone="ok" label="Saudável" /> Saudável
          </span>
          <span className="text-[13.5px] font-medium">
            Painel de indicadores
            <CriticalFlag />
          </span>
        </Specimen>
        <Specimen label="Status e saúde">
          {(Object.keys(statusColor) as WorkStatus[]).map((s) => (
            <StatusLabel key={s} status={s} />
          ))}
          <HealthDot tone="ok" label="Saudável" />
          <HealthDot tone="warn" label="Atenção" />
          <HealthDot tone="bad" label="Em risco" />
        </Specimen>
        <Specimen label="Progresso">
          <div className="w-full space-y-3">
            <Meter value={62} tone="accent" thick label="Progresso do projeto" />
            <Meter value={40} label="Neutro" />
            <StatusBar counts={{ done: 8, active: 4, review: 2, queued: 5, blocked: 1 }} />
          </div>
        </Specimen>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Clientes ativos" value="24" icon={<Building2 />} />
        <Metric label="Tarefas no prazo" value="87%" icon={<CalendarDays />} tone="ok" bar={87} />
        <Metric label="Alertas abertos" value="6" icon={<Bell />} tone="warn" hint="2 novos hoje" />
        <Metric label="Bloqueios" value="3" icon={<AlertTriangle />} tone="bad" />
      </div>
      <div className="mt-4">
        <StatGrid cols={4}>
          <StatCell label="Horas alocadas" value="312h" hint="de 360h" />
          <StatCell label="Etapas" value="3 de 4" />
          <StatCell label="Atrasadas" value="2" tone="warn" />
          <StatCell label="NPS" value="72" tone="ok" />
        </StatGrid>
      </div>
    </Block>
  );
}

export function Surfaces() {
  const [modal, setModal] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [owner, setOwner] = useState("ana");
  const [status, setStatus] = useState("active");
  const [due, setDue] = useState("2026-10-03");
  return (
    <Block id="superficies" title="Cards e superfícies sobrepostas" rule="Drawer para editar sem perder a lista. Modal para decisão curta. Confirmação para o irreversível. Drawer nunca abre outro drawer.">
      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <p className="m-0 text-[12px] text-muted">Card estático</p>
          <p className="m-0 mt-1 text-[14px] font-medium">Sem interação, sem hover.</p>
        </Card>
        <Card href="#superficies">
          <p className="m-0 text-[14px] font-medium">Card clicável</p>
          <p className="m-0 mt-1 text-[12.5px] text-muted">Hover escurece a borda.</p>
          <CardAction>Abrir</CardAction>
        </Card>
        <LinkedCard href="#superficies" title="Card com link + ações" aside={<ActionMenu actions={[{ label: "Editar" }, { label: "Excluir", tone: "danger", separator: true }]} />}>
          <FactLine facts={[{ label: "Prazo", value: "03/10" }, { label: "Resp.", value: "Bruno" }]} />
        </LinkedCard>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="ghost" onClick={() => setDrawer(true)}>
          Abrir drawer
        </Button>
        <Button variant="ghost" onClick={() => setModal(true)}>
          Abrir modal
        </Button>
        <Button variant="ghost" onClick={() => setConfirm(true)}>
          Confirmação destrutiva
        </Button>
      </div>
      <Modal
        open={modal}
        onClose={() => setModal(false)}
        kicker="Implantação do ERP"
        title="Mover tarefa para outra etapa"
        description="A tarefa leva junto comentários e anexos."
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setModal(false)}>
              Cancelar
            </Button>
            <Button size="sm" onClick={() => { setModal(false); notify("Tarefa movida para Execução"); }}>
              Mover tarefa
            </Button>
          </>
        }
      >
        <FieldBlock label="Etapa de destino">
          <Select label="Etapa de destino" value="c3" onValueChange={() => undefined} options={[{ value: "c3", label: "Execução · out–nov" }, { value: "c4", label: "Go-live · dez" }]} />
        </FieldBlock>
      </Modal>
      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={() => notify("Projeto excluído")}
        tone="danger"
        title="Excluir o projeto Implantação do ERP?"
        description="As 8 tarefas e 23 anexos do projeto serão apagados. Isso não pode ser desfeito."
        confirmLabel="Excluir projeto"
      />
      <Drawer
        open={drawer}
        onClose={() => setDrawer(false)}
        kicker="Santa Clara Alimentos · Implantação do ERP"
        title="Editar tarefa"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDrawer(false)}>
              Cancelar
            </Button>
            <Button onClick={() => { setDrawer(false); notify("Tarefa atualizada"); }}>Salvar tarefa</Button>
          </>
        }
      >
        <FieldBlock label="Título">
          <input className={fieldClass} defaultValue="Mapa de processos de vendas" />
        </FieldBlock>
        <FieldGrid>
          <FieldBlock label="Responsável">
            <Combobox label="Responsável" options={people} value={owner} onValueChange={setOwner} />
          </FieldBlock>
          <FieldBlock label="Status">
            <Select label="Status" options={statusOptions} value={status} onValueChange={setStatus} />
          </FieldBlock>
        </FieldGrid>
        <FieldBlock label="Prazo">
          <DatePicker label="Prazo" value={due} onValueChange={setDue} />
        </FieldBlock>
        <FieldBlock label="Descrição" optional hint="Aparece para o cliente no portal.">
          <textarea className={areaClass} rows={4} />
        </FieldBlock>
      </Drawer>
    </Block>
  );
}

export function Forms() {
  const [owner, setOwner] = useState("");
  const [team, setTeam] = useState<string[]>(["ana", "carla"]);
  const [status, setStatus] = useState("review");
  const [due, setDue] = useState("");
  const [notify1, setNotify1] = useState(true);
  const [done, setDone] = useState(false);
  const op = useOperation({ busyLabel: "Salvando…" });
  const [fail, setFail] = useState<"none" | "refused" | "uncertain">("none");
  return (
    <Block id="formularios" title="Formulários" rule="Rótulo sempre visível acima. Nenhum select nativo. Lista curta → Select; entidades → Combobox com busca. Enquanto salva, o botão informa; erro vira bloco com saída.">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-line bg-surface p-5">
          <FieldBlock label="Título da tarefa" hint="Use o resultado, não a atividade: “Contrato assinado”.">
            <input className={fieldClass} placeholder="Ex.: Contrato de fornecimento assinado" />
          </FieldBlock>
          <FieldBlock label="E-mail do contato" error="Informe um e-mail válido, como nome@empresa.com.">
            <input className={fieldClass} defaultValue="joao@" />
          </FieldBlock>
          <FieldGrid>
            <FieldBlock label="Responsável">
              <Combobox label="Responsável" options={people} value={owner} onValueChange={setOwner} placeholder="Escolha uma pessoa" />
            </FieldBlock>
            <FieldBlock label="Status">
              <Select label="Status" options={statusOptions} value={status} onValueChange={setStatus} />
            </FieldBlock>
          </FieldGrid>
          <FieldBlock label="Equipe">
            <Combobox multiple label="Equipe" options={people} value={team} onValueChange={setTeam} />
          </FieldBlock>
          <FieldBlock label="Prazo" optional>
            <DatePicker label="Prazo" value={due} onValueChange={setDue} />
          </FieldBlock>
        </div>
        <div className="space-y-4">
          <Specimen label="Checkbox e switch">
            <Checkbox checked={done} onCheckedChange={setDone} label="Concluir">
              Marcar como concluída
            </Checkbox>
            <Checkbox checked={false} indeterminate onCheckedChange={() => undefined} label="Parcial">
              Seleção parcial
            </Checkbox>
            <Switch label="Avisar por e-mail" checked={notify1} onCheckedChange={setNotify1} />
          </Specimen>
          <Specimen label="Select compacto com tom (linha de tabela)">
            <Select size="compact" tone="warn" label="Prioridade" value="alta" onValueChange={() => undefined} options={[{ value: "alta", label: "Alta" }, { value: "media", label: "Média" }]} />
            <Select size="compact" label="Fase" value="d" onValueChange={() => undefined} options={[{ value: "d", label: "Planejamento" }, { value: "e", label: "Execução" }]} />
          </Specimen>
          <Specimen label="Operação confirmada" className="rounded-xl border border-line bg-surface p-5">
            <div className="w-full">
              <SegmentedControl
                label="Simular resposta"
                value={fail}
                onChange={(v) => { setFail(v); op.reset(); }}
                options={[
                  { value: "none", label: "Sucesso" },
                  { value: "refused", label: "Recusa" },
                  { value: "uncertain", label: "Incerta" },
                ]}
              />
              <div className="mt-4">
                <OperationFeedback operation={op} />
                <OperationButton
                  operation={op}
                  onClick={() =>
                    void op.run(
                      () =>
                        new Promise((res, rej) =>
                          setTimeout(() => {
                            if (fail === "refused") rej(new Error("Outra pessoa alterou esta tarefa. Recarregue e tente de novo."));
                            else if (fail === "uncertain") rej(new UncertainFailure("A conexão caiu antes da resposta. A alteração pode ter sido salva."));
                            else res(null);
                          }, 900),
                        ),
                      { message: "Tarefa salva", undo: () => notify("Alteração desfeita", undefined, "info") },
                    )
                  }
                >
                  Salvar tarefa
                </OperationButton>
              </div>
            </div>
          </Specimen>
          <Callout tone="warn" title="Integração com Google desconectada" action={<Button size="sm" variant="ghost">Reconectar</Button>}>
            Reuniões novas não serão importadas até reconectar.
          </Callout>
        </div>
      </div>
    </Block>
  );
}

export function Navigation() {
  const [tab, setTab] = useState("visao");
  const [seg, setSeg] = useState<"plano" | "ciclos" | "cronograma">("plano");
  return (
    <Block id="navegacao" title="Navegação e cabeçalhos" rule="Trilha só com ancestrais. Abas para seções de uma entidade; controle segmentado para trocar visualização. Cabeçalhos grudam e compactam ao rolar.">
      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        <EntityHeader
          name="Santa Clara Alimentos"
          tint="#842e20"
          crumbs={[{ label: "Clientes", href: "#" }]}
          description="Implantação do ERP · Etapa 2 de 4 · Responsável Ana Beatriz Lopes"
          meta={<HealthDot tone="warn" label="Atenção" />}
          actions={
            <>
              <AvatarGroup people={rows.slice(0, 3).map((r) => ({ name: r.owner, initials: r.initials }))} />
              <Button size="sm" variant="ghost">
                <Users /> <span data-collapse-label="">Pessoas</span>
              </Button>
              <ActionMenu actions={[{ label: "Configurar serviço", icon: <Settings /> }]} />
            </>
          }
          tabs={[
            { id: "visao", label: "Visão geral" },
            { id: "entregas", label: "Tarefas" },
            { id: "reunioes", label: "Reuniões" },
            { id: "alertas", label: "Alertas", count: 2 },
          ]}
          activeTab={tab}
          onTabChange={setTab}
        />
        <div className="p-6">
          <PageHeading
            sticky={false}
            compact
            title="Tarefas"
            description="Tudo o que precisa acontecer, por etapa."
            actions={
              <SegmentedControl
                label="Visualização"
                value={seg}
                onChange={setSeg}
                options={[
                  { value: "plano", label: "Plano" },
                  { value: "ciclos", label: "Etapas" },
                  { value: "cronograma", label: "Cronograma" },
                ]}
              />
            }
          />
        </div>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Specimen label="Trilha">
          <Breadcrumb items={[{ label: "Contas", href: "#" }, { label: "Santa Clara", href: "#" }, { label: "Implantação", href: "#" }]} />
        </Specimen>
        <Specimen label="Abas soltas">
          <Tabs label="Seções" value="a" items={[{ id: "a", label: "Dados" }, { id: "b", label: "Permissões" }, { id: "c", label: "Histórico" }]} />
        </Specimen>
      </div>
      <div className="mt-4">
        <Specimen label="Etapas e próximo passo" className="space-y-5 rounded-xl border border-line bg-surface p-5">
          <Stepper
            steps={[
              { id: "1", label: "Planejamento", hint: "Concluído 12/09", state: "done" },
              { id: "2", label: "Plano", hint: "Concluído 19/09", state: "done" },
              { id: "3", label: "Execução", hint: "Até 24/10", state: "current" },
              { id: "4", label: "Revisão", state: "upcoming" },
              { id: "5", label: "Encerramento", state: "upcoming" },
            ]}
          />
          <NextStep title="Validar o escopo com o diretor financeiro" action={<Button size="sm">Agendar reunião</Button>}>
            Sem essa validação, o treinamento do time não pode começar.
          </NextStep>
        </Specimen>
      </div>
    </Block>
  );
}

export function Collections() {
  const [q, setQ] = useState("");
  const [owners, setOwners] = useState<string[]>([]);
  const [st, setSt] = useState<string[]>([]);
  const [view, setView] = useState<CollectionView>("list");
  const [density, setDensity] = useState<Density>("comfortable");
  const many = [...rows, ...rows.map((r) => ({ ...r, id: r.id + "b", name: r.name + " (fase 2)" })), ...rows.map((r) => ({ ...r, id: r.id + "c", name: r.name + " (fase 3)" }))];
  const filtered = many.filter(
    (r) =>
      r.name.toLowerCase().includes(q.toLowerCase()) &&
      (!owners.length || owners.includes(r.initials)) &&
      (!st.length || st.includes(r.status)),
  );
  const columns: Column<Row>[] = [
    { key: "name", header: "Tarefa", primary: true, cell: (r) => <>{r.name}{r.critical && <CriticalFlag />}</> },
    { key: "owner", header: "Responsável", cell: (r) => <span className="inline-flex items-center gap-2"><Avatar size="sm" initials={r.initials} name={r.owner} />{r.owner.split(" ")[0]}</span> },
    { key: "status", header: "Status", nowrap: true, cell: (r) => <StatusLabel status={r.status} /> },
    { key: "progress", header: "Progresso", mobileHidden: true, cell: (r) => <div className="w-24"><Meter value={r.progress} tone="accent" thick /></div> },
    { key: "due", header: "Prazo", nowrap: true, align: "right", cell: (r) => <span className="tabular-nums">{r.due}</span> },
    { key: "act", header: "", action: true, cell: () => <ActionMenu actions={[{ label: "Editar" }, { label: "Excluir", tone: "danger", separator: true }]} /> },
  ];
  return (
    <Block id="colecoes" title="Coleções: tabela, filtros, kanban" rule="Controles só quando há o que controlar: busca ≥ 12 itens, filtro por atributo ≥ 8, alternador ≥ 8. A tabela vira blocos rotulados abaixo de 1024px.">
      <div className="space-y-4">
        <TableToolbar
          query={q}
          onQuery={setQ}
          placeholder="Filtrar tarefas…"
          shown={filtered.length}
          total={many.length}
          noun="tarefa"
          dirty={Boolean(q || owners.length || st.length)}
          onClear={() => { setQ(""); setOwners([]); setSt([]); }}
        >
          <FacetFilter label="Responsável" options={rows.map((r) => ({ id: r.initials, label: r.owner, count: many.filter((m) => m.initials === r.initials && (!st.length || st.includes(m.status))).length }))} value={owners} onChange={setOwners} align="left" />
          <FacetFilter label="Status" options={statusOptions.map((o) => ({ value: o.value, label: o.label, icon: o.icon, count: many.filter((m) => m.status === o.value && (!owners.length || owners.includes(m.initials))).length }))} value={st} onChange={setSt} align="left" />
          <DisplayControls view={view} onView={setView} density={density} onDensity={setDensity} />
        </TableToolbar>
        <DataTable
          rows={filtered}
          columns={columns}
          rowKey={(r) => r.id}
          onRowClick={(r) => notify(`Abrir “${r.name}”`, undefined, "info")}
          rowLabel={(r) => `Abrir ${r.name}`}
          view={view === "cards" ? "cards" : "list"}
          density={density}
          empty={<Empty framed={false} title="Nenhuma tarefa com esses filtros" hint="Limpe os filtros para ver todas." />}
        />
      </div>
      <div className="mt-8">
        <KanbanBoard>
          {(["queued", "active", "review", "done"] as WorkStatus[]).map((s) => {
            const items = rows.filter((r) => r.status === s || (s === "active" && r.status === "blocked"));
            return (
              <KanbanColumn key={s} title={{ queued: "Na fila", active: "Em curso", review: "Em revisão", done: "Concluído", blocked: "" }[s]} count={items.length} dotColor={statusColor[s]}>
                {items.map((r) => (
                  <KanbanCard key={r.id} title={r.name} flag={r.critical ? <CriticalFlag /> : undefined} owner={{ name: r.owner, initials: r.initials }} due={r.due} dueOverdue={r.status === "blocked"} blocked={r.status === "blocked"} />
                ))}
              </KanbanColumn>
            );
          })}
        </KanbanBoard>
      </div>
      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <ListPanel title="Pendências" icon={<AlertTriangle />} count={3} tone="attention" action={<a href="#">Ver todas</a>}>
          <div className="divide-y divide-line">
            <ListRow href="#" leading={<Dot tone="bad" />} kicker="Santa Clara · Implantação" title="Painel de indicadores bloqueado" meta="há 5 dias" />
            <ListRow href="#" leading={<Dot tone="warn" />} kicker="Rede Horizonte" title="Sem reunião há 14 dias" meta="há 2 dias" />
            <ListRow href="#" leading={<Dot tone="warn" />} kicker="Vértice Log" title="Contrato vence em 10 dias" meta="hoje" />
          </div>
        </ListPanel>
        <ListPanel title="Próximas reuniões" icon={<CalendarDays />} count={12} action={<a href="#">Agenda</a>}>
          <div className="divide-y divide-line">
            <ListRow href="#" leading={<EntityMark name="Santa Clara" tint="#842e20" className="h-7 w-7 text-[11px]" />} kicker="Hoje · 14:00" title="Checkpoint semanal" meta="45 min" />
            <ListRow href="#" leading={<EntityMark name="Rede Horizonte" tint="#184560" className="h-7 w-7 text-[11px]" />} kicker="Amanhã · 10:00" title="Kickoff do projeto" meta="1h" />
          </div>
        </ListPanel>
      </div>
    </Block>
  );
}

export function States() {
  return (
    <Block id="estados" title="Vazio, carregando, histórico" rule="Vazio diz o que falta e oferece a próxima ação. Esqueleto tem a forma do conteúdo final.">
      <div className="grid gap-4 lg:grid-cols-3">
        <Empty title="Nenhuma reunião registrada" hint="Conecte o Google Agenda ou registre a primeira reunião manualmente." action={<Button size="sm"><Plus /> Registrar reunião</Button>} />
        <div className="space-y-3 rounded-xl border border-line bg-surface p-5">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-3 w-5/6" />
          <Skeleton className="mt-4 h-8 w-28" />
        </div>
        <div className="rounded-xl border border-line bg-surface p-5">
          <Timeline
            items={[
              { id: "1", title: "Tarefa aprovada", meta: "hoje 10:12", tone: "ok", body: "Mapa de processos aprovado pelo cliente." },
              { id: "2", title: "Prazo alterado", meta: "ontem", tone: "warn" },
              { id: "3", title: "Projeto iniciado", meta: "01/09" },
            ]}
          />
        </div>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Contato principal">Marina Farias · Diretora comercial</Field>
        <Field label="Plano">Enterprise anual</Field>
      </div>
    </Block>
  );
}

/* ------------------------------------------------------------------ */
/* App                                                                 */
/* ------------------------------------------------------------------ */

