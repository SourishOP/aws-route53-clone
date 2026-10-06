"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useFlash } from "@/components/FlashbarProvider";

export default function LoginPage() {
  const { login } = useAuth();
  const flash = useFlash();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await login(username, password);
      flash.success("Signed in successfully.");
    } catch (err) {
      setError((err as Error).message || "Sign in failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <svg width="72" height="43" viewBox="0 0 40 24" fill="none" aria-hidden>
            <path
              d="M11.5 13.2c0 .5.05.9.15 1.2.1.3.25.6.45.95.07.1.1.2.1.3 0 .13-.08.26-.25.4l-.82.55a.63.63 0 0 1-.34.12c-.13 0-.26-.06-.39-.18a4 4 0 0 1-.47-.6 10 10 0 0 1-.4-.76c-1 1.18-2.27 1.77-3.8 1.77-1.08 0-1.95-.31-2.58-.93-.63-.62-.95-1.45-.95-2.48 0-1.1.39-1.99 1.18-2.66.79-.67 1.84-1 3.18-1 .44 0 .9.04 1.38.1.48.07.98.17 1.5.3v-.95c0-.98-.2-1.66-.6-2.06-.42-.4-1.12-.59-2.12-.59-.45 0-.92.05-1.4.16-.48.11-.95.25-1.4.43a3.7 3.7 0 0 1-.46.17.8.8 0 0 1-.2.03c-.18 0-.27-.13-.27-.4v-.63c0-.2.03-.36.1-.45a.97.97 0 0 1 .38-.27c.45-.23 1-.43 1.63-.58a7.9 7.9 0 0 1 2.02-.24c1.54 0 2.66.35 3.38 1.05.71.7 1.07 1.76 1.07 3.18v4.19zm-5.25 1.97c.42 0 .86-.08 1.32-.23.46-.15.87-.43 1.21-.81.2-.24.36-.5.43-.8.08-.3.13-.66.13-1.08v-.52a11 11 0 0 0-1.2-.22 9.8 9.8 0 0 0-1.23-.08c-.88 0-1.52.17-1.95.52-.43.35-.64.85-.64 1.5 0 .62.16 1.08.48 1.39.31.32.76.47 1.35.47zm10.38 1.4c-.23 0-.38-.04-.48-.12-.1-.08-.19-.25-.26-.49l-2.95-9.7a2.2 2.2 0 0 1-.12-.5c0-.2.1-.3.3-.3h1.28c.24 0 .4.04.49.12.1.08.17.25.24.49l2.11 8.32 1.96-8.32c.06-.24.14-.41.23-.49.1-.08.27-.12.5-.12h1.04c.24 0 .4.04.5.12.1.08.18.25.23.49l1.98 8.42 2.17-8.42c.07-.24.15-.41.24-.49.1-.08.26-.12.49-.12h1.21c.2 0 .31.1.31.3 0 .06-.01.12-.02.2a1.8 1.8 0 0 1-.1.3l-3.02 9.7c-.07.24-.16.41-.26.49-.1.08-.26.12-.48.12h-1.12c-.24 0-.4-.04-.5-.12-.1-.09-.18-.26-.23-.5l-1.95-8.11-1.93 8.1c-.06.25-.14.42-.24.5-.1.09-.27.13-.5.13h-1.12zm16.6.35c-.68 0-1.35-.08-2-.23-.65-.16-1.16-.33-1.5-.52-.21-.12-.35-.25-.4-.37a.93.93 0 0 1-.08-.37v-.66c0-.27.1-.4.29-.4.08 0 .15.01.23.04l.33.14c.44.2.92.35 1.42.46.52.11 1.02.17 1.54.17.82 0 1.46-.14 1.9-.43.44-.29.67-.7.67-1.24 0-.37-.12-.68-.36-.93-.24-.25-.69-.48-1.34-.69l-1.93-.6c-.97-.31-1.69-.76-2.14-1.35a3.17 3.17 0 0 1-.67-1.92c0-.56.12-1.05.36-1.47.24-.42.56-.78.96-1.07.4-.3.86-.52 1.4-.68a5.9 5.9 0 0 1 1.7-.23c.3 0 .6.02.9.06.3.04.59.1.86.16.26.07.5.14.73.23.23.08.4.17.52.25.17.1.3.21.37.33.07.11.1.26.1.45v.61c0 .27-.1.41-.29.41a1.3 1.3 0 0 1-.48-.15 5.76 5.76 0 0 0-2.42-.49c-.74 0-1.33.12-1.73.36-.4.24-.6.61-.6 1.12 0 .37.13.69.4.94.26.25.75.5 1.45.72l1.9.6c.95.3 1.64.73 2.07 1.28.42.55.63 1.18.63 1.88 0 .57-.12 1.08-.35 1.53-.24.45-.56.84-.98 1.16-.42.33-.92.57-1.5.74a6.44 6.44 0 0 1-1.93.27z"
              fill="#232f3e"
            />
            <path
              d="M36.1 19.3c-4.37 3.23-10.72 4.95-16.18 4.95-7.65 0-14.55-2.83-19.76-7.54-.41-.37-.04-.87.45-.59 5.63 3.27 12.58 5.25 19.76 5.25 4.85 0 10.18-1.01 15.08-3.08.74-.32 1.36.48.65 1z"
              fill="#F90"
            />
            <path
              d="M37.93 17.22c-.56-.72-3.7-.34-5.11-.17-.43.05-.5-.32-.1-.6 2.5-1.76 6.6-1.25 7.08-.66.48.6-.13 4.7-2.47 6.66-.36.3-.7.14-.54-.26.53-1.3 1.7-4.26 1.14-4.97z"
              fill="#F90"
            />
          </svg>
        </div>
        <div className="login-box">
          <h1>Sign in</h1>
          <form onSubmit={onSubmit}>
            <div className="form-field">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
            </div>
            <div className="form-field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
            {error && (
              <div className="field-error" style={{ marginBottom: 12 }}>
                {error}
              </div>
            )}
            <button
              className="btn btn--primary"
              type="submit"
              style={{ width: "100%", justifyContent: "center" }}
              disabled={submitting}
            >
              {submitting ? "Signing in…" : "Sign in"}
            </button>
          </form>
          <div className="login-hint">
            Demo credentials: <strong>admin</strong> / <strong>admin</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
