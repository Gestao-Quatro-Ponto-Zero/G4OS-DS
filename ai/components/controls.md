# controls

Arquivo: `src/components/controls.tsx` · importe de `@g4ai/ds`.

Controles: Toggle, ButtonGroup, InputGroup (complementos dentro do campo), ColorPicker.

## ButtonGroup

Botões colados que formam uma ação composta (Anterior | Próximo, Copiar | ⌄, zoom − 100 % +).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `label` * | `string` |  | Nome acessível do grupo ("Navegação entre registros"). |
| `className` | `string \| undefined` |  |  |
| `orientation` | `"horizontal" \| "vertical" \| undefined` | `"horizontal"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/acoes-toggle-e-grupos`):

```tsx
<ButtonGroup label="Navegar entre registros">
  <IconButton label="Anterior"><ChevronLeft /></IconButton>
  <ButtonGroupText>3 de 48</ButtonGroupText>
  <IconButton label="Próximo"><ChevronRight /></IconButton>
</ButtonGroup>

<ButtonGroup label="Zoom">
  <Button variant="ghost" size="sm" onClick={menos}><Minus /></Button>
  <ButtonGroupText>{formatPercent(zoom)}</ButtonGroupText>
  <Button variant="ghost" size="sm" onClick={mais}><Plus /></Button>
</ButtonGroup>
```

## ButtonGroupText

Segmento de texto não clicável dentro de um ButtonGroup ("100 %", "Página 2").

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `className` | `string \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/acoes-toggle-e-grupos`):

```tsx
<ButtonGroup label="Navegar entre registros">
  <IconButton label="Anterior"><ChevronLeft /></IconButton>
  <ButtonGroupText>3 de 48</ButtonGroupText>
  <IconButton label="Próximo"><ChevronRight /></IconButton>
</ButtonGroup>

<ButtonGroup label="Zoom">
  <Button variant="ghost" size="sm" onClick={menos}><Minus /></Button>
  <ButtonGroupText>{formatPercent(zoom)}</ButtonGroupText>
  <Button variant="ghost" size="sm" onClick={mais}><Plus /></Button>
</ButtonGroup>
```

## ColorPicker

Escolha de cor para personalização (cor da marca do cliente, etiqueta, calendário, pipeline).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `label` * | `string` |  | Rótulo visível acima do campo. |
| `onChange` * | `(hex: string) => void` |  |  |
| `value` * | `string` |  | Hex (#RRGGBB). |
| `allowCustom` | `boolean \| undefined` | `true` | Hex digitável e seletor livre. |
| `className` | `string \| undefined` |  |  |
| `disabled` | `boolean \| undefined` |  |  |
| `hint` | `ReactNode` |  |  |
| `showContrast` | `boolean \| undefined` | `true` | Mostra o contraste do melhor texto (claro/escuro) sobre a cor. |
| `swatches` | `string[] \| undefined` | `colorSwatches` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/form-cor`):

```tsx
<ColorPicker label="Cor da etiqueta" value={tag} onChange={setTag} swatches={etiquetas} allowCustom={false} showContrast={false} />
```

## colorSwatches (const)

Amostras padrão: neutros + paleta de marca G4 + tons de apoio.

## InputGroup

Campo com complementos: ícone, prefixo/sufixo de texto, botão, atalho, contador; acima/abaixo do texto (composer com barra de ações).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `className` | `string \| undefined` |  |  |
| `invalid` | `boolean \| undefined` |  | Borda de erro (combine com a mensagem do FieldBlock). |
| `size` | `"sm" \| "md" \| undefined` | `"md"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/form-grupos-e-complementos`):

```tsx
<Label htmlFor="slug">Endereço do convite</Label>
<InputGroup>
  <InputGroupAddon><InputGroupText>app.g4os.com.br/</InputGroupText></InputGroupAddon>
  <InputGroupInput id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
  <InputGroupAddon align="inline-end"><CopyButton value={link} label="Copiar link" iconOnly /></InputGroupAddon>
</InputGroup>

<InputGroup>
  <InputGroupAddon><Search /></InputGroupAddon>
  <InputGroupInput aria-label="Buscar negócios" placeholder="Buscar negócios" />
  <InputGroupAddon align="inline-end"><Kbd>/</Kbd></InputGroupAddon>
</InputGroup>

<InputGroup>
  <InputGroupTextarea aria-label="Mensagem" placeholder="Escreva para o time…" />
  <InputGroupAddon align="block-end">
    <InputGroupButton label="Anexar"><Paperclip /></InputGroupButton>
    <InputGroupButton label="Mencionar"><AtSign /></InputGroupButton>
    <InputGroupButton variant="primary" label="Enviar" className="ml-auto"><ArrowUp /></InputGroupButton>
  </InputGroupAddon>
</InputGroup>
```

## InputGroupAddon

Complemento do InputGroup.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `align` | `"inline-start" \| "inline-end" \| "block-start" \| "block-end" \| undefined` | `"inline-start"` |  |
| `className` | `string \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/form-grupos-e-complementos`):

```tsx
<Label htmlFor="slug">Endereço do convite</Label>
<InputGroup>
  <InputGroupAddon><InputGroupText>app.g4os.com.br/</InputGroupText></InputGroupAddon>
  <InputGroupInput id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
  <InputGroupAddon align="inline-end"><CopyButton value={link} label="Copiar link" iconOnly /></InputGroupAddon>
</InputGroup>

<InputGroup>
  <InputGroupAddon><Search /></InputGroupAddon>
  <InputGroupInput aria-label="Buscar negócios" placeholder="Buscar negócios" />
  <InputGroupAddon align="inline-end"><Kbd>/</Kbd></InputGroupAddon>
</InputGroup>

<InputGroup>
  <InputGroupTextarea aria-label="Mensagem" placeholder="Escreva para o time…" />
  <InputGroupAddon align="block-end">
    <InputGroupButton label="Anexar"><Paperclip /></InputGroupButton>
    <InputGroupButton label="Mencionar"><AtSign /></InputGroupButton>
    <InputGroupButton variant="primary" label="Enviar" className="ml-auto"><ArrowUp /></InputGroupButton>
  </InputGroupAddon>
</InputGroup>
```

## InputGroupButton

Botão compacto dentro do InputGroup (copiar, limpar, enviar, mostrar senha).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `label` | `string \| undefined` |  |  |
| `variant` | `"primary" \| "ghost" \| "quiet" \| undefined` | `"quiet"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/form-grupos-e-complementos`):

```tsx
<Label htmlFor="slug">Endereço do convite</Label>
<InputGroup>
  <InputGroupAddon><InputGroupText>app.g4os.com.br/</InputGroupText></InputGroupAddon>
  <InputGroupInput id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
  <InputGroupAddon align="inline-end"><CopyButton value={link} label="Copiar link" iconOnly /></InputGroupAddon>
</InputGroup>

<InputGroup>
  <InputGroupAddon><Search /></InputGroupAddon>
  <InputGroupInput aria-label="Buscar negócios" placeholder="Buscar negócios" />
  <InputGroupAddon align="inline-end"><Kbd>/</Kbd></InputGroupAddon>
</InputGroup>

<InputGroup>
  <InputGroupTextarea aria-label="Mensagem" placeholder="Escreva para o time…" />
  <InputGroupAddon align="block-end">
    <InputGroupButton label="Anexar"><Paperclip /></InputGroupButton>
    <InputGroupButton label="Mencionar"><AtSign /></InputGroupButton>
    <InputGroupButton variant="primary" label="Enviar" className="ml-auto"><ArrowUp /></InputGroupButton>
  </InputGroupAddon>
</InputGroup>
```

## InputGroupInput

Input sem caixa para dentro do InputGroup.

Exemplo (showcase `#/p/form-grupos-e-complementos`):

```tsx
<Label htmlFor="slug">Endereço do convite</Label>
<InputGroup>
  <InputGroupAddon><InputGroupText>app.g4os.com.br/</InputGroupText></InputGroupAddon>
  <InputGroupInput id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
  <InputGroupAddon align="inline-end"><CopyButton value={link} label="Copiar link" iconOnly /></InputGroupAddon>
</InputGroup>

<InputGroup>
  <InputGroupAddon><Search /></InputGroupAddon>
  <InputGroupInput aria-label="Buscar negócios" placeholder="Buscar negócios" />
  <InputGroupAddon align="inline-end"><Kbd>/</Kbd></InputGroupAddon>
</InputGroup>

<InputGroup>
  <InputGroupTextarea aria-label="Mensagem" placeholder="Escreva para o time…" />
  <InputGroupAddon align="block-end">
    <InputGroupButton label="Anexar"><Paperclip /></InputGroupButton>
    <InputGroupButton label="Mencionar"><AtSign /></InputGroupButton>
    <InputGroupButton variant="primary" label="Enviar" className="ml-auto"><ArrowUp /></InputGroupButton>
  </InputGroupAddon>
</InputGroup>
```

## InputGroupText

Texto do complemento: "R$", "https://", ".com.br", "12/280".

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `className` | `string \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/form-grupos-e-complementos`):

```tsx
<Label htmlFor="slug">Endereço do convite</Label>
<InputGroup>
  <InputGroupAddon><InputGroupText>app.g4os.com.br/</InputGroupText></InputGroupAddon>
  <InputGroupInput id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
  <InputGroupAddon align="inline-end"><CopyButton value={link} label="Copiar link" iconOnly /></InputGroupAddon>
</InputGroup>

<InputGroup>
  <InputGroupAddon><Search /></InputGroupAddon>
  <InputGroupInput aria-label="Buscar negócios" placeholder="Buscar negócios" />
  <InputGroupAddon align="inline-end"><Kbd>/</Kbd></InputGroupAddon>
</InputGroup>

<InputGroup>
  <InputGroupTextarea aria-label="Mensagem" placeholder="Escreva para o time…" />
  <InputGroupAddon align="block-end">
    <InputGroupButton label="Anexar"><Paperclip /></InputGroupButton>
    <InputGroupButton label="Mencionar"><AtSign /></InputGroupButton>
    <InputGroupButton variant="primary" label="Enviar" className="ml-auto"><ArrowUp /></InputGroupButton>
  </InputGroupAddon>
</InputGroup>
```

## InputGroupTextarea

Textarea sem caixa para dentro do InputGroup (composer, comentário com barra).

Exemplo (showcase `#/p/form-grupos-e-complementos`):

```tsx
<Label htmlFor="slug">Endereço do convite</Label>
<InputGroup>
  <InputGroupAddon><InputGroupText>app.g4os.com.br/</InputGroupText></InputGroupAddon>
  <InputGroupInput id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
  <InputGroupAddon align="inline-end"><CopyButton value={link} label="Copiar link" iconOnly /></InputGroupAddon>
</InputGroup>

<InputGroup>
  <InputGroupAddon><Search /></InputGroupAddon>
  <InputGroupInput aria-label="Buscar negócios" placeholder="Buscar negócios" />
  <InputGroupAddon align="inline-end"><Kbd>/</Kbd></InputGroupAddon>
</InputGroup>

<InputGroup>
  <InputGroupTextarea aria-label="Mensagem" placeholder="Escreva para o time…" />
  <InputGroupAddon align="block-end">
    <InputGroupButton label="Anexar"><Paperclip /></InputGroupButton>
    <InputGroupButton label="Mencionar"><AtSign /></InputGroupButton>
    <InputGroupButton variant="primary" label="Enviar" className="ml-auto"><ArrowUp /></InputGroupButton>
  </InputGroupAddon>
</InputGroup>
```

## Toggle

Botão liga/desliga isolado (negrito, fixar, favoritar, mostrar arquivados).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `onPressedChange` * | `(pressed: boolean) => void` |  |  |
| `pressed` * | `boolean` |  |  |
| `className` | `string \| undefined` |  |  |
| `disabled` | `boolean \| undefined` |  |  |
| `label` | `string \| undefined` |  | Obrigatório quando `children` é só um ícone. |
| `size` | `"sm" \| "md" \| undefined` | `"md"` |  |
| `variant` | `"quiet" \| "outline" \| undefined` | `"outline"` | "outline" = borda, ligado em `primary` (como ToggleGroup); "quiet" = sem borda, ligado em gelo (barras de ferramenta). |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/acoes-toggle-e-grupos`):

```tsx
<Toggle pressed={pin} onPressedChange={setPin}><Pin /> Fixado</Toggle>
<Toggle pressed={fav} onPressedChange={setFav} label="Favoritar"><Star /></Toggle>
<Toggle variant="quiet" pressed={bold} onPressedChange={setBold} label="Negrito"><Bold /></Toggle>
```
