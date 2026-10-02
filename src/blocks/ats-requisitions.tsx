import { Briefcase, Check, X } from "lucide-react";
import { useState } from "react";
import {
  Avatar,
  Badge,
  Button,
  Callout,
  Empty,
  Modal,
  OperationButton,
  OperationFeedback,
  Page,
  PageHeading,
  PropertyList,
  Stepper,
  Tabs,
  TextareaField,
  formatCurrency,
  formatDate,
  notify,
  useOperation,
} from "@g4ai/ds";
import { iso, me, person, requisitionStatus, requisitions as seed, type Requisition } from "./data/ats";
import { frameHref, setFrameQuery, useFrameParam } from "./shells/frame-route";
import { LoadError, LoadingRows, TalentosShell, useListState } from "./shells/talentos-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Requisições de vaga",
  description: "Fila de aprovação de novas vagas: quem pede, motivo (aumento de quadro ou substituição), faixa, orçamento anual e cadeia de aprovação. Aprovar libera a abertura da vaga; recusar exige motivo. Seleção em ?id=.",
  category: "ATS",
  order: 10,
  height: 940,
  concept: {
    goal: "Decidir rápido quais vagas podem ser abertas, com orçamento e justificativa à vista.",
    patterns: [
      "Anatomia F · Mestre-detalhe: fila à esquerda, requisição à direita; seleção no endereço (?id=)",
      "Aba “Aguardando você” primeiro; contador na navegação só com o que pede ação",
      "Cadeia de aprovação em Stepper; recusar pede motivo obrigatório",
      "Abrir vaga (ats-job ?id=nova) envia para cá: ?nova=<título> entra no topo da fila",
      "Cinco estados: ?estado=carregando|vazio|erro simula",
    ],
    adapt: [
      "Aprovação de compras (ERP), descontos acima da alçada (CRM), reembolsos",
    ],
    avoid: [
      "Recusar sem motivo (o gestor não sabe o que ajustar)",
      "Abrir vaga sem orçamento aprovado",
    ],
  },
} as const;

const awaitingMe = (r: Requisition) => r.status === "pendente" && r.approvals.some((a) => a.who === me.id && a.state === "current");

export default function AtsRequisitions() {
  const id = useFrameParam("id");
  const nova = useFrameParam("nova");
  const estado = useListState();
  const [list, setList] = useState<Requisition[]>(() => {
    if (!nova) return seed;
    // Vinda do formulário "Abrir vaga": entra no topo, aguardando você.
    const r: Requisition = {
      id: "r-nova",
      number: "REQ-0143",
      title: nova,
      area: "Tecnologia",
      requester: "marcos",
      reason: "Aumento de quadro",
      salary: [18_000, 26_000],
      openings: 1,
      budget: Math.round(26_000 * 13.3 * 1.7),
      status: "pendente",
      createdAt: iso(0),
      approvals: [{ who: "marcos", state: "done" }, { who: me.id, state: "current" }, { who: "rafael", state: "upcoming" }],
      justification: "Requisição criada agora pelo formulário de abertura de vaga.",
    };
    return [r, ...seed];
  });
  const [tab, setTab] = useState<"minhas" | "todas">("minhas");
  const visible = tab === "minhas" ? list.filter(awaitingMe) : list;
  const current = visible.find((r) => r.id === (id ?? (nova ? "r-nova" : ""))) ?? visible[0];

  return (
    <TalentosShell section="requisicoes">
      <Page>
        <PageHeading
          title="Requisições de vaga"
          description="Toda vaga nova passa por aqui: gestor da área → Recrutamento → diretoria quando aumenta o quadro."
          actions={
            <Button href={frameHref("ats-job", "nova")}>
              <Briefcase /> Nova requisição
            </Button>
          }
        />
        <Tabs
          className="mt-4"
          label="Fila"
          value={tab}
          onChange={(t) => setTab(t as typeof tab)}
          items={[
            { id: "minhas", label: "Aguardando você", count: list.filter(awaitingMe).length },
            { id: "todas", label: "Todas" },
          ]}
        />
        {estado === "carregando" ? (
          <div className="mt-5 grid gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
            <LoadingRows variant="cards" rows={4} label="Carregando requisições" />
            <LoadingRows rows={5} label="Carregando detalhe da requisição" />
          </div>
        ) : estado === "erro" ? (
          <div className="mt-5">
            <LoadError what="as requisições" />
          </div>
        ) : estado === "vazio" ? (
          <div className="mt-5">
            <Empty
              title="Nenhuma requisição de vaga"
              hint="Quando um gestor pedir uma vaga nova, ela aparece aqui para aprovação antes de ir para a página de carreiras."
              action={<Button href={frameHref("ats-job", "nova")}>Criar requisição</Button>}
            />
          </div>
        ) : (
          <div className="mt-5 grid items-start gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
            <ul className="m-0 list-none space-y-2 p-0" aria-label="Requisições">
              {visible.map((r) => {
                const st = requisitionStatus[r.status];
                return (
                  <li key={r.id}>
                    <button
                      type="button"
                      aria-current={r.id === current?.id ? "true" : undefined}
                      onClick={() => setFrameQuery({ id: r.id })}
                      className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-left hover:border-line-strong aria-[current=true]:border-line-strong aria-[current=true]:shadow-raised"
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[11.5px] text-muted">{r.number}</span>
                        <Badge tone={st.tone}>{st.label}</Badge>
                      </span>
                      <span className="mt-1.5 block text-[13.5px] font-medium leading-snug">{r.title}</span>
                      <span className="mt-1.5 flex items-center justify-between gap-2 text-[12px] text-muted">
                        <span className="truncate">
                          {person(r.requester).name} · {r.area}
                        </span>
                        <span className="shrink-0 tabular-nums">{r.openings > 1 ? `${r.openings} vagas` : "1 vaga"}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
              {!visible.length && (
                <li>
                  <Empty
                    title="Nada aguardando você"
                    hint="As requisições chegam aqui quando passam pela sua etapa de aprovação."
                    action={
                      <Button variant="ghost" onClick={() => setTab("todas")}>
                        Ver todas as requisições
                      </Button>
                    }
                  />
                </li>
              )}
            </ul>
            {current && <RequisitionDetail key={current.id} req={current} onChange={(next) => setList((all) => all.map((r) => (r.id === next.id ? next : r)))} />}
          </div>
        )}
      </Page>
    </TalentosShell>
  );
}

function RequisitionDetail({ req: r, onChange }: { req: Requisition; onChange: (r: Requisition) => void }) {
  const approve = useOperation({ busyLabel: "Aprovando…" });
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState("");
  const [tried, setTried] = useState(false);
  const mine = awaitingMe(r);
  const st = requisitionStatus[r.status];

  const doApprove = () => {
    const before = r;
    const hasNext = r.approvals.some((a) => a.state === "upcoming");
    const next: Requisition = {
      ...r,
      status: hasNext ? "pendente" : "aprovada",
      approvals: r.approvals.map((a, i, all) => (a.who === me.id && a.state === "current" ? { ...a, state: "done" } : a.state === "upcoming" && all.slice(0, i).every((x) => x.state !== "upcoming") ? { ...a, state: "current" } : a)),
    };
    void approve.run(
      () => new Promise((res) => setTimeout(res, 600)),
      { message: hasNext ? `${r.number} aprovada · seguiu para ${person(r.approvals.find((a) => a.state === "upcoming")!.who).name}` : `${r.number} aprovada · vaga liberada para abertura`, undo: () => onChange(before) },
      { apply: () => onChange(next), revert: () => onChange(before) },
    );
  };
  const doDecline = () => {
    setTried(true);
    if (!reason.trim()) return;
    const before = r;
    onChange({ ...r, status: "recusada", declineReason: reason.trim(), approvals: r.approvals.map((a) => (a.who === me.id ? { ...a, state: "done" } : a)) });
    setDeclining(false);
    notify(`${r.number} recusada · ${person(r.requester).name.split(" ")[0]} foi avisado(a)`, () => onChange(before));
  };

  return (
    <section className="min-w-0 rounded-2xl border border-line bg-surface" aria-label={`Requisição ${r.number}`}>
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-6 py-5">
        <div className="min-w-0">
          <div className="text-[12px] text-muted">
            <span className="font-mono">{r.number}</span> · aberta em {formatDate(r.createdAt)}
          </div>
          <h2 className="m-0 mt-1 text-[18px] font-semibold tracking-tight">{r.title}</h2>
          <div className="mt-2 flex items-center gap-2 text-[12.5px] text-muted">
            <Avatar initials={person(r.requester).initials} tint={person(r.requester).tint} size="sm" name={person(r.requester).name} />
            {person(r.requester).name} · {person(r.requester).role}
          </div>
        </div>
        <Badge tone={st.tone}>{st.label}</Badge>
      </header>
      <div className="space-y-6 px-6 py-5">
        <OperationFeedback operation={approve} />
        {r.status === "recusada" && r.declineReason && (
          <Callout tone="bad" title="Motivo da recusa">
            {r.declineReason}
          </Callout>
        )}
        <div className="grid gap-6 md:grid-cols-2">
          <PropertyList
            items={[
              { label: "Motivo", value: r.reason, hint: r.replaces },
              { label: "Área", value: r.area },
              { label: "Vagas", value: String(r.openings) },
            ]}
          />
          <PropertyList
            items={[
              { label: "Faixa salarial", value: `${formatCurrency(r.salary[0], { cents: false })} – ${formatCurrency(r.salary[1], { cents: false })}` },
              { label: "Custo anual estimado", value: <span className="font-semibold tabular-nums">{formatCurrency(r.budget, { cents: false })}</span>, hint: "teto da faixa × 13,3 salários × encargos" },
            ]}
          />
        </div>
        <div>
          <h3 className="m-0 mb-2 text-[12.5px] font-medium text-muted">Justificativa</h3>
          <p className="m-0 text-[13.5px] leading-relaxed">{r.justification}</p>
        </div>
        <div>
          <h3 className="m-0 mb-3 text-[12.5px] font-medium text-muted">Aprovações</h3>
          <Stepper steps={r.approvals.map((a, i) => ({ id: String(i), label: person(a.who).name, hint: person(a.who).role, state: a.state }))} label="Cadeia de aprovação" />
        </div>
      </div>
      {(mine || r.status === "aprovada") && (
        <footer className="flex flex-wrap justify-end gap-2 border-t border-line bg-soft/40 px-6 py-3">
          {mine ? (
            <>
              <Button variant="ghost" onClick={() => setDeclining(true)} disabled={approve.busy}>
                <X /> Recusar
              </Button>
              <OperationButton operation={approve} onClick={doApprove}>
                <Check /> Aprovar requisição
              </OperationButton>
            </>
          ) : (
            <Button href={frameHref("ats-job", "nova")}>
              <Briefcase /> Abrir vaga
            </Button>
          )}
        </footer>
      )}
      <Modal
        open={declining}
        onClose={() => setDeclining(false)}
        size="sm"
        title={`Recusar ${r.number}?`}
        description="O motivo vai para quem pediu, para ajustar e reenviar."
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeclining(false)}>
              Cancelar
            </Button>
            <Button onClick={doDecline}>Recusar requisição</Button>
          </>
        }
      >
        <TextareaField label="Motivo da recusa" value={reason} onChange={setReason} autosize minRows={3} placeholder="Ex.: sem orçamento de quadro no 4º trimestre; reavaliar em janeiro." error={tried && !reason.trim() ? "Escreva o motivo para recusar." : undefined} autoFocus />
      </Modal>
    </section>
  );
}
