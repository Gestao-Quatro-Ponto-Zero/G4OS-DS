# overlays-extra

Arquivo: `src/components/overlays-extra.tsx` · importe de `@g4os/ds`.

Tooltip, HoverCard, Menu (submenus, checkbox/radio), ContextMenu, Sheet, CommandPalette, Lightbox.

## Command (type)

```ts
type Command = { id: string; label: string; group: string; icon?: ReactNode; hint?: string; shortcut?: string[]; keywords?: string[]; onSelect: () => void; }
```

## CommandPalette

Paleta de comandos (⌘K): busca tolerante a acento e erro de digitação, grupos, ↑↓ Enter, atalhos visíveis.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `commands` * | `Command[]` |  |  |
| `onClose` * | `() => void` |  |  |
| `open` * | `boolean` |  |  |
| `emptyLabel` | `string \| undefined` | `"Nada encontrado"` |  |
| `placeholder` | `string \| undefined` | `"Buscar ou executar um comando…"` |  |
| `recent` | `string[] \| undefined` | `[]` | Ids exibidos em "Recentes" quando a busca está vazia. |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ov-comandos`):

```tsx
const [open, setOpen] = useState(false);
useCommandShortcut(() => setOpen(true));

<CommandPalette open={open} onClose={() => setOpen(false)} commands={commands} recent={["negocios", "acme"]} />
```

## ContextMenu

Clique direito (ou toque longo) sobre uma área.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `items` * | `MenuEntry[]` |  |  |
| `className` | `string \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ov-menus`):

```tsx
<ContextMenu items={recordItems}>
  <div>…linha ou card…</div>
</ContextMenu>
```

## HoverCard

Prévia de uma entidade ao passar o mouse num link (pessoa, empresa, vaga).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactElement<unknown, string \| JSXElementConstructor<any>>` |  |  |
| `content` * | `ReactNode` |  |  |
| `delay` | `number \| undefined` | `500` |  |
| `side` | `"top" \| "bottom" \| "left" \| "right" \| undefined` | `"bottom"` |  |
| `width` | `number \| undefined` | `300` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ov-tooltip`):

```tsx
<HoverCard content={<PersonPreview />}>
  <a href="/contatos/mariana">Mariana Couto</a>
</HoverCard>
```

## Lightbox

Imagem em tela cheia sobre fundo escuro, com ←/→, contador e legenda.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `images` * | `LightboxImage[]` |  |  |
| `index` * | `number \| null` |  |  |
| `onIndexChange` * | `(index: number \| null) => void` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ov-lightbox`):

```tsx
const [index, setIndex] = useState<number | null>(null);
<Lightbox images={fotos} index={index} onIndexChange={setIndex} />
```

## LightboxImage (type)

```ts
type LightboxImage = { src: string; alt: string; caption?: ReactNode }
```

## Menu

Menu completo: itens com ícone e atalho, rótulos de grupo, separadores, marcações (checkbox), escolha única (radio) e submenus.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `items` * | `MenuEntry[]` |  |  |
| `label` * | `string` |  |  |
| `trigger` * | `ReactNode` |  | Conteúdo do botão gatilho. |
| `align` | `"start" \| "center" \| "end" \| undefined` | `"start"` |  |
| `side` | `"top" \| "bottom" \| "left" \| "right" \| undefined` | `"bottom"` |  |
| `triggerClassName` | `string \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ov-menus`):

```tsx
<Menu label="Exibição" trigger={<><Columns3 /> Exibição</>} items={[
  { type: "label", label: "Ordenar por" },
  { type: "radio", value: sort, onValueChange: setSort, options: [...] },
  { type: "separator" },
  { type: "checkbox", label: "Valor", checked, onCheckedChange },
]} />
```

## MenuEntry (type)

```ts
type MenuEntry = | { type?: "item"; label: string; icon?: ReactNode; shortcut?: string; onSelect?: () => void; href?: string; disabled?: boolean; tone?: "neutral" | "danger" } | { type: "separator" } | { type: "label"; label: string } | { type: "checkbox"; label: string; checked: boolean; onCheckedChange: (checked: boolean) => void; icon?: ReactNode } | { type: "radio"; value: string; onValueChange: (value: str…
```

## Sheet

Painel temporário que entra pela borda: filtros avançados, detalhes de um item, carrinho, ajuda.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `onClose` * | `() => void` |  |  |
| `open` * | `boolean` |  |  |
| `title` * | `string` |  |  |
| `description` | `ReactNode` |  |  |
| `footer` | `ReactNode` |  |  |
| `responsive` | `boolean \| undefined` | `true` | Abaixo de 640px, qualquer lado vira folha inferior. |
| `side` | `"bottom" \| "left" \| "right" \| undefined` | `"right"` |  |
| `width` | `number \| undefined` | `420` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ov-sheet`):

```tsx
<Sheet open={open} onClose={() => setOpen(false)} title="Filtros" description="…"
  footer={<><Button variant="ghost" size="sm">Limpar</Button><Button size="sm">Aplicar</Button></>}>
  …
</Sheet>
```

## Tooltip

Rótulo curto em tinta escura.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactElement<unknown, string \| JSXElementConstructor<any>>` |  |  |
| `content` * | `ReactNode` |  |  |
| `delay` | `number \| undefined` | `400` |  |
| `disabled` | `boolean \| undefined` |  |  |
| `shortcut` | `string[] \| undefined` |  | Teclas do atalho: ["⌘", "K"]. |
| `side` | `"top" \| "bottom" \| "left" \| "right" \| undefined` | `"top"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ov-tooltip`):

```tsx
<TooltipGroup>
  <Tooltip content="Negrito" shortcut={["⌘", "B"]}>
    <IconButton label="Negrito"><Bold /></IconButton>
  </Tooltip>
  …
</TooltipGroup>
```

## TooltipGroup

Agrupa tooltips: depois do primeiro, os vizinhos abrem na hora.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `delay` | `number \| undefined` | `400` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ov-tooltip`):

```tsx
<TooltipGroup>
  <Tooltip content="Negrito" shortcut={["⌘", "B"]}>
    <IconButton label="Negrito"><Bold /></IconButton>
  </Tooltip>
  …
</TooltipGroup>
```

## useCommandShortcut (hook)

Abre com ⌘K / Ctrl+K em qualquer lugar.

```ts
useCommandShortcut(onOpen, key?): void
```

Exemplo (showcase `#/p/ov-comandos`):

```tsx
const [open, setOpen] = useState(false);
useCommandShortcut(() => setOpen(true));

<CommandPalette open={open} onClose={() => setOpen(false)} commands={commands} recent={["negocios", "acme"]} />
```
