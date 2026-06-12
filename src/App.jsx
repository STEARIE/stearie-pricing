import { useState } from "react";

const RULES = {
  lm: {
    label: "Labor + materials",
    subtypes: [
      { label: "Standard job", min: 50, max: 55 },
      { label: "Moderate complexity", min: 55, max: 60 },
      { label: "Small job (under ~$5K)", min: 60, max: 70 },
    ],
  },
  mhm: {
    label: "Minor home modification (MHM)",
    subtypes: [
      { label: "Standard job", min: 50, max: 55 },
      { label: "Moderate complexity", min: 55, max: 60 },
      { label: "Small job (under ~$5K)", min: 60, max: 70 },
    ],
  },
  lift: {
    label: "Accessibility lift / equipment",
    subtypes: [
      { label: "Standard install", min: 55, max: 65 },
      { label: "Complex install", min: 65, max: 75 },
      { label: "High complexity", min: 75, max: 90 },
    ],
  },
  lo: {
    label: "Labor only",
    subtypes: [
      { label: "Straightforward", min: 70, max: 80 },
      { label: "Coordination heavy", min: 80, max: 90 },
      { label: "Small / high-touch", min: 90, max: 100 },
    ],
  },
};

const fmt = (n) =>
  "$" + Math.round(n).toLocaleString("en-US");

const initialForm = {
  jobName: "",
  serviceType: "",
  subTypeIdx: 0,
  cost: "",
  markup: 55,
  justification: "",
};

export default function App() {
  const [form, setForm] = useState(initialForm);
  const [submitted, setSubmitted] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);

  const SHEET_URL = "https://script.google.com/macros/s/AKfycbx3-E1j5yrZjOlgPGnVfsjA-WADRQf-1tt_siDTiYwD61RslsTfSg8n5CnPj1e-PukbHQ/exec";

  const rule = form.serviceType ? RULES[form.serviceType] : null;
  const tier = rule ? rule.subtypes[form.subTypeIdx] : null;
  const cost = parseFloat(form.cost) || 0;
  const price = cost * (1 + form.markup / 100);
  const profit = price - cost;
  const inRange = tier ? form.markup >= tier.min && form.markup <= tier.max : null;
  const canSubmit =
    form.serviceType && cost > 0 && (inRange || form.justification.trim().length > 0);

  function handleTypeChange(e) {
    setForm((f) => ({
      ...f,
      serviceType: e.target.value,
      subTypeIdx: 0,
      markup: e.target.value ? RULES[e.target.value].subtypes[0].min : 55,
      justification: "",
    }));
    setSubmitted(null);
  }

  function handleSubChange(e) {
    const idx = parseInt(e.target.value);
    const newTier = RULES[form.serviceType].subtypes[idx];
    setForm((f) => ({
      ...f,
      subTypeIdx: idx,
      markup: newTier.min,
      justification: "",
    }));
  }

  function handleMarkup(e) {
    setForm((f) => ({ ...f, markup: parseInt(e.target.value) }));
  }

  async function submitJob() {
    if (!canSubmit) return;
    setSaving(true);
    setSaveError(false);
    const now = new Date().toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
    });
    const payload = {
      date: now,
      jobName: form.jobName || "Untitled job",
      serviceType: rule.label,
      tier: tier.label,
      cost: cost.toFixed(2),
      price: price.toFixed(2),
      profit: profit.toFixed(2),
      markup: form.markup + "%",
      status: inRange ? "Approved" : "Justified",
      justification: form.justification || "",
    };
    try {
      await fetch(SHEET_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setSubmitted({ ...payload, inRange, serviceLabel: rule.label, tierLabel: tier.label, markup: form.markup, cost, price, profit });
      setForm(initialForm);
    } catch {
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: 680, margin: "0 auto", padding: "1.5rem 1rem" }}>

      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: "#185FA5", display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <svg width="20" height="20" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 16, color: "#111" }}>STEARIE Pricing Calculator</div>
            <div style={{ fontSize: 12, color: "#888" }}>Calculate markup · Check approval · Submit job</div>
          </div>
        </div>
      </div>

      {/* Job Details Card */}
      <div style={card}>
        <div style={sectionTitle}>Job details</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={labelStyle}>Job name</label>
            <input
              type="text"
              placeholder="e.g. Smith residence lift install"
              value={form.jobName}
              onChange={e => setForm(f => ({ ...f, jobName: e.target.value }))}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Service type</label>
            <select value={form.serviceType} onChange={handleTypeChange} style={inputStyle}>
              <option value="">— select —</option>
              <option value="lm">Labor + materials</option>
              <option value="mhm">Minor home modification (MHM)</option>
              <option value="lift">Accessibility lift / equipment</option>
              <option value="lo">Labor only</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Total cost ($)</label>
            <input
              type="number"
              min="0"
              placeholder="0.00"
              value={form.cost}
              onChange={e => setForm(f => ({ ...f, cost: e.target.value }))}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ ...labelStyle, visibility: form.serviceType ? "visible" : "hidden" }}>
              Complexity / tier
            </label>
            <select
              value={form.subTypeIdx}
              onChange={handleSubChange}
              style={{ ...inputStyle, visibility: form.serviceType ? "visible" : "hidden" }}
            >
              {rule && rule.subtypes.map((s, i) => (
                <option key={i} value={i}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Markup + Results Card */}
      {form.serviceType && (
        <div style={card}>
          <div style={sectionTitle}>Markup</div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
            <input
              type="range"
              min={40} max={120} step={1}
              value={form.markup}
              onChange={handleMarkup}
              style={{ flex: 1, accentColor: "#185FA5" }}
            />
            <span style={{ fontSize: 18, fontWeight: 600, minWidth: 52, color: "#111" }}>
              {form.markup}%
            </span>
          </div>

          {tier && (
            <div style={{ fontSize: 12, color: "#888", marginBottom: "1rem" }}>
              Standard range for this tier: <strong>{tier.min}–{tier.max}%</strong>
            </div>
          )}

          {/* Metrics */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: "1rem" }}>
            {[
              { label: "Cost", val: cost ? fmt(cost) : "—" },
              { label: "Price", val: cost ? fmt(price) : "—" },
              { label: "Profit", val: cost ? fmt(profit) : "—" },
            ].map(m => (
              <div key={m.label} style={metricCard}>
                <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>{m.label}</div>
                <div style={{ fontSize: 20, fontWeight: 600, color: "#111" }}>{m.val}</div>
              </div>
            ))}
          </div>

          {/* Status bar */}
          {cost > 0 && inRange !== null && (
            <div style={{
              ...statusBar,
              background: inRange ? "#EAF3DE" : "#FCEBEB",
              color: inRange ? "#27500A" : "#791F1F",
              border: `0.5px solid ${inRange ? "#97C459" : "#F09595"}`,
            }}>
              <span style={{ fontSize: 18 }}>{inRange ? "✓" : "⚠"}</span>
              <span style={{ fontWeight: 500 }}>
                {inRange
                  ? "Within range — approved"
                  : `Outside range (${tier.min}–${tier.max}%) — justification required`}
              </span>
            </div>
          )}

          {/* Justification */}
          {cost > 0 && inRange === false && (
            <div style={{ marginTop: "0.75rem" }}>
              <label style={labelStyle}>Explain why this markup is outside the standard range</label>
              <textarea
                rows={3}
                placeholder="e.g. Competitive bid, client relationship, manager approved..."
                value={form.justification}
                onChange={e => setForm(f => ({ ...f, justification: e.target.value }))}
                style={{ ...inputStyle, resize: "vertical" }}
              />
            </div>
          )}

          {saveError && (
            <div style={{ fontSize: 13, color: "#791F1F", marginBottom: 8 }}>
              ⚠ Could not save to Google Sheets. Please try again.
            </div>
          )}

          <button
            onClick={submitJob}
            disabled={!canSubmit || saving}
            style={{
              ...submitBtn,
              opacity: canSubmit && !saving ? 1 : 0.4,
              cursor: canSubmit && !saving ? "pointer" : "not-allowed",
            }}
          >
            {saving ? "Saving to Sheets..." : "Submit job"}
          </button>
        </div>
      )}

      {/* Tier Reference */}
      {form.serviceType && rule && (
        <div style={card}>
          <div style={sectionTitle}>Standard ranges — {rule.label}</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                {["Tier", "Markup range", "Multiplier"].map(h => (
                  <th key={h} style={{ textAlign: "left", fontWeight: 500, fontSize: 12, color: "#888", padding: "6px 8px", borderBottom: "0.5px solid #e5e5e5" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rule.subtypes.map((s, i) => (
                <tr key={i} style={{
                  background: i === form.subTypeIdx ? "#E6F1FB" : "transparent",
                }}>
                  <td style={{ padding: "7px 8px", borderBottom: "0.5px solid #f0f0f0", color: i === form.subTypeIdx ? "#185FA5" : "#333", fontWeight: i === form.subTypeIdx ? 500 : 400 }}>{s.label}</td>
                  <td style={{ padding: "7px 8px", borderBottom: "0.5px solid #f0f0f0", color: i === form.subTypeIdx ? "#185FA5" : "#333" }}>{s.min}–{s.max}%</td>
                  <td style={{ padding: "7px 8px", borderBottom: "0.5px solid #f0f0f0", color: i === form.subTypeIdx ? "#185FA5" : "#888" }}>x{(1 + s.min / 100).toFixed(2)}–x{(1 + s.max / 100).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Submitted confirmation */}
      {submitted && (
        <div style={{ ...card, borderColor: "#97C459", background: "#F6FCF0" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#3B6D11", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.04em" }}>
            ✓ Submitted — {submitted.date}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 16px", fontSize: 13, marginBottom: submitted.justification ? 12 : 0 }}>
            {[
              ["Job", submitted.jobName],
              ["Type", submitted.serviceLabel],
              ["Tier", submitted.tierLabel],
              ["Markup", `${submitted.markup}% — ${submitted.inRange ? "✓ approved" : "⚠ justified"}`],
              ["Cost", fmt(submitted.cost)],
              ["Price", fmt(submitted.price)],
              ["Profit", fmt(submitted.profit)],
            ].map(([k, v]) => (
              <div key={k}><span style={{ color: "#888" }}>{k}: </span><span style={{ color: "#111", fontWeight: 500 }}>{v}</span></div>
            ))}
          </div>
          {submitted.justification && (
            <div style={{ fontSize: 13, color: "#555", borderTop: "0.5px solid #c5e8a0", paddingTop: 10 }}>
              <span style={{ fontWeight: 500, color: "#333" }}>Justification: </span>{submitted.justification}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const card = {
  background: "#fff",
  border: "0.5px solid #e5e5e5",
  borderRadius: 12,
  padding: "1.25rem",
  marginBottom: "1rem",
};

const sectionTitle = {
  fontSize: 11,
  fontWeight: 600,
  color: "#999",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  marginBottom: 14,
};

const labelStyle = {
  display: "block",
  fontSize: 12,
  color: "#888",
  marginBottom: 5,
};

const inputStyle = {
  width: "100%",
  padding: "8px 10px",
  fontSize: 14,
  border: "0.5px solid #d5d5d5",
  borderRadius: 8,
  background: "#fff",
  color: "#111",
  outline: "none",
  boxSizing: "border-box",
};

const metricCard = {
  background: "#f7f7f7",
  borderRadius: 8,
  padding: "0.75rem 1rem",
};

const statusBar = {
  borderRadius: 8,
  padding: "0.75rem 1rem",
  marginBottom: "0.75rem",
  display: "flex",
  alignItems: "center",
  gap: 10,
  fontSize: 14,
};

const submitBtn = {
  width: "100%",
  padding: "10px",
  fontSize: 14,
  fontWeight: 500,
  borderRadius: 8,
  border: "0.5px solid #d5d5d5",
  background: "#185FA5",
  color: "#fff",
  marginTop: "0.5rem",
};
