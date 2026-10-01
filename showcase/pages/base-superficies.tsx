import { DocPage } from "../kit";
import { Surfaces } from "./_legacy";
import type { PageMeta } from "../kit";

export const meta: PageMeta = { title: "Cards, drawer e modal", group: "Sobreposições", order: 10, description: "Cards estáticos e clicáveis, drawer para editar sem perder contexto, modal para decisão curta, confirmação para o irreversível." };

export default function Page() {
  return (
    <DocPage title={meta.title} description={meta.description} kicker={meta.group}>
      <Surfaces />
    </DocPage>
  );
}
