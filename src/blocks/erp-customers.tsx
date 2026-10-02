import { FileSearch, Lock, Mail, Phone, ShoppingCart, Unlock, UserPlus, Users } from "lucide-react";
import { useState } from "react";
import {
  Badge,
  Button,
  CurrencyField,
  DataTable,
  Drawer,
  Empty,
  EmptyFilterResult,
  EntityMark,
  FilterBar,
  Highlight,
  ListRow,
  MaskedField,
  Meter,
  OperationButton,
  OperationFeedback,
  Page,
  PageHeading,
  PageToolbar,
  PropertyList,
  Select,
  SortHeader,
  TableSearch,
  TextField,
  formatCurrency,
  masks,
  notify,
  useFilters,
  useOperation,
  useSort,
  type Column,
  type FilterField,
} from "@g4ai/ds";
import { addCustomer, br, customers as seed, iso, orderStatus, orderTotal, ordersOf, paymentTerms, segments, sellers, today, ufs, user, type Customer, type Payment } from "./data/erp";
import { lateDays, receivables } from "./data/fin";
import { go, setFrameQuery, useFrameParam } from "./shells/frame-route";
import { NexoShell, demoError, useDemoState } from "./shells/nexo-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Clientes",
  description: "Carteira de clientes B2B: CNPJ, segmento, vendedor, uso do limite de crédito e títulos vencidos. Detalhe em gaveta (?id=) com pedidos e títulos, bloqueio de crédito, e cadastro com consulta de CNPJ, endereço e condições comerciais.",
  category: "ERP",
  order: 4,
  height: 900,
  concept: {
    goal: "Ver a carteira de clientes B2B com risco de crédito e agir sem perder a lista.",
    patterns: [
      "Anatomia A · Lista: cabeçalho fixo + PageToolbar colada",
      "Uso do limite de crédito e títulos vencidos na linha",
      "Detalhe em gaveta pela URL (?id=): trocar de cliente no ⌘K troca a gaveta",
      "Novo cliente em gaveta: CNPJ com máscara e consulta na Receita, endereço e condições",
      "Cinco estados: ?estado=carregando|vazio|erro",
    ],
    adapt: [
      "Contas (CRM), clientes (SaaS)",
    ],
    avoid: [
      "Abrir página nova só para ver o limite de crédito",
      "Guardar o registro aberto num estado que não acompanha a URL",
    ],
  },
} as const;

const openOf = (c: Customer) => receivables.filter((r) => r.customerId === c.id);
const exposure = (c: Customer) => openOf(c).reduce((s, r) => s + r.value, 0) + ordersOf(c.id).filter((o) => o.status === "aprovado" || o.status === "faturado").reduce((s, o) => s + orderTotal(o), 0);
const overdue = (c: Customer) => openOf(c).filter((r) => lateDays(r) > 0).reduce((s, r) => s + r.value, 0);
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

const fields: FilterField<Customer>[] = [
  { key: "segment", label: "Segmento", type: "enum", quick: true, accessor: (c) => c.segment, options: segments.map((s) => ({ value: s, label: s })) },
  { key: "seller", label: "Vendedor", type: "person", quick: true, accessor: (c) => c.seller, options: sellers.map((s) => ({ value: s.id, label: s.name })) },
  { key: "status", label: "Crédito", type: "enum", accessor: (c) => c.status, options: [{ value: "ativo", label: "Liberado" }, { value: "bloqueado", label: "Bloqueado" }] },
  { key: "uf", label: "UF", type: "enum", accessor: (c) => c.uf, options: [...new Set(seed.map((c) => c.uf))].sort().map((u) => ({ value: u, label: u })) },
  { key: "overdue", label: "Vencido", type: "currency", accessor: overdue },
  { key: "since", label: "Cliente desde", type: "date", accessor: (c) => c.since },
];

export default function ErpCustomers() {
  const demo = useDemoState();
  // A gaveta aberta vem da URL: ⌘K, painel e pedido trocam de cliente sem remontar a tela.
  const openId = useFrameParam("id");
  const creating = useFrameParam("novo") === "1";
  const [list, setList] = useState<Customer[]>(() => (demo === "vazio" ? [] : [...seed]));
  const filters = useFilters(list, { fields, search: (c) => [c.name, c.cnpj, c.cnpj.replace(/\D/g, ""), c.city, c.contact], now: today, url: "k_" });
  const sort = useSort(filters.rows, { nome: (c) => c.name, exposicao: exposure, vencido: overdue }, { key: "exposicao", dir: "desc" });
  const q = filters.state.query;
  const c = openId ? list.find((x) => x.id === openId) : undefined;
  const setOpen = (id: string | null) => setFrameQuery({ id: id ?? undefined });
  const toggleCredit = (k: Customer) => {
    const next = k.status === "ativo" ? "bloqueado" : "ativo";
    setList((all) => all.map((x) => (x.id === k.id ? { ...x, status: next } : x)));
    notify(next === "bloqueado" ? `Crédito de ${k.name} bloqueado: novos pedidos ficam como orçamento` : `Crédito de ${k.name} liberado`, () => setList((all) => all.map((x) => (x.id === k.id ? { ...x, status: k.status } : x))));
  };

  const columns: Column<Customer>[] = [
    {
      key: "name",
      header: <SortHeader label="Cliente" {...sort.header("nome")} />,
      primary: true,
      cell: (k) => (
        <span className="flex items-center gap-2.5">
          <EntityMark name={k.name} tint={k.tint} className="h-8 w-8 text-[12px]" />
          <span className="min-w-0">
            <Highlight text={k.name} query={q} className="block truncate" />
            <Highlight text={k.cnpj} query={q} className="block text-[12px] font-normal tabular-nums text-muted" />
          </span>
        </span>
      ),
    },
    { key: "segment", header: "Segmento", mobileHidden: true, cell: (k) => k.segment },
    { key: "city", header: "Cidade", mobileHidden: true, nowrap: true, cell: (k) => <span className="text-ink-soft">{k.city}/{k.uf}</span> },
    { key: "seller", header: "Vendedor", mobileHidden: true, cell: (k) => user(k.seller).name.split(" ")[0] },
    {
      key: "credit",
      header: <SortHeader label="Uso do limite" {...sort.header("exposicao")} />,
      cell: (k) => {
        const pct = k.creditLimit ? (exposure(k) / k.creditLimit) * 100 : 0;
        return (
          <span className="block w-36">
            <span className="flex justify-between text-[12px] tabular-nums">
              <span>{formatCurrency(exposure(k), { compact: true })}</span>
              <span className="text-muted">de {formatCurrency(k.creditLimit, { compact: true })}</span>
            </span>
            <span className="mt-1 block">
              <Meter value={pct} thick tone={pct > 90 ? "bad" : pct > 70 ? "warn" : "ink"} label={`Uso do limite de ${k.name}`} />
            </span>
          </span>
        );
      },
    },
    { key: "overdue", header: <SortHeader label="Vencido" align="right" {...sort.header("vencido")} />, align: "right", nowrap: true, cell: (k) => (overdue(k) ? <span className="font-medium tabular-nums text-rose">{formatCurrency(overdue(k))}</span> : <span className="text-muted">—</span>) },
    { key: "status", header: "Crédito", cell: (k) => <Badge tone={k.status === "ativo" ? "ok" : "bad"}>{k.status === "ativo" ? "Liberado" : "Bloqueado"}</Badge> },
  ];

  return (
    <NexoShell section="clientes">
      <Page>
        <PageHeading
          crumbs={[{ label: "Cadastros" }]}
          title="Clientes"
          description="Carteira B2B. O uso do limite soma títulos em aberto e pedidos aprovados ainda não pagos."
          actions={
            <Button onClick={() => setFrameQuery({ novo: "1" })}>
              <UserPlus /> Novo cliente
            </Button>
          }
        />
        <div className="space-y-4">
          <PageToolbar>
            <FilterBar filters={filters} noun="cliente" search={<TableSearch value={q} onChange={filters.setQuery} total={list.length} noun="cliente" searchIn="nome, CNPJ, cidade e contato" />} />
          </PageToolbar>
          <DataTable
            label="Clientes"
            rows={sort.rows}
            columns={columns}
            rowKey={(k) => k.id}
            onRowClick={(k) => setOpen(k.id)}
            rowLabel={(k) => `Abrir ${k.name}`}
            loading={demo === "carregando"}
            error={demoError(demo, "os clientes")}
            empty={
              list.length === 0 ? (
                <Empty framed={false} icon={<Users />} title="Nenhum cliente cadastrado" hint="Cadastre pelo CNPJ: razão social e endereço vêm da Receita, você só define limite e condições." action={<Button size="sm" variant="ghost" onClick={() => setFrameQuery({ novo: "1" })}><UserPlus /> Cadastrar cliente</Button>} />
              ) : (
                <EmptyFilterResult filters={filters} noun="cliente" />
              )
            }
          />
        </div>
      </Page>
      <Drawer
        open={!!c && !creating}
        onClose={() => setOpen(null)}
        kicker={c ? `${c.segment} · cliente desde ${br(c.since).slice(3)}` : undefined}
        title={c?.name ?? ""}
        width={520}
        footer={
          c && (
            <>
              <Button variant="ghost" onClick={() => toggleCredit(c)}>
                {c.status === "ativo" ? <Lock /> : <Unlock />} {c.status === "ativo" ? "Bloquear crédito" : "Liberar crédito"}
              </Button>
              <Button onClick={() => go("erp-order", "novo")}>
                <ShoppingCart /> Novo pedido
              </Button>
            </>
          )
        }
      >
        {c && (
          <div className="space-y-6">
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" href={`mailto:${c.email}`}>
                <Mail /> E-mail
              </Button>
              <Button size="sm" variant="ghost" href={`tel:${c.phone.replace(/\D/g, "")}`}>
                <Phone /> Ligar
              </Button>
            </div>
            <PropertyList
              items={[
                { label: "CNPJ", value: <span className="tabular-nums">{c.cnpj}</span>, hint: c.ie ? `IE ${c.ie}` : undefined },
                { label: "Cidade", value: `${c.city}/${c.uf}`, hint: c.address },
                { label: "Contato", value: c.contact, hint: c.email },
                { label: "Vendedor", value: user(c.seller).name },
                { label: "Condição padrão", value: c.payment },
                { label: "Limite de crédito", value: formatCurrency(c.creditLimit, { cents: false }), hint: `${formatCurrency(exposure(c), { cents: false })} em uso` },
                { label: "Títulos vencidos", value: overdue(c) ? <span className="font-medium text-rose">{formatCurrency(overdue(c))}</span> : undefined },
              ]}
            />
            <section>
              <h3 className="m-0 mb-2 text-[13px] font-medium">Pedidos recentes</h3>
              {ordersOf(c.id).length ? (
                <ul className="list-none divide-y divide-line overflow-hidden rounded-xl border border-line p-0">
                  {ordersOf(c.id)
                    .slice(0, 5)
                    .map((o) => (
                      <li key={o.id}>
                        <ListRow onClick={() => go("erp-order", o.id)} kicker={br(o.date)} title={<span className="font-mono text-[12.5px]">{o.number}</span>} meta={<span className="inline-flex items-center gap-2"><Badge tone={orderStatus[o.status].tone}>{orderStatus[o.status].label}</Badge>{formatCurrency(orderTotal(o), { compact: true })}</span>} />
                      </li>
                    ))}
                </ul>
              ) : (
                <Empty framed={false} title="Nenhum pedido ainda" hint="O primeiro pedido deste cliente aparece aqui." />
              )}
            </section>
            {openOf(c).length > 0 && (
              <section>
                <h3 className="m-0 mb-2 text-[13px] font-medium">Títulos em aberto</h3>
                <ul className="list-none divide-y divide-line overflow-hidden rounded-xl border border-line p-0">
                  {openOf(c).map((r) => (
                    <li key={r.id}>
                      <ListRow onClick={() => go("fin-receivables", r.id)} kicker={`${r.doc} · parcela ${r.installment}`} title={formatCurrency(r.value)} meta={lateDays(r) ? <span className="text-rose">{lateDays(r)} dias de atraso</span> : `vence ${br(r.due)}`} />
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
      </Drawer>
      {creating && (
        <NewCustomer
          onClose={() => setFrameQuery({ novo: undefined })}
          onCreated={(k) => {
            setList((all) => [k, ...all]);
            setFrameQuery({ novo: undefined, id: k.id });
          }}
        />
      )}
    </NexoShell>
  );
}

/* ------------------------------------------------------------------ */
/* Novo cliente (gaveta)                                               */
/* ------------------------------------------------------------------ */

type Form = { cnpj: string; name: string; ie: string; segment: string; cep: string; street: string; number: string; district: string; city: string; uf: string; contact: string; email: string; phone: string; seller: string; limit: number | null; payment: Payment };
const blank: Form = { cnpj: "", name: "", ie: "", segment: "Construção", cep: "", street: "", number: "", district: "", city: "", uf: "GO", contact: "", email: "", phone: "", seller: sellers[0].id, limit: 30_000, payment: "Boleto 28 dias" };

function NewCustomer({ onClose, onCreated }: { onClose: () => void; onCreated: (c: Customer) => void }) {
  const [f, setF] = useState<Form>(blank);
  const [tried, setTried] = useState(false);
  const lookup = useOperation({ busyLabel: "Consultando…" });
  const op = useOperation({ busyLabel: "Cadastrando…" });
  const set = (p: Partial<Form>) => setF((x) => ({ ...x, ...p }));
  const digits = f.cnpj.replace(/\D/g, "");
  const cnpjOk = masks.cnpj.validate(digits);
  const duplicate = seed.find((c) => c.cnpj.replace(/\D/g, "") === digits);
  const errors = {
    cnpj: !digits ? "Informe o CNPJ." : !cnpjOk ? "CNPJ inválido: confira os dígitos." : duplicate ? `Já cadastrado como ${duplicate.name}.` : undefined,
    name: !f.name.trim() ? "Informe a razão social." : undefined,
    cep: f.cep.replace(/\D/g, "").length !== 8 ? "CEP com 8 dígitos." : undefined,
    street: !f.street.trim() ? "Informe o logradouro." : undefined,
    city: !f.city.trim() ? "Informe a cidade." : undefined,
    email: f.email && !/^\S+@\S+\.\S+$/.test(f.email) ? "E-mail inválido." : undefined,
  };
  const err = (k: keyof typeof errors) => (tried ? errors[k] : undefined);

  // Consulta de exemplo: no SEU app, chame a API da Receita (ou um serviço como BrasilAPI).
  const fetchCnpj = () =>
    lookup.run(async () => {
      await wait(900);
      if (!cnpjOk) throw new Error("CNPJ inválido: confira os dígitos antes de consultar.");
      set({ name: "Caldeiraria Planalto Central Ltda.", ie: "10.778.231-4", cep: "75113-410", street: "Via Primária, Quadra 4", number: "120", district: "DAIA", city: "Anápolis", uf: "GO", segment: "Indústria" });
    }, "Dados da Receita preenchidos · situação cadastral ativa");

  const save = async () => {
    setTried(true);
    if (Object.values(errors).some(Boolean)) return;
    let created: Customer | null = null;
    const failed = await op.run(async () => {
      await wait(800);
      created = addCustomer({
        id: `k${Date.now()}`,
        name: f.name.trim(),
        cnpj: f.cnpj,
        city: f.city.trim(),
        uf: f.uf,
        segment: f.segment,
        since: iso(0),
        creditLimit: f.limit ?? 0,
        seller: f.seller,
        tint: "#5f7f6f",
        contact: f.contact || "—",
        email: f.email,
        phone: f.phone,
        status: "ativo",
        address: `${f.street}, ${f.number || "s/n"} · ${f.district} · CEP ${f.cep}`,
        ie: f.ie || "Isento",
        payment: f.payment,
      });
    });
    if (failed || !created) return;
    const c: Customer = created;
    notify(`Cliente ${c.name} cadastrado com limite de ${formatCurrency(c.creditLimit, { cents: false })}`);
    onCreated(c);
  };

  return (
    <Drawer
      open
      onClose={onClose}
      kicker="Cadastros"
      title="Novo cliente"
      width={600}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <OperationButton operation={op} onClick={save}>
            Cadastrar cliente
          </OperationButton>
        </>
      }
    >
      <div className="space-y-7">
        <section className="space-y-4">
          <h3 className="m-0 text-[13px] font-medium">Empresa</h3>
          <div className="grid items-start gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
            <MaskedField mask={masks.cnpj} label="CNPJ" value={f.cnpj} onChange={(v) => set({ cnpj: v })} error={err("cnpj") ?? (duplicate ? errors.cnpj : undefined)} hint="Ex.: 11.222.333/0001-81" />
            <div className="sm:pt-[26px]">
              <OperationButton operation={lookup} variant="ghost" onClick={fetchCnpj} disabled={digits.length !== 14} disabledReason="Digite os 14 dígitos do CNPJ.">
                <FileSearch /> Consultar na Receita
              </OperationButton>
            </div>
          </div>
          <OperationFeedback operation={lookup} inline />
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField className="sm:col-span-2" label="Razão social" value={f.name} onChange={(v) => set({ name: v })} error={err("name")} />
            <TextField label="Inscrição estadual" value={f.ie} onChange={(v) => set({ ie: v })} placeholder="Isento" optional />
            <Select label="Segmento" value={f.segment} onValueChange={(v) => set({ segment: v })} options={[...segments, "Indústria"].filter((s, i, a) => a.indexOf(s) === i).map((s) => ({ value: s, label: s }))} />
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="m-0 text-[13px] font-medium">Endereço de entrega</h3>
          <div className="grid gap-3 sm:grid-cols-[140px_minmax(0,1fr)_140px]">
            <MaskedField mask={masks.cep} label="CEP" value={f.cep} onChange={(v) => set({ cep: v })} error={err("cep")} />
            <TextField label="Logradouro" value={f.street} onChange={(v) => set({ street: v })} error={err("street")} />
            <TextField label="Número" value={f.number} onChange={(v) => set({ number: v })} placeholder="s/n" optional />
          </div>
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_100px]">
            <TextField label="Bairro" value={f.district} onChange={(v) => set({ district: v })} optional />
            <TextField label="Cidade" value={f.city} onChange={(v) => set({ city: v })} error={err("city")} />
            <Select label="UF" value={f.uf} onValueChange={(v) => set({ uf: v })} options={ufs.map((u) => ({ value: u, label: u }))} />
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="m-0 text-[13px] font-medium">Contato de compras</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField label="Nome" value={f.contact} onChange={(v) => set({ contact: v })} optional />
            <MaskedField mask={masks.phone} label="Telefone" value={f.phone} onChange={(v) => set({ phone: v })} optional />
            <TextField className="sm:col-span-2" label="E-mail para NF-e e boletos" type="email" value={f.email} onChange={(v) => set({ email: v })} placeholder="compras@empresa.com.br" error={err("email")} optional />
          </div>
        </section>

        <section className="space-y-3 rounded-xl border border-line bg-soft/40 p-4">
          <h3 className="m-0 text-[13px] font-medium">Condições comerciais</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <Select label="Vendedor responsável" value={f.seller} onValueChange={(v) => set({ seller: v })} options={sellers.map((s) => ({ value: s.id, label: s.name }))} />
            <Select label="Condição de pagamento" value={f.payment} onValueChange={(v) => set({ payment: v as Payment })} options={paymentTerms.map((p) => ({ value: p, label: p }))} />
            <CurrencyField className="sm:col-span-2" label="Limite de crédito" value={f.limit} onChange={(v) => set({ limit: v })} hint={(f.limit ?? 0) > 100_000 ? "Acima de R$ 100 mil, o limite passa pela aprovação da controladoria." : "Soma de títulos em aberto e pedidos aprovados não pagos."} />
          </div>
        </section>
        <OperationFeedback operation={op} />
      </div>
    </Drawer>
  );
}
