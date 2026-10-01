import { ArrowLeftRight, Check, Link2, Plus, Sparkles, Undo2, Upload } from "lucide-react";
import { useState } from "react";
import {
  Badge,
  Button,
  Empty,
  FieldBlock,
  Meter,
  Page,
  PageHeading,
  Select,
  cn,
  formatCurrency,
  formatPercent,
  notify,
} from "@g4ai/ds";
import { accounts, bankLines, br, ledger, type BankLine } from "./data/fin";
import { NexoShell } from "./shells/nexo-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Conciliação bancária",
  description: "Extrato do banco × lançamentos do ERP lado a lado: sugestões com grau de confiança, aceite em massa, vínculo manual e lançamento para tarifas e rendimentos sem documento.",
  category: "Financeiro",
  order: 5,
  height: 1000,
  concept: {
    goal: "Bater o extrato com o ERP rápido, aceitando o óbvio e resolvendo só as exceções.",
    patterns: [
      "Anatomia F · Mestre-detalhe: extrato × lançamentos lado a lado",
      "Sugestões com grau de confiança; aceite em massa",
      "Vínculo manual e lançamento para tarifas sem documento",
    ],
    adapt: [
      "Conciliação de cartões, de estoque físico × sistema",
    ],
    avoid: [
      "Pedir confirmação item a item quando a confiança é alta",
    ],
  },
} as const;

type State = { matched: string | null; created?: boolean };

export default function FinReconciliation() {
  const [account, setAccount] = useState("itau");
  const [state, setState] = useState<Record<string, State>>({});
  const [picking, setPicking] = useState<string | null>(null);
  // Cada conta tem o próprio extrato (aqui: Itaú com 7 linhas, BB com 2, Inter em dia).
  const lines = account === "itau" ? bankLines : account === "bb" ? bankLines.slice(3, 5) : [];
  const done = (b: BankLine) => !!state[b.id]?.matched || !!state[b.id]?.created;
  const used = new Set(Object.values(state).map((s) => s.matched).filter(Boolean));
  const doneCount = lines.filter(done).length;

  const accept = (ids: string[]) => {
    const before = state;
    setState((s) => ({ ...s, ...Object.fromEntries(ids.map((id) => [id, { matched: bankLines.find((b) => b.id === id)!.match ?? null }])) }));
    notify(ids.length === 1 ? "Lançamento conciliado" : `${ids.length} lançamentos conciliados`, () => setState(before));
  };
  const create = (b: BankLine) => {
    setState((s) => ({ ...s, [b.id]: { matched: null, created: true } }));
    notify(`Lançamento criado: ${b.value < 0 ? "Despesas bancárias" : "Receitas financeiras"} ${formatCurrency(Math.abs(b.value))}`, () => setState((s) => ({ ...s, [b.id]: { matched: null } })));
  };
  const confident = lines.filter((b) => !done(b) && (b.confidence ?? 0) >= 0.9);

  return (
    <NexoShell section="conciliacao">
      <Page>
        <PageHeading
          title="Conciliação bancária"
          description="Cada linha do extrato precisa de um lançamento no ERP. O motor sugere o par pelo valor, data e nome."
          actions={
            <>
              <Button variant="ghost" onClick={() => notify("Extrato OFX de 30/09 importado · 7 novas linhas", undefined, "info")}>
                <Upload /> Importar OFX
              </Button>
              <Button disabled={!confident.length} onClick={() => accept(confident.map((b) => b.id))}>
                <Sparkles /> Aceitar {confident.length} sugestões seguras
              </Button>
            </>
          }
        />
        <div className="mt-6 grid gap-4 md:grid-cols-[260px_minmax(0,1fr)] md:items-end">
          <FieldBlock label="Conta">
            <Select label="Conta bancária" value={account} onValueChange={setAccount} options={accounts.filter((a) => a.id !== "cdb").map((a) => ({ value: a.id, label: a.label, description: `${a.pending} pendentes` }))} />
          </FieldBlock>
          <div>
            <div className="flex items-baseline justify-between gap-3 text-[13px]">
              <span className="font-medium">Extrato de hoje</span>
              <span className="tabular-nums text-muted">
                <span className="font-medium text-ink">{doneCount}</span> de {lines.length} conciliadas
              </span>
            </div>
            <div className="mt-2">
              <Meter value={lines.length ? (doneCount / lines.length) * 100 : 100} thick tone={doneCount === lines.length ? "ok" : "ink"} label="Progresso da conciliação" />
            </div>
          </div>
        </div>

        <div className="mt-6 hidden grid-cols-[minmax(0,1fr)_48px_minmax(0,1fr)] gap-3 px-1 text-[11px] font-medium uppercase tracking-[0.08em] text-muted lg:grid">
          <span>Extrato do banco</span>
          <span />
          <span>Lançamento no ERP</span>
        </div>
        {lines.length === 0 && (
          <div className="mt-2">
            <Empty title="Tudo conciliado nesta conta" hint="Não há linhas novas no extrato desde a última importação." icon={<Check />} />
          </div>
        )}
        <ul className="mt-2 list-none space-y-2.5 p-0">
          {lines.map((b) => {
            const s = state[b.id];
            const match = ledger.find((l) => l.id === (s?.matched ?? b.match));
            const ok = done(b);
            return (
              <li key={b.id} className={cn("grid grid-cols-[minmax(0,1fr)] items-stretch gap-2 rounded-xl border p-2 transition-colors lg:grid-cols-[minmax(0,1fr)_48px_minmax(0,1fr)] lg:gap-3", ok ? "border-ok/25 bg-ok-soft/30" : "border-line bg-surface")}>
                <div className="rounded-lg px-3 py-2.5">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="min-w-0 truncate font-mono text-[12px]">{b.description}</span>
                    <span className={cn("shrink-0 text-[14px] font-semibold tabular-nums", b.value < 0 ? "text-rose" : "text-ok")}>
                      {b.value < 0 ? "−" : "+"}
                      {formatCurrency(Math.abs(b.value))}
                    </span>
                  </div>
                  <div className="mt-0.5 text-[11.5px] text-muted">{br(b.date)}</div>
                </div>
                <div className="flex items-center justify-center text-muted" aria-hidden>
                  {ok ? <Check className="h-4 w-4 text-ok" /> : <ArrowLeftRight className="h-4 w-4" />}
                </div>
                <div className={cn("rounded-lg px-3 py-2.5", !ok && "border border-dashed border-line")}>
                  {s?.created ? (
                    <div className="flex items-center justify-between gap-3 text-[13px]">
                      <span>Lançamento criado agora · {b.value < 0 ? "Despesas bancárias" : "Receitas financeiras"}</span>
                      <button type="button" className="text-muted hover:text-ink" aria-label="Desfazer" onClick={() => setState((x) => ({ ...x, [b.id]: { matched: null } }))}>
                        <Undo2 className="h-4 w-4" />
                      </button>
                    </div>
                  ) : picking === b.id ? (
                    <div className="space-y-1.5">
                      <p className="m-0 text-[12px] text-muted">Escolha o lançamento correspondente:</p>
                      {ledger
                        .filter((l) => !used.has(l.id) && Math.sign(l.value) === Math.sign(b.value))
                        .map((l) => (
                          <button
                            key={l.id}
                            type="button"
                            onClick={() => {
                              setState((x) => ({ ...x, [b.id]: { matched: l.id } }));
                              setPicking(null);
                              notify(Math.abs(l.value - b.value) > 0.01 ? `Vinculado com diferença de ${formatCurrency(Math.abs(l.value - b.value))} (juros/desconto)` : "Vinculado manualmente");
                            }}
                            className="flex w-full items-center justify-between gap-3 rounded-md px-2 py-1.5 text-left text-[12.5px] hover:bg-soft"
                          >
                            <span className="min-w-0 truncate">{l.description}</span>
                            <span className="shrink-0 tabular-nums">{formatCurrency(l.value)}</span>
                          </button>
                        ))}
                      <button type="button" className="text-[12px] text-muted hover:text-ink" onClick={() => setPicking(null)}>
                        Cancelar
                      </button>
                    </div>
                  ) : match ? (
                    <div>
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="min-w-0 truncate text-[13px]">{match.description}</span>
                        <span className="shrink-0 text-[13px] tabular-nums">{formatCurrency(match.value)}</span>
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        {ok ? (
                          <>
                            <Badge tone="ok">Conciliado</Badge>
                            <button type="button" className="text-[12px] text-muted hover:text-ink" onClick={() => setState((x) => ({ ...x, [b.id]: { matched: null } }))}>
                              Desfazer
                            </button>
                          </>
                        ) : (
                          <>
                            <Badge tone={(b.confidence ?? 0) >= 0.9 ? "ok" : (b.confidence ?? 0) >= 0.75 ? "info" : "warn"}>Sugestão · {formatPercent(b.confidence ?? 0, 0)}</Badge>
                            {Math.abs(match.value - b.value) > 0.01 && <Badge tone="warn">Diferença {formatCurrency(Math.abs(match.value - b.value))}</Badge>}
                            <span className="ml-auto flex gap-1">
                              <Button size="sm" variant="ghost" onClick={() => setPicking(b.id)}>
                                <Link2 /> Outro
                              </Button>
                              <Button size="sm" onClick={() => accept([b.id])}>
                                <Check /> Conciliar
                              </Button>
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[12.5px] text-muted">Sem lançamento correspondente</span>
                      <span className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => setPicking(b.id)}>
                          <Link2 /> Vincular
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => create(b)}>
                          <Plus /> Criar lançamento
                        </Button>
                      </span>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </Page>
    </NexoShell>
  );
}
