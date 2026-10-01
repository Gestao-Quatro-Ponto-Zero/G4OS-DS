// Tela legada (shadcn/ui + Tailwind cru). Migre para o G4OS-DS mantendo o comportamento.
import { useEffect, useState } from "react";

type Invoice = { id: string; customer: string; amount: number; due: string; status: "paid" | "open" | "late" };

const DATA: Invoice[] = [
  { id: "NF-1042", customer: "Vértice Logística", amount: 18450.5, due: "2026-10-03", status: "open" },
  { id: "NF-1043", customer: "Rede Horizonte", amount: 7200, due: "2026-09-21", status: "late" },
  { id: "NF-1044", customer: "Santa Clara Saúde", amount: 32900, due: "2026-09-15", status: "paid" },
  { id: "NF-1045", customer: "Alfa Agro", amount: 5400.75, due: "2026-10-12", status: "open" },
];

export default function Faturas() {
  const [rows, setRows] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("all");
  const [from, setFrom] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    const t = setTimeout(() => { setRows(DATA); setLoading(false); }, 400);
    return () => clearTimeout(t);
  }, []);

  const visible = rows.filter((r) => (status === "all" || r.status === status) && (!from || r.due >= from));

  function cancelInvoice(id: string) {
    if (!confirm("Tem certeza que deseja cancelar a fatura " + id + "?")) return;
    setRows((all) => all.filter((r) => r.id !== id));
    alert("Fatura cancelada com sucesso!");
  }

  return (
    <div className="mx-auto max-w-5xl p-8">
      <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
      <p className="text-sm text-gray-500">Manage your customer invoices</p>
      <div className="mt-6 flex gap-3">
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm">
          <option value="all">All</option>
          <option value="open">Open</option>
          <option value="late">Late</option>
          <option value="paid">Paid</option>
        </select>
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
        <button disabled={selected.length === 0} className="rounded-md bg-black px-4 py-2 text-sm text-white disabled:opacity-50" onClick={() => alert("Sending " + selected.length + " reminders")}>
          Send Reminders
        </button>
      </div>
      {loading ? (
        <p className="mt-6 text-gray-400">Loading...</p>
      ) : (
        <table className="mt-6 w-full rounded-lg border bg-white text-sm shadow-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr><th className="p-3"></th><th className="p-3">Invoice</th><th className="p-3">Customer</th><th className="p-3">Due</th><th className="p-3">Status</th><th className="p-3 text-right">Amount</th><th /></tr>
          </thead>
          <tbody>
            {visible.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-3"><input type="checkbox" checked={selected.includes(r.id)} onChange={(e) => setSelected(e.target.checked ? [...selected, r.id] : selected.filter((x) => x !== r.id))} /></td>
                <td className="p-3 font-medium">{r.id}</td>
                <td className="p-3">{r.customer}</td>
                <td className="p-3">{new Date(r.due).toLocaleDateString("en-US")}</td>
                <td className="p-3">
                  <span className={r.status === "paid" ? "rounded bg-green-100 px-2 py-1 text-green-700" : r.status === "late" ? "rounded bg-red-100 px-2 py-1 text-red-700" : "rounded bg-yellow-100 px-2 py-1 text-yellow-700"}>{r.status}</span>
                </td>
                <td className="p-3 text-right">{"R$ " + r.amount.toFixed(2)}</td>
                <td className="p-3"><button className="text-red-600 hover:underline" onClick={() => cancelInvoice(r.id)}>Cancel</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
