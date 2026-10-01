import { useState } from "react";
import { Announcement, Avatar, Button, NotificationCenter, Tour, useTour, type NotificationItem } from "@g4ai/ds";
import { Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";

export const meta: PageMeta = {
  title: "Notificações, novidades e tour",
  group: "Feedback e estados",
  order: 6,
  description: "NotificationCenter (sino com caixa de notificações), Announcement (pílula de novidade) e Tour (balões ancorados a elementos reais para apresentar um recurso novo).",
};

const initial: NotificationItem[] = [
  { id: "1", title: "Ana Lopes mencionou você em Acme · Renovação", body: "“@João consegue revisar a proposta até amanhã?”", time: "há 5 min", unread: true, media: <Avatar initials="AL" name="Ana Lopes" size="sm" /> },
  { id: "2", title: "Proposta aprovada pela Hospital São Lucas", body: "R$ 104.160 · Plano Pro", time: "há 2 h", unread: true },
  { id: "3", title: "3 tarefas vencem hoje", time: "ontem" },
  { id: "4", title: "Relatório semanal de pipeline pronto", time: "segunda" },
];

function CenterDemo() {
  const [items, setItems] = useState(initial);
  const read = (id: string) => setItems((all) => all.map((n) => (n.id === id ? { ...n, unread: false } : n)));
  return (
    <div className="flex items-center justify-end gap-2 rounded-xl border border-line bg-surface px-3 py-2">
      <span className="mr-auto text-[13px] font-medium">Pipeline</span>
      <NotificationCenter
        items={items.map((n) => ({ ...n, onSelect: () => read(n.id) }))}
        onMarkAllRead={() => setItems((all) => all.map((n) => ({ ...n, unread: false })))}
        footer={{ label: "Ver todas", href: "#/frame/app-notifications" }}
      />
    </div>
  );
}

function TourDemo() {
  const tour = useTour("showcase-relatorios", { autoStart: false });
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button id="tour-agendar" size="sm" variant="ghost">
          Agendar envio
        </Button>
        <Button id="tour-filtros" size="sm" variant="ghost">
          Filtros salvos
        </Button>
        <Button id="tour-exportar" size="sm" variant="ghost">
          Exportar
        </Button>
        <span className="flex-1" />
        <Button size="sm" onClick={tour.start}>
          Ver tour
        </Button>
      </div>
      <Tour
        open={tour.open}
        onOpenChange={tour.onOpenChange}
        steps={[
          { target: "#tour-agendar", title: "Relatórios agendados", body: "Escolha dia e hora e o relatório chega por e-mail para quem você indicar." },
          { target: "#tour-filtros", title: "Filtros salvos", body: "Salve a combinação de filtros e volte a ela com um clique." },
          { target: "#tour-exportar", title: "Exportar", body: "CSV ou XLSX com as colunas visíveis, na ordem da tabela." },
        ]}
      />
    </div>
  );
}

export default function Page() {
  return (
    <DocPage title={meta.title} kicker="Feedback e estados" description={meta.description}>
      <DocSection title="NotificationCenter" rule="Ponto só quando há não lida (nunca o total). “Marcar todas como lidas” só quando há o que marcar; filtro Todas/Não lidas a partir de 8 itens.">
        <Demo
          code={`<NotificationCenter
  items={notificacoes}           // { id, title, body?, time, unread?, media?, href?, onSelect? }
  onMarkAllRead={marcarTodas}
  footer={{ label: "Ver todas", href: "/notificacoes" }}
/>`}
        >
          <CenterDemo />
        </Demo>
      </DocSection>

      <DocSection title="Announcement" rule="Uma novidade por vez, levando ao recurso ou ao changelog. Some quando a pessoa já viu.">
        <Demo code={`<Announcement href="/novidades/relatorios">Relatórios agendados por e-mail</Announcement>`} className="flex flex-wrap items-center gap-3">
          <Announcement href="#/p/fb-notificacoes-e-tour">Relatórios agendados por e-mail</Announcement>
          <Announcement tag="Beta">Agente de follow-up</Announcement>
        </Demo>
      </DocSection>

      <DocSection title="Tour" rule="3–5 etapas para apresentar um recurso novo, ancoradas nos elementos reais. Esc ou “Pular” fecha; ←/→ navegam; o tour não volta sozinho depois de visto (useTour guarda por chave).">
        <Demo
          code={`const tour = useTour("relatorios-v2");   // abre sozinho na primeira visita
<Tour open={tour.open} onOpenChange={tour.onOpenChange} steps={[
  { target: "#agendar", title: "Relatórios agendados", body: "…" },
  { target: exportRef, title: "Exportar", body: "…", side: "left" },
]} />`}
        >
          <TourDemo />
        </Demo>
        <PropsTable
          rows={[
            ["steps", "TourStep[]", "—", "target (seletor ou ref), title, body, side. Alvo ausente na tela é pulado."],
            ["open / onOpenChange", "boolean / (open) => void", "—", "Controle; com useTour(chave), fechar marca como visto."],
            ["onFinish", "() => void", "—", "Chamado ao concluir a última etapa."],
          ]}
        />
      </DocSection>

      <DocSection title="Regras">
        <Rules
          items={[
            { do: "Notificação diz quem fez o quê e onde (“Ana mencionou você em Acme · Renovação”).", dont: "“Você tem uma nova notificação.”" },
            { do: "Tour para um recurso novo, curto, que pode ser pulado.", dont: "Tour do app inteiro na primeira entrada; se precisa de tour, o rótulo provavelmente precisa melhorar." },
          ]}
        />
      </DocSection>
    </DocPage>
  );
}
