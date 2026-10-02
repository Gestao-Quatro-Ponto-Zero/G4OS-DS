import { Ban, Download, FileText, Mail, Printer, RotateCw, Send } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Badge,
  Button,
  Callout,
  ConfirmDialog,
  DataGrid,
  Drawer,
  Empty,
  EmptyFilterResult,
  FilterBar,
  Highlight,
  Modal,
  OperationButton,
  OperationFeedback,
  Page,
  PageHeading,
  PropertyList,
  StatCell,
  StatGrid,
  TableSearch,
  Tabs,
  TextField,
  formatCurrency,
  formatDate,
  formatPercent,
  notify,
  useFilters,
  useOperation,
  type FilterField,
  type GridColumn,
} from "@g4ai/ds";
import { clientById, clients, company, invoiceStatus, invoices as seed, issOf, services, type Invoice, type InvoiceStatus } from "./data/servicos";
import { machineDecimal, saveText, xmlEscape } from "./shells/download";
import { frameHref, setFrameQuery, useFrameParam } from "./shells/frame-route";
import { LoadError, LoadingTable, ServicosShell, useListState } from "./shells/servicos-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Notas fiscais de serviço (NFS-e)",
  description: "NFS-e da Prefeitura de São Paulo em DataGrid: a emitir, na prefeitura, emitidas, rejeitadas e canceladas; ISS (alíquota, valor e retenção pelo tomador), município, origem (OS ou contrato), emissão em lote e correção de rejeitada em gaveta (?id=).",
  category: "Serviços",
  order: 6,
  height: 940,
  concept: {
    goal: "Emitir todas as notas do mês sem deixar nenhuma para trás e resolver as rejeitadas antes do vencimento da cobrança.",
    patterns: [
      "Anatomia A · Lista com DataGrid: abas por situação, total e ISS no rodapé",
      "Emitir em lote pela seleção (só “A emitir” entram); ação primária do cabeçalho emite todas as pendentes",
      "Rejeitada abre em Drawer com o código da prefeitura, o campo exato a corrigir e a dica de onde achar o dado",
      "ISS retido pelo tomador em palavra, nunca só em cor",
      "Cancelar nota emitida pede confirmação (irreversível na prefeitura)",
      "Cinco estados: ?estado=carregando|vazio|erro simula; vazio por filtro com Limpar",
    ],
    adapt: [
      "NF-e de produto (ERP), recibos de autônomo, faturas de locação",
    ],
    avoid: [
      "Mostrar “Erro E160” sem dizer qual campo corrigir",
      "Reenviar rejeitada sem editar (volta a rejeitar)",
    ],
  },
} as const;

type Tab = "todas" | InvoiceStatus;

const fields: FilterField<Invoice>[] = [
  { key: "client", label: "Cliente", type: "enum", quick: true, accessor: (n) => n.clientId, options: clients.map((k) => ({ value: k.id, label: k.name })) },
  { key: "withheld", label: "ISS", type: "enum", quick: true, accessor: (n) => (n.issWithheld ? "retido" : "proprio"), options: [{ value: "retido", label: "Retido pelo tomador" }, { value: "proprio", label: "Recolhido pela Vértice" }] },
  { key: "origin", label: "Origem", type: "enum", accessor: (n) => n.origin.kind, options: [{ value: "os", label: "Ordem de serviço" }, { value: "contrato", label: "Mensalidade de contrato" }] },
  { key: "code", label: "Código do serviço", type: "enum", accessor: (n) => n.serviceCode, options: ["1.07", "7.10", "14.01", "14.06"].map((v) => ({ value: v, label: `Item ${v}` })) },
  { key: "value", label: "Valor", type: "currency", accessor: (n) => n.value },
  { key: "issued", label: "Emissão", type: "date", accessor: (n) => n.issuedAt },
];
const searchText = (n: Invoice) => [n.number, n.rps, n.origin.label, clientById(n.clientId).name, clientById(n.clientId).cnpj.replace(/\D/g, "")];

/* XML e DANFSe gerados no navegador a partir dos dados da nota (sem servidor). */
const xmlEsc = xmlEscape;
const dec = machineDecimal;
const digits = (s: string) => s.replace(/\D/g, "");
const serviceName = (code: string) => services.find((s) => s.code === code)?.name ?? `Item ${code}`;

/** XML no leiaute ABRASF (CompNfse), montado com os dados da nota. */
function nfseXml(n: Invoice) {
  const k = clientById(n.clientId);
  return `<?xml version="1.0" encoding="UTF-8"?>
<CompNfse xmlns="http://www.abrasf.org.br/nfse.xsd">
  <Nfse versao="2.04">
    <InfNfse Id="NFSe${digits(n.number ?? n.rps)}">
      <Numero>${xmlEsc(n.number ?? "")}</Numero>
      <CodigoVerificacao>${xmlEsc(n.verification ?? "")}</CodigoVerificacao>
      <DataEmissao>${n.issuedAt.slice(0, 10)}T10:00:00-03:00</DataEmissao>
      <Competencia>${n.competence.split("/").reverse().join("-")}-01</Competencia>
      <IdentificacaoRps><Numero>${digits(n.rps)}</Numero><Serie>A</Serie><Tipo>1</Tipo></IdentificacaoRps>
      <Servico>
        <Valores>
          <ValorServicos>${dec(n.value)}</ValorServicos>
          <ValorIss>${dec(issOf(n))}</ValorIss>
          <Aliquota>${dec(n.issRate * 100)}</Aliquota>
          <ValorLiquidoNfse>${dec(n.value - (n.issWithheld ? issOf(n) : 0))}</ValorLiquidoNfse>
        </Valores>
        <IssRetido>${n.issWithheld ? 1 : 2}</IssRetido>
        <ItemListaServico>${xmlEsc(n.serviceCode)}</ItemListaServico>
        <Discriminacao>${xmlEsc(`${serviceName(n.serviceCode)} · ${n.origin.label}`)}</Discriminacao>
        <CodigoMunicipio>3550308</CodigoMunicipio>
      </Servico>
      <PrestadorServico>
        <IdentificacaoPrestador><Cnpj>${digits(company.cnpj)}</Cnpj><InscricaoMunicipal>${digits(company.im)}</InscricaoMunicipal></IdentificacaoPrestador>
        <RazaoSocial>${xmlEsc(company.name)}</RazaoSocial>
      </PrestadorServico>
      <TomadorServico>
        <IdentificacaoTomador><CpfCnpj><Cnpj>${digits(k.cnpj)}</Cnpj></CpfCnpj></IdentificacaoTomador>
        <RazaoSocial>${xmlEsc(k.name)}</RazaoSocial>
        <Endereco><Endereco>${xmlEsc(k.address)}</Endereco><Bairro>${xmlEsc(k.district)}</Bairro><CodigoMunicipio>3550308</CodigoMunicipio><Uf>SP</Uf></Endereco>
        <Contato><Email>${xmlEsc(k.email)}</Email></Contato>
      </TomadorServico>
    </InfNfse>
  </Nfse>
</CompNfse>
`;
}

function downloadXml(n: Invoice) {
  saveText(`nfse-${digits(n.number ?? n.rps)}.xml`, nfseXml(n), "application/xml");
  notify(`XML da NFS-e ${n.number} baixado`);
}

/** DANFSe: visão de impressão da nota. "Imprimir ou salvar PDF" usa o diálogo do navegador. */
function DanfseModal({ n, onClose }: { n: Invoice | null; onClose: () => void }) {
  const k = n ? clientById(n.clientId) : undefined;
  return (
    <Modal
      open={!!n}
      onClose={onClose}
      size="lg"
      kicker="DANFSe · documento auxiliar"
      title={n ? `NFS-e ${n.number}` : "NFS-e"}
      description="Confira e imprima. No diálogo de impressão, escolha “Salvar como PDF” para guardar o arquivo."
      footer={
        n && (
          <>
            <Button variant="ghost" onClick={() => downloadXml(n)}>
              <Download /> Baixar XML
            </Button>
            <Button onClick={() => window.print()}>
              <Printer /> Imprimir ou salvar PDF
            </Button>
          </>
        )
      }
    >
      {/* Impressão: só o documento, sem a página por trás nem o diálogo. */}
      <style>{`@media print { body * { visibility: hidden !important; } .danfse-doc, .danfse-doc * { visibility: visible !important; } .danfse-doc { position: fixed; inset: 0; border: 0 !important; } }`}</style>
      {n && k && (
        <article className="danfse-doc rounded-lg border border-line bg-surface text-[12.5px]">
          <header className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-4 py-3">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted">Prefeitura do Município de São Paulo</div>
              <div className="mt-0.5 text-[15px] font-semibold">Nota fiscal eletrônica de serviços · NFS-e</div>
            </div>
            <div className="text-right">
              <div className="font-mono text-[13px] font-semibold">{n.number}</div>
              <div className="text-muted">Emissão {formatDate(n.issuedAt)} · competência {n.competence}</div>
              <div className="text-muted">
                Verificação <span className="font-mono">{n.verification}</span>
              </div>
            </div>
          </header>
          <div className="grid gap-px bg-line sm:grid-cols-2">
            {[
              { title: "Prestador", lines: [company.name, `CNPJ ${company.cnpj} · IM ${company.im}`, `${company.city} · ${company.regime}`] },
              { title: "Tomador", lines: [k.name, `CNPJ ${k.cnpj}`, `${k.address} · ${k.district}`, k.email] },
            ].map((b) => (
              <section key={b.title} className="bg-surface px-4 py-3">
                <h3 className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted">{b.title}</h3>
                {b.lines.map((l, i) => (
                  <p key={l} className={i ? "mt-0.5 text-ink-soft" : "mt-1 font-medium"}>
                    {l}
                  </p>
                ))}
              </section>
            ))}
          </div>
          <section className="border-t border-line px-4 py-3">
            <h3 className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted">Discriminação dos serviços</h3>
            <p className="mt-1">
              {serviceName(n.serviceCode)} · {n.origin.label}
            </p>
            <p className="mt-0.5 text-muted">Item {n.serviceCode} da LC 116/2003 · município de incidência {n.city}</p>
          </section>
          <dl className="grid grid-cols-2 gap-px border-t border-line bg-line sm:grid-cols-4">
            {[
              ["Valor dos serviços", formatCurrency(n.value)],
              [`ISS (${formatPercent(n.issRate, 1)})`, formatCurrency(issOf(n))],
              ["ISS retido", n.issWithheld ? "Sim, pelo tomador" : "Não"],
              ["Valor líquido", formatCurrency(n.value - (n.issWithheld ? issOf(n) : 0))],
            ].map(([label, value]) => (
              <div key={label} className="bg-surface px-4 py-2.5">
                <dt className="text-[11px] text-muted">{label}</dt>
                <dd className="mt-0.5 font-medium tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>
        </article>
      )}
    </Modal>
  );
}

export default function SrvInvoices() {
  const estado = useListState();
  const id = useFrameParam("id");
  const aba = useFrameParam("aba");
  const [list, setList] = useState<Invoice[]>(() => (estado === "vazio" ? [] : seed));
  const [tab, setTab] = useState<Tab>(aba && aba in invoiceStatus ? (aba as InvoiceStatus) : "todas");
  const tabRows = useMemo(() => (tab === "todas" ? list : list.filter((n) => n.status === tab)), [list, tab]);
  const filters = useFilters(tabRows, { fields, search: searchText });
  const q = filters.state.query;
  const [canceling, setCanceling] = useState<Invoice | null>(null);
  const [danfse, setDanfse] = useState<Invoice | null>(null);
  const batch = useOperation({ busyLabel: "Emitindo…" });
  const opened = list.find((n) => n.id === id);
  const count = (s: InvoiceStatus) => list.filter((n) => n.status === s).length;
  const pending = list.filter((n) => n.status === "pendente");
  const issued = list.filter((n) => n.status === "emitida");

  const patch = (ids: Set<string>, p: (n: Invoice) => Partial<Invoice>) => setList((all) => all.map((n) => (ids.has(n.id) ? { ...n, ...p(n) } : n)));
  const emit = (targets: Invoice[]) => {
    const ids = new Set(targets.filter((n) => n.status === "pendente").map((n) => n.id));
    if (!ids.size) return notify("Nenhuma nota “A emitir” na seleção: só pendentes são emitidas em lote", undefined, "info");
    const before = list;
    let seq = 432;
    void batch.run(() => new Promise((r) => setTimeout(r, 900)), { message: `${ids.size === 1 ? "1 NFS-e emitida" : `${ids.size} NFS-e emitidas`} pela Prefeitura de São Paulo`, undo: () => setList(before) }, { apply: () => patch(ids, () => ({ status: "emitida", number: `2026/000${seq++}`, verification: "A7Q2-X9K1" })), revert: () => setList(before) });
  };

  const columns: GridColumn<Invoice>[] = [
    { key: "number", header: "Nota", value: (n) => n.number ?? n.rps, width: 140, pinned: "left", hideable: false, mobile: "title", cell: (n) => (n.number ? <Highlight text={n.number} query={q} className="font-mono text-[12.5px]" /> : <span className="text-muted"><Highlight text={n.rps} query={q} /></span>) },
    {
      key: "client",
      header: "Tomador",
      value: (n) => clientById(n.clientId).name,
      width: 240,
      mobile: "subtitle",
      cell: (n) => {
        const k = clientById(n.clientId);
        return (
          <span className="block min-w-0 leading-tight">
            <Highlight text={k.name} query={q} className="block truncate" />
            <span className="block text-[11.5px] tabular-nums text-muted">{k.cnpj}</span>
          </span>
        );
      },
    },
    { key: "origin", header: "Origem", value: (n) => n.origin.label, width: 170, cell: (n) => <a className="hover:underline" href={n.origin.kind === "os" ? frameHref("srv-work-order", n.origin.id) : frameHref("srv-contracts", n.origin.id)} onClick={(e) => e.stopPropagation()}>{n.origin.label}</a> },
    { key: "issued", header: "Emissão", value: (n) => n.issuedAt, width: 100, cell: (n) => <span className="tabular-nums text-muted">{formatDate(n.issuedAt, { short: true })}</span> },
    { key: "code", header: "Serviço", tooltip: "Item da lista da LC 116/2003", value: (n) => n.serviceCode, width: 90, defaultHidden: true },
    { key: "city", header: "Município", value: (n) => n.city, width: 120, defaultHidden: true },
    {
      key: "value",
      header: "Valor",
      value: (n) => n.value,
      width: 130,
      align: "right",
      cell: (n) => <span className="font-medium tabular-nums">{formatCurrency(n.value)}</span>,
      footer: (rows) => formatCurrency(rows.filter((n) => n.status !== "cancelada").reduce((s, n) => s + n.value, 0), { cents: false }),
    },
    {
      key: "iss",
      header: "ISS",
      tooltip: "Alíquota do município. Retido = o tomador recolhe e desconta do pagamento.",
      value: issOf,
      width: 150,
      align: "right",
      cell: (n) => (
        <span className="block leading-tight">
          <span className="block tabular-nums">{formatCurrency(issOf(n))}</span>
          <span className="block text-[11.5px] text-muted">
            {formatPercent(n.issRate, 1)} · {n.issWithheld ? "retido" : "próprio"}
          </span>
        </span>
      ),
      footer: (rows) => formatCurrency(rows.filter((n) => n.status !== "cancelada").reduce((s, n) => s + issOf(n), 0)),
    },
    { key: "status", header: "Situação", value: (n) => invoiceStatus[n.status].label, width: 130, cell: (n) => <Badge tone={invoiceStatus[n.status].tone}>{invoiceStatus[n.status].label}</Badge> },
  ];

  return (
    <ServicosShell section="notas">
      <Page>
        <PageHeading
          title="Notas fiscais de serviço"
          description={`NFS-e de ${company.name} · IM ${company.im} · Prefeitura de São Paulo · ${company.regime}`}
          actions={
            <OperationButton operation={batch} onClick={() => emit(pending)} disabled={!pending.length} disabledReason="Nenhuma nota a emitir.">
              <Send /> Emitir pendentes{pending.length ? ` (${pending.length})` : ""}
            </OperationButton>
          }
        />
        <OperationFeedback operation={batch} />
        {estado !== "carregando" && estado !== "erro" && list.length > 0 && (
          <StatGrid cols={4}>
            <StatCell label="Emitido em setembro" value={formatCurrency(issued.reduce((s, n) => s + n.value, 0), { cents: false })} hint={`${issued.length} notas`} />
            <StatCell label="A emitir" value={formatCurrency(pending.reduce((s, n) => s + n.value, 0), { cents: false })} hint={`${pending.length} OS concluídas`} tone={pending.length ? "warn" : undefined} />
            <StatCell label="Rejeitadas" value={count("rejeitada")} hint="corrigir antes do vencimento" tone={count("rejeitada") ? "bad" : undefined} />
            <StatCell label="ISS retido por tomadores" value={formatCurrency(issued.filter((n) => n.issWithheld).reduce((s, n) => s + issOf(n), 0))} hint="não entra no DAS" />
          </StatGrid>
        )}
        <Tabs
          className="mt-6"
          label="Situação"
          value={tab}
          onChange={(v) => setTab(v as Tab)}
          items={[
            { id: "todas", label: "Todas" },
            { id: "pendente", label: "A emitir", count: count("pendente") || undefined },
            { id: "processando", label: "Na prefeitura" },
            { id: "emitida", label: "Emitidas" },
            { id: "rejeitada", label: "Rejeitadas", count: count("rejeitada") || undefined },
            { id: "cancelada", label: "Canceladas" },
          ]}
        />
        <div className="mt-5">
          {estado === "carregando" ? (
            <LoadingTable label="Carregando notas fiscais" rows={7} />
          ) : estado === "erro" ? (
            <LoadError what="as notas fiscais" />
          ) : !list.length ? (
            <Empty
              title="Nenhuma nota fiscal ainda"
              hint="As NFS-e aparecem aqui quando você fatura uma OS concluída ou quando a mensalidade de um contrato é gerada."
              action={<Button href={frameHref("srv-work-orders")}>Ver OS concluídas</Button>}
            />
          ) : (
            <DataGrid
              label="Notas fiscais de serviço"
              rows={filters.rows}
              columns={columns}
              rowKey={(n) => n.id}
              rowLabel={(n) => `nota ${n.number ?? n.rps}`}
              maxHeight="max(420px, calc(100dvh - 440px))"
              storageKey="ponto-nfse"
              defaultSort={{ key: "issued", dir: "desc" }}
              query={q}
              selectable
              noun="nota"
              exportFileName="nfse-setembro-2026"
              rowTone={(n) => (n.status === "rejeitada" ? "bad" : undefined)}
              toolbar={<FilterBar filters={filters} noun="nota" search={<TableSearch value={q} onChange={filters.setQuery} total={tabRows.length} noun="nota" searchIn="número, RPS, OS, tomador e CNPJ" />} />}
              onRowOpen={(n) => setFrameQuery({ id: n.id })}
              rowActions={(n) => [
                { label: "Corrigir e reenviar", icon: <RotateCw />, inline: n.status === "rejeitada", disabled: n.status !== "rejeitada", onSelect: () => setFrameQuery({ id: n.id }) },
                { label: "Emitir agora", icon: <Send />, inline: n.status === "pendente", disabled: n.status !== "pendente", onSelect: () => emit([n]) },
                { label: "Ver DANFSe (PDF)", icon: <FileText />, disabled: n.status !== "emitida", onSelect: () => setDanfse(n) },
                { label: "Baixar XML", icon: <Download />, disabled: n.status !== "emitida", onSelect: () => downloadXml(n) },
                { label: "Cancelar nota", icon: <Ban />, tone: "danger", separator: true, disabled: n.status !== "emitida", onSelect: () => setCanceling(n) },
              ]}
              bulkActions={(rows, { clear }) => (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      emit(rows);
                      clear();
                    }}
                  >
                    <Send /> Emitir NFS-e
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      notify(`${rows.length === 1 ? "1 nota enviada" : `${rows.length} notas enviadas`} por e-mail aos tomadores`);
                      clear();
                    }}
                  >
                    <Mail /> Enviar por e-mail
                  </button>
                </>
              )}
              empty={<EmptyFilterResult filters={filters} noun="nota" gender="f" />}
              mobile="cards"
            />
          )}
        </div>
      </Page>
      {opened && (
        <InvoiceDrawer
          key={opened.id}
          n={opened}
          onChange={(next) => setList((all) => all.map((x) => (x.id === next.id ? next : x)))}
          onCancel={() => setCanceling(opened)}
          onDanfse={() => setDanfse(opened)}
        />
      )}
      <DanfseModal n={danfse} onClose={() => setDanfse(null)} />
      <ConfirmDialog
        open={!!canceling}
        onClose={() => setCanceling(null)}
        title={canceling ? `Cancelar a NFS-e ${canceling.number}?` : "Cancelar nota"}
        description="O cancelamento vai para a Prefeitura de São Paulo e não pode ser desfeito. A cobrança vinculada também é cancelada; para corrigir valor, emita uma nota substituta."
        confirmLabel="Cancelar nota"
        cancelLabel="Manter nota"
        tone="danger"
        onConfirm={() => {
          if (!canceling) return;
          patch(new Set([canceling.id]), () => ({ status: "cancelada", cancelReason: "Cancelada pelo emitente" }));
          notify(`NFS-e ${canceling.number} cancelada na prefeitura`);
          setCanceling(null);
        }}
      />
    </ServicosShell>
  );
}

function InvoiceDrawer({ n, onChange, onCancel, onDanfse }: { n: Invoice; onChange: (n: Invoice) => void; onCancel: () => void; onDanfse: () => void }) {
  const k = clientById(n.clientId);
  const [value, setValue] = useState(n.rejection?.current ?? "");
  const resend = useOperation({ busyLabel: "Reenviando…" });
  const close = () => setFrameQuery({ id: undefined });
  const changed = value.trim() && value.trim() !== n.rejection?.current;

  const footer =
    n.status === "rejeitada" ? (
      <OperationButton
        operation={resend}
        disabled={!changed}
        disabledReason="Corrija o campo apontado pela prefeitura antes de reenviar."
        onClick={() => {
          const before = n;
          void resend.run(() => new Promise((r) => setTimeout(r, 900)), { message: `${n.rps} reenviado · NFS-e 2026/000440 autorizada`, undo: () => onChange(before) }, { apply: () => onChange({ ...n, status: "emitida", number: "2026/000440", rejection: undefined, verification: "B3K8-Q1W2" }), revert: () => onChange(before) }).then((err) => !err && close());
        }}
      >
        <RotateCw /> Corrigir e reenviar
      </OperationButton>
    ) : n.status === "emitida" ? (
      <>
        <Button variant="ghost" onClick={onCancel}>
          <Ban /> Cancelar nota
        </Button>
        <Button onClick={() => notify(`NFS-e ${n.number} enviada para ${k.email}`)}>
          <Mail /> Enviar ao tomador
        </Button>
      </>
    ) : undefined;

  return (
    <Drawer open onClose={close} kicker={n.number ? `NFS-e ${n.number}` : n.rps} title={k.name} width={540} footer={footer}>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={invoiceStatus[n.status].tone}>{invoiceStatus[n.status].label}</Badge>
          <span className="text-[12.5px] text-muted">competência {n.competence}</span>
        </div>
        <OperationFeedback operation={resend} />
        {n.rejection && (
          <>
            <Callout tone="bad" title={`Rejeição ${n.rejection.code} · Prefeitura de São Paulo`}>
              {n.rejection.message}
            </Callout>
            <TextField label={n.rejection.fieldLabel} value={value} onChange={setValue} hint={n.rejection.hint} />
          </>
        )}
        {n.status === "cancelada" && n.cancelReason && <Callout title="Nota cancelada">{n.cancelReason}</Callout>}
        {n.status === "processando" && <Callout tone="info" title="Aguardando a prefeitura">Lote enviado. A prefeitura costuma responder em até 15 minutos; você é avisado quando a nota for autorizada.</Callout>}
        <PropertyList
          items={[
            { label: "Tomador", value: <a className="hover:underline" href={frameHref("srv-client", k.id)}>{k.name}</a>, hint: k.cnpj },
            { label: "Origem", value: <a className="hover:underline" href={n.origin.kind === "os" ? frameHref("srv-work-order", n.origin.id) : frameHref("srv-contracts", n.origin.id)}>{n.origin.label}</a> },
            { label: "Valor dos serviços", value: <span className="font-semibold tabular-nums">{formatCurrency(n.value)}</span> },
            { label: "Serviço (LC 116)", value: `Item ${n.serviceCode}` },
            { label: "ISS", value: `${formatCurrency(issOf(n))} · ${formatPercent(n.issRate, 1)}`, hint: n.issWithheld ? "retido pelo tomador: sai do valor a receber" : "recolhido pela Vértice no DAS" },
            { label: "Valor líquido a receber", value: <span className="tabular-nums">{formatCurrency(n.value - (n.issWithheld ? issOf(n) : 0))}</span> },
            { label: "Município de incidência", value: n.city },
            { label: "Código de verificação", value: n.verification ? <span className="font-mono text-[12.5px]">{n.verification}</span> : undefined },
          ]}
        />
        {n.status === "emitida" && (
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" onClick={onDanfse}>
              <FileText /> Ver DANFSe (PDF)
            </Button>
            <Button variant="ghost" onClick={() => downloadXml(n)}>
              <Download /> Baixar XML
            </Button>
          </div>
        )}
      </div>
    </Drawer>
  );
}
