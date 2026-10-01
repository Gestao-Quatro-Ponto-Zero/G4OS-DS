# record-panel

Arquivo: `src/components/record-panel.tsx` · importe de `@g4os/ds`.

Painel lateral de registro (estilo banco de dados): abre ao clicar numa linha da tabela sem tirar a pessoa da lista.

## ActivitySection

Atividade do registro (usa ActivityFeed).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `items` * | `ActivityItem[]` |  |  |
| `action` | `ReactNode` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/registros-painel-lateral`):

```tsx
<div className="flex gap-4">
  <DataGrid … onRowOpen={(r) => setAberto(r.id)} />
  <RecordPanel open={!!aberto} title={r.titulo} onTitleChange={…} position="3 de 18"
    onPrev={…} onNext={…} onDelete={…} onClose={() => setAberto(null)}
    properties={<PropertyPills><PropertyPill … /></PropertyPills>}>
    <RecordSection title="Arquivos" action={<SectionAddButton onClick={…} />}><FilesList files={…} /></RecordSection>
    <RecordSection title="Notas do documento"><NotesTable columns={…} rows={…} /></RecordSection>
    <ActivitySection items={…} />
  </RecordPanel>
</div>
```

## FileRow

Arquivo anexado: selo do tipo (ícone + rótulo), nome, ⋯.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `file` * | `RecordFile` |  |  |
| `menu` | `MenuEntry[] \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

## FilesList

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `files` * | `RecordFile[]` |  |  |
| `empty` | `string \| undefined` | `"Nenhum arquivo ainda."` |  |
| `rowMenu` | `((f: RecordFile) => MenuEntry[]) \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/registros-painel-lateral`):

```tsx
<div className="flex gap-4">
  <DataGrid … onRowOpen={(r) => setAberto(r.id)} />
  <RecordPanel open={!!aberto} title={r.titulo} onTitleChange={…} position="3 de 18"
    onPrev={…} onNext={…} onDelete={…} onClose={() => setAberto(null)}
    properties={<PropertyPills><PropertyPill … /></PropertyPills>}>
    <RecordSection title="Arquivos" action={<SectionAddButton onClick={…} />}><FilesList files={…} /></RecordSection>
    <RecordSection title="Notas do documento"><NotesTable columns={…} rows={…} /></RecordSection>
    <ActivitySection items={…} />
  </RecordPanel>
</div>
```

## NotesTable

Tabela pequena embutida (notas, critérios).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `columns` * | `string[]` |  |  |
| `rows` * | `ReactNode[][]` |  |  |
| `className` | `string \| undefined` |  |  |
| `maxRows` | `number \| undefined` | `3` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/registros-painel-lateral`):

```tsx
<div className="flex gap-4">
  <DataGrid … onRowOpen={(r) => setAberto(r.id)} />
  <RecordPanel open={!!aberto} title={r.titulo} onTitleChange={…} position="3 de 18"
    onPrev={…} onNext={…} onDelete={…} onClose={() => setAberto(null)}
    properties={<PropertyPills><PropertyPill … /></PropertyPills>}>
    <RecordSection title="Arquivos" action={<SectionAddButton onClick={…} />}><FilesList files={…} /></RecordSection>
    <RecordSection title="Notas do documento"><NotesTable columns={…} rows={…} /></RecordSection>
    <ActivitySection items={…} />
  </RecordPanel>
</div>
```

## PropertyPill

Pílula de propriedade (botão com menu).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `placeholder` * | `string` |  |  |
| `className` | `string \| undefined` |  |  |
| `icon` | `ReactNode` |  |  |
| `items` | `MenuEntry[] \| undefined` |  |  |
| `onClick` | `(() => void) \| undefined` |  |  |
| `value` | `ReactNode` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/registros-painel-lateral`):

```tsx
<div className="flex gap-4">
  <DataGrid … onRowOpen={(r) => setAberto(r.id)} />
  <RecordPanel open={!!aberto} title={r.titulo} onTitleChange={…} position="3 de 18"
    onPrev={…} onNext={…} onDelete={…} onClose={() => setAberto(null)}
    properties={<PropertyPills><PropertyPill … /></PropertyPills>}>
    <RecordSection title="Arquivos" action={<SectionAddButton onClick={…} />}><FilesList files={…} /></RecordSection>
    <RecordSection title="Notas do documento"><NotesTable columns={…} rows={…} /></RecordSection>
    <ActivitySection items={…} />
  </RecordPanel>
</div>
```

## PropertyPills

Linha de pílulas de propriedades (quebra em várias linhas).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `className` | `string \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/registros-painel-lateral`):

```tsx
<div className="flex gap-4">
  <DataGrid … onRowOpen={(r) => setAberto(r.id)} />
  <RecordPanel open={!!aberto} title={r.titulo} onTitleChange={…} position="3 de 18"
    onPrev={…} onNext={…} onDelete={…} onClose={() => setAberto(null)}
    properties={<PropertyPills><PropertyPill … /></PropertyPills>}>
    <RecordSection title="Arquivos" action={<SectionAddButton onClick={…} />}><FilesList files={…} /></RecordSection>
    <RecordSection title="Notas do documento"><NotesTable columns={…} rows={…} /></RecordSection>
    <ActivitySection items={…} />
  </RecordPanel>
</div>
```

## RecordFile (type)

```ts
type RecordFile = { id: string; name: string; kind: RecordFileKind; meta?: string; href?: string }
```

## RecordFileKind (type)

```ts
type RecordFileKind = "pdf" | "github" | "doc" | "sheet" | "image" | "link"
```

## RecordPanel

Painel do registro. Desktop: coluna à direita da lista (coloque-o ao lado do DataGrid).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `onClose` * | `() => void` |  |  |
| `open` * | `boolean` |  |  |
| `title` * | `string` |  |  |
| `children` | `ReactNode` |  |  |
| `className` | `string \| undefined` |  |  |
| `description` | `string \| undefined` |  |  |
| `onDelete` | `(() => void) \| undefined` |  |  |
| `onDescriptionChange` | `((v: string) => void) \| undefined` |  |  |
| `onNext` | `(() => void) \| undefined` |  |  |
| `onPrev` | `(() => void) \| undefined` |  |  |
| `onTitleChange` | `((v: string) => void) \| undefined` |  |  |
| `position` | `string \| undefined` |  |  |
| `properties` | `ReactNode` |  | Pílulas de propriedade (PropertyPills). |
| `width` | `number \| undefined` | `460` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/registros-painel-lateral`):

```tsx
<div className="flex gap-4">
  <DataGrid … onRowOpen={(r) => setAberto(r.id)} />
  <RecordPanel open={!!aberto} title={r.titulo} onTitleChange={…} position="3 de 18"
    onPrev={…} onNext={…} onDelete={…} onClose={() => setAberto(null)}
    properties={<PropertyPills><PropertyPill … /></PropertyPills>}>
    <RecordSection title="Arquivos" action={<SectionAddButton onClick={…} />}><FilesList files={…} /></RecordSection>
    <RecordSection title="Notas do documento"><NotesTable columns={…} rows={…} /></RecordSection>
    <ActivitySection items={…} />
  </RecordPanel>
</div>
```

## RecordSection

Seção do painel: título, ação à direita ("+ Adicionar", "Ver tudo", "Filtro").

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `title` * | `string` |  |  |
| `action` | `ReactNode` |  |  |
| `className` | `string \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/registros-painel-lateral`):

```tsx
<div className="flex gap-4">
  <DataGrid … onRowOpen={(r) => setAberto(r.id)} />
  <RecordPanel open={!!aberto} title={r.titulo} onTitleChange={…} position="3 de 18"
    onPrev={…} onNext={…} onDelete={…} onClose={() => setAberto(null)}
    properties={<PropertyPills><PropertyPill … /></PropertyPills>}>
    <RecordSection title="Arquivos" action={<SectionAddButton onClick={…} />}><FilesList files={…} /></RecordSection>
    <RecordSection title="Notas do documento"><NotesTable columns={…} rows={…} /></RecordSection>
    <ActivitySection items={…} />
  </RecordPanel>
</div>
```

## SectionAddButton

"+ Adicionar" no padrão das seções do painel.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` | `ReactNode` | `"Adicionar"` |  |
| `onClick` | `(() => void) \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/registros-painel-lateral`):

```tsx
<div className="flex gap-4">
  <DataGrid … onRowOpen={(r) => setAberto(r.id)} />
  <RecordPanel open={!!aberto} title={r.titulo} onTitleChange={…} position="3 de 18"
    onPrev={…} onNext={…} onDelete={…} onClose={() => setAberto(null)}
    properties={<PropertyPills><PropertyPill … /></PropertyPills>}>
    <RecordSection title="Arquivos" action={<SectionAddButton onClick={…} />}><FilesList files={…} /></RecordSection>
    <RecordSection title="Notas do documento"><NotesTable columns={…} rows={…} /></RecordSection>
    <ActivitySection items={…} />
  </RecordPanel>
</div>
```
