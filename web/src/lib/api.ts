const BASE_URL = "http://localhost:8000";

export const MAX_BOARD = 100;

export type Direction = "NORTH" | "EAST" | "SOUTH" | "WEST";

export type Probe = {
  id: string;
  x: number;
  y: number;
  direction: Direction;
  /** Top-right corner of the board this probe was launched on. */
  max_x: number;
  max_y: number;
};

/** FastAPI returns `detail` as a string (application errors) or as a list of
 *  objects (Pydantic validation failures). Translate both to readable text. */
export function describeError(status: number, body: unknown): string {
  const detail = (body as { detail?: unknown } | null)?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    const messages = detail.map((item) => item?.msg).filter(Boolean);
    if (messages.length > 0) return messages.join("; ");
  }
  return `Erro ${status}`;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(describeError(response.status, body));
  }
  return response.json();
}

export function launchProbe(x: number, y: number, direction: Direction) {
  return request<Probe>("/probes", {
    method: "POST",
    body: JSON.stringify({ x, y, direction }),
  });
}

export function sendCommands(probeId: string, commands: string) {
  return request<Probe>(`/probes/${probeId}/commands`, {
    method: "POST",
    body: JSON.stringify({ commands }),
  });
}

export function listProbes() {
  return request<{ probes: Probe[] }>("/probes");
}

export function resetProbes() {
  return request<{ probes: Probe[] }>("/probes", { method: "DELETE" });
}
