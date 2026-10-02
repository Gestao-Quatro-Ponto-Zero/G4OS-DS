import { Search, UserPlus } from "lucide-react";
import { useState } from "react";
import {
  Badge,
  Button,
  DataTable,
  Drawer,
  Empty,
  EmptyFilterResult,
  EntityMark,
  FilterBar,
  Highlight,
  OperationButton,
  OperationFeedback,
  Page,
  PageHeading,
  PageToolbar,
  Select,
  StatCell,
  StatGrid,
  Switch,
  TableSearch,
  TextField,
  formatCurrency,
  useFilters,
  useOperation,
  useSort,
  type Column,
  type FilterField,
} from "@g4ai/ds";
import { clientMrr, clientOpenWos, clientStatus, clients as seed, iso, openBalance, overdueBalance, type Client, type ClientStatus, type Segment } from "./data/servicos";
import { go, setFrameQuery, useFrameParam } from "./shells/frame-route";
import { LoadError, LoadingTable, ServicosShell, useListState } from "./shells/servicos-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Clientes do ERP de serviços",
  description: "Carteira de clientes (condomínios, clínicas, escritórios, escolas) com CNPJ, segmento, receita recorrente, OS abertas e saldo em aberto/vencido. Cadastro em gaveta com busca do CNPJ na Receita (?novo=1). Linha abre o cliente.",
  category: "Serviços",
  order: 9,
  height: 900,
  concept: {
    goal: "Achar o cliente em segundos e ver, na mesma linha, quanto ele vale por mês, o que está aberto e se está devendo.",
    patterns: [
      "Anatomia A · Lista: cabeçalho fixo + PageToolbar colada (filtros rápidos por segmento e situação, busca por CNPJ sem pontuação)",
      "Colunas numéricas à direita com tabular-nums; vencido pinta só o valor",
      "Ordenação por receita recorrente e saldo (useSort)",
      "Cadastrar em Drawer; “Buscar na Receita” preenche razão social e endereço pelo CNPJ",
      "Cinco estados: ?estado=carregando|vazio|erro simula; vazio por filtro com Limpar",
    ],
    adapt: [
      "Carteira de condomínios de uma administradora, pacientes de clínica, alunos de escola",
    ],
    avoid: [
      "Saldo devedor só em cor, sem o valor",
      "Cadastro em página separada que perde a lista",
    ],
  },
} as const;

const segments: Segment[] = ["Condomínio", "Clínica", "Escritório", "Escola", "Varejo", "Indústria"];
const fields: FilterField<Client>[] = [
  { key: "segment", label: "Segmento", type: "enum", quick: true, accessor: (k) => k.segment, options: segments.map((s) => ({ value: s, label: s })) },
  { key: "status", label: "Situação", type: "enum", quick: true, accessor: (k) => k.status, options: (Object.keys(clientStatus) as ClientStatus[]).map((s) => ({ value: s, label: clientStatus[s].label })) },
  { key: "iss", label: "ISS", type: "enum", accessor: (k) => (k.issWithheld ? "retido" : "proprio"), options: [{ value: "retido", label: "Retém ISS" }, { value: "proprio", label: "Não retém" }] },
  { key: "mrr", label: "Receita recorrente", type: "currency", accessor: (k) => clientMrr(k.id) },
  { key: "district", label: "Bairro", type: "text", accessor: (k) => k.district },
];
const searchText = (k: Client) => [k.name, k.cnpj, k.cnpj.replace(/\D/g, ""), k.contact, k.district];

export default function SrvClients() {
  const estado = useListState();
  const novo = useFrameParam("novo");
  const [list, setList] = useState<Client[]>(() => (estado === "vazio" ? [] : seed));
  const filters = useFilters(list, { fields, search: searchText });
  const q = filters.state.query;
  const sort = useSort<Client>(filters.rows, { mrr: (k) => clientMrr(k.id), balance: (k) => openBalance(k.id), name: (k) => k.name, wos: (k) => clientOpenWos(k.id) }, { key: "mrr", dir: "desc" });
  const rows = sort.rows;
  const debtors = list.filter((k) => overdueBalance(k.id) > 0);

  const columns: Column<Client>[] = [
    {
      key: "name",
      header: "Cliente",
      primary: true,
      sortKey: "name",
      cell: (k) => (
        <span className="flex min-w-0 items-center gap-2.5">
          <EntityMark name={k.name} tint={k.tint} className="h-8 w-8 text-[11px]" />
          <span className="min-w-0">
            <span className="block truncate font-medium">
              <Highlight text={k.name} query={q} />
            </span>
            <span className="block text-[11.5px] tabular-nums text-muted">
              <Highlight text={k.cnpj} query={q} />
            </span>
          </span>
        </span>
      ),
    },
    { key: "segment", header: "Segmento", nowrap: true, mobileHidden: true, cell: (k) => <span className="text-muted">{k.segment}</span> },
    { key: "district", header: "Bairro", nowrap: true, mobileHidden: true, cell: (k) => <Highlight text={k.district} query={q} /> },
    { key: "mrr", header: "Recorrente", align: "right", nowrap: true, sortKey: "mrr", cell: (k) => (clientMrr(k.id) ? <span className="tabular-nums">{formatCurrency(clientMrr(k.id), { cents: false })}/mês</span> : <span className="text-muted">Avulso</span>) },
    { key: "wos", header: "OS abertas", align: "right", nowrap: true, sortKey: "wos", cell: (k) => <span className="tabular-nums">{clientOpenWos(k.id) || "—"}</span> },
    {
      key: "balance",
      header: "Em aberto",
      align: "right",
      nowrap: true,
      sortKey: "balance",
      cell: (k) => (
        <span className="block leading-tight">
          <span className="block tabular-nums">{openBalance(k.id) ? formatCurrency(openBalance(k.id), { cents: false }) : "—"}</span>
          {overdueBalance(k.id) > 0 && <span className="block text-[11.5px] font-medium tabular-nums text-rose">{formatCurrency(overdueBalance(k.id), { cents: false })} vencido</span>}
        </span>
      ),
    },
    { key: "status", header: "Situação", nowrap: true, cell: (k) => <Badge tone={clientStatus[k.status].tone}>{clientStatus[k.status].label}</Badge> },
  ];

  return (
    <ServicosShell section="clientes">
      <Page>
        <PageHeading
          title="Clientes"
          description="Empresas e condomínios atendidos pela Vértice. Busque por nome, CNPJ (com ou sem pontuação), contato ou bairro."
          actions={
            <Button onClick={() => setFrameQuery({ novo: "1" })}>
              <UserPlus /> Cadastrar cliente
            </Button>
          }
        />
        {estado !== "carregando" && estado !== "erro" && list.length > 0 && (
          <StatGrid cols={4}>
            <StatCell label="Clientes ativos" value={list.filter((k) => k.status !== "inativo").length} hint={`${list.filter((k) => clientMrr(k.id) > 0).length} com contrato`} />
            <StatCell label="Receita recorrente média" value={formatCurrency(list.reduce((s, k) => s + clientMrr(k.id), 0) / Math.max(1, list.filter((k) => clientMrr(k.id) > 0).length), { cents: false })} hint="por cliente com contrato" />
            <StatCell label="Com saldo vencido" value={debtors.length} hint={formatCurrency(debtors.reduce((s, k) => s + overdueBalance(k.id), 0), { cents: false })} tone={debtors.length ? "bad" : undefined} />
            <StatCell label="Em implantação" value={list.filter((k) => k.status === "implantacao").length} hint="primeiro mês de contrato" />
          </StatGrid>
        )}
        {estado !== "carregando" && estado !== "erro" && list.length > 0 && (
          <PageToolbar className="mt-6">
            <FilterBar filters={filters} noun="cliente" search={<TableSearch value={q} onChange={filters.setQuery} total={list.length} noun="cliente" searchIn="nome, CNPJ, contato e bairro" />} />
          </PageToolbar>
        )}
        <div className="mt-4">
          {estado === "carregando" ? (
            <LoadingTable label="Carregando clientes" rows={8} />
          ) : estado === "erro" ? (
            <LoadError what="os clientes" />
          ) : !list.length ? (
            <Empty
              title="Nenhum cliente cadastrado"
              hint="Cadastre pelo CNPJ: razão social e endereço vêm da Receita. Depois, crie o primeiro orçamento ou contrato."
              action={
                <Button onClick={() => setFrameQuery({ novo: "1" })}>
                  <UserPlus /> Cadastrar cliente
                </Button>
              }
            />
          ) : (
            <DataTable
              label="Clientes"
              rows={rows}
              columns={columns}
              sort={sort}
              rowKey={(k) => k.id}
              rowLabel={(k) => `Abrir ${k.name}`}
              onRowClick={(k) => go("srv-client", k.id)}
              rowTone={(k) => (k.status === "inadimplente" ? "bad" : undefined)}
              empty={<EmptyFilterResult filters={filters} noun="cliente" />}
            />
          )}
        </div>
      </Page>
      <NewClient
        open={novo === "1"}
        onClose={() => setFrameQuery({ novo: undefined })}
        onCreate={(k) => {
          setList((all) => [k, ...all]);
          setFrameQuery({ novo: undefined });
        }}
      />
    </ServicosShell>
  );
}

function NewClient({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (k: Client) => void }) {
  const [cnpj, setCnpj] = useState("");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [district, setDistrict] = useState("");
  const [segment, setSegment] = useState<Segment>("Condomínio");
  const [contact, setContact] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [iss, setIss] = useState(false);
  const [tried, setTried] = useState(false);
  const lookup = useOperation({ busyLabel: "Buscando…", fallback: "A Receita não respondeu. Preencha à mão ou tente de novo." });
  const save = useOperation({ busyLabel: "Cadastrando…" });
  const cnpjOk = cnpj.replace(/\D/g, "").length === 14;

  const submit = () => {
    setTried(true);
    if (!cnpjOk || !name.trim() || !contact.trim()) return;
    const k: Client = { id: `k${Date.now()}`, name: name.trim(), cnpj, segment, district: district.trim() || "—", address: address.trim(), contact: contact.trim(), email: email.trim(), phone: phone.trim(), since: iso(0), status: "ativo", issWithheld: iss };
    void save.run(() => new Promise((r) => setTimeout(r, 600)), `${k.name} cadastrado`).then((err) => {
      if (err) return;
      onCreate(k);
      setCnpj("");
      setName("");
      setAddress("");
      setDistrict("");
      setContact("");
      setEmail("");
      setPhone("");
      setTried(false);
    });
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Cadastrar cliente"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={save.busy}>
            Cancelar
          </Button>
          <OperationButton operation={save} onClick={submit}>
            <UserPlus /> Cadastrar cliente
          </OperationButton>
        </>
      }
    >
      <div className="space-y-4">
        <OperationFeedback operation={save} />
        <div className="grid items-end gap-3 sm:grid-cols-[1fr_auto]">
          <TextField label="CNPJ" value={cnpj} onChange={setCnpj} placeholder="00.000.000/0000-00" inputMode="numeric" error={tried && !cnpjOk ? "CNPJ precisa de 14 dígitos." : undefined} />
          <OperationButton
            operation={lookup}
            variant="ghost"
            disabled={!cnpjOk}
            disabledReason="Digite os 14 dígitos do CNPJ."
            onClick={() =>
              void lookup.run(() => new Promise((r) => setTimeout(r, 700)), undefined, {
                apply: () => {
                  setName("Clínica Dermatológica Pele Viva Ltda.");
                  setAddress("Rua Haddock Lobo, 1.307");
                  setDistrict("Cerqueira César");
                  setSegment("Clínica");
                },
                revert: () => {},
              })
            }
          >
            <Search /> Buscar na Receita
          </OperationButton>
        </div>
        <OperationFeedback operation={lookup} />
        <TextField label="Razão social" value={name} onChange={setName} error={tried && !name.trim() ? "Informe a razão social." : undefined} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Segmento" value={segment} onValueChange={(v) => setSegment(v as Segment)} options={segments.map((s) => ({ value: s, label: s }))} />
          <TextField label="Bairro" value={district} onChange={setDistrict} />
        </div>
        <TextField label="Endereço" value={address} onChange={setAddress} placeholder="Rua, número e complemento" />
        <TextField label="Contato principal" value={contact} onChange={setContact} placeholder="Ex.: síndico, gerente administrativo" error={tried && !contact.trim() ? "Quem aprova orçamentos e recebe as notas." : undefined} />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="E-mail" type="email" optional value={email} onChange={setEmail} placeholder="financeiro@cliente.com.br" />
          <TextField label="Telefone" optional value={phone} onChange={setPhone} placeholder="(11) 3000-0000" />
        </div>
        <Switch label="Cliente retém ISS na fonte" checked={iss} onCheckedChange={setIss} />
      </div>
    </Drawer>
  );
}
