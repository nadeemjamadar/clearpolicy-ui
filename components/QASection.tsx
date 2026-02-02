"use client";

import { useState } from "react";
import { Card } from "./Card";
import { Badge } from "./Badge";
import {
  askAndRecord,
  type QAResult,
  type Citation,
  isMockMode,
} from "@/lib/api";

const JURISDICTIONS = [
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "European Union",
  "Other",
];

interface QASectionProps {
  policyIds: string[];
}

export function QASection({ policyIds }: QASectionProps) {
  const [jurisdiction, setJurisdiction] = useState(JURISDICTIONS[0]);
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<QAResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await askAndRecord(
        question.trim(),
        jurisdiction,
        Array.from(policyIds)
      );
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Question & Answer">
      {isMockMode() && (
        <p className="mb-3 rounded bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Mock mode: answers and citations are simulated. Ask a question
          containing &quot;unknown&quot; to see the fallback message.
        </p>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Jurisdiction
          </label>
          <select
            value={jurisdiction}
            onChange={(e) => setJurisdiction(e.target.value)}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            {JURISDICTIONS.map((j) => (
              <option key={j} value={j}>
                {j}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Question
          </label>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a natural-language question about the selected policies..."
            rows={3}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading || policyIds.length === 0}
          className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
        >
          {loading ? "Asking…" : "Ask"}
        </button>
        {policyIds.length === 0 && (
          <p className="text-xs text-slate-500">
            Select at least one policy above to ask questions.
          </p>
        )}
      </form>
      {error && (
        <p className="mt-3 rounded bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {result && (
        <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
          <div>
            <p className="text-xs font-medium text-slate-500">Answer</p>
            <p className="mt-1 text-sm text-slate-800">
              {result.response.unknown
                ? "I don't know. Please consult a broker or legal professional."
                : result.response.answer}
            </p>
          </div>
          {!result.response.unknown && (
            <>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-500">
                  Confidence
                </span>
                <Badge variant="default">
                  {result.response.confidence}%
                </Badge>
              </div>
              {result.response.citations.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-slate-500">
                    Citations
                  </p>
                  <ul className="mt-1 space-y-2">
                    {result.response.citations.map(
                      (c: Citation, i: number) => (
                        <li
                          key={i}
                          className="rounded border border-slate-100 bg-slate-50/50 px-3 py-2 text-xs"
                        >
                          <span className="font-medium text-slate-700">
                            {c.policyName}
                            {c.page != null && ` (p. ${c.page})`}
                          </span>
                          <p className="mt-1 text-slate-600">
                            &quot;{c.snippet}&quot;
                          </p>
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </Card>
  );
}
