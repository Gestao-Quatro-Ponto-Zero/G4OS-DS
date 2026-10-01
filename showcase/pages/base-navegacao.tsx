import { DocPage } from "../kit";
import { Navigation } from "./_legacy";
import type { PageMeta } from "../kit";

export const meta: PageMeta = { title: "Cabeçalhos, abas e trilhas", group: "Navegação", order: 10, description: "PageHeading, Breadcrumb, Tabs, SegmentedControl, ActionMenu, Stepper e cabeçalho de entidade." };

export default function Page() {
  return (
    <DocPage title={meta.title} description={meta.description} kicker={meta.group}>
      <Navigation />
    </DocPage>
  );
}
