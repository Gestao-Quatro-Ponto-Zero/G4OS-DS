# stage

Arquivo: `src/components/stage.tsx` · importe de `@g4ai/ds`.

Camada expressiva (palcos).

## Chapter

Capítulo de página pública: uma ideia por seção.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `title` * | `ReactNode` |  |  |
| `children` | `ReactNode` |  | A cena: em geral um `Stage` com peças reais do produto. |
| `className` | `string \| undefined` |  |  |
| `description` | `ReactNode` |  |  |
| `flip` | `boolean \| undefined` |  |  |
| `id` | `string \| undefined` |  |  |
| `index` | `ReactNode` |  | Número do capítulo no sobretítulo ("01"). |
| `kicker` | `ReactNode` |  |  |
| `wide` | `boolean \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-palcos`):

```tsx
<Chapter id="na-pratica" index="01" kicker="Na prática" title="Peça. Acompanhe. Aprove." description="…" wide>\n  <Stage tone="sea">…cena…</Stage>\n</Chapter>\n\n<CtaButton href="/entrar">Entrar com e-mail da empresa</CtaButton>\n<Button variant="quiet" shape="pill">Ver na prática</Button>
```

## chapterTitleClass (const)

Título de capítulo e de chamada final: 34 px no celular, 48 px a partir de 640 px.

## CtaButton

Chamada principal de página pública: pílula com a seta num círculo, que anda e gira no hover.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `disabledReason` | `ReactNode` |  | Por que está desabilitado. |
| `href` | `string \| undefined` |  |  |
| `icon` | `ReactNode` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-palcos`):

```tsx
<Chapter id="na-pratica" index="01" kicker="Na prática" title="Peça. Acompanhe. Aprove." description="…" wide>\n  <Stage tone="sea">…cena…</Stage>\n</Chapter>\n\n<CtaButton href="/entrar">Entrar com e-mail da empresa</CtaButton>\n<Button variant="quiet" shape="pill">Ver na prática</Button>
```

## FloatingFigure

Figura que flutua sobre o palco (rosto de agente, ícone de app, peça), com a sombra no chão respirando junto.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `className` | `string \| undefined` |  |  |
| `delay` | `0 \| 1 \| 2 \| undefined` | `0` |  |
| `paused` | `boolean \| undefined` |  |  |
| `shadow` | `boolean \| undefined` | `true` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-palcos`):

```tsx
<FloatingFigure delay={0}>…</FloatingFigure>\n<FloatingFigure delay={1}>…</FloatingFigure>\n<FloatingFigure delay={2}>…</FloatingFigure>
```

## Glass

Vidro: uma peça do produto sobre o palco (cartão de rotina, aprovação, notificação), fosca para a paisagem aparecer atrás.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `as` | `ElementType \| undefined` | `"div"` |  |
| `solid` | `boolean \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-palcos`):

```tsx
<Stage tone="sea" className="px-6 py-10">\n  <Glass className="p-4">…uma peça do produto…</Glass>\n</Stage>
```

## Kicker

Sobretítulo de seção pública: monoespaçado, caixa alta, com o número do capítulo ("01 / Na prática").

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `className` | `string \| undefined` |  |  |
| `index` | `ReactNode` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

## SiteHeader

Cabeçalho de site público (anatomia I).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `brand` * | `ReactNode` |  | Marca: logo + nome do produto. |
| `actions` | `ReactNode` |  | Entrar / começar: um `Button size="sm" shape="pill"`. |
| `className` | `string \| undefined` |  |  |
| `floating` | `boolean \| undefined` | `false` | A página rolou: o cabeçalho vira pílula flutuante. |
| `label` | `string \| undefined` | `"Seções"` | Nome acessível da navegação. |
| `links` | `SiteHeaderLink[] \| undefined` | `[]` | Seções da página (rolagem) ou páginas do site. |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-palcos`):

```tsx
const { scrolled, onScroll } = useScrolled();\n\n<div className="h-dvh overflow-y-auto" onScroll={onScroll}>\n  <SiteHeader floating={scrolled} brand={<Marca />} links={secoes} actions={<Button size="sm" shape="pill">Entrar</Button>} />\n  …\n</div>
```

## SiteHeaderLink (type)

```ts
type SiteHeaderLink = { label: string; href?: string; onSelect?: () => void }
```

## SpeechBubble

Balão de fala sobre quem fala (uma figura no palco).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `className` | `string \| undefined` |  |  |
| `leaving` | `boolean \| undefined` |  |  |
| `live` | `boolean \| undefined` |  |  |
| `onAnimationEnd` | `(() => void) \| undefined` |  |  |
| `side` | `"center" \| "left" \| "right" \| undefined` | `"center"` |  |
| `style` | `CSSProperties \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-palcos`):

```tsx
const beat = useBeat(falas.length, 2600);\n\n<SpeechBubble key={beat} live>{falas[beat]}</SpeechBubble>\n<FloatingFigure><Rosto /></FloatingFigure>
```

## Stage

Palco: superfície expressiva com céu, dois morros e grão, todos de tokens (segue tema e marca).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `as` | `ElementType \| undefined` | `"div"` |  |
| `grain` | `boolean \| undefined` | `true` | Grão sutil que faz o gradiente ler como imagem. |
| `tone` | `StageTone \| undefined` | `"dawn"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-palcos`):

```tsx
<Stage tone="sea" className="px-6 py-10">\n  <Glass className="p-4">…uma peça do produto…</Glass>\n</Stage>
```

## StageSky

Céu do hero: a luz do palco de ponta a ponta, sem borda, sumindo na página embaixo.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `as` | `ElementType \| undefined` | `"section"` |  |
| `grain` | `boolean \| undefined` | `false` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

## StageTone (type)

```ts
type StageTone = "dawn" | "sea" | "dusk" | "brand"
```
