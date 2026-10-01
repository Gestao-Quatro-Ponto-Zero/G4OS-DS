import { CalendarClock, Globe, Mail, Phone, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import {
  ActionMenu,
  Avatar,
  Badge,
  Button,
  DataTable,
  EntityMark,
  KpiCard,
  KpiGrid,
  Page,
  PageHeading,
  PropertyList,
  SplitLayout,
  Tabs,
  formatCurrency,
  formatDate,
  notify,
  type Column,
} from "@g4os/ds";
import { activities, activityLabel, companyById, contactsOf, daysFromToday, dealsOf, go, repById, stageById, useFrameParam, type Deal } from "./data/crm";
import { CrmShell, NewDealModal } from "./shells/crm-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Página da empresa",
  description: "Conta (?id=): indicadores, negócios, contatos e atividades da empresa, propriedades na lateral e novo negócio já vinculado.",
  category: "CRM",
  order: 5,
  height: 960,
} as const;

const here = "#/frame/crm-contacts";
const lifecycleTone = { Lead: "neutral", Oportunidade: "info", Cliente: "ok", "Ex-cliente": "warn" } as const;

export default function CrmCompany() {
  const id = useFrameParam("id");
  const company = companyById(id);
  const [tab, setTab] = useState("negocios");
  const [deals, setDeals] = useState<Deal[]>(() => dealsOf(company.id));
  const [creating, setCreating] = useState(false);
  useEffect(() => setDeals(dealsOf(company.id)), [company]);

  const people = contactsOf(company.id);
  const acts = activities.filter((a) => a.companyId === company.id).sort((a, b) => a.due.localeCompare(b.due));
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
                  { label: "Editar empresa", onSelect: () => notify("Exemplo: abre a gaveta de edição da empresa.", undefined, "info") },
                  { label: "Mesclar duplicada", onSelect: () => notify("Exemplo: procura empresas com o mesmo CNPJ ou domínio.", undefined, "info") },
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
                      columns={columns}
                      rowKey={(d) => d.id}
                      onRowClick={(d) => go("crm-deal", d.id)}
                      rowLabel={(d) => `Abrir ${d.title}`}
                      empty={
                        <div className="py-6 text-center text-[13px] text-muted">
                          Nenhum negócio aberto.{" "}
                          <button type="button" className="font-medium text-blue hover:underline" onClick={() => setCreating(true)}>
                            Criar o primeiro
                          </button>
                        </div>
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
                      {!people.length && <li className="col-span-full py-8 text-center text-[13px] text-muted">Nenhum contato cadastrado.</li>}
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
                      {!acts.length && <li className="px-4 py-8 text-center text-[13px] text-muted">Nenhuma atividade registrada.</li>}
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
    </CrmShell>
  );
}
