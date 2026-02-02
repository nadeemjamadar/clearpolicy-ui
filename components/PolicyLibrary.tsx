"use client";

import { useEffect, useState } from "react";
import { Card } from "./Card";
import { Badge } from "./Badge";
import type { Policy } from "@/lib/api";
import { listPolicies, uploadPolicy } from "@/lib/api";

const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const ALLOWED_EXT = [".pdf", ".docx"];

function allowedFile(file: File): boolean {
  if (ALLOWED_TYPES.includes(file.type)) return true;
  const name = file.name.toLowerCase();
  return ALLOWED_EXT.some((ext) => name.endsWith(ext));
}

interface PolicyLibraryProps {
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
}

export function PolicyLibrary({
  selectedIds,
  onSelectionChange,
}: PolicyLibraryProps) {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await listPolicies();
      setPolicies(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load policies");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!allowedFile(file)) {
      setError("Only PDF and DOCX files are allowed.");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      await uploadPolicy(file);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const toggle = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectionChange(next);
  };

  const toggleAll = () => {
    if (selectedIds.size === policies.length) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(policies.map((p) => p.id)));
    }
  };

  return (
    <Card title="Policy Upload & Library">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <label className="cursor-pointer rounded-md bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-700">
            <input
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
              onChange={handleFile}
              disabled={uploading}
            />
            {uploading ? "Uploading…" : "Upload PDF / DOCX"}
          </label>
          <span className="text-xs text-slate-500">
            Upload PDF or DOCX files
          </span>
        </div>
        {error && (
          <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        {loading ? (
          <p className="text-sm text-slate-500">Loading policies…</p>
        ) : policies.length === 0 ? (
          <p className="text-sm text-slate-500">
            No policies yet. Upload a file to get started.
          </p>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="select-all"
                checked={
                  policies.length > 0 && selectedIds.size === policies.length
                }
                onChange={toggleAll}
                className="h-4 w-4 rounded border-slate-300"
              />
              <label htmlFor="select-all" className="text-sm text-slate-600">
                Select all for Q&A
              </label>
            </div>
            <ul className="max-h-64 space-y-2 overflow-y-auto rounded border border-slate-100 p-2">
              {policies.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center gap-3 rounded border border-slate-100 bg-slate-50/50 p-2"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(p.id)}
                    onChange={() => toggle(p.id)}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">
                      {p.filename}
                    </p>
                    <p className="text-xs text-slate-500">
                      v{p.version} · {new Date(p.uploadedAt).toLocaleString()}
                    </p>
                  </div>
                  <Badge
                    variant={
                      p.status === "Indexed" ? "success" : "warning"
                    }
                  >
                    {p.status}
                  </Badge>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </Card>
  );
}
