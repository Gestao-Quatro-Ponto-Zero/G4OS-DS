# Mural · conversas

- Arquivo: `src/blocks/comms-channels.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: Comunicação
- Preview: showcase `#/frame/comms-channels` (`?theme=dark` para o escuro)

Canais e mensagens diretas do time: lista com não lidas e menções, conversa com separador de data, menções destacadas, reações, fios de resposta, arquivos, comunicado compartilhado, pedido com envio de arquivo e composer.

## Conceito

**Objetivo:** Conversar com o time no mesmo lugar dos comunicados, sem confundir conversa com aviso oficial.

**Padrões aplicados**

- Anatomia G · App de altura total: lista de canais, conversa e fio/detalhes; só a conversa rola
- Canal e DM pela URL (?canal=); fio pela URL (?fio=); no celular cada um abre em tela cheia com voltar
- Menção a você destacada; contador na lista só para menções (não para total de mensagens)
- Comunicado oficial aparece como cartão que leva ao Mural, não como texto solto
- Pedido com prazo vira faixa de ação obrigatória com envio de arquivo

**Quando usar e o que adaptar**

- Chat de atendimento interno (TI, RH), sala de projeto, canal com fornecedores

**Evite**

- Publicar comunicado oficial só num canal (não tem confirmação de leitura)
- Badge com total de mensagens não lidas em todo canal

## Componentes usados

`ActionRequiredBanner`, `Avatar`, `AvatarGroup`, `Badge`, `Button`, `Combobox`, `DateSeparator`, `Empty`, `FileCard`, `IconButton`, `Marker`, `Modal`, `SearchInput`, `Skeleton`, `TeamComposer`, `TeamMessage`, `TypingIndicator`, `formatNumber`, `normalize`, `notify`, `plural`
