/*
 * DDDs de DF (1), cada um a união dos seus municípios, prontos para SVG.
 * Fontes: malha municipal do IBGE (via github.com/tbrugz/geodata-br, CC0) e DDD por
 * município de github.com/kelvins/municipios-brasileiros (MIT, Copyright (c) 2016
 * Kelvin S. do Prado). Arquivo gerado: não edite à mão. Para refazer:
 *   node scripts/data/build-geo-br-ddd.mjs <pasta com geojs-*-mun.json> <municipios.csv>
 * Carregue com `loadBrDdd("DF")` (lib/geo-maps).
 */
import type { BrDddShape } from "../../geo-maps";

export const viewBox = "0 0 1000 593";

export const ddds: readonly BrDddShape[] = [
  { id: "61", name: "DDD 61", municipios: 1, centroid: [500, 301], bbox: [8, 8, 992, 584], path: "M883 57l-1 0 0-49-787 0 0 127-19 1-14 17-3 11 1 16-7 25 2 19 8 3 14-2 11 11 2 10-1 19-8 15-11 13-7 5-2 6-4 1-4 15-4-2-1 2-2 0 0 2-9 1-9 6-1-1-13 18-5 14 1 4-2 2 3 6 0 7 2 1 2 12 3 2-1 3 2 7 4 3-5 10 3 1-3 3 2 3-2 1 1 5-1 2 7 6-3 10-4 1 0 9 9 2 4-4 5 1 7 7 1 10-2 2 1 6-9 14 2 7-1 9-3 4-2 9-8 14 3 12-1 9-3 8-3 2-2 14 975-1 0-3 1-2-2-2 2-2-3-1 2-5-10 0-1-2 3-3-4-1-1-5-2 0 0 3-1 0-3-1 0-2-2-1 0-3-4-1-1-4-4 2-1-5 3-2-8-1 0-3-3 0 1-2-13 1 1-2-6-2 1-3-5 1 0-8-3 0-1-7-3-1 1-4 3-2-5-2 1-4-2-1 3-3-2-2 2-1 1-2-3-4 5-2-2-4 4-1 0-9 3-1-2-4 1-2-3-1 2-2-4-1 10-3-1-4 1 2 2 0-1-3 2-4-2-6-4 2-2-4 3-4-2-4 3-1-9-2 2-7-5-4 0-10-2 0 2-4-4-1 6-2 2-6-1-2 2 0-1-3 2-5-3-1 4-3-1-6 3-1-1-5-2-1 1-1 1-6-2 0 4-4-1-2 2 1 1-3-2-6 4-2 1-3 2-1-1-2 3 3 0-2 3 0-1-2 3-3-1-2 2-1-1-2 3-5 2 0-2-4 3-1 3-7 2 1 0-3 2 1 0-4 5-11 4-1 0-6 3-3-2-4 2-2 1 1 3-9 3-1-2-3 4 1 1-9 3 1 1-2 0-7-1-3-3 0 0-3-2 0 0-3 2-1-3-9 5-5 0-4 3-5-2-8 2-4-5-3-3-6-2 2-6-1-3-6 4-9 0-7-1-2 2-3-3-6 2-3-1-3 2-2-4-4 0-11-3-4 11-34 6-2 0-2-1-6-5-2-4 3-4-2-4 0-14-8-6-1-3 3-6-4-7 2-4-2-6-5-1-6-9 0-3-8-7-4 2-4-7-6-8 2z" },
];
