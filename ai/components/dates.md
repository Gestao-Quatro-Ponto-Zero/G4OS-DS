# dates

Arquivo: `src/components/dates.tsx` · importe de `@g4ai/ds`.

Datas e horários. Regras (docs/padroes/datas.md · showcase Formulários › Datas): · valor é ISO só-data ("2026-09-30"); horário "HH:MM"; nada de <input type="date"> · digitar é sempre possível (dd/mm/aaaa, "sexta", "em 3

## AgendaEvent (type)

```ts
type AgendaEvent = { id: string; date: IsoDate; title: string; time?: string; end?: string; tone?: CalendarEvent["tone"]; meta?: ReactNode }
```

## AvailabilityPicker (const)

Alias: mesmo componente com o nome do padrão de produto.

## Calendar

Grade de calendário própria (sem dependência), no tema do DS.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `businessDaysOnly` | `boolean \| undefined` |  | Só dias úteis habilitados (fim de semana e feriado ficam desabilitados). |
| `className` | `string \| undefined` |  |  |
| `compare` | `Partial<IsoRange> \| undefined` |  | Período de comparação desenhado tracejado. |
| `events` | `CalendarEvent[] \| undefined` |  | Pontinhos por dia (agenda, vencimentos). |
| `extraHolidays` | `Holiday[] \| undefined` | `[]` |  |
| `isDisabled` | `((iso: IsoDate) => boolean) \| undefined` |  |  |
| `label` | `string \| undefined` | `"Calendário"` | Rótulo acessível da grade. |
| `max` | `string \| undefined` |  |  |
| `min` | `string \| undefined` |  |  |
| `mode` | `"multiple" \| "range" \| "single" \| undefined` | `"single"` | single: um dia · range: início/fim · multiple: vários dias. |
| `month` | `string \| undefined` |  | Mês visível (qualquer dia dele). |
| `months` | `1 \| 2 \| undefined` | `1` | 1 ou 2 meses lado a lado. |
| `now` | `string \| undefined` | `todayIso()` |  |
| `onDayClick` | `((iso: IsoDate) => void) \| undefined` |  | Clique/Enter num dia. |
| `onMonthChange` | `((month: IsoDate) => void) \| undefined` |  |  |
| `range` | `Partial<IsoRange> \| undefined` |  |  |
| `selected` | `string \| null \| undefined` |  |  |
| `showHolidays` | `boolean \| undefined` | `true` | Marca feriados nacionais (padrão: sim) + feriados extras (estaduais, da empresa). |
| `values` | `string[] \| undefined` |  |  |
| `weekMode` | `boolean \| undefined` |  | Linha inteira (semana) destacada no hover/seleção — para WeekPicker. |
| `weekNumbers` | `boolean \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/datas-data`):

```tsx
<Calendar selected={iso} onDayClick={setIso} weekNumbers
  events={[{ date: "2026-10-02", tone: "accent" }, { date: "2026-10-06", tone: "bad" }]} />
<Calendar mode="range" months={2} range={{ from, to }} onDayClick={…} />
```

## CalendarEvent (type)

```ts
type CalendarEvent = { date: IsoDate; label?: string; tone?: "neutral" | "accent" | "ok" | "warn" | "bad" | "info" }
```

## CalendarProps (type)

```ts
type CalendarProps = { mode?: "single" | "range" | "multiple"; selected?: IsoDate | null; range?: Partial<IsoRange>; values?: IsoDate[]; onDayClick?: (iso: IsoDate) => void; month?: IsoDate; onMonthChange?: (month: IsoDate) => void; months?: 1 | 2; min?: IsoDate; max?: IsoDate; isDisabled?: (iso: IsoDate) => boolean; businessDaysOnly?: boolean; showHolidays?: boolean; extraHolidays?: Holiday[]; weekNumbers?: boolea…
```

## DateBadge

Data em formato de "folhinha": mês em cima, dia grande.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `date` * | `string` |  |  |
| `className` | `string \| undefined` |  |  |
| `size` | `"sm" \| "md" \| undefined` | `"md"` |  |
| `tone` | `"neutral" \| "warn" \| "bad" \| "accent" \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

## DateInput

Data digitável. Aceita dd/mm/aaaa (com máscara), atalhos ("hoje", "sexta", "em 3 dias", "+5du", "fim do mês") e o calendário no ícone.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `onChange` * | `(iso: IsoDate \| "") => void` |  |  |
| `value` * | `string` |  |  |
| `businessDaysOnly` | `boolean \| undefined` |  |  |
| `className` | `string \| undefined` |  |  |
| `clearable` | `boolean \| undefined` | `true` |  |
| `disabled` | `boolean \| undefined` |  |  |
| `error` | `ReactNode` |  |  |
| `extraHolidays` | `Holiday[] \| undefined` |  |  |
| `hint` | `ReactNode` |  |  |
| `id` | `string \| undefined` |  |  |
| `label` | `string \| undefined` |  |  |
| `max` | `string \| undefined` |  |  |
| `min` | `string \| undefined` |  |  |
| `now` | `string \| undefined` | `todayIso()` |  |
| `optional` | `boolean \| undefined` |  |  |
| `placeholder` | `string \| undefined` | `"dd/mm/aaaa ou “sexta”"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/datas-data`):

```tsx
const [date, setDate] = useState<IsoDate | "">("");

<DateInput label="Data de início" value={date} onChange={setDate} min={todayIso()} />
<DateInput label="Entrega" value={date} onChange={setDate} businessDaysOnly />
```

## DateRangePicker

Período com presets, dois meses, comparação e contagem de dias úteis.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `onChange` * | `(value: DateRangeValue) => void` |  |  |
| `value` * | `DateRangeValue` |  |  |
| `align` | `"start" \| "end" \| undefined` | `"end"` |  |
| `allowCompare` | `boolean \| undefined` | `true` |  |
| `className` | `string \| undefined` |  |  |
| `extraHolidays` | `Holiday[] \| undefined` |  |  |
| `label` | `string \| undefined` | `"Período"` |  |
| `max` | `string \| undefined` |  |  |
| `min` | `string \| undefined` |  |  |
| `now` | `string \| undefined` | `todayIso()` |  |
| `presets` | `PeriodPreset[] \| undefined` | `defaultRangePresets` |  |
| `triggerClassName` | `string \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/datas-periodo`):

```tsx
const [periodo, setPeriodo] = useState<DateRangeValue>({ ...resolvePeriod("last30"), preset: "last30" });

<DateRangePicker value={periodo} onChange={setPeriodo} />
// periodo.from, periodo.to, periodo.preset, periodo.compare, periodo.compareRange
```

## DateRangeValue (type)

```ts
type DateRangeValue = { from: IsoDate; to: IsoDate; preset?: PeriodPreset; compare?: CompareMode; compareRange?: IsoRange; }
```

## DateTimePicker

Data + horário. Valor "2026-10-03T14:30" (hora local, sem fuso).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `label` * | `string` |  |  |
| `onChange` * | `(value: string) => void` |  |  |
| `value` * | `string` |  |  |
| `className` | `string \| undefined` |  |  |
| `hint` | `ReactNode` |  |  |
| `min` | `string \| undefined` |  |  |
| `now` | `string \| undefined` | `todayIso()` |  |
| `showTimeZone` | `boolean \| undefined` | `true` |  |
| `step` | `10 \| 5 \| 60 \| 15 \| 30 \| undefined` | `15` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/datas-horario`):

```tsx
<DateTimePicker label="Reunião de kickoff" value="2026-10-02T14:00" onChange={setValor} step={15} />
```

## DueDatePicker

Prazo de tarefa/documento: atalhos que as pessoas realmente usam (hoje, amanhã, 5 dias úteis, próxima segunda, fim do mês) + calendário.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `onChange` * | `(iso: IsoDate \| "") => void` |  |  |
| `value` * | `string` |  |  |
| `businessDays` | `boolean \| undefined` | `true` |  |
| `className` | `string \| undefined` |  |  |
| `extraHolidays` | `Holiday[] \| undefined` |  |  |
| `label` | `string \| undefined` | `"Prazo"` |  |
| `now` | `string \| undefined` | `todayIso()` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/datas-prazos-e-dias-uteis`):

```tsx
<DueDatePicker value={prazo} onChange={setPrazo} />   // "vence em 4 dias úteis"
```

## MiniAgenda

Agenda em lista, agrupada por dia (celular, painel lateral, “próximos”).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `events` * | `AgendaEvent[]` |  |  |
| `className` | `string \| undefined` |  |  |
| `limit` | `number \| undefined` |  |  |
| `now` | `string \| undefined` | `todayIso()` |  |
| `onEventClick` | `((e: AgendaEvent) => void) \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/datas-calendario-eventos`):

```tsx
<MiniAgenda events={proximos} limit={6} onEventClick={abrir} />
```

## MonthCalendar

Mês inteiro com eventos em chips (agenda, entregas, entrevistas).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `events` * | `AgendaEvent[]` |  |  |
| `className` | `string \| undefined` |  |  |
| `maxPerDay` | `number \| undefined` | `2` |  |
| `month` | `string \| undefined` |  |  |
| `now` | `string \| undefined` | `todayIso()` |  |
| `onDayClick` | `((iso: IsoDate) => void) \| undefined` |  |  |
| `onEventClick` | `((event: AgendaEvent) => void) \| undefined` |  |  |
| `onMonthChange` | `((month: IsoDate) => void) \| undefined` |  |  |
| `showHolidays` | `boolean \| undefined` | `true` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/datas-calendario-eventos`):

```tsx
<MonthCalendar
  events={[{ id, date: "2026-10-02", time: "11:00", title: "Demo Vértice Log", tone: "accent" }, …]}
  onEventClick={(e) => abrir(e.id)}
  onDayClick={(dia) => criarEvento(dia)}
/>
```

## MonthPicker

Mês ("2026-09") ou intervalo de meses.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `onChange` * | `(value: string, rangeEnd?: string) => void` |  |  |
| `value` * | `string` |  | "2026-09"; com range, o início. |
| `className` | `string \| undefined` |  |  |
| `label` | `string \| undefined` | `"Mês"` |  |
| `max` | `string \| undefined` |  |  |
| `min` | `string \| undefined` |  |  |
| `now` | `string \| undefined` | `todayIso()` |  |
| `range` | `{ end?: string; } \| undefined` |  | Fim do intervalo de meses (liga o modo intervalo). |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/datas-periodo`):

```tsx
<MonthPicker value="2026-09" onChange={setMes} />
<MonthPicker value={de} range={{ end: ate }} onChange={(de, ate) => …} />
<QuarterPicker value="2026-T3" onChange={setTri} />
<YearPicker value="2026" onChange={setAno} />
```

## MultiDatePicker

Vários dias soltos (folgas, datas de treinamento, entregas).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `label` * | `string` |  |  |
| `onChange` * | `(values: IsoDate[]) => void` |  |  |
| `values` * | `string[]` |  |  |
| `businessDaysOnly` | `boolean \| undefined` |  |  |
| `className` | `string \| undefined` |  |  |
| `hint` | `ReactNode` |  |  |
| `max` | `number \| undefined` |  | Máximo de dias selecionáveis. |
| `maxDate` | `string \| undefined` |  |  |
| `min` | `string \| undefined` |  |  |
| `now` | `string \| undefined` | `todayIso()` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/datas-data`):

```tsx
<MultiDatePicker label="Datas das turmas" values={dias} onChange={setDias} max={6} businessDaysOnly />
```

## QuarterPicker

Trimestre ("2026-T3").

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `onChange` * | `(value: string) => void` |  |  |
| `value` * | `string` |  |  |
| `className` | `string \| undefined` |  |  |
| `label` | `string \| undefined` | `"Trimestre"` |  |
| `now` | `string \| undefined` | `todayIso()` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/datas-periodo`):

```tsx
<MonthPicker value="2026-09" onChange={setMes} />
<MonthPicker value={de} range={{ end: ate }} onChange={(de, ate) => …} />
<QuarterPicker value="2026-T3" onChange={setTri} />
<YearPicker value="2026" onChange={setAno} />
```

## RelativeTime

Tempo relativo ("há 5 min", "ontem") com a data exata no title e em <time dateTime>.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `date` * | `string \| number \| Date` |  |  |
| `className` | `string \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

## Slot (type)

```ts
type Slot = { time: string; busy?: boolean }
```

## SlotPicker

Escolha de data + horário disponível (entrevista, reunião, visita), no estilo Calendly: dias com disponibilidade à esquerda, horários à direita.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `availability` * | `(iso: IsoDate, duration: number) => Slot[]` |  |  |
| `onChange` * | `(value: { date: IsoDate; time: string; }) => void` |  |  |
| `className` | `string \| undefined` |  |  |
| `days` | `number \| undefined` | `14` | Quantos dias adiante. |
| `duration` | `number \| undefined` |  |  |
| `durations` | `number[] \| undefined` | `[30, 45, 60]` |  |
| `from` | `string \| undefined` |  | Primeiro dia oferecido (padrão: hoje). |
| `now` | `string \| undefined` | `todayIso()` |  |
| `onDurationChange` | `((minutes: number) => void) \| undefined` |  |  |
| `timeZone` | `string \| undefined` | `describeTimeZone()` |  |
| `value` | `{ date: IsoDate; time: string; } \| null \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/datas-agendamento`):

```tsx
<SlotPicker
  availability={(dia, duracao) => agenda.slots(dia, duracao)}   // [{ time: "09:00", busy?: true }]
  value={escolha}
  onChange={setEscolha}                                          // { date, time }
  durations={[30, 45, 60]}
  days={14}
/>
```

## TimePicker

Horário 24h digitável ("9", "930", "9h30", "14:30") com lista de sugestões a cada `step` minutos.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `onChange` * | `(hhmm: string) => void` |  |  |
| `value` * | `string` |  |  |
| `businessHours` | `[string, string] \| undefined` | `["08:00", "18:00"]` |  |
| `className` | `string \| undefined` |  |  |
| `disabled` | `boolean \| undefined` |  |  |
| `error` | `ReactNode` |  |  |
| `hint` | `ReactNode` |  |  |
| `id` | `string \| undefined` |  |  |
| `label` | `string \| undefined` |  |  |
| `max` | `string \| undefined` | `"24:00"` |  |
| `min` | `string \| undefined` | `"00:00"` |  |
| `showTimeZone` | `boolean \| undefined` |  |  |
| `step` | `10 \| 5 \| 60 \| 15 \| 30 \| undefined` | `30` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/datas-horario`):

```tsx
<TimePicker label="Início" value={hora} onChange={setHora} step={30} />
<TimePicker label="Check-in" value={hora} onChange={setHora} step={15} min="06:00" max="22:00" showTimeZone />
```

## WeekPicker

Uma semana (seg–dom).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `onChange` * | `(monday: IsoDate) => void` |  |  |
| `value` * | `string` |  |  |
| `className` | `string \| undefined` |  |  |
| `label` | `string \| undefined` | `"Semana"` |  |
| `now` | `string \| undefined` | `todayIso()` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/datas-data`):

```tsx
<WeekPicker value={segunda} onChange={setSegunda} />
```

## YearPicker

Ano ("2026"). Para exercício fiscal, safra, safra de coorte.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `onChange` * | `(value: string) => void` |  |  |
| `value` * | `string` |  |  |
| `className` | `string \| undefined` |  |  |
| `label` | `string \| undefined` | `"Ano"` |  |
| `now` | `string \| undefined` | `todayIso()` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/datas-periodo`):

```tsx
<MonthPicker value="2026-09" onChange={setMes} />
<MonthPicker value={de} range={{ end: ate }} onChange={(de, ate) => …} />
<QuarterPicker value="2026-T3" onChange={setTri} />
<YearPicker value="2026" onChange={setAno} />
```
