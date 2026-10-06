"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Breadcrumb } from "@/components/Breadcrumb";
import { useFlash } from "@/components/FlashbarProvider";
import { InfoLink } from "@/components/icons";

export default function CreateHostedZonePage() {
  const router = useRouter();
  const flash = useFlash();
  const [name, setName] = useState("");
  const [type, setType] = useState<"Public" | "Private">("Public");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!name.trim()) {
      setError("Domain name is required.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const zone = await api.createZone({ name: name.trim(), type, comment });
      flash.success(`Hosted zone ${zone.name} created successfully.`);
      router.push("/hosted-zones");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Route 53", href: "/hosted-zones" },
          { label: "Hosted zones", href: "/hosted-zones" },
          { label: "Create hosted zone" },
        ]}
      />

      <div className="page-header">
        <div>
          <h1>Create hosted zone</h1>
        </div>
        <div className="page-header__actions">
          <button className="icon-btn" aria-label="Info">
            <InfoLink />
          </button>
          <button className="icon-btn" aria-label="Share">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
              <circle cx="4" cy="8" r="2" stroke="currentColor" strokeWidth="1.3" />
              <circle cx="12" cy="4" r="2" stroke="currentColor" strokeWidth="1.3" />
              <circle cx="12" cy="12" r="2" stroke="currentColor" strokeWidth="1.3" />
              <path d="M6 7l4-2M6 9l4 2" stroke="currentColor" strokeWidth="1.3" />
            </svg>
          </button>
        </div>
      </div>

      <div className="container-box">
        <div className="container-box__header">
          <h2>Hosted zone configuration</h2>
        </div>
        <div className="helper-line">
          A hosted zone is a container that holds information about how you want
          to route traffic for a domain, such as example.com, and its
          subdomains.
        </div>

        <div className="form-field">
          <label htmlFor="zone-name">
            Domain name <InfoLink />
          </label>
          <div className="hint">
            This is the name of the domain that you want to route traffic for.
          </div>
          <input
            id="zone-name"
            type="text"
            placeholder="example.com"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          <div className="valid-chars">
            Valid characters: a-z, 0-9, ! &quot; # $ % &amp; &apos; ( ) * + , - /
            : ; &lt; = &gt; ? @ [ \ ] ^ _ ` {"{"} | {"}"} . ~
          </div>
        </div>

        <div className="form-field">
          <label htmlFor="zone-comment">
            Description - optional <InfoLink />
          </label>
          <div className="hint">
            This value lets you distinguish hosted zones that have the same name.
          </div>
          <textarea
            id="zone-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="The hosted zone is used for..."
            maxLength={256}
          />
          <div className="char-counter">
            The description can have up to 256 characters. {comment.length}/256
          </div>
        </div>

        <div className="form-field">
          <label>
            Type <InfoLink />
          </label>
          <div className="hint">
            The type indicates whether you want to route traffic on the internet
            or in an Amazon VPC.
          </div>
          <div
            className="radio-card-group"
            style={{ display: "flex", gap: 12, flexWrap: "wrap" }}
          >
            <label
              className={`radio-card ${
                type === "Public" ? "radio-card--selected" : ""
              }`}
            >
              <input
                type="radio"
                name="zone-type"
                checked={type === "Public"}
                onChange={() => setType("Public")}
              />
              <div>
                <div className="radio-card__title">Public hosted zone</div>
                <div className="radio-card__desc">
                  A public hosted zone determines how traffic is routed on the
                  internet.
                </div>
              </div>
            </label>
            <label
              className={`radio-card ${
                type === "Private" ? "radio-card--selected" : ""
              }`}
            >
              <input
                type="radio"
                name="zone-type"
                checked={type === "Private"}
                onChange={() => setType("Private")}
              />
              <div>
                <div className="radio-card__title">Private hosted zone</div>
                <div className="radio-card__desc">
                  A private hosted zone determines how traffic is routed within
                  an Amazon VPC.
                </div>
              </div>
            </label>
          </div>
        </div>

        {error && <div className="field-error">{error}</div>}
      </div>

      <div className="container-box">
        <div className="container-box__header">
          <h2>
            Tags <InfoLink />
          </h2>
        </div>
        <div className="helper-line">
          Apply tags to hosted zones to help organize and identify them.
        </div>
        <div className="empty-state">
          No tags associated with the resource.
        </div>
        <button className="btn" onClick={() => {}}>
          Add new tag
        </button>
        <div className="helper-line" style={{ marginTop: 12 }}>
          You can add up to 50 more tags.
        </div>
      </div>

      <div className="form-actions">
        <button
          className="btn btn--link"
          onClick={() => router.push("/hosted-zones")}
          disabled={submitting}
        >
          Cancel
        </button>
        <button
          className="btn btn--create"
          onClick={submit}
          disabled={submitting}
        >
          {submitting ? "Creating…" : "Create hosted zone"}
        </button>
      </div>
    </div>
  );
}
