// preset strict
import { useEffect, useState } from "react";
import { DataTable, Skeleton } from "@g4ai/ds";
export function A() {
  const [rows, setRows] = useState<{ id: string }[] | null>(null);
  useEffect(() => {
    fetch("/api/x")
      .then((r) => r.json())
      .then(setRows);
  }, []);
  if (!rows) return <Skeleton className="h-40" />;
  return <DataTable rows={rows} columns={[]} rowKey={(r) => r.id} />;
}
