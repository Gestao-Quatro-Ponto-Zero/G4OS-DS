import { CalendarClock, Check, Send } from "lucide-react";
import { useState } from "react";
import {
  Avatar,
  Badge,
  Button,
  Callout,
  Checkbox,
  ConfirmDialog,
  Empty,
  Meter,
  OperationButton,
  OperationFeedback,
  Page,
  PageHeading,
  PropertyList,
  Tabs,
  formatDate,
  notify,
  plural,
  useOperation,
} from "@g4ai/ds";
import { admissions as seed, candidateById, daysFromToday, iso, jobById, newChecklist, person, type Admission, type ChecklistGroup } from "./data/ats";
import { go, setFrameQuery, useFrameParam } from "./shells/frame-route";
import { LoadError, LoadingRows, TalentosShell, useListState } from "./shells/talentos-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Admissões",
  description: "Do aceite ao primeiro dia: lista de contratados com progresso e, ao lado, o checklist por grupo (documentos, exame, contrato, acessos, primeiro dia) com responsável, alerta de prazo e conclusão. ?id=<candidato> abre a admissão (cria se ainda não existir).",
  category: "ATS",
  order: 12,
  height: 980,
  concept: {
    goal: "Garantir que cada contratado chegue no primeiro dia com documentos, contrato e acessos prontos.",
    patterns: [
      "Anatomia F · Mestre-detalhe: contratados à esquerda, checklist à direita; seleção no endereço (?id=)",
      "Progresso por pessoa e alerta quando faltam itens perto da data de início",
      "Checklist agrupado com responsável por item; concluir só com tudo marcado (motivo no botão)",
      "Vem da proposta aceita (Iniciar admissão) já com a pessoa selecionada",
      "Cinco estados: ?estado=carregando|vazio|erro simula",
    ],
    adapt: [
      "Onboarding de clientes (portal), implantação (SaaS), homologação de fornecedor (ERP)",
    ],
    avoid: [
      "Checklist sem dono por item (ninguém cobra)",
      "Concluir com pendências sem dizer quais",
    ],
  },
} as const;

const groups: ChecklistGroup[] = ["Documentos", "Exame admissional", "Contrato", "Acessos", "Primeiro dia"];
const progressOf = (a: Admission) => a.items.filter((i) => i.done).length / a.items.length;
const ownerName = (id: string) => (id === "contratado" ? "Contratado(a)" : person(id).name);

export default function AtsAdmission() {
  const id = useFrameParam("id");
  const estado = useListState();
  const [list, setList] = useState<Admission[]>(() => {
    // Vindo de "Iniciar admissão" com alguém que ainda não tem checklist: cria em memória.
    if (!id || seed.some((a) => a.candidateId === id)) return seed;
    const c = candidateById(id);
    return [{ id: `a-${c.id}`, candidateId: c.id, jobId: c.jobId, start: iso(30), status: "andamento", items: newChecklist(0, jobById(c.jobId).manager) }, ...seed];
  });
  const [tab, setTab] = useState<"andamento" | "concluida">("andamento");
  const shown = list.filter((a) => a.status === tab);
  const current = list.find((a) => a.candidateId === id && a.status === tab) ?? shown[0];

  const select = (candidateId: string) => setFrameQuery({ id: candidateId });

  return (
    <TalentosShell section="admissoes">
      <Page>
        <PageHeading title="Admissões" description="Do aceite da proposta ao primeiro dia. Documentos, exame, contrato e acessos com dono e prazo." />
        <Tabs
          className="mt-4"
          label="Situação"
          value={tab}
          onChange={(t) => setTab(t as typeof tab)}
          items={[
            { id: "andamento", label: "Em andamento", count: list.filter((a) => a.status === "andamento").length },
            { id: "concluida", label: "Concluídas" },
          ]}
        />
        {estado === "carregando" ? (
          <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(280px,340px)_minmax(0,1fr)]">
            <LoadingRows variant="cards" rows={4} label="Carregando admissões" />
            <LoadingRows rows={7} label="Carregando checklist" />
          </div>
        ) : estado === "erro" ? (
          <div className="mt-5">
            <LoadError what="as admissões" />
          </div>
        ) : estado === "vazio" ? (
          <div className="mt-5">
            <Empty
              title="Nenhuma admissão em andamento"
              hint="Quando um candidato aceita a proposta, a admissão começa aqui com o checklist padrão."
              action={<Button href="#/frame/ats-offers">Ver propostas enviadas</Button>}
            />
          </div>
        ) : (
          <div className="mt-5 grid items-start gap-5 lg:grid-cols-[minmax(280px,340px)_minmax(0,1fr)]">
            <ul className="m-0 list-none space-y-2 p-0" aria-label="Contratados">
              {shown.map((a) => {
                const c = candidateById(a.candidateId);
                const p = progressOf(a);
                const d = daysFromToday(a.start);
                const late = a.status === "andamento" && d <= 7 && p < 1;
                return (
                  <li key={a.id}>
                    <button
                      type="button"
                      aria-current={a.id === current?.id ? "true" : undefined}
                      onClick={() => select(a.candidateId)}
                      className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-left hover:border-line-strong aria-[current=true]:border-line-strong aria-[current=true]:shadow-raised"
                    >
                      <span className="flex items-center gap-3">
                        <Avatar initials={c.initials} tint={c.tint} name={c.name} size="sm" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13.5px] font-medium">{c.name}</span>
                          <span className="block truncate text-[12px] text-muted">
                            {jobById(a.jobId).short} · início {formatDate(a.start, { short: true })}
                          </span>
                        </span>
                        {late ? <Badge tone="warn">Prazo curto</Badge> : a.status === "concluida" ? <Badge tone="ok">Concluída</Badge> : null}
                      </span>
                      <span className="mt-2.5 flex items-center gap-2">
                        <span className="flex-1">
                          <Meter value={p * 100} tone={p === 1 ? "ok" : late ? "warn" : "ink"} label={`Progresso da admissão de ${c.name}`} />
                        </span>
                        <span className="text-[11.5px] tabular-nums text-muted">
                          {a.items.filter((i) => i.done).length}/{a.items.length}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
              {!shown.length && (
                <li>
                  <Empty
                    title={tab === "andamento" ? "Nenhuma admissão em andamento" : "Nenhuma admissão concluída"}
                    hint={tab === "andamento" ? "Tudo pronto: ninguém aguardando documentos ou acessos." : "As admissões concluídas ficam aqui como histórico."}
                  />
                </li>
              )}
            </ul>
            {current && (
              <AdmissionDetail
                key={current.id}
                admission={current}
                onChange={(next) => setList((all) => all.map((a) => (a.id === next.id ? next : a)))}
                onConclude={() => {
                  setTab("concluida");
                  select(current.candidateId);
                }}
              />
            )}
          </div>
        )}
      </Page>
    </TalentosShell>
  );
}

function AdmissionDetail({ admission: a, onChange, onConclude }: { admission: Admission; onChange: (a: Admission) => void; onConclude: () => void }) {
  const c = candidateById(a.candidateId);
  const job = jobById(a.jobId);
  const [confirm, setConfirm] = useState(false);
  const reminder = useOperation({ busyLabel: "Enviando…" });
  const missing = a.items.filter((i) => !i.done);
  const mineMissing = missing.filter((i) => i.owner === "contratado");
  const d = daysFromToday(a.start);
  const done = a.status === "concluida";

  const toggle = (itemId: string, value: boolean) => onChange({ ...a, items: a.items.map((i) => (i.id === itemId ? { ...i, done: value } : i)) });

  return (
    <section className="min-w-0 rounded-xl border border-line bg-surface" aria-label={`Admissão de ${c.name}`}>
      <header className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-4">
        <Avatar initials={c.initials} tint={c.tint} name={c.name} />
        <div className="min-w-0 flex-1">
          <button type="button" onClick={() => go("ats-candidate", c.id)} className="block truncate text-left text-[14px] font-medium hover:underline">
            {c.name}
          </button>
          <div className="truncate text-[12px] text-muted">{job.title}</div>
        </div>
        <Badge tone={done ? "ok" : "info"}>{done ? "Concluída" : `${Math.round(progressOf(a) * 100)} % pronto`}</Badge>
      </header>
      <div className="space-y-6 px-5 py-5">
        {!done && missing.length > 0 && d <= 7 && (
          <Callout tone="warn" title={d < 0 ? `Começou há ${plural(-d, "dia")} com pendências` : `Começa em ${plural(d, "dia")} e faltam ${plural(missing.length, "item", "itens")}`}>
            {mineMissing.length ? `${plural(mineMissing.length, "item depende", "itens dependem")} do contratado: envie um lembrete.` : "As pendências são do time interno; cobre os responsáveis abaixo."}
          </Callout>
        )}
        <OperationFeedback operation={reminder} />
        <PropertyList
          items={[
            { label: "Data de início", value: formatDate(a.start), hint: d > 0 ? `em ${plural(d, "dia")}` : d === 0 ? "hoje" : `há ${plural(-d, "dia")}` },
            { label: "Gestor(a)", value: person(job.manager).name },
            { label: "Local", value: `${job.location} · ${job.mode}` },
            { label: "E-mail do contratado", value: <span className="break-all">{c.email}</span> },
          ]}
        />
        {groups.map((g) => {
          const items = a.items.filter((i) => i.group === g);
          const ok = items.every((i) => i.done);
          return (
            <section key={g}>
              <h3 className="m-0 mb-2 flex items-center gap-2 text-[13px] font-medium">
                {g}
                <span className="text-[12px] font-normal tabular-nums text-muted">
                  {items.filter((i) => i.done).length}/{items.length}
                </span>
                {ok && <Check className="h-3.5 w-3.5 text-ok" aria-label="Grupo completo" />}
              </h3>
              <ul className="m-0 list-none divide-y divide-line rounded-xl border border-line p-0">
                {items.map((i) => (
                  <li key={i.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5">
                    <Checkbox label={i.label} checked={i.done} disabled={done} onCheckedChange={(v) => toggle(i.id, v)} className="min-w-0 flex-1" />
                    <span className={i.owner === "contratado" && !i.done ? "text-[12px] font-medium text-amber" : "text-[12px] text-muted"}>{ownerName(i.owner)}</span>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
      {!done && (
        <footer className="flex flex-wrap justify-end gap-2 border-t border-line bg-soft/40 px-5 py-3">
          <OperationButton
            operation={reminder}
            variant="ghost"
            disabled={!mineMissing.length}
            disabledReason="Nada pendente com o contratado."
            onClick={() => void reminder.run(() => new Promise((r) => setTimeout(r, 500)), `Lembrete enviado para ${c.name.split(" ")[0]} (${plural(mineMissing.length, "pendência", "pendências")})`)}
          >
            <Send /> Enviar lembrete ao contratado
          </OperationButton>
          <Button onClick={() => setConfirm(true)} disabled={missing.length > 0} disabledReason={`Faltam ${plural(missing.length, "item", "itens")} do checklist.`}>
            <CalendarClock /> Concluir admissão
          </Button>
        </footer>
      )}
      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        title={`Concluir a admissão de ${c.name}?`}
        description="O cadastro segue para a folha de pagamento e o contratado sai da lista de admissões em andamento."
        confirmLabel="Concluir admissão"
        onConfirm={() => {
          setConfirm(false);
          onChange({ ...a, status: "concluida" });
          onConclude();
          notify(`Admissão de ${c.name.split(" ")[0]} concluída`, () => onChange({ ...a, status: "andamento" }));
        }}
      />
    </section>
  );
}
