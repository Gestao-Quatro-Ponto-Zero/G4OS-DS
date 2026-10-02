# Agenda dos técnicos

- Arquivo: `src/blocks/srv-schedule.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: Serviços
- Preview: showcase `#/frame/srv-schedule` (`?theme=dark` para o escuro)

Semana por técnico (linhas) e dia (colunas) com OS e visitas preventivas alocadas, carga em horas, hoje destacado e fila de OS sem técnico para alocar. Alternador para o mês; no celular, a agenda de um técnico por vez. ?tecnico= destaca a linha.

## Conceito

**Objetivo:** Encaixar cada OS no técnico certo sem estourar a carga de ninguém e sem deixar chamado sem dono.

**Padrões aplicados**

- Anatomia B · Painel de agenda: cabeçalho fixo com a semana (WeekPicker) e o modo Semana/Mês à direita
- Grade técnico × dia feita com tokens: OS em chip com hora, cliente e prioridade em palavra; visita preventiva em chip neutro
- Carga semanal por técnico com barra (horas alocadas de 44 h); folga em palavra
- Fila “Sem técnico” ao lado: Alocar abre o mesmo Modal de agendamento do quadro e do registro
- Celular: escolhe o técnico e vê a MiniAgenda dele; mês em MonthCalendar
- Cinco estados: ?estado=carregando|vazio|erro simula

**Quando usar e o que adaptar**

- Escala de plantão, agenda de consultórios por profissional, rotas de entrega por motorista

**Evite**

- Arrastar como único jeito de alocar (inacessível por teclado)
- Cor do técnico sem nome na célula

## Componentes usados

`AgendaEvent`, `Avatar`, `Badge`, `Button`, `Empty`, `ListPanel`, `ListRow`, `Meter`, `MiniAgenda`, `MonthCalendar`, `Page`, `PageHeading`, `SegmentedControl`, `Select`, `Skeleton`, `Table`, `WeekPicker`, `addDays`, `formatNumber`, `startOfWeek`, `weekdayShort`
