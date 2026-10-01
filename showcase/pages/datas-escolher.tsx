import { DocPage, DocSection, Rules, type PageMeta } from "../kit";

export const meta: PageMeta = {
  title: "Datas: qual usar",
  group: "Formulários",
  order: 40,
  description: "Um seletor para cada pergunta. Todos digitáveis, todos em pt-BR, semana começando na segunda, feriados nacionais marcados e sem dependência externa.",
};

const rows: [string, string, string][] = [
  ["Uma data num formulário (nascimento, emissão, início)", "DateInput", "Digita dd/mm/aaaa ou “sexta”, “em 3 dias”; calendário no ícone."],
  ["Uma data a partir de um botão (filtro, célula de tabela)", "DatePicker", "Botão que abre o calendário. Compatível com a versão anterior."],
  ["Recorte de relatório ou dashboard", "DateRangePicker", "Presets, dois meses, comparação com período anterior/ano anterior, dias úteis."],
  ["Vários dias soltos (folgas, turmas, entregas)", "MultiDatePicker", "Chips removíveis, limite opcional."],
  ["Uma semana (escala, relatório semanal)", "WeekPicker", "Valor = segunda-feira; mostra o número da semana ISO."],
  ["Competência, fechamento, fatura", "MonthPicker", "Grade de 12 meses; `range` para intervalo de meses."],
  ["Metas e OKRs", "QuarterPicker", "“3º tri · jul–set”."],
  ["Exercício, safra, coorte anual", "YearPicker", "Grade de 12 anos."],
  ["Horário (sem data)", "TimePicker", "Digitável (“9h30”, “1430”) + lista a cada 5–60 min; horário comercial em destaque."],
  ["Data + horário de um compromisso", "DateTimePicker", "DateInput + TimePicker + fuso explícito."],
  ["Prazo de tarefa, documento, SLA", "DueDatePicker", "Atalhos reais (5 dias úteis, próxima segunda) e leitura “vence em 3 dias úteis”."],
  ["Marcar entrevista/reunião em horários livres", "SlotPicker", "Dias com disponibilidade + horários; duração e fuso."],
  ["Ver a agenda do mês", "MonthCalendar / MiniAgenda", "Chips por dia, “+N mais”; no celular vira lista."],
  ["Mostrar quando algo aconteceu", "RelativeTime / DateBadge", "“há 5 min” com data exata no title; folhinha para listas."],
];

export default function Page() {
  return (
    <DocPage title={meta.title} kicker="Formulários · Datas" description={meta.description}>
      <DocSection title="Da pergunta ao componente">
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[640px] text-left text-[13px]">
            <thead className="border-b border-line bg-soft/60 text-[12px] text-muted">
              <tr>
                <th className="px-4 py-2.5">Caso</th>
                <th className="px-4 py-2.5">Componente</th>
                <th className="px-4 py-2.5">Por quê</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map(([c, k, w]) => (
                <tr key={c}>
                  <td className="px-4 py-2.5 font-medium">{c}</td>
                  <td className="px-4 py-2.5 font-mono text-[12px] text-blue">{k}</td>
                  <td className="px-4 py-2.5 text-ink-soft">{w}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DocSection>
      <DocSection title="Formato dos valores" rule="Nunca Date com hora para algo que é só dia: o fuso muda o dia. Tudo é string.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Data", '"2026-09-30"'],
            ["Horário", '"14:30"'],
            ["Data + hora", '"2026-09-30T14:30"'],
            ["Período", '{ from, to, preset?, compare?, compareRange? }'],
            ["Mês", '"2026-09"'],
            ["Trimestre", '"2026-T3"'],
            ["Ano", '"2026"'],
            ["Semana", '"2026-09-28" (segunda)'],
          ].map(([l, v]) => (
            <div key={l} className="rounded-xl border border-line bg-surface px-4 py-3">
              <div className="text-[12px] text-muted">{l}</div>
              <code className="mt-1 block font-mono text-[12.5px]">{v}</code>
            </div>
          ))}
        </div>
      </DocSection>
      <DocSection title="Regras">
        <Rules
          items={[
            { do: "Deixe digitar. Quem sabe a data (nascimento, emissão) digita mais rápido do que navega no calendário.", dont: "Obrigar a clicar mês a mês até 1987." },
            { do: "Mostre o que foi entendido: “sexta, 03/10/2026”. O dia da semana evita o erro mais comum.", dont: "Aceitar “03/10” em silêncio sem dizer o ano." },
            { do: "Diga se o prazo é em dias corridos ou úteis, e marque feriados.", dont: "“Prazo: 5 dias” sem dizer quais dias contam." },
            { do: "Em relatórios, presets primeiro; intervalo livre depois; comparação opcional e explícita.", dont: "Dois campos “De/Até” soltos como única opção." },
            { do: "Horário em 24h e fuso explícito quando há pessoas em cidades diferentes.", dont: "AM/PM ou horário sem fuso num agendamento." },
            { do: "Semana começa na segunda; cabeçalho S T Q Q S S D.", dont: "Calendário americano começando no domingo." },
          ]}
        />
      </DocSection>
    </DocPage>
  );
}
