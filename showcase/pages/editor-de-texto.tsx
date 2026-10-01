import { Wand2 } from "lucide-react";
import { useState } from "react";
import { RichTextEditor, RichTextToolbar, richTextContentClass } from "@g4os/ds";
import { CodeBlock, Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";

export const meta: PageMeta = {
  title: "Editor de texto rico",
  group: "Formulários",
  order: 50,
  description: "Editor leve para instruções, notas e descrições: toolbar com estados ativos, atalhos de markdown, checklist e um espaço para “Melhorar com IA”.",
};

const initial = `<h2>Passos</h2><ol><li>Buscar o artigo completo</li><li>Extrair as 3 ideias principais</li></ol><ul data-checklist=""><li data-checked="">Revisar o tom</li><li>Citar a fonte</li></ul>`;

export default function Page() {
  const [html, setHtml] = useState(initial);
  return (
    <DocPage title={meta.title} kicker="Formulários" description={meta.description}>
      <DocSection
        title="RichTextEditor"
        rule="Digite # + espaço para título, - para lista, 1. para lista numerada, [] para checklist, > para citação. ⌘B, ⌘I, ⌘K (link). Clique no quadradinho marca o item."
      >
        <Demo
          bare
          code={`const [html, setHtml] = useState("<p>…</p>");

<RichTextEditor
  label="Instruções do agente"
  value={html}
  onChange={setHtml}
  aside={<button onClick={melhorar}><Wand2 /> Melhorar</button>}
/>`}
        >
          <RichTextEditor
            label="Exemplo de editor"
            value={html}
            onChange={setHtml}
            aside={
              <button type="button" onMouseDown={(e) => e.preventDefault()} className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[12.5px] font-medium text-ink-soft hover:bg-soft">
                <Wand2 className="h-3.5 w-3.5" /> Melhorar
              </button>
            }
          />
        </Demo>
        <Demo title="Valor (HTML)" bare>
          <CodeBlock code={html} maxHeight={160} />
        </Demo>
        <PropsTable
          rows={[
            ["value / onChange", "string (HTML)", "—", "Controlado. O DOM só é reescrito quando o valor muda de fora."],
            ["label", "string", "—", "Rótulo acessível do campo"],
            ["tools", "RichTextTool[][]", "todos", "Grupos de botões (cabeçalho, ênfase, alinhamento, listas, inserções)"],
            ["aside", "ReactNode", "—", "Ação à direita do toolbar (ex.: Melhorar com IA)"],
            ["minHeight · readOnly", "number · boolean", "160 · false", ""],
          ]}
        />
      </DocSection>
      <DocSection title="Só a barra de ferramentas" rule="Use RichTextToolbar com o seu editor (TipTap, Lexical): passe onCommand e o estado ativo. Mesmo visual, motor de produção.">
        <Demo bare code={`<RichTextToolbar onCommand={(t, v) => editor.chain().focus().run(t, v)} active={{ bold: editor.isActive("bold") }} />`}>
          <div className="overflow-hidden rounded-xl border border-line bg-surface">
            <RichTextToolbar onCommand={() => undefined} active={{ bold: true, bullet: true, block: "h2" }} />
            <div className={`px-4 py-3 ${richTextContentClass}`}>
              <h2>Leitura</h2>
              <p>
                Conteúdo com o mesmo estilo do editor via <code>richTextContentClass</code>.
              </p>
            </div>
          </div>
        </Demo>
      </DocSection>
      <DocSection title="Limites (seja honesto com o produto)">
        <Rules
          items={[
            { do: "Usar para textos curtos e médios: instruções, notas, descrições, comentários.", dont: "Usar como editor de documentos longos ou colaborativos." },
            { do: "Para documentos de produção, TipTap/ProseMirror + RichTextToolbar (receita em docs/padroes/editor-de-texto.md).", dont: "Salvar o HTML sem sanitizar quando ele for exibido para outras pessoas." },
          ]}
        />
      </DocSection>
    </DocPage>
  );
}
