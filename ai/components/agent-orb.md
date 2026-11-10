# agent-orb

Arquivo: `src/components/agent-orb.tsx` · importe de `@g4ai/ds`.

Rosto gerado de agente: um personagem pequeno e chapado, desenhado em SVG inline e derivado de forma determinística de uma semente estável (id do agente, nome do subagente, id da sessão).

## AGENT_ORB_BODIES (const)

## AGENT_ORB_EXPRESSIONS (const)

O que o rosto mostra.

## AGENT_ORB_EYES (const)

## AGENT_ORB_MOUTHS (const)

## AGENT_ORB_PALETTE (const)

Paleta dos rostos: um tom claro, um vizinho mais profundo e o matiz da tinta do rosto.

## AGENT_ORB_SHAPES (const)

Silhueta do rosto. `circle` é o disco padrão; as outras são para agentes que a pessoa nomeia e molda, para uma frota se distinguir de relance.

## AgentOrb

Rosto do agente: avatar gerado a partir de uma semente, com expressão do que o agente está fazendo (pensando, lendo, trabalhando, esperando você) e movimento só em CSS.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `seed` * | `string` |  | Semente estável (id do agente): decide cor, corpo e rosto. |
| `badge` | `React.ReactNode` |  | O que o agente segura enquanto trabalha: um ícone ou logo num selo no canto do rosto (busca, terminal, o app que ele está usando). |
| `className` | `string \| undefined` |  |  |
| `expression` | `"reading" \| "idle" \| "working" \| "smile" \| "happy" \| "wink" \| "flustered" \| "focused" \| "waiting" \| "sad" \|…` |  | O que o rosto mostra (ver `AGENT_ORB_EXPRESSIONS`). |
| `glyph` | `React.ReactNode` |  | Substitui o rosto, ex.: um ícone de papel para um ajudante fixo. |
| `labelled` | `boolean \| undefined` | `false` | Expõe o rosto como imagem com o nome `name`, em vez de escondê-lo de leitores de tela. |
| `motion` | `AgentOrbMotion \| undefined` | `"hover"` |  |
| `name` | `string \| undefined` |  | Nome do agente. Por padrão o rosto é decorativo (o texto ou controle ao lado nomeia o agente); passe `labelled` quando o rosto aparece sozinho. |
| `palette` | `number \| undefined` |  | Cor escolhida (índice em `AGENT_ORB_PALETTE`) no lugar da semeada. |
| `shape` | `"circle" \| "rounded-square" \| "rounded-triangle" \| "rounded-hexagon" \| undefined` | `"circle"` | Silhueta; `circle` (padrão) é o disco clássico. |
| `size` | `number \| undefined` | `20` | Lado em px. Padrão 20. |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-rosto-do-agente`):

```tsx
<AgentOrb seed={`galt:${agent.id}\
```

## AgentOrbBody (type)

```ts
type AgentOrbBody = (typeof AGENT_ORB_BODIES)[number]
```

## AgentOrbDesign (type)

```ts
type AgentOrbDesign = { palette: number; background: string; fill: string; ink: string; inverted: boolean; body: AgentOrbBody; eyes: AgentOrbEyes; mouth: AgentOrbMouth; eyeSpread: number; bodyX: number; bodyY: number; bodyTilt: number; faceTilt: number; }
```

## AgentOrbExpression (type)

```ts
type AgentOrbExpression = (typeof AGENT_ORB_EXPRESSIONS)[number]
```

## AgentOrbEyes (type)

```ts
type AgentOrbEyes = (typeof AGENT_ORB_EYES)[number]
```

## AgentOrbMotion (type)

`hover` (padrão) pisca uma vez ao passar o mouse ou focar o rosto ou o controle que o contém; `live` balança e pisca devagar (agente em execução); `none` deixa parado.

```ts
type AgentOrbMotion = "hover" | "live" | "none"
```

## AgentOrbMouth (type)

```ts
type AgentOrbMouth = (typeof AGENT_ORB_MOUTHS)[number]
```

## AgentOrbProps (type)

```ts
type AgentOrbProps = { seed: string; name?: string; size?: number; labelled?: boolean; glyph?: React.ReactNode; motion?: AgentOrbMotion; shape?: AgentOrbShape; expression?: AgentOrbExpression; palette?: number; badge?: React.ReactNode; className?: string; }
```

## AgentOrbShape (type)

```ts
type AgentOrbShape = (typeof AGENT_ORB_SHAPES)[number]
```

## AgentOrbStack

Pilha de rostos sobrepostos: quem participa de uma conversa, de um time ou de uma tarefa.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `agents` * | `{ seed: string; name?: string; shape?: AgentOrbShape; palette?: number; expression?: AgentOrbExpression; }[]` |  |  |
| `className` | `string \| undefined` |  |  |
| `label` | `string \| undefined` |  | Nome acessível do grupo. |
| `max` | `number \| undefined` | `4` |  |
| `ring` | `string \| undefined` |  | Cor do anel entre os rostos: a do fundo onde a pilha está. |
| `size` | `number \| undefined` | `24` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-rosto-do-agente`):

```tsx
<AgentOrbStack agents={team} size={28} max={4} />
```

## AgentOrbTier (type)

Feature weights per rendered size, so a 14px face still has eyes a pixel or two wide and a 40px face does not turn heavy.

```ts
type AgentOrbTier = "tiny" | "small" | "large"
```

## getAgentOrbArt (function)

The drawn avatar (disc, body and face, or disc only when a glyph replaces the face), memoized per seed and size tier.

```ts
getAgentOrbArt(seed, size, withFace?, options?): React.ReactElement<unknown, string | React.JSXElementConstructor<any>>
```

## getAgentOrbClip (function)

```ts
getAgentOrbClip(shape, size): string | undefined
```

## getAgentOrbDesign (function)

Memoized per seed (bounded), so re-renders of long lists never re-hash.

```ts
getAgentOrbDesign(seed, palette?): AgentOrbDesign
```

## getAgentOrbTier (function)

```ts
getAgentOrbTier(size): AgentOrbTier
```

## hashAgentSeed (function)

FNV-1a, 32-bit: stable across runs and platforms.

```ts
hashAgentSeed(seed): number
```
