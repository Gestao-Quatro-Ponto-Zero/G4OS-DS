import { Check, FileSignature, Send, X } from "lucide-react";
import { useState } from "react";
import {
  Avatar,
  Badge,
  Button,
  Callout,
  ConfirmDialog,
  CurrencyField,
  Page,
  PageHeading,
  PropertyList,
  Stepper,
  Tabs,
  formatCurrency,
  notify,
} from "@g4os/ds";
import { candidateById, iso, jobById, me, offerStatus, offers as seed, person, shortDate, type Offer, type OfferStatus } from "./data/ats";
import { go, useFrameParam } from "./shells/frame-route";
import { TalentosShell } from "./shells/talentos-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Propostas",
  description: "Propostas de contratação em lista + detalhe: cadeia de aprovação, alerta de salário fora da faixa, envio, prazo de resposta e desfecho. Ações mudam com a situação.",
  category: "ATS",
  order: 8,
  height: 900,
} as const;

const tabs: { id: "abertas" | OfferStatus | "todas"; label: string; match: (o: Offer) => boolean }[] = [
  { id: "abertas", label: "Em andamento", match: (o) => ["rascunho", "aprovacao", "enviada"].includes(o.status) },
  { id: "aceita", label: "Aceitas", match: (o) => o.status === "aceita" },
  { id: "recusada", label: "Recusadas", match: (o) => o.status === "recusada" },
];

export default function AtsOffers() {
  const candidato = useFrameParam("candidato");
  const [list, setList] = useState<Offer[]>(() => {
    if (!candidato || seed.some((o) => o.candidateId === candidato)) return seed;
    const c = candidateById(candidato);
    return [{ id: `o-${c.id}`, candidateId: c.id, jobId: c.jobId, salary: c.salaryExpectation, bonus: "PLR", start: iso(30), status: "rascunho", createdAt: iso(0), approvals: [{ who: me.id, state: "current" }, { who: jobById(c.jobId).manager, state: "upcoming" }] }, ...seed];
  });
  const initial = list.find((o) => o.candidateId === candidato) ?? list[0];
  const [selected, setSelected] = useState(initial.id);
  const [tab, setTab] = useState<(typeof tabs)[number]["id"]>(tabs.find((t) => t.match(initial))?.id ?? "abertas");
  const [decline, setDecline] = useState(false);
  const shown = list.filter(tabs.find((t) => t.id === tab)!.match);
  const o = list.find((x) => x.id === selected) ?? shown[0];
  const update = (patch: Partial<Offer>, msg: string) => {
    const before = list;
    setList((all) => all.map((x) => (x.id === o.id ? { ...x, ...patch } : x)));
    notify(msg, () => setList(before));
  };

  return (
    <TalentosShell section="propostas">
      <Page>
        <PageHeading title="Propostas" description="Da proposta rascunhada ao aceite. Salário acima da faixa exige aprovação da diretoria." />
        <Tabs
          className="mt-4"
          label="Situação"
          value={tab}
          onChange={(t) => {
            setTab(t as typeof tab);
            const first = list.find(tabs.find((x) => x.id === t)!.match);
            if (first) setSelected(first.id);
          }}
          items={tabs.map((t) => ({ id: t.id, label: `${t.label} · ${list.filter(t.match).length}` }))}
        />
        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(280px,360px)_minmax(0,1fr)]">
          <ul className="list-none space-y-2 p-0">
            {shown.map((x) => {
              const c = candidateById(x.candidateId);
              const st = offerStatus[x.status];
              return (
                <li key={x.id}>
                  <button
                    type="button"
                    aria-pressed={x.id === o?.id}
                    onClick={() => setSelected(x.id)}
                    className="flex w-full items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 text-left hover:border-line-strong aria-pressed:border-ink aria-pressed:shadow-[0_0_0_1px_var(--ds-ink)]"
                  >
                    <Avatar initials={c.initials} tint={c.tint} name={c.name} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] font-medium">{c.name}</span>
                      <span className="block truncate text-[12px] text-muted">{jobById(x.jobId).short} · {formatCurrency(x.salary, { cents: false })}</span>
                    </span>
                    <Badge tone={st.tone}>{st.label}</Badge>
                  </button>
                </li>
              );
            })}
            {!shown.length && <li className="rounded-xl border border-dashed border-line px-4 py-8 text-center text-[13px] text-muted">Nenhuma proposta aqui.</li>}
          </ul>
          {o && <OfferDetail key={o.id} offer={o} onUpdate={update} onDecline={() => setDecline(true)} />}
        </div>
      </Page>
      <ConfirmDialog
        open={decline}
        onClose={() => setDecline(false)}
        title="Registrar recusa da proposta?"
        description="A candidatura vai para o banco de talentos e a vaga volta para as entrevistas finais."
        confirmLabel="Registrar recusa"
        tone="danger"
        onConfirm={() => {
          setDecline(false);
          update({ status: "recusada" }, "Recusa registrada");
        }}
      />
    </TalentosShell>
  );
}

function OfferDetail({ offer: o, onUpdate, onDecline }: { offer: Offer; onUpdate: (p: Partial<Offer>, msg: string) => void; onDecline: () => void }) {
  const c = candidateById(o.candidateId);
  const job = jobById(o.jobId);
  const [salary, setSalary] = useState<number | null>(o.salary);
  const above = (salary ?? 0) > job.salary[1];
  const current = o.approvals.find((a) => a.state === "current");
  return (
    <section className="min-w-0 rounded-xl border border-line bg-surface">
      <header className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-4">
        <Avatar initials={c.initials} tint={c.tint} name={c.name} />
        <div className="min-w-0 flex-1">
          <button type="button" onClick={() => go("ats-candidate", c.id)} className="block truncate text-left text-[14px] font-medium hover:underline">
            {c.name}
          </button>
          <div className="truncate text-[12px] text-muted">{job.title}</div>
        </div>
        <Badge tone={offerStatus[o.status].tone}>{offerStatus[o.status].label}</Badge>
      </header>
      <div className="space-y-5 px-5 py-4">
        {above && o.status !== "aceita" && o.status !== "recusada" && (
          <Callout tone="warn" title="Salário acima da faixa da vaga">
            Faixa aprovada: {formatCurrency(job.salary[0], { cents: false })} – {formatCurrency(job.salary[1], { cents: false })}. A proposta precisa do aval da diretoria.
          </Callout>
        )}
        {o.note && <p className="m-0 text-[13px] leading-relaxed text-ink-soft">{o.note}</p>}
        <div>
          <h3 className="m-0 mb-3 text-[12.5px] font-medium text-muted">Aprovações</h3>
          <Stepper steps={o.approvals.map((a, i) => ({ id: String(i), label: person(a.who).name, hint: person(a.who).role, state: a.state }))} label="Cadeia de aprovação" />
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {o.status === "rascunho" ? (
            <CurrencyField label="Salário mensal" value={salary} onChange={setSalary} hint={`Pretensão: ${formatCurrency(c.salaryExpectation, { cents: false })}`} />
          ) : (
            <PropertyList items={[{ label: "Salário mensal", value: formatCurrency(o.salary, { cents: false }), hint: `pretensão ${formatCurrency(c.salaryExpectation, { cents: false })}` }]} />
          )}
          <PropertyList
            items={[
              { label: "Variável", value: o.bonus },
              { label: "Início", value: new Date(`${o.start}T00:00:00`).toLocaleDateString("pt-BR") },
              { label: "Criada em", value: shortDate(o.createdAt) },
              { label: "Responder até", value: o.expiresAt ? shortDate(o.expiresAt) : undefined },
            ]}
          />
        </div>
      </div>
      <footer className="flex flex-wrap justify-end gap-2 border-t border-line bg-soft/40 px-5 py-3">
        {o.status === "rascunho" && (
          <Button onClick={() => onUpdate({ status: "aprovacao", salary: salary ?? o.salary, approvals: o.approvals.map((a, i) => ({ ...a, state: i === 0 ? "done" : i === 1 ? "current" : a.state })) }, "Proposta enviada para aprovação")}>
            <FileSignature /> Enviar para aprovação
          </Button>
        )}
        {o.status === "aprovacao" && (
          <>
            <Button variant="ghost" onClick={() => onUpdate({ status: "rascunho" }, `Proposta devolvida para ajuste por ${current ? person(current.who).name : "aprovador"}`)}>
              <X /> Devolver
            </Button>
            <Button onClick={() => onUpdate({ status: "enviada", expiresAt: iso(3), approvals: o.approvals.map((a) => ({ ...a, state: "done" })) }, `Aprovada e enviada para ${c.name.split(" ")[0]}`)}>
              <Check /> Aprovar e enviar
            </Button>
          </>
        )}
        {o.status === "enviada" && (
          <>
            <Button variant="ghost" onClick={onDecline}>
              Registrar recusa
            </Button>
            <Button variant="ghost" onClick={() => notify("Lembrete enviado ao candidato", undefined, "info")}>
              <Send /> Lembrar
            </Button>
            <Button onClick={() => onUpdate({ status: "aceita" }, `${c.name.split(" ")[0]} aceitou a proposta`)}>
              <Check /> Registrar aceite
            </Button>
          </>
        )}
        {o.status === "aceita" && <Button onClick={() => notify("Admissão iniciada: documentos solicitados por e-mail")}>Iniciar admissão</Button>}
        {o.status === "recusada" && (
          <Button variant="ghost" onClick={() => go("ats-pipeline", o.jobId)}>
            Voltar às finalistas da vaga
          </Button>
        )}
      </footer>
    </section>
  );
}
