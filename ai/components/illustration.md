# illustration

Arquivo: `src/components/illustration.tsx` · importe de `@g4ai/ds`.

Ilustração em traço e cartão de primeira execução (camada expressiva: onboarding, boas-vindas, estado vazio de destaque — regra 22a).

## IllustrationFrame (type)

Quadro da ilustração: `label` vira o nome acessível (`role="img"`).

```ts
type IllustrationFrame = { label: string; paths: IllustrationPath[] }
```

## IllustrationPath (type)

Traço de uma cena. Texto = caminho SVG em traço; objeto para dar um preenchimento suave (`soft`, gelo translúcido) ou destacar o traço na cor de destaque (`accent`).

```ts
type IllustrationPath = string | { d: string; tone?: "soft" | "accent" }
```

## IntroCard

Cartão compacto de primeira execução: ilustração em traço no topo (gelo), "Etapa 1 de 4", título, texto, pontos de etapa, Voltar/Avançar (o último vira "Começar") e "Pular".

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `steps` * | `IntroCardStep[]` |  |  |
| `autoFocus` | `boolean \| undefined` | `false` | Foca o cartão ao montar (←/→ funcionam de imediato). |
| `className` | `string \| undefined` |  |  |
| `defaultIndex` | `number \| undefined` | `0` |  |
| `finishLabel` | `string \| undefined` | `"Começar"` |  |
| `illustration` | `((index: number) => ReactNode) \| undefined` |  | Troca a ilustração padrão (`MorphIllustration` com o `frame` de cada etapa, ou `onboardingScenes`). |
| `index` | `number \| undefined` |  |  |
| `onFinish` | `(() => void) \| undefined` |  | Último passo: "Começar". |
| `onIndexChange` | `((index: number) => void) \| undefined` |  |  |
| `onSkip` | `(() => void) \| undefined` |  | "Pular" no canto da ilustração; sem ele, o botão some. |
| `skipLabel` | `string \| undefined` | `"Pular"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/onboarding-ilustrado`):

```tsx
<IntroCard
  steps={[{ title: "Crie seu primeiro espaço", description: "…" }, …]}  // a etapa i usa onboardingScenes[i]
  onSkip={() => fecharIntro()}
  onFinish={() => router.push("/inicio")}
/>
```

## IntroCardStep (type)

Etapa do `IntroCard`: título, texto e, opcionalmente, o quadro da ilustração.

```ts
type IntroCardStep = { title: string; description: ReactNode; frame?: IllustrationFrame }
```

## MorphIllustration

Ilustração em traço que transiciona entre quadros quando `index` muda: troca cruzada com leve deslocamento e escala, elemento a elemento; quando todos os quadros têm caminhos de mesma estrutura, os traços se transformam

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `frames` * | `IllustrationFrame[]` |  |  |
| `index` * | `number` |  | Quadro visível (0…frames.length-1). |
| `className` | `string \| undefined` |  |  |
| `strokeWidth` | `number \| undefined` | `2` | Espessura do traço em unidades do viewBox (200 × 140). |
| `style` | `CSSProperties \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/onboarding-ilustrado`):

```tsx
<div className="text-ink-soft">
  <MorphIllustration frames={onboardingScenes} index={i} />
</div>
```

## onboardingScenes (const)

Quatro cenas de primeira execução, em traço: pasta (criar espaço), arquivos, equipe e selo de conquista.
