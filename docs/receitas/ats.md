# Receita: ATS (recrutamento)

Vagas, candidatos em processo seletivo, entrevistas, avaliações e propostas.

## Entidades

| Entidade | Identidade | Campos que decidem | Relações |
| --- | --- | --- | --- |
| **Vaga** | título + área | status (aberta/pausada/fechada), recrutador, gestor, prazo, nº de posições | candidaturas, etapas |
| **Candidato** | nome + avatar | fonte, localização, pretensão, currículo | candidaturas |
| **Candidatura** | candidato × vaga | etapa, nota média, idade na etapa | entrevistas, avaliações |
| **Entrevista** | data + tipo | entrevistadores, formato, feedback enviado? | candidatura |
| **Avaliação (scorecard)** | critério × nota | nota 1–5 por critério, recomendação | entrevista |

## Mapa de navegação

```
Sidebar
├─ Início        dashboard de recrutamento
├─ Vagas         lista/cards              → Vaga (entidade: Pipeline | Detalhes | Relatório)
├─ Candidatos    banco de talentos        → Candidato (página de registro)
├─ Entrevistas   agenda
└─ Relatórios    funil, tempo até contratação, fontes
   Configurações etapas, modelos de scorecard, e-mails, equipe
```

## Telas e componentes

| Tela | Componentes-chave |
| --- | --- |
| Dashboard | `KpiCard` (vagas abertas, candidatos ativos, tempo até contratação com `goodWhen="down"`, aceite de proposta), `FunnelChart variant="columns"` (inscritos → contratados), `BarList` de fontes, `CalendarHeatmap` de entrevistas, `ListPanel tone="attention"` com entrevistas sem feedback |
| Pipeline da vaga | `EntityHeader` da vaga + `KanbanBoard` de candidaturas; `RecordCard` com avatar (`leading`), nota (`Rating` ou `ProgressRing`), idade na etapa em `meta` |
| Candidato | `ContextBar` (Vagas › Designer Sênior), `StagePath` com `outcome` Contratado/Reprovado, `SplitLayout`: abas Linha do tempo \| Avaliações \| Currículo; lateral `PropertyList` + `Timeline` |
| Avaliação | `Modal md` ou página: `Rating` por critério, `ChoiceCards` recomendação (Forte sim → Forte não), `TextareaField` |
| Agendar entrevista | `Drawer`: `Combobox` múltiplo de entrevistadores, `DatePicker`, horário, `Select` formato |
| Proposta | `Stepper` (dados → aprovação → envio), `CurrencyField` |

Blocos: `ats-dashboard` (painel de recrutamento), `ats-jobs` (vagas abertas), `ats-pipeline` (candidatos da vaga), `ats-candidate` (perfil do candidato). Categoria **ATS** no showcase.

## Regras específicas

- Reprovação exige motivo e oferece e-mail de retorno ao candidato.
- Candidato parado > 7 dias na etapa → `tone="warn"`.
- Nota média só aparece com ≥ 2 avaliações; antes, "Aguardando avaliações".
- Dados pessoais sensíveis (pretensão, documentos) visíveis só para quem tem permissão; mostre "Restrito" em `text-muted`, nunca esconda o campo sem aviso.
