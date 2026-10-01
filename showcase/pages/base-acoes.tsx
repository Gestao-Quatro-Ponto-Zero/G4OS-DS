import { DocPage } from "../kit";
import { Actions } from "./_legacy";
import type { PageMeta } from "../kit";

export const meta: PageMeta = { title: "Botões e ações", group: "Ações e exibição", order: 10, description: "Hierarquia de ações: um primário por área, ghost para o resto, destrutivo só dentro de confirmação." };

export default function Page() {
  return (
    <DocPage title={meta.title} description={meta.description} kicker={meta.group}>
      <Actions />
    </DocPage>
  );
}
