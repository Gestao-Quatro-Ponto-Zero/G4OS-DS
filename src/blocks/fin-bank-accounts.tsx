import { ArrowLeftRight, ArrowRightLeft, Landmark, Link2, RefreshCw } from "lucide-react";
import { useState } from "react";
import {
  Badge,
  Button,
  CurrencyField,
  DataTable,
  Empty,
  KpiCard,
  KpiGrid,
  MiniBarChart,
  Modal,
  OperationButton,
  OperationFeedback,
  Page,
  PageHeading,
  Select,
  Skeleton,
  TextField,
  cn,
  formatCurrency,
  formatRelative,
  notify,
  useOperation,
  type Column,
} from "@g4ai/ds";
import { accountFlows, accounts as seed, bankLines, br, iso, ledger, today, type BankAccount, type BankLine } from "./data/fin";
import { go, setFrameQuery, useFrameParam } from "./shells/frame-route";
import { DemoErrorState, NexoShell, useDemoState } from "./shells/nexo-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Contas bancárias",
  description: "Saldo por conta com limite disponível, barrinhas de entradas e saídas dos últimos 7 dias úteis, última conciliação e pendências que levam à conciliação, extrato recente da conta escolhida e transferência entre contas.",
  category: "Financeiro",
  order: 8,
  height: 1180,
  concept: {
    goal: "Saber quanto há em cada banco agora, o que entrou e saiu e se a conta está conciliada.",
    patterns: [
      "Anatomia B · Painel: KPIs consolidados no topo e um cartão por conta",
      "MiniBarChart de entradas e saídas por conta (toque mostra o dia)",
      "Última conciliação com palavra e atalho para conciliar as pendências",
      "Extrato recente da conta escolhida (?id=) com situação de conciliação",
    ],
    adapt: [
      "Carteiras de meios de pagamento, cartões corporativos, caixas de loja",
    ],
    avoid: [
      "Saldo sem a data da última conciliação",
      "Cor sozinha para entrada e saída",
    ],
  },
} as const;

const money = (n: number) => formatCurrency(n, { compact: true });
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
/** Extrato de exemplo por conta (Itaú com 7 linhas, BB com 2, Inter em dia). */
const linesOf = (id: string): BankLine[] => (id === "itau" ? bankLines : id === "bb" ? bankLines.slice(3, 5) : []);

export default function FinBankAccounts() {
  const demo = useDemoState();
  const selected = useFrameParam("id", "itau");
  const [accounts, setAccounts] = useState<BankAccount[]>(() => (demo === "vazio" ? [] : seed.map((a) => ({ ...a }))));
  const [transfer, setTransfer] = useState(false);
  const total = accounts.reduce((s, a) => s + a.balance, 0);
  const flows = accounts.map((a) => accountFlows(a.id));
  const sumIn = flows.flat().reduce((s, d) => s + d.entradas, 0);
  const sumOut = flows.flat().reduce((s, d) => s + d.saidas, 0);
  const pending = accounts.reduce((s, a) => s + a.pending, 0);
  const current = accounts.find((a) => a.id === selected) ?? accounts[0];

  return (
    <NexoShell section="bancos">
      <Page>
        <PageHeading
          crumbs={[{ label: "Tesouraria" }]}
          title="Contas bancárias"
          description={`Saldos atualizados às 08:00 de ${br(iso(0))} pelo Open Finance; o BB chega por arquivo OFX.`}
          actions={
            <Button onClick={() => setTransfer(true)} disabled={accounts.length < 2} disabledReason="Conecte pelo menos duas contas para transferir.">
              <ArrowRightLeft /> Transferir entre contas
            </Button>
          }
        />
        {demo === "carregando" ? (
          <div role="status" aria-label="Carregando contas" className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="space-y-3 rounded-xl border border-line bg-surface p-4">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-6 w-32" />
                </div>
              ))}
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              {[0, 1].map((i) => (
                <div key={i} className="space-y-3 rounded-2xl border border-line bg-surface p-5">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-8 w-48" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ))}
            </div>
          </div>
        ) : demo === "erro" ? (
          <DemoErrorState noun="as contas bancárias" />
        ) : accounts.length === 0 ? (
          <Empty icon={<Landmark />} title="Nenhuma conta bancária conectada" hint="Conecte pelo Open Finance para ver saldos e extratos todo dia, ou importe o OFX na conciliação." action={<Button size="sm" onClick={() => notify("Pedido de conexão enviado ao Itaú: aprove no app do banco", undefined, "info")}><Link2 /> Conectar banco</Button>} />
        ) : (
          <div className="space-y-6">
            <KpiGrid>
              <KpiCard label="Saldo consolidado" value={money(total)} delta={-0.069} goodWhen="neutral" period="vs. 01/09" href="#/frame/fin-cashflow" />
              <KpiCard label="Entradas · 7 dias úteis" value={money(sumIn)} hint="recebimentos, Pix e cartão" />
              <KpiCard label="Saídas · 7 dias úteis" value={money(sumOut)} hint="fornecedores, folha e tributos" />
              <KpiCard label="Linhas a conciliar" value={pending} hint={pending ? `em ${accounts.filter((a) => a.pending).length} contas` : "tudo conciliado"} href="#/frame/fin-reconciliation" />
            </KpiGrid>

            <div className="grid gap-4 lg:grid-cols-2">
              {accounts.map((a) => (
                <AccountCard key={a.id} a={a} active={a.id === current?.id} onSelect={() => setFrameQuery({ id: a.id })} />
              ))}
            </div>

            {current && <Statement account={current} />}
          </div>
        )}
      </Page>
      {transfer && <TransferModal accounts={accounts} onClose={() => setTransfer(false)} onDone={(from, to, value) => setAccounts((all) => all.map((a) => (a.id === from ? { ...a, balance: a.balance - value } : a.id === to ? { ...a, balance: a.balance + value } : a)))} />}
    </NexoShell>
  );
}

function AccountCard({ a, active, onSelect }: { a: BankAccount; active: boolean; onSelect: () => void }) {
  const flows = accountFlows(a.id);
  const reconciledToday = a.lastReconciled === iso(0);
  return (
    <section aria-label={a.label} className={cn("flex min-w-0 flex-col rounded-2xl border bg-surface", active ? "border-line-strong shadow-raised" : "border-line")}>
      <header className="flex items-start justify-between gap-3 px-5 pt-4">
        <button type="button" onClick={onSelect} aria-pressed={active} className="flex min-w-0 items-center gap-3 rounded-lg text-left">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-line bg-soft font-mono text-[11.5px] font-semibold">{a.code}</span>
          <span className="min-w-0">
            <span className="block truncate text-[14px] font-medium hover:underline">{a.bank}</span>
            <span className="block truncate text-[12px] text-muted">
              {a.kind} · ag. {a.agency} · {a.number}
            </span>
          </span>
        </button>
        <Badge tone={a.feed === "Open Finance" ? "info" : "neutral"}>{a.feed}</Badge>
      </header>
      <div className="px-5 pt-3">
        <div className="text-[24px] font-semibold tabular-nums tracking-tight">{formatCurrency(a.balance)}</div>
        <p className="m-0 mt-0.5 text-[12px] text-muted">{a.overdraft ? `+ ${formatCurrency(a.overdraft, { cents: false })} de limite disponível · ${a.purpose}` : a.purpose}</p>
      </div>
      <div className="grid gap-3 px-5 pt-4 sm:grid-cols-2">
        <MiniBarChart label="Entradas" data={flows.map((d) => ({ label: d.label, value: d.entradas }))} format={(n) => formatCurrency(n, { cents: false })} caption="7 dias úteis" height={72} />
        <MiniBarChart label="Saídas" data={flows.map((d) => ({ label: d.label, value: d.saidas }))} format={(n) => formatCurrency(n, { cents: false })} caption="7 dias úteis" height={72} />
      </div>
      <footer className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line px-5 py-3">
        <span className="text-[12.5px] text-ink-soft">
          {reconciledToday ? "Conciliada hoje" : `Conciliada ${formatRelative(`${a.lastReconciled}T18:00:00`, today)}`} · {a.reconciledBy}
        </span>
        {a.pending ? (
          <Button size="sm" variant="ghost" onClick={() => go("fin-reconciliation", { conta: a.id })}>
            <ArrowLeftRight /> Conciliar {a.pending} {a.pending === 1 ? "linha" : "linhas"}
          </Button>
        ) : (
          <Badge tone="ok">Em dia</Badge>
        )}
      </footer>
    </section>
  );
}

function Statement({ account }: { account: BankAccount }) {
  const lines = linesOf(account.id);
  const columns: Column<BankLine>[] = [
    { key: "date", header: "Data", nowrap: true, cell: (b) => <span className="tabular-nums text-muted">{br(b.date)}</span> },
    { key: "desc", header: "Histórico", primary: true, cell: (b) => <span className="block min-w-0"><span className="block truncate font-mono text-[12px]">{b.description}</span>{b.match && <span className="block truncate text-[11.5px] font-normal text-muted">{ledger.find((l) => l.id === b.match)?.description}</span>}</span> },
    { key: "value", header: "Valor", align: "right", nowrap: true, cell: (b) => <span className={b.value < 0 ? "tabular-nums" : "font-medium tabular-nums text-ok"}>{b.value < 0 ? "−" : "+"}{formatCurrency(Math.abs(b.value))}</span> },
    { key: "status", header: "Conciliação", cell: (b) => (b.match && (b.confidence ?? 0) >= 0.9 ? <Badge tone="info">Sugestão segura</Badge> : b.match ? <Badge tone="warn">Revisar par</Badge> : <Badge>Sem lançamento</Badge>) },
  ];
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="m-0 text-[14px] font-medium">Extrato recente · {account.label}</h2>
        {lines.length > 0 && (
          <a className="text-[12.5px] font-medium text-blue hover:underline" href={`#/frame/fin-reconciliation?conta=${account.id}`}>
            Conciliar na tela de conciliação
          </a>
        )}
      </div>
      <DataTable label={`Extrato de ${account.label}`} rows={lines} columns={columns} rowKey={(b) => b.id} onRowClick={() => go("fin-reconciliation", { conta: account.id })} rowLabel={(b) => `Conciliar ${b.description}`} empty={<Empty framed={false} icon={<RefreshCw />} title="Sem lançamentos novos" hint={`Tudo o que passou por ${account.bank} já está conciliado.`} />} />
    </section>
  );
}

function TransferModal({ accounts, onClose, onDone }: { accounts: BankAccount[]; onClose: () => void; onDone: (from: string, to: string, value: number) => void }) {
  const [from, setFrom] = useState(accounts[0].id);
  const [to, setTo] = useState(accounts[1].id);
  const [value, setValue] = useState<number | null>(null);
  const [memo, setMemo] = useState("");
  const [tried, setTried] = useState(false);
  const op = useOperation({ busyLabel: "Transferindo…" });
  const src = accounts.find((a) => a.id === from)!;
  const dst = accounts.find((a) => a.id === to)!;
  const errors = {
    to: from === to ? "Escolha uma conta diferente da origem." : undefined,
    value: !value ? "Informe o valor." : value > src.balance + src.overdraft ? `Acima do disponível em ${src.bank} (${formatCurrency(src.balance + src.overdraft)}).` : undefined,
  };
  const save = async () => {
    setTried(true);
    if (errors.to || errors.value || !value) return;
    const failed = await op.run(() => wait(900), `Transferência de ${formatCurrency(value)} de ${src.bank} para ${dst.bank} concluída`, { apply: () => onDone(from, to, value), revert: () => onDone(to, from, value) });
    if (!failed) onClose();
  };
  return (
    <Modal
      open
      onClose={onClose}
      title="Transferir entre contas"
      description="Mesma titularidade (CNPJ 12.345.678/0001-90): sai por TED ou Pix e cai na hora."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <OperationButton operation={op} onClick={save}>
            Transferir
          </OperationButton>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Select label="De" value={from} onValueChange={setFrom} options={accounts.map((a) => ({ value: a.id, label: a.label, description: `saldo ${formatCurrency(a.balance, { cents: false })}` }))} />
        <Select label="Para" value={to} onValueChange={setTo} error={tried ? errors.to : undefined} options={accounts.map((a) => ({ value: a.id, label: a.label, description: `saldo ${formatCurrency(a.balance, { cents: false })}` }))} />
        <CurrencyField label="Valor" value={value} onChange={setValue} error={tried || (value && value > src.balance) ? errors.value : undefined} hint={`Disponível: ${formatCurrency(src.balance)}${src.overdraft ? ` + ${formatCurrency(src.overdraft, { cents: false })} de limite` : ""}`} />
        <TextField label="Descrição no extrato" value={memo} onChange={setMemo} placeholder="Ex.: Reforço de caixa para a folha" optional />
        <div className="sm:col-span-2">
          <OperationFeedback operation={op} />
        </div>
      </div>
    </Modal>
  );
}
