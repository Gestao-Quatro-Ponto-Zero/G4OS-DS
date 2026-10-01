# Contribuindo com o G4OS-DS

Obrigado por querer melhorar o design system. Este guia cobre o fluxo; o passo a passo técnico (contratos de componente, bloco e página do showcase) está em [`docs/guias/contribuir.md`](docs/guias/contribuir.md).

## Antes de abrir um PR

1. **Já existe?** Procure no [site](https://gestao-quatro-ponto-zero.github.io/G4OS-DS/) (⌘K) e em `src/index.ts`.
2. **É reutilizável?** Componente entra no DS quando serve (ou vai servir) a 2+ produtos. Composição específica de um app vira **bloco** ou fica no app.
3. **Mudança grande?** Abra uma issue antes (modelo "Novo componente" ou "Mudança no DS") para alinhar API e visual.

## Ambiente

```bash
git clone https://github.com/Gestao-Quatro-Ponto-Zero/G4OS-DS.git
cd G4OS-DS
npm ci
npm run showcase:watch      # recompila o site a cada mudança
npx serve showcase/dist     # em outro terminal: abre o site local
```

Requisitos: Node 20+ (o CI usa Node 24). Para testar uma mudança num app antes de publicar, veja [Testar num app antes de publicar](docs/guias/contribuir.md#testar-num-app-antes-de-publicar).

## Fluxo

1. Crie um branch a partir de `main`: `feat/data-grid-colunas`, `fix/gauge-rotulos`, `docs/filtros`.
2. Faça a mudança seguindo as [regras do DS](AGENTS.md) — tokens semânticos, pt-BR, acessibilidade, claro **e** escuro.
3. Documente: todo componente novo ganha página no showcase (`showcase/pages/*.tsx`) com exemplo vivo, código, props e regras.
4. Rode a verificação completa:
   ```bash
   npm run check     # tokens + typecheck + referências de IA + auditoria do próprio DS
   npm run build     # compila dist/
   ```
5. Registre a mudança para o changelog:
   ```bash
   npx changeset     # escolha patch (correção), minor (novo componente/prop) ou major (quebra)
   ```
6. Abra o PR preenchendo o modelo. Inclua prints em claro e escuro (e em 390px quando houver layout).

## Versões e publicação

Seguimos [SemVer](https://semver.org/lang/pt-BR/):

| Tipo | Quando | Exemplo |
| --- | --- | --- |
| `patch` | correção sem mudar API | ajuste visual, bug em gráfico |
| `minor` | novidade compatível (e, enquanto estivermos em `0.x`, mudança que quebra) | componente novo, prop nova |
| `major` | mudança que quebra, a partir da 1.0 | prop removida |

Mudança que quebra traz no changeset o "como migrar"; renomeações entram em `ai/renames.json` para a skill `ds-migrate` atualizar projetos sozinha.

### Como uma versão chega ao npm

Ninguém roda `npm publish` à mão. O caminho é sempre:

1. Seu PR inclui um arquivo em `.changeset/` (criado por `npx changeset`). Sem changeset, a mudança entra na `main` mas não gera versão.
2. Quando o PR entra na `main`, o GitHub Actions ([release.yml](.github/workflows/release.yml)) abre ou atualiza um PR chamado **"Versão de lançamento"**: ele junta os changesets, sobe o número em `package.json`, escreve o `CHANGELOG.md` e regenera `ai/`.
3. Quem mantém revisa e **mescla** esse PR. O Action roda `npm run check`, `npm run build` e publica `@g4ai/ds` no npm com provenance, usando **Trusted Publishing** (OIDC do GitHub configurado no npmjs.com, sem token guardado no repositório).
4. O site (GitHub Pages, com `llms.txt` e `ai/`) é republicado a cada push na `main` ([pages.yml](.github/workflows/pages.yml)).

Conferir a versão publicada: `npm view @g4ai/ds version`.

## Padrões de código

- TypeScript estrito, React 19, Base UI para comportamento, Tailwind v4 para estilo.
- Nada de cor crua: use os tokens (`bg-surface`, `text-muted`, `bg-primary text-on-primary`…). `npm run audit:self` aponta violações.
- Textos de interface em português do Brasil, seguindo [Escrita de interface](docs/fundamentos/escrita.md).
- Comentários explicam **por quê**, não o quê.

## Conduta

Este projeto segue o [Código de Conduta](CODE_OF_CONDUCT.md). Ao participar, você concorda em respeitá-lo.
