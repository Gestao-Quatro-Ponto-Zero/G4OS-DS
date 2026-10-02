# Mural · eventos

- Arquivo: `src/blocks/comms-events.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: Comunicação
- Preview: showcase `#/frame/comms-events` (`?theme=dark` para o escuro)

Agenda de eventos internos por dia: presencial, on-line e híbrido, local com hora local, vagas e inscrição com desfazer, lista de espera, detalhe em gaveta com adicionar à agenda e criação de evento.

## Conceito

**Objetivo:** Ver o que vai acontecer, onde e quando (no meu fuso), e se inscrever em um clique.

**Padrões aplicados**

- Anatomia A · Lista agrupada por dia: cabeçalho fixo + PageToolbar com formato, cidade e categoria
- LocationTag no local do evento: hora local de Manaus, Cuiabá ou Lisboa ao lado do horário
- Vagas como medidor com palavra; esgotado vira lista de espera (botão diz o que faz)
- Detalhe (?id=) e criação (?novo=1) em Drawer, sem perder a agenda
- Cinco estados: ?estado=carregando|vazio|erro simula; vazio por filtro com Limpar

**Quando usar e o que adaptar**

- Treinamentos obrigatórios (com presença), agenda de visitas a clientes, turmas de curso

**Evite**

- Horário sem fuso quando o time está em várias cidades
- Inscrição sem desfazer

## Componentes usados

`ActionMenu`, `Avatar`, `AvatarGroup`, `Badge`, `Button`, `ChoiceCards`, `DateTimePicker`, `Drawer`, `Empty`, `EmptyFilterResult`, `FilterBar`, `FilterField`, `LocationTag`, `Meter`, `MultiSelect`, `NumberField`, `OperationButton`, `OperationFeedback`, `Page`, `PageHeading`, `PageToolbar`, `PropertyList`, `Select`, `Switch`, `Tabs`, `TextField`, `TextareaField`, `TimePicker`, `formatNumber`, `notify`, `plural`, `useFilters`, `useOperation`
