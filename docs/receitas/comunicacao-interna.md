# Receita: comunicação interna

Intranet e mural da empresa: comunicados oficiais com leitura obrigatória, conversas em canais, diretório de pessoas, eventos internos, pesquisas de clima (eNPS) e o alcance de cada comunicado. Usado por Comunicação Interna, RH e lideranças; lido por todo mundo.

## Entidades

| Entidade | Identidade | Campos que decidem | Relações |
| --- | --- | --- | --- |
| **Comunicado** | título + autor | situação (rascunho → aprovação → agendado → publicado), público (áreas, cidades, cargos), canais (app, e-mail, WhatsApp), leitura obrigatória com prazo, fixado | autor, aprovador, leituras, comentários |
| **Leitura** | pessoa + comunicado | lido, confirmado, tempo até a leitura | comunicado, pessoa |
| **Canal / mensagem direta** | `#nome` ou pessoa | membros, não lidas, menções a você | mensagens, fios |
| **Pessoa** | nome + avatar | área, cargo, cidade (hora local), presença, gestor | equipe, canais |
| **Evento** | título + data | formato (presencial, on-line, híbrido), local, vagas, inscrição, lista de espera | pessoas inscritas |
| **Pesquisa** | título + período | tipo (eNPS, clima, enquete), participação, anonimato, situação | respostas por área |

Nomes na interface: "Comunicado" é o oficial (com público, aprovação e confirmação); "mensagem" é conversa em canal. Não use os dois como sinônimos.

## Mapa de navegação

```
Sidebar
├─ Mural
│  ├─ Início                leituras obrigatórias pendentes, fixados, feed → Comunicado (página de leitura)
│  ├─ Conversas             canais e mensagens diretas (?canal=, ?fio=)
│  ├─ Pessoas               cards | lista | organograma → perfil em drawer (?pessoa=)
│  ├─ Eventos               agenda por dia → evento em drawer (?id=, ?novo=1)
│  └─ Pesquisas             resultado + lista → pesquisa em drawer
└─ Comunicação interna      (só para quem publica)
   ├─ Publicar comunicado   editor com pré-visualização e aprovação
   └─ Alcance               painel de leitura e engajamento
   ⌘K                       comunicados (!), pessoas (@), canais (#), eventos, ações (>)
   Sino                     NotificationCenter: menções, leituras pendentes, aprovações
```

Contador na sidebar só para o que pede ação: menções a você em Conversas, pesquisas abertas, comunicados esperando sua aprovação. Nunca o total de mensagens não lidas. Casca de referência: `src/blocks/shells/comms-shell.tsx` (`AppShell` + `Sidebar` + `SearchPalette` + `NotificationCenter`).

## Telas e blocos

| Tela | Comece por | Componentes-chave |
| --- | --- | --- |
| Início | bloco `comms-home` | `ListPanel` de leituras obrigatórias antes do feed, fixados no topo, `Tabs` (Todos, Não lidos), feed com autor, público, reações e leituras, coluna da semana (eventos, enquete, aniversários, novos colegas) com `AvatarGroup` |
| Comunicado | bloco `comms-announcement` | `ReadingDocument` (tipografia de leitura), `SplitLayout` + `PropertyList`, `Checkbox` + botão "Confirmar leitura" com `useOperation`, comentários com respostas, alcance por área com `Meter`/`ProgressRing` e lembrete a quem não leu (só para quem publica) |
| Conversas | bloco `comms-channels` | app de altura total (lista, conversa, fio), `TeamMessage`, `TeamComposer`, `DateSeparator`, `TypingIndicator`, `FileCard`, `ActionRequiredBanner` para pedido com prazo |
| Pessoas | bloco `comms-people` | `PageToolbar` + `FilterBar` + `TableSearch`, `SegmentedControl` Cards \| Lista \| Organograma, `TreeView`, `LocationTag` com hora local, `StackedList` "Online agora", perfil em `Drawer` |
| Eventos | bloco `comms-events` | lista agrupada por dia, `LocationTag` do local, `Meter` de vagas com palavra, inscrição com desfazer, detalhe e criação em `Drawer`, `DateTimePicker`, `ChoiceCards` do formato |
| Pesquisas | bloco `comms-surveys` | `KpiGrid` + `NpsChart` antes da lista, `BarList` de participação por área, resultado em `Drawer`, criação com pré-visualização em `Questionnaire` |
| Publicar comunicado | bloco `comms-compose` | `Stepper` do ciclo, `RichTextEditor`, `MultiSelect` de público com estimativa de alcance, `CheckboxGroup` de canais, `DateTimePicker` com fuso, pré-visualização computador \| celular, `OperationButton` "Enviar para aprovação" |
| Alcance | bloco `comms-analytics` | `KpiGrid` com base explícita, `ListPanel` de comunicados com leitura baixa, `LineChart` leitura × meta, `HeatmapMatrix` área × cidade, `DataTable` ordenável, exportar CSV |

## Regras específicas

- **Oficial e conversa são superfícies diferentes.** Comunicado tem público, aprovação e confirmação de leitura; canal não tem. Comunicado citado num canal aparece como cartão que leva ao Mural, não como texto solto.
- **Leitura obrigatória pede aceite explícito** (caixa + botão), com prazo visível. Abrir não é confirmar; entregar não é ler.
- **O que pede ação vem antes do feed**: leituras obrigatórias pendentes no topo do Início; comunicados com leitura baixa antes dos gráficos de alcance.
- **Alcance por área é dado de gestão**: aparece só para quem publica, nunca para todo o público.
- **Público de empresa inteira passa por aprovação.** WhatsApp não é canal padrão: só para quem não tem e-mail corporativo ou para urgência.
- **Horário sempre com fuso** quando o time está em várias cidades (`LocationTag`, `DateTimePicker` com fuso). Presença sempre com palavra ("Online", "Em reunião", "Visto há 2 h").
- **Anonimato de pesquisa**: nunca mostre resultado de grupo com menos de 5 respostas; o aviso de anonimato aparece onde houver resultado. eNPS sempre com a base de comparação (trimestre anterior).
- Inscrição em evento e marcar como lido têm desfazer. Rascunho do comunicado nunca se perde em erro de envio (`OperationFeedback`).
- Números de alcance com `formatNumber` e `formatPercent`; "há 16 min" com `formatRelative`.

## Blocos de referência

`comms-home`, `comms-announcement`, `comms-channels`, `comms-people`, `comms-events`, `comms-surveys`, `comms-compose`, `comms-analytics`. Casca: `shells/comms-shell.tsx`. Categoria **Comunicação** no showcase. Padrões relacionados: [editor de texto](../padroes/editor-de-texto.md) e [feedback](../padroes/feedback.md).
