# catch-up

Arquivo: `src/components/catch-up.tsx` · importe de `@g4ai/ds`.

Resumo do que aconteceu enquanto a pessoa esteve fora ("catch up").

## CatchUpDone

"Tudo em dia": o resumo terminou e não sobrou nada para ler.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `action` | `ReactNode` |  |  |
| `children` | `ReactNode` |  |  |
| `title` | `string \| undefined` | `"Tudo em dia"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

## CatchUpItem (type)

```ts
type CatchUpItem = { id: string; section: CatchUpSectionId; source: string; sourceIcon?: ReactNode; text: ReactNode; context?: string; when?: string; people?: CatchUpPerson[]; href?: string; }
```

## CatchUpPerson (type)

```ts
type CatchUpPerson = { name: string; initials?: string; tint?: string; src?: string }
```

## CatchUpRow

Uma linha do resumo: marca da fonte, a frase, onde e quando, quem.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `item` * | `CatchUpItem` |  |  |
| `action` | `ReactNode \| ((markAsRead: () => boolean) => ReactNode)` |  | A função preserva o foco e retorna false se a leitura já começou. |
| `children` | `ReactNode` |  | Detalhe abaixo da frase (a oferta da IA, uma citação). |
| `className` | `string \| undefined` |  |  |
| `onOpen` | `((item: CatchUpItem) => void) \| undefined` |  | Padrão: abre `href` numa aba nova. |
| `onRead` | `((id: string) => void) \| undefined` |  |  |
| `openLabel` | `string \| undefined` | `"Abrir"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-resumo-do-periodo`):

```tsx
<div data-catch-up="">
  <CatchUpSection section="needs-you" count={1}>
    <CatchUpRow item={item} onRead={marcarLido}
      action={<Button size="sm" onClick={pedir}>Revisar</Button>}>
      <p>Posso ler o plano e deixar três comentários no fio.</p>
    </CatchUpRow>
  </CatchUpSection>
</div>
```

## CatchUpRowSkeleton

Reserva a estrutura da linha enquanto o resumo chega, incluindo oferta e ação quando previstas.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `withAction` | `boolean \| undefined` | `false` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-resumo-do-periodo`):

```tsx
<CatchUpSection section="decisions"><CatchUpRowSkeleton /><CatchUpRowSkeleton /></CatchUpSection>
```

## CatchUpSection

Uma seção do resumo: ícone, título e contagem, e as linhas.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `section` * | `CatchUpSectionId` |  |  |
| `className` | `string \| undefined` |  |  |
| `count` | `number \| undefined` |  | Linhas na seção. Padrão: não mostra contagem. |
| `title` | `string \| undefined` |  | Troca o título padrão da seção. |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-resumo-do-periodo`):

```tsx
<CatchUpSection section="decisions"><CatchUpRowSkeleton /><CatchUpRowSkeleton /></CatchUpSection>
```

## CatchUpSectionId (type)

```ts
type CatchUpSectionId = "needs-you" | "decisions" | "shipped" | "fyi"
```

## catchUpSections (const)

As quatro seções, na ordem em que aparecem.

## CatchUpSource (type)

```ts
type CatchUpSource = { id: string; label: string; icon?: ReactNode; count?: number; unit?: string; state?: CatchUpSourceState; }
```

## CatchUpSources

Fontes lidas para o resumo, com a contagem do período.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `sources` * | `CatchUpSource[]` |  |  |
| `className` | `string \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-resumo-do-periodo`):

```tsx
<CatchUpSources sources={[
  { id: "slack", label: "Slack", icon, count: 86, unit: "mensagens", state: "done" },
  { id: "gmail", label: "Gmail", icon, count: 7, unit: "conversas", state: "reading" },
  { id: "github", label: "GitHub", icon, count: 18, unit: "PRs", state: "error" },
]} />
```

## CatchUpSourceState (type)

```ts
type CatchUpSourceState = "idle" | "reading" | "done" | "error"
```
