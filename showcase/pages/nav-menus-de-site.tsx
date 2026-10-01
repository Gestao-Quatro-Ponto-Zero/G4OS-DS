import { BarChart3, BookOpen, Copy, FileDown, LifeBuoy, Newspaper, Scissors, Users, Workflow } from "lucide-react";
import { useState } from "react";
import { Menubar, NavigationMenu, ProductMark, notify } from "@g4ai/ds";
import { Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";

export const meta: PageMeta = {
  title: "Menus de site e de documento",
  group: "Navegação",
  order: 40,
  description: "NavigationMenu para o topo de sites públicos, portais e centrais de ajuda: links diretos e painéis com links descritos. Menubar para apps de documento (editor, planilha, construtor).",
};

export default function Page() {
  const [grade, setGrade] = useState(true);
  const [visao, setVisao] = useState("normal");
  const ok = (msg: string) => () => notify(msg);
  return (
    <DocPage title={meta.title} description={meta.description} kicker={meta.group}>
      <DocSection title="NavigationMenu" rule="Topo de site público, portal do cliente ou central de ajuda. Painel com até 8 links, cada um com título e uma linha de descrição. App de gestão: Sidebar/AppShell. No celular, troque por um botão que abre Sheet.">
        <Demo
          bare
          code={`<NavigationMenu
  label="Navegação principal"
  items={[
    { label: "Produto", links: [
      { title: "Pipeline", description: "Negócios por etapa, com previsão.", href: "/produto/pipeline", icon: <Workflow /> },
      { title: "Relatórios", description: "Painéis prontos e exportação.", href: "/produto/relatorios", icon: <BarChart3 /> },
    ] },
    { label: "Recursos", links: [...] },
    { label: "Preços", href: "/precos" },
  ]}
/>`}
        >
          <div className="flex min-h-[300px] items-start justify-between gap-4 rounded-xl border border-line bg-page px-4 py-3">
            <div className="flex items-center gap-6">
              <span className="flex items-center gap-2 text-[14px] font-semibold"><ProductMark size={24} /> Atlas CRM</span>
              <NavigationMenu
                label="Navegação principal"
                className="hidden md:block"
                items={[
                  {
                    label: "Produto",
                    links: [
                      { title: "Pipeline", description: "Negócios por etapa, com previsão de receita.", href: "#/p/nav-menus-de-site", icon: <Workflow /> },
                      { title: "Relatórios", description: "Painéis prontos e exportação agendada.", href: "#/p/nav-menus-de-site", icon: <BarChart3 /> },
                      { title: "Equipes", description: "Metas, territórios e permissões.", href: "#/p/nav-menus-de-site", icon: <Users /> },
                    ],
                  },
                  {
                    label: "Recursos",
                    links: [
                      { title: "Central de ajuda", description: "Guias passo a passo.", href: "#/p/nav-menus-de-site", icon: <LifeBuoy /> },
                      { title: "Blog", description: "Vendas B2B na prática.", href: "#/p/nav-menus-de-site", icon: <Newspaper /> },
                      { title: "Documentação da API", description: "Integre com seu ERP.", href: "#/p/nav-menus-de-site", icon: <BookOpen /> },
                    ],
                  },
                  { label: "Preços", href: "#/p/nav-menus-de-site" },
                  { label: "Clientes", href: "#/p/nav-menus-de-site" },
                ]}
              />
            </div>
          </div>
        </Demo>
      </DocSection>

      <DocSection title="Menubar" rule="Só em apps de documento com muitas ações (editor de proposta, planilha, construtor de formulário). ←/→ alternam os menus abertos; itens no mesmo formato do Menu (atalhos, marcações, escolha única, submenus).">
        <Demo
          code={`<Menubar
  label="Menu do editor"
  menus={[
    { label: "Arquivo", items: [
      { label: "Duplicar proposta", icon: <Copy />, shortcut: "⌘D", onSelect: duplicar },
      { label: "Exportar", icon: <FileDown />, type: "submenu", items: [{ label: "PDF" }, { label: "Word" }] },
    ] },
    { label: "Editar", items: [...] },
    { label: "Ver", items: [{ type: "checkbox", label: "Grade", checked: grade, onCheckedChange: setGrade }] },
  ]}
/>`}
        >
          <Menubar
            label="Menu do editor de proposta"
            className="w-fit"
            menus={[
              {
                label: "Arquivo",
                items: [
                  { label: "Duplicar proposta", icon: <Copy />, shortcut: "⌘D", onSelect: ok("Proposta duplicada") },
                  {
                    type: "submenu",
                    label: "Exportar",
                    icon: <FileDown />,
                    items: [
                      { label: "PDF", onSelect: ok("PDF exportado") },
                      { label: "Word (.docx)", onSelect: ok("Arquivo Word exportado") },
                    ],
                  },
                  { type: "separator" },
                  { label: "Arquivar proposta", tone: "danger", onSelect: ok("Proposta arquivada") },
                ],
              },
              {
                label: "Editar",
                items: [
                  { label: "Recortar", icon: <Scissors />, shortcut: "⌘X" },
                  { label: "Copiar", icon: <Copy />, shortcut: "⌘C" },
                  { type: "separator" },
                  { label: "Localizar e substituir", shortcut: "⌘⇧H" },
                ],
              },
              {
                label: "Ver",
                items: [
                  { type: "checkbox", label: "Mostrar grade", checked: grade, onCheckedChange: setGrade },
                  { type: "separator" },
                  { type: "label", label: "Densidade" },
                  {
                    type: "radio",
                    value: visao,
                    onValueChange: setVisao,
                    options: [
                      { value: "compacta", label: "Compacta" },
                      { value: "normal", label: "Normal" },
                      { value: "ampla", label: "Ampla" },
                    ],
                  },
                ],
              },
              { label: "Ajuda", items: [{ label: "Atalhos de teclado", shortcut: "?" }] },
            ]}
          />
        </Demo>
      </DocSection>

      <DocSection title="Regras">
        <Rules
          items={[
            { do: "NavigationMenu com poucos itens no topo (até 6) e painéis curtos.", dont: "NavigationMenu como navegação principal de um app de gestão." },
            { do: "Menubar só quando as ações são de documento e numerosas.", dont: "Menubar em CRM/ATS/ERP: ações ficam em botões + ActionMenu, perto do que afetam." },
          ]}
        />
      </DocSection>

      <DocSection title="Props">
        <PropsTable
          rows={[
            ["NavigationMenu · items", "NavigationMenuEntry[]", "—", "{ label, href } ou { label, links, feature? }."],
            ["NavigationMenu · label", "string", "—", "Nome acessível da navegação."],
            ["Menubar · menus", "{ label, items: MenuEntry[], disabled? }[]", "—", "Mesmo formato de itens do Menu."],
            ["Menubar · label", "string", "—", "Nome acessível da barra."],
          ]}
        />
      </DocSection>
    </DocPage>
  );
}
