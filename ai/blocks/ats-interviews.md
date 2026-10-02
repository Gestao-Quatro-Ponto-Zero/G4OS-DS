# Entrevistas

- Arquivo: `src/blocks/ats-interviews.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: ATS
- Preview: showcase `#/frame/ats-interviews` (`?theme=dark` para o escuro)

Agenda de entrevistas por dia com sala/link, avaliações pendentes em destaque, scorecard em folha lateral e agendamento em gaveta (?candidato= abre já preenchido) com horários livres, entrevistadores e link.

## Conceito

**Objetivo:** Organizar a agenda de entrevistas e não deixar avaliações pendentes.

**Padrões aplicados**

- Anatomia A · Lista agrupada por dia, cabeçalho fixo
- Pendências de avaliação em destaque no topo
- Scorecard em folha lateral com os critérios da vaga
- Agendar em Drawer sem sair da agenda: ?candidato=c4 (vindo do banco de talentos) abre já preenchido
- Entrar na sala e Como chegar são links (abrem o Meet ou o mapa)
- Cinco estados: ?estado=carregando|vazio|erro simula

**Quando usar e o que adaptar**

- Agenda de visitas comerciais, reuniões de onboarding, auditorias

**Evite**

- Formulário de avaliação em outra página (perde a agenda)
- Agendar por data solta sem mostrar os horários livres

## Componentes usados

`Avatar`, `AvatarGroup`, `Badge`, `Button`, `ChoiceCards`, `Combobox`, `Drawer`, `Empty`, `ListPanel`, `MultiSelect`, `OperationButton`, `OperationFeedback`, `Page`, `PageHeading`, `Rating`, `SegmentedControl`, `Select`, `Sheet`, `Skeleton`, `Slot`, `SlotPicker`, `TextField`, `TextareaField`, `buttonClass`, `formatDate`, `notify`, `plural`, `useOperation`
