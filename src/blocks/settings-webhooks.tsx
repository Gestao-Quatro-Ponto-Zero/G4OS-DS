import { Plus, RotateCcw, Webhook } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import {
  ActionMenu,
  Button,
  CheckboxGroup,
  ConfirmDialog,
  CopyButton,
  DataTable,
  Drawer,
  Empty,
  ErrorState,
  HealthDot,
  OperationButton,
  OperationFeedback,
  Skeleton,
  TableToolbar,
  TextField,
  formatNumber,
  formatPercent,
  formatRelative,
  normalize,
  notify,
  useOperation,
  type Column,
} from "@g4ai/ds";
import {
  deliveryLabel,
  deliveryTone,
  endpointLabel,
  endpointTone,
  eventLabel,
  initialDeliveries,
  initialEndpoints,
  settingsNow,
  webhookEvents,
  type Delivery,
  type WebhookEndpoint,
} from "./data/settings";
import { useFrameParam } from "./shells/frame-route";
import { SettingsShell } from "./shells/settings-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Webhooks",
  description: "Endpoints com eventos, status e taxa de sucesso; criar e editar em Drawer, pausar, excluir com confirmação, entregas recentes com reenvio e os cinco estados (?estado=carregando|vazio|erro).",
  category: "Configurações",
  order: 7.5,
  height: 980,
  concept: {
    goal: "Ligar o workspace a outros sistemas por eventos e descobrir rápido quando uma entrega falha.",
    patterns: [
      "Anatomia D · Configurações: título 'Configurações' fixo e subnavegação colada abaixo (SettingsLayout)",
      "Status por ponto + texto; endpoint falhando pinta a linha",
      "Criar/editar em Drawer com useOperation + OperationButton",
      "Entregas recentes com reenvio; excluir com ConfirmDialog",
      "Cinco estados: carregando, vazio, vazio por busca (Limpar), erro, com dados",
    ],
    adapt: ["Integrações de ERP, notificações de pagamento no financeiro, eventos de candidatura no ATS"],
    avoid: ["Mostrar o segredo inteiro na lista", "Excluir endpoint sem confirmação", "Falha de entrega só em log técnico"],
  },
} as const;

/* ------------------------------------------------------------------ */

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
type Draft = { id?: string; url: string; description: string; events: string[] };
const blank: Draft = { url: "", description: "", events: [] };
const newSecret = () => `whsec_${Math.random().toString(16).slice(2, 10)}`;

/** Seção de largura total para tabelas largas (a SettingsSection deixa só a coluna da direita). */
function WideSection({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="mt-10 first:mt-0">
      <h2 className="m-0 text-[15px] font-medium">{title}</h2>
      {description && <p className="m-0 mt-1 max-w-[640px] text-[12.5px] leading-relaxed text-muted">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default function SettingsWebhooksBlock() {
  const estado = useFrameParam("estado");
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>(estado === "vazio" ? [] : initialEndpoints);
  const [deliveries, setDeliveries] = useState<Delivery[]>(estado === "vazio" ? [] : initialDeliveries);
  const [q, setQ] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [tried, setTried] = useState(false);
  const [removing, setRemoving] = useState<WebhookEndpoint | null>(null);
  const [resending, setResending] = useState<string | null>(null);
  const [failed, setFailed] = useState(estado === "erro");
  const op = useOperation();

  const shown = useMemo(() => endpoints.filter((e) => !q || normalize(`${e.url} ${e.description}`).includes(normalize(q))), [endpoints, q]);
  const endpointById = (id: string) => endpoints.find((e) => e.id === id);

  const openNew = () => {
    op.reset();
    setTried(false);
    setDraft({ ...blank });
  };
  const openEdit = (e: WebhookEndpoint) => {
    op.reset();
    setTried(false);
    setDraft({ id: e.id, url: e.url, description: e.description, events: e.events });
  };

  const urlError = tried && draft ? (!/^https:\/\/[^\s.]+\.[^\s]+$/.test(draft.url.trim()) ? "Informe uma URL https completa, como https://erp.suaempresa.com/hooks." : undefined) : undefined;
  const eventsError = tried && draft && !draft.events.length ? "Escolha pelo menos um evento." : undefined;

  const submit = () => {
    if (!draft) return;
    setTried(true);
    if (!/^https:\/\/[^\s.]+\.[^\s]+$/.test(draft.url.trim()) || !draft.events.length) return;
    const editing = Boolean(draft.id);
    void op.run(() => wait(700), editing ? "Endpoint atualizado" : "Endpoint criado. Enviamos um evento de teste.").then((err) => {
      if (err) return;
      if (editing) setEndpoints((es) => es.map((e) => (e.id === draft.id ? { ...e, url: draft.url.trim(), description: draft.description.trim(), events: draft.events } : e)));
      else setEndpoints((es) => [{ id: `wh${Date.now()}`, url: draft.url.trim(), description: draft.description.trim() || "Sem descrição", events: draft.events, status: "ativo", successRate: 1, secret: newSecret() }, ...es]);
      setDraft(null);
    });
  };

  const togglePause = (e: WebhookEndpoint) => {
    const next = e.status === "pausado" ? "ativo" : "pausado";
    setEndpoints((es) => es.map((x) => (x.id === e.id ? { ...x, status: next } : x)));
    notify(next === "pausado" ? "Endpoint pausado. Eventos novos ficam na fila por 72 h." : "Endpoint retomado", () => setEndpoints((es) => es.map((x) => (x.id === e.id ? { ...x, status: e.status } : x))));
  };

  const resend = (d: Delivery) => {
    setResending(d.id);
    setTimeout(() => {
      setResending(null);
      setDeliveries((ds) => [{ ...d, id: `ev_${Date.now().toString().slice(-4)}`, status: "entregue", code: 200, at: settingsNow, ms: 205 }, ...ds]);
      notify(`Evento ${d.id} reenviado`);
    }, 800);
  };

  const columns: Column<WebhookEndpoint>[] = [
    {
      key: "url",
      header: "Endpoint",
      primary: true,
      cell: (e) => (
        <span className="block min-w-0">
          <span className="block truncate font-mono text-[12.5px]">{e.url}</span>
          <span className="block truncate text-[12px] font-normal text-muted">
            {e.description} · {e.events.length === 1 ? eventLabel(e.events[0]) : `${e.events.length} eventos`}
          </span>
        </span>
      ),
    },
    { key: "status", header: "Status", nowrap: true, cell: (e) => <HealthDot tone={endpointTone[e.status]} label={endpointLabel[e.status]} /> },
    {
      key: "sucesso",
      header: "Sucesso (7 dias)",
      align: "right",
      nowrap: true,
      mobileHidden: true,
      cell: (e) => <span className={e.successRate < 0.9 ? "font-medium tabular-nums text-rose" : "tabular-nums"}>{formatPercent(e.successRate, 1)}</span>,
    },
    { key: "ultima", header: "Última entrega", nowrap: true, mobileHidden: true, cell: (e) => <span className="text-muted">{e.lastDelivery ? formatRelative(e.lastDelivery, settingsNow) : "Nenhuma"}</span> },
    {
      key: "acoes",
      header: "",
      action: true,
      align: "right",
      cell: (e) => (
        <ActionMenu
          label={`Ações para ${e.url}`}
          actions={[
            { label: "Editar endpoint", onSelect: () => openEdit(e) },
            { label: e.status === "pausado" ? "Retomar" : "Pausar", onSelect: () => togglePause(e) },
            { label: "Enviar evento de teste", onSelect: () => notify(`Evento de teste entregue em ${e.url}`) },
            { label: "Excluir endpoint", tone: "danger" as const, separator: true, onSelect: () => setRemoving(e) },
          ]}
        />
      ),
    },
  ];

  const deliveryCols: Column<Delivery>[] = [
    { key: "evento", header: "Evento", primary: true, cell: (d) => <span className="min-w-0"><span className="block whitespace-nowrap">{eventLabel(d.event)}</span><span className="block font-mono text-[11.5px] font-normal text-muted">{d.id} · {formatNumber(d.ms)} ms</span></span> },
    { key: "destino", header: "Destino", mobileHidden: true, cell: (d) => <span className="block max-w-[180px] truncate text-muted">{endpointById(d.endpointId)?.description ?? "Endpoint excluído"}</span> },
    { key: "status", header: "Status", cell: (d) => <HealthDot tone={deliveryTone[d.status]} label={`${deliveryLabel[d.status]} · ${d.code}`} /> },
    { key: "quando", header: "Quando", nowrap: true, cell: (d) => <span className="text-muted">{formatRelative(d.at, settingsNow)}</span> },
    {
      key: "reenviar",
      header: "",
      action: true,
      align: "right",
      cell: (d) =>
        d.status !== "entregue" && endpointById(d.endpointId) ? (
          <Button size="sm" variant="quiet" onClick={() => resend(d)} disabled={resending === d.id}>
            <RotateCcw /> {resending === d.id ? "Reenviando…" : "Reenviar"}
          </Button>
        ) : null,
    },
  ];

  const loading = estado === "carregando";
  const editingSecret = draft?.id ? endpointById(draft.id)?.secret : undefined;

  return (
    <SettingsShell
      slug="settings-webhooks"
      title="Webhooks"
      description="Avisamos seus sistemas quando algo acontece no workspace, com uma requisição POST assinada."
      actions={
        endpoints.length > 0 && !failed ? (
          <Button onClick={openNew}>
            <Plus /> Criar endpoint
          </Button>
        ) : undefined
      }
    >
      {failed ? (
        <ErrorState
          size="md"
          title="Não foi possível carregar os webhooks"
          description="Seus endpoints continuam recebendo eventos. Só a lista não abriu."
          onRetry={() => setFailed(false)}
          details="GET /v1/webhooks · 503 Service Unavailable · req_7Hq2c9"
        />
      ) : loading ? (
        <div className="flex flex-col gap-3" aria-busy="true" aria-label="Carregando webhooks">
          <Skeleton className="h-9 w-full max-w-[320px]" />
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="flex items-center gap-4 rounded-xl border border-line bg-surface px-4 py-3">
              <div className="min-w-0 flex-1">
                <Skeleton className="h-3.5 w-2/3" />
                <Skeleton className="mt-2 h-3 w-1/3" />
              </div>
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-3 w-14" />
            </div>
          ))}
        </div>
      ) : endpoints.length === 0 ? (
        <Empty
          icon={<Webhook />}
          title="Nenhum webhook ainda"
          hint="Crie um endpoint para avisar seu ERP, BI ou Slack quando negócios, faturas e pessoas mudarem."
          action={
            <Button onClick={openNew}>
              <Plus /> Criar endpoint
            </Button>
          }
        />
      ) : (
        <>
          <WideSection title="Endpoints" description="Cada endpoint recebe só os eventos escolhidos. Depois de 3 dias falhando, pausamos e avisamos os administradores.">
            {endpoints.length >= 4 && (
              <div className="mb-3">
                <TableToolbar query={q} onQuery={setQ} placeholder="Buscar por URL ou descrição" shown={shown.length} total={endpoints.length} noun="endpoint" dirty={!!q} onClear={() => setQ("")} hideSearch={false} />
              </div>
            )}
            <DataTable
              label="Endpoints de webhook"
              rows={shown}
              columns={columns}
              rowKey={(e) => e.id}
              rowTone={(e) => (e.status === "falhando" ? "bad" : undefined)}
              onRowClick={openEdit}
              rowLabel={(e) => `Editar ${e.url}`}
              empty={
                <Empty
                  framed={false}
                  title="Nenhum endpoint com essa busca"
                  hint="Confira a URL ou busque pela descrição."
                  action={
                    <Button variant="ghost" onClick={() => setQ("")}>
                      Limpar busca
                    </Button>
                  }
                />
              }
            />
          </WideSection>

          <WideSection title="Entregas recentes" description="Últimas 24 horas. Falhas são repetidas sozinhas até 5 vezes; reenvie quando o destino voltar.">
            <DataTable
              label="Entregas recentes"
              rows={deliveries}
              columns={deliveryCols}
              rowKey={(d) => d.id}
              empty={<Empty framed={false} title="Nenhuma entrega nas últimas 24 horas" hint="Envie um evento de teste pelo menu ⋯ do endpoint." />}
            />
          </WideSection>
        </>
      )}

      <Drawer
        open={draft !== null}
        onClose={() => !op.busy && setDraft(null)}
        title={draft?.id ? "Editar endpoint" : "Criar endpoint"}
        kicker="Webhooks"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDraft(null)} disabled={op.busy}>
              Cancelar
            </Button>
            <OperationButton operation={op} onClick={submit}>
              {draft?.id ? "Salvar endpoint" : "Criar endpoint"}
            </OperationButton>
          </>
        }
      >
        {draft && (
          <div className="flex flex-col">
            <OperationFeedback operation={op} className="mb-4" />
            <TextField label="URL" type="url" placeholder="https://erp.suaempresa.com/hooks/atlas" value={draft.url} onChange={(v) => setDraft({ ...draft, url: v })} error={urlError} hint="Precisa aceitar POST com JSON e responder 2xx em até 10 s." autoFocus />
            <TextField label="Descrição" optional placeholder="Ex.: ERP cria pedido quando o negócio é ganho" value={draft.description} onChange={(v) => setDraft({ ...draft, description: v })} />
            <CheckboxGroup label="Eventos" options={webhookEvents} value={draft.events} onValueChange={(v) => setDraft({ ...draft, events: v })} columns={2} selectAll="Todos os eventos" error={eventsError} />
            {editingSecret && (
              <div className="mt-5">
                <p className="m-0 mb-1.5 text-[12.5px] font-medium">Segredo de assinatura</p>
                <div className="flex items-center gap-2 rounded-lg border border-line bg-soft px-3 py-2">
                  <code className="min-w-0 flex-1 break-all font-mono text-[12.5px]">{editingSecret}…</code>
                  <CopyButton value={editingSecret} iconOnly />
                </div>
                <p className="m-0 mt-1.5 text-[12px] text-muted">Confira o cabeçalho Atlas-Signature com este segredo para garantir que a chamada veio da gente.</p>
              </div>
            )}
          </div>
        )}
      </Drawer>

      <ConfirmDialog
        open={removing !== null}
        onClose={() => setRemoving(null)}
        tone="danger"
        title="Excluir este endpoint?"
        description={`${removing?.url ?? ""} deixa de receber eventos na hora. Entregas na fila são descartadas.`}
        confirmLabel="Excluir endpoint"
        onConfirm={() => {
          const before = endpoints;
          setEndpoints((es) => es.filter((e) => e.id !== removing?.id));
          notify("Endpoint excluído", () => setEndpoints(before));
          setRemoving(null);
        }}
      />
    </SettingsShell>
  );
}
