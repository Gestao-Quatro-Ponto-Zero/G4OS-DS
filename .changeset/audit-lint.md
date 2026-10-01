---
"@g4ai/ds": minor
---

Auditoria e lint de boas práticas, do terminal ao editor e ao CI.

- **31 regras em 9 categorias** (tokens, tipografia, acessibilidade, formatação pt-BR, componentes, React, imports, segurança, performance), num motor só (`scripts/lint/`) usado pelo CLI, pelo plugin ESLint e pela tool `audit` do MCP. Novas: `arbitrary-radius`, `arbitrary-shadow`, `z-index`, `img-alt`, `field-label`, `clickable-div`, `outline-none`, `positive-tabindex`, `locale-missing`, `date-format`, `effect-return`, `deep-import`, `deprecated-export`, `target-blank`, `dangerous-html`, `icon-star-import`, `as-any-props` e, no preset `strict`, `tailwind-text-scale` e `z-index-token`. Menos falso positivo: texto em `<code>`, exemplos em template literal e `var(--token, fallback)` não contam mais.
- **`g4os-ds audit`**: `--fix` (trocas seguras: `bg-white`→`bg-surface`, `text-gray-500`→`text-muted`, shadcn→DS, `rounded-[12px]`→`rounded-card`, `rel="noopener"`, imports internos e nomes renomeados), `--changed`/`--staged`/`--since`, `--baseline`/`--update-baseline` (só achado novo falha), `--format pretty|json|markdown|sarif|github`, `--preset`, `--rule`, `--max-warnings`, config `g4os-ds.config.json` (com JSON Schema) ou `package.json#"g4os-ds"`, `overrides` por pasta. Exit code 2 para erro de uso/config.
- **`g4os-ds init`**: cria config, scripts `ds:*` e o workflow de CI (anotações no PR + SARIF); `--eslint`, `--hook lefthook|husky|simple-git-hooks`, `--baseline`, `--dry-run`. Nunca sobrescreve sem `--force`.
- **`g4os-ds doctor`**: ordem dos imports CSS, integração do Tailwind v4 (PostCSS/Vite), React duplicado, versões dos peers, `themeScript`, `suppressHydrationWarning`, `transpilePackages` desnecessário; `--format github|sarif|json|markdown`.
- **Plugin ESLint 9** em `@g4ai/ds/eslint` (`configs.recommended|strict|migration`, `config({ standalone: true })` para projetos sem parser de TS), com tipos. ESLint é dependência opcional.
- Ignorar com motivo: `// g4os-ds-disable-next-line <regra> -- motivo`, `-line`, `disable`/`enable`, `-file` (a sintaxe `ds-audit-ignore` continua valendo).
- Tool `audit` do MCP: `format`, `preset`, `severity`, `rule`, `changed`, `since`; achados com `fixable` e `replacement`.
- Starter `templates/next-app` com `g4os-ds.config.json`, `eslint.config.mjs` e scripts `lint`/`ds:*`.

Como migrar: nada obrigatório. O `audit` agora pega mais coisas (e `icon-button-label` virou erro); para não travar o CI de um projeto em andamento, rode `npx g4os-ds init --baseline` (ou `npx g4os-ds audit --baseline`) e `npx g4os-ds audit --fix`.
