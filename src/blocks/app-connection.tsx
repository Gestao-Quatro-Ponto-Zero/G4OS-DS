import { Activity, Boxes, FolderSync, Layers, Link2, Package, RefreshCw, Unplug } from "lucide-react";
import { useState } from "react";
import {
  AccountRow,
  AppIcon,
  Breadcrumb,
  Button,
  ConfirmDialog,
  ConnectionStatus,
  DataSyncTable,
  MarketplaceHero,
  Page,
  ToolPermissionList,
  formatNumber,
  notify,
} from "@g4ai/ds";
import { appById, apps, type Account, type App } from "./data/apps";
import { go, goTo, useFrameParam } from "./shells/frame-route";
import { StudioShell, studioRoutes } from "./shells/studio-shell";

export const meta = {
  title: "Detalhe da conexão",
  description: "Um app conectado: estado, exemplo de pedido, dados sincronizados, contas e permissões de leitura/escrita por conta, desconectar com confirmação.",
  category: "Aplicação",
  height: 960,
  order: 31,
  concept: {
    goal: "Ver e controlar o que um app conectado pode ler e escrever, por conta, antes de deixar o agente usar.",
    patterns: [
      "Anatomia C · Registro: trilha Apps › nome, estado e ações no topo",
      "Exemplo de pedido no app para mostrar o valor",
      "Permissões separadas em Leitura e Escrita, por conta, com switch e desfazer",
      "Desconectar só com confirmação",
    ],
    adapt: [
      "Integrações de ERP/CRM, contas bancárias, provedores de e-mail",
    ],
    avoid: [
      "Uma permissão única 'acesso total' sem detalhar escrita",
    ],
  },
} as const;

const syncIcons = [Package, Layers, Boxes, Activity, FolderSync];

/** O que o agente pode fazer, para apps ainda não conectados (antes de autorizar). */
function capabilities(app: App) {
  return [
    { scope: "Leitura", text: `Consultar ${app.description.replace(/\.$/, "").toLowerCase()}` },
    { scope: "Escrita", text: "Criar e atualizar itens em seu nome — cada tipo de ação pede aprovação na primeira vez" },
  ];
}

export default function AppConnection() {
  const id = useFrameParam("id", "shopify");
  const app = appById(id) ?? apps.find((a) => a.id === "shopify")!;
  const [connected, setConnected] = useState(app.connected);
  const [accounts, setAccounts] = useState<Account[]>(app.accounts ?? []);
  const [confirm, setConfirm] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const setPermission = (accountId: string, permId: string, enabled: boolean) => {
    const before = accounts;
    setAccounts((list) => list.map((a) => (a.id === accountId ? { ...a, permissions: a.permissions.map((p) => (p.id === permId ? { ...p, enabled } : p)) } : a)));
    const perm = before.find((a) => a.id === accountId)?.permissions.find((p) => p.id === permId);
    notify(`${perm?.title ?? "Permissão"} ${enabled ? "permitida" : "revogada"}`, () => setAccounts(before));
  };
  const disconnect = () => {
    setConnected(false);
    setConfirm(false);
    notify(`${app.name} desconectado`, () => setConnected(true));
  };
  const connect = () => {
    setConnected(true);
    notify(`${app.name} conectado`, () => setConnected(false));
  };

  return (
    <StudioShell current={studioRoutes.connection(app.id)} mode="chat">
      <Page>
        <div className="mx-auto w-full max-w-[760px] pb-10">
          <Breadcrumb items={[{ label: "Apps", href: studioRoutes.apps }, { label: app.name }]} />

          <header className="mt-6">
            <AppIcon icon={app.icon} color={app.color} size="xl" label={app.name} />
            <div className="mt-4 flex flex-wrap items-center gap-2.5">
              <h1 className="m-0 text-[24px] font-semibold tracking-[-0.02em]">{app.name}</h1>
              <ConnectionStatus status={connected ? "connected" : "disconnected"} label={connected ? "Conectado" : "Não conectado"} />
            </div>
            <p className="m-0 mt-2 max-w-[620px] text-[14px] leading-relaxed text-muted">{app.long}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {connected ? (
                <>
                  <Button size="sm" onClick={() => goTo(`${studioRoutes.sessions}?novo=${encodeURIComponent(`${app.name}: ${app.prompt}`)}`)}>
                    Pedir ao agente
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setSyncing(true);
                      setTimeout(() => {
                        setSyncing(false);
                        notify(`${app.name} sincronizado agora`);
                      }, 900);
                    }}
                    disabled={syncing}
                  >
                    <RefreshCw className={syncing ? "motion-safe:animate-spin" : undefined} /> {syncing ? "Sincronizando…" : "Sincronizar agora"}
                  </Button>
                </>
              ) : (
                <Button size="sm" onClick={connect}>
                  <Link2 /> Conectar {app.name}
                </Button>
              )}
            </div>
          </header>

          <MarketplaceHero className="mt-7" height={128} prompts={[{ app, text: app.prompt, onClick: connected ? () => goTo(`${studioRoutes.sessions}?novo=${encodeURIComponent(`${app.name}: ${app.prompt}`)}`) : connect }]} />

          {!connected && (
            <section className="mt-9">
              <h2 className="m-0 text-[16px] font-medium">O que o agente poderá fazer</h2>
              <p className="m-0 mt-1 text-[13px] text-muted">Você escolhe, por conta, o que fica liberado depois de conectar. Dá para revogar a qualquer momento.</p>
              <ul className="m-0 mt-3 list-none divide-y divide-line rounded-xl border border-line bg-surface p-0">
                {capabilities(app).map((c) => (
                  <li key={c.scope} className="flex items-start gap-3 px-4 py-3 text-[13.5px]">
                    <span className={c.scope === "Escrita" ? "mt-0.5 rounded bg-amber-soft px-1.5 py-px text-[11px] font-medium text-amber" : "mt-0.5 rounded bg-soft px-1.5 py-px text-[11px] font-medium text-ink-soft ring-1 ring-line"}>{c.scope}</span>
                    <span className="text-ink-soft">{c.text}.</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {connected && app.sync && (
            <section className="mt-9">
              <h2 className="m-0 mb-3 text-[16px] font-medium">Sincronização de dados</h2>
              <DataSyncTable
                rows={app.sync.map((s, i) => ({
                  label: s.label,
                  value: formatNumber(s.value),
                  hint: s.hint,
                  icon: syncIcons[i % syncIcons.length],
                  onClick: () => notify(`Exemplo: abre a lista de “${s.label.toLowerCase()}”`, undefined, "info"),
                }))}
              />
              <p className="m-0 mt-2 text-[12px] text-muted">Última sincronização há 12 min · automática a cada hora.</p>
            </section>
          )}

          {connected && (
            <section className="mt-9">
              <div className="mb-3 flex items-end justify-between gap-3">
                <h2 className="m-0 text-[16px] font-medium">{app.category === "Comércio" ? "Lojas" : "Contas"}</h2>
                <Button size="sm" variant="quiet" onClick={() => notify(`Exemplo: abre a autorização de outra conta do ${app.name}`, undefined, "info")}>
                  Adicionar conta
                </Button>
              </div>
              {accounts.length ? (
                <div className="overflow-hidden rounded-xl border border-line bg-surface">
                  {accounts.map((acc, i) => (
                    <AccountRow
                      key={acc.id}
                      name={acc.name}
                      url={acc.url}
                      defaultOpen={i === 0}
                      meta={`${acc.permissions.filter((p) => p.enabled).length} de ${acc.permissions.length} permissões`}
                      mark={<AppIcon letter={acc.name.slice(0, 1)} color={acc.color} size="sm" variant="soft" />}
                    >
                      <ToolPermissionList appName={app.name} items={acc.permissions} onChange={(pid, v) => setPermission(acc.id, pid, v)} />
                    </AccountRow>
                  ))}
                </div>
              ) : (
                <p className="m-0 rounded-xl border border-dashed border-line px-4 py-6 text-center text-[13px] text-muted">
                  Conectado pelo workspace inteiro. As permissões valem para todas as conversas do agente.
                </p>
              )}
            </section>
          )}

          {connected && (
            <section className="mt-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose/20 bg-rose-soft/40 px-4 py-3">
              <div>
                <p className="m-0 text-[13.5px] font-medium">Desconectar {app.name}</p>
                <p className="m-0 mt-0.5 text-[12.5px] text-muted">O agente perde o acesso na hora. Relatórios já gerados continuam salvos.</p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setConfirm(true)}>
                <Unplug /> Desconectar
              </Button>
            </section>
          )}

          <nav aria-label="Outros apps" className="mt-10 border-t border-line pt-5">
            <p className="m-0 mb-2 text-[12.5px] text-muted">Outros apps de {app.category}</p>
            <div className="flex flex-wrap gap-2">
              {apps
                .filter((a) => a.category === app.category && a.id !== app.id)
                .slice(0, 5)
                .map((a) => (
                  <button key={a.id} type="button" onClick={() => go("app-connection", a.id)} className="inline-flex h-9 items-center gap-2 rounded-lg bg-surface pl-1.5 pr-3 text-[13px] ring-1 ring-line hover:ring-line-strong">
                    <AppIcon icon={a.icon} color={a.color} size="sm" variant="plain" />
                    {a.name}
                  </button>
                ))}
            </div>
          </nav>
        </div>
      </Page>
      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={disconnect}
        title={`Desconectar o ${app.name}?`}
        description="O agente deixa de ler e de escrever nesse app imediatamente. Você pode conectar de novo depois, mas terá que autorizar as contas outra vez."
        confirmLabel="Desconectar"
        tone="danger"
      />
    </StudioShell>
  );
}
