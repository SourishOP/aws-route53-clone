"use client";

import { useState } from "react";
import { Modal } from "./Modal";
import { api } from "@/lib/api";
import { useFlash } from "./FlashbarProvider";
import { RECORD_TYPES, type DnsRecord, type RecordType } from "@/lib/types";

interface Props {
  zoneId: string;
  zoneName: string;
  record?: DnsRecord | null; // if provided, edit mode
  onClose: () => void;
  onSaved: () => void;
}

const VALUE_HINTS: Record<RecordType, string> = {
  A: "IPv4 address, e.g. 192.0.2.1",
  AAAA: "IPv6 address, e.g. 2001:db8::1",
  CNAME: "Canonical name, e.g. example.com.",
  TXT: 'Text value, e.g. "v=spf1 include:_spf.example.com ~all"',
  MX: "Priority and mail server, e.g. 10 mail.example.com.",
  NS: "Name server, e.g. ns-1.awsdns-00.org.",
  PTR: "Domain name, e.g. host.example.com.",
  SRV: "Priority weight port target, e.g. 1 10 5060 sip.example.com.",
  CAA: 'Flags tag value, e.g. 0 issue "amazon.com"',
  SOA: "Primary NS, admin, serial refresh retry expire minimum",
};

export function RecordModal({
  zoneId,
  zoneName,
  record,
  onClose,
  onSaved,
}: Props) {
  const flash = useFlash();
  const isEdit = !!record;

  const [name, setName] = useState(record?.name ?? "");
  const [type, setType] = useState<RecordType>((record?.type as RecordType) ?? "A");
  const [ttl, setTtl] = useState(record?.ttl ?? 300);
  const [value, setValue] = useState(record?.value ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!value.trim()) {
      setError("Value is required.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      if (isEdit && record) {
        await api.updateRecord(zoneId, record.id, {
          name,
          type,
          ttl,
          value,
        });
        flash.success("Record updated successfully.");
      } else {
        await api.createRecord(zoneId, { name, type, ttl, value });
        flash.success("Record created successfully.");
      }
      onSaved();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={isEdit ? "Edit record" : "Create record"}
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button
            className="btn btn--primary"
            onClick={submit}
            disabled={submitting}
          >
            {submitting
              ? "Saving…"
              : isEdit
              ? "Save changes"
              : "Create record"}
          </button>
        </>
      }
    >
      <div className="form-field">
        <label htmlFor="rec-name">Record name</label>
        <div className="hint">
          Leave blank or use <strong>@</strong> for the zone apex ({zoneName}).
          Subdomains are appended to the zone name automatically.
        </div>
        <input
          id="rec-name"
          type="text"
          placeholder={zoneName}
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isEdit}
        />
      </div>

      <div className="form-field">
        <label htmlFor="rec-type">Record type</label>
        <select
          id="rec-type"
          value={type}
          onChange={(e) => setType(e.target.value as RecordType)}
        >
          {RECORD_TYPES.map((t) => (
            <option key={t} value={t}>
              {t} – {typeLabel(t)}
            </option>
          ))}
        </select>
      </div>

      <div className="form-field">
        <label htmlFor="rec-value">Value</label>
        <div className="hint">{VALUE_HINTS[type]}</div>
        <textarea
          id="rec-value"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={VALUE_HINTS[type]}
        />
        <div className="hint">Enter multiple values on separate lines.</div>
      </div>

      <div className="form-field">
        <label htmlFor="rec-ttl">TTL (seconds)</label>
        <input
          id="rec-ttl"
          type="number"
          min={0}
          value={ttl}
          onChange={(e) => setTtl(Number(e.target.value))}
        />
      </div>

      {error && <div className="field-error">{error}</div>}
    </Modal>
  );
}

function typeLabel(t: RecordType): string {
  const labels: Record<RecordType, string> = {
    A: "IPv4 address",
    AAAA: "IPv6 address",
    CNAME: "Canonical name",
    TXT: "Text",
    MX: "Mail exchange",
    NS: "Name server",
    PTR: "Pointer",
    SRV: "Service locator",
    CAA: "Certificate authority authorization",
    SOA: "Start of authority",
  };
  return labels[t];
}
