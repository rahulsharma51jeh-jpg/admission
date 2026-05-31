// Tiny client-side fetch helper that understands the API envelope.
export interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: unknown;
}

export async function postJSON<T>(
  url: string,
  body: unknown
): Promise<ApiEnvelope<T>> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function patchJSON<T>(
  url: string,
  body: unknown
): Promise<ApiEnvelope<T>> {
  const res = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function getJSON<T>(url: string): Promise<ApiEnvelope<T>> {
  const res = await fetch(url, { cache: "no-store" });
  return res.json();
}
