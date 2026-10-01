# date-picker

Arquivo: `src/components/date-picker.tsx` · importe de `@g4ai/ds`.

DatePicker (Calendar próprio do DS) e utilitários de data ISO.

## DatePicker

Seletor de data (Popover + Calendar, pt-BR).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `label` * | `string` |  | Rótulo visível acima do campo e nome acessível. |
| `onValueChange` * | `(value: string) => void` |  |  |
| `value` * | `string` |  |  |
| `businessDaysOnly` | `boolean \| undefined` |  | Só dias úteis (fins de semana e feriados nacionais desabilitados). |
| `className` | `string \| undefined` |  |  |
| `clearable` | `boolean \| undefined` | `false` | Botão × no campo para voltar a vazio. |
| `disabled` | `boolean \| undefined` |  |  |
| `error` | `ReactNode` |  | Erro abaixo do campo (substitui a ajuda) e borda rose. |
| `extraHolidays` | `Holiday[] \| undefined` |  |  |
| `hideLabel` | `boolean \| undefined` |  | Só nome acessível, sem rótulo visível (toolbar, tabela, filtro). |
| `hint` | `ReactNode` |  | Texto de ajuda abaixo do campo. |
| `id` | `string \| undefined` |  |  |
| `max` | `string \| undefined` |  |  |
| `min` | `string \| undefined` |  |  |
| `now` | `string \| undefined` |  | "Hoje" de referência (testes, fuso do servidor). |
| `optional` | `boolean \| undefined` |  | Acrescenta "(opcional)" ao rótulo. |
| `placeholder` | `string \| undefined` | `"Selecione a data"` |  |
| `presentation` | `PopupPresentation \| undefined` | `"auto"` | auto = folha inferior no celular; popover = sempre ancorado. |
| `shortcuts` | `boolean \| undefined` | `true` | Rodapé com "Hoje" (e "Limpar" quando `clearable`). |
| `triggerContent` | `ReactNode` |  | Gatilho próprio (ex.: chip). |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

**Uso certo**

- ✓ `<DatePicker label="Início" value={iso} onValueChange={setIso} clearable />` com data ISO ("2026-10-01"). Hora: `TimePicker`; data e hora: `DateTimePicker`.

**Evite**

- ✗ `<input type="date">` (abre em inglês no iPhone; regra `native-date`); `new Date("2026-10-01")` para exibir (fuso): use `formatDate`.

Exemplo (showcase `#/p/datas-data`):

```tsx
<DatePicker label="Vencimento" value={iso} onValueChange={setIso} businessDaysOnly />
```

## formatIsoDate (function)

"2026-09-30" → "30/09/2026".

```ts
formatIsoDate(iso): string
```
