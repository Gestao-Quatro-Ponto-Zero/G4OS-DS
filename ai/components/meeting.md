# meeting

Arquivo: `src/components/meeting.tsx` · importe de `@g4ai/ds`.

Reuniões (notas com IA): LiveRecordingIndicator (saúde da gravação por faixa), CallDetectedPrompt, TranscriptView, MomentCitation, AiNotes/AiNotesToggle (autoria pessoa × IA), MeetingCard, MeetingHeader, TemplatePicker.

## AiNotes

Notas da reunião com autoria visível: o que a pessoa escreveu fica em tinta (`text-ink`); o que a IA completou fica em tom suave com marcador dourado, e cada bullet da IA leva o momento citado (MomentCitation).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `sections` * | `NoteSection[]` |  |  |
| `className` | `string \| undefined` |  |  |
| `currentTime` | `number \| undefined` |  | Posição do áudio: a citação em andamento fica marcada. |
| `labels` | `Partial<AiNotesLabels> \| undefined` |  |  |
| `onSeek` | `((t: number) => void) \| undefined` |  |  |
| `onToggleTask` | `((id: string, done: boolean) => void) \| undefined` |  |  |
| `showLegend` | `boolean \| undefined` | `true` |  |
| `turns` | `TranscriptTurn[] \| undefined` |  | Transcrição: as citações mostram o trecho no hover. |
| `view` | `"mine" \| "enhanced" \| undefined` | `"enhanced"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/reuniao-notas`):

```tsx
<AiNotesToggle value={versao} onChange={setVersao} />
<AiNotes
  sections={[
    { id: "pipeline", title: "Pipeline do Q4", items: [
      { id: "n1", author: "me", text: "3 travados no jurídico", children: [
        { id: "n2", author: "ai", text: "Todos esbarram na cláusula de multa…", citations: [{ t: 80, turnId: "t3" }] },
      ] },
    ] },
  ]}
  view={versao}
  turns={transcricao}
  onSeek={irPara}
  onToggleTask={marcarTarefa}
/>
```

## aiNotesLabels (const)

Textos padrão (pt-BR) do AiNotes.

## AiNotesLabels (type)

Textos do AiNotes e do AiNotesToggle.

```ts
type AiNotesLabels = { mine: string; enhanced: string; toggle: string; legendMe: string; legendAi: string; emptyMine: string; task: (text: string) => string; aiWrote: string; }
```

## AiNotesToggle

Alterna "Minhas notas" e "Notas aprimoradas".

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `onChange` * | `(v: "mine" \| "enhanced") => void` |  |  |
| `value` * | `"mine" \| "enhanced"` |  |  |
| `className` | `string \| undefined` |  |  |
| `labels` | `Partial<AiNotesLabels> \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/reuniao-notas`):

```tsx
<AiNotesToggle value={versao} onChange={setVersao} />
<AiNotes
  sections={[
    { id: "pipeline", title: "Pipeline do Q4", items: [
      { id: "n1", author: "me", text: "3 travados no jurídico", children: [
        { id: "n2", author: "ai", text: "Todos esbarram na cláusula de multa…", citations: [{ t: 80, turnId: "t3" }] },
      ] },
    ] },
  ]}
  view={versao}
  turns={transcricao}
  onSeek={irPara}
  onToggleTask={marcarTarefa}
/>
```

## callDetectedLabels (const)

Textos padrão (pt-BR) do CallDetectedPrompt.

## CallDetectedLabels (type)

Textos do CallDetectedPrompt.

```ts
type CallDetectedLabels = { title: string; description: (app: string, host?: string) => string; record: string; dismiss: string; never: (app: string) => string; }
```

## CallDetectedPrompt

Aviso discreto quando outro app (Zoom, Meet, Teams) começa a usar o microfone: oferece gravar notas, sem gravar sozinho.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `app` * | `string` |  | "Google Meet", "Zoom", "Microsoft Teams". |
| `onRecord` * | `() => void` |  |  |
| `className` | `string \| undefined` |  |  |
| `host` | `string \| undefined` |  | Onde roda: "Chrome", "Safari". |
| `icon` | `ReactNode` |  | Ícone ou logo do app (16 px). |
| `labels` | `Partial<CallDetectedLabels> \| undefined` |  |  |
| `onDismiss` | `(() => void) \| undefined` |  |  |
| `onNever` | `(() => void) \| undefined` |  | Mostra "Não perguntar para <app>". |
| `variant` | `"card" \| "toast" \| undefined` | `"card"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/reuniao-call-detectada`):

```tsx
<CallDetectedPrompt variant="toast" app="Zoom" onRecord={gravar} onDismiss={fechar} />
```

## findTurnAt (function)

Trecho em andamento no instante `t` (o último que começou até `t`).

```ts
findTurnAt(turns, t): TranscriptTurn | undefined
```

## formatMoment (function)

Segundos → "12:04" (ou "1:02:04" a partir de uma hora).

```ts
formatMoment(seconds): string
```

## LiveRecordingIndicator

Gravação de reunião em andamento, com SAÚDE e não só "gravando": nível real (`level`, 0–1, RMS do microfone), faixas Você/Outros com sinal ou silêncio e uma frase de saúde ("ouvindo · 148 palavras no último minuto").

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `state` * | `RecordingState` |  |  |
| `className` | `string \| undefined` |  |  |
| `elapsedMs` | `number \| undefined` |  | Tempo decorrido controlado (ms). |
| `healthText` | `ReactNode` |  | "ouvindo · 148 palavras no último minuto" ou o aviso do estado `warning`. |
| `labels` | `Partial<LiveRecordingLabels> \| undefined` |  |  |
| `level` | `number \| undefined` |  | Nível atual 0–1 (mistura das faixas). |
| `onOpen` | `(() => void) \| undefined` |  | Pílula: clique abre a reunião (ou expande o painel). |
| `onPause` | `(() => void) \| undefined` |  |  |
| `onResume` | `(() => void) \| undefined` |  |  |
| `onRetry` | `(() => void) \| undefined` |  |  |
| `onStop` | `(() => void) \| undefined` |  |  |
| `startedAt` | `number \| undefined` |  | Início (epoch ms). O cronômetro anda sozinho enquanto grava. |
| `tracks` | `RecordingTrack[] \| undefined` |  |  |
| `variant` | `"pill" \| "panel" \| undefined` | `"pill"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/reuniao-gravacao`):

```tsx
<LiveRecordingIndicator
  state="recording"
  startedAt={inicio}
  level={nivel}                 // 0–1, RMS do microfone
  healthText="ouvindo · 148 palavras no último minuto"
  onOpen={abrirPainel}
  onPause={pausar}
  onStop={encerrar}
/>
```

## liveRecordingLabels (const)

Textos padrão (pt-BR) do LiveRecordingIndicator.

## LiveRecordingLabels (type)

Textos do LiveRecordingIndicator.

```ts
type LiveRecordingLabels = { recording: string; paused: string; processing: string; warning: string; failed: string; pause: string; resume: string; stop: string; stopAndEnhance: string; retry: string; open: string; mic: string; system: string; trackOk: string; trackSilent: string; ariaLabel: (state: string, time: string) => string; }
```

## MeetingCard

Linha de uma reunião gravada: horário e duração, título, origem (app da call, "Nova reunião"), resumo de uma linha e participantes quando houver.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `time` * | `string` |  | "14:00". |
| `title` * | `string` |  |  |
| `action` | `ReactNode` |  |  |
| `attendees` | `MeetingPerson[] \| undefined` |  |  |
| `className` | `string \| undefined` |  |  |
| `duration` | `string \| undefined` |  | "32 min". |
| `labels` | `Partial<MeetingCardLabels> \| undefined` |  |  |
| `onOpen` | `(() => void) \| undefined` |  |  |
| `snippet` | `string \| undefined` |  | Primeira linha das notas ou do resumo. |
| `source` | `string \| undefined` |  | "Google Meet", "Zoom", "Nova reunião". |
| `status` | `MeetingStatus \| undefined` | `"done"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/reuniao-lista-e-cabecalho`):

```tsx
<MeetingCard title="Daily de vendas" time="09:30" duration="12 min" source="Google Meet" snippet="Meta da semana em 74 %" attendees={pessoas} onOpen={abrir} />
```

## meetingCardLabels (const)

Textos padrão (pt-BR) do MeetingCard.

## MeetingCardLabels (type)

Textos do MeetingCard.

```ts
type MeetingCardLabels = Record<Exclude<MeetingStatus, "done">, string> & { open: (title: string) => string }
```

## MeetingHeader

Cabeçalho da página de uma reunião: título, data, duração, participantes, modelo de notas (TemplatePicker) e ações (Perguntar, Exportar, Compartilhar).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `date` * | `string` |  | "Hoje, 14:00" ou "seg., 6 de out." (já formatado). |
| `title` * | `string` |  |  |
| `actions` | `ReactNode` |  | Substitui as ações padrão. |
| `attendees` | `MeetingPerson[] \| undefined` |  |  |
| `className` | `string \| undefined` |  |  |
| `duration` | `string \| undefined` |  |  |
| `labels` | `Partial<MeetingHeaderLabels> \| undefined` |  |  |
| `onAsk` | `(() => void) \| undefined` |  |  |
| `onExport` | `(() => void) \| undefined` |  |  |
| `onShare` | `(() => void) \| undefined` |  |  |
| `status` | `ReactNode` |  | Selo de estado (ex.: gravando, gerando notas). |
| `template` | `ReactNode` |  | Chip do modelo (TemplatePicker). |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/reuniao-lista-e-cabecalho`):

```tsx
<MeetingHeader
  title="Revisão do pipeline de vendas — Q4"
  date="Hoje, 14:00"
  duration="32 min"
  attendees={pessoas}
  template={<TemplatePicker value={modelo} onChange={setModelo} />}
  onAsk={perguntar}
  onExport={exportar}
  onShare={compartilhar}
/>
```

## meetingHeaderLabels (const)

Textos padrão (pt-BR) do MeetingHeader.

## MeetingHeaderLabels (type)

Textos do MeetingHeader.

```ts
type MeetingHeaderLabels = { share: string; export: string; ask: string; attendees: (names: string[]) => string }
```

## MeetingPerson (type)

Participante de reunião.

```ts
type MeetingPerson = { name: string; initials?: string; tint?: string; src?: string }
```

## MeetingStatus (type)

```ts
type MeetingStatus = "live" | "processing" | "done" | "gaps" | "failed"
```

## MeetingTemplate (type)

Modelo de notas: as seções que a IA preenche.

```ts
type MeetingTemplate = { id: string; name: string; description?: string; sections: string[] }
```

## meetingTemplates (const)

Modelos padrão (pt-BR).

## MomentCitation

Citação de um momento da reunião ("12:04") ao lado de um bullet da IA.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `t` * | `number` |  | Segundos desde o início da gravação. |
| `active` | `boolean \| undefined` | `false` | Momento tocando agora. |
| `className` | `string \| undefined` |  |  |
| `labels` | `Partial<MomentCitationLabels> \| undefined` |  |  |
| `onSeek` | `((t: number) => void) \| undefined` |  |  |
| `turn` | `TranscriptTurn \| undefined` |  | Trecho citado: aparece na prévia. |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/reuniao-transcricao`):

```tsx
Grupo Vila: 15 % com contrato de 24 meses. <MomentCitation t={724} turn={trecho} onSeek={seek} />
```

## momentCitationLabels (const)

Textos padrão (pt-BR) do MomentCitation.

## MomentCitationLabels (type)

Textos do MomentCitation.

```ts
type MomentCitationLabels = { ariaLabel: (time: string, speaker?: string) => string; listen: string; }
```

## NoteAuthor (type)

Quem escreveu: `me` = a pessoa (durante a call), `ai` = a IA (a partir da transcrição).

```ts
type NoteAuthor = "me" | "ai"
```

## NoteCitation (type)

Momento citado por um bullet.

```ts
type NoteCitation = { t: number; turnId?: string }
```

## NoteItem (type)

```ts
type NoteItem = { id: string; text: string; author: NoteAuthor; citations?: NoteCitation[]; task?: { done: boolean; owner?: string }; children?: NoteItem[]; }
```

## NoteSection (type)

```ts
type NoteSection = { id: string; title: string; author?: NoteAuthor; items: NoteItem[] }
```

## RecordingState (type)

```ts
type RecordingState = "recording" | "paused" | "processing" | "warning" | "failed"
```

## RecordingTrack (type)

Faixa de captura: `mic` = sua voz, `system` = o que sai do alto-falante (os outros).

```ts
type RecordingTrack = { id: "mic" | "system"; label?: string; level: number; ok: boolean }
```

## TemplatePicker

Escolhe o modelo de notas de uma reunião.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `onChange` * | `(id: string) => void` |  |  |
| `value` * | `string` |  |  |
| `align` | `"start" \| "center" \| "end" \| undefined` | `"start"` |  |
| `className` | `string \| undefined` |  |  |
| `labels` | `Partial<TemplatePickerLabels> \| undefined` |  |  |
| `templates` | `MeetingTemplate[] \| undefined` | `meetingTemplates` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/reuniao-lista-e-cabecalho`):

```tsx
<MeetingHeader
  title="Revisão do pipeline de vendas — Q4"
  date="Hoje, 14:00"
  duration="32 min"
  attendees={pessoas}
  template={<TemplatePicker value={modelo} onChange={setModelo} />}
  onAsk={perguntar}
  onExport={exportar}
  onShare={compartilhar}
/>
```

## templatePickerLabels (const)

Textos padrão (pt-BR) do TemplatePicker.

## TemplatePickerLabels (type)

Textos do TemplatePicker.

```ts
type TemplatePickerLabels = { trigger: string; title: string; preview: string }
```

## TranscriptSpeaker (type)

Quem fala num trecho: `me` = microfone (Você), `other` = áudio do sistema (Outros).

```ts
type TranscriptSpeaker = MeetingPerson & { kind: "me" | "other" }
```

## TranscriptTurn (type)

Um trecho da transcrição.

```ts
type TranscriptTurn = { id: string; speaker: TranscriptSpeaker; start: number; end?: number; text: string; partial?: boolean; }
```

## TranscriptView

Transcrição por falante (Você · Outros), com horário clicável.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `turns` * | `TranscriptTurn[]` |  |  |
| `activeTurnId` | `string \| undefined` |  | Força o trecho ativo (tem prioridade sobre `currentTime`). |
| `className` | `string \| undefined` |  | Defina a altura aqui (h-full, max-h-80): a lista rola por dentro. |
| `currentTime` | `number \| undefined` |  | Posição do áudio (s): marca e acompanha o trecho em andamento. |
| `highlight` | `string[] \| undefined` |  | Trechos citados em destaque (ex.: ao passar o mouse numa citação). |
| `labels` | `Partial<TranscriptViewLabels> \| undefined` |  |  |
| `live` | `boolean \| undefined` | `false` | Gravação em andamento: acompanha o fim. |
| `onQueryChange` | `((q: string) => void) \| undefined` |  | Com ele, mostra o campo de busca no topo. |
| `onSeek` | `((t: number) => void) \| undefined` |  |  |
| `query` | `string \| undefined` | `""` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/reuniao-transcricao`):

```tsx
<TranscriptView live turns={[...trechos, { ...ultimo, partial: true }]} className="h-64" />
```

## transcriptViewLabels (const)

Textos padrão (pt-BR) do TranscriptView.

## TranscriptViewLabels (type)

Textos do TranscriptView.

```ts
type TranscriptViewLabels = { label: string; search: string; matches: (n: number) => string; noMatches: string; empty: string; jumpToEnd: string; seek: (speaker: string, time: string) => string; transcribing: string; }
```
