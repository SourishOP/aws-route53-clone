import type {
  User,
  HostedZone,
  DnsRecord,
  Paginated,
} from "./types";

const BASE = "/api";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.detail) {
        detail = Array.isArray(body.detail)
          ? body.detail.map((d: { msg: string }) => d.msg).join(", ")
          : body.detail;
      }
    } catch {
      /* ignore */
    }
    const err = new Error(detail) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ---------- Auth ----------
export const api = {
  login: (username: string, password: string) =>
    request<User>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),

  logout: () => request<{ message: string }>("/auth/logout", { method: "POST" }),

  me: () => request<User>("/auth/me"),

  // ---------- Sessions (workspaces) ----------
  listSessions: () =>
    request<{ id: string; name: string; zone_count: number }[]>(
      "/auth/sessions"
    ),

  createSession: (name: string) =>
    request<{ id: string; name: string; zone_count: number }>(
      "/auth/sessions",
      { method: "POST", body: JSON.stringify({ name }) }
    ),

  activateSession: (session_id: string) =>
    request<User>("/auth/sessions/activate", {
      method: "POST",
      body: JSON.stringify({ session_id }),
    }),

  // ---------- Hosted Zones ----------
  listZones: (params: {
    search?: string;
    name?: string;
    type?: string;
    created_by?: string;
    description?: string;
    zone_id?: string;
    record_count?: string;
    page?: number;
    page_size?: number;
    sort?: string;
    order?: string;
  }) => {
    const qs = new URLSearchParams();
    if (params.search) qs.set("search", params.search);
    if (params.name) qs.set("name", params.name);
    if (params.type) qs.set("type", params.type);
    if (params.created_by) qs.set("created_by", params.created_by);
    if (params.description) qs.set("description", params.description);
    if (params.zone_id) qs.set("zone_id", params.zone_id);
    if (params.record_count) qs.set("record_count", params.record_count);
    qs.set("page", String(params.page ?? 1));
    qs.set("page_size", String(params.page_size ?? 10));
    if (params.sort) qs.set("sort", params.sort);
    if (params.order) qs.set("order", params.order);
    return request<Paginated<HostedZone>>(`/hosted-zones?${qs.toString()}`);
  },

  getZone: (id: string) => request<HostedZone>(`/hosted-zones/${id}`),

  createZone: (data: { name: string; type: string; comment: string }) =>
    request<HostedZone>("/hosted-zones", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateZone: (id: string, data: { comment: string }) =>
    request<HostedZone>(`/hosted-zones/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteZone: (id: string) =>
    request<void>(`/hosted-zones/${id}`, { method: "DELETE" }),

  // ---------- DNS Records ----------
  listRecords: (
    zoneId: string,
    params: {
      search?: string;
      type?: string;
      name?: string;
      value?: string;
      routing_policy?: string;
      ttl?: string;
      page?: number;
      page_size?: number;
      sort?: string;
      order?: string;
    }
  ) => {
    const qs = new URLSearchParams();
    if (params.search) qs.set("search", params.search);
    if (params.type) qs.set("type", params.type);
    if (params.name) qs.set("name", params.name);
    if (params.value) qs.set("value", params.value);
    if (params.routing_policy) qs.set("routing_policy", params.routing_policy);
    if (params.ttl) qs.set("ttl", params.ttl);
    qs.set("page", String(params.page ?? 1));
    qs.set("page_size", String(params.page_size ?? 10));
    if (params.sort) qs.set("sort", params.sort);
    if (params.order) qs.set("order", params.order);
    return request<Paginated<DnsRecord>>(
      `/hosted-zones/${zoneId}/records?${qs.toString()}`
    );
  },

  createRecord: (
    zoneId: string,
    data: {
      name: string;
      type: string;
      ttl: number;
      value: string;
      routing_policy?: string;
    }
  ) =>
    request<DnsRecord>(`/hosted-zones/${zoneId}/records`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateRecord: (
    zoneId: string,
    recordId: string,
    data: Partial<{
      name: string;
      type: string;
      ttl: number;
      value: string;
      routing_policy: string;
    }>
  ) =>
    request<DnsRecord>(`/hosted-zones/${zoneId}/records/${recordId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteRecord: (zoneId: string, recordId: string) =>
    request<void>(`/hosted-zones/${zoneId}/records/${recordId}`, {
      method: "DELETE",
    }),

  // ---------- Import / Export ----------
  importRecords: (zoneId: string, content: string) =>
    request<{ created: number; skipped: number; errors: string[] }>(
      `/hosted-zones/${zoneId}/import`,
      { method: "POST", body: JSON.stringify({ content }) }
    ),

  exportZone: async (
    zoneId: string,
    format: "json" | "bind"
  ): Promise<{ filename: string; content: string }> => {
    const res = await fetch(
      `${BASE}/hosted-zones/${zoneId}/export?format=${format}`,
      { credentials: "include" }
    );
    if (!res.ok) {
      throw new Error(`Export failed (${res.status})`);
    }
    const content = await res.text();
    let filename = `zone.${format === "bind" ? "zone" : "json"}`;
    const cd = res.headers.get("Content-Disposition");
    const match = cd && /filename="?([^"]+)"?/.exec(cd);
    if (match) filename = match[1];
    return { filename, content };
  },
};
