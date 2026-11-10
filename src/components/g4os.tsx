"use client";

import { useId, type CSSProperties, type ElementType, type ReactNode } from "react";
import { cn } from "../lib/cn";

/*
 * Identidade G4 OS (KV G4 OS): a esfera, o logotipo, o gradiente de marca,
 * o orb e os três pontos da IA. Cores sempre por var(--ds-…), então tudo
 * acompanha o tema escuro e as marcas. Regras em docs/fundamentos/marca.md.
 */

const SYMBOL_A = "M3201.43 3196.73L3201.93 3192.53C3202.03 3191.65 3201.28 3190.9 3200.39 3191.02L3196.27 3191.57C3177.42 3175.37 3148.89 3176.18 3131.04 3194.04C3113.18 3211.9 3112.37 3240.43 3128.57 3259.27C3130.65 3261.58 3132.37 3263.3 3133.73 3264.43C3152.58 3280.63 3181.11 3279.82 3198.96 3261.96C3216.82 3244.11 3217.63 3215.57 3201.43 3196.73ZM3191.11 3196.74L3189.53 3198.31C3185.32 3202.52 3178.69 3203.08 3173.85 3199.62C3166.43 3194.31 3158.82 3190.84 3151.88 3189.44C3165.01 3185 3179.98 3187.43 3191.11 3196.74ZM3126.15 3215.8C3127.11 3211.98 3130.09 3207.56 3133.25 3205.21C3133.67 3202.81 3134.64 3200.75 3136.19 3199.2C3141.83 3193.56 3153.85 3195.59 3165.99 3203.16C3171.87 3206.82 3172.87 3214.98 3167.97 3219.88L3148.24 3239.61L3145.23 3242.76L3143.07 3244.76L3133.74 3254.1C3124.64 3243.23 3122.12 3228.7 3126.15 3215.79V3215.8ZM3195.34 3254.81C3194.85 3255.88 3192.95 3258.18 3192.06 3258.92C3191.23 3259.89 3187.49 3262.96 3183.49 3264.63C3181.78 3265.38 3178.36 3266.45 3178.12 3266.56C3164.99 3271 3150.02 3268.57 3138.89 3259.26L3148.23 3249.93L3150.51 3247.49L3153.39 3244.76L3173.12 3225.03C3178.02 3220.13 3186.18 3221.13 3189.84 3227.01C3197.41 3239.16 3198.71 3247.58 3195.34 3254.81ZM3193.38 3219.15C3189.92 3214.31 3190.48 3207.68 3194.69 3203.47L3196.26 3201.89C3205.57 3213.02 3208 3227.99 3203.56 3241.12C3202.16 3234.18 3198.69 3226.57 3193.38 3219.15Z";
const SYMBOL_B = "M3185.55 3263.64C3190.12 3261.02 3195.43 3257 3196.64 3251.43C3196.18 3253.56 3195.23 3255.38 3193.81 3256.79C3186.52 3264.09 3168.53 3258.54 3153.4 3244.75C3153.4 3244.75 3152.81 3244.2 3151.14 3242.45L3148.24 3239.59C3135.87 3226.02 3130.15 3210.15 3134.36 3201.77C3133.24 3198.97 3132.4 3196.08 3131.94 3193.17C3131.64 3193.46 3131.34 3193.73 3131.05 3194.03C3129.26 3195.81 3124.64 3201.19 3123.32 3204.12L3124.17 3206.76C3124.17 3206.76 3126.55 3214.48 3126.5 3215.07C3128.43 3224.46 3134.15 3235.06 3143.08 3244.76L3145.57 3247.27C3147.09 3248.69 3148.24 3249.91 3148.24 3249.91C3158.01 3258.91 3168.68 3264.67 3178.12 3266.56C3178.09 3266.56 3180.9 3266.01 3185.55 3263.65V3263.64Z";
const WORD_G = "M1054.66 3269C1032.06 3269 1015 3251.59 1015 3228.5C1015 3201.9 1034.96 3188 1054.66 3188C1072.08 3188 1088.71 3199.75 1091.71 3213.89H1074.27C1071.7 3208.32 1064.64 3202.59 1054.66 3202.59C1039.52 3202.59 1030.45 3215.76 1030.45 3228.5C1030.45 3243.52 1041.17 3254.41 1055.91 3254.41C1072.15 3254.41 1076.91 3241.24 1077.72 3238.59L1078.09 3237.31H1055.49L1063.18 3222.82H1092.79C1093.1 3224.64 1093.41 3228.31 1093.41 3231.15C1093.41 3242.95 1089.16 3252.8 1081.16 3259.67C1074.22 3265.61 1064.57 3269 1054.66 3269Z";
const WORD_4 = "M1141 3267.86V3251.26H1101.59V3240.98L1129.11 3189.16H1146.14L1120.31 3237.81H1141V3218.79H1156.01V3237.81H1164.5V3251.26H1156.01V3267.86H1141Z";
const WORD_O = "M1219.67 3267.86C1212.26 3267.86 1206.07 3266.21 1201.12 3262.89C1196.16 3259.57 1192.46 3254.98 1189.98 3249.13C1187.51 3243.28 1186.25 3236.55 1186.25 3228.93C1186.25 3221.3 1187.51 3214.57 1189.98 3208.72C1192.46 3202.87 1196.19 3198.28 1201.12 3194.96C1206.07 3191.65 1212.26 3189.99 1219.67 3189.99C1227.07 3189.99 1233.26 3191.65 1238.21 3194.96C1243.17 3198.28 1246.87 3202.87 1249.35 3208.72C1251.83 3214.57 1253.08 3221.3 1253.08 3228.93C1253.08 3236.55 1251.83 3243.28 1249.35 3249.13C1246.87 3254.98 1243.14 3259.57 1238.21 3262.89C1233.26 3266.21 1227.07 3267.86 1219.67 3267.86ZM1219.67 3263.48C1226.04 3263.48 1231.37 3262.01 1235.62 3259.05C1239.86 3256.09 1243.07 3252.02 1245.22 3246.83C1247.37 3241.64 1248.43 3235.68 1248.43 3228.93C1248.43 3222.18 1247.37 3216.21 1245.22 3211C1243.07 3205.79 1239.89 3201.71 1235.62 3198.78C1231.37 3195.84 1226.04 3194.37 1219.67 3194.37C1213.3 3194.37 1207.99 3195.84 1203.76 3198.78C1199.54 3201.71 1196.35 3205.79 1194.23 3211C1192.08 3216.21 1191 3222.18 1190.93 3228.93C1190.86 3235.68 1191.89 3241.64 1194.04 3246.83C1196.19 3252.02 1199.4 3256.09 1203.69 3259.05C1207.99 3262.01 1213.32 3263.48 1219.69 3263.48H1219.67Z";
const WORD_S = "M1288.14 3267.86C1283.11 3267.86 1278.58 3267.03 1274.57 3265.4C1270.56 3263.77 1267.23 3261.42 1264.59 3258.41C1261.95 3255.41 1260.18 3251.83 1259.28 3247.71L1263.62 3246.88C1264.97 3251.99 1267.82 3256.04 1272.21 3259.03C1276.6 3262.01 1281.91 3263.48 1288.14 3263.48C1292.48 3263.48 1296.28 3262.79 1299.51 3261.4C1302.75 3260.02 1305.27 3258.06 1307.06 3255.55C1308.86 3253.04 1309.75 3250.1 1309.75 3246.74C1309.75 3244.2 1309.28 3242.09 1308.36 3240.41C1307.44 3238.73 1306.24 3237.33 1304.82 3236.29C1303.38 3235.23 1301.9 3234.4 1300.34 3233.78C1298.78 3233.17 1297.41 3232.67 1296.21 3232.34L1277.59 3226.72C1274.9 3225.92 1272.59 3224.95 1270.63 3223.81C1268.67 3222.67 1267.09 3221.37 1265.84 3219.93C1264.59 3218.48 1263.67 3216.87 1263.08 3215.14C1262.47 3213.41 1262.18 3211.57 1262.18 3209.58C1262.18 3205.76 1263.2 3202.38 1265.25 3199.42C1267.3 3196.46 1270.16 3194.13 1273.82 3192.45C1277.47 3190.77 1281.7 3189.94 1286.49 3189.94C1291.28 3189.94 1295.71 3190.84 1299.58 3192.64C1303.45 3194.44 1306.61 3196.98 1309.07 3200.24C1311.52 3203.51 1313.08 3207.35 1313.69 3211.76L1309.35 3212.58C1308.88 3208.96 1307.58 3205.76 1305.53 3203.02C1303.48 3200.27 1300.79 3198.14 1297.51 3196.6C1294.23 3195.08 1290.57 3194.32 1286.49 3194.32C1282.41 3194.32 1279.17 3194.99 1276.22 3196.34C1273.27 3197.69 1270.96 3199.51 1269.31 3201.78C1267.66 3204.06 1266.83 3206.64 1266.83 3209.46C1266.83 3212.44 1267.64 3214.81 1269.24 3216.59C1270.84 3218.36 1272.8 3219.76 1275.11 3220.73C1277.43 3221.73 1279.62 3222.53 1281.75 3223.15L1297.15 3227.81C1298.47 3228.19 1300.06 3228.76 1301.97 3229.49C1303.85 3230.23 1305.74 3231.29 1307.58 3232.69C1309.42 3234.09 1310.96 3235.91 1312.18 3238.16C1313.41 3240.44 1314.02 3243.28 1314.02 3246.71C1314.02 3249.93 1313.41 3252.85 1312.21 3255.43C1311 3258.03 1309.26 3260.24 1306.99 3262.08C1304.73 3263.93 1301.99 3265.33 1298.83 3266.32C1295.67 3267.32 1292.1 3267.79 1288.16 3267.79L1288.14 3267.86Z";

/**
 * Esfera G4 OS: o símbolo da IA. `live` faz a esfera girar e recalcular
 * (estado "pensando"); parada, é a marca do assistente.
 */
export function G4OSSymbol({ size = 32, live = false, title, className }: { size?: number; live?: boolean; title?: string; className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg
      width={size}
      height={size}
      viewBox="3117 3180 96 96"
      fill="none"
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      className={cn("shrink-0", className)}
    >
      <defs>
        <linearGradient id={`${id}a`} x1="3190" y1="3184.69" x2="3140.99" y2="3269.59" gradientUnits="userSpaceOnUse">
          <stop offset="0.65" style={{ stopColor: "var(--ds-ink-soft)" }} />
          <stop offset="0.84" style={{ stopColor: "var(--ds-mark-steel)", stopOpacity: 0.35 }} />
          <stop offset="1" style={{ stopColor: "var(--ds-mark-gold)", stopOpacity: 0 }} />
        </linearGradient>
        <linearGradient id={`${id}b`} x1="3123.42" y1="3201.65" x2="3186.38" y2="3264.61" gradientUnits="userSpaceOnUse">
          <stop offset="0" style={{ stopColor: "var(--ds-ink-soft)" }} />
          <stop offset="0.52" style={{ stopColor: "var(--ds-mark-steel)", stopOpacity: 0.89 }} />
          <stop offset="1" style={{ stopColor: "var(--ds-mark-gold)", stopOpacity: 0 }} />
        </linearGradient>
      </defs>
      <g className={live ? "ds-symbol-live" : undefined} style={{ transformBox: "fill-box" }}>
        <path d={SYMBOL_A} fill={`url(#${id}a)`} />
        <path d={SYMBOL_B} fill={`url(#${id}b)`} />
      </g>
    </svg>
  );
}

/**
 * Logotipo G4 OS: "G4" na tinta e "OS" fino no gradiente dourado → aço.
 * `symbol` põe a esfera antes. A altura define o tamanho; a largura segue.
 */
export function G4OSLogo({ height = 24, symbol = false, title = "G4 OS", className }: { height?: number; symbol?: boolean; title?: string; className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <span className={cn("inline-flex shrink-0 items-center", className)} style={{ gap: height * 0.36 }} role="img" aria-label={title}>
      {symbol && <G4OSSymbol size={height * 1.05} />}
      <svg height={height} viewBox="1013 3186 336 85" fill="none" aria-hidden style={{ width: "auto" }}>
        <defs>
          <linearGradient id={`${id}o`} x1="1200" y1="3186" x2="1240" y2="3290" gradientUnits="userSpaceOnUse">
            <stop offset="0" style={{ stopColor: "var(--ds-mark-gold)" }} />
            <stop offset="0.6" style={{ stopColor: "var(--ds-mark-steel)" }} />
            <stop offset="1" style={{ stopColor: "var(--ds-mark-mist)" }} />
          </linearGradient>
        </defs>
        <path d={WORD_G} style={{ fill: "var(--ds-ink)" }} />
        <path d={WORD_4} style={{ fill: "var(--ds-ink)" }} />
        <path d={WORD_O} fill={`url(#${id}o)`} />
        <path d={WORD_S} fill={`url(#${id}o)`} />
      </svg>
    </span>
  );
}

/** Texto no gradiente de marca do KV. Só em título de momento, um por tela. */
export function GradientText({ as, children, className }: { as?: ElementType; children: ReactNode; className?: string }) {
  const Tag = as ?? "span";
  return <Tag className={cn("ds-gradient-text", className)}>{children}</Tag>;
}

/**
 * Orb: a esfera da IA desfocada atrás do conteúdo (saudação, capa, login).
 * Decorativo. Posicione com `className`/`style` (absolute) num pai `relative`.
 */
export function AiOrb({ size = 420, blur = 8, live = false, className, style }: { size?: number; blur?: number; live?: boolean; className?: string; style?: CSSProperties }) {
  return (
    <div
      aria-hidden
      data-live={live || undefined}
      className={cn("ds-orb", className)}
      style={{ width: size, height: size, ["--orb-blur" as string]: `${blur}px`, ...style }}
    />
  );
}

/** Névoa quente do KV, atrás de momentos de marca claros. Decorativa. */
export function BrandHaze({ size = 760, className, style }: { size?: number; className?: string; style?: CSSProperties }) {
  return <div aria-hidden className={cn("ds-haze", className)} style={{ width: size, height: size, ...style }} />;
}

/** Os três pontos da IA (navy, céu, gelo azul). `live` anima. */
export function AiDots({ size = 6, gap, live = true, className }: { size?: number; gap?: number; live?: boolean; className?: string }) {
  const dot = cn("rounded-full", live && "ds-thinking-dot");
  return (
    <span aria-hidden className={cn("inline-flex items-center", className)} style={{ gap: gap ?? size * 0.8 }}>
      <span className={cn(dot, "bg-ink-soft")} style={{ width: size, height: size }} />
      <span className={cn(dot, "bg-ai-accent")} style={{ width: size, height: size }} />
      <span className={cn(dot, "bg-ai-accent-soft")} style={{ width: size, height: size }} />
    </span>
  );
}

/**
 * Saudação da IA no tom do KV: três pontos, o nome no gradiente de marca e a
 * pergunta em navy com a última palavra esmaecendo. É o momento de marca da
 * tela inicial; não use junto de outro BrandPanel.
 */
export function AiGreeting({
  name,
  greeting = "Olá",
  question = "qual decisão você precisa tomar hoje?",
  description,
  align = "start",
  size = "lg",
  level = 1,
  className,
}: {
  /** Nível do título: 1 na tela inicial, 2 quando a tela já tem um h1. */
  level?: 1 | 2;
  name?: ReactNode;
  greeting?: ReactNode;
  question?: string;
  description?: ReactNode;
  align?: "start" | "center";
  size?: "md" | "lg";
  className?: string;
}) {
  const words = question.trim().split(/\s+/);
  const tail = words.length > 2 ? words.pop() : undefined;
  const H = level === 2 ? "h2" : "h1";
  return (
    <header className={cn("flex flex-col gap-5", align === "center" && "items-center text-center", className)}>
      <AiDots size={size === "lg" ? 10 : 8} live={false} gap={size === "lg" ? 18 : 12} />
      <H
        className={cn("m-0 text-balance font-medium", size === "lg" ? "text-[30px] leading-[1.25] sm:text-[44px] sm:leading-[1.2]" : "text-[25px] leading-[1.3] sm:text-[30px]")}
        style={{ fontFamily: "var(--ds-font-display)", letterSpacing: "-0.03em" }}
      >
        <span className="ds-gradient-text">
          {greeting}
          {name ? <> {name}</> : null},
        </span>{" "}
        <span className="text-ink-soft">{words.join(" ")}</span>
        {tail && <span className="text-blue"> {tail}</span>}
      </H>
      {description && <p className="m-0 max-w-[560px] text-[14px] leading-relaxed text-muted">{description}</p>}
    </header>
  );
}
