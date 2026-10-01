// Tela legada de automações (React + CSS próprio). Migre para o G4OS-DS mantendo o comportamento,
// inclusive o modo demonstração (nada grava; os controles de gravação ficam inertes).
import { useState } from "react";

const DEMO = true;
const ROLES = ["Executivo de Vendas", "Account Manager", "Especialista em Vendas", "SDR", "BDR", "Gerente Comercial", "Head de Vendas", "Coordenador de Vendas", "Customer Success", "Pré-vendas", "Inside Sales", "Key Account"];
const DAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const RUNS = [
  { id: 1, when: "2026-09-30T12:00:00", status: "ok", sent: 12 },
  { id: 2, when: "2026-09-29T12:00:00", status: "fail", sent: 0 },
  { id: 3, when: "2026-09-26T12:00:00", status: "ok", sent: 11 },
];

export default function Automacoes() {
  const [enabled, setEnabled] = useState(true);
  const [days, setDays] = useState(["Seg", "Ter", "Qua", "Qui", "Sex"]);
  const [roles, setRoles] = useState(["Executivo de Vendas", "Account Manager", "Especialista em Vendas"]);
  const [time, setTime] = useState("09:00");
  const [start, setStart] = useState("2026-10-01");
  const [tz, setTz] = useState("America/Sao_Paulo");

  const save = () => {
    if (DEMO) return;
    alert("Configuração salva com sucesso!");
  };
  const runNow = () => {
    if (!window.confirm("Rodar agora? Isso envia mensagens reais.")) return;
  };

  return (
    <div className="page">
      <h1 className="title">Automações</h1>
      <p className="subtitle">Controle as rotinas de cobrança e apuração.</p>
      <div className="mx-auto max-w-4xl space-y-6">
        {DEMO && <div className="banner">Demonstração: nenhuma ação grava dados.</div>}
        <section className="card">
          <div className="row">
            <h2>Pedido de forecast</h2>
            <label><input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} disabled={DEMO} /> Ativo</label>
          </div>
          <div className="field">
            <label>Dias</label>
            <div className="days">
              {DAYS.map((d) => (
                <button key={d} className={days.includes(d) ? "day on" : "day"} onClick={() => setDays(days.includes(d) ? days.filter((x) => x !== d) : [...days, d])}>{d}</button>
              ))}
            </div>
          </div>
          <div className="field"><label>Horário</label><input type="time" value={time} onChange={(e) => setTime(e.target.value)} /></div>
          <div className="field"><label>Início</label><input type="date" value={start} onChange={(e) => setStart(e.target.value)} /></div>
          <div className="field">
            <label>Fuso</label>
            <select value={tz} onChange={(e) => setTz(e.target.value)}>
              <option value="America/Sao_Paulo">Brasília</option>
              <option value="America/Manaus">Manaus</option>
              <option value="America/Noronha">Noronha</option>
            </select>
          </div>
          <details>
            <summary>Cargos que recebem o pedido ({roles.length} selecionados)</summary>
            <div className="grid">
              {ROLES.map((r) => (
                <label key={r}><input type="checkbox" checked={roles.includes(r)} disabled={DEMO} onChange={(e) => setRoles(e.target.checked ? [...roles, r] : roles.filter((x) => x !== r))} /> {r}</label>
              ))}
            </div>
          </details>
          <div className="actions">
            <span style={{ opacity: DEMO ? 0.5 : 1, pointerEvents: DEMO ? "none" : "auto" }} title="Demonstração">
              <button className="btn" onClick={save} disabled={DEMO}>Salvar</button>
            </span>
            <span style={{ opacity: DEMO ? 0.5 : 1 }} title="Demonstração">
              <button className="btn primary" onClick={runNow} disabled={DEMO}>Rodar agora</button>
            </span>
          </div>
        </section>
        <section className="card">
          <h2>Últimas execuções</h2>
          <table>
            <thead><tr><th>Quando</th><th>Situação</th><th>Mensagens</th></tr></thead>
            <tbody>
              {RUNS.map((r) => (
                <tr key={r.id}><td>{new Date(r.when).toLocaleString()}</td><td style={{ color: r.status === "ok" ? "#1a7f37" : "#cf222e" }}>{r.status === "ok" ? "OK" : "Falhou"}</td><td>{r.sent}</td></tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
