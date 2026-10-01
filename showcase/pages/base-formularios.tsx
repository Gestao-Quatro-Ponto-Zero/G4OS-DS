import { DocPage } from "../kit";
import { Forms } from "./_legacy";
import type { PageMeta } from "../kit";

export const meta: PageMeta = { title: "Formulário padrão", group: "Formulários", order: 10, description: "Campos com rótulo visível, Select, Combobox, data, checkbox, switch e operação confirmada." };

export default function Page() {
  return (
    <DocPage title={meta.title} description={meta.description} kicker={meta.group}>
      <Forms />
    </DocPage>
  );
}
