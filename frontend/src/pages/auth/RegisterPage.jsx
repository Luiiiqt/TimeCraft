import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import api from "../../services/api";

// ── Constants ─────────────────────────────────────────────────────────────────
const YEAR_LEVELS = [
  { value: 1, label: "1st Year" },
  { value: 2, label: "2nd Year" },
  { value: 3, label: "3rd Year" },
  { value: 4, label: "4th Year" },
];

const SECTION_OPTIONS = ["A", "B", "C", "D", "E", "F"];

// ── Step definitions ──────────────────────────────────────────────────────────
const STEPS = ["Account", "Profile", "Academic"];

// ── Initial form state ────────────────────────────────────────────────────────
const INITIAL = {
  fullName      : "",
  schoolId      : "",
  email         : "",
  password      : "",
  confirmPassword: "",
  departmentId  : "",
  courseId      : "",
  yearLevel     : "",
  section       : "",
  isIrregular   : false,
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const navigate       = useNavigate();
  const { register }   = useAuth();

  // Form state
  const [step, setStep]           = useState(0);
  const [form, setForm]           = useState(INITIAL);
  const [errors, setErrors]       = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState("");
  const [showPass, setShowPass]   = useState(false);
  const [success, setSuccess]     = useState(false);

  // Lookup data
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses]         = useState([]);
  const [deptLoading, setDeptLoading] = useState(false);
  const [courseLoading, setCourseLoading] = useState(false);

  // ── Fetch departments on mount ────────────────────────────────────────────
  useEffect(() => {
    const fetchDepts = async () => {
      setDeptLoading(true);
      try {
        const res  = await api.get("/departments");
        const data = res.data?.data ?? res.data;
        setDepartments(Array.isArray(data) ? data : []);
      } catch {
        setDepartments([]);
      } finally {
        setDeptLoading(false);
      }
    };
    fetchDepts();
  }, []);

  // ── Fetch courses when department changes ─────────────────────────────────
  useEffect(() => {
    if (!form.departmentId) { setCourses([]); return; }

    const fetchCourses = async () => {
      setCourseLoading(true);
      try {
        const res  = await api.get(`/departments/${form.departmentId}/courses`);
        const data = res.data?.data ?? res.data;
        setCourses(Array.isArray(data) ? data : []);
      } catch {
        setCourses([]);
      } finally {
        setCourseLoading(false);
      }
    };
    fetchCourses();

    // Reset dependent fields
    setForm((prev) => ({ ...prev, courseId: "" }));
  }, [form.departmentId]);

  // ── Field change ──────────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
      // clear section when switching to irregular
      ...(name === "isIrregular" && checked ? { section: "" } : {}),
    }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
    setGlobalError("");
  };

  // ── Per-step validation ───────────────────────────────────────────────────
  const validateStep = () => {
    const errs = {};

    if (step === 0) {
      if (!form.fullName.trim())   errs.fullName = "Full name is required.";
      if (!form.schoolId.trim())   errs.schoolId = "School ID is required.";
      if (!form.email.trim())      errs.email    = "Email is required.";
      else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = "Enter a valid email.";
    }

    if (step === 1) {
      if (!form.password)          errs.password = "Password is required.";
      else if (form.password.length < 8) errs.password = "Minimum 8 characters.";
      if (form.confirmPassword !== form.password) errs.confirmPassword = "Passwords do not match.";
    }

    if (step === 2) {
      if (!form.departmentId)      errs.departmentId = "Select a department.";
      if (!form.courseId)          errs.courseId     = "Select a course.";
      if (!form.yearLevel)         errs.yearLevel    = "Select a year level.";
      if (!form.isIrregular && !form.section) errs.section = "Select a section.";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const nextStep = () => { if (validateStep()) setStep((s) => s + 1); };
  const prevStep = () => setStep((s) => s - 1);

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep()) return;

    setSubmitting(true);
    setGlobalError("");
    try {
      await register({
        fullName    : form.fullName.trim(),
        schoolId    : form.schoolId.trim(),
        email       : form.email.trim(),
        password    : form.password,
        departmentId: Number(form.departmentId),
        courseId    : Number(form.courseId),
        yearLevel   : Number(form.yearLevel),
        section     : form.isIrregular ? null : form.section,
        isIrregular : form.isIrregular,
      });
      setSuccess(true);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error    ||
        "Registration failed. Please try again.";
      setGlobalError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Success screen ────────────────────────────────────────────────────────
  if (success) {
    return (
      <div style={styles.page}>
        <div style={styles.successCard}>
          <div style={styles.successIcon}>✓</div>
          <h2 style={styles.successTitle}>Account created!</h2>
          <p style={styles.successMsg}>
            Your student account has been successfully registered. You can now sign in.
          </p>
          <button style={styles.submitBtn} onClick={() => navigate("/login")}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.cardHeader}>
          <div style={styles.logo}>
            <span>⏱</span>
            <span style={styles.logoText}>TimeCraft</span>
          </div>
          <h1 style={styles.heading}>Create your account</h1>
          <p style={styles.subheading}>Student registration</p>
        </div>

        {/* Step indicator */}
        <div style={styles.stepper}>
          {STEPS.map((label, i) => (
            <div key={i} style={styles.stepItem}>
              <div style={{
                ...styles.stepCircle,
                backgroundColor: i <= step ? palette.primary : palette.border,
                color: i <= step ? palette.white : palette.muted,
              }}>
                {i < step ? "✓" : i + 1}
              </div>
              <span style={{
                ...styles.stepLabel,
                color: i === step ? palette.primary : palette.muted,
                fontWeight: i === step ? "600" : "400",
              }}>{label}</span>
              {i < STEPS.length - 1 && (
                <div style={{
                  ...styles.stepLine,
                  backgroundColor: i < step ? palette.primary : palette.border,
                }} />
              )}
            </div>
          ))}
        </div>

        {/* Global error */}
        {globalError && (
          <div style={styles.errorBanner} role="alert">
            <span>⚠</span> {globalError}
          </div>
        )}

        <form onSubmit={step === 2 ? handleSubmit : (e) => { e.preventDefault(); nextStep(); }} noValidate>

          {/* ── Step 0: Account info ─────────────────────────────────── */}
          {step === 0 && (
            <div style={styles.fields}>
              <Field label="Full name" error={errors.fullName}>
                <input name="fullName" value={form.fullName} onChange={handleChange}
                  style={fieldInputStyle(errors.fullName)} placeholder="Juan Dela Cruz" />
              </Field>
              <Field label="School ID" error={errors.schoolId}>
                <input name="schoolId" value={form.schoolId} onChange={handleChange}
                  style={fieldInputStyle(errors.schoolId)} placeholder="2024-00001" />
              </Field>
              <Field label="Email address" error={errors.email}>
                <input name="email" type="email" value={form.email} onChange={handleChange}
                  style={fieldInputStyle(errors.email)} placeholder="you@school.edu" />
              </Field>
            </div>
          )}

          {/* ── Step 1: Password ─────────────────────────────────────── */}
          {step === 1 && (
            <div style={styles.fields}>
              <Field label="Password" error={errors.password}
                hint="Minimum 8 characters">
                <div style={styles.passwordWrapper}>
                  <input name="password" type={showPass ? "text" : "password"}
                    value={form.password} onChange={handleChange}
                    style={{ ...fieldInputStyle(errors.password), paddingRight: "3rem" }}
                    placeholder="••••••••" />
                  <button type="button" onClick={() => setShowPass((p) => !p)}
                    style={styles.eyeBtn} tabIndex={-1}>
                    {showPass ? "🙈" : "👁"}
                  </button>
                </div>
              </Field>
              <Field label="Confirm password" error={errors.confirmPassword}>
                <input name="confirmPassword" type={showPass ? "text" : "password"}
                  value={form.confirmPassword} onChange={handleChange}
                  style={fieldInputStyle(errors.confirmPassword)}
                  placeholder="••••••••" />
              </Field>
            </div>
          )}

          {/* ── Step 2: Academic info ────────────────────────────────── */}
          {step === 2 && (
            <div style={styles.fields}>
              <Field label="Department" error={errors.departmentId}>
                <select name="departmentId" value={form.departmentId} onChange={handleChange}
                  style={fieldInputStyle(errors.departmentId)} disabled={deptLoading}>
                  <option value="">{deptLoading ? "Loading…" : "Select department"}</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </Field>

              <Field label="Course" error={errors.courseId}>
                <select name="courseId" value={form.courseId} onChange={handleChange}
                  style={fieldInputStyle(errors.courseId)}
                  disabled={!form.departmentId || courseLoading}>
                  <option value="">
                    {!form.departmentId ? "Select department first"
                      : courseLoading ? "Loading…"
                      : "Select course"}
                  </option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
                  ))}
                </select>
              </Field>

              <Field label="Year level" error={errors.yearLevel}>
                <select name="yearLevel" value={form.yearLevel} onChange={handleChange}
                  style={fieldInputStyle(errors.yearLevel)}>
                  <option value="">Select year level</option>
                  {YEAR_LEVELS.map((y) => (
                    <option key={y.value} value={y.value}>{y.label}</option>
                  ))}
                </select>
              </Field>

              {/* Irregular checkbox */}
              <div style={styles.checkRow}>
                <input type="checkbox" id="isIrregular" name="isIrregular"
                  checked={form.isIrregular} onChange={handleChange}
                  style={{ accentColor: palette.primary, width: "16px", height: "16px" }} />
                <label htmlFor="isIrregular" style={styles.checkLabel}>
                  I am an irregular student
                </label>
              </div>

              {!form.isIrregular && (
                <Field label="Section" error={errors.section}>
                  <select name="section" value={form.section} onChange={handleChange}
                    style={fieldInputStyle(errors.section)}>
                    <option value="">Select section</option>
                    {SECTION_OPTIONS.map((s) => (
                      <option key={s} value={s}>Section {s}</option>
                    ))}
                  </select>
                </Field>
              )}
            </div>
          )}

          {/* ── Navigation buttons ────────────────────────────────────── */}
          <div style={styles.navBtns}>
            {step > 0 && (
              <button type="button" onClick={prevStep} style={styles.backBtn}
                disabled={submitting}>
                ← Back
              </button>
            )}
            {step < 2 ? (
              <button type="submit" style={{ ...styles.submitBtn, flex: 1 }}>
                Continue →
              </button>
            ) : (
              <button type="submit"
                disabled={submitting}
                style={{
                  ...styles.submitBtn,
                  flex: 1,
                  opacity: submitting ? 0.7 : 1,
                  cursor: submitting ? "not-allowed" : "pointer",
                }}>
                {submitting ? "Creating account…" : "Create account"}
              </button>
            )}
          </div>
        </form>

        <p style={styles.loginLink}>
          Already have an account?{" "}
          <Link to="/login" style={styles.link}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}

// ── Field wrapper component ───────────────────────────────────────────────────

function Field({ label, error, hint, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
      <label style={styles.label}>{label}</label>
      {children}
      {hint  && !error && <span style={styles.hint}>{hint}</span>}
      {error && <span style={styles.fieldError}>{error}</span>}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const fieldInputStyle = (error) => ({
  ...styles.input,
  borderColor: error ? palette.error : palette.border,
});

// ── Styles ────────────────────────────────────────────────────────────────────

const palette = {
  primary  : "#1a56db",
  bg       : "#f8faff",
  white    : "#ffffff",
  text     : "#111827",
  muted    : "#6b7280",
  border   : "#d1d5db",
  error    : "#dc2626",
  errorBg  : "#fef2f2",
  success  : "#16a34a",
  successBg: "#f0fdf4",
};

const styles = {
  page: {
    minHeight      : "100vh",
    backgroundColor: palette.bg,
    display        : "flex",
    alignItems     : "center",
    justifyContent : "center",
    padding        : "2rem 1rem",
    fontFamily     : "'Sora', 'Segoe UI', sans-serif",
  },
  card: {
    width          : "100%",
    maxWidth       : "480px",
    backgroundColor: palette.white,
    borderRadius   : "16px",
    padding        : "2rem 2.5rem",
    boxShadow      : "0 4px 32px rgba(0,0,0,0.08)",
  },
  cardHeader: {
    marginBottom   : "1.5rem",
  },
  logo: {
    display        : "flex",
    alignItems     : "center",
    gap            : "0.4rem",
    marginBottom   : "0.75rem",
    fontSize       : "1.3rem",
  },
  logoText: {
    fontWeight     : "700",
    color          : "#0f2057",
    letterSpacing  : "-0.02em",
  },
  heading: {
    fontSize       : "1.5rem",
    fontWeight     : "700",
    color          : palette.text,
    margin         : "0 0 0.2rem",
    letterSpacing  : "-0.02em",
  },
  subheading: {
    fontSize       : "0.9rem",
    color          : palette.muted,
    margin         : 0,
  },
  // Stepper
  stepper: {
    display        : "flex",
    alignItems     : "center",
    marginBottom   : "1.75rem",
    gap            : 0,
  },
  stepItem: {
    display        : "flex",
    alignItems     : "center",
    flex           : 1,
    position       : "relative",
  },
  stepCircle: {
    width          : "28px",
    height         : "28px",
    borderRadius   : "50%",
    display        : "flex",
    alignItems     : "center",
    justifyContent : "center",
    fontSize       : "0.75rem",
    fontWeight     : "700",
    flexShrink     : 0,
    transition     : "background-color 0.2s",
  },
  stepLabel: {
    fontSize       : "0.75rem",
    marginLeft     : "0.4rem",
    whiteSpace     : "nowrap",
    transition     : "color 0.2s",
  },
  stepLine: {
    flex           : 1,
    height         : "2px",
    margin         : "0 0.4rem",
    transition     : "background-color 0.2s",
  },
  // Fields
  fields: {
    display        : "flex",
    flexDirection  : "column",
    gap            : "1rem",
    marginBottom   : "1.5rem",
  },
  label: {
    fontSize       : "0.85rem",
    fontWeight     : "600",
    color          : palette.text,
  },
  input: {
    padding        : "0.65rem 0.9rem",
    border         : `1.5px solid ${palette.border}`,
    borderRadius   : "8px",
    fontSize       : "0.93rem",
    color          : palette.text,
    outline        : "none",
    width          : "100%",
    boxSizing      : "border-box",
    backgroundColor: palette.white,
  },
  hint: {
    fontSize       : "0.78rem",
    color          : palette.muted,
  },
  fieldError: {
    fontSize       : "0.78rem",
    color          : palette.error,
    fontWeight     : "500",
  },
  passwordWrapper: {
    position       : "relative",
  },
  eyeBtn: {
    position       : "absolute",
    right          : "0.75rem",
    top            : "50%",
    transform      : "translateY(-50%)",
    background     : "none",
    border         : "none",
    cursor         : "pointer",
    fontSize       : "1rem",
    padding        : 0,
  },
  checkRow: {
    display        : "flex",
    alignItems     : "center",
    gap            : "0.5rem",
  },
  checkLabel: {
    fontSize       : "0.9rem",
    color          : palette.text,
    cursor         : "pointer",
  },
  // Nav buttons
  navBtns: {
    display        : "flex",
    gap            : "0.75rem",
    marginBottom   : "1rem",
  },
  backBtn: {
    padding        : "0.75rem 1.1rem",
    backgroundColor: "transparent",
    border         : `1.5px solid ${palette.border}`,
    borderRadius   : "8px",
    fontSize       : "0.9rem",
    fontWeight     : "600",
    color          : palette.muted,
    cursor         : "pointer",
  },
  submitBtn: {
    padding        : "0.75rem",
    backgroundColor: palette.primary,
    color          : palette.white,
    border         : "none",
    borderRadius   : "8px",
    fontSize       : "0.95rem",
    fontWeight     : "600",
    cursor         : "pointer",
  },
  errorBanner: {
    display        : "flex",
    alignItems     : "center",
    gap            : "0.5rem",
    backgroundColor: palette.errorBg,
    color          : palette.error,
    border         : `1px solid ${palette.error}30`,
    borderRadius   : "8px",
    padding        : "0.7rem 1rem",
    fontSize       : "0.875rem",
    marginBottom   : "1rem",
  },
  loginLink: {
    textAlign      : "center",
    fontSize       : "0.875rem",
    color          : palette.muted,
    marginTop      : "0.5rem",
  },
  link: {
    color          : palette.primary,
    fontWeight     : "600",
    textDecoration : "none",
  },
  // Success screen
  successCard: {
    textAlign      : "center",
    backgroundColor: palette.white,
    borderRadius   : "16px",
    padding        : "3rem 2rem",
    maxWidth       : "400px",
    width          : "100%",
    boxShadow      : "0 4px 32px rgba(0,0,0,0.08)",
  },
  successIcon: {
    width          : "64px",
    height         : "64px",
    borderRadius   : "50%",
    backgroundColor: palette.successBg,
    color          : palette.success,
    fontSize       : "2rem",
    display        : "flex",
    alignItems     : "center",
    justifyContent : "center",
    margin         : "0 auto 1.25rem",
  },
  successTitle: {
    fontSize       : "1.5rem",
    fontWeight     : "700",
    color          : palette.text,
    margin         : "0 0 0.5rem",
  },
  successMsg: {
    color          : palette.muted,
    fontSize       : "0.92rem",
    lineHeight     : "1.6",
    marginBottom   : "1.75rem",
  },
};