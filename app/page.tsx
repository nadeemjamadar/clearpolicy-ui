"use client";

import { useState } from "react";
import { PolicyLibrary } from "@/components/PolicyLibrary";
import { QASection } from "@/components/QASection";
import { AuditExport } from "@/components/AuditExport";
import { isMockMode } from "@/lib/api";

export default function Home() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
          ClearPolicy AI
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Policy document Q&A — upload policies, ask questions, get answers with
          citations.
        </p>
        {isMockMode() && (
          <p className="mt-2 inline-block rounded bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">
            Mock mode: using localStorage and simulated responses
          </p>
        )}
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <PolicyLibrary
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
          />
        </section>
        <section>
          <QASection policyIds={Array.from(selectedIds)} />
        </section>
      </div>

      <section className="mt-6">
        <AuditExport />
      </section>
    </main>
  );
}
