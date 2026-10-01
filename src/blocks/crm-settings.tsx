import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useState, type ReactNode } from "react";
import {
  Button,
  IconButton,
  NumberField,
  Page,
  PageHeading,
  Switch,
  TagInput,
  TextField,
  cn,
  notify,
} from "@g4os/ds";
import { lostReasons, stages as baseStages } from "./data/crm";
import { CrmShell } from "./shells/crm-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Configurações do CRM",
  description: "Etapas do funil com probabilidade e ordem, motivos de perda, regras de automação e barra de alterações não salvas.",
  category: "CRM",
  order: 9,
  height: 1000,
  concept: {
    goal: "Ajustar o funil e as regras do CRM sem quebrar o que o time usa.",
    patterns: [
      "Anatomia D · Configurações: título fixo",
      "Etapas com probabilidade e ordem; motivos de perda; regras de automação",
      "Barra de alterações não salvas no rodapé",
    ],
    adapt: [
      "Etapas de vaga (ATS), situações de pedido (ERP)",
    ],
    avoid: [
      "Salvar a cada campo quando a mudança afeta o time inteiro",
    ],
  },
} as const;

const here = "#/frame/crm-settings";
type EditableStage = { id: string; label: string; probability: number };
const initialStages: EditableStage[] = baseStages.map((s) => ({ id: s.id, label: s.label, probability: Math.round(s.probability * 100) }));
const initialRules = { staleAlert: true, requireNextStep: true, lossReason: true, autoAssign: false };

function Section({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className="grid gap-4 border-t border-line py-8 first:border-t-0 first:pt-2 lg:grid-cols-[280px_1fr] lg:gap-10">
      <div>
        <h2 className="m-0 text-[14px] font-medium">{title}</h2>
        <p className="m-0 mt-1 text-[12.5px] leading-relaxed text-muted">{description}</p>
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

export default function CrmSettings() {
  const [stages, setStages] = useState(initialStages);
  const [reasons, setReasons] = useState(lostReasons.map((r) => r.label));
  const [rules, setRules] = useState(initialRules);
  const [staleDays, setStaleDays] = useState<number | null>(30);
  const dirty = JSON.stringify([stages, reasons, rules, staleDays]) !== JSON.stringify([initialStages, lostReasons.map((r) => r.label), initialRules, 30]);

  const move = (i: number, dir: -1 | 1) =>
    setStages((s) => {
      const n = [...s];
      [n[i], n[i + dir]] = [n[i + dir], n[i]];
      return n;
    });
  const invalid = stages.some((s, i) => i > 0 && s.probability < stages[i - 1].probability);

  return (
    <CrmShell current={here}>
      <Page>
        <PageHeading title="Configurações do CRM" description="Funil, motivos de perda e regras que valem para todo o time comercial." />
        <div className="mt-6 max-w-[960px]">
          <Section title="Etapas do funil" description="A probabilidade calcula a previsão ponderada. Ela deve crescer ao longo do funil.">
            <ol className="m-0 list-none space-y-2 p-0">
              {stages.map((s, i) => (
                <li key={s.id} className="flex flex-wrap items-end gap-2 rounded-xl border border-line bg-surface p-3 sm:flex-nowrap">
                  <span className="mb-2.5 hidden w-5 shrink-0 text-center text-[12px] font-semibold tabular-nums text-muted sm:block">{i + 1}</span>
                  <TextField label="Nome da etapa" value={s.label} onChange={(v) => setStages((all) => all.map((x) => (x.id === s.id ? { ...x, label: v } : x)))} className="min-w-[160px] flex-1" />
                  <NumberField label="Probabilidade" value={s.probability} onChange={(v) => setStages((all) => all.map((x) => (x.id === s.id ? { ...x, probability: v ?? 0 } : x)))} min={0} max={100} step={5} suffix="%" className="w-36" />
                  <div className="mb-1 flex gap-0.5">
                    <IconButton label="Subir etapa" size="sm" disabled={i === 0} onClick={() => move(i, -1)}>
                      <ArrowUp />
                    </IconButton>
                    <IconButton label="Descer etapa" size="sm" disabled={i === stages.length - 1} onClick={() => move(i, 1)}>
                      <ArrowDown />
                    </IconButton>
                    <IconButton
                      label={`Remover ${s.label}`}
                      size="sm"
                      disabled={stages.length <= 2}
                      onClick={() => {
                        setStages((all) => all.filter((x) => x.id !== s.id));
                        notify(`Etapa ${s.label} removida`, () => setStages((all) => [...all.slice(0, i), s, ...all.slice(i)]));
                      }}
                    >
                      <Trash2 />
                    </IconButton>
                  </div>
                </li>
              ))}
            </ol>
            {invalid && <p className="m-0 mt-2 text-[12.5px] text-amber">Uma etapa tem probabilidade menor que a anterior. A previsão ponderada fica distorcida.</p>}
            <Button className="mt-3" size="sm" variant="ghost" onClick={() => setStages((s) => [...s, { id: `s${Date.now()}`, label: "Nova etapa", probability: 95 }])}>
              <Plus /> Adicionar etapa
            </Button>
          </Section>

          <Section title="Motivos de perda" description="Aparecem ao marcar um negócio como perdido e alimentam o relatório “Por que perdemos?”.">
            <TagInput label="Motivos" value={reasons} onChange={setReasons} placeholder="Novo motivo e Enter" />
          </Section>

          <Section title="Regras do time" description="Valem para todos os negócios. Mudanças afetam só o que acontecer daqui em diante.">
            <div className="divide-y divide-line rounded-xl border border-line bg-surface px-4">
              {(
                [
                  ["staleAlert", "Avisar negócio parado", "Destaca em âmbar e notifica o responsável."],
                  ["requireNextStep", "Exigir próximo passo", "Não deixa mover de etapa sem uma atividade agendada."],
                  ["lossReason", "Motivo obrigatório na perda", "Sem motivo, o relatório de perdas perde valor."],
                  ["autoAssign", "Distribuir leads automaticamente", "Rodízio entre SDRs por ordem de chegada."],
                ] as const
              ).map(([key, label, hint]) => (
                <div key={key} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <div className="text-[13.5px] font-medium">{label}</div>
                    <div className="text-[12px] text-muted">{hint}</div>
                  </div>
                  <Switch label={label} hideLabel checked={rules[key]} onCheckedChange={(v) => setRules((r) => ({ ...r, [key]: v }))} />
                </div>
              ))}
              {rules.staleAlert && (
                <div className="py-3">
                  <NumberField label="Considerar parado após" value={staleDays} onChange={setStaleDays} min={7} max={120} suffix="dias" className="max-w-[220px]" />
                </div>
              )}
            </div>
          </Section>
        </div>
        {/* Barra de alterações não salvas */}
        <div className={cn("sticky bottom-4 z-10 mx-auto mt-6 flex w-fit max-w-full items-center gap-3 rounded-xl border border-line bg-popover py-2 pl-4 pr-2 shadow-toast transition-opacity", dirty ? "opacity-100" : "pointer-events-none opacity-0")} aria-hidden={!dirty}>
          <span className="text-[13px]">Alterações não salvas</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setStages(initialStages);
              setReasons(lostReasons.map((r) => r.label));
              setRules(initialRules);
              setStaleDays(30);
            }}
          >
            Descartar
          </Button>
          <Button size="sm" disabled={invalid} onClick={() => notify("Configurações salvas para o time")}>
            Salvar
          </Button>
        </div>
      </Page>
    </CrmShell>
  );
}
