import { CheckCircle2, Plug, RefreshCw } from "lucide-react";
import { useState } from "react";
import {
  Badge,
  Banner,
  Button,
  ConfirmDialog,
  Drawer,
  FieldBlock,
  Modal,
  Page,
  PageHeading,
  SegmentedControl,
  Select,
  Switch,
  TableSearch,
  TextField,
  cn,
  matchesQuery,
  notify,
} from "@g4os/ds";
import { integrations as base, type Integration } from "./data/saas";
import { SaasShell } from "./shells/saas-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Integrações",
  description: "Catálogo por categoria com busca, estado de sincronização, erro com reconexão, conexão por autorização e configuração em gaveta.",
  category: "SaaS",
  order: 8,
  height: 980,
  concept: {
    goal: "Manter as integrações funcionando e conectar novas sem sair do produto.",
    patterns: [
      "Catálogo por categoria com busca",
      "Estado de sincronização e erro com reconexão em destaque",
      "Autorização em modal; configuração em gaveta",
    ],
    adapt: [
      "Conexões bancárias, canais de venda, provedores de e-mail",
    ],
    avoid: [
      "Integração com erro sem botão de reconectar",
    ],
  },
} as const;

const here = "#/frame/saas-integrations";
const categories = ["Todas", "CRM", "Comunicação", "Dados", "Pagamentos", "Automação"] as const;

export default function SaasIntegrations() {
  const [items, setItems] = useState(base);
  const [cat, setCat] = useState<(typeof categories)[number]>("Todas");
  const [query, setQuery] = useState("");
  const [connecting, setConnecting] = useState<Integration | null>(null);
  const [configuring, setConfiguring] = useState<Integration | null>(null);
  const [disconnecting, setDisconnecting] = useState<Integration | null>(null);
  const [freq, setFreq] = useState("15 min");

  const list = items.filter((i) => (cat === "Todas" || i.category === cat) && matchesQuery(query, [i.name, i.description, i.category]));
  const broken = items.filter((i) => i.connected && i.status === "erro");
  const patch = (id: string, p: Partial<Integration>) => setItems((all) => all.map((i) => (i.id === id ? { ...i, ...p } : i)));

  return (
    <SaasShell current={here}>
      <Page>
        <PageHeading title="Integrações" description={`${items.filter((i) => i.connected).length} conectadas de ${items.length}. Os dados sincronizam em segundo plano.`} />
        {broken.map((b) => (
          <Banner
            key={b.id}
            tone="bad"
            className="mt-5 rounded-xl border"
            title={`${b.name} parou de sincronizar ${b.lastSync}`}
            action={
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  patch(b.id, { status: "ok", lastSync: "agora" });
                  notify(`${b.name} reconectado · sincronizando`);
                }}
              >
                <RefreshCw /> Reconectar
              </Button>
            }
          >
            O token de acesso expirou. Reconecte para retomar a sincronização de empresas e negócios.
          </Banner>
        ))}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <TableSearch value={query} onChange={setQuery} total={items.length} noun="integração" nounPlural="integrações" searchIn="nome e descrição" className="w-full sm:w-72" />
          <div className="max-w-full overflow-x-auto">
            <SegmentedControl label="Categoria" value={cat} onChange={setCat} options={categories.map((c) => ({ value: c, label: c }))} />
          </div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((i) => (
            <article key={i.id} className={cn("surface-card flex flex-col rounded-xl border bg-surface p-4", i.connected && i.status === "erro" ? "border-rose/30" : "border-line")}>
              <div className="flex items-start gap-3">
                {/* ds-audit-ignore white-black: logo de integração sobre a cor da marca parceira */}
                <span className="inline-grid h-10 w-10 shrink-0 place-items-center rounded-lg text-[13px] font-semibold text-white" style={{ background: i.tint }}>
                  {i.initials}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-[14px] font-medium">{i.name}</span>
                    {i.connected && (i.status === "erro" ? <Badge tone="bad">Erro</Badge> : <Badge tone="ok">Conectado</Badge>)}
                  </div>
                  <div className="text-[12px] text-muted">{i.category}</div>
                </div>
              </div>
              <p className="m-0 mt-3 flex-1 text-[13px] leading-relaxed text-ink-soft">{i.description}</p>
              <div className="mt-4 flex items-center justify-between gap-2">
                <span className="text-[12px] text-muted">{i.connected ? `Sincronizado ${i.lastSync}` : "Não conectado"}</span>
                {i.connected ? (
                  <Button size="sm" variant="ghost" onClick={() => setConfiguring(i)}>
                    Configurar
                  </Button>
                ) : (
                  <Button size="sm" variant="ghost" onClick={() => setConnecting(i)}>
                    <Plug /> Conectar
                  </Button>
                )}
              </div>
            </article>
          ))}
          {!list.length && <p className="col-span-full py-10 text-center text-[13px] text-muted">Nenhuma integração encontrada. Peça uma nova pelo suporte.</p>}
        </div>
      </Page>

      <Modal
        open={!!connecting}
        onClose={() => setConnecting(null)}
        size="sm"
        title={`Conectar ${connecting?.name ?? ""}`}
        description="Você será levado ao site do serviço para autorizar o acesso. O Pulso só lê os dados necessários."
        footer={
          <>
            <Button variant="ghost" onClick={() => setConnecting(null)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (!connecting) return;
                patch(connecting.id, { connected: true, status: "ok", lastSync: "agora" });
                notify(`${connecting.name} conectado · primeira sincronização em andamento`);
                setConnecting(null);
              }}
            >
              Autorizar acesso
            </Button>
          </>
        }
      >
        <ul className="m-0 list-none space-y-2 p-0 text-[13px]">
          {["Ler registros e metadados", "Receber eventos em tempo real", "Nunca excluir dados no serviço"].map((p) => (
            <li key={p} className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-ok" /> {p}
            </li>
          ))}
        </ul>
      </Modal>

      <Drawer
        open={!!configuring}
        onClose={() => setConfiguring(null)}
        kicker="Integração"
        title={configuring?.name ?? ""}
        footer={
          <>
            <Button variant="ghost" onClick={() => configuring && setDisconnecting(configuring)}>
              Desconectar
            </Button>
            <Button
              onClick={() => {
                notify(`${configuring?.name} · sincronização a cada ${freq}`);
                setConfiguring(null);
              }}
            >
              Salvar
            </Button>
          </>
        }
      >
        {configuring && (
          <div className="space-y-5">
            <TextField label="Chave de API" value="pk_live_••••••••••••3f9a" onChange={() => undefined} readOnly hint="Gerada na autorização. Reconecte para trocar." />
            <FieldBlock label="Frequência de sincronização">
              <Select label="Frequência de sincronização" value={freq} onValueChange={setFreq} options={["5 min", "15 min", "1 h", "Diária"].map((f) => ({ value: f, label: `A cada ${f}` }))} />
            </FieldBlock>
            <div className="divide-y divide-line rounded-xl border border-line px-4">
              {["Importar registros novos", "Atualizar registros existentes", "Avisar no Slack quando falhar"].map((l, k) => (
                <div key={l} className="flex items-center justify-between gap-3 py-2.5 text-[13px]">
                  {l}
                  <ToggleRow initial={k < 2} label={l} />
                </div>
              ))}
            </div>
          </div>
        )}
      </Drawer>

      <ConfirmDialog
        open={!!disconnecting}
        onClose={() => setDisconnecting(null)}
        onConfirm={() => {
          if (!disconnecting) return;
          patch(disconnecting.id, { connected: false, status: undefined, lastSync: undefined });
          notify(`${disconnecting.name} desconectado`, () => patch(disconnecting.id, { connected: true, status: "ok", lastSync: "agora" }));
          setDisconnecting(null);
          setConfiguring(null);
        }}
        title={`Desconectar ${disconnecting?.name ?? ""}?`}
        description="A sincronização para agora. Os dados já importados continuam no Pulso."
        confirmLabel="Desconectar"
        tone="danger"
      />
    </SaasShell>
  );
}

function ToggleRow({ initial, label }: { initial: boolean; label: string }) {
  const [on, setOn] = useState(initial);
  return <Switch label={label} hideLabel checked={on} onCheckedChange={setOn} />;
}
