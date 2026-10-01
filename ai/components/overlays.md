# overlays

Arquivo: `src/components/overlays.tsx` · importe de `@g4ai/ds`.

Modal, ConfirmDialog, Drawer, Popover (Base UI).

## ConfirmDialog

Confirmação que exige resposta.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `onClose` * | `() => void` |  |  |
| `onConfirm` * | `() => void` |  |  |
| `open` * | `boolean` |  |  |
| `title` * | `string` |  |  |
| `cancelLabel` | `string \| undefined` | `"Cancelar"` |  |
| `children` | `ReactNode` |  |  |
| `confirmLabel` | `string \| undefined` | `"Confirmar"` |  |
| `description` | `ReactNode` |  |  |
| `tone` | `"neutral" \| "danger" \| undefined` | `"neutral"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

## Drawer

Painel lateral direito (500px).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `onClose` * | `() => void` |  |  |
| `open` * | `boolean` |  |  |
| `title` * | `string` |  |  |
| `footer` | `ReactNode` |  |  |
| `kicker` | `string \| undefined` |  |  |
| `width` | `number \| undefined` | `500` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

## Modal

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `onClose` * | `() => void` |  |  |
| `open` * | `boolean` |  |  |
| `title` * | `string` |  |  |
| `children` | `ReactNode` |  |  |
| `className` | `string \| undefined` |  |  |
| `description` | `string \| undefined` |  |  |
| `footer` | `ReactNode` |  | Botões alinhados à direita: secundário (ghost) antes, primário por último. |
| `kicker` | `string \| undefined` |  |  |
| `size` | `"sm" \| "md" \| "lg" \| undefined` | `"md"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

## Popover

Popover genérico: gatilho + painel com título e conteúdo.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `trigger` * | `ReactNode` |  |  |
| `triggerLabel` * | `string` |  |  |
| `align` | `"start" \| "center" \| "end" \| undefined` | `"center"` | Alinhamento em relação ao gatilho. |
| `side` | `"top" \| "bottom" \| "left" \| "right" \| undefined` | `"bottom"` |  |
| `title` | `ReactNode` |  |  |
| `triggerClassName` | `string \| undefined` |  |  |
| `width` | `number \| undefined` | `300` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

## popupClass (const)

Classe compartilhada dos popups flutuantes (menu, select, popover).
