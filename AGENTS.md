# G4OS-DS · guia para agentes e devs

Design system para construir **qualquer aplicação G4 OS** (CRM, ATS, ERP, financeiro, portais, SaaS) com a mesma linguagem visual: tokens, componentes React (Base UI + Tailwind v4), blocos de tela prontos e regras de uso. Este arquivo é a porta de entrada; o `CLAUDE.md` ao lado é só `@AGENTS.md`.

Quem constrói um app **com** o DS: leia "Regras obrigatórias", "Começar um app em 10 passos" e "Qual bloco usar". Quem mexe **no** DS: leia também "Trabalhando neste repositório".

## Comandos

```bash
npm run check            # tokens CSS↔TS + TypeScript + ai/ atualizado + auditoria do próprio DS (critério de pronto)
npm run ai:build         # regenera ai/ (guia para agentes) a partir do código
npm run audit:self       # g4os-ds audit em src/ e templates/
npm run showcase:build   # compila o site de documentação em showcase/dist
npm run showcase:watch   # recompila a cada mudança
npm run showcase         # build + servidor em localhost:4173
```

Site: `#/` início · `#/p/<slug>` documentação · `#/blocos/<categoria>` blocos · `#/frame/<bloco>` bloco em tela cheia.

## Ordem de preferência

1. **Bloco pronto** (`src/blocks/*.tsx`): copie o arquivo, troque os dados do topo.
2. **Composição de componentes do DS**.
3. **Componente do DS com props diferentes**.
4. shadcn/ui ou 21st.dev **com a ponte** `@g4os/ds/shadcn.css` ([guia](docs/guias/shadcn.md)).
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
7. **Nenhum `<select>` nativo** (use `Select` ou `Combobox`), nenhum `<input type="date">` (use `DatePicker`), nenhum `window.confirm` (use `ConfirmDialog`), nenhum `alert` (use `notify`).
8. **Rótulo visível acima de todo campo** (`FieldBlock`); placeholder é exemplo.
9. **Superfície certa**: página para entidade; `Drawer` para criar/editar sem perder a lista; `Modal` para decisão curta; `ConfirmDialog` para irreversível; `Popover` para explicação; inline para um campo. **Drawer nunca abre drawer.**
10. **Status é controle inline** (selo que abre menu), nunca um `Select` por linha.

### Navegação e densidade
11. Trilha **só com ancestrais**; página global não tem trilha; página de registro usa `ContextBar` e **não herda o cabeçalho do pai**.
12. **Controle só quando há o que controlar**: busca ≥ 12 itens, filtro ≥ 8, alternador de visualização ≥ 8 (`collectionThresholds`).
13. Contador em aba/sidebar **só quando pede ação**, nunca total.
14. `<html lang="pt-BR" className="ds-app" data-theme="system">`: o documento não rola; `Page` rola. Tema e marca pelo `<html>` (ver "Tema escuro e marca" abaixo).

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

1. Copie `templates/next-app` (ou siga [instalação](docs/guias/instalacao.md)): Tailwind v4 + `@import "@g4os/ds/styles.css"` (os `@source` já vêm dentro) + `transpilePackages`. Rode `npx g4os-ds doctor` para conferir.
2. `<html lang="pt-BR" className="ds-app" data-theme="system">` + `themeScript` no `<head>`, Figtree, `setLinkComponent(Link)`.
3. **Glossário**: um nome por conceito (Negócio, Vaga, Pedido…). Escreva num arquivo de rótulos e use em tudo.
4. **Entidades e relações**: liste as 3–6 entidades, os campos que decidem ações e a etapa/status de cada uma. Veja a receita do tipo de app em `docs/receitas/`.
5. **Mapa de navegação**: sidebar com ≤ 10 itens em ≤ 2 grupos; decida o que é página global, entidade com abas, registro, drawer.
6. **Casca**: `AppShell` + `Sidebar` (grupos, pessoa, `onSearch` para ⌘K).
7. **Início**: copie o bloco de dashboard do tipo de app; 3–5 KPIs, gráfico principal, "Precisa de você".
8. **Listas e quadros**: copie o bloco de lista/pipeline; `TableToolbar` + `DataTable` + `useSort`/`useSelection`/`Pagination`; quadro com `KanbanBoard` + `RecordCard` quando há etapas.
9. **Registro e formulários**: página de registro (`ContextBar` + `StagePath` + `SplitLayout` + `PropertyList`), criar/editar em `Drawer` com `useOperation`; login/onboarding/configurações pelos blocos.
10. **Estados e verificação**: os cinco estados em cada tela, escrita revisada, teclado, 1440 e 390 px em claro e escuro, `npx g4os-ds audit src` sem violações, `npm run check` do app verde.

## Qual bloco usar

Os blocos estão em `src/blocks/` e no site em **Blocos**. Categorias: SaaS, CRM, ATS, ERP, Financeiro, Autenticação, Configurações, Onboarding, Aplicação.

| Tipo de app | Início | Lista / quadro | Registro | Também |
| --- | --- | --- | --- | --- |
| **CRM** | `crm-sales-dashboard` | `crm-pipeline`, `crm-contacts` | `crm-deal` | `auth-login`, `settings-team`, `app-command-palette` |
| **ATS** | `ats-dashboard` | `ats-jobs`, `ats-pipeline` | `ats-candidate` | `onboarding-wizard`, `app-notifications` |
| **ERP** | `saas-dashboard` adaptado + `erp-inventory` | `erp-orders`, `erp-inventory`, `erp-purchase-requests` | `erp-invoice` (documento) | `fin-*`, `app-file-manager` |
| **Financeiro** | `fin-cashflow` | `fin-receivables` | lançamento em `Drawer` | `fin-dre` |
| **SaaS / produto** | `saas-dashboard` | `saas-customers` | detalhe em drawer (`saas-customers`) | `saas-analytics`, `settings-*`, `onboarding-*` |
| **Portal do cliente** | `onboarding-checklist` + `NextStep` | lista simples | — | `auth-login`, `auth-otp`, `app-file-manager` |
| **Qualquer app** | — | — | — | `auth-*`, `settings-profile`/`-billing`/`-notifications`/`-team`, `app-error-pages`, `app-presentation` |

Catálogo completo com descrições no [README](README.md#blocos).

## Onde estão as coisas

| Preciso de | Vá para |
| --- | --- |
| Tokens (CSS / TS) | `src/styles/tokens.css` (3 camadas), `src/styles/themes.css` (marcas), `src/tokens/index.ts` (`color` / `colorDark`) |
| Tema e marca no app | `src/lib/theme.ts` (`useTheme`, `themeScript`), `ThemeToggle` |
| Guia para IA (outros repositórios) | `ai/core.md`, `ai/components/*.md`, `ai/blocks/*.md`, plugin em `plugin/`, [usar-com-ia.md](docs/guias/usar-com-ia.md) |
| Auditoria / pré-requisitos | `npx g4os-ds audit <pasta>`, `npx g4os-ds doctor` |
| Componentes | `src/components/*.tsx`, exportados por `src/index.ts` |
| Formatação pt-BR | `src/lib/format.ts`; texto: `src/lib/text.ts` |
| Blocos de tela | `src/blocks/*.tsx` |
| Ponte shadcn / 21st | `src/styles/shadcn.css`, [docs/guias/shadcn.md](docs/guias/shadcn.md) |
| Cor, tipo, espaço, movimento, dados, ícones, escrita | `docs/fundamentos/` |
| Layout, densidade, formulários, tabelas, superfícies, feedback, dashboards, pipelines, acessibilidade, responsivo | `docs/padroes/` |
| CRM, ATS, ERP, financeiro, portal | `docs/receitas/` |
| Instalação, Next.js, shadcn, contribuir | `docs/guias/` |
| Starter de app | `templates/next-app/` |

## Trabalhando neste repositório

- Pacote distribuído como **código-fonte** (TSX + CSS); não há build de biblioteca. `package.json#exports` define os pontos de entrada.
- Novo componente: arquivo da família em `src/components/`, export em `src/index.ts`, página em `showcase/pages/<slug>.tsx` (registro automático; contrato em `showcase/kit.tsx`). Ver [contribuir.md](docs/guias/contribuir.md).
- Novo bloco: `src/blocks/<slug>.tsx` com `export const meta = { title, description, category, height, order } as const` e `export default function`. Importa só de `@g4os/ds`; dados de exemplo no topo; realista em pt-BR.
- Mudou token: CSS **e** TS (`color` e `colorDark`), `npm run check:tokens`, docs de fundamentos.
- Mudou export, prop ou bloco: `npm run ai:build` (o `check` falha se `ai/` estiver desatualizado). Renomeou um export: registre em `ai/renames.json` e no `CHANGELOG.md`.
- Nomes exportados são únicos no pacote inteiro.
- `templates/` fica fora do typecheck do DS (o DS não instala `next`).

## Ao terminar uma tarefa

1. `npm run check` verde.
2. Showcase compilado e as telas/páginas alteradas conferidas em 1440 e 390 px (captura headless serve; comando em [contribuir.md](docs/guias/contribuir.md#verificar)).
3. Docs atualizadas quando uma regra ou padrão mudou.
