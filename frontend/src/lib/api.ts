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

  // ---------- Hosted Zones ----------
  listZones: (params: {
    search?: string;
    page?: number;
    page_size?: number;
    sort?: string;
    order?: string;
  }) => {
    const qs = new URLSearchParams();
    if (params.search) qs.set("search", params.search);
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
      page?: number;
      page_size?: number;
      sort?: string;
      order?: string;
    }
  ) => {
    const qs = new URLSearchParams();
    if (params.search) qs.set("search", params.search);
    if (params.type) qs.set("type", params.type);
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
};
