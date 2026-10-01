import { Archive, ArrowUpDown, Columns3, Copy, Download, FileSpreadsheet, FileText, Link2, MoreHorizontal, Pencil, Share2, Star, Tag, Trash2 } from "lucide-react";
import { useState } from "react";
import { ActionMenu, ContextMenu, Menu, notify, type MenuEntry } from "@g4ai/ds";
import { Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";

export const meta: PageMeta = {
  title: "Menus",
  group: "Sobreposições",
  order: 50,
  description: "ActionMenu para o “⋯” de linha e card. Menu para listas ricas: grupos, atalhos, marcações, escolha única e submenus. ContextMenu como atalho de clique direito.",
};

export default function Page() {
  const [cols, setCols] = useState({ etapa: true, valor: true, dono: true, fonte: false });
  const [sort, setSort] = useState("recentes");
  const n = (m: string) => () => notify(m, undefined, "info");

  const viewItems: MenuEntry[] = [
    { type: "label", label: "Ordenar por" },
    { type: "radio", value: sort, onValueChange: setSort, options: [{ value: "recentes", label: "Mais recentes" }, { value: "valor", label: "Maior valor" }, { value: "fechamento", label: "Data de fechamento" }] },
    { type: "separator" },
    { type: "label", label: "Colunas visíveis" },
    { type: "checkbox", label: "Etapa", checked: cols.etapa, onCheckedChange: (v) => setCols({ ...cols, etapa: v }) },
    { type: "checkbox", label: "Valor", checked: cols.valor, onCheckedChange: (v) => setCols({ ...cols, valor: v }) },
    { type: "checkbox", label: "Responsável", checked: cols.dono, onCheckedChange: (v) => setCols({ ...cols, dono: v }) },
    { type: "checkbox", label: "Origem do lead", checked: cols.fonte, onCheckedChange: (v) => setCols({ ...cols, fonte: v }) },
  ];

  const recordItems: MenuEntry[] = [
    { label: "Editar", icon: <Pencil />, shortcut: "E", onSelect: n("Editar") },
    { label: "Duplicar", icon: <Copy />, shortcut: "⌘D", onSelect: n("Duplicado") },
    { label: "Favoritar", icon: <Star />, onSelect: n("Favoritado") },
    {
      type: "submenu",
      label: "Mover etiqueta",
      icon: <Tag />,
      items: [
        { label: "Prioritário", onSelect: n("Etiqueta: Prioritário") },
        { label: "Renovação", onSelect: n("Etiqueta: Renovação") },
        { label: "Expansão", onSelect: n("Etiqueta: Expansão") },
      ],
    },
    {
      type: "submenu",
      label: "Exportar",
      icon: <Download />,
      items: [
        { label: "PDF", icon: <FileText />, onSelect: n("Exportando PDF") },
        { label: "Planilha (.xlsx)", icon: <FileSpreadsheet />, onSelect: n("Exportando planilha") },
      ],
    },
    { label: "Copiar link", icon: <Link2 />, onSelect: n("Link copiado") },
    { type: "separator" },
    { label: "Arquivar", icon: <Archive />, onSelect: n("Arquivado") },
    { label: "Excluir", icon: <Trash2 />, tone: "danger", onSelect: n("Excluir pede confirmação") },
  ];

  return (
    <DocPage title={meta.title} description={meta.description} kicker={meta.group}>
      <DocSection title="ActionMenu: o “⋯”" rule="Ações secundárias de uma linha ou card. A principal fica visível como botão; destrutiva por último, com separador.">
        <Demo code={`<ActionMenu actions={[{ label: "Editar", icon: <Pencil /> }, { label: "Excluir", tone: "danger", separator: true }]} />`}>
          <ActionMenu actions={[{ label: "Editar", icon: <Pencil /> }, { label: "Compartilhar", icon: <Share2 /> }, { label: "Excluir", icon: <Trash2 />, tone: "danger", separator: true }]} />
        </Demo>
      </DocSection>

      <DocSection title="Menu: lista rica" rule="Quando o menu tem estrutura: rótulos de grupo, escolha única (radio), marcações (checkbox, não fecha ao clicar), submenus e atalhos.">
        <Demo
          code={`<Menu label="Exibição" trigger={<><Columns3 /> Exibição</>} items={[
  { type: "label", label: "Ordenar por" },
  { type: "radio", value: sort, onValueChange: setSort, options: [...] },
  { type: "separator" },
  { type: "checkbox", label: "Valor", checked, onCheckedChange },
]} />`}
        >
          <Menu label="Exibição" trigger={<><Columns3 /> Exibição</>} items={viewItems} />
          <Menu label="Ações do negócio" trigger={<><MoreHorizontal /> Ações</>} items={recordItems} align="end" />
          <span className="text-[12px] text-muted"><ArrowUpDown className="mr-1 inline h-3 w-3" />Ordenação: {sort}</span>
        </Demo>
      </DocSection>

      <DocSection title="ContextMenu: clique direito" rule="Atalho para quem já conhece o produto. As mesmas ações precisam existir num menu visível (⋯) — clique direito não é descobrível, e no toque vira toque longo.">
        <Demo code={`<ContextMenu items={recordItems}>
  <div>…linha ou card…</div>
</ContextMenu>`} className="block">
          <ContextMenu items={recordItems} className="block">
            <div className="flex items-center justify-between rounded-xl border border-dashed border-line-strong bg-soft/50 px-5 py-8 text-center">
              <div className="mx-auto">
                <p className="m-0 text-[13.5px] font-medium">Clique com o botão direito aqui</p>
                <p className="m-0 mt-1 text-[12.5px] text-muted">Negócio · Acme Logística · R$ 48.000</p>
              </div>
            </div>
          </ContextMenu>
        </Demo>
        <PropsTable
          rows={[
            ["{ label, icon?, shortcut?, onSelect?, href?, tone? }", "item", "—", "Ação. tone: 'danger' pinta de rosa."],
            ["{ type: 'checkbox', label, checked, onCheckedChange }", "marcação", "—", "Não fecha o menu ao clicar."],
            ["{ type: 'radio', value, onValueChange, options }", "escolha única", "—", "Grupo de opções exclusivas."],
            ["{ type: 'submenu', label, items }", "submenu", "—", "Um nível; evite dois."],
            ["{ type: 'label' | 'separator' }", "estrutura", "—", "Rótulo de grupo e divisória."],
          ]}
        />
      </DocSection>

      <DocSection title="Regras">
        <Rules
          items={[
            { do: "Até ~10 itens; agrupe com rótulos e separadores.", dont: "Menu com 25 itens soltos." },
            { do: "Submenu de um nível só.", dont: "Submenu dentro de submenu." },
            { do: "Destrutiva por último, depois de separador, e com confirmação.", dont: "“Excluir” como primeiro item." },
          ]}
        />
      </DocSection>
    </DocPage>
  );
}
