# Mural · comunicado

- Arquivo: `src/blocks/comms-announcement.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: Comunicação
- Preview: showcase `#/frame/comms-announcement` (`?theme=dark` para o escuro)

Comunicado oficial (?id=) em tipografia de leitura: autor e público, confirmação de leitura obrigatória, reações, comentários com respostas e, para quem publica, o alcance por área com lembrete a quem não leu.

## Conceito

**Objetivo:** Ler um comunicado oficial com calma, confirmar que entendeu quando é obrigatório e, para quem publicou, saber quem ainda não leu.

**Padrões aplicados**

- Anatomia C · Registro de leitura: trilha + título + Confirmar leitura fixos; coluna de propriedades e alcance à direita
- ReadingDocument: serifa de leitura e medida curta para texto longo
- Confirmação obrigatória com aceite explícito (caixa + botão), com operação assíncrona e erro em bloco
- Alcance por área só para quem publica: lidos/total, mediana até a leitura e lembrete a quem não leu
- Comentários com respostas oficiais; reações não substituem a confirmação

**Quando usar e o que adaptar**

- Política interna com aceite (compliance, LGPD), termo de ciência, atualização de contrato com o franqueado

**Evite**

- Contar abertura como confirmação de leitura obrigatória
- Mostrar alcance por área para todo o público (é dado de gestão)

## Componentes usados

`ActionMenu`, `Avatar`, `Badge`, `Button`, `Callout`, `Checkbox`, `ConfirmDialog`, `Empty`, `LocationTag`, `Meter`, `OperationButton`, `OperationFeedback`, `Page`, `PageHeading`, `ProgressRing`, `PropertyList`, `ReadingDocument`, `SplitLayout`, `TextareaField`, `formatDate`, `formatNumber`, `formatPercent`, `formatRelative`, `notify`, `plural`, `useOperation`
