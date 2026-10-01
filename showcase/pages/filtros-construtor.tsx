import { useState } from "react";
import { ActiveFilterChip, AddFilterMenu, Button, ConditionEditor, FilterSheet, QuickFilter, filterOperators, useFilters, type FilterCondition, type FilterType } from "@g4ai/ds";
import { Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";
import { dealFields, dealSearch, deals, me, now } from "./_filtros-data";

export const meta: PageMeta = {
  title: "Construtor de filtros",
  group: "Filtros e busca",
  order: 10,
  description: "As peças da FilterBar, para montar variações: + Filtro, atalho de faceta, chip ativo, editor de condição e painel completo. Operadores por tipo de campo.",
};

const types: [FilterType, string][] = [
  ["text", "Texto (nome, cidade, observação)"],
  ["number", "Número (quantidade, dias, %)"],
  ["currency", "Valor em R$"],
  ["date", "Data"],
  ["enum", "Lista fixa (etapa, status, plano)"],
  ["person", "Pessoa (responsável, atendente)"],
  ["boolean", "Sim/não"],
];

export default function Page() {
  const filters = useFilters(deals, {
    fields: dealFields,
    search: dealSearch,
    me,
    now,
    initial: {
      query: "",
      conditions: [
        { id: "x1", field: "value", op: "between", value: [50000, 250000] },
        { id: "x2", field: "priority", op: "is", value: ["Alta", "Média"] },
        { id: "x3", field: "closes", op: "last30" },
      ],
    },
  });
  const [cond, setCond] = useState<FilterCondition>({ id: "c", field: "value", op: "gt", value: 100000 });
  const [sheet, setSheet] = useState(false);
  return (
    <DocPage title={meta.title} kicker="Filtros e busca" description={meta.description}>
      <DocSection title="Peças" rule="Todas recebem o mesmo objeto `filters` (useFilters). Use a FilterBar pronta; monte à mão só quando o layout pedir (ex.: filtros numa lateral).">
        <Demo
          title="+ Filtro · atalhos · chips"
          className="flex flex-wrap items-center gap-2"
          code={`<QuickFilter filters={filters} field={fields[0]} />     // Etapa ▾
<AddFilterMenu filters={filters} />                       // + Filtro: campo → operador → valor
{filters.active.map((c) => <ActiveFilterChip key={c.id} filters={filters} condition={c} />)}
<FilterSheet filters={filters} open={open} onClose={…} /> // todos os campos, “Aplicar (N)”`}
        >
          <QuickFilter filters={filters} field={dealFields[1]} />
          <AddFilterMenu filters={filters} />
          {filters.active
            .filter((c) => c.field !== "owner")
            .map((c) => (
              <ActiveFilterChip key={c.id} filters={filters} condition={c} />
            ))}
          <Button variant="ghost" size="sm" onClick={() => setSheet(true)}>
            Abrir painel completo
          </Button>
          <span className="ml-auto text-[12px] tabular-nums text-muted">{filters.shown} de {filters.total}</span>
          <FilterSheet filters={filters} open={sheet} onClose={() => setSheet(false)} noun="negócio" />
        </Demo>
        <Demo title="Editor de condição" description="O mesmo editor serve o + Filtro, o chip e o painel." className="block max-w-[340px]" code={`<ConditionEditor field={valorField} value={cond} onChange={setCond} />`}>
          <ConditionEditor field={dealFields[2]} value={cond} onChange={setCond} autoFocus={false} />
          <p className="m-0 mt-3 font-mono text-[11.5px] text-muted">{JSON.stringify({ op: cond.op, value: cond.value })}</p>
        </Demo>
      </DocSection>

      <DocSection title="Operadores por tipo" rule="A ordem é a de uso mais comum; o primeiro é o padrão ao escolher o campo. Operadores sem valor (“é hoje”, “sou eu”, “está vazio”) aplicam direto.">
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full text-left text-[13px]">
            <thead className="border-b border-line bg-soft/60 text-[12px] text-muted">
              <tr>
                <th className="px-4 py-2.5">Tipo</th>
                <th className="px-4 py-2.5">Operadores</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {types.map(([t, label]) => (
                <tr key={t}>
                  <td className="px-4 py-2.5 align-top">
                    <code className="font-mono text-[12px] text-blue">{t}</code>
                    <span className="block text-[12px] text-muted">{label}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex flex-wrap gap-1.5">
                      {filterOperators(t).map((o) => (
                        <span key={o.op} className="rounded-md bg-soft px-2 py-0.5 text-[12px] ring-1 ring-line">
                          {o.label}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DocSection>

      <DocSection title="API">
        <p className="m-0 text-[13px] font-medium">FilterField&lt;T&gt;</p>
        <PropsTable
          rows={[
            ["key", "string", "—", "Identificador (vai para a URL)."],
            ["label", "string", "—", "Nome visível do campo."],
            ["type", '"text" | "number" | "currency" | "date" | "enum" | "person" | "boolean"', "—", "Define operadores e editor de valor."],
            ["accessor", "(row: T) => unknown", "—", "Valor na linha. enum/person aceitam string ou string[]."],
            ["options", "{ value, label, icon?, hint? }[]", "—", "Para enum/person. hint = contagem ao lado da opção."],
            ["quick", "boolean", "false", "Vira atalho de faceta na barra (enum/person)."],
            ["icon · unit", "ReactNode · string", "—", "Ícone no menu/chip; unidade no chip de número (“dias”)."],
          ]}
        />
        <p className="m-0 text-[13px] font-medium">useFilters(rows, options) → filters</p>
        <PropsTable
          rows={[
            ["options.fields", "FilterField<T>[]", "—", "Campos filtráveis."],
            ["options.search", "(row) => string[]", "—", "Textos da busca livre (todas as palavras em E, sem acento)."],
            ["options.me · now", "string · Date", "—", "Pessoa atual (“sou eu”) e data de referência (“hoje”)."],
            ["options.url", "boolean | string", "false", "Sincroniza com ?q=&f=. String = prefixo."],
            ["options.initial", "FilterState", "vazio", "Recorte inicial (ex.: visão padrão)."],
            ["filters.rows · shown · total", "T[] · number · number", "", "Resultado e contagens."],
            ["filters.add · update · remove · clear · removeLast", "", "", "Mexem nas condições."],
            ["filters.setQuery · setFacet · countFor", "", "", "Busca, faceta rápida, prévia de contagem para um estado."],
          ]}
        />
      </DocSection>

      <DocSection title="Regras">
        <Rules
          items={[
            { do: "Rótulo do campo igual ao cabeçalho da coluna.", dont: "Coluna “Fechamento”, filtro “Data prevista de conclusão”." },
            { do: "Valor em R$ com prefixo e formatação no chip (“> R$ 100 mil”).", dont: "“value gt 100000”." },
            { do: "Faixa com limite aberto: só “de” vira “≥”, só “até” vira “≤”.", dont: "Obrigar os dois lados." },
          ]}
        />
      </DocSection>
    </DocPage>
  );
}
