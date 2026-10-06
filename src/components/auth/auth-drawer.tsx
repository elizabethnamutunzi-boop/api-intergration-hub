"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { roleLabel } from "@/types/auth";

type AuthMode = "login" | "register";

export function AuthDrawer() {
  const { user, drawerOpen, closeDrawer, login, register, requestLogout } = useAuth();
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const usernameRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!drawerOpen) {
      return;
    }

    const previous = document.activeElement;
    if (user) {
      closeRef.current?.focus();
    } else if (mode === "register") {
      nameRef.current?.focus();
    } else {
      usernameRef.current?.focus();
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeDrawer();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", onKeyDown);
      if (previous instanceof HTMLElement) {
        previous.focus();
      }
    };
  }, [closeDrawer, drawerOpen, mode, user]);

  function resetForm() {
    setName("");
    setUsername("");
    setPassword("");
    setConfirmPassword("");
    setError("");
  }

  function switchMode(next: AuthMode) {
    setMode(next);
    setError("");
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    try {
      const result = await login(username, password);
      if (!result.ok) {
        setError(result.message ?? "Invalid username or password.");
        return;
      }
      resetForm();
    } catch {
      setError("Unable to sign in. Please try again.");
    } finally {
      setPending(false);
    }
  }

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setPending(true);
    try {
      const result = await register({ name, username, password });
      if (!result.ok) {
        setError(result.message ?? "Unable to create the account.");
        return;
      }
      resetForm();
    } catch {
      setError("Unable to create the account. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={`auth-layer ${drawerOpen ? "open" : ""}`} aria-hidden={!drawerOpen} inert={!drawerOpen}>
      <div className="auth-overlay" onClick={closeDrawer} />
      <aside className="auth-drawer" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <header className="auth-drawer-head">
          <div>
            <p className="eyebrow">Account</p>
            <h2 id={titleId}>{user ? "Your session" : mode === "register" ? "Create account" : "Log in"}</h2>
          </div>
          <button ref={closeRef} type="button" className="dismiss-button" onClick={closeDrawer}>
            Close
          </button>
        </header>

        {user ? (
          <div className="auth-drawer-body">
            <div className={`user-avatar lg role-${user.role}`} aria-hidden="true">
              {user.initials}
            </div>
            <p className="auth-user-name">{user.name}</p>
            <p className="auth-user-meta">Logged in as {roleLabel(user.role)}</p>
            <p className="auth-user-email">@{user.username}</p>
            <p className="token-note">A session token is stored in localStorage so you stay signed in on this device.</p>
            <ul className="auth-permissions">
              <li>Export CSV and JSON snapshots</li>
              <li>Create watchlist items</li>
              <li>Delete watchlist items</li>
              {user.role === "admin" ? <li>Admin: clear the entire watchlist</li> : null}
            </ul>
            <button type="button" className="retry-button auth-signout" onClick={requestLogout}>
              Log out
            </button>
          </div>
        ) : mode === "register" ? (
          <form className="auth-drawer-body login-form" onSubmit={handleRegister}>
            <p className="auth-lead">Create an account to unlock export and watchlist tools. We store a login token locally for the next visit.</p>
            <label className="field-label" htmlFor="register-name">
              Display name
            </label>
            <input
              ref={nameRef}
              id="register-name"
              name="name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setError("");
              }}
              className="auth-input"
              required
            />
            <label className="field-label" htmlFor="register-username">
              Username
            </label>
            <input
              id="register-username"
              name="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(event) => {
                setUsername(event.target.value);
                setError("");
              }}
              className="auth-input"
              required
            />
            <label className="field-label" htmlFor="register-password">
              Password
            </label>
            <input
              id="register-password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setError("");
              }}
              className="auth-input"
              required
              minLength={6}
            />
            <label className="field-label" htmlFor="register-confirm">
              Confirm password
            </label>
            <input
              id="register-confirm"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => {
                setConfirmPassword(event.target.value);
                setError("");
              }}
              className="auth-input"
              required
              minLength={6}
            />
            {error ? (
              <p className="login-error" role="alert">
                {error}
              </p>
            ) : null}
            <button type="submit" className="retry-button auth-signout" disabled={pending}>
              {pending ? "Creating…" : "Create account"}
            </button>
            <p className="auth-switch">
              Already have an account?{" "}
              <button type="button" className="text-link" onClick={() => switchMode("login")}>
                Log in
              </button>
            </p>
          </form>
        ) : (
          <form className="auth-drawer-body login-form" onSubmit={handleLogin}>
            <p className="auth-lead">Log in with your username and password.</p>
            <label className="field-label" htmlFor="login-username">
              Username
            </label>
            <input
              ref={usernameRef}
              id="login-username"
              name="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(event) => {
                setUsername(event.target.value);
                setError("");
              }}
              className="auth-input"
              required
            />
            <label className="field-label" htmlFor="login-password">
              Password
            </label>
            <input
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setError("");
              }}
              className="auth-input"
              required
            />
            {error ? (
              <p className="login-error" role="alert">
                {error}
              </p>
            ) : null}
            <button type="submit" className="retry-button auth-signout" disabled={pending}>
              {pending ? "Signing in…" : "Log in"}
            </button>
            <p className="auth-switch">
              New here?{" "}
              <button type="button" className="text-link" onClick={() => switchMode("register")}>
                Create account
              </button>
            </p>
          </form>
        )}
      </aside>
    </div>
  );
}
