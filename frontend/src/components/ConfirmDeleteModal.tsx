"use client";

import { useState } from "react";
import { Modal } from "./Modal";

interface Props {
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  requireText?: string; // if set, user must type this to enable delete
  onConfirm: () => Promise<void>;
  onClose: () => void;
}

export function ConfirmDeleteModal({
  title,
  message,
  confirmLabel = "Delete",
  requireText,
  onConfirm,
  onClose,
}: Props) {
  const [typed, setTyped] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const canDelete = requireText ? typed === requireText : true;

  const confirm = async () => {
    setSubmitting(true);
    setError("");
    try {
      await onConfirm();
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={title}
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button
            className="btn btn--primary"
            onClick={confirm}
            disabled={submitting || !canDelete}
            style={{ background: "#d91515", borderColor: "#d91515" }}
          >
            {submitting ? "Deleting…" : confirmLabel}
          </button>
        </>
      }
    >
      <div>{message}</div>
      {requireText && (
        <div className="form-field" style={{ marginTop: 16 }}>
          <label>
            To confirm, type <strong>{requireText}</strong>
          </label>
          <input
            type="text"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoFocus
          />
        </div>
      )}
      {error && <div className="field-error">{error}</div>}
    </Modal>
  );
}
