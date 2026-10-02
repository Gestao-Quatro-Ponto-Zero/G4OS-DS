# Central de notificações

- Arquivo: `src/blocks/app-notifications.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: Aplicação
- Preview: showcase `#/frame/app-notifications` (`?theme=dark` para o escuro)

Caixa de entrada com abas (todas, não lidas, menções), grupos por dia, lida/não lida, arquivar e marcar tudo como lido.

## Conceito

**Objetivo:** Ver o que pede atenção agora e limpar a caixa rápido, para quem recebe avisos de vários módulos.

**Padrões aplicados**

- Anatomia A · Lista: cabeçalho fixo com 'Marcar tudo como lido'
- Abas Todas / Não lidas / Menções; grupos por dia
- Cada aviso abre o registro e marca como lido; arquivar com desfazer

**Quando usar e o que adaptar**

- Central de avisos de qualquer produto; no celular, item da pílula com contador

**Evite**

- Notificação que não leva a lugar nenhum

## Componentes usados

`ActionMenu`, `Avatar`, `Button`, `CountBadge`, `Empty`, `Page`, `PageHeading`, `Skeleton`, `Tabs`, `Tooltip`, `notify`
