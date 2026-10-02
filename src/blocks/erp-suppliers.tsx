import { ArrowLeft, Building2, FileQuestion, FileSearch, Mail, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import {
  Badge,
  BarList,
  BulletChart,
  Button,
  ChartCard,
  Combobox,
  DataTable,
  DatePicker,
  Drawer,
  Empty,
  EmptyFilterResult,
  EntityMark,
  FilterBar,
  Highlight,
  IconButton,
  ListRow,
  MaskedField,
  NumberField,
  OperationButton,
  OperationFeedback,
  Page,
  PageHeading,
  PageToolbar,
  PropertyList,
  ScatterChart,
  Select,
  SortHeader,
  TableSearch,
  TextField,
  TextareaField,
  formatCurrency,
  formatPercent,
  masks,
  useFilters,
  useOperation,
  useSort,
  type Column,
  type FilterField,
} from "@g4ai/ds";
import { addSupplier, br, iso, productBySku, products, suppliers as seed, today, ufs, warehouses, type Supplier, type WarehouseId } from "./data/erp";
import { payableStatus, payables } from "./data/fin";
import { go, setFrameQuery, useFrameParam } from "./shells/frame-route";
import { NexoShell, demoError, useDemoState } from "./shells/nexo-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Fornecedores",
  description: "Fornecedores com classificação A/B/C, OTIF contra a meta, prazo de entrega, gasto no ano e compras em aberto. Dispersão prazo × pontualidade, detalhe em gaveta (?id=), pedido de cotação com itens e prazo e cadastro com consulta de CNPJ.",
  category: "ERP",
  order: 8,
  height: 1100,
  concept: {
    goal: "Escolher e acompanhar fornecedores por pontualidade, prazo e gasto.",
    patterns: [
      "Anatomia A · Lista: cabeçalho fixo + PageToolbar colada",
      "Classificação A/B/C e OTIF contra a meta",
      "Dispersão prazo × pontualidade para achar os problemáticos",
      "Detalhe em gaveta pela URL; pedir cotação troca o conteúdo da mesma gaveta (gaveta nunca abre gaveta)",
      "Cinco estados: ?estado=carregando|vazio|erro",
    ],
    adapt: [
      "Parceiros, agências, transportadoras",
    ],
    avoid: [
      "Nota do fornecedor sem os critérios",
      "Pedido de cotação sem itens nem prazo de resposta",
    ],
  },
} as const;

const ratingTone = { A: "ok", B: "info", C: "warn" } as const;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const hasHistory = (s: Supplier) => s.spendYtd > 0;
const categoriesOf = (list: Supplier[]) => [...new Set(list.map((s) => s.category))];
const fields: FilterField<Supplier>[] = [
  { key: "rating", label: "Classificação", type: "enum", quick: true, accessor: (s) => s.rating, options: ["A", "B", "C"].map((r) => ({ value: r, label: `Classe ${r}` })) },
  { key: "category", label: "Categoria", type: "enum", quick: true, accessor: (s) => s.category, options: categoriesOf(seed).map((c) => ({ value: c, label: c })) },
  { key: "otif", label: "OTIF (%)", type: "number", accessor: (s) => Math.round(s.otif * 100) },
  { key: "lead", label: "Prazo de entrega", type: "number", unit: "dias", accessor: (s) => s.leadTime },
  { key: "spend", label: "Gasto no ano", type: "currency", accessor: (s) => s.spendYtd },
];

export default function ErpSuppliers() {
  const demo = useDemoState();
  const openId = useFrameParam("id");
  const creating = useFrameParam("novo") === "1";
  const [list, setList] = useState<Supplier[]>(() => (demo === "vazio" ? [] : [...seed]));
  const filters = useFilters(list, { fields, search: (s) => [s.name, s.cnpj, s.cnpj.replace(/\D/g, ""), s.category, s.contact], now: today, url: "f_" });
  const sort = useSort(filters.rows, { nome: (s) => s.name, otif: (s) => s.otif, gasto: (s) => s.spendYtd }, { key: "gasto", dir: "desc" });
  const q = filters.state.query;
  const s = openId ? list.find((x) => x.id === openId) : undefined;
  const rated = list.filter(hasHistory);

  const columns: Column<Supplier>[] = [
    {
      key: "name",
      header: <SortHeader label="Fornecedor" {...sort.header("nome")} />,
      primary: true,
      cell: (x) => (
        <span className="flex items-center gap-2.5">
          <EntityMark name={x.name} tint={x.tint} className="h-8 w-8 text-[12px]" />
          <span className="min-w-0">
            <Highlight text={x.name} query={q} className="block truncate" />
            <span className="block truncate text-[12px] font-normal text-muted">{x.category} · {x.city}</span>
          </span>
        </span>
      ),
    },
    { key: "rating", header: "Classe", cell: (x) => (hasHistory(x) ? <Badge tone={ratingTone[x.rating]}>{x.rating}</Badge> : <Badge>Novo</Badge>) },
    { key: "otif", header: <SortHeader label="OTIF" align="right" {...sort.header("otif")} />, align: "right", nowrap: true, cell: (x) => (hasHistory(x) ? <span className={x.otif < 0.85 ? "font-medium text-rose" : x.otif < 0.92 ? "text-amber" : "font-medium"}>{formatPercent(x.otif, 0)}</span> : <span className="text-muted">sem histórico</span>) },
    { key: "lead", header: "Prazo", align: "right", nowrap: true, cell: (x) => `${x.leadTime} dias` },
    { key: "open", header: "Em aberto", align: "right", nowrap: true, mobileHidden: true, cell: (x) => (x.openPOs ? formatCurrency(x.openPOs, { cents: false }) : <span className="text-muted">—</span>) },
    { key: "spend", header: <SortHeader label="Gasto no ano" align="right" {...sort.header("gasto")} />, align: "right", nowrap: true, cell: (x) => <span className="tabular-nums">{formatCurrency(x.spendYtd, { compact: true })}</span> },
  ];

  return (
    <NexoShell section="fornecedores">
      <Page>
        <PageHeading
          crumbs={[{ label: "Cadastros" }]}
          title="Fornecedores"
          description="OTIF: pedidos entregues no prazo e completos nos últimos 90 dias. Meta: 95 %."
          actions={
            <Button onClick={() => setFrameQuery({ novo: "1" })}>
              <Plus /> Novo fornecedor
            </Button>
          }
        />
        {rated.length > 0 && demo !== "carregando" && demo !== "erro" && (
          <div className="grid gap-6 lg:grid-cols-2">
            <ChartCard title="Quem entrega rápido e no prazo?" description="Prazo médio × OTIF · bolha = gasto no ano">
              <ScatterChart
                points={rated.map((x) => ({ id: x.id, label: x.name, x: x.leadTime, y: Math.round(x.otif * 100), size: x.spendYtd, group: `Classe ${x.rating}` }))}
                xLabel="Prazo de entrega (dias)"
                yLabel="OTIF (%)"
                groups={["Classe A", "Classe B", "Classe C"]}
                height={240}
              />
            </ChartCard>
            <ChartCard title="Com quem mais gastamos?" description="Compras em 2026">
              <BarList items={rated.map((x) => ({ label: x.name, value: x.spendYtd, href: `#/frame/erp-suppliers?id=${x.id}` }))} format={(n) => formatCurrency(n, { compact: true })} showShare limit={6} />
            </ChartCard>
          </div>
        )}
        <div className="mt-6 space-y-4">
          <PageToolbar>
            <FilterBar filters={filters} noun="fornecedor" nounPlural="fornecedores" search={<TableSearch value={q} onChange={filters.setQuery} total={list.length} noun="fornecedor" nounPlural="fornecedores" searchIn="nome, CNPJ, categoria e contato" />} />
          </PageToolbar>
          <DataTable
            label="Fornecedores"
            rows={sort.rows}
            columns={columns}
            rowKey={(x) => x.id}
            onRowClick={(x) => setFrameQuery({ id: x.id })}
            rowLabel={(x) => `Abrir ${x.name}`}
            loading={demo === "carregando"}
            error={demoError(demo, "os fornecedores")}
            empty={
              list.length === 0 ? (
                <Empty framed={false} icon={<Building2 />} title="Nenhum fornecedor cadastrado" hint="Cadastre pelo CNPJ para pedir cotações e emitir pedidos de compra." action={<Button size="sm" variant="ghost" onClick={() => setFrameQuery({ novo: "1" })}><Plus /> Cadastrar fornecedor</Button>} />
              ) : (
                <EmptyFilterResult filters={filters} noun="fornecedor" nounPlural="fornecedores" />
              )
            }
          />
        </div>
      </Page>
      {s && !creating && <SupplierDrawer key={s.id} s={s} onClose={() => setFrameQuery({ id: undefined })} />}
      {creating && (
        <NewSupplier
          existing={list}
          onClose={() => setFrameQuery({ novo: undefined })}
          onCreated={(x) => {
            setList((all) => [x, ...all]);
            setFrameQuery({ novo: undefined, id: x.id });
          }}
        />
      )}
    </NexoShell>
  );
}

/* ------------------------------------------------------------------ */
/* Detalhe + pedido de cotação (mesma gaveta, dois modos)              */
/* ------------------------------------------------------------------ */

type QuoteItem = { sku: string; qty: number | null };

function SupplierDrawer({ s, onClose }: { s: Supplier; onClose: () => void }) {
  const [mode, setMode] = useState<"detalhe" | "cotacao">("detalhe");
  const own = products.filter((p) => p.supplierId === s.id);
  const [items, setItems] = useState<QuoteItem[]>(() => own.slice(0, 2).map((p) => ({ sku: p.sku, qty: Math.max(p.min, 10) })));
  const [answerBy, setAnswerBy] = useState(iso(3));
  const [deliverBy, setDeliverBy] = useState(iso(s.leadTime + 5));
  const [warehouse, setWarehouse] = useState<WarehouseId>("gyn");
  const [notes, setNotes] = useState("");
  const [tried, setTried] = useState(false);
  const op = useOperation({ busyLabel: "Enviando…" });
  const valid = items.length > 0 && items.every((it) => it.qty && it.qty > 0) && answerBy < deliverBy;

  const send = async () => {
    setTried(true);
    if (!valid) return;
    const failed = await op.run(() => wait(900), `Pedido de cotação enviado para ${s.email} · resposta até ${br(answerBy)}`);
    if (failed) return;
    setMode("detalhe");
    setTried(false);
  };

  const myPayables = payables.filter((p) => p.supplierId === s.id);
  return (
    <Drawer
      open
      onClose={onClose}
      kicker={mode === "cotacao" ? s.name : `${s.category} · ${hasHistory(s) ? `Classe ${s.rating}` : "novo fornecedor"}`}
      title={mode === "cotacao" ? "Pedir cotação" : s.name}
      width={560}
      footer={
        mode === "detalhe" ? (
          <>
            <Button variant="ghost" href={`mailto:${s.email}`}>
              <Mail /> E-mail
            </Button>
            <Button onClick={() => setMode("cotacao")}>
              <FileQuestion /> Pedir cotação
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" onClick={() => setMode("detalhe")}>
              <ArrowLeft /> Voltar
            </Button>
            <OperationButton operation={op} onClick={send}>
              Enviar pedido de cotação
            </OperationButton>
          </>
        )
      }
    >
      {mode === "detalhe" ? (
        <div className="space-y-6">
          {hasHistory(s) ? (
            <div className="space-y-3">
              <BulletChart label="OTIF" hint="últimos 90 dias" value={Math.round(s.otif * 100)} target={95} max={100} format={(n) => formatPercent(n / 100, 0)} />
              <BulletChart label="Prazo" hint="dias úteis · meta 5" value={s.leadTime} target={5} max={15} format={(n) => `${n} d`} />
            </div>
          ) : (
            <p className="m-0 rounded-lg border border-dashed border-line px-4 py-3 text-[12.5px] text-muted">Sem histórico de entregas ainda: OTIF e classe aparecem depois do primeiro recebimento.</p>
          )}
          <PropertyList
            items={[
              { label: "CNPJ", value: <span className="tabular-nums">{s.cnpj}</span> },
              { label: "Cidade", value: s.city },
              { label: "Contato", value: s.contact, hint: s.email },
              { label: "Última compra", value: s.lastPurchase ? br(s.lastPurchase) : undefined },
              { label: "Produtos que fornece", value: own.map((p) => p.sku).join(", ") || undefined },
            ]}
          />
          <section>
            <div className="mb-2 flex items-baseline justify-between gap-2">
              <h3 className="m-0 text-[13px] font-medium">Títulos a pagar</h3>
              <a className="text-[12.5px] font-medium text-blue hover:underline" href="#/frame/erp-purchase-orders">
                Pedidos de compra
              </a>
            </div>
            {myPayables.length ? (
              <ul className="list-none divide-y divide-line overflow-hidden rounded-xl border border-line p-0">
                {myPayables.map((p) => (
                  <li key={p.id}>
                    <ListRow onClick={() => go("fin-payables", p.id)} kicker={`${p.doc} · vence ${br(p.due)}`} title={formatCurrency(p.value)} meta={<Badge tone={payableStatus[p.status].tone}>{payableStatus[p.status].label}</Badge>} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="m-0 text-[12.5px] text-muted">Nenhum título em aberto.</p>
            )}
          </section>
        </div>
      ) : (
        <div className="space-y-6">
          <p className="m-0 text-[13px] text-ink-soft">
            Vai por e-mail para {s.contact} ({s.email}) com o link para responder preço, prazo e condição. As respostas entram na requisição.
          </p>
          <section>
            <h3 className="m-0 mb-2 text-[13px] font-medium">Itens</h3>
            <ul className="m-0 list-none space-y-2 p-0">
              {items.map((it, i) => (
                <li key={i} className="grid grid-cols-[minmax(0,1fr)_160px_auto] items-end gap-2">
                  <Combobox label={`Produto ${i + 1}`} hideLabel={i > 0} value={it.sku} onValueChange={(v) => setItems((all) => all.map((x, k) => (k === i ? { ...x, sku: v } : x)))} options={products.map((p) => ({ value: p.sku, label: p.name, description: p.sku }))} />
                  <NumberField label="Quantidade" hideLabel={i > 0} value={it.qty} onChange={(v) => setItems((all) => all.map((x, k) => (k === i ? { ...x, qty: v } : x)))} min={1} suffix={it.sku ? productBySku(it.sku).unit : undefined} />
                  <IconButton label={`Remover item ${i + 1}`} onClick={() => setItems((all) => all.filter((_, k) => k !== i))}>
                    <Trash2 />
                  </IconButton>
                </li>
              ))}
            </ul>
            <Button size="sm" variant="ghost" className="mt-2" onClick={() => setItems((all) => [...all, { sku: own[0]?.sku ?? products[0].sku, qty: 10 }])}>
              <Plus /> Adicionar item
            </Button>
            {tried && !items.length && <p className="m-0 mt-2 text-[12.5px] text-rose">Adicione pelo menos um item.</p>}
          </section>
          <section className="grid gap-4 sm:grid-cols-2">
            <DatePicker label="Responder até" value={answerBy} onValueChange={setAnswerBy} min={iso(1)} businessDaysOnly />
            <DatePicker label="Entrega desejada" value={deliverBy} onValueChange={setDeliverBy} min={iso(1)} businessDaysOnly error={tried && answerBy >= deliverBy ? "A entrega precisa ser depois da resposta." : undefined} hint={`Prazo médio do fornecedor: ${s.leadTime} dias`} />
            <Select label="Entregar em" value={warehouse} onValueChange={(v) => setWarehouse(v as WarehouseId)} options={warehouses.map((w) => ({ value: w.id, label: w.name, description: w.city }))} />
            <TextareaField className="sm:col-span-2" label="Observações" value={notes} onChange={setNotes} minRows={2} optional placeholder="Ex.: preço com frete CIF até Goiânia; enviar certificado de qualidade da usina." />
          </section>
          <OperationFeedback operation={op} />
        </div>
      )}
    </Drawer>
  );
}

/* ------------------------------------------------------------------ */
/* Novo fornecedor (gaveta)                                            */
/* ------------------------------------------------------------------ */

function NewSupplier({ existing, onClose, onCreated }: { existing: Supplier[]; onClose: () => void; onCreated: (s: Supplier) => void }) {
  const [cnpj, setCnpj] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState(categoriesOf(existing)[0] ?? "Aço plano");
  const [city, setCity] = useState("");
  const [uf, setUf] = useState("GO");
  const [contact, setContact] = useState("");
  const [email, setEmail] = useState("");
  const [lead, setLead] = useState<number | null>(7);
  const [tried, setTried] = useState(false);
  const lookup = useOperation({ busyLabel: "Consultando…" });
  const op = useOperation({ busyLabel: "Cadastrando…" });
  const digits = cnpj.replace(/\D/g, "");
  const dup = existing.find((s) => s.cnpj.replace(/\D/g, "") === digits);
  const errors = {
    cnpj: !masks.cnpj.validate(digits) ? "CNPJ inválido: confira os dígitos." : dup ? `Já cadastrado como ${dup.name}.` : undefined,
    name: !name.trim() ? "Informe a razão social." : undefined,
    city: !city.trim() ? "Informe a cidade." : undefined,
    email: !/^\S+@\S+\.\S+$/.test(email) ? "E-mail para receber pedidos e cotações." : undefined,
  };
  const fetchCnpj = () =>
    lookup.run(async () => {
      await wait(800);
      if (!masks.cnpj.validate(digits)) throw new Error("CNPJ inválido: confira os dígitos antes de consultar.");
      setName("Votorantim Aços Distribuição Ltda.");
      setCity("Goiânia");
      setUf("GO");
      setCategory("Aço plano e perfis");
    }, "Dados da Receita preenchidos · situação cadastral ativa");
  const save = async () => {
    setTried(true);
    if (Object.values(errors).some(Boolean)) return;
    let created: Supplier | null = null;
    const failed = await op.run(async () => {
      await wait(800);
      created = addSupplier({ id: `s${Date.now()}`, name: name.trim(), cnpj, category, city: `${city.trim()}/${uf}`, otif: 0, leadTime: lead ?? 7, openPOs: 0, spendYtd: 0, lastPurchase: "", contact: contact || "Comercial", email, rating: "B", tint: "#184560" });
    }, `Fornecedor ${name.trim()} cadastrado`);
    if (failed || !created) return;
    onCreated(created);
  };
  return (
    <Drawer
      open
      onClose={onClose}
      kicker="Cadastros"
      title="Novo fornecedor"
      width={560}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <OperationButton operation={op} onClick={save}>
            Cadastrar fornecedor
          </OperationButton>
        </>
      }
    >
      <div className="space-y-5">
        <div className="grid items-start gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
          <MaskedField mask={masks.cnpj} label="CNPJ" value={cnpj} onChange={setCnpj} error={tried || dup ? errors.cnpj : undefined} hint="Ex.: 11.222.333/0001-81" />
          <div className="sm:pt-[26px]">
            <OperationButton operation={lookup} variant="ghost" onClick={fetchCnpj} disabled={digits.length !== 14} disabledReason="Digite os 14 dígitos do CNPJ.">
              <FileSearch /> Consultar na Receita
            </OperationButton>
          </div>
        </div>
        <OperationFeedback operation={lookup} inline />
        <TextField label="Razão social" value={name} onChange={setName} error={tried ? errors.name : undefined} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Select label="Categoria" value={category} onValueChange={setCategory} options={[...categoriesOf(existing), "Aço plano e perfis", "Serviços"].filter((c, i, a) => a.indexOf(c) === i).map((c) => ({ value: c, label: c }))} />
          <NumberField label="Prazo médio de entrega" value={lead} onChange={setLead} min={1} suffix="dias" />
          <TextField label="Cidade" value={city} onChange={setCity} error={tried ? errors.city : undefined} />
          <Select label="UF" value={uf} onValueChange={setUf} options={ufs.map((u) => ({ value: u, label: u }))} />
          <TextField label="Contato comercial" value={contact} onChange={setContact} optional />
          <TextField label="E-mail de pedidos" type="email" value={email} onChange={setEmail} placeholder="vendas@fornecedor.com.br" error={tried ? errors.email : undefined} />
        </div>
        <OperationFeedback operation={op} />
      </div>
    </Drawer>
  );
}
