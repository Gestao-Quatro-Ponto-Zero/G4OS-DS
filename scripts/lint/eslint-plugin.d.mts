// Tipos de @g4ai/ds/eslint (plugin ESLint 9, flat config).
import type { ESLint, Linter, Rule } from "eslint";

export type Preset = "recommended" | "strict" | "migration";

export interface ConfigOptions {
  /** Conjunto de regras. Padrão: "recommended". */
  preset?: Preset;
  /** Usa o leitor próprio do DS (projetos sem typescript-eslint/babel). Só as regras do G4OS-DS rodam. */
  standalone?: boolean;
  /** Globs dos arquivos. Padrão: js/jsx/ts/tsx/mjs/cjs/mts/cts. */
  files?: string[];
  /** Sobrescreve gravidades: { "g4os-ds/text-size": "off" }. */
  rules?: Linter.RulesRecord;
}

export declare const rules: Record<string, Rule.RuleModule>;
export declare const parser: Linter.Parser;
export declare const configs: Record<Preset | "all", Linter.Config>;
export declare function config(options?: ConfigOptions): Linter.Config;

declare const plugin: ESLint.Plugin & {
  rules: typeof rules;
  parser: typeof parser;
  configs: typeof configs;
  config: typeof config;
};
export default plugin;
