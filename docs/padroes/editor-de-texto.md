# Editor de texto rico

`RichTextEditor` é **leve**: `contentEditable` + comandos do navegador, valor em HTML. Serve para instruções de agente, notas de registro, descrições e comentários.

- Atalhos no início da linha: `# `, `## `, `### `, `- `, `1. `, `[] ` (checklist), `> `, ` ``` `. ⌘B, ⌘I, ⌘K (link).
- `aside` recebe a ação de IA ("Melhorar"). A IA propõe; a pessoa revê antes de salvar/publicar.
- Sanitize o HTML no servidor antes de mostrar para outras pessoas (ex.: DOMPurify).

## Quando trocar por TipTap

Documentos longos, colaboração em tempo real, menções, comentários ancorados, schema próprio. Mantenha o visual do DS:

```tsx
const editor = useEditor({ extensions: [StarterKit, TaskList, TaskItem, Highlight, Link, Table] });
<RichTextToolbar
  active={{ bold: editor.isActive("bold"), italic: editor.isActive("italic"), bullet: editor.isActive("bulletList"), block: editor.isActive("heading", { level: 1 }) ? "h1" : "p" }}
  onCommand={(tool, v) => {
    const c = editor.chain().focus();
    ({ bold: () => c.toggleBold(), italic: () => c.toggleItalic(), bullet: () => c.toggleBulletList(), ordered: () => c.toggleOrderedList(), checklist: () => c.toggleTaskList(), quote: () => c.toggleBlockquote(), heading: () => (v === "p" ? c.setParagraph() : c.toggleHeading({ level: Number(v?.slice(1)) as 1 | 2 | 3 })) } as Record<string, () => unknown>)[tool]?.();
    c.run();
  }}
/>
<EditorContent editor={editor} className={richTextContentClass} />
```
