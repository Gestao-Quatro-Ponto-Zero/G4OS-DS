# Layout e navegação

## A casca (`AppShell`)

```
┌──────────┬───────────────────────────────────────────┐
│ Sidebar  │ [ShellBanner opcional: conexão, cota]      │
│ 224 px   ├───────────────────────────────────────────┤
│ (64 px   │ PageHeading (gruda e compacta ao rolar)    │
│ recolh.) │                                            │
│          │ Page: área que rola sozinha                │
│          │                                            │
└──────────┴───────────────────────────────────────────┘
Celular (< 768 px): barra de 48 px no topo + sidebar em drawer.
```

- `<html className="ds-app">`: o documento **nunca rola**. Cada área de trabalho tem a própria rolagem (página, sidebar, drawer, kanban, painel de conversa). Isso mantém cabeçalhos fixos confiáveis e evita duplo scroll. Em site de conteúdo (não app), remova `ds-app`.
- `AppShell` monta o `Toaster`, o link "Pular para o conteúdo" e o drawer do celular. Passe a `Sidebar` pela função `sidebar={({ mobileOpen }) => <Sidebar mobileOpen={mobileOpen} … />}`.
- Faixa global (`ShellBanner`) só para estado do app inteiro: sem conexão, cota estourada, ambiente de teste.

## Sidebar

- Marca + nome do produto + workspace no topo; busca/paleta (`onSearch`) logo abaixo; grupos rotulados; pessoa no rodapé.
- **Até 10 itens em até 2 grupos.** Mais que isso, o produto tem módulos demais na raiz: agrupe em páginas com abas.
- Item = destino global (lista de uma entidade, dashboard, agenda). Registro individual nunca vai para a sidebar.
- `badge` no item só para **pendência que pede ação** (alertas não lidos, aprovações), nunca total.
- Ordem: o que se usa todo dia primeiro (Início, entidade principal), configuração por último.

## Tipos de página

| Tipo | Estrutura | Exemplo |
| --- | --- | --- |
| **Global** (lista ou dashboard) | `PageHeading` sem trilha + conteúdo | Negócios, Vagas, Pedidos, Início |
| **Entidade com seções** | `EntityHeader` (marca, nome, sinais, ações, abas) + conteúdo da aba | Empresa (visão geral, contatos, negócios, arquivos) |
| **Registro** | `ContextBar` (uma linha com ancestrais) + título do registro + `SplitLayout` (conteúdo + lateral de propriedades) | Negócio, Candidato, Pedido, Fatura |
| **Configuração** | `PageHeading` + navegação lateral secundária (seções) + formulário em `ReadingColumn` | Configurações |
| **Autenticação / onboarding** | Tela cheia sem sidebar, cartão central ou split com painel `navy` | Entrar, Criar conta, Primeiros passos |

## Regras de navegação

1. **A trilha mostra só ancestrais, nunca a página atual.** O título é a página atual. Página global não tem trilha (a sidebar já localiza).
2. **Página de registro não herda o cabeçalho do pai.** Um negócio não mostra as abas da empresa; mostra `ContextBar`: `[marca] Acme › Negócios` e o próprio título.
3. **Uma camada, uma pergunta.** Cada faixa horizontal no topo responde a uma pergunta diferente. Duas faixas que dizem a mesma coisa viram uma.
4. **Cada bloco de informação tem uma casa.** Se o contato principal aparece na lateral do registro, não repita no cabeçalho e na visão geral.
5. **Orçamento de altura.** Em 1440 × 900, o conteúdo útil começa antes de 320 px em página de entidade e antes de 220 px em página de registro.
6. **Abas para seções de uma entidade** (`Tabs`, com `href` quando mudam a URL). **Controle segmentado para visualização/recorte** da mesma coleção (`SegmentedControl`: Lista | Quadro; 30 d | 90 d).
7. **Contador em aba só quando pede ação** (não lidas, bloqueadas). Nunca total.
8. **URL reflete o estado navegável**: aba, filtros, registro aberto em drawer (`?negocio=123`), página. Preferências de visualização (densidade, lista/cards) ficam no `localStorage` por área (`useCollectionDisplay`).

## Cabeçalho que gruda

`PageHeading` e `EntityHeader` usam `StickyHeader`: grudam no topo da área rolável, recolhem descrição e trilha, reduzem o título e ganham uma linha inferior que atravessa as margens. Não crie cabeçalho fixo à mão.

## Ações no cabeçalho

- Até **1 primário + 2 secundários** visíveis; o resto no `ActionMenu` (⋯).
- Ordem da direita para a esquerda: primário na ponta, secundários antes.
- No celular, rótulos longos marcados com `data-collapse-label` somem e fica o ícone.

## Paleta de comandos e busca global

Produtos com mais de ~5 entidades devem ter busca global (`⌘K`) ligada ao `onSearch` da sidebar: navegar para registros, criar coisas e trocar de workspace. Use `CommandPalette` + `useCommandShortcut` (bloco `app-command-palette`).
