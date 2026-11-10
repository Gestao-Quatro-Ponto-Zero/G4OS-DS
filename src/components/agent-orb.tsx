import type * as React from "react";
import { cn } from "../lib/cn";

/*
 * Rosto gerado de agente: um personagem pequeno e chapado, desenhado em SVG inline e derivado de
 * forma determinística de uma semente estável (id do agente, nome do subagente, id da sessão). Um
 * disco tingido leva um corpo (bloco, disco, cápsula ou losango) com deslocamento e inclinação
 * semeados, e um rosto sobre ele: olhos e boca de conjuntos pequenos e curados. Chapado de
 * propósito: só preenchimentos sólidos, sem gradiente, brilho, sombra, filtro ou <defs>, para que
 * uma fileira de rostos leia como uma fileira de marcas.
 *
 * Barato: o desenho é função pura da semente, e a árvore de elementos é memoizada por semente e
 * faixa de tamanho (caches limitados), então listas longas nunca recalculam. O movimento (piscar no
 * hover/foco, balanço enquanto trabalha, ciclo de cada expressão) é só CSS, em
 * src/styles/agent-orb.css, e some com movimento reduzido.
 *
 * As cores são identidade do agente (como o `tint` de Avatar), não cor de interface: por isso vêm
 * de uma paleta própria em oklch, igual nos dois temas, e não dos tokens semânticos.
 */

/**
 * Paleta dos rostos: um tom claro, um vizinho mais profundo e o matiz da tinta do rosto. Os índices
 * só crescem no fim, para uma cor escolhida e salva continuar a mesma; a tinta mantém 4,5:1 nos dois.
 */
export const AGENT_ORB_PALETTE = [
  { tint: "oklch(0.86 0.08 230)", deep: "oklch(0.7 0.12 262)", inkHue: 268 }, // céu / índigo
  { tint: "oklch(0.89 0.09 165)", deep: "oklch(0.74 0.1 192)", inkHue: 196 }, // menta / azul-petróleo
  { tint: "oklch(0.86 0.07 305)", deep: "oklch(0.7 0.12 292)", inkHue: 292 }, // lilás / violeta
  { tint: "oklch(0.88 0.06 12)", deep: "oklch(0.74 0.12 16)", inkHue: 16 }, // rosado / rosa
  { tint: "oklch(0.9 0.07 60)", deep: "oklch(0.77 0.12 40)", inkHue: 36 }, // pêssego / coral
  { tint: "oklch(0.93 0.1 108)", deep: "oklch(0.79 0.12 148)", inkHue: 148 }, // limão / folha
  { tint: "oklch(0.89 0.07 205)", deep: "oklch(0.71 0.11 248)", inkHue: 252 }, // água / azul
  { tint: "oklch(0.86 0.09 335)", deep: "oklch(0.7 0.12 310)", inkHue: 302 }, // orquídea / ameixa
  { tint: "oklch(0.91 0.07 80)", deep: "oklch(0.76 0.12 28)", inkHue: 24 }, // damasco / brasa
  { tint: "oklch(0.89 0.05 145)", deep: "oklch(0.73 0.08 222)", inkHue: 222 }, // sálvia / azul-ardósia
  { tint: "oklch(0.87 0.06 262)", deep: "oklch(0.75 0.09 188)", inkHue: 188 }, // pervinca / lagoa
  { tint: "oklch(0.9 0.05 70)", deep: "oklch(0.71 0.1 330)", inkHue: 330 }, // areia / amora
] as const;

const ORB_PALETTES = AGENT_ORB_PALETTE.map((p) => [p.tint, p.deep, p.inkHue] as const);

function paletteIndex(index: number): number {
  const whole = Number.isFinite(index) ? Math.trunc(index) : 0;
  return ((whole % ORB_PALETTES.length) + ORB_PALETTES.length) % ORB_PALETTES.length;
}

/**
 * Silhueta do rosto. `circle` é o disco padrão; as outras são para agentes que a pessoa nomeia e
 * molda, para uma frota se distinguir de relance.
 */
export const AGENT_ORB_SHAPES = [
  "circle",
  "rounded-square",
  "rounded-triangle",
  "rounded-hexagon",
] as const;
export type AgentOrbShape = (typeof AGENT_ORB_SHAPES)[number];

/**
 * O que o rosto mostra. Sem expressão, é exatamente o rosto semeado; com uma, a semente ainda
 * escolhe cor, corpo e distância dos olhos, e a expressão escolhe olhos, boca e movimento:
 *  - `idle`: contente (olhos semeados, um sorriso) e de vez em quando um olhar para os lados;
 *  - `smile`, `happy`, `wink`, `flustered`: humores de uma vez (rubor em flustered);
 *  - `working`: olhos percorrendo, boca firme; `focused`: olhos apertados, respiração lenta;
 *  - `waiting`: olhos grandes para cima e um pulinho de vez em quando (precisa da pessoa);
 *  - `sad`: sobrancelhas caídas e boca para baixo, parado;
 *  - `thinking`: olhos para cima e para o lado, um pensamento subindo (antes do primeiro passo);
 *  - `reading`: olhos baixos, andando pelas linhas; `talking`: olhando de lado, boca mexendo;
 *  - `calm`: olhos fechados num sorriso tranquilo, parado (nada a relatar);
 *  - `sleepy`: olhos fechados, um ronco e um "z" flutuando;
 *  - `confused`: uma sobrancelha erguida, olhos desiguais, boca ondulada, parado;
 *  - `proud`, `aha`, `alert`: humores de uma vez (um brilho, uma luz, um susto).
 */
export const AGENT_ORB_EXPRESSIONS = [
  "idle",
  "smile",
  "happy",
  "wink",
  "flustered",
  "working",
  "focused",
  "waiting",
  "sad",
  "thinking",
  "reading",
  "talking",
  "calm",
  "sleepy",
  "confused",
  "proud",
  "aha",
  "alert",
] as const;
export type AgentOrbExpression = (typeof AGENT_ORB_EXPRESSIONS)[number];

/** Expressions that move on their own; they replace the caller's hover/live motion. */
const SELF_MOVING_EXPRESSIONS = new Set<AgentOrbExpression>([
  "working",
  "focused",
  "waiting",
  "thinking",
  "reading",
  "talking",
  "sleepy",
]);

export const AGENT_ORB_BODIES = ["block", "disc", "capsule", "diamond"] as const;
export const AGENT_ORB_EYES = ["dots", "pills", "happy", "wink"] as const;
export const AGENT_ORB_MOUTHS = ["smile", "grin", "flat", "oh"] as const;

export type AgentOrbBody = (typeof AGENT_ORB_BODIES)[number];
export type AgentOrbEyes = (typeof AGENT_ORB_EYES)[number];
export type AgentOrbMouth = (typeof AGENT_ORB_MOUTHS)[number];

export interface AgentOrbDesign {
  /** Index into the curated palette. */
  palette: number;
  /** Disc colour (the pair's tint, or its deep tone when `inverted`). */
  background: string;
  /** Body colour: the other tone of the pair. */
  fill: string;
  /** Face ink, a deep tone of the pair's hue. */
  ink: string;
  /** Deep disc with a light body instead of the other way round. */
  inverted: boolean;
  body: AgentOrbBody;
  eyes: AgentOrbEyes;
  mouth: AgentOrbMouth;
  /** Eye half-spacing in viewBox units (36-unit grid). */
  eyeSpread: number;
  /** Body offset from the centre, viewBox units. */
  bodyX: number;
  bodyY: number;
  /** Body rotation, degrees. */
  bodyTilt: number;
  /** Face rotation, degrees. */
  faceTilt: number;
}

/** FNV-1a, 32-bit: stable across runs and platforms. */
export function hashAgentSeed(seed: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** mulberry32: a tiny deterministic stream of picks from one 32-bit seed. */
function createPicker(seed: number) {
  let state = seed | 0;
  return (count: number): number => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) % count;
  };
}

const FALLBACK_PALETTE = ORB_PALETTES[0] as (typeof ORB_PALETTES)[number];

function buildAgentOrbDesign(seed: string, paletteOverride?: number): AgentOrbDesign {
  const hash = hashAgentSeed(seed);
  const palette =
    paletteOverride === undefined ? hash % ORB_PALETTES.length : paletteIndex(paletteOverride);
  const [tint, deep, inkHue] = ORB_PALETTES[palette] ?? FALLBACK_PALETTE;
  const pick = createPicker(hash ^ 0x9e3779b9);
  const inverted = pick(4) === 0;
  const body = AGENT_ORB_BODIES[pick(AGENT_ORB_BODIES.length)] ?? "block";
  const eyes = AGENT_ORB_EYES[pick(AGENT_ORB_EYES.length)] ?? "dots";
  const mouth = AGENT_ORB_MOUTHS[pick(AGENT_ORB_MOUTHS.length)] ?? "smile";
  return {
    palette,
    background: inverted ? deep : tint,
    fill: inverted ? tint : deep,
    ink: `oklch(0.27 0.08 ${inkHue})`,
    inverted,
    body,
    eyes,
    mouth,
    eyeSpread: pick(2) === 0 ? 4.2 : 5.4,
    bodyX: pick(9) - 4,
    bodyY: 4 + pick(6),
    bodyTilt: (pick(9) - 4) * 8,
    faceTilt: (pick(5) - 2) * 4,
  };
}

const CACHE_LIMIT = 512;

function remember<T>(cache: Map<string, T>, key: string, value: T): T {
  if (cache.size >= CACHE_LIMIT) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, value);
  return value;
}

const designCache = new Map<string, AgentOrbDesign>();

/**
 * Memoized per seed (bounded), so re-renders of long lists never re-hash. `palette` replaces
 * the seeded colour (a colour the person chose); everything else still comes from the seed.
 */
export function getAgentOrbDesign(seed: string, palette?: number): AgentOrbDesign {
  const key = palette === undefined ? seed : `${paletteIndex(palette)}#${seed}`;
  return designCache.get(key) ?? remember(designCache, key, buildAgentOrbDesign(seed, palette));
}

/**
 * Feature weights per rendered size, so a 14px face still has eyes a pixel
 * or two wide and a 40px face does not turn heavy. Tiny faces also grow a
 * little around their centre.
 */
export type AgentOrbTier = "tiny" | "small" | "large";

export function getAgentOrbTier(size: number): AgentOrbTier {
  if (size < 20) return "tiny";
  if (size < 30) return "small";
  return "large";
}

const TIER_METRICS: Record<AgentOrbTier, { eye: number; stroke: number; faceScale: number }> = {
  tiny: { eye: 2.6, stroke: 2.5, faceScale: 1.18 },
  small: { eye: 2.1, stroke: 2, faceScale: 1.06 },
  large: { eye: 1.8, stroke: 1.7, faceScale: 1 },
};

function renderBody(design: AgentOrbDesign): React.ReactElement {
  const cx = 18 + design.bodyX;
  const cy = 18 + design.bodyY;
  const fill = design.fill;
  switch (design.body) {
    case "disc":
      return <circle cx={cx} cy={cy} r={17} fill={fill} />;
    case "capsule":
      return (
        <rect
          x={cx - 14}
          y={cy - 16}
          width={28}
          height={40}
          rx={14}
          fill={fill}
          transform={`rotate(${design.bodyTilt / 2} ${cx} ${cy})`}
        />
      );
    case "diamond":
      return (
        <rect
          x={cx - 15}
          y={cy - 15}
          width={30}
          height={30}
          rx={7}
          fill={fill}
          transform={`rotate(${45 + design.bodyTilt / 4} ${cx} ${cy})`}
        />
      );
    default:
      return (
        <rect
          x={cx - 18}
          y={cy - 18}
          width={36}
          height={36}
          rx={9}
          fill={fill}
          transform={`rotate(${design.bodyTilt} ${cx} ${cy})`}
        />
      );
  }
}

function renderEye(
  kind: "dot" | "pill" | "arc",
  x: number,
  y: number,
  eye: number,
  stroke: number,
  ink: string,
): React.ReactElement {
  if (kind === "pill") {
    const width = eye * 1.4;
    const height = eye * 2.5;
    return (
      <rect
        x={x - width / 2}
        y={y - height / 2}
        width={width}
        height={height}
        rx={width / 2}
        fill={ink}
      />
    );
  }
  if (kind === "arc") {
    const half = eye * 1.25;
    return (
      <path
        d={`M${x - half} ${y + half * 0.45}q${half} ${-half * 1.5} ${half * 2} 0`}
        fill="none"
        stroke={ink}
        strokeWidth={stroke}
        strokeLinecap="round"
      />
    );
  }
  return <circle cx={x} cy={y} r={eye} fill={ink} />;
}

function renderMouth(
  mouth: AgentOrbMouth,
  x: number,
  y: number,
  stroke: number,
  ink: string,
): React.ReactElement {
  switch (mouth) {
    case "grin":
      return <path d={`M${x - 3.4} ${y - 0.6}h6.8a3.4 3.4 0 0 1-6.8 0z`} fill={ink} />;
    case "flat":
      return (
        <path
          d={`M${x - 2.6} ${y}h5.2`}
          fill="none"
          stroke={ink}
          strokeWidth={stroke}
          strokeLinecap="round"
        />
      );
    case "oh":
      return <circle cx={x} cy={y + 0.4} r={1.4 + stroke * 0.35} fill={ink} />;
    default:
      return (
        <path
          d={`M${x - 3.4} ${y - 0.8}q3.4 3.2 6.8 0`}
          fill="none"
          stroke={ink}
          strokeWidth={stroke}
          strokeLinecap="round"
        />
      );
  }
}

function renderFace(design: AgentOrbDesign, tier: AgentOrbTier): React.ReactElement {
  const { eye, stroke, faceScale } = TIER_METRICS[tier];
  // The face rides the body: it follows part of the body's offset, so it
  // always lands on the body's fill rather than straddling the disc edge.
  const cx = 18 + design.bodyX * 0.6;
  const cy = 17 + design.bodyY * 0.5;
  const eyeY = cy - 2.8;
  const spread = design.eyeSpread;
  const left = cx - spread;
  const right = cx + spread;
  const ink = design.ink;
  const eyes =
    design.eyes === "pills"
      ? [
          renderEye("pill", left, eyeY, eye, stroke, ink),
          renderEye("pill", right, eyeY, eye, stroke, ink),
        ]
      : design.eyes === "happy"
        ? [
            renderEye("arc", left, eyeY, eye, stroke, ink),
            renderEye("arc", right, eyeY, eye, stroke, ink),
          ]
        : design.eyes === "wink"
          ? [
              renderEye("dot", left, eyeY, eye, stroke, ink),
              renderEye("arc", right, eyeY, eye, stroke, ink),
            ]
          : [
              renderEye("dot", left, eyeY, eye, stroke, ink),
              renderEye("dot", right, eyeY, eye, stroke, ink),
            ];
  return (
    <g
      transform={`rotate(${design.faceTilt} ${cx} ${cy}) translate(${cx} ${cy}) scale(${faceScale}) translate(${-cx} ${-cy})`}
    >
      <g data-orb-face="">
        <g data-orb-eyes="">
          {eyes[0]}
          {eyes[1]}
        </g>
        {renderMouth(design.mouth, cx, cy + 4.2, stroke, ink)}
      </g>
    </g>
  );
}

/** Blush on a flustered face: one warm tone that reads on every pair. */
const BLUSH = "oklch(0.72 0.15 15)";

/** Eyes, mouth and extras each expression draws; the seed keeps the rest. */
function renderExpressionFace(
  design: AgentOrbDesign,
  tier: AgentOrbTier,
  expression: AgentOrbExpression,
  shape: AgentOrbShape,
): React.ReactElement {
  const { eye, stroke, faceScale } = TIER_METRICS[tier];
  // A triangle is narrow at the top: its face sits lower and a little smaller.
  const pointed = shape === "rounded-triangle";
  const lift = pointed ? 2.6 : 0;
  const scale = pointed ? faceScale * 0.92 : faceScale;
  const cx = 18 + design.bodyX * (pointed ? 0.3 : 0.6);
  const cy = 17 + design.bodyY * 0.5 + lift;
  const eyeY = cy - 2.8;
  const spread = design.eyeSpread;
  const left = cx - spread;
  const right = cx + spread;
  const ink = design.ink;
  const mouthY = cy + 4.2;
  const pair = (kind: "dot" | "pill" | "arc", y = eyeY, size = eye) => [
    renderEye(kind, left, y, size, stroke, ink),
    renderEye(kind, right, y, size, stroke, ink),
  ];
  const seededEyes = (): React.ReactElement[] => {
    switch (design.eyes) {
      case "pills":
        return pair("pill");
      case "happy":
        return pair("arc");
      case "wink":
        return [
          renderEye("dot", left, eyeY, eye, stroke, ink),
          renderEye("arc", right, eyeY, eye, stroke, ink),
        ];
      default:
        return pair("dot");
    }
  };
  let eyes: React.ReactElement[];
  let mouth: React.ReactElement;
  const extras: React.ReactElement[] = [];
  switch (expression) {
    case "smile":
      eyes = design.eyes === "wink" ? pair("dot") : seededEyes();
      mouth = renderMouth("grin", cx, mouthY, stroke, ink);
      break;
    case "happy":
      eyes = pair("arc");
      mouth = renderMouth("grin", cx, mouthY, stroke, ink);
      break;
    case "wink":
      eyes = [
        renderEye(design.eyes === "pills" ? "pill" : "dot", left, eyeY, eye, stroke, ink),
        <path
          key="wink"
          data-orb-wink=""
          d={`M${right - eye * 1.3} ${eyeY}h${eye * 2.6}`}
          fill="none"
          stroke={ink}
          strokeWidth={stroke}
          strokeLinecap="round"
        />,
      ];
      mouth = renderMouth("smile", cx, mouthY, stroke, ink);
      break;
    case "flustered":
      eyes = pair("arc", eyeY + 0.4);
      mouth = (
        <path
          d={`M${cx - 3} ${mouthY}q1 -1.1 2 0t2 0t2 0`}
          fill="none"
          stroke={ink}
          strokeWidth={stroke * 0.85}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
      extras.push(
        <g key="blush" data-orb-blush="">
          <ellipse cx={left - 1.6} cy={eyeY + 3.6} rx={2.4} ry={1.3} fill={BLUSH} />
          <ellipse cx={right + 1.6} cy={eyeY + 3.6} rx={2.4} ry={1.3} fill={BLUSH} />
        </g>,
      );
      break;
    case "working":
      eyes = pair("dot", eyeY + 0.3);
      mouth = (
        <path
          d={`M${cx - 1.8} ${mouthY}h3.6`}
          fill="none"
          stroke={ink}
          strokeWidth={stroke}
          strokeLinecap="round"
        />
      );
      break;
    case "focused": {
      const width = eye * 2.5;
      const height = Math.max(eye * 0.95, stroke);
      eyes = [left, right].map((x) => (
        <rect
          key={x}
          x={x - width / 2}
          y={eyeY - height / 2 + 0.4}
          width={width}
          height={height}
          rx={height / 2}
          fill={ink}
        />
      ));
      mouth = (
        <path
          d={`M${cx - 0.6} ${mouthY}h3`}
          fill="none"
          stroke={ink}
          strokeWidth={stroke}
          strokeLinecap="round"
        />
      );
      break;
    }
    case "waiting":
      eyes = pair("dot", eyeY - 0.7, eye * 1.18);
      mouth = renderMouth("oh", cx, mouthY, stroke * 0.8, ink);
      break;
    case "sad":
      eyes = pair("dot", eyeY + 0.6);
      mouth = (
        <path
          d={`M${cx - 3} ${mouthY + 1}q3 -2.8 6 0`}
          fill="none"
          stroke={ink}
          strokeWidth={stroke}
          strokeLinecap="round"
        />
      );
      // Brows add little under 20px; the frown and low eyes carry it there.
      if (tier !== "tiny") {
        extras.push(
          <path
            key="brows"
            d={`M${left - 2.2} ${eyeY - 2.4}l3.6 -1.3M${right + 2.2} ${eyeY - 2.4}l-3.6 -1.3`}
            fill="none"
            stroke={ink}
            strokeWidth={stroke * 0.8}
            strokeLinecap="round"
          />,
        );
      }
      break;
    case "thinking": {
      // Eyes up to one side, the mouth pushed aside; a thought rises where the shape has room.
      const lookX = 0.9;
      eyes = [
        renderEye("dot", left + lookX, eyeY - 0.9, eye, stroke, ink),
        renderEye("dot", right + lookX, eyeY - 0.9, eye, stroke, ink),
      ];
      mouth = (
        <path
          d={`M${cx + 0.2} ${mouthY + 0.3}h2.6`}
          fill="none"
          stroke={ink}
          strokeWidth={stroke}
          strokeLinecap="round"
        />
      );
      if (tier !== "tiny" && !pointed)
        extras.push(
          <g key="thought" data-orb-thought="" fill={ink}>
            <circle cx={right + 3.9} cy={eyeY - 4.2} r={0.7} />
            <circle cx={right + 5.6} cy={eyeY - 6.6} r={1} />
          </g>,
        );
      break;
    }
    case "reading":
      eyes = pair("dot", eyeY + 0.9, eye * 0.92);
      mouth = (
        <path
          d={`M${cx - 1.4} ${mouthY + 0.4}h2.8`}
          fill="none"
          stroke={ink}
          strokeWidth={stroke}
          strokeLinecap="round"
        />
      );
      break;
    case "talking":
      eyes = [
        renderEye("dot", left + 1, eyeY, eye, stroke, ink),
        renderEye("dot", right + 1, eyeY, eye, stroke, ink),
      ];
      mouth = (
        <g data-orb-mouth="">
          <ellipse cx={cx + 0.6} cy={mouthY + 0.3} rx={1.5 + stroke * 0.3} ry={1.2} fill={ink} />
        </g>
      );
      break;
    case "calm":
    case "sleepy": {
      // Closed eyes: a relaxed curve when calm, a flat line when asleep.
      const half = eye * 1.25;
      const dip = expression === "calm" ? half * 0.7 : 0;
      eyes = [left, right].map((x) => (
        <path
          key={x}
          d={`M${x - half} ${eyeY}q${half} ${dip} ${half * 2} 0`}
          fill="none"
          stroke={ink}
          strokeWidth={stroke}
          strokeLinecap="round"
        />
      ));
      if (expression === "calm") {
        mouth = (
          <path
            d={`M${cx - 2.4} ${mouthY - 0.4}q2.4 2.2 4.8 0`}
            fill="none"
            stroke={ink}
            strokeWidth={stroke}
            strokeLinecap="round"
          />
        );
      } else {
        mouth = <circle cx={cx} cy={mouthY + 0.6} r={0.9 + stroke * 0.2} fill={ink} />;
        // The "z" needs room: large faces only, where the shape is wide at the top.
        if (tier === "large" && !pointed)
          extras.push(
            <path
              key="z"
              data-orb-z=""
              d={`M${right + 2.4} ${eyeY - 6.4}h2.4l-2.4 2.4h2.4`}
              fill="none"
              stroke={ink}
              strokeWidth={stroke * 0.7}
              strokeLinecap="round"
              strokeLinejoin="round"
            />,
          );
      }
      break;
    }
    case "confused":
      eyes = [
        renderEye("dot", left, eyeY, eye, stroke, ink),
        renderEye("dot", right, eyeY + 0.3, eye * 0.72, stroke, ink),
      ];
      mouth = (
        <path
          d={`M${cx - 3} ${mouthY + 0.4}q1.5 -1.4 3 0t3 0`}
          fill="none"
          stroke={ink}
          strokeWidth={stroke * 0.9}
          strokeLinecap="round"
        />
      );
      if (tier !== "tiny")
        extras.push(
          <path
            key="brow"
            d={`M${left - 1.8} ${eyeY - 3.6}l3.4 -1.2`}
            fill="none"
            stroke={ink}
            strokeWidth={stroke * 0.8}
            strokeLinecap="round"
          />,
        );
      break;
    case "proud":
      eyes = pair("arc");
      mouth = renderMouth("grin", cx, mouthY, stroke, ink);
      if (tier !== "tiny")
        extras.push(
          <path
            key="sparkle"
            data-orb-sparkle=""
            d={`M${right + 3.6} ${eyeY - 6}l0.6 1.6l1.6 0.6l-1.6 0.6l-0.6 1.6l-0.6 -1.6l-1.6 -0.6l1.6 -0.6z`}
            fill={ink}
          />,
        );
      break;
    case "aha":
      eyes = pair("dot", eyeY - 0.5, eye * 1.22);
      mouth = renderMouth("oh", cx, mouthY, stroke * 0.8, ink);
      if (tier !== "tiny")
        extras.push(
          <g
            key="light"
            data-orb-light=""
            stroke={ink}
            strokeWidth={stroke * 0.7}
            strokeLinecap="round"
          >
            <path
              d={`M${cx} ${eyeY - 5.2}v-1.6M${cx - 3} ${eyeY - 4.4}l-1 -1M${cx + 3} ${eyeY - 4.4}l1 -1`}
            />
          </g>,
        );
      break;
    case "alert":
      eyes = pair("dot", eyeY - 0.6, eye * 1.3);
      mouth = renderMouth("oh", cx, mouthY + 0.2, stroke * 0.7, ink);
      if (tier !== "tiny")
        extras.push(
          <path
            key="brows"
            d={`M${left - 1.8} ${eyeY - 3.4}q1.8 -1.2 3.6 0M${right - 1.8} ${eyeY - 3.4}q1.8 -1.2 3.6 0`}
            fill="none"
            stroke={ink}
            strokeWidth={stroke * 0.75}
            strokeLinecap="round"
          />,
        );
      break;
    default:
      // Content: the seeded eyes and a soft smile; `smile` is the open grin.
      eyes = seededEyes();
      mouth = renderMouth("smile", cx, mouthY, stroke, ink);
  }
  return (
    <g
      transform={`rotate(${design.faceTilt} ${cx} ${cy}) translate(${cx} ${cy}) scale(${scale}) translate(${-cx} ${-cy})`}
    >
      <g data-orb-face="">
        {extras}
        <g data-orb-gaze="">
          <g data-orb-eyes="">
            {eyes[0]}
            {eyes[1]}
          </g>
        </g>
        {mouth}
      </g>
    </g>
  );
}

const artCache = new Map<string, React.ReactElement>();

/**
 * The drawn avatar (disc, body and face, or disc only when a glyph replaces
 * the face), memoized per seed and size tier. React elements are immutable,
 * so one tree is safely shared by every avatar of that seed.
 */
export function getAgentOrbArt(
  seed: string,
  size: number,
  withFace = true,
  options: { expression?: AgentOrbExpression; shape?: AgentOrbShape; palette?: number } = {},
): React.ReactElement {
  const tier = getAgentOrbTier(size);
  const { expression, shape = "circle", palette } = options;
  const variant =
    expression === undefined && shape === "circle" && palette === undefined
      ? ""
      : `${expression ?? "-"}|${shape}|${palette === undefined ? "-" : paletteIndex(palette)}|`;
  const key = `${tier}|${withFace ? "f" : "g"}|${variant}${seed}`;
  const cached = artCache.get(key);
  if (cached) return cached;
  const design = getAgentOrbDesign(seed, palette);
  const face = !withFace
    ? null
    : expression === undefined && shape === "circle"
      ? renderFace(design, tier)
      : renderExpressionFace(design, tier, expression ?? "idle", shape);
  const art = (
    <>
      <rect width={36} height={36} fill={design.background} />
      {withFace ? <g data-orb-body="">{renderBody(design)}</g> : null}
      {face && <g data-orb-face-wrap="">{face}</g>}
    </>
  );
  return remember(artCache, key, art);
}

/**
 * The shapes a border radius cannot draw, as a CSS `clip-path` in pixels for one size (a `path()`
 * does not scale), memoized per shape and size. Inline, so no clip ids and no `url()` references.
 */
const clipCache = new Map<string, string>();

/** Corners of each polygon in the 36-unit grid, and how much of each corner is rounded off. */
const POLYGONS: Partial<Record<AgentOrbShape, { points: Array<[number, number]>; cut: number }>> = {
  "rounded-triangle": {
    points: [
      [18, 1.5],
      [35, 33.5],
      [1, 33.5],
    ],
    cut: 6.5,
  },
  // Pointy top, so it never reads as a square or a circle at a glance.
  "rounded-hexagon": {
    points: [
      [18, 0.5],
      [33.4, 9.4],
      [33.4, 26.6],
      [18, 35.5],
      [2.6, 26.6],
      [2.6, 9.4],
    ],
    cut: 4.2,
  },
};

export function getAgentOrbClip(shape: AgentOrbShape, size: number): string | undefined {
  const polygon = POLYGONS[shape];
  if (!polygon) return undefined;
  const key = `${shape}|${size}`;
  const cached = clipCache.get(key);
  if (cached) return cached;
  const unit = size / 36;
  const fmt = (value: number) => Math.round(value * unit * 100) / 100;
  const { points, cut } = polygon;
  const at = (from: [number, number], to: [number, number]) => {
    const length = Math.hypot(to[0] - from[0], to[1] - from[1]);
    const ratio = cut / length;
    return [from[0] + (to[0] - from[0]) * ratio, from[1] + (to[1] - from[1]) * ratio] as const;
  };
  const segments = points.map((point, index) => {
    const previous = points[(index + points.length - 1) % points.length] as [number, number];
    const next = points[(index + 1) % points.length] as [number, number];
    const start = at(point, previous);
    const end = at(point, next);
    return `${index === 0 ? "M" : "L"}${fmt(start[0])} ${fmt(start[1])}Q${fmt(point[0])} ${fmt(point[1])} ${fmt(end[0])} ${fmt(end[1])}`;
  });
  const path = `path('${segments.join("")}Z')`;
  return remember(clipCache, key, path);
}

/**
 * `hover` (padrão) pisca uma vez ao passar o mouse ou focar o rosto ou o controle que o contém;
 * `live` balança e pisca devagar (agente em execução); `none` deixa parado. Com movimento reduzido
 * fica sempre parado.
 */
export type AgentOrbMotion = "hover" | "live" | "none";

export interface AgentOrbProps {
  /** Semente estável (id do agente): decide cor, corpo e rosto. A mesma semente dá sempre o mesmo rosto. */
  seed: string;
  /**
   * Nome do agente. Por padrão o rosto é decorativo (o texto ou controle ao lado nomeia o agente);
   * passe `labelled` quando o rosto aparece sozinho.
   */
  name?: string;
  /** Lado em px. Padrão 20. De 14 a 96 o desenho se ajusta (traço mais grosso nos pequenos). */
  size?: number;
  /** Expõe o rosto como imagem com o nome `name`, em vez de escondê-lo de leitores de tela. */
  labelled?: boolean;
  /** Substitui o rosto, ex.: um ícone de papel para um ajudante fixo. */
  glyph?: React.ReactNode;
  motion?: AgentOrbMotion;
  /** Silhueta; `circle` (padrão) é o disco clássico. As outras distinguem agentes que a pessoa cria. */
  shape?: AgentOrbShape;
  /**
   * O que o rosto mostra (ver `AGENT_ORB_EXPRESSIONS`). Sem ela, o rosto semeado, parado.
   * Trocar a expressão reinicia o movimento dela, então um humor de uma vez toca uma vez por troca.
   */
  expression?: AgentOrbExpression;
  /** Cor escolhida (índice em `AGENT_ORB_PALETTE`) no lugar da semeada. */
  palette?: number;
  /**
   * O que o agente segura enquanto trabalha: um ícone ou logo num selo no canto do rosto (busca,
   * terminal, o app que ele está usando). Só aparece de 24 px para cima; abaixo disso cobriria o rosto.
   */
  badge?: React.ReactNode;
  className?: string;
}

/** Olhares e humores que se repetem começam numa fase semeada, para uma lista nunca se mexer em coro. */
function motionPhase(seed: string): React.CSSProperties {
  const hash = hashAgentSeed(seed);
  return {
    "--orb-phase": `${-(Math.round((hash % 9973) / 10) / 100)}s`,
    "--orb-cycle": `${11 + ((hash >>> 8) % 7)}s`,
  } as React.CSSProperties;
}

const SHAPE_RADIUS: Record<AgentOrbShape, string> = {
  circle: "9999px",
  "rounded-square": "30%",
  "rounded-triangle": "0",
  "rounded-hexagon": "0",
};

/** Abaixo deste tamanho o selo cobriria o rosto. */
const BADGE_MIN_SIZE = 24;

/**
 * Rosto do agente: avatar gerado a partir de uma semente, com expressão do que o agente está
 * fazendo (pensando, lendo, trabalhando, esperando você) e movimento só em CSS. Use onde um agente
 * aparece como alguém: cabeçalho da conversa, lista de agentes, quem foi chamado, estado vazio.
 * Para a marca genérica de IA (sem identidade), use `AiMark`.
 */
export function AgentOrb({ seed, name, size = 20, labelled = false, glyph, motion = "hover", shape = "circle", expression, palette, badge, className }: AgentOrbProps) {
  const design = getAgentOrbDesign(seed, palette);
  const clip = getAgentOrbClip(shape, size);
  const hasGlyph = glyph !== undefined && glyph !== null && glyph !== false;
  const named = labelled && Boolean(name);
  const expressive = expression !== undefined && !hasGlyph;
  const effectiveMotion = hasGlyph || (expressive && SELF_MOVING_EXPRESSIONS.has(expression)) ? "none" : motion;
  const showBadge = badge != null && badge !== false && size >= BADGE_MIN_SIZE;
  const orb = (
    <span
      {...(named ? { role: "img", "aria-label": name } : { "aria-hidden": true })}
      data-agent-orb=""
      data-motion={effectiveMotion}
      {...(expressive ? { "data-expression": expression } : {})}
      {...(shape !== "circle" ? { "data-shape": shape } : {})}
      className={cn("relative inline-grid shrink-0 select-none place-items-center overflow-hidden leading-none", !showBadge && className)}
      style={{
        width: size,
        height: size,
        borderRadius: SHAPE_RADIUS[shape],
        color: design.ink,
        ...(clip ? { clipPath: clip } : {}),
        ...(expressive ? motionPhase(seed) : {}),
      }}
    >
      <svg
        viewBox="0 0 36 36"
        width={size}
        height={size}
        // Contêineres que dimensionam SVG de ícone (cabeçalhos, botões) não podem encolher o rosto.
        style={{ width: size, height: size, maxWidth: "none" }}
        aria-hidden="true"
        focusable="false"
        className="absolute inset-0"
      >
        {getAgentOrbArt(seed, size, !hasGlyph, { expression, shape, palette })}
      </svg>
      {hasGlyph ? <span className="relative inline-grid place-items-center">{glyph}</span> : null}
    </span>
  );
  if (!showBadge) return orb;
  const badgeSize = Math.round(Math.max(14, size * 0.42));
  return (
    <span className={cn("agent-orb-wrap", className)} style={{ width: size, height: size }}>
      {orb}
      <span className="agent-orb-badge" style={{ width: badgeSize, height: badgeSize }} aria-hidden="true">
        {badge}
      </span>
    </span>
  );
}

/**
 * Pilha de rostos sobrepostos: quem participa de uma conversa, de um time ou de uma tarefa. Mostra
 * até `max` rostos e resume o resto em "+N". `ringClassName` não é necessário: o anel que separa os
 * rostos usa a superfície; sobre outro fundo, passe `ring` com a cor (`var(--color-page)`).
 */
export function AgentOrbStack({
  agents,
  size = 24,
  max = 4,
  ring,
  label,
  className,
}: {
  agents: { seed: string; name?: string; shape?: AgentOrbShape; palette?: number; expression?: AgentOrbExpression }[];
  size?: number;
  max?: number;
  /** Cor do anel entre os rostos: a do fundo onde a pilha está. Padrão: superfície. */
  ring?: string;
  /** Nome acessível do grupo. Padrão: os nomes dos agentes, separados por vírgula. */
  label?: string;
  className?: string;
}) {
  const shown = agents.slice(0, max);
  const rest = agents.length - shown.length;
  const names = agents.map((a) => a.name).filter(Boolean).join(", ");
  return (
    <span role="img" aria-label={label ?? (names || `${agents.length} agentes`)} className={cn("agent-orb-stack inline-flex items-center", className)} style={{ "--orb-size": `${size}px`, ...(ring ? { "--orb-ring": ring } : {}) } as React.CSSProperties}>
      {shown.map((a) => (
        <AgentOrb key={a.seed} seed={a.seed} size={size} shape={a.shape} palette={a.palette} expression={a.expression} motion="none" />
      ))}
      {rest > 0 && (
        <span className="relative inline-grid shrink-0 place-items-center rounded-full bg-soft text-[10.5px] font-medium tabular-nums text-ink-soft" style={{ width: size, height: size, boxShadow: "0 0 0 2px var(--orb-ring, var(--ds-surface))" }} aria-hidden>
          +{rest}
        </span>
      )}
    </span>
  );
}
