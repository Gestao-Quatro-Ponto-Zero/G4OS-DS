import { useState } from "react";
import { BadgeCheck, ChevronRight, FileText, Plug, ShieldCheck } from "lucide-react";
import {
  Badge,
  Button,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
  Switch,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
  formatCurrency,
} from "@g4ai/ds";
import { Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";

export const meta: PageMeta = {
  title: "Item e tabela simples",
  group: "Ações e exibição",
  order: 31,
  description: "Item monta linhas de conteúdo (mídia · título e descrição · ações) para configurações, integrações e listas curtas. Table é a tabela estática para comparativos e resumos.",
};

const fatura = [
  { item: "Plano Business · 25 assentos", qtd: 25, unit: 89 },
  { item: "Assentos adicionais", qtd: 5, unit: 89 },
  { item: "Agente de IA · pacote 10 mil execuções", qtd: 1, unit: 490 },
  { item: "Suporte prioritário", qtd: 1, unit: 350 },
];

export default function Page() {
  const [slack, setSlack] = useState(true);
  const [sso, setSso] = useState(false);
  const total = fatura.reduce((n, l) => n + l.qtd * l.unit, 0);
  return (
    <DocPage title={meta.title} description={meta.description} kicker={meta.group}>
      <DocSection title="Item" rule="Linha genérica: ItemMedia (ícone, avatar ou imagem) · ItemContent (ItemTitle + ItemDescription) · ItemActions. Agrupe com ItemGroup (uma borda, divisórias). Para listas de registros com contexto e meta, ListRow já resolve.">
        <Demo
          className="grid gap-6 lg:grid-cols-2"
          code={`<ItemGroup label="Integrações">
  <Item>
    <ItemMedia variant="icon"><Plug /></ItemMedia>
    <ItemContent>
      <ItemTitle>Slack</ItemTitle>
      <ItemDescription>Avisos de negócio ganho e tarefas vencendo no canal do time.</ItemDescription>
    </ItemContent>
    <ItemActions><Switch label="Ativar Slack" hideLabel checked={slack} onCheckedChange={setSlack} /></ItemActions>
  </Item>
</ItemGroup>

<Item variant="outline" href="/contratos/123">…</Item>`}
        >
          <ItemGroup label="Integrações">
            <Item>
              <ItemMedia variant="icon">
                <Plug />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>Slack</ItemTitle>
                <ItemDescription>Avisos de negócio ganho e tarefas vencendo no canal do time.</ItemDescription>
              </ItemContent>
              <ItemActions>
                <Switch label="Ativar Slack" hideLabel checked={slack} onCheckedChange={setSlack} />
              </ItemActions>
            </Item>
            <Item>
              <ItemMedia variant="icon">
                <ShieldCheck />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>
                  Login único (SSO) <Badge>Enterprise</Badge>
                </ItemTitle>
                <ItemDescription>Entrada pelo Google Workspace ou Microsoft Entra.</ItemDescription>
              </ItemContent>
              <ItemActions>
                <Switch label="Ativar SSO" hideLabel checked={sso} onCheckedChange={setSso} />
              </ItemActions>
            </Item>
            <Item>
              <ItemMedia variant="icon">
                <BadgeCheck />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>Domínio verificado</ItemTitle>
                <ItemDescription>empresa.com.br · verificado em 12/08/2026</ItemDescription>
              </ItemContent>
              <ItemActions>
                <Button variant="ghost" size="sm">
                  Gerenciar
                </Button>
              </ItemActions>
            </Item>
          </ItemGroup>
          <div className="space-y-3">
            <Item variant="outline" href="#/p/estrutura-item-e-tabela">
              <ItemMedia variant="icon">
                <FileText />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>Contrato · Rede Horizonte</ItemTitle>
                <ItemDescription>Aguardando assinatura do cliente desde 28/09.</ItemDescription>
              </ItemContent>
              <ChevronRight aria-hidden className="h-4 w-4 shrink-0 text-muted" />
            </Item>
            <Item variant="muted" size="sm">
              <ItemContent>
                <ItemTitle>Exportação agendada</ItemTitle>
                <ItemDescription>Todo dia 1º às 08:00 para financeiro@empresa.com.br</ItemDescription>
              </ItemContent>
              <ItemActions>
                <Button variant="quiet" size="sm">
                  Editar
                </Button>
              </ItemActions>
            </Item>
          </div>
        </Demo>
      </DocSection>

      <DocSection title="Table" rule="Tabela estática: resumo de fatura, comparativo de planos, especificação. Mesmo visual da DataTable. Ordenar, selecionar, paginar ou filtrar? DataTable. Colunas numéricas com numeric (direita + tabular-nums) e valores pelo lib/format.">
        <Demo
          code={`<Table>
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
</Table>`}
        >
          <Table>
            <TableCaption>Valores mensais. Impostos inclusos.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead numeric>Qtd.</TableHead>
                <TableHead numeric>Unitário</TableHead>
                <TableHead numeric>Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fatura.map((l) => (
                <TableRow key={l.item}>
                  <TableCell>{l.item}</TableCell>
                  <TableCell numeric>{l.qtd}</TableCell>
                  <TableCell numeric>{formatCurrency(l.unit)}</TableCell>
                  <TableCell numeric>{formatCurrency(l.qtd * l.unit)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={3}>Total do mês</TableCell>
                <TableCell numeric>{formatCurrency(total)}</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </Demo>
      </DocSection>

      <DocSection title="Regras">
        <Rules
          items={[
            { do: "Item para listas curtas e configurações; ações à direita, uma principal no máximo.", dont: "Botões dentro de um Item com href (link dentro de link)." },
            { do: "Table para dados fixos e pequenos, com legenda (TableCaption) ou label.", dont: "Table para coleções de registros: perde ordenação, seleção, estados e cartões no celular da DataTable." },
          ]}
        />
      </DocSection>

      <DocSection title="Props">
        <PropsTable
          rows={[
            ["Item · variant", '"default" | "outline" | "muted"', '"default"', "default dentro de ItemGroup/Card; outline solto; muted em gelo."],
            ["Item · size", '"sm" | "md"', '"md"', "Padding."],
            ["Item · href", "string", "—", "Item inteiro vira link (DsLink)."],
            ["ItemMedia · variant", '"default" | "icon" | "image"', '"default"', "icon = quadrado gelo; image = miniatura 40 px."],
            ["TableHead / TableCell · numeric", "boolean", "false", "Alinha à direita com tabular-nums."],
            ["TableRow · selected", "boolean", "false", "Destaca a linha."],
          ]}
        />
      </DocSection>
    </DocPage>
  );
}
