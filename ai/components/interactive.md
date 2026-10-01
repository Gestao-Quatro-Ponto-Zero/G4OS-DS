# interactive

Arquivo: `src/components/interactive.tsx` · importe de `@g4os/ds`.

Interação e marketing: InputModal, AnimatedModal, LimitDialog, ImageSphere, Hero, FeatureGrid, BeforeAfter, NumberTicker.

## AnimatedModal

Modal com entrada coreografada (sobe, desfoca → nítido, conteúdo em cascata).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `onClose` * | `() => void` |  |  |
| `open` * | `boolean` |  |  |
| `title` * | `string` |  |  |
| `children` | `ReactNode` |  |  |
| `description` | `ReactNode` |  |  |
| `footer` | `ReactNode` |  |  |
| `media` | `ReactNode` |  | Imagem/ilustração no topo (ocupa a largura). |
| `size` | `"sm" \| "md" \| "lg" \| undefined` | `"md"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-modais`):

```tsx
<AnimatedModal open={aberto} onClose={fechar} media={<img src={capa} />} title="Bem-vindo ao Nexo ERP" description="…" footer={<Button>Começar</Button>} />
```

## BeforeAfter

Comparação antes/depois com alça arrastável (e setas do teclado).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `after` * | `SphereImage` |  |  |
| `before` * | `SphereImage` |  |  |
| `afterLabel` | `string \| undefined` | `"Depois"` |  |
| `aspect` | `string \| undefined` | `"16 / 9"` |  |
| `beforeLabel` | `string \| undefined` | `"Antes"` |  |
| `className` | `string \| undefined` |  |  |
| `initial` | `number \| undefined` | `50` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-imagens`):

```tsx
<BeforeAfter before={{ src: antigo, alt: "Painel antigo" }} after={{ src: novo, alt: "Painel novo" }} />
```

## CopyButton

Copia um texto e confirma com ✓ por 1,5 s.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `value` * | `string` |  |  |
| `className` | `string \| undefined` |  |  |
| `copiedLabel` | `string \| undefined` | `"Copiado"` |  |
| `iconOnly` | `boolean \| undefined` | `false` |  |
| `label` | `string \| undefined` | `"Copiar"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-imagens`):

```tsx
<CopyButton value="NFE-3526…" />  <KeyCombo keys={["⌘", "K"]} />  <NumberTicker value={4218000} format={(n) => formatCurrency(n, { compact: true })} />
```

## Feature (type)

```ts
type Feature = { icon?: ReactNode; title: string; description: ReactNode; href?: string }
```

## FeatureGrid

Grade de recursos: ícone, título, descrição.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `items` * | `Feature[]` |  |  |
| `className` | `string \| undefined` |  |  |
| `cols` | `2 \| 3 \| 4 \| undefined` | `3` |  |
| `description` | `ReactNode` |  |  |
| `kicker` | `ReactNode` |  |  |
| `title` | `ReactNode` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-marketing`):

```tsx
<FeatureGrid kicker="Por que" title="…" items={[{ icon, title, description }]} />
```

## HeroSection

Hero de página pública/landing.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `title` * | `ReactNode` |  |  |
| `actions` | `ReactNode` |  |  |
| `badge` | `ReactNode` |  |  |
| `className` | `string \| undefined` |  |  |
| `description` | `ReactNode` |  |  |
| `footnote` | `ReactNode` |  |  |
| `image` | `string \| undefined` |  | URL da imagem de fundo (variant="image"). |
| `media` | `ReactNode` |  |  |
| `variant` | `"centered" \| "split" \| "image" \| undefined` | `"centered"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-marketing`):

```tsx
<HeroSection variant="image" image={foto} badge={…} title="…" actions={…} />
```

## ImageSphere

Esfera 3D de imagens (distribuição de Fibonacci): arraste para girar, inércia ao soltar, setas do teclado giram.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `images` * | `SphereImage[]` |  |  |
| `autoRotate` | `boolean \| undefined` | `true` |  |
| `className` | `string \| undefined` |  |  |
| `itemSize` | `number \| undefined` | `64` |  |
| `label` | `string \| undefined` | `"Galeria em esfera"` |  |
| `onSelect` | `((index: number) => void) \| undefined` |  |  |
| `size` | `number \| undefined` | `420` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-imagens`):

```tsx
<ImageSphere images={[{ src, alt }, …]} size={420} itemSize={64} onSelect={(i) => abrirLightbox(i)} />
```

## ImageWithFallback

Imagem com esqueleto enquanto carrega e alternativa quando falha (iniciais do nome ou ícone).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `alt` * | `string` |  |  |
| `className` | `string \| undefined` |  |  |
| `fallback` | `string \| undefined` |  |  |
| `imgClassName` | `string \| undefined` |  |  |
| `src` | `string \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-imagens`):

```tsx
<ImageWithFallback src={url} alt="Renata Farias" fallback="Renata Farias" className="h-12 w-12 rounded-full" />
```

## InputModal

Modal de uma pergunta só: um campo grande e Enter para enviar.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `onClose` * | `() => void` |  |  |
| `onSubmit` * | `(value: string) => void` |  |  |
| `open` * | `boolean` |  |  |
| `title` * | `string` |  |  |
| `description` | `ReactNode` |  |  |
| `icon` | `ReactNode` |  |  |
| `initialValue` | `string \| undefined` | `""` |  |
| `multiline` | `boolean \| undefined` | `false` |  |
| `placeholder` | `string \| undefined` | `"Descreva o que você precisa…"` |  |
| `submitLabel` | `string \| undefined` | `"Continuar"` |  |
| `suggestions` | `string[] \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-modais`):

```tsx
<InputModal
  open={aberto} onClose={fechar}
  title="Criar tarefas com IA"
  description="Descreva o que precisa acontecer; eu separo em tarefas."
  suggestions={["Onboarding do cliente Aurora", "Fechamento contábil de setembro"]}
  submitLabel="Gerar tarefas"
  onSubmit={(texto) => gerar(texto)}
/>
```

## KeyCombo

Combinação de teclas: ["⌘", "K"] → ⌘ K.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `keys` * | `string[]` |  |  |
| `className` | `string \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-imagens`):

```tsx
<CopyButton value="NFE-3526…" />  <KeyCombo keys={["⌘", "K"]} />  <NumberTicker value={4218000} format={(n) => formatCurrency(n, { compact: true })} />
```

## LimitDialog

Alerta de limite (taxa de uso, cota do plano, créditos de IA).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `onClose` * | `() => void` |  |  |
| `open` * | `boolean` |  |  |
| `retryIn` * | `number` |  | Segundos até liberar. |
| `description` | `ReactNode` | `"Muitas solicitações em pouco tempo. Agu` |  |
| `onRetry` | `(() => void) \| undefined` |  |  |
| `onUpgrade` | `(() => void) \| undefined` |  |  |
| `title` | `string \| undefined` | `"Você atingiu o limite de uso"` |  |
| `upgradeLabel` | `string \| undefined` | `"Ver planos"` |  |
| `usage` | `{ used: number; limit: number; unit: string; } \| undefined` |  | Ex.: { used: 500, limit: 500, unit: "solicitações/hora" } |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-avisos`):

```tsx
<LimitDialog open={aberto} onClose={fechar} retryIn={42} usage={{ used: 500, limit: 500, unit: "solicitações/hora" }} onUpgrade={verPlanos} onRetry={reenviar} />
```

## Logo (type)

```ts
type Logo = { name: string; src?: string; mark?: ReactNode }
```

## LogoCloud

Logos de clientes/parceiros em tom neutro (sem competir com a marca).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `logos` * | `Logo[]` |  |  |
| `className` | `string \| undefined` |  |  |
| `scrolling` | `boolean \| undefined` | `false` |  |
| `title` | `ReactNode` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-marketing`):

```tsx
<LogoCloud title="Empresas que já usam" logos={[{ name: "Aurora" }, …]} scrolling />
```

## Marquee

Faixa que rola sozinha (logos, depoimentos curtos).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `className` | `string \| undefined` |  |  |
| `duration` | `number \| undefined` | `40` |  |
| `fade` | `boolean \| undefined` | `true` |  |
| `gap` | `number \| undefined` | `48` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

## NumberTicker

Número que conta até o valor ao entrar na tela.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `value` * | `number` |  |  |
| `className` | `string \| undefined` |  |  |
| `duration` | `number \| undefined` | `1200` |  |
| `format` | `((n: number) => string) \| undefined` | `(n) => formatNumber(n)` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-imagens`):

```tsx
<CopyButton value="NFE-3526…" />  <KeyCombo keys={["⌘", "K"]} />  <NumberTicker value={4218000} format={(n) => formatCurrency(n, { compact: true })} />
```

## ScreenFrame

Moldura de janela de navegador para prints do produto.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `className` | `string \| undefined` |  |  |
| `url` | `string \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-marketing`):

```tsx
<HeroSection variant="split" title="…" media={<ScreenFrame>…</ScreenFrame>} />
```

## SphereImage (type)

```ts
type SphereImage = { src: string; alt: string }
```

## StatsBand

Faixa de números de impacto (landing, relatório).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `stats` * | `{ value: number; label: string; format?: (n: number) => string; prefix?: string; suffix?: string; }[]` |  |  |
| `className` | `string \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-marketing`):

```tsx
<StatsBand stats={[{ value: 2140, label: "Empresas" }, { value: 4.2e9, label: "Transacionado", format: … }]} />
```

## Testimonial

Depoimento: citação, pessoa, cargo e empresa.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `name` * | `string` |  |  |
| `quote` * | `ReactNode` |  |  |
| `avatar` | `string \| undefined` |  |  |
| `className` | `string \| undefined` |  |  |
| `logo` | `ReactNode` |  |  |
| `role` | `string \| undefined` |  |  |
| `variant` | `"card" \| "large" \| undefined` | `"card"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.
