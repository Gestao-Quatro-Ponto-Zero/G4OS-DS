// Dados de exemplo das páginas de Filtros e busca (não vira página: começa com "_").
import { Briefcase, Building2, CalendarDays, CircleDollarSign, Flag, MapPin, User } from "lucide-react";
import type { FilterField, SavedView } from "@g4ai/ds";

export type Deal = { id: string; name: string; company: string; stage: string; owner: string; value: number; closes: string; city: string; priority: string };
export const me = "ana";
export const now = new Date(2026, 8, 30);
export const owners = [
  { value: "ana", label: "Ana Lopes" },
  { value: "bruno", label: "Bruno Takeda" },
  { value: "carla", label: "Carla Nogueira" },
  { value: "diego", label: "Diego Araújo" },
];
export const stages = ["Qualificação", "Diagnóstico", "Proposta", "Negociação", "Fechamento"];
const companies = ["Grupo Aurora Alimentos", "Vértice Logística", "Clínica Bem Viver", "Rede Horizonte Educação", "Metalúrgica Santa Clara", "Agro Cerrado", "Farmácias Vida Plena", "Construtora Pilar", "Café Serra Alta", "Hospital São Lucas"];
const names = ["Licenças anuais", "Expansão para filiais", "Piloto em 2 unidades", "Renovação Plano Pro", "Módulo financeiro", "Implantação completa", "Integração com ERP", "Upgrade Enterprise"];
const cities = ["São Paulo", "Campinas", "Curitiba", "Belo Horizonte", "Joinville", "Goiânia", "Recife"];
export const deals: Deal[] = Array.from({ length: 32 }, (_, i) => ({
  id: String(i + 1),
  name: names[i % names.length],
  company: companies[(i * 3) % companies.length],
  stage: stages[(i * 7) % stages.length],
  owner: owners[(i * 5) % owners.length].value,
  value: 12_000 + ((i * 7919) % 420_000),
  closes: new Date(2026, 8, 30 + ((i * 11) % 60) - 20).toISOString().slice(0, 10),
  city: cities[(i * 2) % cities.length],
  priority: ["Baixa", "Média", "Alta"][(i * 5) % 3],
}));

export const dealFields: FilterField<Deal>[] = [
  { key: "stage", label: "Etapa", type: "enum", quick: true, icon: <Flag />, accessor: (d) => d.stage, options: stages.map((s) => ({ value: s, label: s })) },
  { key: "owner", label: "Responsável", type: "person", quick: true, icon: <User />, accessor: (d) => d.owner, options: owners },
  { key: "value", label: "Valor", type: "currency", icon: <CircleDollarSign />, accessor: (d) => d.value },
  { key: "closes", label: "Fechamento previsto", type: "date", icon: <CalendarDays />, accessor: (d) => d.closes },
  { key: "priority", label: "Prioridade", type: "enum", icon: <Flag />, accessor: (d) => d.priority, options: ["Baixa", "Média", "Alta"].map((p) => ({ value: p, label: p })) },
  { key: "company", label: "Empresa", type: "text", icon: <Building2 />, accessor: (d) => d.company },
  { key: "city", label: "Cidade", type: "text", icon: <MapPin />, accessor: (d) => d.city },
  { key: "name", label: "Negócio", type: "text", icon: <Briefcase />, accessor: (d) => d.name },
];
export const dealSearch = (d: Deal) => [d.name, d.company, d.city];

export const dealViews: SavedView[] = [
  { id: "todos", label: "Todos", system: true, state: { query: "", conditions: [] } },
  { id: "meus", label: "Meus", system: true, state: { query: "", conditions: [{ id: "a", field: "owner", op: "me" }] } },
  { id: "grandes", label: "Acima de R$ 200 mil", system: true, state: { query: "", conditions: [{ id: "b", field: "value", op: "gt", value: 200000 }] } },
  { id: "mes", label: "Fecham este mês", system: true, state: { query: "", conditions: [{ id: "c", field: "closes", op: "this_month" }] } },
];
