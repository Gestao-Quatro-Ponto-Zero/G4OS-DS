# rich-text

Arquivo: `src/components/rich-text.tsx` · importe de `@g4os/ds`.

Editor de texto rico LEVE (contentEditable + comandos do navegador).

## richTextContentClass (const)

Estilos de leitura do conteúdo (h1–h3, listas, checklist, citação, código, tabela).

## RichTextEditor

Editor leve. Valor em HTML (controlado).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `label` * | `string` |  | Rótulo acessível do campo. |
| `onChange` * | `(html: string) => void` |  |  |
| `value` * | `string` |  |  |
| `aside` | `ReactNode` |  | Ação à direita do toolbar (ex.: botão "Melhorar com IA"). |
| `className` | `string \| undefined` |  |  |
| `minHeight` | `number \| undefined` | `160` |  |
| `placeholder` | `string \| undefined` | `"Escreva aqui… use # para títulos, - par` |  |
| `readOnly` | `boolean \| undefined` | `false` |  |
| `tools` | `RichTextTool[][] \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/editor-de-texto`):

```tsx
const [html, setHtml] = useState("<p>…</p>");

<RichTextEditor
  label="Instruções do agente"
  value={html}
  onChange={setHtml}
  aside={<button onClick={melhorar}><Wand2 /> Melhorar</button>}
/>
```

## RichTextTool (type)

```ts
type RichTextTool = | "heading" | "bold" | "italic" | "strike" | "highlight" | "align" | "bullet" | "ordered" | "checklist" | "quote" | "table" | "code" | "link" | "image"
```

## RichTextToolbar

Barra de ferramentas do editor (também serve para TipTap: passe `onCommand` e `active` do seu editor).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `onCommand` * | `(tool: RichTextTool \| "alignCenter" \| "alignLeft", value?: string) => void` |  |  |
| `active` | `Active \| undefined` | `{}` |  |
| `aside` | `ReactNode` |  |  |
| `className` | `string \| undefined` |  |  |
| `tools` | `RichTextTool[][] \| undefined` | `allTools` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/editor-de-texto`):

```tsx
<RichTextToolbar onCommand={(t, v) => editor.chain().focus().run(t, v)} active={{ bold: editor.isActive("bold") }} />
```
