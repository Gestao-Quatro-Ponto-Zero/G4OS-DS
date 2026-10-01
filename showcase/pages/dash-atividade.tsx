import { Mail, MessageSquare, Phone, Plus } from "lucide-react";
import { ActivityFeed, Leaderboard, formatCurrency } from "@g4os/ds";
import { Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";

export const meta: PageMeta = {
  title: "Atividade e ranking",
  group: "Dashboards",
  order: 30,
  description: "ActivityFeed conta quem fez o quê em quê, quando (CRM, ATS, auditoria). Leaderboard ranqueia pessoas ou contas com barra proporcional e variação.",
};

const money = (n: number) => formatCurrency(n, { compact: true });

export default function Page() {
  return (
    <DocPage title={meta.title} kicker="Dashboards" description={meta.description}>
      <DocSection title="ActivityFeed" rule="Ator em negrito + verbo + objeto em negrito. Citação (quote) para notas e comentários. Ícone no canto do avatar indica o canal.">
        <Demo
          className="block max-w-[640px]"
          code={`<ActivityFeed items={[
  { id: "1", actor: { name: "Ana Lopes", initials: "AL" }, action: "moveu para", target: "Negociação", time: "Hoje, 09:14" },
  { id: "2", actor: { name: "Ana Lopes", initials: "AL" }, action: "registrou uma ligação com", target: "Renata Farias",
    time: "Ontem, 16:40 · 22 min", icon: <Phone />, quote: "Jurídico pediu SLA de 99,9 %…" },
]} />`}
        >
          <ActivityFeed
            items={[
              { id: "1", actor: { name: "Ana Lopes", initials: "AL" }, action: "moveu o negócio para", target: "Negociação", time: "Hoje, 09:14", icon: <Plus /> },
              {
                id: "2",
                actor: { name: "Ana Lopes", initials: "AL" },
                action: "registrou uma ligação com",
                target: "Renata Farias",
                time: "Ontem, 16:40 · 22 min",
                icon: <Phone />,
                quote: "Jurídico pediu SLA de 99,9 % e multa por indisponibilidade. Diretoria aprova até R$ 480 mil.",
              },
              { id: "3", actor: { name: "Renata Farias", initials: "RF", tint: "#842e20" }, action: "abriu a proposta", target: "Proposta v3.pdf", time: "Ontem, 11:02", icon: <Mail /> },
              { id: "4", actor: { name: "Juliana Rocha", initials: "JR" }, action: "comentou em", target: "Larissa Mendes", time: "26 set", icon: <MessageSquare />, quote: "Ótima no case. Aprofundar liderança na final." },
            ]}
          />
        </Demo>
        <PropsTable
          rows={[
            ["items[].actor", "{ name, initials, tint? }", "—", "Quem fez."],
            ["items[].action · target", "ReactNode", "—", "Verbo e objeto: “moveu para” + “Negociação”."],
            ["items[].time", "string", "—", "Relativo até 7 dias (formatRelative), data depois."],
            ["items[].quote", "ReactNode", "—", "Trecho de nota, e-mail ou comentário."],
            ["items[].icon", "ReactNode", "—", "Canal ou tipo (Phone, Mail, MessageSquare…)."],
          ]}
        />
      </DocSection>

      <DocSection title="Leaderboard" rule="Top 3 com número dourado. showBar desenha a barra proporcional ao maior valor; sem ela, sub vira a segunda linha.">
        <Demo
          className="block max-w-[520px]"
          code={`<Leaderboard format={money} rows={[
  { id: "1", name: "Ana Lopes", initials: "AL", value: 1480000, delta: 0.18 },
  { id: "2", name: "Diego Araújo", initials: "DA", value: 1210000, delta: 0.06 },
  …
]} />`}
        >
          <Leaderboard
            format={money}
            rows={[
              { id: "1", name: "Ana Lopes", initials: "AL", value: 1_480_000, delta: 0.18 },
              { id: "2", name: "Diego Araújo", initials: "DA", value: 1_210_000, delta: 0.06 },
              { id: "3", name: "Carla Nogueira", initials: "CN", value: 980_000, delta: -0.04 },
              { id: "4", name: "Bruno Takeda", initials: "BT", value: 760_000, delta: 0.11 },
            ]}
          />
        </Demo>
        <Demo
          className="block max-w-[520px]"
          title="Sem barra, com subtítulo e goodWhen=down"
          code={`<Leaderboard showBar={false} goodWhen="down" format={(n) => \`\${n} dias\`} rows={[…]} />`}
        >
          <Leaderboard
            showBar={false}
            goodWhen="down"
            format={(n) => `${n} dias`}
            rows={[
              { id: "1", name: "Juliana Rocha", initials: "JR", value: 24, sub: "Tech recruiter · 9 vagas", delta: -0.14 },
              { id: "2", name: "Thiago Almeida", initials: "TA", value: 31, sub: "Comercial · 6 vagas", delta: 0.05 },
              { id: "3", name: "Camila Siqueira", initials: "CS", value: 36, sub: "Produto · 4 vagas", delta: -0.02 },
            ]}
          />
        </Demo>
      </DocSection>

      <DocSection title="Regras">
        <Rules
          items={[
            { do: "Feed em ordem do mais recente para o mais antigo, com o verbo no passado.", dont: "Mensagens de sistema genéricas (“Registro atualizado”) sem dizer o quê." },
            { do: "Ranking com o critério escrito no ChartCard (“receita fechada no trimestre”).", dont: "Ranking de pessoas em tela pública sem combinar com o time." },
          ]}
        />
      </DocSection>
    </DocPage>
  );
}
