# command

Arquivo: `src/components/command.tsx` · importe de `@g4ai/ds`.

Command componível (equivalente ao Command do shadcn/ui, sem cmdk): busca + lista com grupos, ↑ ↓ Home End Enter, vazio, carregando e atalhos.

## CommandDialog

Command dentro de um diálogo (a paleta montada à mão).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `label` * | `string` |  |  |
| `onOpenChange` * | `(open: boolean) => void` |  |  |
| `open` * | `boolean` |  |  |
| `className` | `string \| undefined` |  |  |
| `filter` | `boolean \| ((text: string, query: string) => boolean) \| undefined` |  |  |
| `onValueChange` | `((value: string) => void) \| undefined` |  |  |
| `value` | `string \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ov-comando-componivel`):

```tsx
<CommandDialog open={open} onOpenChange={setOpen} label="Ações rápidas">
  <CommandInput placeholder="Buscar ação…" autoFocus />
  <CommandList>…</CommandList>
</CommandDialog>
```

## CommandEmpty

Aparece quando nenhum item combina com a busca.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` | `ReactNode` | `"Nada encontrado"` |  |
| `className` | `string \| undefined` |  |  |
| `hint` | `ReactNode` | `"Tente outro termo, sem acento ou abrevi` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ov-comando-componivel`):

```tsx
<CommandMenu label="Buscar empresa" value={q} onValueChange={setQ} filter={false}>\n  …{loading ? <CommandLoading /> : <CommandEmpty />}…\n</CommandMenu>
```

## CommandGroup

Grupo com título. Some sozinho quando a busca esvazia todos os itens dele.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `className` | `string \| undefined` |  |  |
| `heading` | `ReactNode` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ov-comando-componivel`):

```tsx
<CommandMenu label="Sugestões">
  <CommandInput placeholder="Digite um comando ou busque…" />
  <CommandList>
    <CommandEmpty>Nada encontrado</CommandEmpty>
    <CommandGroup heading="Sugestões">
      <CommandItem icon={<Calendar />} onSelect={…}>Agenda</CommandItem>
      <CommandItem icon={<Smile />} onSelect={…}>Buscar emoji</CommandItem>
      <CommandItem icon={<Calculator />} disabled>Calculadora</CommandItem>
    </CommandGroup>
    <CommandSeparator />
    <CommandGroup heading="Configurações">
      <CommandItem icon={<User />} shortcut={["mod", "P"]} onSelect={…}>Perfil</CommandItem>
    </CommandGroup>
  </CommandList>
</CommandMenu>
```

## CommandInput

Campo de busca. Setas mudam o item ativo; Enter executa.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `autoFocus` | `boolean \| undefined` |  |  |
| `className` | `string \| undefined` |  |  |
| `placeholder` | `string \| undefined` | `"Buscar…"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ov-comando-componivel`):

```tsx
<CommandDialog open={open} onOpenChange={setOpen} label="Ações rápidas">
  <CommandInput placeholder="Buscar ação…" autoFocus />
  <CommandList>…</CommandList>
</CommandDialog>
```

## CommandItem

Um item. `value` é o texto usado na busca (padrão: children, se for texto); `keywords` acrescenta sinônimos e siglas.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `className` | `string \| undefined` |  |  |
| `description` | `ReactNode` |  |  |
| `disabled` | `boolean \| undefined` |  |  |
| `icon` | `ReactNode` |  |  |
| `keywords` | `string[] \| undefined` |  |  |
| `meta` | `ReactNode` |  | Texto à direita (contexto: empresa, módulo). |
| `onSelect` | `((value: string) => void) \| undefined` |  |  |
| `shortcut` | `string[] \| undefined` |  |  |
| `value` | `string \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ov-comando-componivel`):

```tsx
<CommandItem icon={<FilePlus2 />} keywords={["oportunidade", "deal"]} description="Abre o formulário no painel lateral">Novo negócio</CommandItem>
```

## CommandList

Lista que rola (até `maxHeight`).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `className` | `string \| undefined` |  |  |
| `maxHeight` | `number \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ov-comando-componivel`):

```tsx
<CommandList maxHeight={220}>…</CommandList>
```

## CommandLoading

Enquanto a busca no servidor responde.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` | `ReactNode` | `"Buscando…"` |  |
| `className` | `string \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ov-comando-componivel`):

```tsx
<CommandMenu label="Buscar empresa" value={q} onValueChange={setQ} filter={false}>\n  …{loading ? <CommandLoading /> : <CommandEmpty />}…\n</CommandMenu>
```

## commandMatch (function)

Combina sem acento e sem caixa: cada palavra da busca aparece no texto; ou, para erro de digitação ("confg"), as letras da busca em ordem dentro de UMA palavra que começa com a mesma letra.

```ts
commandMatch(text, query): boolean
```

## CommandMenu

Raiz: guarda a busca e o item ativo.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `label` * | `string` |  | Nome acessível: "Ações", "Trocar de workspace". |
| `className` | `string \| undefined` |  |  |
| `filter` | `boolean \| ((text: string, query: string) => boolean) \| undefined` | `true` |  |
| `loop` | `boolean \| undefined` | `true` | ↓ no último volta ao primeiro. |
| `onValueChange` | `((value: string) => void) \| undefined` |  |  |
| `value` | `string \| undefined` |  | Texto da busca (controlado). |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ov-comando-componivel`):

```tsx
<CommandMenu label="Buscar empresa" value={q} onValueChange={setQ} filter={false}>\n  …{loading ? <CommandLoading /> : <CommandEmpty />}…\n</CommandMenu>
```

## CommandSeparator

Linha entre grupos (escondida durante a busca).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `className` | `string \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ov-comando-componivel`):

```tsx
<CommandMenu label="Sugestões">
  <CommandInput placeholder="Digite um comando ou busque…" />
  <CommandList>
    <CommandEmpty>Nada encontrado</CommandEmpty>
    <CommandGroup heading="Sugestões">
      <CommandItem icon={<Calendar />} onSelect={…}>Agenda</CommandItem>
      <CommandItem icon={<Smile />} onSelect={…}>Buscar emoji</CommandItem>
      <CommandItem icon={<Calculator />} disabled>Calculadora</CommandItem>
    </CommandGroup>
    <CommandSeparator />
    <CommandGroup heading="Configurações">
      <CommandItem icon={<User />} shortcut={["mod", "P"]} onSelect={…}>Perfil</CommandItem>
    </CommandGroup>
  </CommandList>
</CommandMenu>
```

## CommandShortcut

Atalho à direita do item: ["⌘", "N"] ou ["mod", "N"] (⌘ no Mac, Ctrl nos outros).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `keys` * | `string[]` |  |  |
| `className` | `string \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.
