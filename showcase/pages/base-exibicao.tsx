import { DocPage } from "../kit";
import { Display } from "./_legacy";
import type { PageMeta } from "../kit";

export const meta: PageMeta = { title: "Identidade, estado e números", group: "Ações e exibição", order: 20, description: "Avatares, badges, pontos de status, progresso e indicadores." };

export default function Page() {
  return (
    <DocPage title={meta.title} description={meta.description} kicker={meta.group}>
      <Display />
    </DocPage>
  );
}
