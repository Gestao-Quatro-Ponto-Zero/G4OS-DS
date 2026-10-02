import { AtSign, Briefcase, Check, CheckCheck, CircleDollarSign, FileText, Inbox, MessageSquare, Settings, UserPlus } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import {
  ActionMenu,
  Avatar,
  Button,
  CountBadge,
  Empty,
  Page,
  PageHeading,
  Skeleton,
  Tabs,
  Tooltip,
  cn,
  notify } from "@g4ai/ds";
import { AtlasShell, atlasRoutes } from "./shells/atlas-shell";
import { frameHref, setFrameQuery, useFrameParam } from "./shells/frame-route";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Central de notificações",
  description: "Caixa de entrada com abas (todas, não lidas, menções), grupos por dia, lida/não lida, arquivar e marcar tudo como lido.",
  category: "Aplicação",
  order: 2,
  height: 820,
  concept: {
    goal: "Ver o que pede atenção agora e limpar a caixa rápido, para quem recebe avisos de vários módulos.",
    patterns: [
      "Anatomia A · Lista: cabeçalho fixo com 'Marcar tudo como lido'",
      "Abas Todas / Não lidas / Menções; grupos por dia",
      "Cada aviso abre o registro e marca como lido; arquivar com desfazer",
    ],
    adapt: [
      "Central de avisos de qualquer produto; no celular, item da pílula com contador",
    ],
    avoid: [
      "Notificação que não leva a lugar nenhum",
    ],
  },
} as const;

/* ------------------------------------------------------------------ */
/* Dados de exemplo                                                    */
/* ------------------------------------------------------------------ */

type Kind = "mencao" | "atribuicao" | "comentario" | "pagamento" | "documento" | "convite";
type Note = { id: string; kind: Kind; who?: { name: string; initials: string; tint?: string }; text: ReactNode; context: string; time: string; day: "Hoje" | "Ontem" | "Esta semana"; unread: boolean; href: string };

const icons: Record<Kind, ReactNode> = {
  mencao: <AtSign />,
  atribuicao: <Briefcase />,
  comentario: <MessageSquare />,
  pagamento: <CircleDollarSign />,
  documento: <FileText />,
  convite: <UserPlus />,
};

const initial: Note[] = [
  { id: "1", kind: "mencao", who: { name: "Carla Nogueira", initials: "CN", tint: "#842e20" }, text: <>mencionou você em <b>Proposta Acme Logística</b>: “@Joana consegue revisar o frete até amanhã?”</>, context: "Negócios", time: "há 8 min", day: "Hoje", unread: true, href: frameHref("crm-deal") },
  { id: "2", kind: "atribuicao", who: { name: "Bruno Takeda", initials: "BT", tint: "#184560" }, text: <>atribuiu a você o pedido <b>#4821 · Rede Horizonte</b></>, context: "Pedidos", time: "há 42 min", day: "Hoje", unread: true, href: frameHref("erp-orders") },
  { id: "3", kind: "pagamento", text: <>Fatura <b>NF 1043 · Vértice Saúde</b> foi paga (R$ 12.480,00)</>, context: "Financeiro", time: "10:12", day: "Hoje", unread: true, href: frameHref("fin-receivables") },
  { id: "4", kind: "comentario", who: { name: "Diego Araújo", initials: "DA" }, text: <>comentou em <b>Entrevista · Rafael Moura</b>: “Forte em SQL, fraco em comunicação.”</>, context: "Recrutamento", time: "09:30", day: "Hoje", unread: false, href: frameHref("ats-candidate") },
  { id: "5", kind: "documento", who: { name: "Elisa Monteiro", initials: "EM", tint: "#5f7f6f" }, text: <>enviou <b>contrato-vertice-v3.pdf</b> para assinatura</>, context: "Documentos", time: "17:48", day: "Ontem", unread: true, href: frameHref("app-file-manager", { id: "5" }) },
  { id: "6", kind: "mencao", who: { name: "Ana Lopes", initials: "AL" }, text: <>mencionou você em <b>Reunião de pipeline</b>: “@Joana traz o forecast de outubro.”</>, context: "Agenda", time: "15:02", day: "Ontem", unread: false, href: frameHref("crm-pipeline") },
  { id: "7", kind: "convite", who: { name: "Rafael Queiroz", initials: "RQ", tint: "#031a26" }, text: <>convidou <b>3 pessoas</b> para o workspace da Acme</>, context: "Equipe", time: "seg", day: "Esta semana", unread: false, href: frameHref("settings-team") },
  { id: "8", kind: "pagamento", text: <>Pagamento de <b>Agro Cerrado</b> está 5 dias atrasado</>, context: "Financeiro", time: "seg", day: "Esta semana", unread: false, href: frameHref("fin-receivables") },
];

/* ------------------------------------------------------------------ */

export default function NotificationsBlock() {
  // ?estado=carregando|vazio|erro simula os estados da lista.
  const estado = useFrameParam("estado");
  const [notes, setNotes] = useState(() => (estado === "vazio" ? [] : initial));
  const [tab, setTab] = useState("todas");
  const unread = notes.filter((n) => n.unread).length;
  const mentions = notes.filter((n) => n.kind === "mencao" && n.unread).length;
  const shown = useMemo(() => notes.filter((n) => (tab === "nao-lidas" ? n.unread : tab === "mencoes" ? n.kind === "mencao" : true)), [notes, tab]);
  const days = ["Hoje", "Ontem", "Esta semana"] as const;
  const toggleRead = (id: string) => setNotes((ns) => ns.map((n) => (n.id === id ? { ...n, unread: !n.unread } : n)));
  const mute = (n: Note) => {
    const before = notes;
    setNotes((ns) => ns.filter((x) => x.context !== n.context));
    notify(`Avisos de ${n.context} silenciados`, () => setNotes(before));
  };
  const archive = (id: string) => {
    const before = notes;
    setNotes((ns) => ns.filter((n) => n.id !== id));
    notify("Notificação arquivada", () => setNotes(before));
  };

  return (
    <AtlasShell current={atlasRoutes.notifications}>
      <Page width="reading">
        <div>
          <PageHeading
            title="Notificações"
            description="O que pede sua atenção nos negócios, pedidos e recrutamento."
            actions={
              <>
                <Button size="sm" variant="ghost" href={frameHref("settings-notifications")}>
                  <Settings /> Preferências
                </Button>
                <Button size="sm" variant="ghost" disabled={!unread} onClick={() => { const before = notes; setNotes((ns) => ns.map((n) => ({ ...n, unread: false }))); notify(`${unread} notificações marcadas como lidas`, () => setNotes(before)); }}>
                  <CheckCheck /> Marcar todas como lidas
                </Button>
              </>
            }
          />
          <Tabs
            label="Filtrar notificações"
            className="mt-5 border-b border-line"
            value={tab}
            onChange={setTab}
            items={[
              { id: "todas", label: "Todas" },
              { id: "nao-lidas", label: "Não lidas", count: unread },
              { id: "mencoes", label: "Menções", count: mentions },
            ]}
          />
          {estado === "carregando" ? (
            <div className="mt-6 overflow-hidden rounded-xl border border-line bg-surface" aria-busy aria-label="Carregando notificações">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="flex gap-3 border-b border-line px-4 py-3.5 last:border-b-0">
                  <Skeleton className="h-7 w-7 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3.5 w-4/5" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : estado === "erro" ? (
            <div className="mt-6">
              <Empty title="Não foi possível carregar as notificações" hint="Tente de novo em instantes. Nenhum aviso foi perdido." action={<Button size="sm" onClick={() => setFrameQuery({ estado: undefined })}>Tentar novamente</Button>} />
            </div>
          ) : notes.length === 0 ? (
            <div className="mt-6">
              <Empty icon={<Inbox strokeWidth={1.5} />} title="Nenhuma notificação ainda" hint="Menções, atribuições e pagamentos aparecem aqui. Escolha o que quer receber nas preferências." action={<Button size="sm" variant="ghost" href={frameHref("settings-notifications")}><Settings /> Ajustar preferências</Button>} />
            </div>
          ) : shown.length === 0 ? (
            <div className="mt-6">
              <Empty
                icon={<Inbox strokeWidth={1.5} />}
                title={tab === "nao-lidas" ? "Tudo lido" : "Nenhuma menção"}
                hint={`Nenhuma notificação neste filtro. Há ${notes.length} no total.`}
                action={<Button size="sm" variant="ghost" onClick={() => setTab("todas")}>Limpar filtro</Button>}
              />
            </div>
          ) : (
            days.map((day) => {
              const list = shown.filter((n) => n.day === day);
              if (!list.length) return null;
              return (
                <section key={day} className="mt-6">
                  <h2 className="m-0 mb-2 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.1em] text-muted">
                    {day} <CountBadge count={list.filter((n) => n.unread).length} label="não lidas" />
                  </h2>
                  <ul className="m-0 list-none divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface p-0">
                    {list.map((n) => (
                      <li key={n.id} className={cn("group relative flex gap-3 px-4 py-3.5 transition-colors hover:bg-soft/40", n.unread && "bg-info-soft/20")}>
                        <span className="relative mt-0.5 shrink-0">
                          {n.who ? (
                            <Avatar initials={n.who.initials} tint={n.who.tint} name={n.who.name} size="sm" />
                          ) : (
                            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-soft text-muted ring-1 ring-line [&_svg]:h-3.5 [&_svg]:w-3.5">{icons[n.kind]}</span>
                          )}
                          {n.who && <span className="absolute -bottom-1 -right-1 inline-grid h-4 w-4 place-items-center rounded-full bg-surface text-muted ring-1 ring-line [&_svg]:h-2.5 [&_svg]:w-2.5">{icons[n.kind]}</span>}
                        </span>
                        {/* Link esticado: a linha inteira leva ao registro e marca como lida. */}
                        <a href={n.href} onClick={() => setNotes((ns) => ns.map((x) => (x.id === n.id ? { ...x, unread: false } : x)))} className="absolute inset-0 rounded-none focus-visible:outline-offset-[-2px]" aria-label={`Abrir: ${n.context}`} />
                        <div className="min-w-0 flex-1">
                          <p className={cn("m-0 text-[13.5px] leading-snug [&_b]:font-medium [&_b]:text-ink", n.unread ? "text-ink" : "text-ink-soft")}>
                            {n.who && <span className="font-medium text-ink">{n.who.name} </span>}
                            {n.text}
                          </p>
                          <p className="m-0 mt-1 text-[11.5px] text-muted">
                            {n.context} · {n.time}
                          </p>
                        </div>
                        <div className="relative z-[1] flex shrink-0 items-start gap-1">
                          <Tooltip content={n.unread ? "Marcar como lida" : "Marcar como não lida"}>
                            <button type="button" onClick={() => toggleRead(n.id)} aria-label={n.unread ? "Marcar como lida" : "Marcar como não lida"} className="flex h-7 w-7 items-center justify-center rounded-md text-muted opacity-0 hover:bg-soft hover:text-ink focus-visible:opacity-100 group-hover:opacity-100">
                              <Check className="h-3.5 w-3.5" />
                            </button>
                          </Tooltip>
                          <ActionMenu actions={[{ label: n.unread ? "Marcar como lida" : "Marcar como não lida", onSelect: () => toggleRead(n.id) }, { label: `Silenciar avisos de ${n.context}`, onSelect: () => mute(n) }, { label: "Arquivar", onSelect: () => archive(n.id), separator: true }]} />
                          <span role={n.unread ? "img" : undefined} aria-label={n.unread ? "Não lida" : undefined} className={cn("mt-2.5 h-2 w-2 rounded-full", n.unread ? "bg-blue" : "bg-transparent")} />
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })
          )}
        </div>
      </Page>
    </AtlasShell>
  );
}
