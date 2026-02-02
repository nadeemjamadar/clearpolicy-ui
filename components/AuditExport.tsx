"use client";

import { useState, useEffect } from "react";
import { Card } from "./Card";
import { getAuditHistory, exportAuditJson } from "@/lib/api";

export function AuditExport() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(getAuditHistory().length);
    const interval = setInterval(() => {
      setCount(getAuditHistory().length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleExport = () => {
    const json = exportAuditJson();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clearpolicy-audit-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card title="Audit & Export">
      <p className="text-sm text-slate-600">
        Last {Math.min(count, 20)} Q&A interactions are stored in memory
        (browser). Export audit history as JSON.
      </p>
      <button
        type="button"
        onClick={handleExport}
        className="mt-3 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        Export audit as JSON
      </button>
    </Card>
  );
}
