# states

Arquivo: `src/components/states.tsx` · importe de `@g4os/ds`.

Estados de tela e avisos: StateView e presets (404, erro, sem acesso, offline), Spinner, LoadingState, Banner, InlineMessage, AlertCard, notifyPromise.

## AlertCard

Aviso com lista de problemas e ações (importação com linhas inválidas, formulário com vários erros, checklist de pendências).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `title` * | `string` |  |  |
| `actions` | `ReactNode` |  |  |
| `className` | `string \| undefined` |  |  |
| `description` | `ReactNode` |  |  |
| `items` | `{ id: string; label: ReactNode; hint?: ReactNode; action?: ReactNode; }[] \| undefined` |  |  |
| `onDismiss` | `(() => void) \| undefined` |  |  |
| `tone` | `"ok" \| "warn" \| "bad" \| "info" \| undefined` | `"warn"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/fb-avisos`):

```tsx
<AlertCard
  tone="warn"
  title="4 linhas não foram importadas"
  description="Corrija e reenvie só estas linhas; as outras 1.200 já estão no CRM."
  items={[{ id: "12", label: "Linha 12 · e-mail inválido", action: <button>Corrigir</button> }, …]}
  actions={<><Button variant="ghost" size="sm">Baixar CSV</Button><Button size="sm">Revisar tudo</Button></>}
/>
```

## Banner

Faixa de anúncio no topo de uma página ou do app (período de teste acabando, fatura atrasada, novidade).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `action` | `ReactNode` |  |  |
| `children` | `ReactNode` |  |  |
| `className` | `string \| undefined` |  |  |
| `icon` | `ReactNode` |  |  |
| `onDismiss` | `(() => void) \| undefined` |  |  |
| `title` | `ReactNode` |  |  |
| `tone` | `BannerTone \| undefined` | `"info"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/fb-avisos`):

```tsx
<Banner tone="warn" title="Sua fatura de setembro está em aberto." action={<a href="/cobranca">Pagar agora</a>}>
  O acesso será limitado em 5 dias.
</Banner>
<Banner tone="accent" title="Novo: previsão de receita." action={<a href="/novidades">Conhecer</a>} onDismiss={fechar}>
  Veja o forecast do trimestre direto no pipeline.
</Banner>
```

## CountBadge

Contador de atenção (não lidas, pendências).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `count` * | `number` |  |  |
| `className` | `string \| undefined` |  |  |
| `label` | `string \| undefined` |  |  |
| `max` | `number \| undefined` | `99` |  |
| `tone` | `"neutral" \| "bad" \| "accent" \| "ink" \| undefined` | `"neutral"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/fb-avisos`):

```tsx
<CountBadge count={3} />
<CountBadge count={128} tone="ink" />
<span className="relative"><Bell /><NotificationDot pulse /></span>
```

## ErrorState

Falha ao carregar. Mostra o código e, recolhidos, os detalhes técnicos (para copiar e mandar ao suporte).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `action` | `ReactNode` |  |  |
| `children` | `ReactNode` |  | Conteúdo extra abaixo das ações (detalhes técnicos, links). |
| `className` | `string \| undefined` |  |  |
| `code` | `string \| undefined` |  | Código curto acima do título: "404", "500". |
| `description` | `ReactNode` |  |  |
| `details` | `string \| undefined` |  |  |
| `illustration` | `ReactNode` |  | Substitui o ícone por uma ilustração/imagem própria. |
| `onRetry` | `(() => void) \| undefined` |  |  |
| `retryLabel` | `string \| undefined` | `"Tentar novamente"` |  |
| `secondaryAction` | `ReactNode` |  |  |
| `size` | `"sm" \| "md" \| "page" \| undefined` |  | `page` centraliza na altura toda; `md` para painel; `sm` para card. |
| `title` | `string \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/fb-estados-tela`):

```tsx
<NotFoundState action={<Button href="/">Voltar ao início</Button>} />
<ErrorState onRetry={recarregar} details={erro.stack} />
<ForbiddenState action={<Button>Pedir acesso</Button>} />
<OfflineState />
<MaintenanceState until="14h (horário de Brasília)" />
<SuccessState title="Importação concluída" description="1.204 contatos importados." />
```

## ForbiddenState

Sem permissão. Diga quem pode dar acesso.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `action` | `ReactNode` |  |  |
| `children` | `ReactNode` |  | Conteúdo extra abaixo das ações (detalhes técnicos, links). |
| `className` | `string \| undefined` |  |  |
| `code` | `string \| undefined` |  | Código curto acima do título: "404", "500". |
| `description` | `ReactNode` |  |  |
| `illustration` | `ReactNode` |  | Substitui o ícone por uma ilustração/imagem própria. |
| `secondaryAction` | `ReactNode` |  |  |
| `size` | `"sm" \| "md" \| "page" \| undefined` |  | `page` centraliza na altura toda; `md` para painel; `sm` para card. |
| `title` | `string \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/fb-estados-tela`):

```tsx
<NotFoundState action={<Button href="/">Voltar ao início</Button>} />
<ErrorState onRetry={recarregar} details={erro.stack} />
<ForbiddenState action={<Button>Pedir acesso</Button>} />
<OfflineState />
<MaintenanceState until="14h (horário de Brasília)" />
<SuccessState title="Importação concluída" description="1.204 contatos importados." />
```

## InlineMessage

Status curto em linha: "Salvo há 2 min", "3 campos com erro", "Sincronizando…".

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `busy` | `boolean \| undefined` |  |  |
| `className` | `string \| undefined` |  |  |
| `tone` | `"neutral" \| "ok" \| "warn" \| "bad" \| "info" \| undefined` | `"neutral"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/fb-avisos`):

```tsx
<InlineMessage tone="ok">Salvo há 2 min</InlineMessage>
<InlineMessage busy>Sincronizando…</InlineMessage>
```

## LoadingOverlay

Véu sobre um card/tabela enquanto recarrega (filtro trocado, página nova): mantém o conteúdo anterior visível e indica a espera.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `show` * | `boolean` |  |  |
| `label` | `string \| undefined` | `"Atualizando…"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/fb-carregando`):

```tsx
<div className="relative">
  <DataTable rows={rows} columns={cols} rowKey={(r) => r.id} />
  <LoadingOverlay show={isFetching} />
</div>
```

## LoadingState

Spinner + frase do que está acontecendo ("Carregando faturas…").

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `className` | `string \| undefined` |  |  |
| `hint` | `ReactNode` |  |  |
| `label` | `string \| undefined` | `"Carregando…"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/fb-carregando`):

```tsx
<Spinner size="xs" /> <Spinner size="sm" /> <Spinner /> <Spinner size="lg" />
<LoadingState label="Gerando relatório…" hint="Costuma levar uns 20 segundos." />
```

## MaintenanceState

Manutenção programada.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `action` | `ReactNode` |  |  |
| `children` | `ReactNode` |  | Conteúdo extra abaixo das ações (detalhes técnicos, links). |
| `className` | `string \| undefined` |  |  |
| `code` | `string \| undefined` |  | Código curto acima do título: "404", "500". |
| `description` | `ReactNode` |  |  |
| `illustration` | `ReactNode` |  | Substitui o ícone por uma ilustração/imagem própria. |
| `secondaryAction` | `ReactNode` |  |  |
| `size` | `"sm" \| "md" \| "page" \| undefined` |  | `page` centraliza na altura toda; `md` para painel; `sm` para card. |
| `title` | `string \| undefined` |  |  |
| `until` | `string \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/fb-estados-tela`):

```tsx
<NotFoundState action={<Button href="/">Voltar ao início</Button>} />
<ErrorState onRetry={recarregar} details={erro.stack} />
<ForbiddenState action={<Button>Pedir acesso</Button>} />
<OfflineState />
<MaintenanceState until="14h (horário de Brasília)" />
<SuccessState title="Importação concluída" description="1.204 contatos importados." />
```

## NotFoundState

Página ou registro que não existe (link quebrado, registro excluído).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `action` | `ReactNode` |  |  |
| `children` | `ReactNode` |  | Conteúdo extra abaixo das ações (detalhes técnicos, links). |
| `className` | `string \| undefined` |  |  |
| `code` | `string \| undefined` |  | Código curto acima do título: "404", "500". |
| `description` | `ReactNode` |  |  |
| `illustration` | `ReactNode` |  | Substitui o ícone por uma ilustração/imagem própria. |
| `secondaryAction` | `ReactNode` |  |  |
| `size` | `"sm" \| "md" \| "page" \| undefined` |  | `page` centraliza na altura toda; `md` para painel; `sm` para card. |
| `title` | `string \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/fb-estados-tela`):

```tsx
<NotFoundState action={<Button href="/">Voltar ao início</Button>} />
<ErrorState onRetry={recarregar} details={erro.stack} />
<ForbiddenState action={<Button>Pedir acesso</Button>} />
<OfflineState />
<MaintenanceState until="14h (horário de Brasília)" />
<SuccessState title="Importação concluída" description="1.204 contatos importados." />
```

## NotificationDot

Ponto de notificação sobre um ícone (sino, avatar).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `className` | `string \| undefined` |  |  |
| `pulse` | `boolean \| undefined` | `false` |  |
| `tone` | `"ok" \| "bad" \| "accent" \| undefined` | `"bad"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/fb-avisos`):

```tsx
<CountBadge count={3} />
<CountBadge count={128} tone="ink" />
<span className="relative"><Bell /><NotificationDot pulse /></span>
```

## notifyPromise (function)

Acompanha uma operação demorada em toast: "Exportando…" → "Relatório exportado" (ou erro).

```ts
notifyPromise(promise, messages): Promise<T>
```

Exemplo (showcase `#/p/fb-toasts`):

```tsx
await notifyPromise(exportar(), {
  loading: "Exportando relatório…",
  success: (r) => `Relatório exportado (${r.linhas} linhas)`,
  error: "Não foi possível exportar. Tente de novo.",
});
```

## OfflineState

Sem conexão. O app tenta de novo sozinho; diga isso.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `action` | `ReactNode` |  |  |
| `children` | `ReactNode` |  | Conteúdo extra abaixo das ações (detalhes técnicos, links). |
| `className` | `string \| undefined` |  |  |
| `code` | `string \| undefined` |  | Código curto acima do título: "404", "500". |
| `description` | `ReactNode` |  |  |
| `illustration` | `ReactNode` |  | Substitui o ícone por uma ilustração/imagem própria. |
| `secondaryAction` | `ReactNode` |  |  |
| `size` | `"sm" \| "md" \| "page" \| undefined` |  | `page` centraliza na altura toda; `md` para painel; `sm` para card. |
| `title` | `string \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/fb-estados-tela`):

```tsx
<NotFoundState action={<Button href="/">Voltar ao início</Button>} />
<ErrorState onRetry={recarregar} details={erro.stack} />
<ForbiddenState action={<Button>Pedir acesso</Button>} />
<OfflineState />
<MaintenanceState until="14h (horário de Brasília)" />
<SuccessState title="Importação concluída" description="1.204 contatos importados." />
```

## Spinner

Indicador de espera indeterminada.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `className` | `string \| undefined` |  |  |
| `label` | `string \| undefined` | `"Carregando"` |  |
| `size` | `"sm" \| "md" \| "lg" \| "xs" \| undefined` | `"md"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/fb-carregando`):

```tsx
<Spinner size="xs" /> <Spinner size="sm" /> <Spinner /> <Spinner size="lg" />
<LoadingState label="Gerando relatório…" hint="Costuma levar uns 20 segundos." />
```

## StateView

Estado que ocupa uma área inteira (página, painel, card grande).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `title` * | `string` |  |  |
| `action` | `ReactNode` |  |  |
| `children` | `ReactNode` |  | Conteúdo extra abaixo das ações (detalhes técnicos, links). |
| `className` | `string \| undefined` |  |  |
| `code` | `string \| undefined` |  | Código curto acima do título: "404", "500". |
| `description` | `ReactNode` |  |  |
| `icon` | `ReactNode` |  |  |
| `illustration` | `ReactNode` |  | Substitui o ícone por uma ilustração/imagem própria. |
| `secondaryAction` | `ReactNode` |  |  |
| `size` | `"sm" \| "md" \| "page" \| undefined` | `"md"` | `page` centraliza na altura toda; `md` para painel; `sm` para card. |
| `tone` | `StateTone \| undefined` | `"neutral"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/fb-estados-tela`):

```tsx
<StateView size="sm" tone="warn" … />
```

## SuccessState

Conclusão de um fluxo longo (importação, onboarding, pagamento).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `action` | `ReactNode` |  |  |
| `children` | `ReactNode` |  | Conteúdo extra abaixo das ações (detalhes técnicos, links). |
| `className` | `string \| undefined` |  |  |
| `code` | `string \| undefined` |  | Código curto acima do título: "404", "500". |
| `description` | `ReactNode` |  |  |
| `illustration` | `ReactNode` |  | Substitui o ícone por uma ilustração/imagem própria. |
| `secondaryAction` | `ReactNode` |  |  |
| `size` | `"sm" \| "md" \| "page" \| undefined` |  | `page` centraliza na altura toda; `md` para painel; `sm` para card. |
| `title` | `string \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/fb-estados-tela`):

```tsx
<NotFoundState action={<Button href="/">Voltar ao início</Button>} />
<ErrorState onRetry={recarregar} details={erro.stack} />
<ForbiddenState action={<Button>Pedir acesso</Button>} />
<OfflineState />
<MaintenanceState until="14h (horário de Brasília)" />
<SuccessState title="Importação concluída" description="1.204 contatos importados." />
```
