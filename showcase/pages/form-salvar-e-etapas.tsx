import { useState } from "react";
import { CurrencyField, FormWizard, InlineSelect, notify, SaveBar, Select, Switch, TextareaField, TextField } from "@g4ai/ds";
import { Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";

export const meta: PageMeta = {
  title: "Salvar, etapas e status inline",
  group: "Formulários",
  order: 13,
  description: "SaveBar para alterações não salvas (⌘S, aviso ao sair), FormWizard para cadastros longos em etapas e InlineSelect para status, etapa ou papel numa linha de tabela.",
};

function SaveBarDemo() {
  const saved = { name: "Acme Indústria", segment: "industria", weekly: true };
  const [form, setForm] = useState(saved);
  const [base, setBase] = useState(saved);
  const [saving, setSaving] = useState(false);
  const dirty = JSON.stringify(form) !== JSON.stringify(base);
  const save = () => {
    setSaving(true);
    window.setTimeout(() => {
      setBase(form);
      setSaving(false);
      notify("Empresa atualizada");
    }, 700);
  };
  return (
    <div className="max-w-xl">
      <TextField label="Nome da empresa" value={form.name} onChange={(name) => setForm({ ...form, name })} />
      <Select
        label="Segmento"
        value={form.segment}
        onValueChange={(segment) => setForm({ ...form, segment: segment ?? "industria" })}
        options={[
          { value: "industria", label: "Indústria" },
          { value: "varejo", label: "Varejo" },
          { value: "servicos", label: "Serviços" },
        ]}
      />
      <div className="mt-5">
        <Switch label="Resumo semanal por e-mail" checked={form.weekly} onCheckedChange={(weekly) => setForm({ ...form, weekly })} />
      </div>
      <SaveBar dirty={dirty} saving={saving} onSave={save} onDiscard={() => setForm(base)} warnOnLeave={false} />
    </div>
  );
}

function InlineDemo() {
  const [rows, setRows] = useState([
    { id: "1", name: "Ana Lopes", stage: "triagem" },
    { id: "2", name: "Bruno Reis", stage: "entrevista" },
    { id: "3", name: "Carla Nunes", stage: "proposta" },
  ]);
  const stages = [
    { value: "triagem", label: "Triagem" },
    { value: "entrevista", label: "Entrevista" },
    { value: "proposta", label: "Proposta", tone: "accent" as const },
    { value: "contratado", label: "Contratado", tone: "ok" as const },
    { value: "recusado", label: "Recusado", tone: "bad" as const, description: "Envia o e-mail de retorno" },
  ];
  return (
    <ul className="m-0 list-none divide-y divide-line rounded-xl border border-line p-0">
      {rows.map((r, i) => (
        <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-[13.5px]">
          {r.name}
          <InlineSelect
            label={`Etapa de ${r.name}`}
            value={r.stage}
            options={stages}
            disabledReason={i === 2 ? "Proposta enviada: aguarde a resposta" : undefined}
            onValueChange={(stage) => {
              setRows((all) => all.map((x) => (x.id === r.id ? { ...x, stage } : x)));
              notify(`${r.name} movida para ${stages.find((s) => s.value === stage)?.label.toLowerCase()}`);
            }}
          />
        </li>
      ))}
    </ul>
  );
}

function WizardDemo() {
  const [data, setData] = useState({ title: "", area: "", salary: null as number | null, about: "" });
  const [done, setDone] = useState(false);
  if (done)
    return (
      <div className="rounded-xl border border-line bg-soft p-5 text-[13.5px]">
        Vaga “{data.title}” criada como rascunho.{" "}
        <button type="button" className="font-medium text-blue underline underline-offset-2" onClick={() => setDone(false)}>
          Voltar ao formulário
        </button>
      </div>
    );
  return (
    <FormWizard
      title="Nova vaga"
      onCancel={() => setData({ title: "", area: "", salary: null, about: "" })}
      submitLabel="Criar vaga"
      onSubmit={() =>
        new Promise<void>((r) =>
          window.setTimeout(() => {
            setDone(true);
            r();
          }, 600),
        )
      }
      steps={[
        {
          id: "basico",
          label: "Informações básicas",
          hint: "Título e área aparecem no portal de vagas.",
          validate: () => [!data.title.trim() && "Informe o título da vaga.", !data.area && "Escolha a área."].filter(Boolean) as string[],
          content: (
            <div className="grid gap-x-4 sm:grid-cols-2">
              <TextField label="Título da vaga" value={data.title} onChange={(title) => setData({ ...data, title })} placeholder="Ex.: Pessoa desenvolvedora sênior" />
              <Select
                label="Área"
                value={data.area}
                onValueChange={(area) => setData({ ...data, area: area ?? "" })}
                placeholder="Selecione"
                options={[
                  { value: "tec", label: "Tecnologia" },
                  { value: "com", label: "Comercial" },
                  { value: "ops", label: "Operações" },
                ]}
              />
            </div>
          ),
        },
        {
          id: "remuneracao",
          label: "Remuneração",
          optional: true,
          content: <CurrencyField label="Salário mensal" value={data.salary} onChange={(salary) => setData({ ...data, salary })} optional />,
        },
        {
          id: "descricao",
          label: "Descrição",
          validate: () => (data.about.trim().length < 40 ? "Escreva pelo menos 40 caracteres sobre a vaga." : null),
          content: <TextareaField label="Sobre a vaga" value={data.about} onChange={(about) => setData({ ...data, about })} rows={4} />,
        },
      ]}
    />
  );
}

export default function Page() {
  return (
    <DocPage title={meta.title} kicker="Formulários" description={meta.description}>
      <DocSection title="SaveBar" rule="Edição no lugar (configurações, registro): a barra aparece só com alteração pendente, cola no rodapé da área que rola e some sem tirar o foco de ninguém (fica inerte).">
        <Demo
          code={`const dirty = !isEqual(form, saved);
<SaveBar dirty={dirty} saving={op.running} error={op.error} onSave={save} onDiscard={() => setForm(saved)} />`}
        >
          <SaveBarDemo />
        </Demo>
        <PropsTable
          rows={[
            ["dirty", "boolean", "—", "Há alteração não salva. Sem ela (e sem erro) a barra fica inerte."],
            ["onSave / onDiscard", "() => void", "—", "Salvar (também ⌘S/Ctrl+S) e voltar ao salvo. Sem onDiscard, só Salvar."],
            ["saving", "boolean", "false", "Botão informa “Salvando…” e Descartar desabilita."],
            ["error", "ReactNode", "—", "Motivo da falha; a barra continua aberta com o que foi digitado."],
            ["warnOnLeave", "boolean", "true", "Aviso do navegador ao fechar a aba com alterações."],
          ]}
        />
      </DocSection>

      <DocSection title="FormWizard" rule="Cadastro com mais de ~8 campos em grupos independentes. Cada etapa valida ao avançar; Voltar nunca valida; o erro fica no topo da etapa.">
        <Demo
          code={`<FormWizard
  title="Nova vaga"
  submitLabel="Criar vaga"
  onSubmit={criar}
  steps={[
    { id: "basico", label: "Informações básicas", validate: () => !titulo && "Informe o título da vaga.", content: <…/> },
    { id: "remuneracao", label: "Remuneração", optional: true, content: <CurrencyField … /> },
    { id: "descricao", label: "Descrição", validate: async () => (await checar()) ? null : "…", content: <…/> },
  ]}
/>`}
        >
          <WizardDemo />
        </Demo>
      </DocSection>

      <DocSection title="InlineSelect" rule="Status, etapa ou papel numa linha de tabela, card ou cabeçalho: selo com o valor que abre um menu. Nunca um Select por linha (regra 10). disabledReason explica quando não dá para trocar.">
        <Demo
          code={`<InlineSelect
  label={\`Etapa de \${c.name}\`}
  value={c.stage}
  onValueChange={(etapa) => mover(c.id, etapa)}
  options={[{ value: "triagem", label: "Triagem" }, { value: "contratado", label: "Contratado", tone: "ok" }]}
/>`}
        >
          <InlineDemo />
        </Demo>
      </DocSection>

      <DocSection title="Regras">
        <Rules
          items={[
            { do: "Uma SaveBar por tela, no fim da área que rola. Toast “Empresa atualizada” depois que salvou.", dont: "Botão Salvar fixo sempre visível e habilitado, ou salvar a cada tecla sem avisar." },
            { do: "Etapas com nomes de conteúdo (“Remuneração”), 3–5 etapas, a última com o verbo do resultado (“Criar vaga”).", dont: "Wizard para 4 campos: um Drawer com formulário simples resolve." },
            { do: "Dados digitados ficam no estado do app: voltar e avançar não apaga nada.", dont: "Validar ao voltar ou limpar a etapa quando dá erro." },
          ]}
        />
      </DocSection>
    </DocPage>
  );
}
