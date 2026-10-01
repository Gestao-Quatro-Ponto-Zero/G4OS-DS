// ESLint do próprio DS: TypeScript, regras de hooks, acessibilidade (jsx-a11y) e o plugin
// do G4OS-DS (o mesmo que o pacote entrega em @g4ai/ds/eslint). `npm run lint`.
// Regra desligada aqui precisa de motivo escrito ao lado.
import js from "@eslint/js";
import jsxA11y from "eslint-plugin-jsx-a11y";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";
import g4osDs from "./scripts/lint/eslint-plugin.mjs";

export default tseslint.config(
  { ignores: ["node_modules/**", "dist/**", "showcase/dist/**", "showcase/.generated/**", "ai/**", "templates/**/node_modules/**", "templates/**/.next/**", "scripts/lint/__fixtures__/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: { globals: { ...globals.browser } },
    plugins: { "react-hooks": reactHooks, "jsx-a11y": jsxA11y },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      ...jsxA11y.flatConfigs.recommended.rules,
      // Base UI e nossos componentes repassam foco/teclado por props; o plugin não enxerga isso.
      "jsx-a11y/no-autofocus": "off", // busca, paleta e diálogos focam o campo ao abrir (padrão esperado de combobox/diálogo)
      "jsx-a11y/label-has-associated-control": "off", // FieldBlock liga htmlFor/id em tempo de execução; coberto por g4os-ds/field-label
      "jsx-a11y/click-events-have-key-events": "off", // coberto por g4os-ds/clickable-div, que entende foco delegado (focus(), stopPropagation, widgets compostos)
      "jsx-a11y/no-static-element-interactions": "off", // idem
      "jsx-a11y/no-noninteractive-element-interactions": "off", // idem (li/tr com teclado próprio, ex.: DataGrid)
      // Separador redimensionável (aria-valuenow), gráfico navegável por setas, carrossel e região rolável
      // são focáveis por especificação (WAI-ARIA, axe scrollable-region-focusable).
      "jsx-a11y/no-noninteractive-tabindex": ["error", { roles: ["tabpanel", "separator", "group", "region"], tags: [], allowExpressionValues: true }],
      "jsx-a11y/aria-role": ["error", { ignoreNonDOM: true }], // `role` em componentes do DS é prop (ex.: papel da mensagem no chat: user/assistant)
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
  {
    rules: {
      // `{ omitido: _x, ...resto }` é o jeito de tirar uma chave de um objeto
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrors: "none", ignoreRestSiblings: true }],
    },
  },
  {
    // Demos do site: links ilustrativos sem destino real (o clique não deve sair da página de doc).
    files: ["showcase/pages/**/*.tsx"],
    rules: { "jsx-a11y/anchor-is-valid": "off" },
  },
  {
    files: ["**/*.{mjs,cjs,js}"],
    languageOptions: { globals: { ...globals.node } },
  },
  // Regras do próprio DS (dogfooding do plugin publicado). CSS e HTML ficam com `npm run audit:self`.
  { ...g4osDs.configs.recommended, files: ["src/**/*.{ts,tsx}", "showcase/**/*.{ts,tsx}", "templates/**/*.{ts,tsx}"] },
);
