import { Copy, Download, FileText, Mail, Printer } from "lucide-react";
import { useState, type ReactNode } from "react";
import {
  ActionMenu,
  Badge,
  Button,
  Callout,
  ConfirmDialog,
  Modal,
  Page,
  PageHeading,
  TextareaField,
  formatCurrency,
  formatNumber,
  notify,
} from "@g4ai/ds";
import { br, company, customerById, invoiceById, invoiceStatus, orderById, productBySku, type Invoice } from "./data/erp";
import { machineDecimal, saveText, xmlEscape } from "./shells/download";
import { go, useFrameParam } from "./shells/frame-route";
import { NexoShell } from "./shells/nexo-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Nota fiscal (NF-e)",
  description: "Documento fiscal para tela e impressão: chave de acesso, emitente e destinatário, itens com NCM/CFOP, tributos, totais, transporte, carta de correção e cancelamento.",
  category: "ERP",
  order: 10,
  height: 1180,
  concept: {
    goal: "Conferir, imprimir e corrigir uma NF-e com a mesma leitura do documento fiscal.",
    patterns: [
      "Anatomia C · Registro como documento: cabeçalho fixo (fora da impressão)",
      "Layout fiel ao documento: chave, emitente, destinatário, itens, tributos",
      "CSS de impressão só com o documento",
      "Carta de correção e cancelamento com confirmação",
    ],
    adapt: [
      "Proposta comercial, contrato, recibo",
    ],
    avoid: [
      "Embrulhar o cabeçalho num invólucro (o fixo para de funcionar)",
    ],
  },
} as const;

function Box({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={`min-w-0 px-4 py-3 ${className ?? ""}`}>
      <div className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted">{label}</div>
      <div className="mt-1 text-[13px] leading-relaxed">{children}</div>
    </div>
  );
}

export default function ErpInvoice() {
  const id = useFrameParam("id", "12345");
  return <InvoiceDoc key={id} invoice={invoiceById(id)} />;
}

function InvoiceDoc({ invoice }: { invoice: Invoice }) {
  const order = orderById(invoice.orderId);
  const c = customerById(invoice.customerId);
  const [status, setStatus] = useState(invoice.status);
  const [cancel, setCancel] = useState(false);
  const [cce, setCce] = useState(false);
  const [cceText, setCceText] = useState("");
  const items = order.items.map((it) => ({ ...it, p: productBySku(it.sku) }));
  const subtotal = items.reduce((s, it) => s + it.qty * it.price, 0);
  const discount = Math.round(subtotal * 0.01 * 100) / 100;
  const total = subtotal - discount + order.freight;
  const taxes = [
    { label: "Base de cálculo ICMS", value: total },
    { label: `ICMS (${invoice.cfop === "5102" ? "17" : "12"} %)`, value: total * (invoice.cfop === "5102" ? 0.17 : 0.12) },
    { label: "IPI", value: 0 },
    { label: "PIS (0,65 %)", value: subtotal * 0.0065 },
    { label: "COFINS (3 %)", value: subtotal * 0.03 },
  ];
  const digits = (v: string) => v.replace(/\D/g, "");
  /** XML da NF-e (leiaute 4.00, resumido) montado com os dados da nota. */
  const nfeXml = () => `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <NFe>
    <infNFe Id="NFe${invoice.key}" versao="4.00">
      <ide><serie>${invoice.series}</serie><nNF>${digits(invoice.number)}</nNF><dhEmi>${invoice.issuedAt.slice(0, 10)}T09:00:00-03:00</dhEmi><tpNF>1</tpNF></ide>
      <emit><CNPJ>${digits(company.cnpj)}</CNPJ><xNome>${xmlEscape(company.name)}</xNome><IE>${digits(company.ie)}</IE></emit>
      <dest><CNPJ>${digits(c.cnpj)}</CNPJ><xNome>${xmlEscape(c.name)}</xNome><enderDest><xMun>${xmlEscape(c.city)}</xMun><UF>${c.uf}</UF></enderDest></dest>
${items.map((it, i) => `      <det nItem="${i + 1}"><prod><cProd>${xmlEscape(it.sku)}</cProd><xProd>${xmlEscape(it.p.name)}</xProd><NCM>${digits(it.p.ncm)}</NCM><CFOP>${invoice.cfop}</CFOP><uCom>${xmlEscape(it.p.unit)}</uCom><qCom>${it.qty}</qCom><vUnCom>${machineDecimal(it.price)}</vUnCom><vProd>${machineDecimal(it.qty * it.price)}</vProd></prod></det>`).join("\n")}
      <total><ICMSTot><vBC>${machineDecimal(taxes[0].value)}</vBC><vICMS>${machineDecimal(taxes[1].value)}</vICMS><vProd>${machineDecimal(subtotal)}</vProd><vFrete>${machineDecimal(order.freight)}</vFrete><vDesc>${machineDecimal(discount)}</vDesc><vPIS>${machineDecimal(taxes[3].value)}</vPIS><vCOFINS>${machineDecimal(taxes[4].value)}</vCOFINS><vNF>${machineDecimal(total)}</vNF></ICMSTot></total>
    </infNFe>
  </NFe>
  <protNFe versao="4.00"><infProt><chNFe>${invoice.key}</chNFe><cStat>${status === "autorizada" ? 100 : 101}</cStat><xMotivo>${status === "autorizada" ? "Autorizado o uso da NF-e" : "Cancelamento de NF-e homologado"}</xMotivo></infProt></protNFe>
</nfeProc>
`;
  const keyGroups = invoice.key.match(/.{1,4}/g)?.join(" ");
  return (
    <NexoShell section="notas">
      {/* Impressão: só o documento. */}
      <style>{`@media print { aside[aria-label="Menu principal"], nav[aria-label="Navegação principal"], .no-print { display: none !important; } .invoice-doc { border: 0 !important; box-shadow: none !important; } }`}</style>
      <Page>
        {/* contents: o cabeçalho fixo precisa da página inteira como contêiner (um invólucro limitaria o sticky). */}
        <div className="no-print contents">
          <PageHeading
            crumbs={[
              { label: "Notas fiscais", href: "#/frame/erp-invoices" },
              { label: `Pedido ${order.number}`, href: `#/frame/erp-order?id=${order.id}` },
            ]}
            title={`NF-e ${invoice.number}`}
            description={`Série ${invoice.series} · emitida em ${br(invoice.issuedAt)} · ${c.name}`}
            actions={
              <>
                <Button
                  variant="ghost"
                  onClick={() => {
                    saveText(`NFe${invoice.key}.xml`, nfeXml(), "application/xml");
                    notify(`XML da NF-e ${invoice.number} baixado`);
                  }}
                >
                  <Download /> XML
                </Button>
                <Button onClick={() => window.print()}>
                  <Printer /> Imprimir DANFE
                </Button>
                <ActionMenu
                  actions={[
                    { label: "Enviar por e-mail", icon: <Mail className="h-4 w-4" />, onSelect: () => notify(`DANFE e XML enviados para ${c.email}`) },
                    { label: "Carta de correção", icon: <FileText className="h-4 w-4" />, onSelect: () => setCce(true), disabled: status !== "autorizada" },
                    { label: "Cancelar NF-e", tone: "danger", separator: true, onSelect: () => setCancel(true), disabled: status !== "autorizada" },
                  ]}
                />
              </>
            }
          />
          {status === "rejeitada" && invoice.reason && (
            <div className="mt-5">
              <Callout
                tone="bad"
                title="Rejeitada pela SEFAZ"
                action={
                  <Button size="sm" variant="ghost" onClick={() => go("erp-invoices", { corrigir: invoice.id })}>
                    Corrigir e reenviar
                  </Button>
                }
              >
                {invoice.reason}
              </Callout>
            </div>
          )}
        </div>

        <article className="invoice-doc mx-auto mt-6 max-w-[920px] overflow-hidden rounded-xl border border-line bg-surface">
          <header className="flex flex-wrap items-start justify-between gap-4 border-b border-line px-5 py-4">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted">Nota fiscal eletrônica</div>
              <div className="mt-1 text-[20px] font-semibold tracking-tight">
                Nº {invoice.number} <span className="text-[14px] font-normal text-muted">· série {invoice.series}</span>
              </div>
              <div className="mt-0.5 text-[12.5px] text-muted">Venda de mercadoria adquirida de terceiros</div>
            </div>
            <div className="text-right">
              <Badge tone={invoiceStatus[status].tone}>{status === "autorizada" ? "Autorizada pela SEFAZ-GO" : invoiceStatus[status].label}</Badge>
              {status === "autorizada" && <div className="mt-2 text-[11.5px] tabular-nums text-muted">Protocolo 1522600004{invoice.id} · {br(invoice.issuedAt)}</div>}
            </div>
          </header>

          <div className="flex flex-wrap items-center gap-3 border-b border-line bg-soft/50 px-5 py-3">
            <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted">Chave de acesso</span>
            <code className="min-w-0 flex-1 break-all font-mono text-[12.5px] tracking-wide">{keyGroups}</code>
            <button
              type="button"
              className="no-print inline-flex h-7 items-center gap-1.5 rounded-md border border-line bg-surface px-2 text-[11.5px] text-muted hover:text-ink"
              onClick={() => {
                navigator.clipboard?.writeText(invoice.key);
                notify("Chave copiada", undefined, "info");
              }}
            >
              <Copy className="h-3.5 w-3.5" /> Copiar
            </button>
          </div>

          <div className="grid divide-y divide-line border-b border-line md:grid-cols-2 md:divide-x md:divide-y-0">
            <Box label="Emitente">
              <div className="font-medium">{company.name}</div>
              <div className="tabular-nums text-ink-soft">
                CNPJ {company.cnpj} · IE {company.ie}
              </div>
              <div className="text-muted">{company.address}</div>
            </Box>
            <Box label="Destinatário">
              <a href={`#/frame/erp-customers?id=${c.id}`} className="font-medium hover:underline">
                {c.name}
              </a>
              <div className="tabular-nums text-ink-soft">CNPJ {c.cnpj}</div>
              <div className="text-muted">
                {c.city}/{c.uf} · {c.email}
              </div>
            </Box>
          </div>

          <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Itens da nota">
            <table className="w-full min-w-[640px] text-[12.5px]">
              <thead className="border-b border-line bg-soft/60 text-[11.5px] text-muted">
                <tr>
                  {["Código", "Descrição", "NCM", "CFOP", "Qtd.", "Un.", "Valor unit.", "Valor total"].map((h, i) => (
                    <th key={h} className={`px-3 py-2 font-medium ${i >= 4 && i !== 5 ? "text-right" : "text-left"} ${i === 0 ? "pl-5" : ""} ${i === 7 ? "pr-5" : ""}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {items.map((it) => (
                  <tr key={it.sku}>
                    <td className="py-2.5 pl-5 pr-3 font-mono text-[11.5px] text-muted">{it.sku}</td>
                    <td className="px-3 py-2.5">{it.p.name}</td>
                    <td className="px-3 py-2.5 tabular-nums text-muted">{it.p.ncm}</td>
                    <td className="px-3 py-2.5 tabular-nums text-muted">{invoice.cfop}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{formatNumber(it.qty)}</td>
                    <td className="px-3 py-2.5 uppercase text-muted">{it.p.unit}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{formatCurrency(it.price)}</td>
                    <td className="py-2.5 pl-3 pr-5 text-right font-medium tabular-nums">{formatCurrency(it.qty * it.price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid border-t border-line md:grid-cols-[1fr_300px]">
            <div className="grid grid-cols-2 gap-px bg-line sm:grid-cols-3 md:border-r md:border-line">
              {taxes.map((t) => (
                <Box key={t.label} label={t.label} className="bg-surface">
                  <span className="tabular-nums">{formatCurrency(t.value)}</span>
                </Box>
              ))}
              <Box label="Frete" className="bg-surface">
                <span className="tabular-nums">{formatCurrency(order.freight)}</span>
              </Box>
            </div>
            <dl className="m-0 space-y-1.5 border-t border-line bg-soft/40 px-5 py-4 text-[13px] md:border-t-0">
              <div className="flex justify-between">
                <dt className="text-muted">Produtos</dt>
                <dd className="m-0 tabular-nums">{formatCurrency(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Desconto</dt>
                <dd className="m-0 tabular-nums">− {formatCurrency(discount)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Frete</dt>
                <dd className="m-0 tabular-nums">{formatCurrency(order.freight)}</dd>
              </div>
              <div className="flex items-baseline justify-between border-t border-line pt-2">
                <dt className="font-medium">Total da nota</dt>
                <dd className="m-0 text-[18px] font-semibold tabular-nums tracking-tight">{formatCurrency(total)}</dd>
              </div>
            </dl>
          </div>

          <div className="grid divide-y divide-line border-t border-line">
            <Box label="Transporte">Rápido Sul Transportes Ltda. · CNPJ 11.222.333/0001-44 · {order.freight ? "frete por conta do destinatário (FOB)" : "frete por conta do emitente (CIF)"}</Box>
            <Box label="Informações complementares">
              <span className="text-ink-soft">Pedido {order.number}. Pagamento: {order.payment.toLowerCase()}. Documento emitido por ME/EPP não gera direito a crédito fiscal de IPI.</span>
            </Box>
          </div>
        </article>
      </Page>

      <ConfirmDialog
        open={cancel}
        onClose={() => setCancel(false)}
        tone="danger"
        title={`Cancelar a NF-e ${invoice.number}?`}
        description="O cancelamento é enviado à SEFAZ e não pode ser desfeito. Só é permitido até 24 horas após a autorização e se a mercadoria não saiu."
        confirmLabel="Cancelar nota"
        cancelLabel="Manter nota"
        onConfirm={() => {
          setCancel(false);
          setStatus("cancelada");
          notify("Pedido de cancelamento enviado à SEFAZ", undefined, "info");
        }}
      />
      <Modal
        open={cce}
        onClose={() => setCce(false)}
        title="Carta de correção"
        description="Corrige dados que não alteram valores, impostos, remetente ou destinatário (ex.: endereço de entrega, dados do transportador)."
        footer={
          <>
            <Button variant="ghost" onClick={() => setCce(false)}>
              Cancelar
            </Button>
            <Button
              disabled={cceText.trim().length < 15}
              onClick={() => {
                setCce(false);
                setCceText("");
                notify("Carta de correção registrada na SEFAZ (sequência 1)");
              }}
            >
              Enviar correção
            </Button>
          </>
        }
      >
        <TextareaField label="O que corrigir" value={cceText} onChange={setCceText} autosize minRows={4} counter hint="Mínimo de 15 caracteres, exigência da SEFAZ." />
      </Modal>
    </NexoShell>
  );
}
