// preset strict
import { useEffect, useState } from "react";
import { DataTable } from "@g4ai/ds";
export function A() {
  const [rows, setRows] = useState<{ id: string }[]>([]);
  useEffect(() => {
    fetch("/api/x")
      .then((r) => r.json())
      .then(setRows);
  }, []);
  return <DataTable rows={rows} columns={[]} rowKey={(r) => r.id} />;
}
