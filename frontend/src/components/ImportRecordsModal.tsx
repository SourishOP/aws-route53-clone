"use client";

import { useState } from "react";
import { Modal } from "./Modal";
import { api } from "@/lib/api";
import { useFlash } from "./FlashbarProvider";

interface Props {
  zoneId: string;
  onClose: () => void;
  onImported: () => void;
}

export function ImportRecordsModal({ zoneId, onClose, onImported }: Props) {
  const flash = useFlash();
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setContent(await file.text());
  };

  const submit = async () => {
    if (!content.trim()) {
      setError("Paste a BIND zone file or choose a file to import.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await api.importRecords(zoneId, content);
      flash.success(
        `Imported ${res.created} record(s)${
          res.skipped ? `, skipped ${res.skipped}` : ""
        }.`
      );
      onImported();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="Import records from BIND zone file"
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button
            className="btn btn--create"
            onClick={submit}
            disabled={submitting}
          >
            {submitting ? "Importing…" : "Import records"}
          </button>
        </>
      }
    >
      <div className="form-field">
        <label htmlFor="import-file">Choose a zone file</label>
        <input id="import-file" type="file" accept=".zone,.txt,.db,text/plain" onChange={onFile} />
      </div>
      <div className="form-field">
        <label htmlFor="import-content">Or paste BIND zone file contents</label>
        <textarea
          id="import-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={"$TTL 300\nwww IN A 192.0.2.1\nmail IN MX 10 mail.example.com."}
          style={{ minHeight: 180, fontFamily: "monospace" }}
        />
      </div>
      {error && <div className="field-error">{error}</div>}
    </Modal>
  );
}
