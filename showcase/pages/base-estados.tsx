import { DocPage } from "../kit";
import { States } from "./_legacy";
import type { PageMeta } from "../kit";

export const meta: PageMeta = { title: "Vazio, carregando, histórico", group: "Feedback e estados", order: 10, description: "Estados vazios que oferecem a próxima ação, skeletons com a forma do conteúdo e linha do tempo." };

export default function Page() {
  return (
    <DocPage title={meta.title} description={meta.description} kicker={meta.group}>
      <States />
    </DocPage>
  );
}
