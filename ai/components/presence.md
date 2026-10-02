# presence

Arquivo: `src/components/presence.tsx` · importe de `@g4ai/ds`.

Presença: quem está por aqui e onde.

## LocationTag

Lugar + hora local. Pílula com o nome do lugar e, ao lado, a hora no fuso dele (atualiza sozinha); o fuso completo aparece no tooltip.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `place` * | `string` |  | "São Paulo, SP", "Lisboa, Portugal". |
| `className` | `string \| undefined` |  |  |
| `href` | `string \| undefined` |  |  |
| `showTime` | `boolean \| undefined` | `true` |  |
| `status` | `{ label: string; tone?: Tone; } \| undefined` |  | Estado do lugar com palavra: `{ label: "Operando", tone: "ok" }`. |
| `timeZone` | `string \| undefined` |  | Fuso IANA ("America/Sao_Paulo"). |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/dash-progresso-e-presenca`):

```tsx
<LocationTag place="São Paulo, SP" timeZone="America/Sao_Paulo" />
<LocationTag place="CD Recife" timeZone="America/Recife" status={{ label: "Operando", tone: "ok" }} />
<LocationTag place="Lisboa, Portugal" timeZone="Europe/Lisbon" />
```

## StackedList

Lista em destaque com o diretório completo empilhado embaixo.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `items` * | `StackedListItem[]` |  | Todos os itens (vão para o diretório). |
| `title` * | `ReactNode` |  |  |
| `action` | `ReactNode` |  | Ação no cabeçalho (ex.: IconButton "Convidar"). |
| `className` | `string \| undefined` |  |  |
| `directoryHint` | `ReactNode` |  | Linha abaixo do título da barra. |
| `directoryLabel` | `string \| undefined` | `"Todas as pessoas"` | Título da barra/diretório. |
| `emptyFeatured` | `ReactNode` | `"Ninguém online agora."` |  |
| `featured` | `((item: StackedListItem) => boolean) \| undefined` |  | Quem aparece em destaque. |
| `height` | `number \| undefined` | `420` | Altura do cartão em px (o diretório abre dentro dela). |
| `searchPlaceholder` | `string \| undefined` | `"Buscar pessoas…"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/dash-progresso-e-presenca`):

```tsx
<StackedList
  title="Online agora"
  directoryLabel="Time comercial"
  action={<IconButton label="Convidar pessoa"><UserPlus /></IconButton>}
  items={[{ id: "1", name: "Ana Lopes", status: "online", description: "Online", meta: <Badge>Gestora</Badge> }, …]}
/>
```

## StackedListItem (type)

```ts
type StackedListItem = { id: string; name: string; initials?: string; tint?: string; src?: string; status?: AvatarStatus; description?: ReactNode; meta?: ReactNode; href?: string; onClick?: () => void; keywords?: string; }
```
