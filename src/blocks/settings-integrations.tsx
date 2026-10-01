import { Bot, Calendar, CreditCard, FileSpreadsheet, Mail, MessageCircle, MessageSquare, Plug, RefreshCw, Receipt, Search } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import {
  Badge,
  Button,
  Drawer,
  Empty,
  PropertyList,
  SearchInput,
  Switch,
  Tabs,
  Timeline,
  normalize,
  notify,
} from "@g4ai/ds";
import { setFrameQuery, useFrameQuery } from "./shells/frame-route";
import { SettingsShell } from "./shells/settings-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Integrações",
  description: "Catálogo de integrações com filtros por categoria, conectar/desconectar, e detalhe em drawer (permissões, sincronização, histórico) aberto por ?id=.",
  category: "Configurações",
  order: 7,
  height: 900,
  concept: {
    goal: "Conectar e controlar integrações do workspace com permissões claras.",
    patterns: [
      "Anatomia D · Configurações: título 'Configurações' fixo e subnavegação colada abaixo (SettingsLayout)",
      "Catálogo com filtros por categoria",
      "Detalhe em gaveta (permissões, sincronização, histórico) por ?id=",
    ],
    adapt: [
      "Integrações de qualquer produto",
    ],
    avoid: [
      "Conectar sem mostrar o que será acessado",
    ],
  },
} as const;

/* ------------------------------------------------------------------ */
/* Dados de exemplo                                                    */
/* ------------------------------------------------------------------ */

type Category = "comunicacao" | "financeiro" | "produtividade" | "ia";
type Integration = {
  id: string;
  name: string;
  vendor: string;
  category: Category;
  description: string;
  icon: ReactNode;
  connected: boolean;
  account?: string;
  lastSync?: string;
  scopes: string[];
};

const categories: { id: Category | "todas" | "conectadas"; label: string }[] = [
  { id: "todas", label: "Todas" },
  { id: "conectadas", label: "Conectadas" },
  { id: "comunicacao", label: "Comunicação" },
  { id: "financeiro", label: "Financeiro" },
  { id: "produtividade", label: "Produtividade" },
  { id: "ia", label: "IA" },
];

const initial: Integration[] = [
  { id: "slack", name: "Slack", vendor: "Slack Technologies", category: "comunicacao", description: "Avisos de negócios, chamados e aprovações nos canais do time.", icon: <MessageSquare />, connected: true, account: "acme.slack.com", lastSync: "há 2 min", scopes: ["Enviar mensagens em canais escolhidos", "Ler nomes de canais"] },
  { id: "whatsapp", name: "WhatsApp Business", vendor: "Meta", category: "comunicacao", description: "Converse com clientes a partir do registro e guarde o histórico.", icon: <MessageCircle />, connected: false, scopes: ["Enviar mensagens modelo", "Receber respostas"] },
  { id: "google", name: "Google Workspace", vendor: "Google", category: "produtividade", description: "Agenda, e-mail e arquivos do Drive ligados a clientes e negócios.", icon: <Calendar />, connected: true, account: "acme.com.br", lastSync: "há 14 min", scopes: ["Ler e criar eventos", "Ler e-mails de contatos", "Anexar arquivos do Drive"] },
  { id: "microsoft", name: "Microsoft 365", vendor: "Microsoft", category: "produtividade", description: "Outlook, Teams e OneDrive para times que usam Microsoft.", icon: <Mail />, connected: false, scopes: ["Ler e criar eventos", "Ler e-mails de contatos"] },
  { id: "sheets", name: "Planilhas (importação)", vendor: "Atlas", category: "produtividade", description: "Importe clientes, produtos e pedidos de CSV ou Excel.", icon: <FileSpreadsheet />, connected: true, account: "Última importação: 1.240 linhas", lastSync: "ontem", scopes: ["Criar e atualizar registros"] },
  { id: "asaas", name: "Asaas", vendor: "Asaas", category: "financeiro", description: "Boletos, Pix e conciliação automática de recebimentos.", icon: <CreditCard />, connected: true, account: "Conta PJ · Acme", lastSync: "há 1 h", scopes: ["Criar cobranças", "Ler recebimentos"] },
  { id: "nfe", name: "Emissor de NF-e", vendor: "Focus NFe", category: "financeiro", description: "Emissão de notas fiscais a partir dos pedidos faturados.", icon: <Receipt />, connected: false, scopes: ["Emitir e cancelar NF-e", "Consultar status na SEFAZ"] },
  { id: "claude", name: "Claude (Anthropic)", vendor: "Anthropic", category: "ia", description: "Modelo do Assistente G4 para resumos, respostas e agentes.", icon: <Bot />, connected: true, account: "Plano Business · dados não usados para treino", lastSync: "agora", scopes: ["Ler registros que você abrir no assistente", "Executar ferramentas aprovadas"] },
];

/* ------------------------------------------------------------------ */

export default function SettingsIntegrationsBlock() {
  const query = useFrameQuery();
  const [items, setItems] = useState(initial);
  const [tab, setTab] = useState<string>("todas");
  const [q, setQ] = useState("");
  const [syncing, setSyncing] = useState(false);
  const openId = query.get("id");
  const open = items.find((i) => i.id === openId) ?? null;

  const shown = useMemo(
    () =>
      items.filter((i) => (tab === "todas" ? true : tab === "conectadas" ? i.connected : i.category === tab)).filter((i) => !q || normalize(`${i.name} ${i.description}`).includes(normalize(q))),
    [items, tab, q],
  );
  const toggle = (id: string, on: boolean) => {
    setItems((is) => is.map((i) => (i.id === id ? { ...i, connected: on, lastSync: on ? "agora" : i.lastSync, account: on ? i.account ?? "Conta conectada" : i.account } : i)));
    const it = items.find((i) => i.id === id);
    notify(on ? `${it?.name} conectado` : `${it?.name} desconectado`, on ? undefined : () => toggle(id, true));
  };
  const connectedCount = items.filter((i) => i.connected).length;

  return (
    <SettingsShell slug="settings-integrations" title="Integrações" description={`${connectedCount} de ${items.length} conectadas. Só administradores podem conectar novas integrações.`}>
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput value={q} onChange={setQ} placeholder="Buscar integração…" className="min-w-[200px] flex-1" />
      </div>
      <Tabs label="Categorias" className="mt-3 border-b border-line" value={tab} onChange={setTab} items={categories.map((c) => ({ id: c.id, label: c.label, count: c.id === "conectadas" ? connectedCount : undefined }))} />
      {shown.length === 0 ? (
        <div className="mt-6">
          <Empty icon={<Search strokeWidth={1.5} />} title="Nenhuma integração encontrada" hint="Tente outro termo ou fale com a gente para pedir uma integração nova." action={<Button size="sm" variant="ghost" onClick={() => { setQ(""); setTab("todas"); }}>Limpar busca</Button>} />
        </div>
      ) : (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {shown.map((i) => (
            <article key={i.id} className="surface-card flex flex-col rounded-xl border border-line bg-surface p-4">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-line bg-soft text-ink-soft [&_svg]:h-5 [&_svg]:w-5">{i.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="m-0 text-[14px] font-medium">{i.name}</h3>
                    {i.connected && <Badge tone="ok">Conectado</Badge>}
                  </div>
                  <p className="m-0 mt-1 text-[12.5px] leading-relaxed text-muted">{i.description}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between gap-2 border-t border-line pt-3">
                <Button size="sm" variant="quiet" onClick={() => setFrameQuery({ id: i.id })}>
                  Detalhes
                </Button>
                <Switch label={i.connected ? `Desconectar ${i.name}` : `Conectar ${i.name}`} hideLabel checked={i.connected} onCheckedChange={(v) => toggle(i.id, v)} />
              </div>
            </article>
          ))}
        </div>
      )}

      <Drawer
        open={!!open}
        onClose={() => setFrameQuery({ id: undefined })}
        kicker={open?.vendor}
        title={open?.name ?? ""}
        footer={
          open && (
            <>
              {open.connected ? (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setSyncing(true);
                      setTimeout(() => {
                        setSyncing(false);
                        setItems((is) => is.map((x) => (x.id === open.id ? { ...x, lastSync: "agora" } : x)));
                        notify(`${open.name} sincronizado`);
                      }, 900);
                    }}
                    disabled={syncing}
                  >
                    <RefreshCw /> {syncing ? "Sincronizando…" : "Sincronizar agora"}
                  </Button>
                  <Button variant="ghost" className="text-rose" onClick={() => { toggle(open.id, false); setFrameQuery({ id: undefined }); }}>
                    Desconectar
                  </Button>
                </>
              ) : (
                <Button onClick={() => toggle(open.id, true)}>
                  <Plug /> Conectar {open.name}
                </Button>
              )}
            </>
          )
        }
      >
        {open && (
          <div className="space-y-6">
            <p className="text-[13.5px] leading-relaxed text-ink-soft">{open.description}</p>
            <PropertyList
              items={[
                { label: "Situação", value: open.connected ? <Badge tone="ok">Conectado</Badge> : <Badge>Desconectado</Badge> },
                { label: "Conta", value: open.connected ? open.account : undefined },
                { label: "Última sincronização", value: open.connected ? open.lastSync : undefined },
              ]}
            />
            <section>
              <h3 className="m-0 mb-2 text-[13px] font-medium">O que a integração pode fazer</h3>
              <ul className="m-0 list-disc space-y-1 pl-5 text-[13px] text-ink-soft">
                {open.scopes.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </section>
            {open.connected && (
              <section>
                <h3 className="m-0 mb-3 text-[13px] font-medium">Histórico</h3>
                <Timeline
                  items={[
                    { id: "1", title: "Sincronização concluída", meta: open.lastSync, tone: "ok" },
                    { id: "2", title: "Permissões revisadas por Joana Ribeiro", meta: "12/09" },
                    { id: "3", title: "Integração conectada", meta: "03/03/2026" },
                  ]}
                />
              </section>
            )}
          </div>
        )}
      </Drawer>
    </SettingsShell>
  );
}
