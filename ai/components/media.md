# media

Arquivo: `src/components/media.tsx` · importe de `@g4os/ds`.

Mídia: Carousel, SlideDeck + helpers de slide, ImageGallery, FileCard, AspectFrame.

## AspectFrame

Moldura com proporção fixa (16/9, 4/3, 1/1) para imagem, vídeo, mapa.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `className` | `string \| undefined` |  |  |
| `ratio` | `number \| undefined` | `16 / 9` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/midia-galeria`):

```tsx
<AspectFrame ratio={16 / 9}><img src={…} alt="…" /></AspectFrame>
```

## Carousel

Carrossel com rolagem nativa (arrasta no toque, trackpad funciona), encaixe por item, setas, pontos e ←/→ quando focado.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `label` * | `string` |  | Nome do conjunto: "Destaques do mês". |
| `arrows` | `boolean \| undefined` | `true` |  |
| `autoplay` | `number \| undefined` |  | Intervalo em ms. Pausa no hover/foco e com movimento reduzido. |
| `className` | `string \| undefined` |  |  |
| `dots` | `boolean \| undefined` | `true` |  |
| `gap` | `number \| undefined` | `12` |  |
| `perView` | `number \| undefined` | `1` |  |
| `perViewMobile` | `number \| undefined` | `1` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/midia-carrossel`):

```tsx
<Carousel label="Modelos" perView={3} perViewMobile={1.15} arrows>
  {modelos.map((m) => <Card …/>)}
</Carousel>
```

## DeckSlide (type)

```ts
type DeckSlide = { id: string; title: string; content: ReactNode; notes?: ReactNode }
```

## FileCard

Arquivo anexado: tipo, nome, tamanho, quem/quando.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `name` * | `string` |  |  |
| `actions` | `ReactNode` |  |  |
| `className` | `string \| undefined` |  |  |
| `error` | `string \| undefined` |  |  |
| `href` | `string \| undefined` |  |  |
| `meta` | `ReactNode` |  |  |
| `onOpen` | `(() => void) \| undefined` |  |  |
| `preview` | `string \| undefined` |  | Miniatura (img) no modo tile. |
| `progress` | `number \| undefined` |  | 0–100 enquanto envia. |
| `selected` | `boolean \| undefined` |  |  |
| `size` | `number \| undefined` |  |  |
| `variant` | `"row" \| "tile" \| undefined` | `"row"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/midia-arquivos`):

```tsx
<FileCard variant="tile" name="fachada.jpg" preview={url} size={…} />
```

## FileIcon

Ícone de tipo de arquivo (pela extensão).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `name` * | `string` |  |  |
| `size` | `"sm" \| "md" \| "lg" \| undefined` | `"md"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/midia-arquivos`):

```tsx
<FileIcon name="nota.pdf" />
```

## formatBytes (function)

1536000 → "1,5 MB"

```ts
formatBytes(bytes): string
```

## ImageGallery

Grade de imagens que abre em Lightbox.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `images` * | `LightboxImage[]` |  |  |
| `className` | `string \| undefined` |  |  |
| `columns` | `2 \| 3 \| 4 \| 5 \| undefined` | `4` |  |
| `ratio` | `number \| undefined` | `4 / 3` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/midia-galeria`):

```tsx
<ImageGallery images={[{ src, alt: "Fachada do escritório", caption: "São Paulo" }, …]} columns={4} />
```

## Slide

Tela base de um slide (1280×720).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `className` | `string \| undefined` |  |  |
| `footer` | `ReactNode` |  |  |
| `theme` | `SlideTheme \| undefined` | `"light"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/midia-slides`):

```tsx
import { Slide, SlideTitle, SlideBullets, SlideSplit, SlideStat, SlideQuote, SlideCanvas } from "@g4os/ds";

// Slide livre: 1280×720, margens de 80px
<Slide theme="soft" footer={<span>Fonte: CRM</span>}>…seu conteúdo…</Slide>

// Miniatura ou embed: escala para a largura disponível
<SlideCanvas><SlideTitle title="…" /></SlideCanvas>
```

## SLIDE_HEIGHT (const)

## SLIDE_WIDTH (const)

Tamanho de desenho de todo slide.

## SlideBullets

Título + lista de pontos (até 5).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `items` * | `ReactNode[]` |  |  |
| `title` * | `ReactNode` |  |  |
| `footer` | `ReactNode` |  |  |
| `kicker` | `ReactNode` |  |  |
| `theme` | `SlideTheme \| undefined` | `"light"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

## SlideCanvas

Renderiza um slide de 1280×720 escalado para a largura disponível.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `className` | `string \| undefined` |  |  |
| `style` | `CSSProperties \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/midia-slides`):

```tsx
import { Slide, SlideTitle, SlideBullets, SlideSplit, SlideStat, SlideQuote, SlideCanvas } from "@g4os/ds";

// Slide livre: 1280×720, margens de 80px
<Slide theme="soft" footer={<span>Fonte: CRM</span>}>…seu conteúdo…</Slide>

// Miniatura ou embed: escala para a largura disponível
<SlideCanvas><SlideTitle title="…" /></SlideCanvas>
```

## SlideDeck

Visualizador de apresentação: palco 16:9, miniaturas, ←/→ (e PageUp/Down, Home/End), F para tela cheia, barra de progresso, contador e notas do apresentador.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `slides` * | `DeckSlide[]` |  |  |
| `title` * | `string` |  |  |
| `className` | `string \| undefined` |  |  |
| `initial` | `number \| undefined` | `0` |  |
| `showNotes` | `boolean \| undefined` | `false` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/midia-slides`):

```tsx
const slides: DeckSlide[] = [
  { id: "capa", title: "Capa", content: <SlideTitle kicker="Q3 2026" title="Vendas cresceram 18 %" />, notes: "…" },
  { id: "kpis", title: "Resultados", content: <SlideStat title="Três números" stats={[…]} /> },
];
<SlideDeck title="Revisão trimestral Q3" slides={slides} />
```

## SlideQuote

Citação (cliente, pesquisa, entrevista).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `author` * | `ReactNode` |  |  |
| `quote` * | `ReactNode` |  |  |
| `footer` | `ReactNode` |  |  |
| `role` | `ReactNode` |  |  |
| `theme` | `SlideTheme \| undefined` | `"soft"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

## SlideSplit

Duas colunas: texto à esquerda, gráfico/imagem/tabela à direita.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `left` * | `ReactNode` |  |  |
| `right` * | `ReactNode` |  |  |
| `title` * | `ReactNode` |  |  |
| `footer` | `ReactNode` |  |  |
| `kicker` | `ReactNode` |  |  |
| `theme` | `SlideTheme \| undefined` | `"light"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

## SlideStat

Números grandes (2–4) com rótulo e variação.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `stats` * | `{ label: ReactNode; value: ReactNode; delta?: ReactNode; good?: boolean; }[]` |  |  |
| `title` * | `ReactNode` |  |  |
| `footer` | `ReactNode` |  |  |
| `kicker` | `ReactNode` |  |  |
| `theme` | `SlideTheme \| undefined` | `"light"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/midia-slides`):

```tsx
const slides: DeckSlide[] = [
  { id: "capa", title: "Capa", content: <SlideTitle kicker="Q3 2026" title="Vendas cresceram 18 %" />, notes: "…" },
  { id: "kpis", title: "Resultados", content: <SlideStat title="Três números" stats={[…]} /> },
];
<SlideDeck title="Revisão trimestral Q3" slides={slides} />
```

## SlideTitle

Capa ou abertura de seção.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `title` * | `ReactNode` |  |  |
| `footer` | `ReactNode` |  |  |
| `kicker` | `ReactNode` |  |  |
| `subtitle` | `ReactNode` |  |  |
| `theme` | `SlideTheme \| undefined` | `"navy"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/midia-slides`):

```tsx
const slides: DeckSlide[] = [
  { id: "capa", title: "Capa", content: <SlideTitle kicker="Q3 2026" title="Vendas cresceram 18 %" />, notes: "…" },
  { id: "kpis", title: "Resultados", content: <SlideStat title="Três números" stats={[…]} /> },
];
<SlideDeck title="Revisão trimestral Q3" slides={slides} />
```
