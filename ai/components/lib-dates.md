# lib-dates

Arquivo: `src/lib/dates.ts` · importe de `@g4os/ds`.

Datas só-dia em pt-BR, sem dependência.

## addBusinessDays (function)

Soma (ou subtrai) n dias úteis.

```ts
addBusinessDays(iso, n, extra?): string
```

Exemplo (showcase `#/p/datas-prazos-e-dias-uteis`):

```tsx
import { addBusinessDays, businessDaysBetween, isBusinessDay, brHolidays, describeDue } from "@g4os/ds";

addBusinessDays("2026-10-09", 5)                  // "2026-10-19" (pula 12/10)
businessDaysBetween("2026-10-01", "2026-10-31")    // 21
isBusinessDay("2026-11-20")                        // false (Consciência Negra)
describeDue("2026-10-07", "2026-09-30")            // { label: "vence em 5 dias úteis", tone: "neutral" }

// Feriado municipal/da empresa
const sp: Holiday[] = [{ date: "2026-01-25", name: "Aniversário de São Paulo", kind: "nacional" }];
addBusinessDays("2026-01-23", 1, sp)               // "2026-01-26"
```

## addDays (function)

```ts
addDays(iso, n): string
```

## addMonths (function)

Soma meses sem estourar (31/01 + 1 mês = 28/02 ou 29/02).

```ts
addMonths(iso, n): string
```

## addYears (function)

```ts
addYears(iso, n): string
```

## brHolidays (function)

Feriados nacionais do Brasil + pontos facultativos móveis (Carnaval e Corpus Christi, que quase todo mundo trata como folga).

```ts
brHolidays(year): Holiday[]
```

## businessDaysBetween (function)

Dias úteis em [from, to], inclusive nas duas pontas.

```ts
businessDaysBetween(from, to, extra?): number
```

Exemplo (showcase `#/p/datas-prazos-e-dias-uteis`):

```tsx
import { addBusinessDays, businessDaysBetween, isBusinessDay, brHolidays, describeDue } from "@g4os/ds";

addBusinessDays("2026-10-09", 5)                  // "2026-10-19" (pula 12/10)
businessDaysBetween("2026-10-01", "2026-10-31")    // 21
isBusinessDay("2026-11-20")                        // false (Consciência Negra)
describeDue("2026-10-07", "2026-09-30")            // { label: "vence em 5 dias úteis", tone: "neutral" }

// Feriado municipal/da empresa
const sp: Holiday[] = [{ date: "2026-01-25", name: "Aniversário de São Paulo", kind: "nacional" }];
addBusinessDays("2026-01-23", 1, sp)               // "2026-01-26"
```

## clampIso (function)

```ts
clampIso(iso, min?, max?): string
```

## CompareMode (type)

```ts
type CompareMode = "none" | "previous" | "year"
```

## comparePeriod (function)

Período de comparação: "previous" = mesmo tamanho imediatamente antes (meses cheios comparam com os meses cheios anteriores); "year" = mesmas datas no ano anterior.

```ts
comparePeriod(range, mode): IsoRange | undefined
```

## daysBetween (function)

Diferença em dias corridos (b − a).

```ts
daysBetween(a, b): number
```

## describeDue (function)

Prazo relativo para leitura rápida: "vence hoje", "vence amanhã", "vence em 3 dias úteis", "venceu há 2 dias".

```ts
describeDue(due, now?, props?): { label: string; tone: "bad"; diff: number; } | { label: string; tone: "neutral" | "warn"; diff: number; }
```

Exemplo (showcase `#/p/datas-prazos-e-dias-uteis`):

```tsx
import { addBusinessDays, businessDaysBetween, isBusinessDay, brHolidays, describeDue } from "@g4os/ds";

addBusinessDays("2026-10-09", 5)                  // "2026-10-19" (pula 12/10)
businessDaysBetween("2026-10-01", "2026-10-31")    // 21
isBusinessDay("2026-11-20")                        // false (Consciência Negra)
describeDue("2026-10-07", "2026-09-30")            // { label: "vence em 5 dias úteis", tone: "neutral" }

// Feriado municipal/da empresa
const sp: Holiday[] = [{ date: "2026-01-25", name: "Aniversário de São Paulo", kind: "nacional" }];
addBusinessDays("2026-01-23", 1, sp)               // "2026-01-26"
```

## describeTimeZone (function)

Fuso do navegador legível: "Horário de Brasília (GMT−3)".

```ts
describeTimeZone(tz?): string
```

## eachDay (function)

Todos os dias de [from, to] (inclusive).

```ts
eachDay(from, to): string[]
```

## easterSunday (function)

Domingo de Páscoa (algoritmo de Meeus/Jones/Butcher).

```ts
easterSunday(year): string
```

## endOfMonth (function)

```ts
endOfMonth(iso): string
```

## endOfQuarter (function)

```ts
endOfQuarter(iso): string
```

## endOfWeek (function)

```ts
endOfWeek(iso): string
```

## endOfYear (function)

```ts
endOfYear(iso): string
```

## formatDateLong (function)

"sexta, 03/10/2026"

```ts
formatDateLong(iso): string
```

## formatDayMonth (function)

"3 out" · com ano se diferente do ano de referência: "3 out 2027"

```ts
formatDayMonth(iso, refYear?): string
```

## formatIsoBr (function)

"30/09/2026"

```ts
formatIsoBr(iso): string
```

## formatMonthYear (function)

"setembro de 2026"

```ts
formatMonthYear(iso): string
```

## formatRange (function)

"1–15 out 2026" · "28 set – 4 out 2026" · "15 dez 2026 – 10 jan 2027"

```ts
formatRange(range): string
```

## hhmmOf (function)

```ts
hhmmOf(minutes): string
```

## Holiday (type)

```ts
type Holiday = { date: IsoDate; name: string; kind: "nacional" | "ponto facultativo" }
```

## holidayName (function)

Nome do feriado nessa data (nacional ou extra), ou undefined.

```ts
holidayName(iso, extra?): string | undefined
```

## isAfter (function)

```ts
isAfter(a, b): boolean
```

## isBefore (function)

```ts
isBefore(a, b): boolean
```

## isBusinessDay (function)

```ts
isBusinessDay(iso, extra?): boolean
```

Exemplo (showcase `#/p/datas-prazos-e-dias-uteis`):

```tsx
import { addBusinessDays, businessDaysBetween, isBusinessDay, brHolidays, describeDue } from "@g4os/ds";

addBusinessDays("2026-10-09", 5)                  // "2026-10-19" (pula 12/10)
businessDaysBetween("2026-10-01", "2026-10-31")    // 21
isBusinessDay("2026-11-20")                        // false (Consciência Negra)
describeDue("2026-10-07", "2026-09-30")            // { label: "vence em 5 dias úteis", tone: "neutral" }

// Feriado municipal/da empresa
const sp: Holiday[] = [{ date: "2026-01-25", name: "Aniversário de São Paulo", kind: "nacional" }];
addBusinessDays("2026-01-23", 1, sp)               // "2026-01-26"
```

## isHoliday (function)

```ts
isHoliday(iso, extra?): boolean
```

## IsoDate (type)

```ts
type IsoDate = string
```

## IsoRange (type)

```ts
type IsoRange = { from: IsoDate; to: IsoDate }
```

## isoWeek (function)

Número da semana ISO-8601.

```ts
isoWeek(iso): number
```

## isSameDay (function)

```ts
isSameDay(a?, b?): boolean
```

## isWeekend (function)

```ts
isWeekend(iso): boolean
```

## isWithin (function)

```ts
isWithin(iso, range): boolean
```

## maskDateTyping (function)

Máscara progressiva dd/mm/aaaa para o que está sendo digitado (só se for numérico).

```ts
maskDateTyping(raw): string
```

## matchPeriod (function)

Qual preset gera exatamente este intervalo (para marcar a opção ativa).

```ts
matchPeriod(range, now?): PeriodPreset | undefined
```

## minutesOf (function)

```ts
minutesOf(hhmm): number
```

## monthNames (const)

## monthShort (const)

## parseDateInput (function)

Entende o que a pessoa digita e devolve ISO (ou undefined): "30/09/2026" "30/09/26" "30/9" "30092026" "2026-09-30" "hoje" "amanhã" "depois de amanhã" "ontem" "sexta" "próxima segunda" "segunda que vem" "em 3 dias" "em 2

```ts
parseDateInput(input, now?): string | undefined
```

## parseTimeInput (function)

"9" "930" "9:30" "9h30" "21h" → "09:30" / "21:00".

```ts
parseTimeInput(input): string | undefined
```

## PeriodPreset (type)

```ts
type PeriodPreset = | "today" | "yesterday" | "last7" | "last30" | "last90" | "this_week" | "last_week" | "this_month" | "last_month" | "this_quarter" | "last_quarter" | "ytd" | "last12m" | "this_year" | "last_year"
```

## periodPresets (const)

## quarterOf (function)

1–4

```ts
quarterOf(iso): number
```

## resolvePeriod (function)

Converte um preset em intervalo ISO inclusivo, relativo a `now`.

```ts
resolvePeriod(preset, now?): IsoRange
```

Exemplo (showcase `#/p/datas-periodo`):

```tsx
const [periodo, setPeriodo] = useState<DateRangeValue>({ ...resolvePeriod("last30"), preset: "last30" });

<DateRangePicker value={periodo} onChange={setPeriodo} />
// periodo.from, periodo.to, periodo.preset, periodo.compare, periodo.compareRange
```

## startOfMonth (function)

```ts
startOfMonth(iso): string
```

## startOfQuarter (function)

```ts
startOfQuarter(iso): string
```

## startOfWeek (function)

```ts
startOfWeek(iso): string
```

## startOfYear (function)

```ts
startOfYear(iso): string
```

## timeSlots (function)

Lista de horários "HH:MM" entre start e end (inclusive start, exclusivo end) a cada `step` minutos.

```ts
timeSlots(start?, end?, step?): string[]
```

## toDate (function)

"2026-09-30" → Date local ao meio-dia.

```ts
toDate(iso): Date
```

## todayIso (function)

Hoje em ISO (ou a data de referência passada).

```ts
todayIso(now?): string
```

Exemplo (showcase `#/p/datas-data`):

```tsx
const [date, setDate] = useState<IsoDate | "">("");

<DateInput label="Data de início" value={date} onChange={setDate} min={todayIso()} />
<DateInput label="Entrega" value={date} onChange={setDate} businessDaysOnly />
```

## toIso (function)

Date → "2026-09-30".

```ts
toIso(date): string
```

## weekdayInitials (const)

Cabeçalho do calendário, começando na segunda.

## weekdayMon (function)

Segunda-feira = 0 … domingo = 6.

```ts
weekdayMon(iso): number
```

## weekdayNames (const)

Domingo = 0 (como Date#getDay).

## weekdayShort (const)
