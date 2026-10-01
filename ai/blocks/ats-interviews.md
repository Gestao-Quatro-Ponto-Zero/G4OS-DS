# Entrevistas

- Arquivo: `src/blocks/ats-interviews.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: ATS
- Preview: showcase `#/frame/ats-interviews` (`?theme=dark` para o escuro)

Agenda de entrevistas por dia com sala/link, avaliações pendentes em destaque e preenchimento do scorecard em uma folha lateral (critérios da vaga, parecer e comentário).

## Conceito

**Objetivo:** Organizar a agenda de entrevistas e não deixar avaliações pendentes.

**Padrões aplicados**

- Anatomia A · Lista agrupada por dia, cabeçalho fixo
- Pendências de avaliação em destaque no topo
- Scorecard em folha lateral com os critérios da vaga

**Quando usar e o que adaptar**

- Agenda de visitas comerciais, reuniões de onboarding, auditorias

**Evite**

- Formulário de avaliação em outra página (perde a agenda)

## Componentes usados

`Avatar`, `AvatarGroup`, `Badge`, `Button`, `ChoiceCards`, `Empty`, `ListPanel`, `Page`, `PageHeading`, `Rating`, `SegmentedControl`, `Sheet`, `TextareaField`, `notify`, `plural`
