import { Check, Plus, ShoppingBag, X } from "lucide-react";
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
} from "@g4ai/ds";
import { addPurchaseRequest, purchaseRequests, reqStatus, supplierByName, updatePurchaseRequest, type PurchaseRequest, type ReqStatus } from "./data/erp";
import { go, setFrameQuery, useFrameParam } from "./shells/frame-route";
import { CardsSkeleton, DemoErrorState, NexoShell, useDemoState } from "./shells/nexo-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Requisições de compra",
  description: "Fila de aprovação mestre-detalhe: cadeia de aprovadores, itens, comparação de cotações com o menor preço destacado e aprovar/recusar com justificativa.",
  category: "ERP",
  order: 7,
  height: 960,
  concept: {
    goal: "Aprovar ou recusar requisições de compra com a cotação certa e justificativa.",
    patterns: [
      "Anatomia F · Mestre-detalhe: fila à esquerda, requisição à direita",
      "Cadeia de aprovadores com etapa atual",
      "Comparação de cotações com o menor preço destacado",
      "Recusar exige justificativa",
    ],
    adapt: [
      "Aprovação de propostas (ATS), descontos (CRM), reembolsos",
    ],
    avoid: [
      "Aprovar sem ver as cotações",
    ],
  },
} as const;

type Request = PurchaseRequest;
const statusBadge = reqStatus;

/* ------------------------------------------------------------------ */

export default function ErpPurchaseRequests() {
  const demo = useDemoState();
  const idParam = useFrameParam("id");
  // A lista relê o "banco" a cada visita: a requisição criada no estoque ou no produto já aparece.
  const [list, setList] = useState<Request[]>(() => (demo === "vazio" ? [] : [...purchaseRequests]));
  const opened = idParam ? list.find((r) => r.id === idParam) : undefined;
  const [tab, setTab] = useState<"minhas" | "todas">(() => (opened && !(opened.status === "pendente" && opened.chain.some((c) => c.who === "Você" && c.state === "current")) ? "todas" : "minhas"));
  const selectedId = idParam ?? "";
  const setSelectedId = (id: string) => setFrameQuery({ id });
  const [comment, setComment] = useState("");
  const [quote, setQuote] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [item, setItem] = useState("");
  const [qty, setQty] = useState<number | null>(1);
  const create = () => {
    const r = addPurchaseRequest({ title, items: [{ name: item || title, qty: qty ?? 1, unit: "un" }] });
    setList([...purchaseRequests]);
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
    const next: Request = {
      ...current,
      status: status === "aprovada" && current.chain.some((c) => c.state === "upcoming") ? "pendente" : status,
      chosen: status === "aprovada" ? chosen?.supplier : undefined,
      chain: current.chain.map((c) => (c.who === "Você" ? { ...c, state: "done" } : c.state === "upcoming" && status === "aprovada" ? { ...c, state: "current" } : c)),
    };
    updatePurchaseRequest(current.id, next);
    setList((all) => all.map((r) => (r.id === current.id ? next : r)));
    setComment("");
    notify(status === "aprovada" ? `${current.number} aprovada${current.chain.some((c) => c.state === "upcoming") ? " · seguiu para a diretoria" : ""}` : `${current.number} recusada`);
  };

  return (
    <NexoShell section="compras">
      <Page>
        <PageHeading
          crumbs={[{ label: "Compras" }]}
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
        {demo === "carregando" ? (
          <div className="mt-5 grid gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
            <CardsSkeleton label="Carregando requisições" />
            <div className="hidden rounded-2xl border border-line bg-surface p-6 lg:block">
              <CardsSkeleton rows={3} label="Carregando requisição" />
            </div>
          </div>
        ) : demo === "erro" ? (
          <div className="mt-5">
            <DemoErrorState noun="as requisições" />
          </div>
        ) : list.length === 0 ? (
          <div className="mt-5">
            <Empty title="Nenhuma requisição de compra" hint="Quem precisa de material abre a requisição; ela passa pelo gestor da área e chega a Compras para cotar." action={<Button size="sm" onClick={() => setCreating(true)}><Plus /> Nova requisição</Button>} />
          </div>
        ) : (
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
                  <div className="flex flex-col items-end gap-2">
                    <Badge tone={statusBadge[current.status].tone}>{statusBadge[current.status].label}</Badge>
                    {current.status === "aprovada" &&
                      (current.orderId ? (
                        <Button size="sm" variant="ghost" onClick={() => go("erp-purchase-order", current.orderId)}>
                          <ShoppingBag /> Ver pedido de compra
                        </Button>
                      ) : current.items.some((it) => it.sku) ? (
                        <Button size="sm" onClick={() => go("erp-purchase-orders", { novo: "1", req: current.id })}>
                          <ShoppingBag /> Gerar pedido de compra
                        </Button>
                      ) : null)}
                  </div>
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
        )}
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
