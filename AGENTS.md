# G4OS-DS · guia para agentes e devs

Design system para construir **qualquer aplicação G4 OS** (CRM, ATS, ERP, financeiro, portais, SaaS) com a mesma linguagem visual: tokens, componentes React (Base UI + Tailwind v4), blocos de tela prontos e regras de uso. Este arquivo é a porta de entrada; o `CLAUDE.md` ao lado é só `@AGENTS.md`.

Quem constrói um app **com** o DS: leia "Regras obrigatórias", "Começar um app em 10 passos" e "Qual bloco usar". Quem mexe **no** DS: leia também "Trabalhando neste repositório".

## Usar num app

```bash
pnpm add @g4ai/ds @base-ui/react lucide-react && pnpm add -D tailwindcss @tailwindcss/postcss
npx g4os-ds doctor                              # pré-requisitos
npx g4os-ds init                                # auditoria contínua: config, scripts ds:*, CI (--eslint, --hook, --baseline)
claude mcp add g4os-ds -- npx -y @g4ai/ds mcp   # MCP: plan_screen, search, get_component, get_block, get_guide, audit…
```

Funciona com React 18.2+ e 19 (no 18: `{...inertProps(flag)}` em vez de `inert={…}`; ver [instalação › React 18](docs/guias/instalacao.md#react-18)). Guia da versão instalada: `node_modules/@g4ai/ds/ai/core.md`. Na web: https://gestao-quatro-ponto-zero.github.io/G4OS-DS/llms.txt. Detalhes: [usar com IA](docs/guias/usar-com-ia.md).

## Comandos (neste repositório)

```bash
npm run check            # tokens CSS↔TS + TypeScript + ESLint + ai/ atualizado + auditoria + testes (critério de pronto)
npm run ai:build         # regenera ai/ (guia para agentes) a partir do código
npm run lint             # ESLint: typescript-eslint, react-hooks, jsx-a11y e o plugin @g4ai/ds/eslint
npm run audit:self       # g4os-ds audit em src/, templates/ e showcase/ (--fix aplica as trocas seguras)
npm run test:lint        # regras de auditoria (fixtures), plugin ESLint, init, doctor
npm run test:react       # React 18 e 19: tipos, render no servidor e no cliente de blocos e páginas (também no CI)
npm run showcase:build   # compila o site de documentação em showcase/dist
npm run showcase:watch   # recompila a cada mudança
npm run showcase         # build + servidor em localhost:4173
```

Site: `#/` início · `#/p/<slug>` documentação · `#/blocos/<categoria>` blocos · `#/frame/<bloco>` bloco em tela cheia.

## Ordem de preferência

1. **Bloco pronto** (`src/blocks/*.tsx`): copie o arquivo, troque os dados do topo.
2. **Composição de componentes do DS**.
3. **Componente do DS com props diferentes**.
4. shadcn/ui ou 21st.dev **com a ponte** `@g4ai/ds/shadcn.css` ([guia](docs/guias/shadcn.md)). Antes, confira o de/para em [equivalências shadcn ↔ DS](docs/guias/shadcn-equivalencias.md): quase todo componente do shadcn já tem equivalente.
5. Escrever do zero, com tokens. Se for reaproveitável, promova ao DS.

## Regras obrigatórias

### Visual
1. **Só tokens semânticos.** Cor, tipo, raio, sombra e z-index vêm de `src/styles/tokens.css` (camada `--ds-*`, exposta como utilitários). **Nenhum hex solto, nenhum `bg-white`/`text-white`/`border-white`, nenhuma cor da paleta do Tailwind (`gray-500`, `zinc-*`, `blue-600`…)**: elas quebram o tema escuro e a marca do cliente. Exceções: `tint` de `Avatar`/`EntityMark` (identidade do registro), logos de terceiros e painéis `bg-navy` (ficam escuros nos dois temas, então `text-white` é permitido ali).

   | Papel | Use | Nunca |
   | --- | --- | --- |
   | Fundo da área de trabalho | `bg-page` | `bg-white`, `bg-gray-50` |
   | Card, painel, tabela, campo | `bg-surface` | `bg-white` |
   | Menu, popover, modal, toast | `bg-popover` | `bg-white` |
   | Hover, cabeçalho de tabela, faixa | `bg-soft` | `bg-gray-100`, `bg-muted` |
   | Texto / secundário / metadado | `text-ink` / `text-ink-soft` / `text-muted` | `text-gray-*`, `text-black` |
   | Borda e divisória | `border-line` (hover `border-line-strong`) | `border-gray-200` |
   | Ação principal e seleção | `bg-primary text-on-primary` | `bg-ink text-white`, `bg-black` |
   | Texto sobre preenchimento forte (`bg-ink`, `bg-rose`, `bg-ok`…) | `text-on-ink` | `text-white` |
   | Estados | `text-ok` / `bg-ok-soft`, `amber`, `rose`, `info` | `text-green-700`, `bg-red-50` |
   | Cor em SVG / `style` | `var(--color-…)` ou `color-mix(in oklab, var(--color-ink) 20%, transparent)` | `"#202124"`, `rgba(…)` |

   **Tamanho de texto só na escala**: utilitários nomeados (`text-overline` 10, `text-meta` 11, `text-caption` 12, `text-label` 12.5, `text-control` 13, `text-body` 13.5, `text-input` 14, `text-value` 15, `text-section` 18, `text-record` 20, `text-metric` 22, `text-title` 25) **ou** o valor arbitrário equivalente `text-[13.5px]`. Permitidos: 10, 10.5, 11, 11.5, 12, 12.5, 13, 13.5, 14, 15, 16, 17, 18, 20, 22, 24, 25, 30 px (os meios-passos 10.5/11.5 e os de número 16/17/24/30 existem em componentes densos e KPIs). Nada fora da lista.
2. **Superfície, gelo e ação.** Área de trabalho em `page`; gelo (`soft`) só delimita; ação principal e seleção em `primary` (tinta no tema G4, cor da marca em `[data-brand]`). Dourado (`accent`) só preenche; texto dourado é `accent-deep`.
3. **Superfície separa por borda de 1 px**, não por sombra. Sombra só no que flutua ou é clicável.
4. **Cor sempre com palavra.** Status = ponto + texto. Badge neutro é o padrão; tom só na exceção. Número bom não grita (só warn/bad pintam o valor).
5. **Um primário por área.** O resto `ghost`; ações secundárias no `ActionMenu` (⋯). `danger` só dentro de `ConfirmDialog`.
6. **Ícones lucide**, 16 px em controles; `IconButton` exige `label`.

### Componentes e superfícies
7. **Nenhum `<select>` cru** (use `Select` para lista curta, `Combobox` para entidades, `MultiSelect`/`CheckboxGroup` para vários valores, `NativeSelect` quando o seletor do sistema é melhor, como lista longa no celular), nenhum `<input type="date">` (use `DatePicker`), nenhum `window.confirm` (use `ConfirmDialog`), nenhum `alert` (use `notify`).
8. **Rótulo visível acima de todo campo**: o `label` dos campos do DS já desenha o rótulo (dentro de `FieldBlock` o rótulo é do FieldBlock); `hideLabel` só em toolbar, tabela e filtro. Placeholder é exemplo. Botão desabilitado sem motivo óbvio leva `disabledReason`. Coluna estreita: `<Page width="narrow">`, nunca `mx-auto max-w-*` só no corpo.
9. **Superfície certa**: página para entidade; `Drawer` para criar/editar sem perder a lista; `Modal` para decisão curta; `ConfirmDialog` para irreversível; `Popover` para explicação; inline para um campo. **Drawer nunca abre drawer.**
10. **Status é controle inline** (selo que abre menu: `InlineSelect`), nunca um `Select` por linha.

### Navegação e densidade
11. Trilha **só com ancestrais**; página global não tem trilha; página de registro usa `ContextBar` e **não herda o cabeçalho do pai**.
12. **Controle só quando há o que controlar**: busca ≥ 12 itens, filtro ≥ 8, alternador de visualização ≥ 8 (`collectionThresholds`).
13. Contador em aba/sidebar **só quando pede ação**, nunca total.
13a. **Muitas áreas na sidebar: subitens**, não mais grupos. Item-pai com nome de área (`items`, 2–7 subitens, até 2 níveis); pai sem página própria vai sem `href`. Documentação/ajuda longa: `SectionNav`. Ver [layout e navegação](docs/padroes/layout-e-navegacao.md#subitens-submenus).
14. `<html lang="pt-BR" className="ds-app" data-theme="system">`: o documento não rola; `Page` rola. Tema e marca pelo `<html>` (ver "Tema escuro e marca" abaixo).
14a. **Toda tela segue uma das nove anatomias** de [anatomia de página](docs/padroes/anatomia-de-pagina.md) (Lista, Painel, Registro, Configurações, Quadro, Mestre-detalhe, App de altura total, Fluxo focado, Público). Cabeçalho da página fixo; **o que é da página fica junto** (filtros em `PageToolbar`, subnavegação, coluna de propriedades em `SplitLayout` grudam colados ao cabeçalho); nunca um elemento fixo cujo contexto rolou embora; uma rolagem por eixo.

### Dados
15. **Números pelo `lib/format`**: `formatCurrency`, `formatNumber`, `formatPercent` (recebe fração), `formatDelta`, `formatCompact`, `formatDate`, `formatRelative`. Nada de `toFixed` ou `"R$ " +`. `tabular-nums` e alinhamento à direita em colunas numéricas.
16. **Gráficos do DS** (SVG, sem Recharts): série 1 = `ink`, comparação tracejada em `chart-2`, até 6 séries, eixo em zero, título = pergunta, `label` obrigatório (acessibilidade). Ver [dados.md](docs/fundamentos/dados.md).
17. **KPI tem delta com base explícita** e `goodWhen="down"` para custo, churn, prazo, inadimplência.

### Estados e feedback
18. **Cinco estados em todo dado**: carregando (`Skeleton` com a forma final), vazio (`Empty` com próxima ação), vazio por filtro (com "Limpar"), erro (com saída), com dados.
19. **Toast só depois que terminou** (`notify`), particípio + objeto, "Desfazer" quando reversível. Enquanto executa, o botão informa (`useOperation` + `OperationButton`). Erro vira bloco (`OperationFeedback`), dados digitados nunca se perdem.

### Escrita e acessibilidade
20. **pt-BR**, verbo + objeto nos botões ("Criar vaga"), sem exclamação, sem "com sucesso", sem jargão de sistema, só a primeira letra maiúscula. Ver [escrita.md](docs/fundamentos/escrita.md).
21. **Acessível**: tudo por teclado, foco visível (nunca `outline: none` sem substituto), nomes acessíveis, cor nunca sozinha, `prefers-reduced-motion` respeitado.
22. **Responsivo de 320 a 1440 px**, sem rolagem horizontal da página. Confira 1440 e 390 px.

### Tema escuro e marca
23. **Todo componente funciona nos dois temas e em qualquer marca** sem código extra: basta usar os tokens da regra 1. Tema: `<html data-theme="light|dark|system">`; marca: `<html data-brand="oceano">` (presets em `src/styles/themes.css`) ou um bloco `[data-brand="cliente"] { --ds-primary: …; }` só com semânticos `--ds-*`. Estado no app: `useTheme()` + `ThemeToggle` (`src/lib/theme.ts`, `src/components/theme.tsx`); para não piscar, injete `themeScript` no `<head>`. A variante `dark:` do Tailwind segue `data-theme`; use-a só para ajuste fino (imagem, ilustração), nunca para trocar cores que um token já troca. Ver [tokens](docs/fundamentos/tokens.md) e [temas](docs/fundamentos/temas-e-dark-mode.md).
24. **Confira nos dois temas.** Toda tela nova ou migrada: 1440 e 390 px, claro e escuro (`#/frame/<bloco>?theme=dark` no showcase).

## Começar um app em 10 passos

1. `pnpm add @g4ai/ds @base-ui/react lucide-react` + Tailwind v4 (ou copie `templates/next-app`; ver [instalação](docs/guias/instalacao.md)). CSS: `@import "tailwindcss"; @import "@g4ai/ds/styles.css";` (os `@source` já vêm dentro; nada de `transpilePackages`). Rode `npx g4os-ds doctor` para conferir.
2. `<html lang="pt-BR" className="ds-app" data-theme="system">` + `themeScript` no `<head>`, Figtree, `setLinkComponent(Link)`.
3. **Glossário**: um nome por conceito (Negócio, Vaga, Pedido…). Escreva num arquivo de rótulos e use em tudo.
4. **Entidades e relações**: liste as 3–6 entidades, os campos que decidem ações e a etapa/status de cada uma. Veja a receita do tipo de app em `docs/receitas/`.
5. **Mapa de navegação**: sidebar com ≤ 10 itens em ≤ 2 grupos; decida o que é página global, entidade com abas, registro, drawer.
6. **Casca**: `AppShell` + `Sidebar` (grupos, pessoa, `onSearch` para ⌘K).
7. **Início**: copie o bloco de dashboard do tipo de app; 3–5 KPIs, gráfico principal, "Precisa de você".
8. **Listas e quadros**: copie o bloco de lista/pipeline; `TableToolbar` + `DataTable` + `useSort`/`useSelection`/`Pagination`; quadro com `KanbanBoard` + `RecordCard` quando há etapas.
9. **Registro e formulários**: página de registro (`ContextBar` + `StagePath` + `SplitLayout` + `PropertyList`), criar/editar em `Drawer` com `useOperation`; login/onboarding/configurações pelos blocos.
10. **Estados e verificação**: os cinco estados em cada tela, escrita revisada, teclado, 1440 e 390 px em claro e escuro, `npx g4os-ds audit --fix` e depois sem erros, `npm run check` do app verde. Deixe a checagem contínua com `npx g4os-ds init` (CI + pre-commit) e, se usar ESLint, `@g4ai/ds/eslint`.

## Qual bloco usar

Os blocos estão em `src/blocks/` e no site em **Blocos**. Categorias: SaaS, CRM, ATS, ERP, Serviços, Financeiro, Contratos, Comunicação, IA, Autenticação, Configurações, Onboarding, Aplicação. Cada categoria é um produto de exemplo navegável (casca em `src/blocks/shells/`), não telas soltas.

| Tipo de app | Início | Lista / quadro | Registro | Também |
| --- | --- | --- | --- | --- |
| **CRM** | `crm-sales-dashboard` | `crm-pipeline`, `crm-contacts`, `crm-leads`, `crm-quotes` | `crm-deal`, `crm-company` | `auth-login`, `settings-team`, `app-command-palette` |
| **ATS** | `ats-dashboard` | `ats-jobs`, `ats-pipeline`, `ats-requisitions` | `ats-candidate` | `ats-admission`, `ats-reports`, `onboarding-wizard` |
| **ERP (produtos)** | `erp-dashboard` | `erp-orders`, `erp-products`, `erp-purchase-orders`, `erp-stock-movements`, `erp-shipping` | `erp-order`, `erp-purchase-order`, `erp-invoice` (documento) | `erp-receiving`, `fin-*`, `app-file-manager` |
| **ERP de serviços** (Conta Azul, Omie) | `srv-dashboard` | `srv-work-orders` (quadro), `srv-quotes`, `srv-contracts`, `srv-invoices` | `srv-work-order`, `srv-client` | `srv-billing`, `srv-schedule` |
| **Financeiro** | `fin-dashboard`, `fin-cashflow` | `fin-receivables`, `fin-payables` | lançamento em `Drawer` | `fin-dre`, `fin-reconciliation`, `fin-bank-accounts` |
| **Contratos** (CLM) | `clm-dashboard` | `clm-contracts`, `clm-obligations` | `clm-contract` | `clm-request` (assistente), `clm-approvals`, `clm-templates` |
| **Comunicação interna** | `comms-home` | `comms-people`, `comms-events`, `comms-surveys` | `comms-announcement` | `comms-compose`, `comms-channels`, `comms-analytics` |
| **Gestão de agentes de IA** | `ai-agents-dashboard` | `ai-agents`, `ai-runs`, `ai-approvals` | `ai-agent`, `ai-agent-run` | `ai-agent-builder`, `ai-agent-evals`, `ai-agent-governance`, `ai-agent-templates` |
| **Assistente / chat de IA** | `ai-workspace` | `ai-sessions`, `ai-projects` | `ai-trace` | `ai-chat`, `ai-conversation`, `ai-assistant` |
| **SaaS / produto** | `saas-dashboard` | `saas-customers`, `saas-plans`, `saas-usage` | `saas-customer` | `saas-analytics`, `settings-*`, `onboarding-*` |
| **Portal do cliente** | `onboarding-checklist` + `NextStep` | lista simples | — | `auth-login`, `auth-otp`, `app-file-manager` |
| **Qualquer app** | — | — | — | `auth-*`, `settings-profile`/`-organization`/`-roles`/`-billing`/`-notifications`/`-team`/`-webhooks`/`-data`, `app-error-pages`, `app-legal`, `app-presentation` |

Receitas por tipo de app (entidades, mapa de navegação, telas): `docs/receitas/` (CRM, ATS, ERP, ERP de serviços, financeiro, contratos, comunicação interna, agentes de IA, portal).

Catálogo completo com descrições no [README](README.md#blocos).

## Onde estão as coisas

| Preciso de | Vá para |
| --- | --- |
| Tokens (CSS / TS) | `src/styles/tokens.css` (3 camadas), `src/styles/themes.css` (marcas), `src/tokens/index.ts` (`color` / `colorDark`) |
| Tema e marca no app | `src/lib/theme.ts` (`useTheme`, `themeScript`), `ThemeToggle` |
| Guia para IA (outros repositórios) | `ai/core.md`, `ai/components/*.md`, `ai/blocks/*.md`, plugin em `plugin/`, [usar-com-ia.md](docs/guias/usar-com-ia.md) |
| Auditoria / lint / pré-requisitos | `npx g4os-ds audit` (`--fix`, `--changed`, `--baseline`, `--format sarif\|github`), `npx g4os-ds doctor`, `npx g4os-ds init`, plugin `@g4ai/ds/eslint`; regras em `scripts/lint/rules.mjs`, guia em [auditoria](docs/guias/auditoria.md) |
| Componentes | `src/components/*.tsx`, exportados por `src/index.ts` |
| Formatação pt-BR | `src/lib/format.ts`; texto: `src/lib/text.ts` |
| Blocos de tela | `src/blocks/*.tsx` |
| Ponte shadcn / 21st e de/para | `src/styles/shadcn.css`, [docs/guias/shadcn.md](docs/guias/shadcn.md), [equivalências](docs/guias/shadcn-equivalencias.md) (fonte: `scripts/data/shadcn-map.json`) |
| Cor, tipo, espaço, movimento, dados, ícones, escrita | `docs/fundamentos/` |
| Layout, densidade, formulários, tabelas, superfícies, feedback, dashboards, pipelines, acessibilidade, responsivo | `docs/padroes/` |
| CRM, ATS, ERP, financeiro, portal | `docs/receitas/` |
| Instalação, Next.js, shadcn, contribuir | `docs/guias/` |
| Starter de app | `templates/next-app/` |

## Trabalhando neste repositório

- Publicado no npm como `@g4ai/ds`: `npm run build` (scripts/build-lib.mjs) compila `dist/` (ESM com `"use client"` + tipos); CSS, `src/`, `ai/`, `docs/`, `plugin/` e `scripts/` vão junto. `package.json#exports` define os pontos de entrada.
- Versões: `npx changeset` no PR → o Action abre o PR "Versão de lançamento" → ao mesclar, publica no npm (Trusted Publishing). Ver [CONTRIBUTING.md](CONTRIBUTING.md#como-uma-versão-chega-ao-npm).
- Agentes: `scripts/mcp.mjs` (servidor MCP, `g4os-ds mcp`) lê `ai/` e `docs/`; `showcase/build.mjs` publica `llms.txt`, `llms-full.txt`, `ai/` e `docs/` no site. Mudou a estrutura de `ai/`? Confira os dois.
- Novo componente: arquivo da família em `src/components/`, export em `src/index.ts`, página em `showcase/pages/<slug>.tsx` (registro automático; contrato em `showcase/kit.tsx`). Ver [contribuir.md](docs/guias/contribuir.md).
- Novo bloco: `src/blocks/<slug>.tsx` com `export const meta = { title, description, category, height, order, concept } as const` e `export default function`. `concept` é obrigatório (`goal`, `patterns` começando pela anatomia, `adapt`, `avoid`) e aparece na aba Conceito do showcase. Importa só de `@g4ai/ds`; dados de exemplo no topo; realista em pt-BR.
- Mudou token: CSS **e** TS (`color` e `colorDark`), `npm run check:tokens`, docs de fundamentos.
- Regra de auditoria: `scripts/lint/rules.mjs` (uma fonte para CLI, ESLint e MCP), fixtures em `scripts/lint/__fixtures__/` e seção em `docs/guias/auditoria.md` (o `test:lint` cobra os três). Exceção no código só com motivo: `// g4os-ds-disable-next-line <regra> -- motivo`.
- Mudou export, prop ou bloco: `npm run ai:build` (o `check` falha se `ai/` estiver desatualizado). Renomeou um export: registre em `ai/renames.json` e no `CHANGELOG.md`.
- Nomes exportados são únicos no pacote inteiro.
- `templates/` fica fora do typecheck do DS (o DS não instala `next`).

## Ao terminar uma tarefa

1. `npm run check` verde.
2. Showcase compilado e as telas/páginas alteradas conferidas em 1440 e 390 px (captura headless serve; comando em [contribuir.md](docs/guias/contribuir.md#verificar)).
3. Docs atualizadas quando uma regra ou padrão mudou.
