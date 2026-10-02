import { ArrowLeft, ArrowRight, BookOpen, FileText, Search, Undo2 } from "lucide-react";
import { useState } from "react";
import { AppShell, Callout, CommandPalette, IconButton, Page, PageHeading, SectionNav, Sidebar, useCommandShortcut, type Command, type NavSection, type NavSubItem } from "@g4ai/ds";
import { frameHref, goTo, useFrameParam } from "./shells/frame-route";

export const meta = {
  title: "Central de ajuda (navegação de seções)",
  description:
    "Documentação com muitas páginas: SectionNav na sidebar com seções, subitens na linha-guia, terceiro nível em Relatórios e API, filtro fixo no topo, item ativo sempre visível e anterior/próximo no fim do artigo.",
  category: "Aplicação",
  order: 11,
  height: 820,
  concept: {
    goal: "Achar e ler um artigo entre dezenas sem perder o lugar na árvore de seções.",
    patterns: [
      "Anatomia Público/leitura: Page width=\"reading\" com artigo; navegação longa na Sidebar via `nav={<SectionNav/>}`",
      "SectionNav: só texto, títulos de seção, subitens na linha-guia, até 2 níveis abaixo da seção",
      "Filtro no topo (sem acento, sem caixa) que mantém o caminho até o item encontrado",
      "Item ativo rola para dentro da coluna (só a coluna, não a página)",
      "Anterior/próximo no pé do artigo seguindo a ordem da árvore",
    ],
    adapt: [
      "Central de ajuda do produto, base de conhecimento interna, manual de processos",
      "Configurações com 20+ páginas (Conta, Equipe, Segurança, Faturamento, Integrações…)",
    ],
    avoid: [
      "Ícone em cada item: em navegação longa, ícone vira ruído",
      "Mais de 3 níveis: quebre em seções ou páginas com abas",
      "Sidebar de app (com ícones) para documentação com 30 itens: use SectionNav",
    ],
  },
} as const;

const SLUG = "app-help-center";
const it = (path: string, label: string, items?: NavSubItem[]): NavSubItem => ({ href: frameHref(SLUG, { p: path }), match: `/${path}`, label, items });

const sections: NavSection[] = [
  { label: "Primeiros passos", items: [it("inicio/bem-vindo", "Bem-vindo"), it("inicio/convidar", "Convidar o time"), it("inicio/importar", "Importar dados")] },
  {
    label: "Usando o app",
    items: [
      it("uso/pipeline", "Pipeline de vendas"),
      it("uso/contatos", "Contatos e empresas"),
      it("uso/tarefas", "Tarefas e lembretes"),
      it("uso/relatorios", "Relatórios", [it("uso/relatorios/personalizar", "Personalizar colunas"), it("uso/relatorios/agendar", "Agendar envio por e-mail")]),
    ],
  },
  {
    label: "Integrações",
    items: [
      it("integracoes/slack", "Slack"),
      it("integracoes/google", "Google Agenda"),
      it("integracoes/whatsapp", "WhatsApp Business"),
      it("integracoes/api", "API", [it("integracoes/api/autenticacao", "Autenticação"), it("integracoes/api/webhooks", "Webhooks"), it("integracoes/api/limites", "Limites de uso")]),
    ],
  },
  { label: "Conta e faturamento", items: [it("conta/planos", "Planos e preços"), it("conta/notas", "Notas fiscais"), it("conta/cancelar", "Cancelar a assinatura")] },
  { label: "Segurança e privacidade", items: [it("seguranca/sso", "Login único (SSO)"), it("seguranca/permissoes", "Permissões"), it("seguranca/lgpd", "LGPD e dados pessoais")] },
];

/** Ordem de leitura (para anterior/próximo). */
const flat: { item: NavSubItem; section: string }[] = [];
const walk = (list: NavSubItem[], section: string) =>
  list.forEach((x) => {
    flat.push({ item: x, section });
    if (x.items) walk(x.items, section);
  });
sections.forEach((s) => walk(s.items, s.label));

/** Busca da ajuda: todos os artigos, agrupados pela seção (sem acento, sem caixa). */
const articleCommands: Command[] = flat.map(({ item, section }) => ({ id: item.match ?? item.href, group: section, label: item.label, icon: <FileText />, onSelect: () => goTo(item.href) }));

export default function HelpCenterBlock() {
  const [searchOpen, setSearchOpen] = useState(false);
  useCommandShortcut(() => setSearchOpen(true));
  const p = useFrameParam("p", "inicio/bem-vindo");
  const path = `/${p}`;
  const index = Math.max(0, flat.findIndex((f) => f.item.match === path));
  const current = flat[index];
  const prev = flat[index - 1];
  const next = flat[index + 1];
  return (
    <AppShell
      product="Ajuda Acme"
      currentPath={path}
      headerActions={
        <>
          <IconButton label="Buscar na ajuda" onClick={() => setSearchOpen(true)}>
            <Search />
          </IconButton>
          <IconButton label="Voltar ao Atlas" onClick={() => goTo(frameHref("onboarding-checklist"))}>
            <Undo2 />
          </IconButton>
        </>
      }
      sidebar={({ mobileOpen, close }) => (
        <Sidebar
          product="Ajuda Acme"
          workspace="Central de ajuda"
          mark={
            <span aria-hidden className="grid h-7 w-7 place-items-center rounded-lg bg-primary text-on-primary">
              <BookOpen className="h-4 w-4" />
            </span>
          }
          currentPath={path}
          mobileOpen={mobileOpen}
          nav={<SectionNav sections={sections} currentPath={path} search searchPlaceholder="Filtrar artigos…" label="Artigos" onNavigate={close} />}
        />
      )}
    >
      <Page width="reading">
        <PageHeading title={current.item.label} description={current.section} />
        <article className="space-y-4 text-[14px] leading-relaxed text-ink-soft">
          <p className="m-0">
            Este artigo explica <strong className="font-medium text-ink">{current.item.label.toLowerCase()}</strong> passo a passo. Use o filtro à esquerda para achar outro assunto: ele ignora acentos e mantém a seção de
            cada resultado.
          </p>
          <Callout tone="info" title="Dica">
            No celular, o menu ☰ abre as mesmas seções. Ao tocar num artigo, o menu fecha sozinho.
          </Callout>
          <h2 className="m-0 pt-2 text-[18px] font-semibold text-ink">Antes de começar</h2>
          <p className="m-0">Você precisa ser administrador do workspace ou ter a permissão “Gerenciar configurações”. Mudanças valem para todo o time na hora.</p>
          <h2 className="m-0 pt-2 text-[18px] font-semibold text-ink">Passo a passo</h2>
          <ol className="m-0 list-decimal space-y-1.5 pl-5">
            <li>Abra Configurações no menu da conta.</li>
            <li>Escolha a seção correspondente e revise os campos.</li>
            <li>
              Salve. O histórico fica em{" "}
              <a href={frameHref("settings-audit-log")} className="font-medium text-ink underline underline-offset-2">
                Configurações › Log de auditoria
              </a>
              .
            </li>
          </ol>
        </article>
        <nav aria-label="Artigos vizinhos" className="mt-10 grid gap-3 border-t border-line pt-6 sm:grid-cols-2">
          {prev ? (
            <a href={prev.item.href} className="flex flex-col rounded-xl border border-line bg-surface p-4 hover:border-line-strong">
              <span className="flex items-center gap-1 text-[12px] text-muted">
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> Anterior
              </span>
              <span className="mt-1 text-[14px] font-medium text-ink">{prev.item.label}</span>
            </a>
          ) : (
            <span />
          )}
          {next && (
            <a href={next.item.href} className="flex flex-col items-end rounded-xl border border-line bg-surface p-4 text-right hover:border-line-strong">
              <span className="flex items-center gap-1 text-[12px] text-muted">
                Próximo <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </span>
              <span className="mt-1 text-[14px] font-medium text-ink">{next.item.label}</span>
            </a>
          )}
        </nav>
      </Page>
      <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} commands={articleCommands} placeholder="Buscar artigos da ajuda…" />
    </AppShell>
  );
}
