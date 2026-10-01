import { useState } from "react";
import { MaskedField, masks } from "@g4ai/ds";
import { Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";

export const meta: PageMeta = { title: "Máscaras BR", group: "Formulários", order: 23, description: "CPF, CNPJ, CEP, telefone e data com máscara enquanto digita e validação de dígito verificador no blur." };

export default function Page() {
  const [cpf, setCpf] = useState("");
  const [cnpj, setCnpj] = useState("11.222.333/0001-81");
  const [cep, setCep] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState("");
  return (
    <DocPage title={meta.title} description={meta.description} kicker={meta.group}>
      <DocSection title="Documentos e contato" rule="A máscara aparece enquanto digita; o dígito verificador é conferido ao sair do campo. Check verde quando válido. O onChange entrega o texto mascarado e só os dígitos.">
        <Demo
          className="grid gap-x-6 sm:grid-cols-2 lg:grid-cols-3"
          code={`import { MaskedField, masks } from "@g4ai/ds";

<MaskedField label="CPF" mask={masks.cpf} value={cpf} onChange={(masked, digits) => setCpf(masked)} />
<MaskedField label="CNPJ" mask={masks.cnpj} value={cnpj} onChange={setCnpj} />
<MaskedField label="Telefone" mask={masks.phone} value={phone} onChange={setPhone} type="tel" />`}
        >
          <MaskedField label="CPF" mask={masks.cpf} value={cpf} onChange={setCpf} invalidMessage="CPF inválido. Confira os números." />
          <MaskedField label="CNPJ" mask={masks.cnpj} value={cnpj} onChange={setCnpj} invalidMessage="CNPJ inválido. Confira os números." />
          <MaskedField label="CEP" mask={masks.cep} value={cep} onChange={setCep} hint="Preenchemos o endereço a partir do CEP." />
          <MaskedField label="Celular" mask={masks.phone} value={phone} onChange={setPhone} type="tel" autoComplete="tel-national" />
          <MaskedField label="Data de nascimento" mask={masks.date} value={date} onChange={setDate} invalidMessage="Data inexistente." />
        </Demo>
      </DocSection>
      <DocSection title="Máscara própria" rule="`9` é dígito; o resto é literal. Para padrões que mudam com o tamanho (telefone fixo × celular), passe uma função.">
        <Demo bare code={`const placa = { pattern: "AAA-9A99", ... } // letras: use TextField + validação
const agencia = { pattern: "9999-9", placeholder: "0000-0", inputMode: "numeric" } as const;
<MaskedField label="Agência" mask={agencia} value={v} onChange={setV} />`}>
          <span />
        </Demo>
      </DocSection>
      <DocSection title="Regras">
        <Rules items={[{ do: "Salvar só os dígitos no banco; exibir com a máscara.", dont: "Bloquear colar “123.456.789-09” — a máscara aceita qualquer formato colado." }]} />
      </DocSection>
      <DocSection title="masks">
        <PropsTable
          rows={[
            ["masks.cpf", "Mask", "999.999.999-99", "Valida dígitos verificadores."],
            ["masks.cnpj", "Mask", "99.999.999/9999-99", "Valida dígitos verificadores."],
            ["masks.cep", "Mask", "99999-999", "8 dígitos."],
            ["masks.phone", "Mask", "(99) 99999-9999", "Fixo (10) ou celular (11)."],
            ["masks.date", "Mask", "99/99/9999", "Confere se a data existe."],
          ]}
        />
      </DocSection>
    </DocPage>
  );
}
