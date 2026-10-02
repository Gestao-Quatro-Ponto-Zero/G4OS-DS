import { CalendarClock, Globe, Mail, Phone, Plus, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import {
  ActionMenu,
  Avatar,
  Badge,
  Button,
  Combobox,
  ConfirmDialog,
  DataTable,
  Drawer,
  Empty,
  EntityMark,
  FieldBlock,
  FieldGrid,
  KpiCard,
  KpiGrid,
  Modal,
  OperationButton,
  OperationFeedback,
  Page,
  PageHeading,
  PropertyList,
  Select,
  SplitLayout,
  Tabs,
  TextField,
  formatCurrency,
  formatDate,
  notify,
  useOperation,
  type Column,
} from "@g4ai/ds";
import { activities, activityLabel, companies, companyById, contactsOf, daysFromToday, dealsOf, go, repById, reps, stageById, useFrameParam, type Company, type Deal, type Lifecycle } from "./data/crm";
import { CrmShell, NewDealModal } from "./shells/crm-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Página da empresa",
  description: "Conta (?id=): indicadores, negócios, contatos e atividades da empresa, propriedades na lateral e novo negócio já vinculado.",
  category: "CRM",
  order: 5,
  height: 960,
  concept: {
    goal: "Ver uma conta inteira (negócios, contatos, atividades) para preparar uma reunião ou decidir o próximo passo.",
    patterns: [
      "Anatomia C · Registro: cabeçalho fixo; propriedades fixas à direita (SplitLayout)",
      "KPIs da conta no topo; abas para negócios, contatos e atividades",
      "Novo negócio já vinculado à empresa",
      "Editar em gaveta; mesclar duplicada = escolher a outra empresa + confirmação irreversível",
    ],
    adapt: [
      "Cliente no ERP, conta no SaaS, fornecedor",
    ],
    avoid: [
      "Repetir na aba o que já está nas propriedades",
    ],
  },
} as const;

const here = "#/frame/crm-contacts";
const lifecycleTone = { Lead: "neutral", Oportunidade: "info", Cliente: "ok", "Ex-cliente": "warn" } as const;
const lifecycles: Lifecycle[] = ["Lead", "Oportunidade", "Cliente", "Ex-cliente"];
const sizes = ["1–10", "11–50", "51–200", "201–500", "501–1.000", "1.000+"];
const industries = [...new Set(companies.map((c) => c.industry))].sort();
/** Simula a chamada à API (troque pelo seu fetch). */
const save = () => new Promise<void>((resolve) => setTimeout(resolve, 600));
/** Possíveis duplicadas: mesmo domínio, mesma raiz do nome ou mesma cidade e setor. */
const duplicateScore = (a: Company, b: Company) =>
  (a.domain.split(".")[0] === b.domain.split(".")[0] ? 3 : 0) + (a.name.split(" ")[0] === b.name.split(" ")[0] ? 2 : 0) + (a.city === b.city && a.industry === b.industry ? 1 : 0);

export default function CrmCompany() {
  const id = useFrameParam("id");
  const estado = useFrameParam("estado");
  const base = companyById(id);
  const [company, setCompany] = useState<Company>(base);
  const [tab, setTab] = useState("negocios");
  const [deals, setDeals] = useState<Deal[]>(() => dealsOf(base.id));
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Company>(base);
  const [tried, setTried] = useState(false);
  const [merging, setMerging] = useState(false);
  const [duplicate, setDuplicate] = useState("");
  const [confirmMerge, setConfirmMerge] = useState(false);
  const [merged, setMerged] = useState<string[]>([]);
  const editOp = useOperation();
  useEffect(() => {
    setCompany(base);
    setDeals(dealsOf(base.id));
    setMerged([]);
  }, [base]);

  const people = [company.id, ...merged].flatMap(contactsOf);
  const acts = activities.filter((a) => a.companyId === company.id || merged.includes(a.companyId)).sort((a, b) => a.due.localeCompare(b.due));
  const candidates = companies.filter((c) => c.id !== company.id && !merged.includes(c.id)).sort((a, b) => duplicateScore(company, b) - duplicateScore(company, a));
  const dup = companies.find((c) => c.id === duplicate);

  const submitEdit = async () => {
    setTried(true);
    if (!draft.name.trim()) return;
    const before = company;
    const next = { ...draft, name: draft.name.trim() };
    const failed = await editOp.run(save, { message: `${next.name} atualizada`, undo: () => setCompany(before) }, { apply: () => setCompany(next), revert: () => setCompany(before) });
    if (!failed) setEditing(false);
  };
  const doMerge = () => {
    if (!dup) return;
    setConfirmMerge(false);
    setMerging(false);
    setMerged((m) => [...m, dup.id]);
    setDeals((all) => [...all, ...dealsOf(dup.id)]);
    setDuplicate("");
    notify(`${dup.name} mesclada em ${company.name}`);
  };
  const open = deals.reduce((s, d) => s + d.value, 0);
  const owner = repById(company.owner);

  const columns: Column<Deal>[] = [
    { key: "title", header: "Negócio", primary: true, cell: (d) => d.title },
    { key: "stage", header: "Etapa", cell: (d) => <Badge tone="accent">{stageById(d.stage).label}</Badge> },
    { key: "owner", header: "Responsável", mobileHidden: true, cell: (d) => repById(d.owner).name },
    { key: "close", header: "Fechamento", nowrap: true, cell: (d) => <span className="tabular-nums text-muted">{formatDate(d.close)}</span> },
    { key: "value", header: "Valor", align: "right", nowrap: true, cell: (d) => <span className="font-medium tabular-nums">{formatCurrency(d.value, { cents: false })}</span> },
  ];

  return (
    <CrmShell current={here}>
      <Page>
        <PageHeading
          crumbs={[{ label: "Empresas e contatos", href: "#/frame/crm-contacts" }, { label: company.name }]}
          title={company.name}
          description={`${company.industry} · ${company.size} funcionários · ${company.city}`}
          actions={
            <>
              <Button variant="ghost" onClick={() => notify(`Ligação para ${company.name} registrada`)}>
                <Phone /> Registrar ligação
              </Button>
              <Button onClick={() => setCreating(true)}>
                <Plus /> Novo negócio
              </Button>
              <ActionMenu
                actions={[
                  {
                    label: "Editar empresa",
                    onSelect: () => {
                      setDraft(company);
                      setTried(false);
                      editOp.reset();
                      setEditing(true);
                    },
                  },
                  {
                    label: "Mesclar duplicada",
                    onSelect: () => {
                      setDuplicate("");
                      setMerging(true);
                    },
                  },
                  { label: "Arquivar", tone: "danger", separator: true, onSelect: () => notify(`${company.name} arquivada`, () => notify("Arquivamento desfeito", undefined, "info")) },
                ]}
              />
            </>
          }
        />

        <KpiGrid className="mt-6">
          <KpiCard label="Em aberto" value={formatCurrency(open, { compact: true })} hint={`${deals.length} negócio${deals.length === 1 ? "" : "s"}`} />
          <KpiCard label="Receita anual" value={company.arr ? formatCurrency(company.arr, { compact: true }) : "—"} hint={company.arr ? "contrato vigente" : "ainda não é cliente"} />
          <KpiCard label="Contatos" value={String(people.length)} hint={people.filter((p) => p.tag?.startsWith("Decisor")).length ? "com decisor mapeado" : "sem decisor mapeado"} />
          <KpiCard label="Último contato" value={company.lastTouch === 0 ? "Hoje" : `${company.lastTouch} dias`} hint={company.lastTouch > 30 ? "conta esfriando" : "em dia"} />
        </KpiGrid>

        <div className="mt-8">
          <SplitLayout
            asideWidth={320}
            main={
              <>
                <Tabs
                  label="Seções da empresa"
                  value={tab}
                  onChange={setTab}
                  items={[
                    { id: "negocios", label: `Negócios · ${deals.length}` },
                    { id: "contatos", label: `Contatos · ${people.length}` },
                    { id: "atividades", label: `Atividades · ${acts.length}` },
                  ]}
                />
                <div className="mt-5">
                  {tab === "negocios" && (
                    <DataTable
                      rows={deals}
                      loading={estado === "carregando"}
                      error={estado === "erro" ? { message: "Não foi possível carregar os negócios desta empresa.", onRetry: () => (location.hash = `/frame/crm-company?id=${company.id}`) } : undefined}
                      columns={columns}
                      rowKey={(d) => d.id}
                      onRowClick={(d) => go("crm-deal", d.id)}
                      rowLabel={(d) => `Abrir ${d.title}`}
                      empty={
                        <Empty
                          framed={false}
                          title="Nenhum negócio aberto"
                          hint={`Crie um negócio para ${company.name} e acompanhe no pipeline.`}
                          action={
                            <Button variant="ghost" onClick={() => setCreating(true)}>
                              <Plus /> Criar negócio
                            </Button>
                          }
                        />
                      }
                    />
                  )}
                  {tab === "contatos" && (
                    <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2">
                      {people.map((p) => (
                        <li key={p.id}>
                          <a href={`#/frame/crm-contact?id=${p.id}`} className="surface-card surface-interactive flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 hover:border-line-strong">
                            <Avatar initials={p.initials} tint={p.tint} name={p.name} />
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-[13.5px] font-medium">{p.name}</div>
                              <div className="truncate text-[12px] text-muted">{p.role}</div>
                            </div>
                            {p.tag && <Badge tone={p.tag.startsWith("Decisor") ? "accent" : "neutral"}>{p.tag}</Badge>}
                          </a>
                        </li>
                      ))}
                      {!people.length && (
                        <li className="col-span-full">
                          <Empty icon={<UserPlus />} title="Nenhum contato cadastrado" hint="Sem decisor mapeado, o negócio não avança. Cadastre quem decide e quem influencia." action={<Button variant="ghost" href="#/frame/crm-contacts">Ver base de contatos</Button>} />
                        </li>
                      )}
                    </ul>
                  )}
                  {tab === "atividades" && (
                    <ul className="m-0 list-none divide-y divide-line rounded-xl border border-line bg-surface p-0">
                      {acts.map((a) => {
                        const d = daysFromToday(a.due);
                        return (
                          <li key={a.id} className="flex items-center gap-3 px-4 py-3">
                            <CalendarClock className="h-4 w-4 shrink-0 text-muted" />
                            <div className="min-w-0 flex-1">
                              <div className={a.done ? "truncate text-[13.5px] text-muted line-through" : "truncate text-[13.5px]"}>{a.title}</div>
                              <div className="text-[12px] text-muted">
                                {activityLabel[a.type]} · {repById(a.owner).name}
                              </div>
                            </div>
                            <Badge tone={!a.done && d < 0 ? "bad" : "neutral"}>{d === 0 ? "Hoje" : !a.done && d < 0 ? `Atrasada · ${formatDate(a.due, { short: true })}` : formatDate(a.due, { short: true })}</Badge>
                          </li>
                        );
                      })}
                      {!acts.length && (
                        <li>
                          <Empty framed={false} title="Nenhuma atividade registrada" hint="Ligações, reuniões e tarefas com esta empresa aparecem aqui." action={<Button variant="ghost" href="#/frame/crm-activities?novo=1">Agendar atividade</Button>} />
                        </li>
                      )}
                    </ul>
                  )}
                </div>
              </>
            }
            aside={
              <>
                <section className="rounded-xl border border-line bg-surface px-4 py-4">
                  <div className="mb-3 flex items-center gap-3">
                    <EntityMark name={company.name} tint={company.tint} className="h-10 w-10 text-[13px]" />
                    <div className="min-w-0">
                      <div className="truncate text-[14px] font-medium">{company.name}</div>
                      <Badge tone={lifecycleTone[company.lifecycle]}>{company.lifecycle}</Badge>
                    </div>
                  </div>
                  <PropertyList
                    items={[
                      { label: "CNPJ", value: <span className="tabular-nums">{company.cnpj}</span> },
                      { label: "Site", value: <span className="inline-flex items-center gap-1"><Globe className="h-3.5 w-3.5 text-muted" />{company.domain}</span> },
                      { label: "Setor", value: company.industry },
                      { label: "Porte", value: `${company.size} func.` },
                      { label: "Cidade", value: company.city },
                      { label: "Responsável", value: owner.name },
                    ]}
                  />
                </section>
                <section className="rounded-xl border border-line bg-surface px-4 py-4">
                  <h2 className="m-0 mb-3 text-[13px] font-medium">Contato principal</h2>
                  {people[0] ? (
                    <div className="space-y-2 text-[13px]">
                      <a href={`#/frame/crm-contact?id=${people[0].id}`} className="flex items-center gap-2.5 font-medium hover:underline">
                        <Avatar initials={people[0].initials} tint={people[0].tint} size="sm" name={people[0].name} />
                        {people[0].name}
                      </a>
                      <div className="flex items-center gap-2 text-muted">
                        <Mail className="h-3.5 w-3.5" /> {people[0].email}
                      </div>
                      <div className="flex items-center gap-2 tabular-nums text-muted">
                        <Phone className="h-3.5 w-3.5" /> {people[0].phone}
                      </div>
                    </div>
                  ) : (
                    <p className="m-0 text-[12.5px] text-muted">Nenhum contato. Sem decisor mapeado, o negócio não avança.</p>
                  )}
                </section>
              </>
            }
          />
        </div>
      </Page>
      <NewDealModal
        open={creating}
        companyId={company.id}
        onClose={() => setCreating(false)}
        onCreate={(d) => {
          setDeals((all) => [d, ...all]);
          notify(`Negócio criado para ${company.name}`, () => setDeals((all) => all.filter((x) => x.id !== d.id)));
        }}
      />

      <Drawer
        open={editing}
        onClose={() => setEditing(false)}
        kicker="Empresa"
        title={`Editar ${company.name}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(false)}>
              Cancelar
            </Button>
            <OperationButton operation={editOp} onClick={submitEdit}>
              Salvar alterações
            </OperationButton>
          </>
        }
      >
        <div className="space-y-4">
          <OperationFeedback operation={editOp} />
          <TextField label="Razão social ou nome fantasia" value={draft.name} onChange={(v) => setDraft((d) => ({ ...d, name: v }))} error={tried && !draft.name.trim() ? "Informe o nome da empresa." : undefined} autoFocus />
          <FieldGrid>
            <TextField label="Site" value={draft.domain} onChange={(v) => setDraft((d) => ({ ...d, domain: v }))} placeholder="empresa.com.br" />
            <TextField label="CNPJ" value={draft.cnpj} onChange={(v) => setDraft((d) => ({ ...d, cnpj: v }))} placeholder="00.000.000/0001-00" />
          </FieldGrid>
          <FieldGrid>
            <FieldBlock label="Setor">
              <Select label="Setor" value={draft.industry} onValueChange={(v) => setDraft((d) => ({ ...d, industry: v }))} options={industries.map((x) => ({ value: x, label: x }))} />
            </FieldBlock>
            <FieldBlock label="Porte">
              <Select label="Porte" value={draft.size} onValueChange={(v) => setDraft((d) => ({ ...d, size: v }))} options={sizes.map((x) => ({ value: x, label: `${x} funcionários` }))} />
            </FieldBlock>
          </FieldGrid>
          <TextField label="Cidade" value={draft.city} onChange={(v) => setDraft((d) => ({ ...d, city: v }))} placeholder="São Paulo, SP" />
          <FieldGrid>
            <FieldBlock label="Estágio">
              <Select label="Estágio" value={draft.lifecycle} onValueChange={(v) => setDraft((d) => ({ ...d, lifecycle: v as Lifecycle }))} options={lifecycles.map((x) => ({ value: x, label: x }))} />
            </FieldBlock>
            <FieldBlock label="Responsável">
              <Select label="Responsável" value={draft.owner} onValueChange={(v) => setDraft((d) => ({ ...d, owner: v }))} options={reps.map((r) => ({ value: r.id, label: r.name }))} />
            </FieldBlock>
          </FieldGrid>
        </div>
      </Drawer>

      <Modal
        open={merging}
        onClose={() => setMerging(false)}
        title="Mesclar empresa duplicada"
        description={`Negócios, contatos e atividades da duplicada passam para ${company.name}. A duplicada é apagada.`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setMerging(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                setMerging(false);
                setConfirmMerge(true);
              }}
              disabled={!dup} disabledReason="Escolha a empresa duplicada.">
              Revisar mesclagem
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Combobox
            label="Empresa duplicada"
            value={duplicate}
            onValueChange={(v: string) => setDuplicate(v)}
            placeholder="Buscar por nome, domínio ou CNPJ…"
            hint="As mais parecidas (mesmo domínio, nome ou cidade e setor) aparecem primeiro."
            options={candidates.map((c) => ({ value: c.id, label: c.name, description: `${c.domain} · ${c.city}` }))}
          />
          {dup && (
            <div className="grid gap-px overflow-hidden rounded-xl border border-line bg-line text-[13px] sm:grid-cols-2">
              {[
                { label: "Fica", c: company },
                { label: "Sai", c: dup },
              ].map(({ label, c }) => (
                <div key={c.id} className="bg-surface px-4 py-3">
                  <div className="text-[11px] font-medium uppercase tracking-wide text-muted">{label}</div>
                  <div className="mt-1 flex items-center gap-2 font-medium">
                    <EntityMark name={c.name} tint={c.tint} className="h-6 w-6 text-[10px]" />
                    <span className="truncate">{c.name}</span>
                  </div>
                  <div className="mt-1 text-[12px] text-muted">
                    {dealsOf(c.id).length} negócios · {contactsOf(c.id).length} contatos · {c.cnpj}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmMerge}
        onClose={() => setConfirmMerge(false)}
        onConfirm={doMerge}
        tone="danger"
        title={dup ? `Mesclar ${dup.name} em ${company.name}?` : "Mesclar empresas?"}
        description={dup ? `${dealsOf(dup.id).length} negócios e ${contactsOf(dup.id).length} contatos passam para ${company.name}. ${dup.name} será apagada e isso não pode ser desfeito.` : undefined}
        confirmLabel="Mesclar empresas"
      />
    </CrmShell>
  );
}
