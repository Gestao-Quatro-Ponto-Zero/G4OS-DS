import { AlignCenter, AlignLeft, AlignRight, Briefcase, Building2, Rocket, User } from "lucide-react";
import { useState } from "react";
import { ChoiceCards, RadioGroup, Slider, ToggleGroup, formatCurrency } from "@g4ai/ds";
import { Demo, DocPage, DocSection, Rules, type PageMeta } from "../kit";

export const meta: PageMeta = { title: "Escolha e faixa", group: "Formulários", order: 24, description: "RadioGroup, ChoiceCards, ToggleGroup e Slider (valor único ou intervalo)." };

type Plan = "starter" | "growth" | "scale";
type Mode = "clt" | "pj" | "estagio";
type Day = "seg" | "ter" | "qua" | "qui" | "sex";

export default function Page() {
  const [mode, setMode] = useState<Mode | null>("clt");
  const [plan, setPlan] = useState<Plan | null>("growth");
  const [mods, setMods] = useState<string[]>(["crm"]);
  const [align, setAlign] = useState<"l" | "c" | "r" | null>("l");
  const [days, setDays] = useState<Day[]>(["seg", "qua", "sex"]);
  const [prob, setProb] = useState(60);
  const [range, setRange] = useState<[number, number]>([8000, 15000]);
  return (
    <DocPage title={meta.title} description={meta.description} kicker={meta.group}>
      <DocSection title="Qual usar" rule="2–6 opções sempre visíveis → RadioGroup. Opção que merece explicação, preço ou ícone → ChoiceCards. Mais de 6 → Select/Combobox. Estado liga/desliga de ferramenta → ToggleGroup. Valor contínuo aproximado → Slider.">
        <Demo className="grid gap-x-10 sm:grid-cols-2" code={`<RadioGroup label="Regime de contratação" options={options} value={mode} onChange={setMode} />`}>
          <RadioGroup<Mode>
            label="Regime de contratação"
            value={mode}
            onChange={setMode}
            options={[
              { value: "clt", label: "CLT", description: "Benefícios e carteira assinada" },
              { value: "pj", label: "PJ", description: "Nota fiscal mensal" },
              { value: "estagio", label: "Estágio", description: "Até 6h/dia, com bolsa" },
            ]}
          />
          <RadioGroup<Mode>
            label="Horizontal"
            orientation="horizontal"
            value={mode}
            onChange={setMode}
            options={[
              { value: "clt", label: "CLT" },
              { value: "pj", label: "PJ" },
              { value: "estagio", label: "Estágio", disabled: true },
            ]}
          />
        </Demo>
      </DocSection>
      <DocSection title="ChoiceCards">
        <Demo className="block" code={`<ChoiceCards label="Plano" value={plan} onChange={setPlan} options={[
  { value: "growth", label: "Growth", description: "Até 25 usuários", aside: "R$ 890/mês", icon: <Rocket /> }, …
]} />
<ChoiceCards multiple columns={3} label="Módulos" value={mods} onChange={setMods} options={…} />`}>
          <ChoiceCards<Plan>
            label="Plano"
            value={plan}
            onChange={setPlan}
            options={[
              { value: "starter", label: "Starter", description: "Até 5 usuários, 1 pipeline", aside: "R$ 290/mês", icon: <User /> },
              { value: "growth", label: "Growth", description: "Até 25 usuários, automações", aside: "R$ 890/mês", icon: <Rocket /> },
              { value: "scale", label: "Scale", description: "Ilimitado, SSO, API", aside: "Sob consulta", icon: <Building2 /> },
            ]}
          />
          <ChoiceCards
            multiple
            columns={3}
            label="Módulos (vários)"
            value={mods}
            onChange={setMods}
            options={[
              { value: "crm", label: "CRM", description: "Pipeline de vendas" },
              { value: "ats", label: "Recrutamento", description: "Vagas e candidatos", icon: <Briefcase /> },
              { value: "erp", label: "Financeiro", description: "Contas a pagar e receber" },
            ]}
          />
        </Demo>
      </DocSection>
      <DocSection title="ToggleGroup">
        <Demo code={`<ToggleGroup label="Alinhamento" value={align} onChange={setAlign} options={[{ value: "l", label: "Esquerda", icon: <AlignLeft />, hideLabel: true }, …]} />
<ToggleGroup multiple label="Dias" value={days} onChange={setDays} options={…} />`}>
          <ToggleGroup
            label="Alinhamento"
            value={align}
            onChange={setAlign}
            options={[
              { value: "l", label: "Esquerda", icon: <AlignLeft />, hideLabel: true },
              { value: "c", label: "Centro", icon: <AlignCenter />, hideLabel: true },
              { value: "r", label: "Direita", icon: <AlignRight />, hideLabel: true },
            ]}
          />
          <ToggleGroup<Day>
            multiple
            label="Dias de entrevista"
            value={days}
            onChange={setDays}
            size="sm"
            options={[
              { value: "seg", label: "Seg" },
              { value: "ter", label: "Ter" },
              { value: "qua", label: "Qua" },
              { value: "qui", label: "Qui" },
              { value: "sex", label: "Sex" },
            ]}
          />
        </Demo>
      </DocSection>
      <DocSection title="Slider" rule="Para valor aproximado onde a posição importa mais que o número exato. Mostre sempre o valor. Para número exato, NumberField.">
        <Demo className="grid gap-x-10 sm:grid-cols-2" code={`<Slider label="Probabilidade" value={prob} onChange={setProb} step={10} format={(n) => \`\${n}%\`} marks={[0, 50, 100]} />
<Slider label="Faixa salarial" value={range} onChange={setRange} min={3000} max={30000} step={500} format={(n) => formatCurrency(n, { compact: true })} />`}>
          <Slider label="Probabilidade de fechamento" value={prob} onChange={setProb} step={10} format={(n) => `${n}%`} marks={[0, 50, 100]} />
          <Slider label="Faixa salarial" value={range} onChange={setRange} min={3000} max={30000} step={500} format={(n) => formatCurrency(n, { compact: true })} hint="Filtra candidatos pela pretensão." />
        </Demo>
      </DocSection>
      <DocSection title="Regras">
        <Rules items={[{ do: "Pré-selecionar a opção mais comum quando existir uma.", dont: "Radio sem nenhuma opção marcada e sem motivo (força um clique extra)." }]} />
      </DocSection>
    </DocPage>
  );
}
