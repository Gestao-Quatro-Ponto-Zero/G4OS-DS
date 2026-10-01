# inputs

Arquivo: `src/components/inputs.tsx` · importe de `@g4ai/ds`.

Entradas especializadas: TextField, PasswordField, NumberField, CurrencyField, MaskedField (CPF/CNPJ/CEP/telefone), OtpInput, TagInput, Slider, RadioGroup, ChoiceCards, ToggleGroup, FileDropzone, Rating, InlineEdit.

## applyMask (function)

Padrão: 9 = dígito. Ex.: "999.999.999-99".

```ts
applyMask(pattern, raw): string
```

## ChoiceCards

Cards selecionáveis (plano, tipo de conta, modelo de contratação).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `onChange` * | `((value: T) => void) \| ((value: T[]) => void)` |  |  |
| `options` * | `ChoiceOption<T>[]` |  |  |
| `value` * | `T \| T[] \| null` |  |  |
| `className` | `string \| undefined` |  |  |
| `columns` | `1 \| 2 \| 3 \| 4 \| undefined` | `3` |  |
| `corner` | `ReactNode` |  | Canto direito do rótulo (contador, link "Esqueci a senha"). |
| `error` | `ReactNode` |  |  |
| `hint` | `ReactNode` |  |  |
| `label` | `string \| undefined` |  |  |
| `multiple` | `boolean \| undefined` | `false` |  |
| `optional` | `boolean \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/form-selecao`):

```tsx
<ChoiceCards label="Plano" value={plan} onChange={setPlan} options={[
  { value: "growth", label: "Growth", description: "Até 25 usuários", aside: "R$ 890/mês", icon: <Rocket /> }, …
]} />
<ChoiceCards multiple columns={3} label="Módulos" value={mods} onChange={setMods} options={…} />
```

## ChoiceOption (type)

```ts
type ChoiceOption = { value: T; label: string; description?: ReactNode; icon?: ReactNode; disabled?: boolean; aside?: ReactNode; }
```

## CurrencyField

Valor em reais com máscara "caixa registradora": os dígitos entram pela direita (1 → 0,01 → 0,12 → 1,23).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `onChange` * | `(value: number \| null) => void` |  |  |
| `value` * | `number \| null` |  |  |
| `className` | `string \| undefined` |  |  |
| `corner` | `ReactNode` |  | Canto direito do rótulo (contador, link "Esqueci a senha"). |
| `currency` | `string \| undefined` | `"R$"` |  |
| `error` | `ReactNode` |  |  |
| `hint` | `ReactNode` |  |  |
| `label` | `string \| undefined` |  |  |
| `optional` | `boolean \| undefined` |  |  |
| `placeholder` | `string \| undefined` | `"0,00"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/form-numeros`):

```tsx
<CurrencyField label="Valor do negócio" value={value} onChange={setValue} />
// value = 48900 → exibe "48.900,00"
```

## FileDropzone

Área de soltar arquivos + lista com progresso.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `onFiles` * | `(files: File[]) => void` |  |  |
| `accept` | `string \| undefined` |  | Igual ao atributo HTML: ".pdf,.docx,image/*". |
| `className` | `string \| undefined` |  |  |
| `corner` | `ReactNode` |  | Canto direito do rótulo (contador, link "Esqueci a senha"). |
| `disabled` | `boolean \| undefined` |  |  |
| `error` | `ReactNode` |  |  |
| `hint` | `ReactNode` |  |  |
| `items` | `UploadItem[] \| undefined` | `[]` |  |
| `label` | `string \| undefined` |  |  |
| `maxFiles` | `number \| undefined` |  |  |
| `maxSize` | `number \| undefined` |  | Bytes. |
| `multiple` | `boolean \| undefined` | `true` |  |
| `onRemove` | `((id: string) => void) \| undefined` |  |  |
| `optional` | `boolean \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/form-upload`):

```tsx
<FileDropzone label="Anexos" accept=".pdf,.docx" maxSize={10 * 1024 * 1024} maxFiles={5}
  items={items} onRemove={(id) => remove(id)}
  onFiles={(files) => files.forEach(upload)} />
```

## InlineEdit

Texto que vira campo no clique (nome de negócio, título de vaga, célula de planilha).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `label` * | `string` |  |  |
| `onSave` * | `(value: string) => void` |  |  |
| `value` * | `string` |  |  |
| `allowEmpty` | `boolean \| undefined` |  |  |
| `className` | `string \| undefined` |  |  |
| `placeholder` | `string \| undefined` | `"Clique para editar"` |  |
| `textClassName` | `string \| undefined` |  | Classe do texto (ex.: tamanho de título). |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/form-tags-rating`):

```tsx
<InlineEdit label="Título" value={title} onSave={setTitle} textClassName="text-[18px] font-semibold" />
```

## Mask (type)

```ts
type Mask = { pattern: string | ((digits: string) => string); placeholder: string; inputMode: "numeric" | "tel"; validate?: (digits: string) => boolean }
```

## MaskedField

Campo com máscara. `value` = texto mascarado; `onChange(masked, digits)`.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `mask` * | `Mask` |  |  |
| `onChange` * | `(masked: string, digits: string) => void` |  |  |
| `value` * | `string` |  |  |
| `className` | `string \| undefined` |  |  |
| `corner` | `ReactNode` |  | Canto direito do rótulo (contador, link "Esqueci a senha"). |
| `error` | `ReactNode` |  |  |
| `hint` | `ReactNode` |  |  |
| `invalidMessage` | `string \| undefined` | `"Confira o número digitado."` |  |
| `label` | `string \| undefined` |  |  |
| `optional` | `boolean \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/form-mascaras`):

```tsx
const placa = { pattern: "AAA-9A99", ... } // letras: use TextField + validação
const agencia = { pattern: "9999-9", placeholder: "0000-0", inputMode: "numeric" } as const;
<MaskedField label="Agência" mask={agencia} value={v} onChange={setV} />
```

## masks (const)

Máscaras brasileiras prontas.

## NumberField

Número com −/+. Setas ↑↓ mudam `step`; Shift multiplica por 10.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `onChange` * | `(value: number \| null) => void` |  |  |
| `value` * | `number \| null` |  |  |
| `className` | `string \| undefined` |  |  |
| `corner` | `ReactNode` |  | Canto direito do rótulo (contador, link "Esqueci a senha"). |
| `digits` | `number \| undefined` | `0` |  |
| `disabled` | `boolean \| undefined` |  |  |
| `error` | `ReactNode` |  |  |
| `hint` | `ReactNode` |  |  |
| `id` | `string \| undefined` |  |  |
| `label` | `string \| undefined` |  |  |
| `max` | `number \| undefined` |  |  |
| `min` | `number \| undefined` |  |  |
| `optional` | `boolean \| undefined` |  |  |
| `step` | `number \| undefined` | `1` |  |
| `suffix` | `ReactNode` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/form-numeros`):

```tsx
<NumberField label="Licenças" value={seats} onChange={setSeats} min={1} max={500} />
<NumberField label="Desconto" value={disc} onChange={setDisc} step={0.5} digits={1} suffix="%" min={0} max={30} />
```

## OtpInput

Código de verificação.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `onChange` * | `(value: string) => void` |  |  |
| `value` * | `string` |  |  |
| `autoFocus` | `boolean \| undefined` |  |  |
| `className` | `string \| undefined` |  |  |
| `disabled` | `boolean \| undefined` |  |  |
| `error` | `ReactNode` |  |  |
| `groupAt` | `number \| undefined` |  | Separador visual após N dígitos (ex.: 3 → 123-456). |
| `label` | `string \| undefined` | `"Código de verificação"` |  |
| `length` | `number \| undefined` | `6` |  |
| `onComplete` | `((value: string) => void) \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/form-senha-otp`):

```tsx
<OtpInput value={code} onChange={setCode} groupAt={3} />
<OtpInput value="" onChange={() => {}} length={4} disabled />
```

## PasswordField

Senha com mostrar/ocultar.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `onChange` * | `(value: string) => void` |  |  |
| `value` * | `string` |  |  |
| `className` | `string \| undefined` |  |  |
| `corner` | `ReactNode` |  | Canto direito do rótulo (contador, link "Esqueci a senha"). |
| `error` | `ReactNode` |  |  |
| `hint` | `ReactNode` |  |  |
| `label` | `string \| undefined` | `"Senha"` |  |
| `optional` | `boolean \| undefined` |  |  |
| `strength` | `boolean \| undefined` | `false` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/form-senha-otp`):

```tsx
<PasswordField value={pw} onChange={setPw} corner={<a href="/esqueci">Esqueci a senha</a>} />
<PasswordField label="Nova senha" value={pw} onChange={setPw} strength autoComplete="new-password" />
```

## passwordStrength (function)

Força 0–4 por comprimento e variedade.

```ts
passwordStrength(pw): number
```

## RadioGroup

Escolha única entre 2–6 opções sempre visíveis.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `onChange` * | `(value: T) => void` |  |  |
| `options` * | `ChoiceOption<T>[]` |  |  |
| `value` * | `T \| null` |  |  |
| `className` | `string \| undefined` |  |  |
| `corner` | `ReactNode` |  | Canto direito do rótulo (contador, link "Esqueci a senha"). |
| `error` | `ReactNode` |  |  |
| `hint` | `ReactNode` |  |  |
| `label` | `string \| undefined` |  |  |
| `name` | `string \| undefined` |  |  |
| `optional` | `boolean \| undefined` |  |  |
| `orientation` | `"horizontal" \| "vertical" \| undefined` | `"vertical"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/form-selecao`):

```tsx
<RadioGroup label="Regime de contratação" options={options} value={mode} onChange={setMode} />
```

## Rating

Nota 1–N (scorecard de entrevista, avaliação de fornecedor).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `value` * | `number \| null` |  |  |
| `className` | `string \| undefined` |  |  |
| `label` | `string \| undefined` | `"Nota"` |  |
| `labels` | `string[] \| undefined` | `ratingWords` |  |
| `max` | `number \| undefined` | `5` |  |
| `onChange` | `((value: number) => void) \| undefined` |  |  |
| `readOnly` | `boolean \| undefined` |  |  |
| `showLabel` | `boolean \| undefined` |  | Mostra a palavra da nota ao lado ("Forte"). |
| `size` | `"sm" \| "md" \| undefined` | `"md"` |  |
| `variant` | `"stars" \| "scale" \| undefined` | `"stars"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/form-tags-rating`):

```tsx
<Rating value={r} onChange={setR} showLabel />
<Rating variant="scale" value={r} onChange={setR} showLabel label="Comunicação" />
<Rating value={4} readOnly size="sm" />
```

## Slider

Faixa contínua. Passe `number` para um valor ou `[min, max]` para intervalo (filtro de faixa salarial, preço).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `label` * | `string` |  |  |
| `onChange` * | `(value: V) => void` |  |  |
| `value` * | `V` |  |  |
| `className` | `string \| undefined` |  |  |
| `disabled` | `boolean \| undefined` |  |  |
| `format` | `((n: number) => string) \| undefined` | `(n) => formatNumber(n)` |  |
| `hint` | `ReactNode` |  |  |
| `marks` | `number[] \| undefined` |  | Marcas fixas na régua (ex.: [0, 50, 100]). |
| `max` | `number \| undefined` | `100` |  |
| `min` | `number \| undefined` | `0` |  |
| `showValue` | `boolean \| undefined` | `true` |  |
| `step` | `number \| undefined` | `1` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/form-selecao`):

```tsx
<Slider label="Probabilidade" value={prob} onChange={setProb} step={10} format={(n) => `${n}%\
```

## TagInput

Lista livre de etiquetas (skills, tags de lead, e-mails).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `onChange` * | `(value: string[]) => void` |  |  |
| `value` * | `string[]` |  |  |
| `className` | `string \| undefined` |  |  |
| `corner` | `ReactNode` |  | Canto direito do rótulo (contador, link "Esqueci a senha"). |
| `error` | `ReactNode` |  |  |
| `hint` | `ReactNode` |  |  |
| `id` | `string \| undefined` |  |  |
| `label` | `string \| undefined` |  |  |
| `max` | `number \| undefined` |  |  |
| `optional` | `boolean \| undefined` |  |  |
| `placeholder` | `string \| undefined` | `"Digite e tecle Enter"` |  |
| `suggestions` | `string[] \| undefined` | `[]` |  |
| `validate` | `((tag: string) => string \| null) \| undefined` |  | Retorna mensagem de erro para recusar, ou null. |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/form-tags-rating`):

```tsx
<TagInput label="Competências" value={tags} onChange={setTags} suggestions={skills} max={8} />
<TagInput label="Convidar" value={emails} onChange={setEmails}
  validate={(t) => (/.+@.+\\..+/.test(t) ? null : `“${t}” não é um e-mail.`)} />
```

## TextareaField

Texto longo. `autosize` cresce até `maxRows`; contador com maxLength.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `onChange` * | `(value: string) => void` |  |  |
| `value` * | `string` |  |  |
| `autosize` | `boolean \| undefined` | `true` |  |
| `className` | `string \| undefined` |  |  |
| `corner` | `ReactNode` |  | Canto direito do rótulo (contador, link "Esqueci a senha"). |
| `counter` | `boolean \| undefined` |  |  |
| `error` | `ReactNode` |  |  |
| `hint` | `ReactNode` |  |  |
| `label` | `string \| undefined` |  |  |
| `maxRows` | `number \| undefined` | `10` |  |
| `minRows` | `number \| undefined` | `3` |  |
| `optional` | `boolean \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/form-texto`):

```tsx
<TextareaField label="Resumo" value={bio} onChange={setBio} maxLength={280} counter minRows={3} maxRows={8} />
```

## TextField

Campo de texto completo.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `onChange` * | `(value: string) => void` |  |  |
| `value` * | `string` |  |  |
| `className` | `string \| undefined` |  |  |
| `clearable` | `boolean \| undefined` |  |  |
| `corner` | `ReactNode` |  | Canto direito do rótulo (contador, link "Esqueci a senha"). |
| `counter` | `boolean \| undefined` |  |  |
| `error` | `ReactNode` |  |  |
| `hint` | `ReactNode` |  |  |
| `icon` | `ReactNode` |  |  |
| `label` | `string \| undefined` |  |  |
| `loading` | `boolean \| undefined` |  | Validação assíncrona em andamento (ex.: e-mail já existe?). |
| `optional` | `boolean \| undefined` |  |  |
| `prefix` | `ReactNode` |  |  |
| `size` | `"sm" \| "md" \| "lg" \| undefined` | `"md"` |  |
| `suffix` | `ReactNode` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/form-texto`):

```tsx
<TextField label="Nome completo" value={name} onChange={setName} />
<TextField label="E-mail" type="email" value={email} onChange={setEmail}
  hint="Usamos para enviar a proposta."
  error={email && !email.includes("@") ? "Informe um e-mail válido, como nome@empresa.com." : undefined} />
```

## ToggleGroup

Grupo de botões com estado (negrito/itálico, dias da semana, filtros rápidos).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `label` * | `string` |  |  |
| `onChange` * | `((value: T \| null) => void) \| ((value: T[]) => void)` |  |  |
| `options` * | `{ value: T; label: string; icon?: ReactNode; hideLabel?: boolean; disabled?: boolean; }[]` |  |  |
| `value` * | `T \| T[] \| null` |  |  |
| `className` | `string \| undefined` |  |  |
| `disabled` | `boolean \| undefined` |  |  |
| `multiple` | `boolean \| undefined` |  |  |
| `size` | `"sm" \| "md" \| undefined` | `"md"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/form-selecao`):

```tsx
<ToggleGroup label="Alinhamento" value={align} onChange={setAlign} options={[{ value: "l", label: "Esquerda", icon: <AlignLeft />, hideLabel: true }, …]} />
<ToggleGroup multiple label="Dias" value={days} onChange={setDays} options={…} />
```

## UploadItem (type)

```ts
type UploadItem = { id: string; name: string; size: number; progress?: number; error?: string; }
```
