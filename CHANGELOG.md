# Changelog

## 0.14.0

### Minor Changes

- 505f4ca: `AgentComposer` e `ChatComposer` voltam ao campo sólido do 0.10: superfície opaca, borda `line` de 1 px, sombra leve e borda `line-strong` no foco. Os botões de enviar e parar ficam chapados no novo token `send` / `on-send` (utilitários `bg-send`, `text-on-send`): navy G4 `#001f35` com ícone prata no tema claro, prata com ícone navy no escuro. Numa marca de cliente (`data-brand` fora das marcas G4), `send` segue o `primary`. Saem o vidro translúcido, a sombra elevada, a borda azul no foco e o degradê azul-céu com sombra. As classes `ds-glass` e `ds-ai-action` continuam disponíveis para momentos de marca. Quem sobrescrevia o compositor para voltar ao visual sólido pode remover o override.

## 0.13.0

### Minor Changes

- 7f30354: Gráficos analíticos, agentes de IA e revisão visual do DS inteiro.

  **Novos componentes**

  - Análise: `ConnectedScatter` (duas medidas no tempo, com meta e controle de tempo), `HorizonChart` + `HorizonLegend` (muitas séries contra a própria base), `ChoroplethMap` + `RankedRegionList` (mapa do Brasil por UF, dados do Natural Earth em `brUfs`; `fitGeoViewBox`, `GeoRegion`), `PivotTable` + `PivotBuilder` (tabela dinâmica com motor `buildPivot()` testado) e `RetentionCurves`.
  - Peças compartilhadas: `ScaleLegend`, `ChartScrubber`, `AxisBreak`, `useLinkedHighlight`; escalas `sequentialColor`, `divergingColor`, `quantizeScale`, `onScaleInk`; tokens `chart-pos` / `chart-neg` (escala divergente).
  - IA: `CitedText` (citação acende a frase que sustenta), `SourceCards`, `SourceStack`, `AnswerVersions`, `RelatedQuestions`; `AgentRunCard` com `DiffApproval` e `AgentRunResult`; `EvalDotGrid`, `EvalCaseCompare`, `EvalRunHeader`; `ToolToggleList`, `KnowledgeFiles`, `AppAccessList`; `MorphIllustration`, `IntroCard` (`IntroCardStep`) e `onboardingScenes`.

  **Evoluções (aditivas)**

  - `WaterfallChart`: `axisBreak` (única exceção ao eixo em zero, com marca de quebra), `selected`/`onSelect`, transição ao trocar o período.
  - `SankeyChart`: `columnLabels`, `nodeLabels="above"`, `selected`/`onSelect` com rastro do caminho, `minWidth`.
  - `HeatmapMatrix`: `rowMeta`, `summaryRow`, `scale`, `legend`, células navegáveis por teclado.
  - `ModelPicker`: modelos em destaque com nota, "Outros modelos" por fornecedor e `summary` (contexto e preço). `MessageActions`: `onRegenerate` com opções e `versions`.
  - `DiffView`: `actions` e `collapsed`. `AgentInstructions`: `maxLength`.

  **Blocos novos**: `saas-mrr-bridge`, `saas-retention`, `saas-journey`, `saas-unit-economics`, `saas-regions`, `saas-explore`, `saas-usage-horizon`, `ai-answer`, `onboarding-intro`. Evoluídos: `ai-agent-run` (`?estado=ao-vivo`), `ai-agent-evals`, `ai-agent-builder`, `ai-agent-templates` (instalação no lugar).

  **Mudanças visíveis**

  - Formatadores (`formatNumber`, `formatCurrency`, `formatCompact`, `formatPercent`) usam o sinal de menos tipográfico "−", como `formatDelta` já fazia.
  - `MessageActions` na variante `md` mostra `onShare` e quebra linha no celular.
  - Foco de campo escurece a borda em todos os campos (Select, Combobox, DatePicker incluídos); campo somente leitura volta ao fundo gelo.
  - `Button` ghost desenha o contorno por dentro (mesma altura dos campos vizinhos); `Label` no padrão dos rótulos de campo.
  - KPIs alinhados na mesma linha com e sem sparkline; cabeçalho do `ChartCard` quebra no celular; legendas e tooltips alinhados; rótulos de barra e de eixo sem sumir nem vazar.
  - Tabela no celular: a ação "⋯" vai para o canto do cartão; rótulos de colunas com `SortHeader` aparecem.

  **Migração**

  - Se algum teste ou código seu compara a saída dos formatadores com hífen ("-R$ 20,00"), troque para "−" (U+2212) ou normalize antes de comparar.
  - `SankeyChart`: o hover agora traça o caminho inteiro (não só as faixas vizinhas) e `SankeyNode` aceita `color`.
  - `WaterfallChart`: valores de quedas ficam abaixo da barra; em faixa estreita só a barra em foco mostra o valor; o tooltip traz a variação com sinal.
  - `HeatmapMatrix`: células usam a mesma escala da legenda (`sequentialColor`); `tone="info"` passa a seguir o token `info`.

  **Servidor**: libs puras e tokens (`@g4ai/ds/lib/format`, `/lib/pivot`, `/lib/scale`, `/lib/geo-br`, `/lib/dates`, `/tokens`…) saem sem `"use client"` e rodam em Server Component, rota de API ou script. O ponto de entrada principal continua de cliente.

  **Auditoria**: regra `class-conflict` (duas utilidades da mesma propriedade no `cn`, que vence pela ordem do CSS e não do código).

- c0d13ed: Armazenamento com varredura, tarefas delegadas a agentes e atividade de agente por fases.

  - **Capacidade**: `CapacityBar` (barra segmentada com varredura, textura sutil e segmentos navegáveis por teclado), `CapacityLegend` (ligada à barra) e `CapacityBreakdown` (total animado, status ao vivo, recomendações de limpeza com `ConfirmDialog` no irreversível e Desfazer no reversível); `formatStorage` (base 1000). Bloco novo `settings-storage`.
  - **Tarefas delegadas**: `DelegableTaskList` (seleção múltipla por clique, arrasto, Shift e teclado; barra "Delegar"), `AgentQueue` (status ao vivo por tarefa), `DelegationPill`, `TaskResultCard` (passos, resumo que vira lista em cartão estreito, arquivo com "Abrir em", aprovar ou pedir ajuste), `describeTaskDue` e `useDelegationDemo`. Bloco novo `ai-delegate` (Assistente → Tarefas).
  - **Atividade do agente**: `AgentActivityCard` (fases com cor e palavra, plano, contexto por fase com busca, ideias, escrita e revisão em diff, ferramentas, modelo, tokens, custo e tempo, Pausar e Parar), `AgentPhaseBadge`, `AgentMark`, `useAgentActivityDemo`. Usado no bloco `ai-codex`.

## 0.12.1

### Patch Changes

- cc02d05: Espaço entre blocos empilhados volta a valer.

  - `CodeBlock` e `DiffView` deixam de levar `m-0` na raiz: dentro de um pai com `space-y-*` (Tailwind v4, especificidade zero) o `m-0` vencia e os blocos encostavam um no outro. Vale também para `JsonView`, `FieldSet`, `ItemDescription`, `Kicker`, `Testimonial`, `OfficeChartView`, `DataSyncTable` e outras raízes que repetiam o reset do Tailwind.
  - Auditoria: regra nova `stack-margin-reset` (aviso) aponta filho com `m-0`/`my-0`/`mb-0` dentro de `space-y-*` (e `mx-0`/`mr-0` em `space-x-*`).
  - Blocos e documentação corrigidos onde títulos, parágrafos e blocos de código estavam colados.

## 0.12.0

### Minor Changes

- 8de799e: Peças promovidas do Durable e APIs que ele precisava contornar.

  Novos: `AgentOrb` e `AgentOrbStack` (rosto gerado do agente, com 18 expressões, forma, cor e selo da ferramenta em uso), `CodeBlock` e `DiffView` (com `parseDiff`/`wordDiff`), `RowList`, `ChipRow`, `PageSkeleton`, `ListSkeleton`, `useDelayed`, `useIsMobile`, `useMediaQuery`, `useScrollEdges` e `breakpoints`.

  Props novas: `Tabs overflow="scroll"`; `Breadcrumb back`; `description` e `id` em `Section`, `RecordSection` e `SettingsSection` (título aceita nó); `ListRow description`/`actions`; `Card padding`; `StatGrid cols` até 6 e `dense`, `StatCell short`/`of`; `FilterChip shape="pill"`/`count`; `Slider onValueCommit`; `ThemeToggle variant="menu"`; `formatDate({ time, timeZone })`; `formatRelative(data, { short: true })`.

  `ListRow` com `href` agora usa o link do app (`setLinkComponent`) e desenha o alvo no título, estendido sobre a linha: quem estilizava `a.list-row` deve mirar `.list-row`.

### Patch Changes

- 33d68d2: G4 clássico passa a ser a marca padrão, com tokens CSS e TypeScript alinhados. G4 OS reúne a opção institucional. Preferências salvas como `g4-institucional` continuam funcionando como alias de `g4os`. A tipografia permanece um eixo independente.
- 8de799e: Correções que o Durable aplicava por patch ou CSS local.

  - Cabeçalho fixo: o `PageHeading` compacto encosta no topo da área rolável. Antes ficava uma faixa do tamanho do respiro do `Page` acima dele, com o conteúdo aparecendo por trás; `PageToolbar` e `.page-aside` grudavam deslocados pelo mesmo valor.
  - Marcas (`data-brand`) escurecem também em `data-theme="system"`.
  - `AttachmentTrigger` volta a cobrir o card dentro de `.linked-card` ("Abrir" não respondia).
  - Menus só reservam o espaço do ícone quando algum item tem ícone.
  - `IconRail` não corta mais o anel de foco do primeiro e do último item.
  - Campos de texto têm no mínimo 16 px em tela de toque, para o Safari do iOS não dar zoom ao focar.

- 68c245b: A tipografia padrão volta a ser a Figtree, com títulos em 600 (`--ds-display-weight`), como antes do KV. A Manrope do KV G4 OS continua disponível, agora opcional: `data-type="g4os"` (preset "G4 OS · Manrope" em `typePresets`). Quem tinha `g4` salvo como tipografia (o id do padrão antigo) passa ao padrão atual; `data-type="classica"` segue valendo e equivale ao padrão. Novo export `DEFAULT_TYPE`.

  Apps que carregam a fonte por conta própria devem carregar a Figtree (`next/font/google` ou Google Fonts); os templates e o guia de instalação já usam ela. Quem quiser manter a Manrope declara `data-type="g4os"` no `<html>`.

  `Slider`: a primeira e a última marca da régua alinham pela borda, em vez de sair da largura do campo.

## 0.11.0

### Minor Changes

- 1e5ccca: Aparência **G4 OS** (`g4os`) passa a ser a padrão em `brandPresets`, `useTheme` e `themeScript` (constante `DEFAULT_BRAND`). O tema anterior ao KV vira o preset **G4 clássico** (`data-brand="g4-classico"`: branco, grafite e Royal Gold, com escuro neutro; a Figtree continua em Tipografia › Clássica). Quem tinha `g4` salvo no navegador (o padrão antigo) passa ao G4 OS. O `Popover` aceita `open`/`onOpenChange` para ser controlado.
- 6d95fd6: Resumo do período ("catch up"): `CatchUpSources`, `CatchUpSection`, `CatchUpRow`, `CatchUpRowSkeleton`, `CatchUpDone` e `catchUpSections`, com o bloco `ai-catch-up` e a página "Resumo do período". A IA lê as fontes de um período e devolve quatro seções fixas (Precisa de você, Decisões tomadas, Entregue, Para saber); em Precisa de você, a linha traz a oferta da IA com a ação. Lido recolhe a linha e passa o foco para a próxima.
- 5fb5e6e: `Combobox`: cada opção aceita `icon` (elemento à esquerda, como no `Select`), na lista e ao lado do valor escolhido. Serve para listas longas de entidades com marca, como apps e integrações: o logo ajuda a achar o item antes de ler o nome.
- 1e5ccca: Identidade KV G4 OS nos componentes: novos `G4OSSymbol` (a esfera, com estado `live`), `G4OSLogo`, `GradientText`, `AiOrb`, `BrandHaze`, `AiDots` e `AiGreeting`, e as classes `ds-gradient-text`, `ds-glass`, `ds-ai-action`, `ds-orb` e `ds-haze`. `ProductMark` e `AiMark` passam a mostrar a esfera; `ChatComposer` e `SessionComposer` ficam em vidro com o botão de enviar no azul da IA; `ThinkingIndicator` usa os três pontos do KV; `AiBadge` passa a azul. `BrandPanel` ganha `tone` e o padrão agora é o tom claro do KV (gelo, névoa, orb e título em gradiente); `tone="navy"` mantém o painel anterior. Saudações da IA, painel de login e faixa de CTA da landing seguem o KV.
- 1e5ccca: Tema padrão no visual do KV G4 OS: fundo gelo `#f9f9f9`, texto em Maua Blue, ação em Navy, link e info em azul profundo `#005b98`, dourado terroso `#a38e5a` no marcador e no progresso, raio 25 % maior e sombras difusas. A fonte padrão passa a ser Manrope (a Figtree fica em `data-type="classica"`). Novos tokens: `--ds-ai-accent`, `--ds-ai-accent-soft`, `--ds-gradient-brand` e `--ds-font-tagline`. O tema escuro não muda.
- 03e524b: Gráficos cartesianos (`LineChart`, `AreaChart`, `BarChart`):

  - `LineChart` deixa uma lacuna num ponto `null`. Antes a linha desenhava o ponto como zero, mas o eixo ignorava o `null`: com o eixo fora do zero (taxas, preços), a linha saía da área do gráfico. Um ponto isolado entre lacunas vira um marcador, e o cursor não marca um ponto sem dado. `labels` e `endLabels` também omitem os pontos sem dado, sem desenhar zero ou marcadores fora do gráfico.
  - `axisWidth` fixa a largura do eixo de valores. Serve para alinhar gráficos empilhados que têm rótulos de tamanhos diferentes ("US$ 60,00" e "150 mi"): o mesmo dia fica na mesma posição em todos.

## 0.10.2

### Patch Changes

- 755d1d8: `styles.css` deixa de ler `src/blocks` com `@source`. Os blocos são exemplos para copiar, e a cópia no app é lida pelo Tailwind do próprio app. Medido nos Galts: o CSS inicial cai 19,5 KB (2,3 KiB gzip) sem mudar nenhuma tela. Se o seu app aponta `@source` para `node_modules/@g4ai/ds/src` inteiro, exclua os blocos com `@source not ".../@g4ai/ds/src/blocks"`.

## 0.10.1

### Patch Changes

- bcc492a: Correções que os Galts aplicavam como patch local do 0.9.0: barras horizontais quebram nomes longos de categoria em até três linhas (com reticências), em vez de vazar à esquerda; `AgentAppLayout` expõe `--ds-mobile-nav-space` para uma área rolar sob a navegação móvel; a `BottomNav` vira vidro mais leve (`bg-popover/70`, `backdrop-blur-xl`, borda `line/60`). Também documenta `useOutgoing`, que entrou no 0.10.0.

## 0.10.0

### Minor Changes

- f8a0d62: Camada expressiva para páginas públicas, boas-vindas e onboarding, promovida da página inicial dos Galts: `Stage` (palco de tokens com tons `dawn`, `sea`, `dusk` e `brand`), `StageSky`, `Glass`, `Kicker`, `Chapter`, `CtaButton`, `SiteHeader` (vira pílula ao rolar), `FloatingFigure` e `SpeechBubble`; `Button shape="pill"`; hooks de movimento com contrato (`useBeat`, `useInView`, `everyVisible`, `useVisibleInterval`, `whenIdle`, `useGlide`, `useEasedWidth`, `useScrolled`, `useReducedMotion`); tokens `--ease-travel`, `--duration-scene` e `--radius-stage`; bloco `marketing-stage` e guia `docs/padroes/palcos.md`.

## 0.9.1

### Patch Changes

- 2a87c28: Mantém a geometria do `PageHeading` estável ao mostrar o cabeçalho compacto, evitando tremor e retorno da rolagem ao topo em páginas com pouco conteúdo.

## 0.9.0

### Minor Changes

- d98377c: Família de reuniões para notas com IA: `LiveRecordingIndicator` (pílula e painel com saúde do áudio por faixa Você/Outros), `CallDetectedPrompt`, `TranscriptView`, `MomentCitation`, `AiNotes`/`AiNotesToggle` (autoria pessoa × IA com citação de momento), `MeetingCard`, `MeetingHeader` e `TemplatePicker` (com `meetingTemplates`), todos com `labels` em pt-BR substituíveis. Bloco `app-meeting-notes`.

  `Waveform` aceita nível real (`level`, `levels`), `processing` e `fade`; `AudioPlayer` ganha `currentTime`, `onTimeUpdate`, `markers` e `ref` com `seekTo`/`play`/`pause`. Sem as props novas, os dois funcionam como antes.

## 0.8.0

### Minor Changes

- 6185482: `ApprovalRequest` ganha `tone` (`neutral` | `info` | `warn` | `bad`), `eyebrow`, `icon`, `children` (corpo entre o preview e o rodapé), `actions` (substitui os botões padrão), os estados `expired` e `superseded` (com textos em `labels`) e `compact` (estado decidido em uma linha). Sem `tone`, o tom vem do `risk`: `low` agora aparece como info (azul), diferente de `medium` (âmbar). Tudo aditivo; quem não passa as props novas vê o mesmo cartão, exceto `risk="low"`, que deixa de ser âmbar.

## 0.7.0

### Minor Changes

- 86d1944: `ApprovalRequest` aceita `labels` (sobrelinha, botões, estados e nome acessível) para apps em outro idioma; o padrão continua em pt-BR (`approvalRequestLabels`).

## 0.6.5

### Patch Changes

- Planilhas, documentos, apresentações e arquivos do Office.

  - `WorkbookView`: planilha no visual do `DataGrid` (abas com `Tabs`, título e fonte acima da tabela, cabeçalho e total fixos, colunas fixas), escrita em código (`Workbook` com fórmulas `{qtd} * {preco}` e total) ou lida de arquivo; desenha só as linhas visíveis (até 50 mil); endereço, fórmula, soma, média e contagem da seleção no rodapé; Ctrl+C copia para colar no Excel.
  - `DocumentView`: documento em páginas A4 medidas (capa, sumário com número de página, tabelas que continuam com o cabeçalho repetido, imprimir/PDF), escrito em código (`OfficeDocument` com blocos) ou lido de arquivo.
  - `readOfficeFile`, `useOfficeFile` e `OfficeFileView`: abrem .xlsx, .csv, .docx e .pptx no navegador, sem dependências e sem enviar o arquivo a nenhum serviço, com estados de carregando, erro (formato antigo, protegido por senha, corrompido, rede) e sem arquivo.
  - Cobertura pensada no que mais aparece em arquivos de empresa: cores de célula, mesclas, linhas e colunas ocultas, gráficos e folhas de gráfico (Excel); CSV do Excel em português (`;`, vírgula decimal, Windows-1252); listas em níveis com a numeração do Word, tabelas mescladas, campos, sumário, cabeçalho e rodapé (Word); modelo da marca, fundos, formas, linhas e setas, imagens recortadas, tabelas com o estilo do PowerPoint e gráficos nativos (PowerPoint).
  - `OfficeSlide` e `presentationSlides` levam o .pptx ao `SlideDeck`; `OfficeChartView` desenha gráficos do Office com os gráficos do DS.
  - `SlideDeck` sem slides mostra um estado vazio em vez de quebrar.
  - Exportar .xlsx/.docx é opcional e fica no app: receita em `templates/office-export.ts` (exceljs e docx) e guia em `docs/guias/office.md`.
  - Testado com 577 arquivos reais do Office (conjunto de testes do Apache POI): 530 abrem e os demais (corrompidos de propósito, protegidos por senha, formato antigo) recebem a mensagem certa, sem nenhuma falha inesperada.

## 0.6.0

### Minor Changes

- 8296cf7: Componentes de histórico, progresso e presença, gestão de agentes de IA e três produtos de exemplo novos.

  - Novos: `RevisionTimeline` (revisões navegáveis por dia), `ProjectProgressCard` (projeto com marcos e próximo passo), `StackedList` (destaque + diretório no mesmo cartão), `LocationTag` (lugar e hora local), `MiniBarChart` (barrinhas interativas).
  - `AgentPlan` ganha modo rico: `collapsible`, e passos com `content` expansível, `durationMs`, `icon` e `defaultOpen`.
  - `Timeline` ganha `leading` (coluna de versão e data: changelog) e `current`.
  - Blocos de gestão de agentes (painel da frota, catálogo, registro do agente com versões, execuções, aprovações, avaliações, modelos e governança).
  - Produtos de exemplo novos: ERP de serviços, comunicação interna e gestão de contratos.
  - ERP com produtos, compras, recebimento, expedição e movimentações; CRM, ATS, SaaS, Atlas e Configurações com fluxos de criar e editar, telas que faltavam e os cinco estados de dados.
  - `formatPercent` e `formatDelta` agora põem espaço inseparável antes do % ("12,5 %"), como pede o guia de escrita; antes saía "12,5%" (o Intl pt-BR cola o sinal). Se o seu app compara esses textos em testes, atualize as expectativas.
  - `RichTextView`: mostra HTML de usuário só para leitura, higienizado por lista de permissões (no lugar de `dangerouslySetInnerHTML`).
  - Painéis de exemplo com estados de carregando e erro; "Precisa de você" padronizado em `ListPanel tone="attention"`.
  - `notify(message, { undo, action: { label, onClick }, tone })`: toast com ação que leva ao resultado ("Ver em Contas a pagar"); `useOperation` aceita `action` no sucesso. A forma antiga `notify(message, undo, tone)` continua valendo.

## 0.5.5

### Patch Changes

- 05884ad: Sidebar com subitens (submenus), no estilo dos blocos sidebar-03/sidebar-07 do shadcn:

  - `NavItem.items` (até 2 níveis), `defaultOpen` e `actions` (⋯ por item). Item-pai sem página própria: `NavParentItem` (sem `href`, a linha inteira abre e fecha). Subitem ativo abre o pai sozinho; fechado, o pai soma os contadores. Teclado: Enter/Espaço, → e ←.
  - Recolhida (`collapsed`): o ícone de um item com subitens abre um menu à direita (hover, clique, →), num portal. `IconRail` também aceita `items`.
  - `NavGroup.collapsible`, `action` (+) e `limit` (“Mais N”).
  - `Sidebar.header` (novo `WorkspaceMenu` com ⌘1…⌘9), `user.menu` (menu da conta; também `email` e `avatar`), `nav` (navegação livre), `storageKey` (lembra o que está aberto) e `onNavigate` (fecha a gaveta do celular).
  - `SectionNav`: navegação longa só de texto (documentação, ajuda, configurações) com filtro e item ativo sempre visível.
  - `BottomNav`/`AppShell.tabs` aceitam itens com subitens. Helpers `navMatches`, `navActiveDeep`, `navHref`.
  - Novos blocos `app-sidebar-submenus` e `app-help-center`; o Nexo ERP (`erp-*`, `fin-*`) passa a usar subitens (Vendas, Cadastros com Produtos, Contas, Controladoria) numa sidebar só.

## 0.5.4

### Patch Changes

- f40fc0c: - `PageHeading` agora separa o cabeçalho do conteúdo sozinho (24 px; 20 px no celular): o primeiro filho de `Page` depois do cabeçalho não fica mais colado nele quando o app não coloca `mt-*`. Um `mt-*` explícito continua valendo. Corrige também `ai-projects`, `crm-company` e `saas-support`.
  - `g4os-ds init`: com vários lockfiles, escolhe o gerenciador pelo campo `packageManager`, pelo que o CI existente já roda ou pelo lockfile mais recente (e diz o porquê); as pastas auditadas vêm de onde o `@g4ai/ds` é importado (ex.: `frontend/src`), não só de nomes fixos.

## 0.5.3

### Patch Changes

- 3933c7b: Compatível com React 18.2+ (além do 19). Peer deps `react`/`react-dom` agora `^18.2.0 || ^19.0.0`; `g4os-ds doctor` aceita 18.2+.

  - `inertProps(flag)`: `inert` que funciona nas duas versões (o React 18 descartava `inert={true}` e drawers/listas recolhidas continuavam no Tab). Usado em `AppShell`, `ThreadView`/layout de IA, `SaveBar` e no bloco `ai-sessions`. Nova regra de auditoria `raw-inert`.
  - `Button`, `IconButton`, `DsLink` e `BubbleContent` com `forwardRef`: funcionam como gatilho de Tooltip/Menu (Base UI) no React 18.
  - `useLayoutEffect` sem aviso no servidor (Next/Remix com React 18) via efeito isomórfico.
  - Tipos compatíveis com `@types/react@18`: componentes de campo devolvem `JSX.Element` (não mais um `ReactNode` expandido com `bigint`/`Promise`) e ícones aceitam `strokeWidth` `number | string` (lucide).
  - Blocos `crm-*`, `saas-*` e `saas-support` renderizam no servidor (não leem `location`/`window` no render).
  - `npm run test:react` + job de CI (matriz React 18/19): tipos, render no servidor e no cliente de todos os blocos e páginas do showcase.

## 0.5.2

### Patch Changes

- ea77f68: Correções da varredura de acessibilidade e layout (`npm run qa:sweep`):

  - `CommandMenu`: a lista só é `listbox` quando tem itens, o separador é decorativo (`role="none"`) e o campo de busca mostra foco no contêiner.
  - `Menu`: o anel de foco do gatilho vence `!ring-0`/`!ring-1` passados em `triggerClassName`.
  - `KanbanBoard`: região rolável focável (`label`, padrão "Quadro"); abas de escopo do `SearchPalette` entram no Tab e trocam com as setas.
  - `AttachmentActions` na vertical volta a ficar sobre a mídia (estava sendo empurrado para fora do card).
  - `ResizableSplit`: nova opção `mobileLayout="stack"` (empilha os painéis abaixo de 768 px em vez de abrir o direito em tela cheia).
  - Alvos de toque de 24 px ou mais: gerenciar ferramentas, voltar no construtor de filtros, cabeçalho ordenável da `DataTable`, grupo da `DataGrid`, etapas do rastro de execução.
  - Links de ação em `ListPanel`, `Banner` e no canto dos campos (`corner`) ganham altura mínima de 24 px; título do card de conexão também.
  - Bloco `ai-task-proposals`: sem opacidade nas propostas seguintes (o texto ficava abaixo de AA).

## 0.5.1

### Patch Changes

- c385a41: Instruções para agentes de IA e lint mais afiados, medidos com um eval de agentes reais.

  - **16 regras novas no `g4os-ds audit` e no `@g4ai/ds/eslint`** (47 no total), nas categorias novas "Anatomia de página" e "Escrita" e em Composição: `page-width-wrapper` (corpo centralizado com `mx-auto max-w-*` fora do eixo do título → `Page width`), `page-heading`, `disabled-wrapper` (opacidade/pointer-events em volta de botão desabilitado → `disabledReason`), `redundant-children`, `field-double-label`, `nested-drawer`, `multiple-primary`, `select-per-row`, `cell-control-label` (com `--fix`), `raw-input`, `raw-table`, `data-states`, `manual-format`, `copy-tone`, `english-copy`, `title-case`. A maioria é aviso: zere os avisos, não só os erros.
  - **Correção no leitor de código do audit**: `{...} />` seguido de `/` na mesma linha deixava de ver strings (falsos negativos e positivos em várias regras).
  - **`ai/core.md` reescrito**: fluxo de trabalho, as nove anatomias com esqueleto, tabela "Qual componente" e os 18 erros que agentes mais cometem (errado → certo, com a regra do audit). Componentes ganharam notas "Uso certo / Evite" (`Page`, `Button`, `Checkbox`, `CheckboxGroup`, `MultiSelect`, `FieldBlock`, `DataTable`, `BulkBar`, `DatePicker`…).
  - **MCP: ferramenta `plan_screen`** (pedido → anatomia, blocos de referência, componente certo por necessidade e checklist).
  - Skills (`g4os-ds`, `ds-create`, `ds-migrate`, `ds-review`) e `templates/AGENTS.snippet.md` com o laço "audit até 0 erros e 0 avisos" e as armadilhas de migração.
  - **Novo starter `templates/vite-app`** (Vite + React + Tailwind v4 + DS, roteador mínimo, ESLint e config do audit).

- c385a41: Revisão geral de componentes, guiada por uma varredura automática (`npm run qa:sweep`) de todas as páginas e blocos em 1440/390 px, claro e escuro.

  **Corrigido na causa (componente/token, não na tela)**

  - Contraste AA: `muted` (#63666e), `accent-deep` (#7d5e33) e `amber` (#b54500) agora passam em branco, `soft`, seleção e fundos `-soft`. Texto nunca mais com opacidade (`text-muted/80` etc. removidos dos componentes).
  - Heatmap, Treemap e barras divergentes escolhem a cor do rótulo pelo fundo real (`useReadableFills` + `data-fill`) e as rampas pulam a faixa sem contraste.
  - `Avatar`, avatar de agente e seletor de agentes: `tintFill` escurece tints claros até AA. `AppIcon variant="soft"` com texto legível.
  - Rótulos que somem no celular passam a `max-sm:sr-only` (botões continuam com nome). `aria-label` em `span`/`div` ganhou `role` (Rating, AnimatedNumber, KeyCombo, BoxPlot, AvatarGroup "+N"). `Meter`/`ProgressRing` com nome padrão. `ItemGroup` com `listitem`. Abas de artefatos: tablist válido, Delete fecha a aba.
  - `.linked-card` com primário `<button>`: o card inteiro volta a ser clicável (o `::after` do link esticado era anulado).
  - Folha inferior (Select/DatePicker no celular): só a lista rola; nada cortado no rodapé.
  - Área de toque mínima: classe `ds-hit` (28 px) em checkbox, remover etiqueta, ícones de 16–20 px e pontos do carrossel.
  - `StagePath`, blocos de código e tabelas largas da documentação roláveis pelo teclado.
  - Campos de `inputs.tsx` (TextField, NumberField, CurrencyField…) ganharam `hideLabel` e respeitam `FieldBlock` (sem rótulo duplicado).
  - Calendário: dias fora do mês e números de semana legíveis.

  **Novos componentes**

  - `SaveBar`: alterações não salvas (⌘S, aviso ao sair, `saveDisabledReason`, erro com a barra aberta).
  - `FormWizard`: formulário em etapas com validação (síncrona ou assíncrona) por etapa.
  - `Tour` + `useTour`: tour guiado ancorado a elementos reais.
  - `NotificationCenter`: sino com caixa de notificações.
  - `Announcement`: pílula de novidade.
  - `AudioPlayer`: gravação de ligação/entrevista e mensagem de voz, navegável por teclado.
  - Utilitários: `useReadableFills`, `surfaceTone`, `effectiveBackground`, `tintFill`.

  **Ferramenta**

  - `npm run qa:sweep` (scripts/qa/sweep.mjs): overflow, elemento cortado, axe-core, console, popup fora da tela, alvo de toque e foco, com relatório agrupado por causa.

- c385a41: Dados e filtros: `useDataView` (busca, filtros, ordenação, paginação, seleção e URL num hook só) e `useUrlState`.

  - **DataTable**: `label`, `sort` + `Column.sortKey` (cabeçalho ordenável com `aria-sort`), `loading` (esqueleto no primeiro carregamento; com linhas, mantém as linhas e mostra barra de progresso), `error`, `maxHeight` com cabeçalho fixo, `Column.footer` (totais), `rowSelected`, `rowTone`, `Column.width` e `align: "center"`.
  - **Seleção no celular**: `selectionColumn` agora aparece ao lado do título nos blocos rotulados (antes sumia abaixo de 1024 px). `useSelection` ganhou `visibleCount`, `hiddenCount`, `keepOnly` e `set`.
  - **Paginação**: `usePagination(rows, size, { resetKey })` volta à página 1 quando o filtro/ordenação muda e ganhou `setPageSize`; `Pagination` ganhou "Por página" (`pageSizeOptions` + `onPageSizeChange`), `noun` e "2 de 9" no celular.
  - **useSort**: números dentro do texto em ordem natural ("Pedido 2" antes de "Pedido 10").
  - **DataGrid**: menu em cada cabeçalho (ordenar, mover, fixar à esquerda, ocultar; salvo com `storageKey`), `columns[].validate` na edição inline (erro visível, antes a mensagem ficava cortada pela célula), `loading` com linhas mantém as linhas, `filtered` + `onClearFilters` para o vazio por filtro com concordância de gênero.
  - **Filtros**: E/OU (`state.match`, `MatchToggle`, `m=or` na URL); "Limpar tudo" aparece também quando só atalhos de faceta estão ativos e no celular; `EmptyFilterResult` com `gender`.
  - **FacetFilter**: opções com `value` ou `id`, `count` por opção, ícone, busca sem acento a partir de 8 opções, nome acessível com os valores escolhidos.

- c385a41: Paridade de recursos com os componentes base do shadcn/ui:

  - **Attachment** (novo, componível): `Attachment`, `AttachmentMedia`, `AttachmentContent`, `AttachmentTitle`, `AttachmentDescription`, `AttachmentActions`, `AttachmentAction`, `AttachmentTrigger`, `AttachmentGroup`. Estados idle/uploading (com `progress`)/processing/error/done, tamanhos default/sm/xs, orientação vertical para miniaturas.
  - **Command componível** (novo): `CommandMenu`, `CommandInput`, `CommandList`, `CommandEmpty`, `CommandLoading`, `CommandGroup`, `CommandItem`, `CommandSeparator`, `CommandShortcut`, `CommandDialog`. Busca sem acento com `keywords`, tolerância a erro de digitação, `filter={false}` para busca no servidor. A raiz se chama `CommandMenu` porque `Command` já é o tipo da `CommandPalette`.
  - **Bubble** (novo): `Bubble`, `BubbleContent`, `BubbleGroup`, `BubbleReactions`, `BubbleReaction`. 7 variantes, alinhamento, grupo com cantos encaixados, status de envio com “Tentar de novo”, `clamp` (Ver mais) e `tooltip`.
  - **Marker** (novo): `Marker`, `MarkerIcon`, `MarkerContent`. Variantes default/border/separator, `tone`, `shimmer`, `render`.
  - **MessageScroller** (novo): `MessageScrollerProvider`, `MessageScroller`, `MessageScrollerViewport`, `MessageScrollerContent`, `MessageScrollerItem`, `MessageScrollerButton` e os ganchos `useMessageScroller`, `useMessageScrollerVisibility`, `useMessageScrollerScrollable`. Acompanha o fim, ancora o turno novo no topo, mantém a posição ao carregar o histórico (`onReachStart`) e conta as mensagens novas.
  - **Menu**: `triggerVariant` (button/ghost/icon/bare, para avatar como gatilho), `width`, `open`/`onOpenChange`, entrada `header`, `description` nos itens, ícones e `disabled` na escolha única e nas marcações, `shortcut` com teclas por plataforma (`["mod", "K"]`). Item desabilitado fica legível em vez de 40 % de opacidade.
  - **Avatar**: `src` (foto, com iniciais de reserva), `initials` opcional (calculadas do nome), tamanhos `xs` e `xl`, `status` (presença), `badge`, `shape`. **AvatarGroup**: `stacked`, `size`, `total`, `action`.
  - **Kbd**: `size`; novo `KbdGroup` com `keys` que vira ⌘/Ctrl, ⇧/Shift, ⌥/Alt conforme a plataforma; `useIsMac` e `keyLabel`. `KeyCombo` passa a usar o KbdGroup.
  - **Carousel**: `orientation="vertical"` (com `height`), `loop`, `index`/`onIndexChange`, `setApi`, `thumbnails`, `counter`; ocupa a largura do contêiner.
  - **Collapsible**: `variant` inline/row/card, `description`, `meta`, `actions`, `icon`, `disabled`; partes componíveis `CollapsibleRoot`, `CollapsibleTrigger`, `CollapsibleContent`.
  - **NavigationMenu**: `icon` nos itens, `indicator` (seta) e `mobile="menu"` (padrão: abaixo de 768 px vira um botão Menu com todos os links); `navigationMenuTriggerClass`.

## 0.5.0

### Minor Changes

- a805df6: Auditoria e lint de boas práticas, do terminal ao editor e ao CI.

  - **31 regras em 9 categorias** (tokens, tipografia, acessibilidade, formatação pt-BR, componentes, React, imports, segurança, performance), num motor só (`scripts/lint/`) usado pelo CLI, pelo plugin ESLint e pela tool `audit` do MCP. Novas: `arbitrary-radius`, `arbitrary-shadow`, `z-index`, `img-alt`, `field-label`, `clickable-div`, `outline-none`, `positive-tabindex`, `locale-missing`, `date-format`, `effect-return`, `deep-import`, `deprecated-export`, `target-blank`, `dangerous-html`, `icon-star-import`, `as-any-props` e, no preset `strict`, `tailwind-text-scale` e `z-index-token`. Menos falso positivo: texto em `<code>`, exemplos em template literal e `var(--token, fallback)` não contam mais.
  - **`g4os-ds audit`**: `--fix` (trocas seguras: `bg-white`→`bg-surface`, `text-gray-500`→`text-muted`, shadcn→DS, `rounded-[12px]`→`rounded-card`, `rel="noopener"`, imports internos e nomes renomeados), `--changed`/`--staged`/`--since`, `--baseline`/`--update-baseline` (só achado novo falha), `--format pretty|json|markdown|sarif|github`, `--preset`, `--rule`, `--max-warnings`, config `g4os-ds.config.json` (com JSON Schema) ou `package.json#"g4os-ds"`, `overrides` por pasta. Exit code 2 para erro de uso/config.
  - **`g4os-ds init`**: cria config, scripts `ds:*` e o workflow de CI (anotações no PR + SARIF); `--eslint`, `--hook lefthook|husky|simple-git-hooks`, `--baseline`, `--dry-run`. Nunca sobrescreve sem `--force`.
  - **`g4os-ds doctor`**: ordem dos imports CSS, integração do Tailwind v4 (PostCSS/Vite), React duplicado, versões dos peers, `themeScript`, `suppressHydrationWarning`, `transpilePackages` desnecessário; `--format github|sarif|json|markdown`.
  - **Plugin ESLint 9** em `@g4ai/ds/eslint` (`configs.recommended|strict|migration`, `config({ standalone: true })` para projetos sem parser de TS), com tipos. ESLint é dependência opcional.
  - Ignorar com motivo: `// g4os-ds-disable-next-line <regra> -- motivo`, `-line`, `disable`/`enable`, `-file` (a sintaxe `ds-audit-ignore` continua valendo).
  - Tool `audit` do MCP: `format`, `preset`, `severity`, `rule`, `changed`, `since`; achados com `fixable` e `replacement`.
  - Starter `templates/next-app` com `g4os-ds.config.json`, `eslint.config.mjs` e scripts `lint`/`ds:*`.

  Como migrar: nada obrigatório. O `audit` agora pega mais coisas (e `icon-button-label` virou erro); para não travar o CI de um projeto em andamento, rode `npx g4os-ds init --baseline` (ou `npx g4os-ds audit --baseline`) e `npx g4os-ds audit --fix`.

- 4ed1fce: Formulários a partir do uso num app real (Radar de Forecast):

  - **Mudança de comportamento:** `Checkbox` mostra o `label` ao lado da caixa por padrão (como o `Switch`). Para só a caixa (seleção de linha de tabela, tarefa com título ao lado), passe `hideLabel`. Novo `description`. Marcado + desabilitado continua lendo como marcado e o texto fica legível.
  - **Regra única de rótulo:** `Select`, `Combobox`, `DatePicker` (e os novos `MultiSelect`, `NativeSelect`, `CheckboxGroup`) desenham o `label` visível acima do campo, com `hint`, `error` e `optional`, como o `TextField`. Dentro de `FieldBlock` o rótulo continua sendo do FieldBlock (sem duplicar); `hideLabel` para toolbar, tabela e filtro; `Select size="compact"` esconde por padrão. Se você desenhava um `<p>` de rótulo acima de um Select, remova-o.
  - Novos: `MultiSelect` (busca, grupos, "Selecionar todos"/"Limpar", `max`, `disabledReason`, resumo ou chips), `CheckboxGroup` (tudo visível, tri-estado, colunas) e `NativeSelect` (o `<select>` do sistema estilizado, com grupos; a regra `native-select` da auditoria só acusa `<select>` cru).
  - `DatePicker`: rodapé "Hoje"/"Limpar", `clearable`, `now`, `hint`/`error`; nome acessível inclui a data escolhida.
  - Celular: `Select` e `DatePicker` abrem como folha inferior (< 640px, por cima da barra inferior); `Combobox`/`MultiSelect` com a largura da tela. `presentation="popover"` mantém o comportamento antigo.
  - `Button`: desabilitado legível (ghost/quiet com texto muted e borda visível; preenchidos esmaecem) e `disabledReason` (continua focável com `aria-disabled` e explica o motivo em tooltip). `ToggleGroup` e `Switch` ganharam `disabled`.
  - `Sidebar`: o `footer` tem respiro próprio; um `Button` ali não vaza mais do trilho.
  - `Page width="wide|medium|narrow|reading"`: cabeçalho, barra e corpo no mesmo eixo (antes era comum centralizar só o corpo com `mx-auto max-w-*` e o título ficava desalinhado).

- 4ed1fce: Paridade com o shadcn/ui.

  - Novos componentes: `Separator` (com rótulo), `ScrollArea` (barra fina, esmaecimento nas bordas), `Label`, `FieldSet`/`FieldGroup`/`FieldSeparator`, família `Item` (`Item`, `ItemGroup`, `ItemMedia`, `ItemContent`, `ItemTitle`, `ItemDescription`, `ItemActions`), `Table` estática (`TableHeader`, `TableBody`, `TableFooter`, `TableRow`, `TableHead`, `TableCell`, `TableCaption`), `Prose` (texto longo), `Toggle`, `ButtonGroup`/`ButtonGroupText`, família `InputGroup` (complementos, botões e faixa de ações dentro do campo), `ColorPicker` (amostras, hex, seletor livre e contraste), `Menubar`, `NavigationMenu`, `SortableList` (arraste e teclado, com anúncios) e `Questionnaire` (uma pergunta por vez, condicionais, atalhos).
  - De/para shadcn/ui → DS em `scripts/data/shadcn-map.json`, publicado como `ai/shadcn-map.json` e `docs/guias/shadcn-equivalencias.md`. Página "shadcn/ui ↔ G4OS-DS" no site e selo "Equivalente no shadcn" em cada página de componente.
  - MCP: `search` entende nomes do shadcn ("alert-dialog", "sheet", "dropdown menu") e devolve o equivalente do DS.

## 0.4.0

### Minor Changes

- 230126c: Servidor MCP compatível com os principais clientes (Claude Code, Codex, Cursor, VS Code/Copilot, Gemini CLI, Zed, Windsurf, Cline, Continue, Goose, JetBrains, opencode, pi via adaptador).

  - Negocia os protocolos 2024-11-05, 2025-03-26, 2025-06-18 e 2025-11-25.
  - stdio mais robusto: CRLF, BOM, pedaços parciais, lotes respondidos como lote, EOF sem quebra de linha, SIGTERM, stdout só para o protocolo.
  - Schemas de entrada portáveis (Gemini, OpenAI): sem `default`, inteiros como `integer`. Argumentos inválidos voltam como `isError` para o modelo corrigir.
  - Prompts `criar-tela`, `revisar-tela` e `adaptar-projeto`; templates de recurso com autocompletar; `logging/setLevel`; `completion/complete`.
  - Respostas longas paginadas com `offset` (cabem no limite do Claude Code); `search` e `audit` com `offset`.
  - Novo modo Streamable HTTP local: `npx -y @g4ai/ds mcp --http [--port 3845]`.
  - Novo guia `docs/guias/mcp.md` com a config de cada cliente, Windows e problemas comuns. Testes com o SDK oficial: `npm run test:mcp`.

## 0.3.0

### Minor Changes

- 2110022: Docs e ferramentas para agentes de IA, e instruções de uso pelo npm.

  - Novo `g4os-ds mcp`: servidor MCP local (sem dependências) com `search`, `get_component`, `list_blocks`, `get_block`, `get_guide`, `get_tokens`, `theme_from_colors`, `audit` e `doctor`. Instale com `claude mcp add g4os-ds -- npx -y @g4ai/ds mcp`.
  - Site publica `llms.txt`, `llms-full.txt`, `ai/` e `docs/` para agentes que leem URLs.
  - `ai/blocks/*.md` agora traz o conceito de cada bloco (objetivo, padrões, o que adaptar, o que evitar) e a lista de componentes usados (estava vazia desde a troca de nome do pacote).
  - `g4os-ds doctor` não pede mais `transpilePackages` quando o pacote vem do npm (compilado).
  - README, guias (novo: Vite), starter `templates/next-app` e skills passam a instalar pelo npm (`pnpm add @g4ai/ds`). Nova seção "Atualizar de versão".

  O que o app precisa fazer: nada. Se o seu `next.config` tem `transpilePackages: ["@g4ai/ds"]` e o pacote vem do npm, pode remover.

## 0.2.1

### Patch Changes

- 80e2fde: README: selos do npm e da licença corrigidos (exibem no npmjs.com) e link da licença absoluto.

Formato: versão · o que mudou · o que o app precisa fazer. Renomeações ficam também em `ai/renames.json` (lidas pela skill `ds-migrate` e pelo `audit`).

## 0.2.0

**Tokens em três camadas, tema escuro e marcas**

- Primitivos `--g4-*` → semânticos `--ds-*` → utilitários Tailwind. Novos utilitários: `bg-surface`, `bg-popover`, `bg-primary`/`text-on-primary`, `text-on-ink`.
- Tema escuro por `<html data-theme="light|dark|system">`; `useTheme`, `ThemeToggle`, `themeScript`. Variante `dark:` ligada a `data-theme`.
- Marcas de cliente por `data-brand` (presets em `themes.css`); `deriveBrand`/`brandCss`/`contrast` em `@g4ai/ds`. Raios escalam com `--ds-radius-scale`; fonte por `--ds-font-sans`.
- `styles.css` já declara os `@source` do DS: o `@source "../node_modules/@g4ai/ds/src"` no app virou opcional.
- **App precisa**: trocar `bg-white` → `bg-surface`/`bg-popover`, `bg-ink text-white` (ação) → `bg-primary text-on-primary`, `text-white` sobre preenchimento forte → `text-on-ink`; `--font-sans` no app → `--ds-font-sans`. `npx g4os-ds audit src` lista tudo.

**Componentes e gráficos**

- Gráficos SVG: área, linha, barras, combo, sparkline, funil, sankey, donut, treemap, barra de proporção, ranking, anel, waterfall, bullet, gauge, dispersão, radar, matriz de calor, calendário de calor, Gantt.
- Dashboard (`KpiCard`, `Delta`, `ChartCard`, `GoalMeter`, `ActivityFeed`, `Leaderboard`, `CompareStat`), estado de tabela (`useSort`, `useSelection`, `BulkBar`, `Pagination`, `PropertyList`), pipelines (`StagePath`, `RecordCard`).
- Entradas (`TextField`, `OtpInput`, `CurrencyField`, máscaras BR, `TagInput`, `Slider`, `ChoiceCards`, `FileDropzone`, `Rating`…), estados de tela, `Banner`, `Tooltip`, `HoverCard`, `Menu`, `Sheet`, `CommandPalette`, `Lightbox`, `Accordion`, `TreeView`, `Carousel`, `SlideDeck`, filtros e busca, padrões de IA e interação.
- Status `done` agora se chama "Concluído".

**Blocos**: SaaS, CRM, ATS, ERP, Financeiro, Autenticação, Configurações, Onboarding, Aplicação, IA e Marketing.

**Kit para agentes**: `ai/` gerado do código (`core.md`, componentes, blocos, tokens, `manifest.json`, `llms.txt`, `renames.json`); CLI `g4os-ds` (`audit`, `doctor`, `guide`); plugin do Claude Code com as skills `g4os-ds`, `ds-create`, `ds-migrate`, `ds-review`, `ds-theme`; `templates/AGENTS.snippet.md`.

## 0.1.0

Primeira versão: tokens, estilos e componentes extraídos do G4 Delivery; showcase.
