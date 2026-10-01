import { Bell, CalendarDays, Home, Inbox, KanbanSquare, Menu, Users } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Avatar, BottomNav, cn, type NavItem } from "@g4ai/ds";
import { CodeBlock, DocPage, DocSection, Rules, type PageMeta } from "../kit";

export const meta: PageMeta = {
  title: "Navegação no celular",
  group: "Navegação",
  order: 5,
  description: "Três modos para o AppShell abaixo de 768px: gaveta (☰), pílula flutuante embaixo, ou os dois. Escolha pela frequência de uso, não pelo gosto.",
};

const tabs: NavItem[] = [
  { href: "#inicio", label: "Início", icon: Home },
  { href: "#pipeline", label: "Pipeline", icon: KanbanSquare },
  { href: "#agenda", label: "Agenda", icon: CalendarDays, badge: 3 },
  { href: "#caixa", label: "Caixa", icon: Inbox },
];

function Phone({ title, children, top }: { title: string; children: ReactNode; top?: ReactNode }) {
  return (
    <figure className="m-0">
      <div className="relative mx-auto h-[560px] w-[290px] overflow-hidden rounded-[36px] border-[6px] border-ink/85 bg-page shadow-raised">
        <div className="flex h-7 items-center justify-between px-6 text-[10px] font-semibold text-ink">
          <span>9:41</span>
          <span className="h-3 w-14 rounded-full bg-ink/85" />
          <span>100%</span>
        </div>
        {top}
        <div className="space-y-2.5 px-4 pt-3">
          <div className="h-5 w-28 rounded bg-ink/80" />
          <div className="h-3 w-40 rounded bg-line" />
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-line bg-surface p-3">
              <div className="h-3 w-32 rounded bg-line-strong" />
              <div className="mt-2 h-2.5 w-44 rounded bg-line" />
            </div>
          ))}
        </div>
        {children}
      </div>
      <figcaption className="mt-3 text-center text-[12.5px] font-medium">{title}</figcaption>
    </figure>
  );
}

function Header({ burger = true, actions = false }: { burger?: boolean; actions?: boolean }) {
  return (
    <div className="flex h-11 items-center gap-2 border-b border-line bg-surface px-3">
      {burger && (
        <span className="grid h-7 w-7 place-items-center rounded-lg text-ink-soft">
          <Menu className="h-4 w-4" />
        </span>
      )}
      <span className={cn("text-[13px] font-semibold", !burger && "pl-1")}>Acme CRM</span>
      {actions && (
        <span className="ml-auto flex items-center gap-2">
          <Bell className="h-4 w-4 text-muted" />
          <Avatar initials="AL" size="sm" name="Ana Lopes" />
        </span>
      )}
    </div>
  );
}

export default function Page() {
  const [current, setCurrent] = useState("#pipeline");
  const items = tabs.map((t) => ({ ...t }));
  return (
    <DocPage title={meta.title} kicker="Navegação" description={meta.description}>
      <DocSection title="Os três modos" rule="Os exemplos são clicáveis. Na tela real a pílula só aparece abaixo de 768px; acima disso vale a sidebar.">
        <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3" onClickCapture={(e) => {
          const a = (e.target as HTMLElement).closest("a");
          if (a) {
            e.preventDefault();
            setCurrent(a.getAttribute("href") ?? current);
          }
        }}>
          <Phone title='"drawer" · padrão' top={<Header />}>
            <span />
          </Phone>
          <Phone title='"tabbar" · pílula + Mais' top={<Header burger={false} actions />}>
            <BottomNav alwaysVisible className="!absolute" items={items} currentPath={current} more={{ open: false, onToggle: () => undefined }} />
          </Phone>
          <Phone title='"both" · ☰ + pílula' top={<Header actions />}>
            <BottomNav alwaysVisible className="!absolute" items={[...items, { href: "#times", label: "Time", icon: Users }]} currentPath={current} />
          </Phone>
        </div>
      </DocSection>

      <DocSection title="Qual escolher">
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full text-left text-[13px]">
            <thead className="border-b border-line bg-soft/60 text-[12px] text-muted">
              <tr>
                <th className="px-4 py-2.5">Modo</th>
                <th className="px-4 py-2.5">Quando</th>
                <th className="px-4 py-2.5">Exemplos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {[
                ["drawer", "Uso principal no desktop; celular é consulta eventual. Muitas seções com peso parecido.", "ERP, financeiro, configurações, back-office"],
                ["tabbar", "Uso frequente no celular, 3–4 destinos concentram quase tudo. O resto cabe em “Mais”.", "App do vendedor, recrutador em campo, aprovações, portal do cliente"],
                ["both", "Muitas seções, mas 3–4 usadas todo dia. A pílula acelera o dia a dia e o ☰ dá acesso ao resto sem esconder.", "CRM completo, ATS, suporte"],
              ].map(([m, q, e]) => (
                <tr key={m}>
                  <td className="px-4 py-2.5 font-mono text-[12px]">{m}</td>
                  <td className="px-4 py-2.5 text-ink-soft">{q}</td>
                  <td className="px-4 py-2.5 text-muted">{e}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DocSection>

      <DocSection title="Uso">
        <CodeBlock
          code={`const nav = [
  { href: "/", label: "Início", icon: Home },
  { href: "/pipeline", label: "Pipeline", icon: KanbanSquare },
  { href: "/agenda", label: "Agenda", icon: CalendarDays, badge: 3 },
  { href: "/empresas", label: "Empresas", icon: Building2 },
  { href: "/config", label: "Configurações", icon: Settings },
];

<AppShell
  product="Acme CRM"
  mobileNav="both"                  // "drawer" | "tabbar" | "both"
  tabs={nav.slice(0, 4)}            // 3–4 destinos da pílula
  currentPath={pathname}
  headerActions={<NotificationsButton />}
  sidebar={(p) => <Sidebar {...p} product="Acme CRM" groups={[{ label: "Vendas", items: nav }]} currentPath={pathname} />}
>
  {children}
</AppShell>`}
        />
      </DocSection>

      <DocSection title="Regras">
        <Rules
          items={[
            { do: "3 a 4 destinos na pílula, com rótulo sempre visível (ícone sozinho é adivinhação).", dont: "5+ itens espremidos ou ícones sem texto." },
            { do: "Os mesmos destinos e ícones da sidebar: a pessoa reconhece ao trocar de aparelho.", dont: "Uma navegação diferente só para o celular." },
            { do: "Contador só para o que pede ação (tarefas vencidas, não lidas).", dont: "Contador de total (“312 contatos”)." },
            { do: "Ação principal da tela no cabeçalho ou no fim do conteúdo.", dont: "Botão flutuante (FAB) competindo com a pílula." },
            { do: "Conteúdo com respiro inferior: o AppShell já reserva a altura da pílula e da área segura.", dont: "Cards cortados por baixo da barra." },
          ]}
        />
      </DocSection>
    </DocPage>
  );
}
