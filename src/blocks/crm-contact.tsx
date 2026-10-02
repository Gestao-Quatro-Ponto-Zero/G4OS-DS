import { Briefcase, Mail, MessageSquare, Phone } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import {
  ActionMenu,
  ActivityFeed,
  Avatar,
  Badge,
  Button,
  Combobox,
  Drawer,
  Empty,
  EntityMark,
  FieldBlock,
  FieldGrid,
  Modal,
  OperationButton,
  OperationFeedback,
  Page,
  PageHeading,
  PropertyList,
  Select,
  SplitLayout,
  TextField,
  TextareaField,
  formatCurrency,
  formatDate,
  notify,
  useOperation,
  type ActivityItem,
} from "@g4ai/ds";
import { activities, activityLabel, companies, companyById, contactById, deals, me, repById, stageById, useFrameParam, type Contact } from "./data/crm";
import { CrmShell } from "./shells/crm-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Página do contato",
  description: "Pessoa (?id=): papel na decisão, dados de contato, negócios em que participa, histórico e e-mail com modelo.",
  category: "CRM",
  order: 6,
  height: 880,
  concept: {
    goal: "Entender o papel de uma pessoa na decisão e o histórico com ela antes de entrar em contato.",
    patterns: [
      "Anatomia C · Registro: propriedades fixas à direita",
      "Papel na decisão (decisora, influenciadora) em destaque",
      "Histórico em feed; e-mail com modelo em modal",
      "Editar em gaveta (Drawer); mover de empresa com busca (Combobox) em modal curto",
    ],
    adapt: [
      "Candidato (ATS), contato de fornecedor, usuário de conta SaaS",
    ],
    avoid: [
      "Ações de contato escondidas em menu",
    ],
  },
} as const;

const here = "#/frame/crm-contacts";
const tags: NonNullable<Contact["tag"]>[] = ["Decisora", "Decisor", "Influenciador", "Compras", "Usuário"];
/** Simula a chamada à API (troque pelo seu fetch). */
const save = () => new Promise<void>((resolve) => setTimeout(resolve, 600));

const historyFor = (p: Contact): ActivityItem[] =>
  activities
    .filter((a) => a.contactId === p.id)
    .map((a) => ({
      id: a.id,
      actor: repById(a.owner),
      action: a.done ? `concluiu ${activityLabel[a.type].toLowerCase()}:` : `agendou ${activityLabel[a.type].toLowerCase()}:`,
      target: a.title,
      time: formatDate(a.due),
      icon: a.type === "email" ? <Mail /> : a.type === "ligacao" ? <Phone /> : <MessageSquare />,
    }));

export default function CrmContact() {
  const id = useFrameParam("id");
  const base = contactById(id);
  const [person, setPerson] = useState<Contact>(base);
  const company = companyById(person.companyId);
  const related = deals.filter((d) => d.contactIds.includes(person.id));
  const [feed, setFeed] = useState(() => historyFor(base));
  const [compose, setCompose] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Contact>(base);
  const [tried, setTried] = useState(false);
  const [moving, setMoving] = useState(false);
  const [target, setTarget] = useState("");
  const editOp = useOperation();
  const moveOp = useOperation({ busyLabel: "Movendo…" });
  useEffect(() => {
    setPerson(base);
    setFeed(historyFor(base));
  }, [base]);

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email);
  const submitEdit = async () => {
    setTried(true);
    if (!draft.name.trim() || !emailOk) return;
    const before = person;
    const next = { ...draft, name: draft.name.trim(), initials: draft.name.trim().split(/\s+/).map((w) => w[0]).filter((_, i, a) => i === 0 || i === a.length - 1).join("").toUpperCase() };
    const failed = await editOp.run(save, { message: `Contato ${next.name} atualizado`, undo: () => setPerson(before) }, { apply: () => setPerson(next), revert: () => setPerson(before) });
    if (!failed) setEditing(false);
  };
  const submitMove = async () => {
    if (!target || target === person.companyId) return;
    const before = person;
    const to = companyById(target);
    const failed = await moveOp.run(save, { message: `${person.name} agora está em ${to.name}`, undo: () => setPerson(before) }, { apply: () => setPerson((p) => ({ ...p, companyId: target })), revert: () => setPerson(before) });
    if (!failed) {
      setMoving(false);
      setFeed((f) => [{ id: `m${Date.now()}`, actor: repById(me), action: "moveu para", target: to.name, time: "Agora", icon: <Briefcase /> }, ...f]);
    }
  };

  const first = person.name.split(" ")[0];
  const log = (action: string, icon: ReactNode, quote?: string) => setFeed((f) => [{ id: `n${Date.now()}`, actor: repById(me), action, target: person.name, time: "Agora", icon, quote }, ...f]);

  return (
    <CrmShell current={here}>
      <Page>
        <PageHeading
          crumbs={[
            { label: "Empresas e contatos", href: "#/frame/crm-contacts" },
            { label: company.name, href: `#/frame/crm-company?id=${company.id}` },
            { label: person.name },
          ]}
          title={person.name}
          description={`${person.role} · ${company.name}`}
          actions={
            <>
              <Button variant="ghost" onClick={() => (log("registrou uma ligação com", <Phone />), notify(`Ligação com ${first} registrada`))}>
                <Phone /> Ligação
              </Button>
              <Button
                onClick={() => {
                  setSubject(`${company.name} · próximos passos`);
                  setBody(`Olá, ${first}!\n\nConforme combinamos, sigo com os próximos passos da proposta.\n\nAbraço,\nAna`);
                  setCompose(true);
                }}
              >
                <Mail /> Enviar e-mail
              </Button>
              <ActionMenu
                actions={[
                  {
                    label: "Editar contato",
                    onSelect: () => {
                      setDraft(person);
                      setTried(false);
                      editOp.reset();
                      setEditing(true);
                    },
                  },
                  {
                    label: "Mover para outra empresa",
                    onSelect: () => {
                      setTarget("");
                      moveOp.reset();
                      setMoving(true);
                    },
                  },
                  { label: "Remover contato", tone: "danger", separator: true, onSelect: () => notify(`${person.name} removido`, () => notify("Remoção desfeita", undefined, "info")) },
                ]}
              />
            </>
          }
        />
        <div className="mt-8">
          <SplitLayout
            asideWidth={320}
            main={
              <div className="space-y-8">
                <section>
                  <h2 className="m-0 mb-3 text-[14px] font-medium">Negócios em que participa</h2>
                  <ul className="m-0 list-none space-y-2 p-0">
                    {related.map((d) => (
                      <li key={d.id}>
                        <a href={`#/frame/crm-deal?id=${d.id}`} className="surface-card surface-interactive flex flex-wrap items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 hover:border-line-strong">
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-[13.5px] font-medium">{d.title}</div>
                            <div className="text-[12px] text-muted">
                              {repById(d.owner).name} · fecha em {formatDate(d.close)}
                            </div>
                          </div>
                          <Badge tone="accent">{stageById(d.stage).label}</Badge>
                          <span className="w-24 text-right text-[13.5px] font-semibold tabular-nums">{formatCurrency(d.value, { compact: true })}</span>
                        </a>
                      </li>
                    ))}
                    {!related.length && (
                      <li>
                        <Empty title="Não participa de nenhum negócio aberto" hint={`Vincule ${first} na página do negócio ou crie um negócio para ${company.name}.`} action={<Button variant="ghost" href={`#/frame/crm-company?id=${company.id}`}>Abrir {company.name}</Button>} />
                      </li>
                    )}
                  </ul>
                </section>
                <section>
                  <h2 className="m-0 mb-3 text-[14px] font-medium">Histórico</h2>
                  {feed.length ? <ActivityFeed items={feed} /> : <Empty title="Sem interações registradas" hint="Ligações, e-mails e reuniões com esta pessoa aparecem aqui." />}
                </section>
              </div>
            }
            aside={
              <section className="rounded-xl border border-line bg-surface px-4 py-4">
                <div className="mb-4 flex items-center gap-3">
                  <Avatar initials={person.initials} tint={person.tint} size="lg" name={person.name} />
                  <div className="min-w-0">
                    <div className="truncate text-[14px] font-medium">{person.name}</div>
                    {person.tag && <Badge tone={person.tag.startsWith("Decisor") ? "accent" : "neutral"}>{person.tag}</Badge>}
                  </div>
                </div>
                <PropertyList
                  items={[
                    { label: "E-mail", value: <span className="break-all">{person.email}</span> },
                    { label: "Telefone", value: <span className="tabular-nums">{person.phone}</span> },
                    {
                      label: "Empresa",
                      value: (
                        <a href={`#/frame/crm-company?id=${company.id}`} className="inline-flex items-center gap-1.5 font-medium hover:underline">
                          <EntityMark name={company.name} tint={company.tint} className="h-5 w-5 text-[10px]" />
                          {company.name}
                        </a>
                      ),
                    },
                    { label: "Cargo", value: person.role },
                    { label: "Último contato", value: person.lastTouch === 0 ? "Hoje" : `Há ${person.lastTouch} dias` },
                    { label: "Responsável", value: repById(company.owner).name },
                  ]}
                />
              </section>
            }
          />
        </div>
      </Page>

      <Modal
        open={compose}
        onClose={() => setCompose(false)}
        title={`E-mail para ${person.name}`}
        description={person.email}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCompose(false)}>
              Descartar
            </Button>
            <Button
              disabled={!subject.trim() || !body.trim()}
              onClick={() => {
                log("enviou e-mail para", <Mail />, subject);
                setCompose(false);
                notify(`E-mail enviado para ${first}`);
              }}
            >
              <Mail /> Enviar
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <TextField label="Assunto" value={subject} onChange={setSubject} />
          <TextareaField label="Mensagem" value={body} onChange={setBody} rows={8} />
        </div>
      </Modal>

      <Drawer
        open={editing}
        onClose={() => setEditing(false)}
        kicker={company.name}
        title="Editar contato"
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
          <TextField label="Nome" value={draft.name} onChange={(v) => setDraft((d) => ({ ...d, name: v }))} error={tried && !draft.name.trim() ? "Informe o nome." : undefined} autoFocus />
          <TextField label="Cargo" value={draft.role} onChange={(v) => setDraft((d) => ({ ...d, role: v }))} placeholder="Ex.: Diretora de Operações" />
          <FieldGrid>
            <TextField label="E-mail" type="email" value={draft.email} onChange={(v) => setDraft((d) => ({ ...d, email: v }))} error={tried && !emailOk ? "Use um e-mail válido, como nome@empresa.com.br." : undefined} />
            <TextField label="Telefone" value={draft.phone} onChange={(v) => setDraft((d) => ({ ...d, phone: v }))} placeholder="(11) 91234-5678" />
          </FieldGrid>
          <FieldBlock label="Papel na decisão" hint="Quem decide, quem influencia e quem compra. Usado no mapa de decisores do negócio.">
            <Select label="Papel na decisão" value={draft.tag ?? ""} onValueChange={(v) => setDraft((d) => ({ ...d, tag: (v || undefined) as Contact["tag"] }))} options={[{ value: "", label: "Não definido" }, ...tags.map((t) => ({ value: t, label: t }))]} />
          </FieldBlock>
        </div>
      </Drawer>

      <Modal
        open={moving}
        onClose={() => setMoving(false)}
        size="sm"
        title={`Mover ${first} para outra empresa`}
        description="Os negócios em que a pessoa participa continuam vinculados. O histórico vai junto."
        footer={
          <>
            <Button variant="ghost" onClick={() => setMoving(false)}>
              Cancelar
            </Button>
            <OperationButton operation={moveOp} onClick={submitMove} disabled={!target || target === person.companyId} disabledReason="Escolha a nova empresa.">
              Mover contato
            </OperationButton>
          </>
        }
      >
        <div className="space-y-4">
          <OperationFeedback operation={moveOp} />
          <Combobox
            label="Nova empresa"
            value={target}
            onValueChange={(v: string) => setTarget(v)}
            placeholder="Buscar empresa…"
            options={companies.filter((c) => c.id !== person.companyId).map((c) => ({ value: c.id, label: c.name, description: `${c.industry} · ${c.city}` }))}
          />
        </div>
      </Modal>
    </CrmShell>
  );
}
