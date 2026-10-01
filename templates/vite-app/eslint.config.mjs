// Regras do G4OS-DS no editor e no `pnpm lint` (as mesmas do `pnpm ds:audit`).
// Usa typescript-eslint? Troque o bloco por g4osDs.configs.recommended no fim do array.
import g4osDs from "@g4ai/ds/eslint";

export default [
  { ignores: ["dist/**", "node_modules/**"] },
  g4osDs.config({ preset: "recommended", standalone: true }),
];
