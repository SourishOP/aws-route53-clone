export interface User {
  id: string;
  username: string;
  account_id: string;
}

export interface HostedZone {
  id: string;
  zone_id: string;
  name: string;
  type: "Public" | "Private";
  comment: string;
  private: boolean;
  record_count: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export const RECORD_TYPES = [
  "A",
  "AAAA",
  "CNAME",
  "TXT",
  "MX",
  "NS",
  "PTR",
  "SRV",
  "CAA",
] as const;

export type RecordType = (typeof RECORD_TYPES)[number];

export interface DnsRecord {
  id: string;
  zone_id: string;
  name: string;
  type: RecordType;
  ttl: number;
  value: string;
  routing_policy: string;
  created_at: string;
  updated_at: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}
