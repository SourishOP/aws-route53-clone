"use client";

import { useState } from "react";
import { Modal } from "./Modal";
import { api } from "@/lib/api";
import { useFlash } from "./FlashbarProvider";
import type { HostedZone } from "@/lib/types";

interface Props {
  zone: HostedZone;
  onClose: () => void;
  onSaved: (zone: HostedZone) => void;
}

export function EditZoneModal({ zone, onClose, onSaved }: Props) {
  const flash = useFlash();
  const [comment, setComment] = useState(zone.comment);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const updated = await api.updateZone(zone.id, { comment });
      flash.success(`Hosted zone ${updated.name} updated.`);
      onSaved(updated);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="Edit hosted zone"
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
            {submitting ? "Saving…" : "Save changes"}
          </button>
        </>
      }
    >
      <div className="form-field">
        <label>Domain name</label>
        <input type="text" value={zone.name} disabled />
      </div>
      <div className="form-field">
        <label htmlFor="edit-comment">Description</label>
        <textarea
          id="edit-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </div>
      {error && <div className="field-error">{error}</div>}
    </Modal>
  );
}
