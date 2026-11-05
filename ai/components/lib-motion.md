# lib-motion

Arquivo: `src/lib/motion.ts` · importe de `@g4ai/ds`.

Movimento com contrato: o tempo só corre quando a pessoa vê, e movimento reduzido mostra o fim da cena (não uma cena congelada no meio).

## EASE_TRAVEL (const)

Curva de viagem (igual a `--ease-travel`): saída lenta, trajeto claro, chegada suave.

## everyVisible (function)

Repete `run` a cada `ms` só enquanto a aba está visível.

```ts
everyVisible(run, ms): () => void
```

## prefersReducedMotion (function)

Se a pessoa pediu menos movimento ao sistema.

```ts
prefersReducedMotion(): boolean
```

## useBeat (hook)

O compasso de uma cena: 0, 1, … `count - 1`, um a cada `ms` com a aba visível, e de novo do 0.

```ts
useBeat(count, ms, props?): number
```

Exemplo (showcase `#/p/ia-palcos`):

```tsx
const beat = useBeat(falas.length, 2600);\n\n<SpeechBubble key={beat} live>{falas[beat]}</SpeechBubble>\n<FloatingFigure><Rosto /></FloatingFigure>
```

## useEasedWidth (hook)

Uma pílula cujas palavras mudam: a largura vai da antiga à nova em vez de saltar.

```ts
useEasedWidth(element, key, duration?): void
```

## useGlide (hook)

Uma lista ancorada no pé (conversa, feed): quando um item chega ou sai, os que já estavam deslizam até o novo lugar em vez de pular.

```ts
useGlide(box, duration?): void
```

## useInView (hook)

Se o elemento já entrou na tela (uma vez).

```ts
useInView(props?): readonly [Dispatch<SetStateAction<T | null>>, boolean]
```

## useOutgoing (hook)

O que estava na tela enquanto sai: quando `key` muda, devolve o valor anterior até a animação de saída terminar (chame `done` no `onAnimationEnd`).

```ts
useOutgoing(value, key?): readonly [{ value: T; key: unknown; } | undefined, () => void]
```

## useReducedMotion (hook)

`prefersReducedMotion` como estado: muda junto com a preferência do sistema.

```ts
useReducedMotion(): boolean
```

## useScrolled (hook)

Se a área de rolagem já passou de `threshold` px.

```ts
useScrolled(threshold?, { window: onWindow = false }?): { scrolled: boolean; onScroll: (event: { currentTarget: { scrollTop: number; }; }) => void; }
```

Exemplo (showcase `#/p/ia-palcos`):

```tsx
const { scrolled, onScroll } = useScrolled();\n\n<div className="h-dvh overflow-y-auto" onScroll={onScroll}>\n  <SiteHeader floating={scrolled} brand={<Marca />} links={secoes} actions={<Button size="sm" shape="pill">Entrar</Button>} />\n  …\n</div>
```

## useVisibleInterval (hook)

`everyVisible` como hook.

```ts
useVisibleInterval(run, ms): void
```

## whenIdle (function)

Roda quando o navegador fica ocioso: dados abaixo da dobra, prévias e pré-carregamentos que não podem atrasar a primeira tela.

```ts
whenIdle(run, timeout?): () => void
```
