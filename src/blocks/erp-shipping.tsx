import { FileText, PackageCheck, PackageOpen, Printer, Truck } from "lucide-react";
import { useMemo, useState, type DragEvent } from "react";
import {
  Badge,
  Button,
  DataTable,
  Drawer,
  Empty,
  EntityMark,
  KanbanBoard,
  KanbanColumn,
  LocationTag,
  OperationButton,
  OperationFeedback,
  Page,
  PageHeading,
  PageToolbar,
  PropertyList,
  RecordCard,
  SegmentedControl,
  Select,
  Skeleton,
  StatCell,
  StatGrid,
  TextField,
  Timeline,
  chartColor,
  formatCurrency,
  formatNumber,
  notify,
  useOperation,
  type Column,
} from "@g4ai/ds";
import { br, carriers, customerById, daysAgo, iso, orderById, originOf, shipFlow, shipStatus, shipmentLate, shipments as seed, updateOrder, warehouses, type ShipStatus, type Shipment, type WarehouseId } from "./data/erp";
import { go, setFrameQuery, useFrameParam } from "./shells/frame-route";
import { DemoErrorState, NexoShell, demoError, useDemoState } from "./shells/nexo-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Expedição",
  description: "Pedidos faturados do separar à entrega em quadro: transportadora, rastreio e prazo no cartão, atraso em destaque, CD de origem e destino com hora local, rastreio em linha do tempo na gaveta e despacho com transportadora e código.",
  category: "ERP",
  order: 15,
  height: 980,
  concept: {
    goal: "Fazer o pedido faturado sair do CD e chegar no prazo, vendo onde cada carga está.",
    patterns: [
      "Anatomia E · Quadro: A separar → Separados → Em trânsito → Entregues; arrastar muda a etapa",
      "Detalhe em Drawer com LocationTag (CD de origem e destino com fuso) e Timeline do rastreio",
      "Despachar pede transportadora e código de rastreio; atraso em palavra no cartão",
      "Alternador Quadro/Lista (≥ 8 cargas) e cinco estados (?estado=)",
    ],
    adapt: [
      "Ordens de serviço em campo, coletas, devoluções de cliente",
    ],
    avoid: [
      "Despachar sem o código de rastreio",
      "Esconder o fuso do destino (Manaus é 1 h a menos)",
    ],
  },
} as const;

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const whName = (id: WarehouseId) => warehouses.find((w) => w.id === id)?.name ?? id;
const etaLabel = (s: Shipment) => {
  if (s.status === "entregue") return `entregue ${br(s.eta).slice(0, 5)}`;
  const d = -daysAgo(s.eta);
  return d < 0 ? `Atrasado ${-d === 1 ? "1 dia" : `${-d} dias`}` : d === 0 ? "entrega hoje" : d === 1 ? "entrega amanhã" : `prazo ${br(s.eta).slice(0, 5)}`;
};

export default function ErpShipping() {
  const demo = useDemoState();
  const openId = useFrameParam("id");
  const [list, setList] = useState<Shipment[]>(() => (demo === "vazio" ? [] : [...seed]));
  const [view, setView] = useState<"quadro" | "lista">("quadro");
  const [origin, setOrigin] = useState<"todos" | WarehouseId>("todos");
  const [dragging, setDragging] = useState<string | null>(null);
  const shown = useMemo(() => (origin === "todos" ? list : list.filter((s) => s.origin === origin)), [list, origin]);
  const current = openId ? list.find((s) => s.id === openId) : undefined;
  const late = list.filter(shipmentLate);

  const move = (id: string, status: ShipStatus, extra: Partial<Shipment> = {}) => {
    const s = list.find((x) => x.id === id);
    if (!s || s.status === status) return;
    const before = list;
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const event = { id: `ev${now.getTime()}`, date: iso(0), time, title: status === "separado" ? "Separado e conferido" : status === "transito" ? `Coletado por ${extra.carrier ?? s.carrier}` : status === "entregue" ? "Entrega confirmada" : "Voltou para separação", place: status === "entregue" ? `${s.dest.city}, ${s.dest.uf}` : originOf(s.origin).place, tone: status === "entregue" ? ("ok" as const) : undefined };
    setList((all) => all.map((x) => (x.id === id ? { ...x, ...extra, status, events: [event, ...x.events] } : x)));
    if (status === "transito") updateOrder(s.orderId, { status: "enviado" });
    if (status === "entregue") updateOrder(s.orderId, { status: "entregue" });
    notify(`${s.id} · ${shipStatus[status].label.toLowerCase()}`, () => setList(before));
  };
  const drop = (status: ShipStatus) => (e: DragEvent) => {
    const id = e.dataTransfer.getData("text/plain") || dragging || "";
    const s = list.find((x) => x.id === id);
    setDragging(null);
    // Em trânsito exige transportadora e rastreio: abre a gaveta em vez de mover direto.
    if (s && status === "transito" && !s.tracking) return setFrameQuery({ id });
    move(id, status);
  };

  const columns: Column<Shipment>[] = [
    {
      key: "customer",
      header: "Cliente",
      primary: true,
      cell: (s) => {
        const o = orderById(s.orderId);
        const c = customerById(o.customerId);
        return (
          <span className="flex items-center gap-2.5">
            <EntityMark name={c.name} tint={c.tint} className="h-7 w-7 text-[11px]" />
            <span className="min-w-0">
              <span className="block truncate">{c.name}</span>
              <span className="block truncate font-mono text-[11.5px] font-normal text-muted">
                {s.id} · {o.number}
              </span>
            </span>
          </span>
        );
      },
    },
    { key: "route", header: "Rota", mobileHidden: true, cell: (s) => <span className="text-ink-soft">{whName(s.origin).replace("CD ", "")} → {s.dest.city}/{s.dest.uf}</span> },
    { key: "carrier", header: "Transportadora", mobileHidden: true, cell: (s) => <span className="block leading-tight">{s.carrier}{s.tracking && <span className="block font-mono text-[11.5px] text-muted">{s.tracking}</span>}</span> },
    { key: "eta", header: "Prazo", nowrap: true, cell: (s) => <span className={shipmentLate(s) ? "font-medium text-rose" : "text-ink-soft"}>{etaLabel(s)}</span> },
    { key: "status", header: "Etapa", cell: (s) => <Badge tone={shipStatus[s.status].tone}>{shipStatus[s.status].label}</Badge> },
  ];

  return (
    <NexoShell section="expedicao">
      <Page className="flex flex-col">
        <PageHeading
          crumbs={[{ label: "Estoque" }]}
          title="Expedição"
          description="Pedidos faturados saem daqui. Arraste o cartão para mudar a etapa; despachar pede transportadora e rastreio."
          actions={
            <>
              <SegmentedControl label="Visualização" value={view} onChange={setView} options={[{ value: "quadro", label: "Quadro" }, { value: "lista", label: "Lista" }]} />
              <Button variant="ghost" onClick={() => window.print()}>
                <Printer /> Imprimir romaneio
              </Button>
            </>
          }
        />
        <StatGrid cols={4}>
          <StatCell label="A separar" value={list.filter((s) => s.status === "separar").length} hint="faturados hoje e ontem" />
          <StatCell label="Prontos para coleta" value={list.filter((s) => s.status === "separado").length} hint={`${formatNumber(list.filter((s) => s.status === "separado").reduce((a, s) => a + s.volumes, 0))} volumes`} />
          <StatCell label="Atrasados" value={late.length} tone={late.length ? "bad" : undefined} hint={late.length ? "fora do prazo prometido" : "nenhum fora do prazo"} />
          <StatCell label="Frete do período" value={formatCurrency(list.reduce((a, s) => a + s.freight, 0), { compact: true })} hint={`${list.length} cargas`} />
        </StatGrid>
        <PageToolbar>
          <div className="flex flex-wrap items-center gap-2">
            <Select label="CD de origem" hideLabel value={origin} onValueChange={(v) => setOrigin(v as typeof origin)} options={[{ value: "todos", label: "Todos os CDs" }, ...warehouses.map((w) => ({ value: w.id, label: w.name }))]} />
            <span className="text-[12.5px] text-muted">{shown.length === 1 ? "1 carga" : `${shown.length} cargas`}</span>
          </div>
        </PageToolbar>
        <div className="mt-4 flex min-h-0 flex-1 flex-col">
          {demo === "carregando" && view === "quadro" ? (
            <div role="status" aria-label="Carregando expedição" className="flex gap-3 overflow-hidden">
              {shipFlow.map((s) => (
                <div key={s} className="min-w-[260px] flex-1 space-y-2 rounded-2xl border border-line bg-soft/60 p-2">
                  <Skeleton className="m-2 h-3 w-24" />
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="space-y-2 rounded-xl border border-line bg-surface p-3">
                      <Skeleton className="h-3 w-3/4" />
                      <Skeleton className="h-2.5 w-1/2" />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : demo === "erro" && view === "quadro" ? (
            <DemoErrorState noun="a expedição" />
          ) : list.length === 0 && view === "quadro" ? (
            <Empty icon={<Truck />} title="Nenhuma carga para expedir" hint="Pedidos faturados entram aqui automaticamente para separação." action={<Button size="sm" variant="ghost" onClick={() => go("erp-orders")}>Ver pedidos aprovados</Button>} />
          ) : view === "lista" ? (
            <DataTable
              label="Cargas"
              rows={demo === "carregando" ? [] : shown}
              columns={columns}
              rowKey={(s) => s.id}
              onRowClick={(s) => setFrameQuery({ id: s.id })}
              rowLabel={(s) => `Abrir ${s.id}`}
              loading={demo === "carregando"}
              error={demoError(demo, "a expedição")}
              empty={list.length === 0 ? <Empty framed={false} icon={<Truck />} title="Nenhuma carga para expedir" hint="Pedidos faturados entram aqui automaticamente." /> : <Empty framed={false} title="Nenhuma carga deste CD" action={<Button size="sm" variant="ghost" onClick={() => setOrigin("todos")}>Limpar filtro</Button>} />}
            />
          ) : (
            <KanbanBoard label="Expedição por etapa" className="min-h-[480px] flex-1">
              {shipFlow.map((st, i) => {
                const col = shown.filter((s) => s.status === st);
                return (
                  <KanbanColumn key={st} title={shipStatus[st].label} count={col.length} dotColor={chartColor(i)} meta={`${formatNumber(col.reduce((a, s) => a + s.volumes, 0))} vol.`} onDrop={drop(st)} width={250}>
                    {col.length === 0 && <p className="m-0 px-2 py-6 text-center text-[12px] text-muted">Nenhuma carga</p>}
                    {col.map((s) => {
                      const o = orderById(s.orderId);
                      const c = customerById(o.customerId);
                      return (
                        <RecordCard
                          key={s.id}
                          title={c.name}
                          subtitle={`${o.number} · ${s.dest.city}/${s.dest.uf}`}
                          leading={<EntityMark name={c.name} tint={c.tint} className="h-6 w-6 text-[10px]" />}
                          tags={<Badge>{s.carrier.split(" ")[0]}</Badge>}
                          value={`${s.volumes} vol. · ${formatNumber(s.weightKg)} kg`}
                          meta={<span className={shipmentLate(s) ? "font-medium text-rose" : undefined}>{etaLabel(s)}</span>}
                          tone={shipmentLate(s) ? "bad" : undefined}
                          onOpen={() => setFrameQuery({ id: s.id })}
                          onDragStart={(e) => {
                            e.dataTransfer.setData("text/plain", s.id);
                            setDragging(s.id);
                          }}
                        />
                      );
                    })}
                  </KanbanColumn>
                );
              })}
            </KanbanBoard>
          )}
        </div>
      </Page>
      {current && <ShipmentDrawer key={current.id} s={current} onClose={() => setFrameQuery({ id: undefined })} onMove={move} />}
    </NexoShell>
  );
}

function ShipmentDrawer({ s, onClose, onMove }: { s: Shipment; onClose: () => void; onMove: (id: string, status: ShipStatus, extra?: Partial<Shipment>) => void }) {
  const o = orderById(s.orderId);
  const c = customerById(o.customerId);
  const [carrier, setCarrier] = useState(s.carrier);
  const [tracking, setTracking] = useState(s.tracking ?? "");
  const [tried, setTried] = useState(false);
  const op = useOperation({ busyLabel: "Despachando…" });
  const origin = originOf(s.origin);
  const late = shipmentLate(s);

  const dispatch = async () => {
    setTried(true);
    if (tracking.trim().length < 6) return;
    const failed = await op.run(() => wait(800));
    if (!failed) onMove(s.id, "transito", { carrier, tracking: tracking.trim().toUpperCase() });
  };

  const footer =
    s.status === "separar" ? (
      <Button onClick={() => onMove(s.id, "separado")}>
        <PackageOpen /> Marcar como separado
      </Button>
    ) : s.status === "separado" ? (
      <OperationButton operation={op} onClick={dispatch}>
        <Truck /> Despachar
      </OperationButton>
    ) : s.status === "transito" ? (
      <Button onClick={() => onMove(s.id, "entregue")}>
        <PackageCheck /> Confirmar entrega
      </Button>
    ) : (
      <Button variant="ghost" onClick={() => o.invoice && go("erp-invoice", o.invoice)}>
        <FileText /> Ver NF-e
      </Button>
    );

  return (
    <Drawer open onClose={onClose} kicker={`${s.id} · ${o.number}`} title={c.name} width={520} footer={footer}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={shipStatus[s.status].tone}>{shipStatus[s.status].label}</Badge>
          {late && <Badge tone="bad">{etaLabel(s)}</Badge>}
        </div>
        <section className="grid gap-3 rounded-xl border border-line p-3">
          <div>
            <div className="mb-1 text-[11.5px] text-muted">Origem</div>
            <LocationTag place={origin.place} timeZone={origin.timeZone} status={{ label: s.status === "separar" || s.status === "separado" ? "Carga no CD" : "Despachado", tone: s.status === "separar" || s.status === "separado" ? "info" : "neutral" }} />
          </div>
          <div>
            <div className="mb-1 text-[11.5px] text-muted">Destino</div>
            <LocationTag place={`${s.dest.city}, ${s.dest.uf}`} timeZone={s.dest.timeZone} status={s.status === "entregue" ? { label: "Entregue", tone: "ok" } : late ? { label: "Atrasado", tone: "bad" } : { label: `Prazo ${br(s.eta).slice(0, 5)}`, tone: "neutral" }} />
          </div>
        </section>
        <PropertyList
          items={[
            { label: "Pedido", value: <a className="font-medium text-blue hover:underline" href={`#/frame/erp-order?id=${o.id}`}>{o.number}</a>, hint: formatCurrency(o.items.reduce((a, it) => a + it.qty * it.price, 0) + o.freight) },
            { label: "NF-e", value: o.invoice ? <a className="font-medium text-blue hover:underline" href={`#/frame/erp-invoice?id=${o.invoice}`}>{o.invoice}</a> : undefined },
            { label: "Volumes", value: `${s.volumes} · ${formatNumber(s.weightKg)} kg` },
            { label: "Frete", value: formatCurrency(s.freight), hint: o.freight ? "cobrado do cliente (FOB)" : "por nossa conta (CIF)" },
            { label: "Contato na entrega", value: c.contact, hint: c.phone },
            ...(s.status !== "separado" ? [{ label: "Transportadora", value: s.carrier, hint: s.tracking ? `rastreio ${s.tracking}` : "definida no despacho" }] : []),
          ]}
        />
        {s.status === "separado" && (
          <section className="grid gap-3 rounded-xl border border-line bg-soft/40 p-4 sm:grid-cols-2">
            <Select label="Transportadora" value={carrier} onValueChange={setCarrier} options={carriers.map((x) => ({ value: x, label: x }))} />
            <TextField label="Código de rastreio" value={tracking} onChange={setTracking} placeholder="RA48210731BR" error={tried && tracking.trim().length < 6 ? "Informe o código que a transportadora deu na coleta." : undefined} />
            <div className="sm:col-span-2">
              <OperationFeedback operation={op} />
            </div>
          </section>
        )}
        <section>
          <h3 className="m-0 mb-3 text-[13px] font-medium">Rastreio</h3>
          <Timeline items={s.events.map((e, i) => ({ id: e.id, title: e.title, meta: `${br(e.date).slice(0, 5)} ${e.time}`, body: e.place, tone: e.tone, current: i === 0 && s.status !== "entregue" }))} />
        </section>
      </div>
    </Drawer>
  );
}
