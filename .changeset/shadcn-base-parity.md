---
"@g4ai/ds": patch
---

Paridade de recursos com os componentes base do shadcn/ui:

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
