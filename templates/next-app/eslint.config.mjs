// Regras do G4OS-DS no editor e no `pnpm lint` (as mesmas do `pnpm ds:audit`).
// Quer também as regras do Next/TypeScript? Adicione eslint-config-next ou typescript-eslint
// e troque o bloco abaixo por g4osDs.configs.recommended no fim do array.
import g4osDs from "@g4ai/ds/eslint";

export default [
  { ignores: [".next/**", "node_modules/**", "next-env.d.ts"] },
  g4osDs.config({ preset: "recommended", standalone: true }),
];
