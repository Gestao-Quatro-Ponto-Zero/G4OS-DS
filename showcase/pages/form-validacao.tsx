import { AlertCircle } from "lucide-react";
import { useRef, useState } from "react";
import { Button, CurrencyField, MaskedField, TextField, masks } from "@g4os/ds";
import { Demo, DocPage, DocSection, Rules, Specimen, type PageMeta } from "../kit";

export const meta: PageMeta = { title: "Validação e estados de campo", group: "Formulários", order: 27, description: "Os seis estados de um campo e o padrão de resumo de erros no envio." };

export default function Page() {
  const [v, setV] = useState("Rede Horizonte");
  const [name, setName] = useState("");
  const [cnpj, setCnpj] = useState("12.345");
  const [amount, setAmount] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const summary = useRef<HTMLDivElement>(null);
  const errors = submitted
    ? ([
        !name && ["f-name", "Informe o nome da empresa."],
        !masks.cnpj.validate(cnpj.replace(/\D/g, "")) && ["f-cnpj", "CNPJ incompleto ou inválido."],
        amount == null && ["f-amount", "Informe o valor estimado."],
      ].filter(Boolean) as [string, string][])
    : [];
  const err = (id: string) => errors.find((e) => e[0] === id)?.[1];
  return (
    <DocPage title={meta.title} description={meta.description} kicker={meta.group}>
      <DocSection title="Estados" rule="Foco = borda escura + halo. Erro = borda rosa + mensagem (aria-invalid). Desabilitado = gelo, cursor proibido — explique o porquê perto. Somente leitura = gelo, texto selecionável. Carregando = spinner à direita.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Specimen label="Padrão" className="rounded-xl border border-line bg-surface p-5 pb-0">
            <TextField label="Empresa" value={v} onChange={setV} />
          </Specimen>
          <Specimen label="Foco (clique)" className="rounded-xl border border-line bg-surface p-5 pb-0">
            <TextField label="Empresa" value={v} onChange={setV} autoFocus={false} placeholder="Clique aqui" />
          </Specimen>
          <Specimen label="Erro" className="rounded-xl border border-line bg-surface p-5 pb-0">
            <TextField label="E-mail" value="ana@" onChange={() => {}} error="Informe um e-mail válido, como nome@empresa.com." />
          </Specimen>
          <Specimen label="Desabilitado" className="rounded-xl border border-line bg-surface p-5 pb-0">
            <TextField label="Plano" value="Growth" onChange={() => {}} disabled hint="Só administradores mudam o plano." />
          </Specimen>
          <Specimen label="Somente leitura" className="rounded-xl border border-line bg-surface p-5 pb-0">
            <TextField label="ID da conta" value="acc_8F2K91" onChange={() => {}} readOnly />
          </Specimen>
          <Specimen label="Carregando" className="rounded-xl border border-line bg-surface p-5 pb-0">
            <TextField label="Domínio" value="horizonte.com.br" onChange={() => {}} loading hint="Verificando…" />
          </Specimen>
        </div>
      </DocSection>
      <DocSection title="Resumo de erros no envio" rule="Ao enviar com erros: mostre um resumo no topo com links para cada campo, mova o foco para ele e marque cada campo. Não desabilite o botão de enviar — ele é o jeito de descobrir o que falta.">
        <Demo
          className="block max-w-[560px]"
          code={`// no submit:
if (errors.length) { summaryRef.current?.focus(); return; }

<div ref={summaryRef} tabIndex={-1} role="alert">
  <p>Corrija 3 campos para continuar</p>
  <ul>{errors.map(([id, msg]) => <li><a href={\`#\${id}\`}>{msg}</a></li>)}</ul>
</div>`}
        >
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              setSubmitted(true);
              requestAnimationFrame(() => summary.current?.focus());
            }}
          >
            {errors.length > 0 && (
              <div ref={summary} tabIndex={-1} role="alert" className="mb-5 rounded-xl border border-rose/25 bg-rose-soft/40 px-4 py-3 outline-none focus-visible:ring-2 focus-visible:ring-rose/30">
                <p className="m-0 flex items-center gap-2 text-[13.5px] font-medium text-rose">
                  <AlertCircle className="h-4 w-4" /> Corrija {errors.length} {errors.length === 1 ? "campo" : "campos"} para continuar
                </p>
                <ul className="m-0 mt-2 list-disc space-y-0.5 pl-9 text-[13px]">
                  {errors.map(([id, msg]) => (
                    <li key={id}>
                      <a href={`#${id}`} className="text-ink underline decoration-rose/40 underline-offset-2 hover:decoration-rose">
                        {msg}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {submitted && errors.length === 0 && <p className="mb-4 text-[13px] text-ok">Tudo certo — enviado.</p>}
            <TextField id="f-name" label="Nome da empresa" value={name} onChange={setName} error={err("f-name")} />
            <MaskedField id="f-cnpj" label="CNPJ" mask={masks.cnpj} value={cnpj} onChange={setCnpj} error={err("f-cnpj")} />
            <CurrencyField id="f-amount" label="Valor estimado" value={amount} onChange={setAmount} error={err("f-amount")} />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => (setSubmitted(false), setName(""), setCnpj(""), setAmount(null))}>
                Limpar
              </Button>
              <Button type="submit">Criar conta</Button>
            </div>
          </form>
        </Demo>
      </DocSection>
      <DocSection title="Regras">
        <Rules
          items={[
            { do: "Validar no blur e no envio; revalidar a cada tecla só depois que o campo já mostrou erro.", dont: "Botão “Salvar” desabilitado sem dizer o que falta." },
            { do: "Um erro por campo, dizendo como corrigir.", dont: "Toast “Erro no formulário” — some e não diz onde." },
            { do: "Manter o que foi digitado quando o servidor recusa.", dont: "Limpar o formulário após erro." },
          ]}
        />
      </DocSection>
    </DocPage>
  );
}
