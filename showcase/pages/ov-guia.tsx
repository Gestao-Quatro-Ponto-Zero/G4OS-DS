import { DocPage, DocSection, Rules, type PageMeta } from "../kit";

export const meta: PageMeta = {
  title: "Qual superfície usar",
  group: "Sobreposições",
  order: 10,
  description: "Guia de decisão entre tooltip, popover, hover card, menu, modal, confirmação, sheet, drawer e página. Escolha pela tarefa, não pela aparência.",
};

const rows: [string, string, string, string][] = [
  ["Tooltip", "Nomear um ícone, mostrar atalho", "Hover/foco", "Texto curto. Nada clicável."],
  ["HoverCard", "Prévia de pessoa/empresa num link", "Hover no link", "Complementar; tudo existe na página."],
  ["Popover", "Explicar um número, mini-formulário (1–2 campos)", "Clique", "Fecha ao clicar fora."],
  ["Menu / ActionMenu", "Escolher uma ação ou opção", "Clique", "Até ~10 itens, submenus de 1 nível."],
  ["ContextMenu", "Atalho de poder (clique direito)", "Clique direito", "Sempre duplicado num menu visível."],
  ["ConfirmDialog", "Ação destrutiva ou irreversível", "Ação", "Pergunta com o objeto; botão com o verbo."],
  ["Modal", "Decisão curta, poucos campos, prévia", "Ação", "Até ~5 campos. Não rola muito."],
  ["Sheet", "Filtros, detalhe rápido, carrinho, ajuda", "Ação", "Leve; vira folha inferior no celular."],
  ["Drawer", "Editar registro sem perder a lista", "Abrir registro", "Formulário longo, 500px, nunca abre outro drawer."],
  ["CommandPalette", "Ir a qualquer lugar / agir pelo teclado", "⌘K", "Tudo nela também existe na interface."],
  ["Página", "Trabalho longo, algo que se compartilha por link", "Navegação", "Na dúvida entre drawer e página: página."],
];

export default function Page() {
  return (
    <DocPage title={meta.title} description={meta.description} kicker={meta.group}>
      <DocSection title="Tabela de decisão">
        <div className="overflow-x-auto rounded-xl border border-line bg-surface">
          <table className="w-full min-w-[720px] text-left text-[13px]">
            <thead className="border-b border-line bg-soft/60 text-[12px] text-muted">
              <tr>
                <th className="px-4 py-2.5">Superfície</th>
                <th className="px-4 py-2.5">Quando</th>
                <th className="px-4 py-2.5">Abre com</th>
                <th className="px-4 py-2.5">Limite</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map(([a, b, c, d]) => (
                <tr key={a}>
                  <td className="whitespace-nowrap px-4 py-2.5 font-medium">{a}</td>
                  <td className="px-4 py-2.5 text-ink-soft">{b}</td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-muted">{c}</td>
                  <td className="px-4 py-2.5 text-muted">{d}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DocSection>

      <DocSection title="Perguntas na ordem" rule="Responda de cima para baixo; a primeira resposta “sim” escolhe.">
        <ol className="m-0 space-y-2.5 pl-5 text-[13.5px] leading-relaxed text-ink-soft marker:font-semibold marker:text-accent-deep">
          <li><strong className="text-ink">A ação apaga ou envia algo sem volta?</strong> → ConfirmDialog (ou Desfazer no toast, se houver inversa segura).</li>
          <li><strong className="text-ink">É só o nome de um ícone?</strong> → Tooltip.</li>
          <li><strong className="text-ink">A pessoa vai editar vários campos de um registro?</strong> → Drawer (ou página, se for longo e compartilhável).</li>
          <li><strong className="text-ink">É uma decisão com até ~5 campos?</strong> → Modal.</li>
          <li><strong className="text-ink">Filtrar, consultar um detalhe, ler ajuda sem sair da tela?</strong> → Sheet.</li>
          <li><strong className="text-ink">Escolher entre ações?</strong> → Menu.</li>
          <li><strong className="text-ink">Explicar algo que está na tela?</strong> → Popover.</li>
        </ol>
      </DocSection>

      <DocSection title="Regras gerais">
        <Rules
          items={[
            { do: "Uma sobreposição por vez. De um drawer, abra modal ou navegue.", dont: "Drawer que abre outro drawer; modal sobre modal." },
            { do: "Esc fecha, foco volta para o gatilho.", dont: "Prender a pessoa sem botão de fechar visível." },
            { do: "Formulário não se perde ao clicar fora por engano (Drawer).", dont: "Modal com 20 campos que fecha no clique do backdrop." },
            { do: "No celular, sheets e menus viram folha inferior.", dont: "Popover minúsculo preso no canto de uma tela de 390px." },
          ]}
        />
      </DocSection>
    </DocPage>
  );
}
