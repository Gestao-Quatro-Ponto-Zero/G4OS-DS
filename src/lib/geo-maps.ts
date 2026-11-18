/*
 * Mapas além das 27 UFs, carregados sob demanda (cada um vira um pedaço do
 * bundle e só desce quando a tela pede):
 *   · loadWorldCountries(): os países do mundo (Equal Earth) e o recorte de
 *     cada continente
 *   · loadBrMunicipios(uf): os municípios de uma UF, com o código IBGE como id
 *   · loadBrDdd(uf): as regiões de DDD de uma UF, com o DDD como id
 * As formas servem direto ao ChoroplethMap (`regions` e `viewBox`).
 * Dados em src/lib/geo-data, gerados pelos scripts de scripts/data.
 */
import type { BrUfId } from "./geo-br";

/** Uma região desenhável: contorno SVG, centróide e caixa da maior parte. */
export type GeoShape = {
  id: string;
  name: string;
  /** Caminho SVG; várias partes (ilhas) com fill-rule="evenodd". */
  path: string;
  centroid: readonly [number, number];
  /** [x0, y0, x1, y1] da maior parte (a França sem a Guiana). */
  bbox: readonly [number, number, number, number];
};

/** Continentes do mapa-múndi (a Rússia fica na Europa; Turquia e Cáucaso, na Ásia). */
export type WorldContinent = "África" | "América do Norte" | "América do Sul" | "Ásia" | "Europa" | "Oceania";
export const worldContinents: readonly WorldContinent[] = ["África", "América do Norte", "América do Sul", "Ásia", "Europa", "Oceania"];

/** Um país: id ISO 3166-1 alfa-2 ("BR"), nome em português e continente. */
export type WorldCountry = GeoShape & { continent: WorldContinent };

export type WorldMap = {
  viewBox: string;
  countries: readonly WorldCountry[];
  /** viewBox que enquadra cada continente (use como `viewBox` do mapa). */
  continentViewBoxes: Readonly<Record<WorldContinent, string>>;
};

/** Países do mundo (Natural Earth 1:50m, sem a Antártida). Cerca de 20 KB com gzip. */
export async function loadWorldCountries(): Promise<WorldMap> {
  const m = await import("./geo-data/world");
  return { viewBox: m.worldViewBox, countries: m.worldCountries, continentViewBoxes: m.continentViewBoxes };
}

export type BrMunicipiosMap = { uf: BrUfId; viewBox: string; municipios: readonly GeoShape[] };

type MunModule = { viewBox: string; municipios: readonly GeoShape[] };
// Um import literal por UF: o bundler separa cada uma no seu pedaço.
const MUNICIPIOS: Record<BrUfId, () => Promise<MunModule>> = {
  AC: () => import("./geo-data/br-mun/AC"),
  AL: () => import("./geo-data/br-mun/AL"),
  AM: () => import("./geo-data/br-mun/AM"),
  AP: () => import("./geo-data/br-mun/AP"),
  BA: () => import("./geo-data/br-mun/BA"),
  CE: () => import("./geo-data/br-mun/CE"),
  DF: () => import("./geo-data/br-mun/DF"),
  ES: () => import("./geo-data/br-mun/ES"),
  GO: () => import("./geo-data/br-mun/GO"),
  MA: () => import("./geo-data/br-mun/MA"),
  MG: () => import("./geo-data/br-mun/MG"),
  MS: () => import("./geo-data/br-mun/MS"),
  MT: () => import("./geo-data/br-mun/MT"),
  PA: () => import("./geo-data/br-mun/PA"),
  PB: () => import("./geo-data/br-mun/PB"),
  PE: () => import("./geo-data/br-mun/PE"),
  PI: () => import("./geo-data/br-mun/PI"),
  PR: () => import("./geo-data/br-mun/PR"),
  RJ: () => import("./geo-data/br-mun/RJ"),
  RN: () => import("./geo-data/br-mun/RN"),
  RO: () => import("./geo-data/br-mun/RO"),
  RR: () => import("./geo-data/br-mun/RR"),
  RS: () => import("./geo-data/br-mun/RS"),
  SC: () => import("./geo-data/br-mun/SC"),
  SE: () => import("./geo-data/br-mun/SE"),
  SP: () => import("./geo-data/br-mun/SP"),
  TO: () => import("./geo-data/br-mun/TO"),
};

/**
 * Municípios de uma UF (malha do IBGE; id = código de 7 dígitos). De 1 KB (DF)
 * a cerca de 55 KB (MG) com gzip.
 */
export async function loadBrMunicipios(uf: BrUfId): Promise<BrMunicipiosMap> {
  const m = await MUNICIPIOS[uf]();
  return { uf, viewBox: m.viewBox, municipios: m.municipios };
}

/** Uma região de DDD: id = o DDD ("11"), nome "DDD 11" e quantos municípios ela junta. */
export type BrDddShape = GeoShape & { municipios: number };

export type BrDddMap = { uf: BrUfId; viewBox: string; ddds: readonly BrDddShape[] };

type DddModule = { viewBox: string; ddds: readonly BrDddShape[] };
const DDDS: Record<BrUfId, () => Promise<DddModule>> = {
  AC: () => import("./geo-data/br-ddd/AC"),
  AL: () => import("./geo-data/br-ddd/AL"),
  AM: () => import("./geo-data/br-ddd/AM"),
  AP: () => import("./geo-data/br-ddd/AP"),
  BA: () => import("./geo-data/br-ddd/BA"),
  CE: () => import("./geo-data/br-ddd/CE"),
  DF: () => import("./geo-data/br-ddd/DF"),
  ES: () => import("./geo-data/br-ddd/ES"),
  GO: () => import("./geo-data/br-ddd/GO"),
  MA: () => import("./geo-data/br-ddd/MA"),
  MG: () => import("./geo-data/br-ddd/MG"),
  MS: () => import("./geo-data/br-ddd/MS"),
  MT: () => import("./geo-data/br-ddd/MT"),
  PA: () => import("./geo-data/br-ddd/PA"),
  PB: () => import("./geo-data/br-ddd/PB"),
  PE: () => import("./geo-data/br-ddd/PE"),
  PI: () => import("./geo-data/br-ddd/PI"),
  PR: () => import("./geo-data/br-ddd/PR"),
  RJ: () => import("./geo-data/br-ddd/RJ"),
  RN: () => import("./geo-data/br-ddd/RN"),
  RO: () => import("./geo-data/br-ddd/RO"),
  RR: () => import("./geo-data/br-ddd/RR"),
  RS: () => import("./geo-data/br-ddd/RS"),
  SC: () => import("./geo-data/br-ddd/SC"),
  SE: () => import("./geo-data/br-ddd/SE"),
  SP: () => import("./geo-data/br-ddd/SP"),
  TO: () => import("./geo-data/br-ddd/TO"),
};

/**
 * Regiões de DDD de uma UF: cada uma é a união dos seus municípios, no mesmo
 * viewBox de `loadBrMunicipios(uf)`. Um DDD que cruza a divisa aparece nas
 * duas UFs (61: DF e entorno de GO). De 1 a 5 KB com gzip.
 */
export async function loadBrDdd(uf: BrUfId): Promise<BrDddMap> {
  const m = await DDDS[uf]();
  return { uf, viewBox: m.viewBox, ddds: m.ddds };
}
