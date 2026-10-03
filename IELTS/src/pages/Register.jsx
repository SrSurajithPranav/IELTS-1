import React, { useState } from "react";
import { authAPI, API_BASE_URL } from "../services/api";
import "./landing.css";

export default function RegisterPage({ onNavigate }) {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      setError("Please complete all fields.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await authAPI.register(form.name.trim(), form.email.trim(), form.password);
      onNavigate("/sign-in");
    } catch (err) {
      setError(err.message || "Unable to create your account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <button className="auth-brand" onClick={() => onNavigate("/")}>IELTS<span>Pro</span></button>
        <div className="auth-card">
          <p className="landing-eyebrow">Start your plan</p>
          <h1>Create your account</h1>
          <p className="auth-subtitle">Set up your IELTS routine and take the next clear step.</p>
          <form onSubmit={submit} className="auth-form">
            <label>Name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" autoComplete="name" /></label>
            <label>Email<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" autoComplete="email" /></label>
            <label>Password<input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="At least 8 characters" autoComplete="new-password" /></label>
            {error && <p className="auth-error" role="alert">{error}</p>}
            <button className="landing-button landing-button-primary auth-submit" disabled={loading}>{loading ? "Creating account…" : "Create my account ↗"}</button>
          </form>
          <p className="auth-switch">Already have an account? <button onClick={() => onNavigate("/sign-in")}>Sign in</button></p>
          {import.meta.env.DEV && <small className="auth-api">API: {API_BASE_URL}</small>}
        </div>
      </div>
    </div>
  );
}
