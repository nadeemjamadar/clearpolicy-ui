/**
 * API client for ClearPolicy.
 * When NEXT_PUBLIC_MOCK_MODE=true, uses localStorage and mock responses.
 * Otherwise calls real backend endpoints.
 */

const MOCK_MODE = process.env.NEXT_PUBLIC_MOCK_MODE === "true";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

const STORAGE_KEY_POLICIES = "clearpolicy_policies";
const STORAGE_KEY_AUDIT = "clearpolicy_audit";
const MAX_AUDIT_ENTRIES = 20;

// --- Types ---

export type PolicyStatus = "Indexed" | "Processing";

export interface Policy {
  id: string;
  filename: string;
  version: number;
  status: PolicyStatus;
  uploadedAt: string; // ISO
}

export interface Citation {
  policyName: string;
  page?: number;
  snippet: string;
}

export interface QAResponse {
  answer: string;
  confidence: number; // 0–100
  citations: Citation[];
  unknown: boolean; // true when answer not supported by documents
}

export interface QAResult {
  question: string;
  jurisdiction: string;
  response: QAResponse;
  askedAt: string;
}

// --- Policy storage (mock) ---

function getStoredPolicies(): Policy[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_POLICIES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setStoredPolicies(policies: Policy[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY_POLICIES, JSON.stringify(policies));
}

function nextVersionForFilename(filename: string): number {
  const policies = getStoredPolicies();
  const sameName = policies.filter((p) => p.filename === filename);
  if (sameName.length === 0) return 1;
  return Math.max(...sameName.map((p) => p.version)) + 1;
}

// --- Audit storage ---

export function getAuditHistory(): QAResult[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AUDIT);
    const list: QAResult[] = raw ? JSON.parse(raw) : [];
    return list.slice(-MAX_AUDIT_ENTRIES);
  } catch {
    return [];
  }
}

function appendAudit(entry: QAResult): void {
  if (typeof window === "undefined") return;
  const list = getAuditHistory();
  list.push(entry);
  const trimmed = list.slice(-MAX_AUDIT_ENTRIES);
  localStorage.setItem(STORAGE_KEY_AUDIT, JSON.stringify(trimmed));
}

// --- Policy API ---

export async function listPolicies(): Promise<Policy[]> {
  if (MOCK_MODE) {
    return getStoredPolicies();
  }
  const res = await fetch(`${API_BASE}/api/policies`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error("Failed to list policies");
  return res.json();
}

export async function uploadPolicy(file: File): Promise<Policy> {
  if (MOCK_MODE) {
    const filename = file.name;
    const version = nextVersionForFilename(filename);
    const policy: Policy = {
      id: `mock-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      filename,
      version,
      status: "Processing",
      uploadedAt: new Date().toISOString(),
    };
    const policies = getStoredPolicies();
    policies.push(policy);
    setStoredPolicies(policies);
    // Simulate status flip to Indexed after a short delay (client-side only for demo)
    setTimeout(() => {
      const updated = getStoredPolicies();
      const idx = updated.findIndex((p) => p.id === policy.id);
      if (idx !== -1) {
        updated[idx] = { ...updated[idx], status: "Indexed" as PolicyStatus };
        setStoredPolicies(updated);
      }
    }, 2000);
    return policy;
  }
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_BASE}/api/policies/upload`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("Failed to upload policy");
  return res.json();
}

// --- Q&A API ---

export async function askQuestion(
  question: string,
  jurisdiction: string,
  policyIds: string[]
): Promise<QAResponse> {
  if (MOCK_MODE) {
    const q = question.toLowerCase();
    const unknownQuery =
      q.includes("unknown") ||
      q.includes("unsure") ||
      q.includes("legal advice");
    if (unknownQuery) {
      return {
        answer:
          "I don't know. Please consult a broker or legal professional.",
        confidence: 0,
        citations: [],
        unknown: true,
      };
    }
    const mockResponse: QAResponse = {
      answer:
        "Based on the selected policy documents, coverage typically applies when the incident is reported within 30 days. Exclusions may apply for intentional acts.",
      confidence: 85,
      citations: [
        {
          policyName: policyIds[0] ? "Policy.pdf" : "Sample Policy.pdf",
          page: 12,
          snippet: "...reported within 30 days of discovery...",
        },
        {
          policyName: policyIds[0] ? "Policy.pdf" : "Sample Policy.pdf",
          page: 14,
          snippet: "...intentional acts are excluded...",
        },
      ],
      unknown: false,
    };
    return mockResponse;
  }
  const res = await fetch(`${API_BASE}/api/qa`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      question,
      jurisdiction,
      policy_ids: policyIds,
    }),
  });
  if (!res.ok) throw new Error("Failed to get answer");
  return res.json();
}

export async function askAndRecord(
  question: string,
  jurisdiction: string,
  policyIds: string[]
): Promise<QAResult> {
  const response = await askQuestion(question, jurisdiction, policyIds);
  const result: QAResult = {
    question,
    jurisdiction,
    response,
    askedAt: new Date().toISOString(),
  };
  appendAudit(result);
  return result;
}

export function isMockMode(): boolean {
  return MOCK_MODE;
}

export function exportAuditJson(): string {
  return JSON.stringify(getAuditHistory(), null, 2);
}
