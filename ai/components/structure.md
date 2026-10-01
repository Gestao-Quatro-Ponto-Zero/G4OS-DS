# structure

Arquivo: `src/components/structure.tsx` · importe de `@g4ai/ds`.

Estrutura: Separator, ScrollArea, Label, FieldSet/FieldGroup/FieldSeparator, Item (mídia · título · ações), Table estática, Prose (texto longo).

## FieldGroup

Empilha campos ou FieldSets com o espaçamento padrão de formulário.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `className` | `string \| undefined` |  |  |
| `gap` | `"sm" \| "md" \| "lg" \| undefined` | `"md"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/form-grupos-e-complementos`):

```tsx
<FieldGroup>
  <FieldSet legend="Endereço de cobrança" description="Aparece na nota fiscal.">
    <FieldGroup gap="sm">
      <TextField label="Rua e número" value={rua} onChange={setRua} />
      <div className="grid gap-3 sm:grid-cols-[1fr_160px]">
        <TextField label="Cidade" value={cidade} onChange={setCidade} />
        <TextField label="CEP" value={cep} onChange={setCep} />
      </div>
    </FieldGroup>
  </FieldSet>
  <FieldSeparator />
  <FieldSet variant="label" legend="Avisar por e-mail quando">
    <Switch label="Um negócio muda de etapa" checked={avisos.etapa} onCheckedChange={…} />
    <Switch label="Uma tarefa vence hoje" checked={avisos.tarefa} onCheckedChange={…} />
  </FieldSet>
</FieldGroup>
```

## FieldSeparator

Divisória entre grupos de um formulário, com rótulo opcional ("ou").

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `className` | `string \| undefined` |  |  |
| `label` | `ReactNode` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/form-grupos-e-complementos`):

```tsx
<FieldGroup>
  <FieldSet legend="Endereço de cobrança" description="Aparece na nota fiscal.">
    <FieldGroup gap="sm">
      <TextField label="Rua e número" value={rua} onChange={setRua} />
      <div className="grid gap-3 sm:grid-cols-[1fr_160px]">
        <TextField label="Cidade" value={cidade} onChange={setCidade} />
        <TextField label="CEP" value={cep} onChange={setCep} />
      </div>
    </FieldGroup>
  </FieldSet>
  <FieldSeparator />
  <FieldSet variant="label" legend="Avisar por e-mail quando">
    <Switch label="Um negócio muda de etapa" checked={avisos.etapa} onCheckedChange={…} />
    <Switch label="Uma tarefa vence hoje" checked={avisos.tarefa} onCheckedChange={…} />
  </FieldSet>
</FieldGroup>
```

## FieldSet

Grupo de campos com legenda: endereço, dados de cobrança, permissões.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `legend` * | `ReactNode` |  |  |
| `className` | `string \| undefined` |  |  |
| `description` | `ReactNode` |  |  |
| `disabled` | `boolean \| undefined` |  |  |
| `variant` | `"section" \| "label" \| undefined` | `"section"` | "section" = título de seção (15 px); "label" = rótulo de grupo (12.5 px), para radios/checkboxes. |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/form-grupos-e-complementos`):

```tsx
<FieldGroup>
  <FieldSet legend="Endereço de cobrança" description="Aparece na nota fiscal.">
    <FieldGroup gap="sm">
      <TextField label="Rua e número" value={rua} onChange={setRua} />
      <div className="grid gap-3 sm:grid-cols-[1fr_160px]">
        <TextField label="Cidade" value={cidade} onChange={setCidade} />
        <TextField label="CEP" value={cep} onChange={setCep} />
      </div>
    </FieldGroup>
  </FieldSet>
  <FieldSeparator />
  <FieldSet variant="label" legend="Avisar por e-mail quando">
    <Switch label="Um negócio muda de etapa" checked={avisos.etapa} onCheckedChange={…} />
    <Switch label="Uma tarefa vence hoje" checked={avisos.tarefa} onCheckedChange={…} />
  </FieldSet>
</FieldGroup>
```

## Item

Linha genérica de conteúdo: mídia (ícone/avatar/imagem) · título e descrição · ações.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `href` | `string \| undefined` |  |  |
| `size` | `"sm" \| "md" \| undefined` | `"md"` |  |
| `variant` | `"default" \| "outline" \| "muted" \| undefined` | `"default"` | "outline" = borda própria (item solto); "muted" = fundo gelo; "default" = sem moldura (dentro de ItemGroup/Card). |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/estrutura-item-e-tabela`):

```tsx
<ItemGroup label="Integrações">
  <Item>
    <ItemMedia variant="icon"><Plug /></ItemMedia>
    <ItemContent>
      <ItemTitle>Slack</ItemTitle>
      <ItemDescription>Avisos de negócio ganho e tarefas vencendo no canal do time.</ItemDescription>
    </ItemContent>
    <ItemActions><Switch label="Ativar Slack" hideLabel checked={slack} onCheckedChange={setSlack} /></ItemActions>
  </Item>
</ItemGroup>

<Item variant="outline" href="/contratos/123">…</Item>
```

## ItemActions

Ações à direita (Button ghost/quiet, IconButton, Switch, Badge).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `className` | `string \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/estrutura-item-e-tabela`):

```tsx
<ItemGroup label="Integrações">
  <Item>
    <ItemMedia variant="icon"><Plug /></ItemMedia>
    <ItemContent>
      <ItemTitle>Slack</ItemTitle>
      <ItemDescription>Avisos de negócio ganho e tarefas vencendo no canal do time.</ItemDescription>
    </ItemContent>
    <ItemActions><Switch label="Ativar Slack" hideLabel checked={slack} onCheckedChange={setSlack} /></ItemActions>
  </Item>
</ItemGroup>

<Item variant="outline" href="/contratos/123">…</Item>
```

## ItemContent

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `className` | `string \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/estrutura-item-e-tabela`):

```tsx
<ItemGroup label="Integrações">
  <Item>
    <ItemMedia variant="icon"><Plug /></ItemMedia>
    <ItemContent>
      <ItemTitle>Slack</ItemTitle>
      <ItemDescription>Avisos de negócio ganho e tarefas vencendo no canal do time.</ItemDescription>
    </ItemContent>
    <ItemActions><Switch label="Ativar Slack" hideLabel checked={slack} onCheckedChange={setSlack} /></ItemActions>
  </Item>
</ItemGroup>

<Item variant="outline" href="/contratos/123">…</Item>
```

## ItemDescription

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `className` | `string \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/estrutura-item-e-tabela`):

```tsx
<ItemGroup label="Integrações">
  <Item>
    <ItemMedia variant="icon"><Plug /></ItemMedia>
    <ItemContent>
      <ItemTitle>Slack</ItemTitle>
      <ItemDescription>Avisos de negócio ganho e tarefas vencendo no canal do time.</ItemDescription>
    </ItemContent>
    <ItemActions><Switch label="Ativar Slack" hideLabel checked={slack} onCheckedChange={setSlack} /></ItemActions>
  </Item>
</ItemGroup>

<Item variant="outline" href="/contratos/123">…</Item>
```

## ItemGroup

Lista de Items com borda única e divisórias.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `className` | `string \| undefined` |  |  |
| `label` | `string \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/estrutura-item-e-tabela`):

```tsx
<ItemGroup label="Integrações">
  <Item>
    <ItemMedia variant="icon"><Plug /></ItemMedia>
    <ItemContent>
      <ItemTitle>Slack</ItemTitle>
      <ItemDescription>Avisos de negócio ganho e tarefas vencendo no canal do time.</ItemDescription>
    </ItemContent>
    <ItemActions><Switch label="Ativar Slack" hideLabel checked={slack} onCheckedChange={setSlack} /></ItemActions>
  </Item>
</ItemGroup>

<Item variant="outline" href="/contratos/123">…</Item>
```

## ItemMedia

Mídia à esquerda do Item: "icon" = quadrado gelo com ícone 16 px; "image" = miniatura 40 px.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `className` | `string \| undefined` |  |  |
| `variant` | `"icon" \| "image" \| "default" \| undefined` | `"default"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/estrutura-item-e-tabela`):

```tsx
<ItemGroup label="Integrações">
  <Item>
    <ItemMedia variant="icon"><Plug /></ItemMedia>
    <ItemContent>
      <ItemTitle>Slack</ItemTitle>
      <ItemDescription>Avisos de negócio ganho e tarefas vencendo no canal do time.</ItemDescription>
    </ItemContent>
    <ItemActions><Switch label="Ativar Slack" hideLabel checked={slack} onCheckedChange={setSlack} /></ItemActions>
  </Item>
</ItemGroup>

<Item variant="outline" href="/contratos/123">…</Item>
```

## ItemTitle

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `className` | `string \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/estrutura-item-e-tabela`):

```tsx
<ItemGroup label="Integrações">
  <Item>
    <ItemMedia variant="icon"><Plug /></ItemMedia>
    <ItemContent>
      <ItemTitle>Slack</ItemTitle>
      <ItemDescription>Avisos de negócio ganho e tarefas vencendo no canal do time.</ItemDescription>
    </ItemContent>
    <ItemActions><Switch label="Ativar Slack" hideLabel checked={slack} onCheckedChange={setSlack} /></ItemActions>
  </Item>
</ItemGroup>

<Item variant="outline" href="/contratos/123">…</Item>
```

## Label

Rótulo visível de um controle.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `htmlFor` * | `string` |  | id do controle. Obrigatório para o clique focar o campo e o leitor de tela ler o nome. |
| `className` | `string \| undefined` |  |  |
| `optional` | `boolean \| undefined` |  | Marca "(opcional)": use quando a maioria do formulário é obrigatória. |
| `required` | `boolean \| undefined` |  | Marca "obrigatório" (asterisco com texto acessível). |

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

## Prose

Tipografia de texto longo (equivalente ao Typography do shadcn): títulos, listas, links, citações, código e tabelas já no tema.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `className` | `string \| undefined` |  |  |
| `wide` | `boolean \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/estrutura-tipografia`):

```tsx
<Prose>
  <h2>Política de reembolso</h2>
  <p>Pedidos cancelados em até <strong>7 dias</strong> são reembolsados integralmente…</p>
  <ul><li>…</li></ul>
  <blockquote>…</blockquote>
</Prose>

// markdown já convertido em HTML (sanitize antes!)
<Prose><div dangerouslySetInnerHTML={{ __html: html }} /></Prose>
```

## ScrollArea

Área com rolagem própria: barra fina que aparece ao passar o mouse ou rolar, esmaecimento nas bordas quando há mais conteúdo e foco por teclado.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `className` | `string \| undefined` |  |  |
| `contentClassName` | `string \| undefined` |  |  |
| `fade` | `boolean \| undefined` | `true` | Esmaece a borda onde ainda há conteúdo. |
| `label` | `string \| undefined` |  | Nome acessível da região rolável (ex.: "Lista de membros"). |
| `maxHeight` | `string \| number \| undefined` |  | Altura máxima (px ou CSS). |
| `orientation` | `"both" \| "horizontal" \| "vertical" \| undefined` | `"vertical"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/estrutura-separador-e-rolagem`):

```tsx
<ScrollArea maxHeight={280} label="Membros do time" className="rounded-xl border border-line bg-surface">
  {pessoas.map((p) => <Row key={p.nome} {...p} />)}
</ScrollArea>

<ScrollArea orientation="horizontal" label="Etapas">
  <div className="flex gap-2 p-1">{etapas.map((e) => <Badge key={e}>{e}</Badge>)}</div>
</ScrollArea>
```

## Separator

Divisória de 1 px em `line`.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `className` | `string \| undefined` |  |  |
| `label` | `ReactNode` |  | Texto curto no meio da linha. |
| `orientation` | `"horizontal" \| "vertical" \| undefined` | `"horizontal"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/estrutura-separador-e-rolagem`):

```tsx
<Separator />
<Separator label="ou continue com" />
<div className="flex h-5 items-center gap-3">
  <span>Pipeline</span><Separator orientation="vertical" /><span>Previsão</span>
</div>
```

## Table

Tabela estática simples (comparativo, especificação, resumo de fatura).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `className` | `string \| undefined` |  |  |
| `label` | `string \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/estrutura-item-e-tabela`):

```tsx
<Table>
  <TableCaption>Valores mensais. Impostos inclusos.</TableCaption>
  <TableHeader>
    <TableRow><TableHead>Item</TableHead><TableHead numeric>Qtd.</TableHead><TableHead numeric>Total</TableHead></TableRow>
  </TableHeader>
  <TableBody>
    {linhas.map((l) => (
      <TableRow key={l.item}>
        <TableCell>{l.item}</TableCell>
        <TableCell numeric>{l.qtd}</TableCell>
        <TableCell numeric>{formatCurrency(l.qtd * l.unit)}</TableCell>
      </TableRow>
    ))}
  </TableBody>
  <TableFooter><TableRow><TableCell colSpan={2}>Total</TableCell><TableCell numeric>{formatCurrency(total)}</TableCell></TableRow></TableFooter>
</Table>
```

## TableBody

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `className` | `string \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/estrutura-item-e-tabela`):

```tsx
<Table>
  <TableCaption>Valores mensais. Impostos inclusos.</TableCaption>
  <TableHeader>
    <TableRow><TableHead>Item</TableHead><TableHead numeric>Qtd.</TableHead><TableHead numeric>Total</TableHead></TableRow>
  </TableHeader>
  <TableBody>
    {linhas.map((l) => (
      <TableRow key={l.item}>
        <TableCell>{l.item}</TableCell>
        <TableCell numeric>{l.qtd}</TableCell>
        <TableCell numeric>{formatCurrency(l.qtd * l.unit)}</TableCell>
      </TableRow>
    ))}
  </TableBody>
  <TableFooter><TableRow><TableCell colSpan={2}>Total</TableCell><TableCell numeric>{formatCurrency(total)}</TableCell></TableRow></TableFooter>
</Table>
```

## TableCaption

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `className` | `string \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/estrutura-item-e-tabela`):

```tsx
<Table>
  <TableCaption>Valores mensais. Impostos inclusos.</TableCaption>
  <TableHeader>
    <TableRow><TableHead>Item</TableHead><TableHead numeric>Qtd.</TableHead><TableHead numeric>Total</TableHead></TableRow>
  </TableHeader>
  <TableBody>
    {linhas.map((l) => (
      <TableRow key={l.item}>
        <TableCell>{l.item}</TableCell>
        <TableCell numeric>{l.qtd}</TableCell>
        <TableCell numeric>{formatCurrency(l.qtd * l.unit)}</TableCell>
      </TableRow>
    ))}
  </TableBody>
  <TableFooter><TableRow><TableCell colSpan={2}>Total</TableCell><TableCell numeric>{formatCurrency(total)}</TableCell></TableRow></TableFooter>
</Table>
```

## TableCell

Célula. `numeric` = direita + tabular-nums (formate com formatCurrency/formatNumber).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `numeric` | `boolean \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/estrutura-item-e-tabela`):

```tsx
<Table>
  <TableCaption>Valores mensais. Impostos inclusos.</TableCaption>
  <TableHeader>
    <TableRow><TableHead>Item</TableHead><TableHead numeric>Qtd.</TableHead><TableHead numeric>Total</TableHead></TableRow>
  </TableHeader>
  <TableBody>
    {linhas.map((l) => (
      <TableRow key={l.item}>
        <TableCell>{l.item}</TableCell>
        <TableCell numeric>{l.qtd}</TableCell>
        <TableCell numeric>{formatCurrency(l.qtd * l.unit)}</TableCell>
      </TableRow>
    ))}
  </TableBody>
  <TableFooter><TableRow><TableCell colSpan={2}>Total</TableCell><TableCell numeric>{formatCurrency(total)}</TableCell></TableRow></TableFooter>
</Table>
```

## TableFooter

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `className` | `string \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/estrutura-item-e-tabela`):

```tsx
<Table>
  <TableCaption>Valores mensais. Impostos inclusos.</TableCaption>
  <TableHeader>
    <TableRow><TableHead>Item</TableHead><TableHead numeric>Qtd.</TableHead><TableHead numeric>Total</TableHead></TableRow>
  </TableHeader>
  <TableBody>
    {linhas.map((l) => (
      <TableRow key={l.item}>
        <TableCell>{l.item}</TableCell>
        <TableCell numeric>{l.qtd}</TableCell>
        <TableCell numeric>{formatCurrency(l.qtd * l.unit)}</TableCell>
      </TableRow>
    ))}
  </TableBody>
  <TableFooter><TableRow><TableCell colSpan={2}>Total</TableCell><TableCell numeric>{formatCurrency(total)}</TableCell></TableRow></TableFooter>
</Table>
```

## TableHead

Cabeçalho de coluna. `numeric` alinha à direita (valores, quantidades).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `numeric` | `boolean \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/estrutura-item-e-tabela`):

```tsx
<Table>
  <TableCaption>Valores mensais. Impostos inclusos.</TableCaption>
  <TableHeader>
    <TableRow><TableHead>Item</TableHead><TableHead numeric>Qtd.</TableHead><TableHead numeric>Total</TableHead></TableRow>
  </TableHeader>
  <TableBody>
    {linhas.map((l) => (
      <TableRow key={l.item}>
        <TableCell>{l.item}</TableCell>
        <TableCell numeric>{l.qtd}</TableCell>
        <TableCell numeric>{formatCurrency(l.qtd * l.unit)}</TableCell>
      </TableRow>
    ))}
  </TableBody>
  <TableFooter><TableRow><TableCell colSpan={2}>Total</TableCell><TableCell numeric>{formatCurrency(total)}</TableCell></TableRow></TableFooter>
</Table>
```

## TableHeader

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `className` | `string \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/estrutura-item-e-tabela`):

```tsx
<Table>
  <TableCaption>Valores mensais. Impostos inclusos.</TableCaption>
  <TableHeader>
    <TableRow><TableHead>Item</TableHead><TableHead numeric>Qtd.</TableHead><TableHead numeric>Total</TableHead></TableRow>
  </TableHeader>
  <TableBody>
    {linhas.map((l) => (
      <TableRow key={l.item}>
        <TableCell>{l.item}</TableCell>
        <TableCell numeric>{l.qtd}</TableCell>
        <TableCell numeric>{formatCurrency(l.qtd * l.unit)}</TableCell>
      </TableRow>
    ))}
  </TableBody>
  <TableFooter><TableRow><TableCell colSpan={2}>Total</TableCell><TableCell numeric>{formatCurrency(total)}</TableCell></TableRow></TableFooter>
</Table>
```

## TableRow

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `className` | `string \| undefined` |  |  |
| `selected` | `boolean \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/estrutura-item-e-tabela`):

```tsx
<Table>
  <TableCaption>Valores mensais. Impostos inclusos.</TableCaption>
  <TableHeader>
    <TableRow><TableHead>Item</TableHead><TableHead numeric>Qtd.</TableHead><TableHead numeric>Total</TableHead></TableRow>
  </TableHeader>
  <TableBody>
    {linhas.map((l) => (
      <TableRow key={l.item}>
        <TableCell>{l.item}</TableCell>
        <TableCell numeric>{l.qtd}</TableCell>
        <TableCell numeric>{formatCurrency(l.qtd * l.unit)}</TableCell>
      </TableRow>
    ))}
  </TableBody>
  <TableFooter><TableRow><TableCell colSpan={2}>Total</TableCell><TableCell numeric>{formatCurrency(total)}</TableCell></TableRow></TableFooter>
</Table>
```
