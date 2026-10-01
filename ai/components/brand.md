# brand

Arquivo: `src/components/brand.tsx` · importe de `@g4ai/ds`.

Momentos de marca G4: Navy Blue + Royal Gold + Royal Silver, do manual de marca.

## AchievementCard

Conquista/marco atingido: ícone dourado em navy + texto.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `title` * | `ReactNode` |  |  |
| `className` | `string \| undefined` |  |  |
| `description` | `ReactNode` |  |  |
| `icon` | `ReactNode` |  |  |
| `meta` | `ReactNode` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/fund-marca`):

```tsx
<AchievementCard title="Meta do trimestre batida" description="Time Sudeste fechou R$ 1,2 mi (104 % da meta)." meta="hoje" />
```

## BrandBadge

Selo de marca: Premium, Founders, Conquista.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` | `ReactNode` |  |  |
| `className` | `string \| undefined` |  |  |
| `kind` | `"premium" \| "founders" \| "conquista" \| undefined` | `"premium"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/fund-marca`):

```tsx
// Já vem nos componentes: Sidebar, IconRail e SessionSidebar usam --ds-nav-marker.
<BrandBadge kind="premium" />  <BrandBadge kind="conquista" />  <BrandBadge kind="founders" />
```

## BrandButton

Botão para usar DENTRO de BrandPanel.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `className` | `string \| undefined` |  |  |
| `href` | `string \| undefined` |  |  |
| `onClick` | `(() => void) \| undefined` |  |  |
| `variant` | `"ghost" \| "gold" \| undefined` | `"gold"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/fund-marca`):

```tsx
<BrandPanel kicker="G4 OS" title="Bom dia, João" description="3 sessões terminaram durante a noite e 2 pedem sua aprovação."
  actions={<><BrandButton>Ver aprovações <ArrowRight /></BrandButton><BrandButton variant="ghost">Nova sessão</BrandButton></>} />
```

## BrandPanel

Painel navy com brilho dourado sutil e grade fina.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `actions` | `ReactNode` |  |  |
| `children` | `ReactNode` |  |  |
| `className` | `string \| undefined` |  |  |
| `description` | `ReactNode` |  |  |
| `glow` | `"top" \| "none" \| "top-right" \| "bottom-left" \| undefined` | `"top-right"` | Onde fica o brilho dourado. |
| `grid` | `boolean \| undefined` | `true` | Grade fina de fundo (textura de "papel técnico"). |
| `kicker` | `ReactNode` |  |  |
| `size` | `"sm" \| "md" \| "lg" \| undefined` | `"md"` |  |
| `title` | `ReactNode` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/fund-marca`):

```tsx
<BrandPanel glow="bottom-left" kicker="Relatório trimestral · Q3 2026" title="Receita recorrente cresceu 18 %" description="…" />
```
