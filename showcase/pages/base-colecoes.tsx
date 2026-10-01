import { DocPage } from "../kit";
import { Collections } from "./_legacy";
import type { PageMeta } from "../kit";

export const meta: PageMeta = { title: "Tabela, filtros e kanban", group: "Coleções", order: 10, description: "Toolbar com busca e facetas, tabela responsiva, cards, kanban e painéis de lista." };

export default function Page() {
  return (
    <DocPage title={meta.title} description={meta.description} kicker={meta.group}>
      <Collections />
    </DocPage>
  );
}
