# Mural · início

- Arquivo: `src/blocks/comms-home.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: Comunicação
- Preview: showcase `#/frame/comms-home` (`?theme=dark` para o escuro)

Início da intranet: leituras obrigatórias pendentes, comunicados fixados, feed com reações e leitura, eventos da semana, enquete aberta, aniversariantes e quem chegou.

## Conceito

**Objetivo:** Em um minuto, saber o que a empresa precisa que eu leia, o que mudou e o que está acontecendo com as pessoas.

**Padrões aplicados**

- Anatomia B · Painel de leitura: cabeçalho fixo; “Precisa de você” (leitura obrigatória) antes do feed
- Fixados no topo; feed de comunicados com autor, público, reações e quantas pessoas leram
- Coluna lateral com o que é da semana: eventos, enquete aberta, aniversários e novos colegas
- Cinco estados: ?estado=carregando (forma final da página), erro (com saída) e vazio (feed sem comunicados); aba Não lidos vazia oferece Ver todos

**Quando usar e o que adaptar**

- Portal do franqueado (comunicados da franqueadora), portal do parceiro, intranet de escola

**Evite**

- Feed sem distinguir oficial (comunicado) de conversa (canal)
- Contador de total de comunicados na navegação: só o que pede ação

## Componentes usados

`Avatar`, `AvatarGroup`, `Badge`, `Button`, `Empty`, `ErrorState`, `ListPanel`, `ListRow`, `Meter`, `Page`, `PageHeading`, `Skeleton`, `Tabs`, `formatDate`, `formatNumber`, `formatPercent`, `formatRelative`, `notify`, `plural`
