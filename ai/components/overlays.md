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

**Uso certo**

- ✓ Criar/editar sem sair da lista: `<Drawer open={o} onClose={fechar} title="Editar cliente" footer={<OperationButton operation={op} onClick={salvar}>Salvar alterações</OperationButton>}>`.

**Evite**

- ✗ `Drawer` dentro de `Drawer` (regra `nested-drawer`); formulário de uma linha em `Drawer` (edite inline).

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

Exemplo (showcase `#/p/ia-conversa`):

```tsx
<Bubble tooltip="Enviada às 09:41 · editada">Ajustei o valor.</Bubble>
<Popover trigger={<SmilePlus />} triggerLabel="Reagir">…</Popover>
```

## popupClass (const)

Classe compartilhada dos popups flutuantes (menu, select, popover).
