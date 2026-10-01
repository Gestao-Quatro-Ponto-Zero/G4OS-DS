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
npm install
npm run showcase:watch      # site em modo watch (abra showcase/dist/index.html via `npx serve showcase/dist`)
```

Requisitos: Node 20+.

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

## Versões

Seguimos [SemVer](https://semver.org/lang/pt-BR/). Enquanto estivermos em `0.x`, mudanças que quebram API sobem o **minor** e são descritas no changeset com o "como migrar". Renomeações entram em `ai/renames.json` para a skill `ds-migrate` atualizar projetos automaticamente.

A publicação no npm é automática: ao fazer merge na `main`, o GitHub Action abre um PR "Versão de lançamento"; quando esse PR é aprovado e mesclado, o pacote é publicado.

## Padrões de código

- TypeScript estrito, React 19, Base UI para comportamento, Tailwind v4 para estilo.
- Nada de cor crua: use os tokens (`bg-surface`, `text-muted`, `bg-primary text-on-primary`…). `npm run audit:self` aponta violações.
- Textos de interface em português do Brasil, seguindo [Escrita de interface](docs/fundamentos/escrita.md).
- Comentários explicam **por quê**, não o quê.

## Conduta

Este projeto segue o [Código de Conduta](CODE_OF_CONDUCT.md). Ao participar, você concorda em respeitá-lo.
