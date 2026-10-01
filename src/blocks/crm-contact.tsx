import { Mail, MessageSquare, Phone } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import {
  ActionMenu,
  ActivityFeed,
  Avatar,
  Badge,
  Button,
  EntityMark,
  Modal,
  Page,
  PageHeading,
  PropertyList,
  SplitLayout,
  TextField,
  TextareaField,
  formatCurrency,
  formatDate,
  notify,
  type ActivityItem,
} from "@g4ai/ds";
import { activities, activityLabel, companyById, contactById, deals, me, repById, stageById, useFrameParam, type Contact } from "./data/crm";
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
  const person = contactById(id);
  const company = companyById(person.companyId);
  const related = deals.filter((d) => d.contactIds.includes(person.id));
  const [feed, setFeed] = useState(() => historyFor(person));
  const [compose, setCompose] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  useEffect(() => setFeed(historyFor(person)), [person]);

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
                  { label: "Editar contato", onSelect: () => notify("Exemplo: abre a gaveta de edição.", undefined, "info") },
                  { label: "Mover para outra empresa", onSelect: () => notify("Exemplo: escolhe a nova empresa numa lista com busca.", undefined, "info") },
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
                    {!related.length && <li className="rounded-xl border border-dashed border-line px-4 py-6 text-center text-[13px] text-muted">Não está em nenhum negócio aberto.</li>}
                  </ul>
                </section>
                <section>
                  <h2 className="m-0 mb-3 text-[14px] font-medium">Histórico</h2>
                  {feed.length ? <ActivityFeed items={feed} /> : <p className="m-0 text-[13px] text-muted">Sem interações registradas.</p>}
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
    </CrmShell>
  );
}
