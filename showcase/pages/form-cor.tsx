/* ds-audit-ignore-file hex-color: as cores desta página são DADOS escolhidos pela pessoa (marca do cliente, etiquetas), não estilo */
import { useState } from "react";
import { ColorPicker, brandCss, deriveBrand } from "@g4ai/ds";
import { CodeBlock, Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";

export const meta: PageMeta = {
  title: "Seletor de cor",
  group: "Formulários",
  order: 29,
  description: "ColorPicker escolhe uma cor de dado: a marca do cliente, a cor de uma etiqueta, de um calendário ou de uma etapa. Amostras, hex digitável, seletor livre e o contraste do texto sobre a cor.",
};

const etiquetas = ["#1d4ed8", "#0f766e", "#15803d", "#b45309", "#b71c1c", "#be185d", "#6d28d9", "#4b5563"];

export default function Page() {
  const [marca, setMarca] = useState("#184560");
  const [tag, setTag] = useState("#0f766e");
  const css = brandCss("cliente", deriveBrand(marca));
  return (
    <DocPage title={meta.title} description={meta.description} kicker={meta.group}>
      <DocSection title="Cor da marca do cliente" rule="Com deriveBrand/brandCss a cor vira tokens semânticos (--ds-primary e companhia) com contraste garantido. A interface continua usando tokens; o hex escolhido é dado.">
        <Demo
          className="grid gap-6 md:grid-cols-[minmax(0,320px)_1fr]"
          code={`const [marca, setMarca] = useState("#184560");
<ColorPicker label="Cor principal da marca" value={marca} onChange={setMarca}
  hint="Usada em botões principais e seleção." />
const css = brandCss("cliente", deriveBrand(marca)); // [data-brand="cliente"] { --ds-primary: … }`}
        >
          <ColorPicker label="Cor principal da marca" value={marca} onChange={setMarca} hint="Usada em botões principais e na seleção." />
          <div className="min-w-0">
            <CodeBlock code={css} maxHeight={220} />
          </div>
        </Demo>
      </DocSection>

      <DocSection title="Paleta fechada" rule="allowCustom={false} para cores de etiqueta, calendário e etapa: a pessoa escolhe entre amostras que já funcionam nos dois temas.">
        <Demo className="max-w-xs" code={`<ColorPicker label="Cor da etiqueta" value={tag} onChange={setTag} swatches={etiquetas} allowCustom={false} showContrast={false} />`}>
          <ColorPicker label="Cor da etiqueta" value={tag} onChange={setTag} swatches={etiquetas} allowCustom={false} showContrast={false} />
        </Demo>
      </DocSection>

      <DocSection title="Regras">
        <Rules
          items={[
            { do: "Cor escolhida vira dado (tint de Avatar/EntityMark, etiqueta) ou marca via deriveBrand.", dont: "Usar o hex escolhido direto em classes ou estilos de componentes da interface." },
            { do: "Mostrar o contraste quando a cor recebe texto (botão, selo).", dont: "Aceitar cor de marca que reprova AA sem avisar." },
          ]}
        />
      </DocSection>

      <DocSection title="Props">
        <PropsTable
          rows={[
            ["label", "string", "—", "Rótulo visível."],
            ["value / onChange", "string (#RRGGBB)", "—", "Hex em maiúsculas."],
            ["swatches", "string[]", "colorSwatches", "Amostras (neutros, marca G4, apoio)."],
            ["allowCustom", "boolean", "true", "Hex digitável e seletor livre do sistema."],
            ["showContrast", "boolean", "true", "Contraste do melhor texto sobre a cor (AA)."],
            ["hint / disabled", "ReactNode / boolean", "—", "Ajuda abaixo; desativa."],
          ]}
        />
      </DocSection>
    </DocPage>
  );
}
