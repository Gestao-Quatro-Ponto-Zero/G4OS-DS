import { Check, Plus, X } from "lucide-react";
import { useState } from "react";
import {
  Avatar,
  Badge,
  Button,
  Callout,
  Empty,
  Modal,
  NumberField,
  TextField,
  Page,
  PageHeading,
  PropertyList,
  Stepper,
  Tabs,
  areaClass,
  cn,
  formatCurrency,
  notify,
  type Tone,
} from "@g4os/ds";
import { supplierByName } from "./data/erp";
import { NexoShell } from "./shells/nexo-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Requisições de compra",
  description: "Fila de aprovação mestre-detalhe: cadeia de aprovadores, itens, comparação de cotações com o menor preço destacado e aprovar/recusar com justificativa.",
  category: "ERP",
  order: 7,
  height: 960,
} as const;

/* ------------------------------------------------------------------ */
/* Dados de exemplo                                                    */
/* ------------------------------------------------------------------ */

type ReqStatus = "pendente" | "aprovada" | "recusada";
type Request = {
  id: string;
  number: string;
  title: string;
  requester: { name: string; initials: string; area: string };
  date: string;
  need: string;
  costCenter: string;
  items: { name: string; qty: number; unit: string }[];
  quotes: { supplier: string; total: number; delivery: string; terms: string }[];
  chain: { role: string; who: string; state: "done" | "current" | "upcoming" }[];
  status: ReqStatus;
  urgent?: boolean;
};

const requests: Request[] = [
  {
    id: "r1",
    number: "RC-2026-0412",
    title: "Reposição de chapas de aço 2 mm e 3 mm",
    requester: { name: "Sérgio Moura", initials: "SM", area: "Almoxarifado" },
    date: "30/09",
    need: "08/10/2026",
    costCenter: "1.02 · Estoque de revenda",
    items: [
      { name: "Chapa aço carbono 2 mm 1200 × 3000", qty: 120, unit: "un" },
      { name: "Chapa aço carbono 3 mm 1200 × 3000", qty: 80, unit: "un" },
    ],
    quotes: [
      { supplier: "Usiminas Distribuição", total: 98_400, delivery: "5 dias úteis", terms: "28/56 dias" },
      { supplier: "Gerdau Comercial", total: 101_900, delivery: "3 dias úteis", terms: "30 dias" },
      { supplier: "Aço Brasil Metais", total: 96_200, delivery: "12 dias úteis", terms: "à vista" },
    ],
    chain: [
      { role: "Solicitante", who: "Sérgio Moura", state: "done" },
      { role: "Gestor da área", who: "Fernanda Luz", state: "done" },
      { role: "Compras", who: "Você", state: "current" },
      { role: "Diretoria financeira", who: "acima de R$ 50 mil", state: "upcoming" },
    ],
    status: "pendente",
    urgent: true,
  },
  {
    id: "r2",
    number: "RC-2026-0409",
    title: "Notebooks para novo time comercial",
    requester: { name: "Paulo Menezes", initials: "PM", area: "Comercial" },
    date: "29/09",
    need: "20/10/2026",
    costCenter: "3.01 · Comercial",
    items: [{ name: "Notebook i7 16 GB 512 GB SSD", qty: 6, unit: "un" }],
    quotes: [
      { supplier: "Kabum Empresas", total: 31_140, delivery: "7 dias", terms: "30 dias" },
      { supplier: "Dell Brasil", total: 33_600, delivery: "15 dias", terms: "30/60 dias" },
    ],
    chain: [
      { role: "Solicitante", who: "Paulo Menezes", state: "done" },
      { role: "Gestor da área", who: "Rafael Queiroz", state: "done" },
      { role: "Compras", who: "Você", state: "current" },
    ],
    status: "pendente",
  },
  {
    id: "r3",
    number: "RC-2026-0405",
    title: "EPIs trimestrais · luvas e óculos",
    requester: { name: "Sérgio Moura", initials: "SM", area: "Almoxarifado" },
    date: "26/09",
    need: "05/10/2026",
    costCenter: "4.10 · Segurança do trabalho",
    items: [
      { name: "Luva de vaqueta", qty: 400, unit: "par" },
      { name: "Óculos de proteção incolor", qty: 150, unit: "un" },
    ],
    quotes: [{ supplier: "Protege EPI", total: 5_870, delivery: "4 dias", terms: "28 dias" }],
    chain: [
      { role: "Solicitante", who: "Sérgio Moura", state: "done" },
      { role: "Gestor da área", who: "Fernanda Luz", state: "current" },
      { role: "Compras", who: "Você", state: "upcoming" },
    ],
    status: "pendente",
  },
  {
    id: "r4",
    number: "RC-2026-0398",
    title: "Manutenção preventiva da ponte rolante",
    requester: { name: "Diego Araújo", initials: "DA", area: "Manutenção" },
    date: "22/09",
    need: "30/09/2026",
    costCenter: "5.02 · Manutenção",
    items: [{ name: "Serviço de manutenção preventiva", qty: 1, unit: "sv" }],
    quotes: [{ supplier: "Içamento Centro-Oeste", total: 7_900, delivery: "agendado 29/09", terms: "30 dias" }],
    chain: [
      { role: "Solicitante", who: "Diego Araújo", state: "done" },
      { role: "Gestor da área", who: "Fernanda Luz", state: "done" },
      { role: "Compras", who: "Você", state: "done" },
    ],
    status: "aprovada",
  },
];

const statusBadge: Record<ReqStatus, { label: string; tone: Tone }> = {
  pendente: { label: "Aguardando", tone: "warn" },
  aprovada: { label: "Aprovada", tone: "ok" },
  recusada: { label: "Recusada", tone: "bad" },
};

/* ------------------------------------------------------------------ */

export default function ErpPurchaseRequests() {
  const [list, setList] = useState(requests);
  const [tab, setTab] = useState<"minhas" | "todas">("minhas");
  const [selectedId, setSelectedId] = useState("r1");
  const [comment, setComment] = useState("");
  const [quote, setQuote] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [item, setItem] = useState("");
  const [qty, setQty] = useState<number | null>(1);
  const create = () => {
    const n = list.length + 413;
    const r: Request = {
      id: `n${n}`,
      number: `RC-2026-0${n}`,
      title,
      requester: { name: "Luíza Prado", initials: "LP", area: "Compras" },
      date: "30/09",
      need: "15/10/2026",
      costCenter: "1.02 · Estoque de revenda",
      items: [{ name: item || title, qty: qty ?? 1, unit: "un" }],
      quotes: [],
      chain: [
        { role: "Solicitante", who: "Luíza Prado", state: "done" },
        { role: "Gestor da área", who: "Fernanda Luz", state: "current" },
        { role: "Compras", who: "Você", state: "upcoming" },
      ],
      status: "pendente",
    };
    setList((all) => [r, ...all]);
    setTab("todas");
    setSelectedId(r.id);
    setCreating(false);
    setTitle("");
    setItem("");
    notify(`${r.number} criada · aguardando o gestor da área`);
  };

  const mine = (r: Request) => r.status === "pendente" && r.chain.some((c) => c.who === "Você" && c.state === "current");
  const visible = tab === "minhas" ? list.filter(mine) : list;
  const current = list.find((r) => r.id === selectedId) ?? visible[0];
  const best = current && current.quotes.length ? Math.min(...current.quotes.map((q) => q.total)) : 0;
  const chosen = current?.quotes.find((q) => q.supplier === quote) ?? current?.quotes.find((q) => q.total === best);

  const decide = (status: ReqStatus) => {
    if (!current) return;
    if (status === "recusada" && !comment.trim()) {
      notify("Escreva o motivo para recusar", undefined, "info");
      return;
    }
    setList((all) =>
      all.map((r) =>
        r.id === current.id ? { ...r, status: status === "aprovada" && r.chain.some((c) => c.state === "upcoming") ? "pendente" : status, chain: r.chain.map((c) => (c.who === "Você" ? { ...c, state: "done" } : c.state === "upcoming" && status === "aprovada" ? { ...c, state: "current" } : c)) } : r,
      ),
    );
    setComment("");
    notify(status === "aprovada" ? `${current.number} aprovada${current.chain.some((c) => c.state === "upcoming") ? " · seguiu para a diretoria" : ""}` : `${current.number} recusada`);
  };

  return (
    <NexoShell section="compras">
      <Page>
        <PageHeading
          title="Requisições de compra"
          description="Aprovação em cadeia: gestor da área → Compras → diretoria acima de R$ 50 mil."
          actions={
            <Button onClick={() => setCreating(true)}>
              <Plus /> Nova requisição
            </Button>
          }
        />
        <Tabs
          className="mt-4"
          label="Filtro"
          value={tab}
          onChange={(v) => setTab(v as typeof tab)}
          items={[
            { id: "minhas", label: "Aguardando você", count: list.filter(mine).length },
            { id: "todas", label: "Todas" },
          ]}
        />
        <div className="mt-5 grid gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
          {/* Lista */}
          <ul className="m-0 list-none space-y-2 p-0" aria-label="Requisições">
            {visible.length === 0 && <Empty title="Nada aguardando você" hint="Novas requisições aparecem aqui quando chegarem à sua etapa." />}
            {visible.map((r) => {
              const on = r.id === current?.id;
              return (
                <li key={r.id}>
                  <button
                    type="button"
                    aria-current={on ? "true" : undefined}
                    onClick={() => {
                      setSelectedId(r.id);
                      setQuote(null);
                    }}
                    className={cn("w-full rounded-xl border px-4 py-3 text-left transition-colors", on ? "border-line-strong bg-surface shadow-raised" : "border-line bg-surface hover:border-line-strong")}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[11.5px] text-muted">{r.number}</span>
                      <span className="flex gap-1">
                        {r.urgent && r.status === "pendente" && <Badge tone="bad">Urgente</Badge>}
                        <Badge tone={statusBadge[r.status].tone}>{statusBadge[r.status].label}</Badge>
                      </span>
                    </div>
                    <div className="mt-1.5 text-[13.5px] font-medium leading-snug">{r.title}</div>
                    <div className="mt-1.5 flex items-center justify-between gap-2 text-[12px] text-muted">
                      <span className="truncate">
                        {r.requester.name} · {r.requester.area}
                      </span>
                      <span className="shrink-0 font-medium tabular-nums text-ink">{r.quotes.length ? formatCurrency(Math.min(...r.quotes.map((q) => q.total)), { cents: false }) : "em cotação"}</span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Detalhe */}
          {current && (
            <section className="min-w-0 rounded-2xl border border-line bg-surface" aria-label={`Requisição ${current.number}`}>
              <header className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-6 py-5">
                <div className="min-w-0">
                  <div className="text-[12px] text-muted">
                    <span className="font-mono">{current.number}</span> · aberta em {current.date}
                  </div>
                  <h2 className="m-0 mt-1 text-[18px] font-semibold tracking-tight">{current.title}</h2>
                  <div className="mt-2 flex items-center gap-2 text-[12.5px] text-muted">
                    <Avatar initials={current.requester.initials} size="sm" name={current.requester.name} />
                    {current.requester.name} · {current.requester.area}
                  </div>
                </div>
                <Badge tone={statusBadge[current.status].tone}>{statusBadge[current.status].label}</Badge>
              </header>

              <div className="space-y-7 px-6 py-6">
                <div>
                  <Stepper label="Cadeia de aprovação" steps={current.chain.map((c, i) => ({ id: String(i), label: c.role, hint: c.who, state: c.state }))} />
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <h3 className="m-0 mb-2 text-[13px] font-medium">Itens</h3>
                    <ul className="m-0 list-none divide-y divide-line rounded-xl border border-line p-0">
                      {current.items.map((it) => (
                        <li key={it.name} className="flex justify-between gap-3 px-3 py-2.5 text-[13px]">
                          <span className="min-w-0">{it.name}</span>
                          <span className="shrink-0 tabular-nums text-muted">
                            {it.qty} {it.unit}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <PropertyList
                    items={[
                      { label: "Necessário até", value: current.need },
                      { label: "Centro de custo", value: current.costCenter },
                      { label: "Fornecedor escolhido", value: chosen?.supplier },
                    ]}
                  />
                </div>

                <div>
                  <h3 className="m-0 mb-2 text-[13px] font-medium">Cotações · {current.quotes.length}</h3>
                  {current.quotes.length === 0 && <Empty title="Sem cotações ainda" hint="Compras cota com pelo menos 3 fornecedores depois da aprovação do gestor." />}
                  {current.quotes.length < 3 && (
                    <div className="mb-3">
                      <Callout tone="warn">A política pede 3 cotações acima de R$ 5 mil. Justifique se for aprovar assim.</Callout>
                    </div>
                  )}
                  <div role="radiogroup" aria-label="Escolher cotação" className="grid gap-2 sm:grid-cols-3">
                    {current.quotes.map((q) => {
                      const on = chosen?.supplier === q.supplier;
                      return (
                        <button
                          key={q.supplier}
                          type="button"
                          role="radio"
                          aria-checked={on}
                          disabled={current.status !== "pendente"}
                          onClick={() => setQuote(q.supplier)}
                          className={cn("rounded-xl border px-3.5 py-3 text-left transition-colors", on ? "border-ink bg-surface ring-1 ring-ink" : "border-line bg-surface hover:border-line-strong")}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate text-[12.5px] font-medium">{q.supplier}</span>
                            {q.total === best && <Badge tone="ok">Menor preço</Badge>}
                          </div>
                          <div className="mt-1.5 text-[16px] font-semibold tabular-nums tracking-tight">{formatCurrency(q.total, { cents: false })}</div>
                          <div className="mt-0.5 text-[11.5px] text-muted">
                            {q.delivery} · {q.terms}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {current.quotes.some((q) => supplierByName(q.supplier)) && (
                    <p className="m-0 mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-muted">
                      Pontualidade (OTIF):
                      {current.quotes.map((q) => {
                        const sup = supplierByName(q.supplier);
                        return sup ? (
                          <a key={q.supplier} href={`#/frame/erp-suppliers?id=${sup.id}`} className="font-medium text-blue hover:underline">
                            {q.supplier} {Math.round(sup.otif * 100)}%
                          </a>
                        ) : null;
                      })}
                    </p>
                  )}
                </div>

                {mine(current) && (
                  <div className="rounded-xl border border-line bg-soft/40 p-4">
                    <label htmlFor="req-comment" className="text-[12.5px] font-medium">
                      Comentário <span className="font-normal text-muted">(obrigatório para recusar)</span>
                    </label>
                    <textarea id="req-comment" rows={2} value={comment} onChange={(e) => setComment(e.target.value)} className={`${areaClass} mt-2 resize-none`} placeholder="Ex.: prazo da Aço Brasil não atende a necessidade de 08/10." />
                    <div className="mt-3 flex flex-wrap justify-end gap-2">
                      <Button variant="ghost" onClick={() => decide("recusada")}>
                        <X /> Recusar
                      </Button>
                      <Button onClick={() => decide("aprovada")}>
                        <Check /> Aprovar cotação
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      </Page>
      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title="Nova requisição de compra"
        description="Vai para o gestor da área e depois para Compras cotar. Acima de R$ 50 mil, também para a diretoria."
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreating(false)}>
              Cancelar
            </Button>
            <Button onClick={create} disabled={!title.trim()}>
              Enviar requisição
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_140px]">
          <TextField className="sm:col-span-2" label="O que você precisa" value={title} onChange={setTitle} placeholder="Ex.: Reposição de discos de corte" />
          <TextField label="Item" value={item} onChange={setItem} optional />
          <NumberField label="Quantidade" value={qty} onChange={setQty} min={1} />
        </div>
      </Modal>
    </NexoShell>
  );
}
