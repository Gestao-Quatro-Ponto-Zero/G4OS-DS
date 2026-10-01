import { useState } from "react";
import { CurrencyField, NumberField, formatCurrency } from "@g4os/ds";
import { Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";

export const meta: PageMeta = { title: "Números e moeda", group: "Formulários", order: 22, description: "NumberField com passo e teclado; CurrencyField em reais com máscara de caixa registradora." };

export default function Page() {
  const [seats, setSeats] = useState<number | null>(12);
  const [disc, setDisc] = useState<number | null>(7.5);
  const [value, setValue] = useState<number | null>(48900);
  const [salary, setSalary] = useState<number | null>(null);
  return (
    <DocPage title={meta.title} description={meta.description} kicker={meta.group}>
      <DocSection title="Quantidade" rule="Use −/+ quando o número é pequeno e ajustado aos poucos (licenças, itens, vagas). Setas ↑↓ mudam 1 passo; Shift+seta, 10.">
        <Demo className="grid gap-x-6 sm:grid-cols-3" code={`<NumberField label="Licenças" value={seats} onChange={setSeats} min={1} max={500} />
<NumberField label="Desconto" value={disc} onChange={setDisc} step={0.5} digits={1} suffix="%" min={0} max={30} />`}>
          <NumberField label="Licenças" value={seats} onChange={setSeats} min={1} max={500} hint="Mínimo 1 · máximo 500" />
          <NumberField label="Desconto" value={disc} onChange={setDisc} step={0.5} digits={1} suffix="%" min={0} max={30} />
          <NumberField label="Vagas (desabilitado)" value={3} onChange={() => {}} disabled />
        </Demo>
      </DocSection>
      <DocSection title="Moeda" rule="Os dígitos entram pela direita (caixa registradora): ninguém precisa digitar vírgula. O valor sai como número em reais.">
        <Demo className="grid gap-x-6 sm:grid-cols-2" code={`<CurrencyField label="Valor do negócio" value={value} onChange={setValue} />
// value = 48900 → exibe "48.900,00"`}>
          <CurrencyField label="Valor do negócio" value={value} onChange={setValue} hint={value != null ? `Salvo como ${formatCurrency(value)}` : "Digite só os números"} />
          <CurrencyField label="Pretensão salarial" optional value={salary} onChange={setSalary} />
        </Demo>
      </DocSection>
      <DocSection title="Regras">
        <Rules
          items={[
            { do: "Alinhar números à direita em tabelas e usar `tabular-nums`.", dont: "type=\"number\" nativo para dinheiro (rolagem do mouse muda o valor, vírgula quebra)." },
            { do: "Guardar dinheiro como número (ou centavos inteiros) e formatar com formatCurrency.", dont: "Guardar \"R$ 1.234,00\" como texto no banco." },
          ]}
        />
      </DocSection>
      <DocSection title="Props · NumberField">
        <PropsTable
          rows={[
            ["value / onChange", "number | null", "—", "null quando vazio."],
            ["min / max / step", "number", "— / — / 1", "Limites e passo; botões desabilitam nos extremos."],
            ["digits", "number", "0", "Casas decimais exibidas e arredondadas."],
            ["suffix", "ReactNode", "—", "Unidade (%, h, un)."],
          ]}
        />
      </DocSection>
    </DocPage>
  );
}
