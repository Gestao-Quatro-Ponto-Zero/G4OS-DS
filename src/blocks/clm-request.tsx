import { ArrowRight, FileCheck2, X } from "lucide-react";
import { useState } from "react";
import {
  Badge,
  Button,
  Callout,
  Checkbox,
  ChoiceCards,
  Combobox,
  CurrencyField,
  DatePicker,
  EntityMark,
  FileDropzone,
  FormWizard,
  LocationTag,
  MaskedField,
  NumberField,
  ProductMark,
  PropertyList,
  Select,
  Stepper,
  TextField,
  TextareaField,
  formatCurrency,
  formatDate,
  masks,
  plural,
  type UploadItem,
} from "@g4ai/ds";
import {
  addContract,
  addDays,
  areas,
  contractTypes,
  counterparties,
  counterpartyById,
  diligenceOf,
  iso,
  me,
  nextNumber,
  people,
  personById,
  renewalInfo,
  templates,
  type Area,
  type Contract,
  type ContractType,
  type PriceIndex,
  type Renewal,
} from "./data/contracts";
import { frameHref, go, useFrameParam } from "./shells/frame-route";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Nova solicitação de contrato",
  description: "Assistente em 5 etapas (modelo → contraparte → dados comerciais → anexos → aprovadores) que valida cada etapa, mostra a due diligence da contraparte, calcula a cadeia de aprovação pelo valor e gera o rascunho a partir do modelo.",
  category: "Contratos",
  order: 4,
  height: 900,
  concept: {
    goal: "Deixar Suprimentos, TI ou Comercial pedirem um contrato ao Jurídico com tudo o que ele precisa na primeira vez, partindo de um modelo aprovado.",
    patterns: [
      "Anatomia H · Fluxo focado: sem navegação do app, só o assistente e um resumo ao lado",
      "FormWizard: cada etapa valida ao avançar; Voltar nunca valida; anexos são opcionais",
      "Contraparte por Combobox com a situação da due diligence (certidões) logo abaixo; contraparte nova por CNPJ",
      "Cadeia de aprovação calculada pelo valor e pelo tratamento de dados (DPO)",
      "Ao concluir, gera o rascunho e leva ao registro do contrato",
      "?objeto= vem preenchido pela busca ⌘K (“Solicitar contrato “…””); ?modelo= e ?contraparte= vêm de Modelos e de Contrapartes",
    ],
    adapt: [
      "Requisição de compra, pedido de aditivo, abertura de fornecedor",
    ],
    avoid: [
      "Formulário único com 20 campos",
      "Pedir dados que o modelo já define (foro, cláusulas padrão)",
    ],
  },
} as const;

const contractTemplates = templates.filter((t) => t.type !== "aditivo" && t.type !== "dpa");
const indexes: PriceIndex[] = ["IPCA", "IGP-M", "INPC", "Sem reajuste"];
const areaManager: Record<Area, string> = { Suprimentos: "p4", TI: "p6", Facilities: "p12", Operações: "p8", Comercial: "p11", Financeiro: "p5", Jurídico: "p2" };

type Form = {
  templateId: string | null;
  counterpartyId: string;
  isNew: boolean;
  newCnpj: string;
  newName: string;
  title: string;
  value: number | null;
  monthly: number | null;
  start: string;
  months: number | null;
  index: PriceIndex;
  renewal: Renewal;
  notice: number | null;
  area: Area;
  costCenter: string;
  personalData: boolean;
  context: string;
  extra: string[];
};

export default function ClmRequest() {
  const objeto = useFrameParam("objeto");
  const modelo = useFrameParam("modelo");
  const contraparte = useFrameParam("contraparte");
  const [f, setF] = useState<Form>({
    templateId: contractTemplates.some((t) => t.id === modelo) ? modelo : null,
    counterpartyId: counterparties.some((k) => k.id === contraparte) ? contraparte! : "",
    isNew: false,
    newCnpj: "",
    newName: "",
    title: objeto ?? "",
    value: null,
    monthly: null,
    start: iso(30),
    months: 12,
    index: "IPCA",
    renewal: "automatica",
    notice: 60,
    area: "Suprimentos",
    costCenter: "",
    personalData: false,
    context: "",
    extra: [],
  });
  const [files, setFiles] = useState<UploadItem[]>([]);
  const [created, setCreated] = useState<Contract | null>(null);
  const set = <K extends keyof Form>(key: K) => (v: Form[K]) => setF((x) => ({ ...x, [key]: v }));

  const template = contractTemplates.find((t) => t.id === f.templateId);
  const type: ContractType = template && template.type !== "aditivo" && template.type !== "dpa" ? template.type : "servico";
  const isNda = type === "nda";
  const k = f.counterpartyId ? counterpartyById(f.counterpartyId) : null;
  const value = isNda ? 0 : f.value ?? 0;
  const end = addDays(f.start, Math.round((f.months ?? 12) * 30.4));
  const chain = [
    { role: "Gestor da área", who: areaManager[f.area] },
    ...(f.personalData ? [{ role: "Proteção de dados", who: "p9" }] : []),
    { role: "Jurídico", who: "p2" },
    ...(value > 1_000_000 ? [{ role: "Diretoria financeira", who: "p5" }] : []),
    ...(value > 3_000_000 ? [{ role: "Diretor-presidente", who: "p10" }] : []),
  ];
  const selfService = template && template.selfService.includes(f.area) && (!template.selfServiceLimit || value <= template.selfServiceLimit);

  const submit = async () => {
    await new Promise((r) => setTimeout(r, 900));
    const c = addContract({
      id: `n${Date.now()}`,
      number: nextNumber(),
      title: f.title.trim(),
      type,
      counterpartyId: f.counterpartyId || "k1",
      value,
      monthly: f.monthly ?? undefined,
      start: f.start,
      end,
      renewal: isNda ? "nenhuma" : f.renewal,
      noticeDays: isNda ? 0 : f.notice ?? 0,
      index: isNda ? "Sem reajuste" : f.index,
      owner: me.id,
      requester: areaManager[f.area],
      area: f.area,
      costCenter: f.costCenter || "A definir",
      status: "rascunho",
      templateId: f.templateId ?? "t1",
      penalty: "10 % do valor anual remanescente",
      paymentTerms: f.monthly ? "Mensal, 30 dias após a medição" : "Por entrega aceita",
      lgpd: f.personalData ? "operador" : "não trata dados pessoais",
      deviations: [],
      updated: iso(0),
    });
    setCreated(c);
  };

  if (created)
    return (
      <div className="grid h-dvh place-items-center overflow-y-auto bg-page px-5">
        <div className="enter w-full max-w-[480px] rounded-2xl border border-line bg-surface p-8 text-center shadow-raised">
          <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-ok-soft text-ok">
            <FileCheck2 className="h-5 w-5" />
          </span>
          <h1 className="m-0 text-[22px] font-semibold tracking-[-0.03em]">Rascunho {created.number} gerado</h1>
          <p className="m-0 mt-2 text-[13.5px] leading-relaxed text-muted">
            {created.title} · {counterpartyById(created.counterpartyId).short}. A minuta saiu do modelo {template?.name} v{template?.version}; {personById(created.owner).name} revisa e envia para {plural(chain.length, "aprovador", "aprovadores")}.
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button variant="ghost" href={frameHref("clm-contracts")}>
              Ir para contratos
            </Button>
            <Button onClick={() => go("clm-contract", created.id)}>
              Abrir rascunho <ArrowRight />
            </Button>
          </div>
        </div>
      </div>
    );

  return (
    <div className="flex h-dvh flex-col bg-page">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-line bg-surface px-4 sm:px-6">
        <ProductMark size={26} />
        <span className="text-[14px] font-semibold tracking-tight">Pacto</span>
        <span className="ml-2 hidden text-[12.5px] text-muted sm:inline">Nova solicitação de contrato</span>
        <a href={frameHref("clm-contracts")} aria-label="Sair sem salvar" className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-soft hover:text-ink">
          <X className="h-4 w-4" />
        </a>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto grid max-w-[1120px] gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <FormWizard
            title="O que você precisa contratar?"
            submitLabel="Gerar rascunho"
            onCancel={() => go("clm-contracts")}
            onSubmit={submit}
            steps={[
              {
                id: "modelo",
                label: "Modelo",
                hint: "Ponto de partida aprovado",
                validate: () => (!f.templateId ? "Escolha um modelo. Se nenhum servir, use “Prestação de serviços” e explique no contexto." : null),
                content: (
                  <ChoiceCards<string>
                    label="Modelo do contrato"
                    hint="O modelo já traz as cláusulas padrão do Jurídico. Você só preenche o que é do negócio."
                    columns={2}
                    value={f.templateId}
                    onChange={set("templateId")}
                    options={contractTemplates.map((t) => ({
                      value: t.id,
                      label: t.name,
                      description: t.description,
                      aside: <Badge tone={t.status === "publicado" ? "neutral" : "warn"}>{t.status === "publicado" ? `v${t.version}` : "Em revisão"}</Badge>,
                    }))}
                  />
                ),
              },
              {
                id: "contraparte",
                label: "Contraparte",
                hint: "Com quem é o contrato",
                validate: () => (f.isNew ? [f.newCnpj.replace(/\D/g, "").length !== 14 && "Informe o CNPJ completo.", !f.newName.trim() && "Informe a razão social."].filter(Boolean) as string[] : !f.counterpartyId ? "Escolha a contraparte ou marque que é uma empresa nova." : null),
                content: (
                  <div className="space-y-4">
                    {!f.isNew && (
                      <Combobox
                        label="Contraparte"
                        placeholder="Buscar por nome ou CNPJ…"
                        value={f.counterpartyId}
                        onValueChange={set("counterpartyId")}
                        options={counterparties.map((x) => ({ value: x.id, label: x.name, description: `${x.taxLabel} ${x.taxId} · ${x.place}` }))}
                      />
                    )}
                    {k && !f.isNew && (
                      <div className="rounded-xl border border-line bg-surface px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <EntityMark name={k.short} tint={k.tint} className="h-9 w-9 text-[12px]" />
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-[13.5px] font-medium">{k.name}</div>
                            <div className="truncate text-[12px] text-muted">
                              {k.segment} · desde {formatDate(k.since, { short: true })}
                            </div>
                          </div>
                          <Badge tone={diligenceOf(k).tone}>{diligenceOf(k).label}</Badge>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                          <LocationTag place={k.place} timeZone={k.timeZone} />
                          <span className="text-[12px] text-muted">Representante: {k.rep.name}</span>
                        </div>
                        {diligenceOf(k).tone === "bad" && (
                          <div className="mt-3">
                            <Callout tone="bad">Certidão vencida: o Jurídico não envia para assinatura até a contraparte regularizar. Pedimos a nova certidão automaticamente.</Callout>
                          </div>
                        )}
                      </div>
                    )}
                    <Checkbox label="É uma empresa nova, que ainda não está no Pacto" checked={f.isNew} onCheckedChange={(v) => setF((x) => ({ ...x, isNew: v, counterpartyId: v ? "" : x.counterpartyId }))} />
                    {f.isNew && (
                      <div className="grid gap-4 sm:grid-cols-[220px_minmax(0,1fr)]">
                        <MaskedField label="CNPJ" mask={masks.cnpj} value={f.newCnpj} onChange={(m) => set("newCnpj")(m)} />
                        <TextField label="Razão social" value={f.newName} onChange={set("newName")} placeholder="Ex.: Transportes Andrade Ltda" />
                        <p className="m-0 text-[12px] text-muted sm:col-span-2">Buscamos os dados na Receita e pedimos as certidões (Federal, FGTS, CNDT, estadual e municipal) assim que você concluir.</p>
                      </div>
                    )}
                  </div>
                ),
              },
              {
                id: "comercial",
                label: "Dados comerciais",
                hint: "Objeto, valor e prazo",
                validate: () =>
                  [!f.title.trim() && "Descreva o objeto do contrato.", !isNda && !f.value && "Informe o valor total estimado.", !f.months && "Informe a vigência em meses.", !f.costCenter.trim() && "Informe o centro de custo."].filter(Boolean) as string[],
                content: (
                  <div className="grid gap-x-4 sm:grid-cols-2">
                    <TextField className="sm:col-span-2" label="Objeto" value={f.title} onChange={set("title")} placeholder="Ex.: Transporte refrigerado das rotas Sul e Sudeste" />
                    {!isNda && (
                      <>
                        <CurrencyField label="Valor total estimado" value={f.value} onChange={set("value")} hint="Toda a vigência" />
                        <CurrencyField label="Valor mensal" optional value={f.monthly} onChange={set("monthly")} />
                      </>
                    )}
                    <DatePicker label="Início" value={f.start} onValueChange={set("start")} min={iso(0)} />
                    <NumberField label="Vigência" suffix="meses" value={f.months} onChange={set("months")} min={1} max={60} hint={`Até ${formatDate(end)}`} />
                    {!isNda && (
                      <>
                        <Select label="Reajuste" value={f.index} onValueChange={(v) => set("index")(v as PriceIndex)} options={indexes.map((i) => ({ value: i, label: i }))} hint="IGP-M só em locação, pela política do Jurídico" />
                        <Select label="Renovação" value={f.renewal} onValueChange={(v) => set("renewal")(v as Renewal)} options={Object.entries(renewalInfo).map(([value, label]) => ({ value, label }))} />
                        {f.renewal !== "nenhuma" && <NumberField label="Aviso prévio" suffix="dias" value={f.notice} onChange={set("notice")} min={0} />}
                      </>
                    )}
                    <Select label="Área solicitante" value={f.area} onValueChange={(v) => set("area")(v as Area)} options={areas.map((a) => ({ value: a, label: a }))} />
                    <TextField label="Centro de custo" value={f.costCenter} onChange={set("costCenter")} placeholder="Ex.: 2.04 · Logística de distribuição" />
                    <div className="sm:col-span-2">
                      <Checkbox label="A contraparte vai tratar dados pessoais (clientes, funcionários)" checked={f.personalData} onCheckedChange={set("personalData")} />
                      {f.personalData && <p className="m-0 mt-1.5 text-[12px] text-muted">Entra o Acordo de tratamento de dados (DPA) e a encarregada de dados aprova.</p>}
                    </div>
                  </div>
                ),
              },
              {
                id: "anexos",
                label: "Anexos",
                hint: "Proposta, escopo",
                optional: true,
                content: (
                  <div className="space-y-4">
                    <FileDropzone
                      label="Proposta comercial e escopo"
                      hint="PDF, DOCX ou XLSX até 20 MB. A proposta vira o Anexo I."
                      accept=".pdf,.docx,.xlsx"
                      maxSize={20_000_000}
                      items={files}
                      onFiles={(list) => setFiles((all) => [...all, ...list.map((x) => ({ id: `${x.name}-${x.size}`, name: x.name, size: x.size }))])}
                      onRemove={(fid) => setFiles((all) => all.filter((x) => x.id !== fid))}
                    />
                    <TextareaField label="Contexto para o Jurídico" optional value={f.context} onChange={set("context")} minRows={3} placeholder="Ex.: o fornecedor pediu multa menor em troca do SLA de 98 %. Precisamos assinar até 15/10." />
                  </div>
                ),
              },
              {
                id: "aprovadores",
                label: "Aprovadores",
                hint: "Quem decide",
                content: (
                  <div className="space-y-5">
                    <div>
                      <p className="m-0 mb-3 text-[13px] text-ink-soft">Pela política de alçadas, este contrato passa por:</p>
                      <Stepper label="Cadeia de aprovação prevista" steps={chain.map((s, i) => ({ id: String(i), label: s.role, hint: personById(s.who).name, state: "upcoming" }))} />
                    </div>
                    {selfService && <Callout tone="ok" title="Autoatendimento">Modelo sem alteração e dentro do limite de {formatCurrency(template!.selfServiceLimit ?? 0, { compact: true })} da sua área: se ninguém mexer nas cláusulas, o Jurídico só confere.</Callout>}
                    <Combobox
                      multiple
                      label="Aprovadores adicionais"
                      optional
                      hint="Quem mais precisa ver antes da assinatura"
                      placeholder="Buscar pessoa…"
                      value={f.extra}
                      onValueChange={set("extra")}
                      options={people.filter((p) => !chain.some((s) => s.who === p.id)).map((p) => ({ value: p.id, label: p.name, description: `${p.role} · ${p.area}` }))}
                    />
                  </div>
                ),
              },
            ]}
          />

          <aside className="hidden lg:block">
            <div className="sticky top-8 rounded-xl border border-line bg-surface px-4 py-4">
              <h2 className="m-0 mb-3 text-[13px] font-medium">Resumo da solicitação</h2>
              <PropertyList
                items={[
                  { label: "Modelo", value: template ? `${template.name} v${template.version}` : "—" },
                  { label: "Tipo", value: template ? contractTypes[type].label : "—" },
                  { label: "Contraparte", value: f.isNew ? f.newName || "Empresa nova" : k?.short ?? "—" },
                  { label: "Objeto", value: f.title || "—" },
                  { label: "Valor", value: isNda ? "Sem valor" : f.value ? formatCurrency(f.value, { cents: false }) : "—" },
                  { label: "Vigência", value: f.months ? `${f.months} meses · ${formatDate(f.start)} a ${formatDate(end)}` : "—" },
                  { label: "Anexos", value: files.length ? plural(files.length, "arquivo") : "Nenhum" },
                  { label: "Aprovadores", value: plural(chain.length + f.extra.length, "pessoa", "pessoas") },
                ]}
              />
              <p className="m-0 mt-4 border-t border-line pt-3 text-[12px] leading-relaxed text-muted">Prazo médio do Jurídico para um rascunho deste tipo: 2 dias úteis. Você acompanha tudo em Contratos.</p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
