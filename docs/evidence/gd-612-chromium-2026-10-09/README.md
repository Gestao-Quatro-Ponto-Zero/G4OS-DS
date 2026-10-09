# Evidências — GD-612 · cabeçalho estável durante a rolagem

- **Data:** 2026-10-09
- **Origem:** `@g4ai/ds` 0.9.0 + changeset de patch
- **Ambiente:** Linux, Node 26.10.0, npm 11.19.1, Google Chrome 154.0.8037.57
- **Execução:** Chromium headless via `playwright-core` 1.64.0
- **Resultado:** 9 de 9 combinações passaram; nenhum caso perdeu posição, alterou `scrollHeight` ou alternou o cabeçalho compacto mais de uma vez na descida.

## Validações observáveis

| Validação | Resultado |
| --- | --- |
| Conteúdo 20 px maior que a janela, passos de 5/10/30 px | Passou (3/3) |
| Conteúdo 39 px maior que a janela, passos de 5/10/30 px | Passou (3/3) |
| Conteúdo 300 px maior que a janela, passos de 5/10/30 px | Passou (3/3) |
| Rolagem cresce continuamente até o fim e diminui até o topo | Passou (9/9) |
| `scrollHeight` permanece idêntico antes/depois da compactação | Passou (9/9) |
| Cabeçalho compacto alterna no máximo uma vez na descida | Passou (9/9) |
| Cópia oculta fica inerte; ações visíveis permanecem no teclado | Passou (9/9) |
| Existe somente um `h1` semântico | Passou (9/9) |
| Alinhamento visual em 1440 e 390 px, temas claro e escuro | Passou (4 capturas inspecionadas) |

## Fluxo exercitado

O fixture monta os componentes reais `Page`, `PageHeading` e `PageToolbar` com o CSS compilado do pacote. Para cada excesso de conteúdo, ele rola em passos pequenos até o fim, volta ao topo e mede posição, altura total, trocas de estado e atributos de foco. As capturas mostram a cópia compacta depois que o título completo saiu da área visível.

## Artefatos

- [Resultados estruturados](./results.json)
- [Desktop · tema claro](./desktop-light-compact.png)
- [Desktop · tema escuro](./desktop-dark-compact.png)
- [Mobile · tema claro](./mobile-light-compact.png)
- [Mobile · tema escuro](./mobile-dark-compact.png)
- [Harness reproduzível](../../../scripts/test-page-heading-layout.mjs)
- [Cenários manuais](../../operations/gd-612-page-heading-scroll-manual-test-scenarios.md)

## Testes complementares

- `npm run check` — passou: tokens, TypeScript, ESLint (0 erros; 7 avisos preexistentes), IA gerada, auditoria, 130 testes de lint/CLI, 14 testes MCP e 13 contratos de componentes.
- `npm run test:layout` — passou: 9 combinações em Chromium.
- `git diff --check` — passou.

## Limites

- Esta execução valida o componente e seu CSS no repositório G4OS-DS; ainda não é a validação Electron do aplicativo consumidor.
- O smoke pelo Electron/Stagewright e o roteiro manual em Projetos, Documentos e demais telas dependem da publicação do pacote e do bump no G4WorkOS.
- Trackpad e roda físicos não são simulados; o teste reproduz os passos de 5/10/30 px no Chromium real e o roteiro manual cobre os dispositivos físicos.

## Reprodução

```bash
npm ci
npm run check
npm run test:layout
EVIDENCE_DIR=docs/evidence/gd-612-chromium-2026-10-09 npm run test:layout
```
