# attachment

Arquivo: `src/components/attachment.tsx` · importe de `@g4ai/ds`.

Attachment (equivalente ao Attachment do shadcn/ui): anexo componível para composer de IA, mensagens, formulários e listas de documentos.

## Attachment

Raiz do anexo. `orientation="vertical"` para miniatura em cima (grade de imagens).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `className` | `string \| undefined` |  |  |
| `orientation` | `"horizontal" \| "vertical" \| undefined` | `"horizontal"` |  |
| `progress` | `number \| undefined` |  | 0–100 durante `uploading`. |
| `size` | `AttachmentSize \| undefined` | `"default"` |  |
| `state` | `AttachmentState \| undefined` | `"done"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/midia-anexos`):

```tsx
<Attachment size="sm">…</Attachment>\n<Attachment size="xs">…</Attachment>
```

## AttachmentAction

Ação de ícone do anexo (remover, baixar, tentar de novo).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `label` * | `string` |  |  |
| `className` | `string \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/midia-anexos`):

```tsx
<Attachment>
  <AttachmentMedia name="proposta-v3.pdf" />
  <AttachmentContent>
    <AttachmentTitle>proposta-v3.pdf</AttachmentTitle>
    <AttachmentDescription>PDF · 2,4 MB</AttachmentDescription>
  </AttachmentContent>
  <AttachmentActions>
    <AttachmentAction label="Baixar"><Download /></AttachmentAction>
  </AttachmentActions>
</Attachment>
```

## AttachmentActions

Grupo de ações à direita (ou embaixo, na vertical).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `className` | `string \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/midia-anexos`):

```tsx
<Attachment>
  <AttachmentMedia name="proposta-v3.pdf" />
  <AttachmentContent>
    <AttachmentTitle>proposta-v3.pdf</AttachmentTitle>
    <AttachmentDescription>PDF · 2,4 MB</AttachmentDescription>
  </AttachmentContent>
  <AttachmentActions>
    <AttachmentAction label="Baixar"><Download /></AttachmentAction>
  </AttachmentActions>
</Attachment>
```

## AttachmentContent

Texto do anexo (título + descrição).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `className` | `string \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/midia-anexos`):

```tsx
<Attachment>
  <AttachmentMedia name="proposta-v3.pdf" />
  <AttachmentContent>
    <AttachmentTitle>proposta-v3.pdf</AttachmentTitle>
    <AttachmentDescription>PDF · 2,4 MB</AttachmentDescription>
  </AttachmentContent>
  <AttachmentActions>
    <AttachmentAction label="Baixar"><Download /></AttachmentAction>
  </AttachmentActions>
</Attachment>
```

## AttachmentDescription

Linha de apoio: tipo e tamanho.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` | `ReactNode` |  |  |
| `className` | `string \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/midia-anexos`):

```tsx
<Attachment state="uploading" progress={42}>…<AttachmentDescription /></Attachment>\n<Attachment state="error">…<AttachmentDescription>Maior que 25 MB…</AttachmentDescription></Attachment>
```

## AttachmentGroup

Conjunto de anexos. `layout="row"` rola na horizontal (composer), `grid` em grade (galeria, mensagens), `list` empilhado (formulário).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `className` | `string \| undefined` |  |  |
| `label` | `string \| undefined` | `"Anexos"` |  |
| `layout` | `"list" \| "row" \| "grid" \| undefined` | `"row"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/midia-anexos`):

```tsx
<AttachmentGroup layout="row" label="Anexos da mensagem">
  {files.map((f) => <Attachment key={f} size="sm">…</Attachment>)}
</AttachmentGroup>
```

## AttachmentMedia

Mídia do anexo: ícone do tipo (pela extensão em `name`), miniatura (`variant="image"` com `src`) ou um ícone próprio em `children` (link, pasta).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `alt` | `string \| undefined` | `""` |  |
| `children` | `ReactNode` |  |  |
| `className` | `string \| undefined` |  |  |
| `name` | `string \| undefined` |  | Nome do arquivo para escolher o ícone do tipo. |
| `src` | `string \| undefined` |  |  |
| `variant` | `"icon" \| "image" \| undefined` | `"icon"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/midia-anexos`):

```tsx
<Attachment>
  <AttachmentMedia name="proposta-v3.pdf" />
  <AttachmentContent>
    <AttachmentTitle>proposta-v3.pdf</AttachmentTitle>
    <AttachmentDescription>PDF · 2,4 MB</AttachmentDescription>
  </AttachmentContent>
  <AttachmentActions>
    <AttachmentAction label="Baixar"><Download /></AttachmentAction>
  </AttachmentActions>
</Attachment>
```

## AttachmentState (type)

```ts
type AttachmentState = "idle" | "uploading" | "processing" | "error" | "done"
```

## AttachmentTitle

Nome do arquivo (truncado).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `className` | `string \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/midia-anexos`):

```tsx
<Attachment>
  <AttachmentMedia name="proposta-v3.pdf" />
  <AttachmentContent>
    <AttachmentTitle>proposta-v3.pdf</AttachmentTitle>
    <AttachmentDescription>PDF · 2,4 MB</AttachmentDescription>
  </AttachmentContent>
  <AttachmentActions>
    <AttachmentAction label="Baixar"><Download /></AttachmentAction>
  </AttachmentActions>
</Attachment>
```

## AttachmentTrigger

Torna o anexo inteiro clicável (abrir prévia, baixar) sem aninhar botões: cobre o card e deixa as ações por cima.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `label` * | `string` |  |  |
| `className` | `string \| undefined` |  |  |
| `render` | `ReactElement<{ className?: string; "aria-label"?: string; }, string \| JSXElementConstructor<any>> \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.
