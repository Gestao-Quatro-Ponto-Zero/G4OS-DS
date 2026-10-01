# date-picker

Arquivo: `src/components/date-picker.tsx` · importe de `@g4ai/ds`.

DatePicker (Calendar próprio do DS) e utilitários de data ISO.

## DatePicker

Seletor de data (Popover + Calendar, pt-BR).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `label` * | `string` |  |  |
| `onValueChange` * | `(value: string) => void` |  |  |
| `value` * | `string` |  |  |
| `businessDaysOnly` | `boolean \| undefined` |  | Só dias úteis (fins de semana e feriados nacionais desabilitados). |
| `className` | `string \| undefined` |  |  |
| `disabled` | `boolean \| undefined` |  |  |
| `extraHolidays` | `Holiday[] \| undefined` |  |  |
| `max` | `string \| undefined` |  |  |
| `min` | `string \| undefined` |  |  |
| `placeholder` | `string \| undefined` | `"Selecione a data"` |  |
| `triggerContent` | `ReactNode` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/datas-data`):

```tsx
<DatePicker label="Vencimento" value={iso} onValueChange={setIso} businessDaysOnly />
```

## formatIsoDate (function)

"2026-09-30" → "30/09/2026".

```ts
formatIsoDate(iso): string
```
