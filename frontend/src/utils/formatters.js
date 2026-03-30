import {
  SEMESTER_LABELS,
  DAY_LABELS,
  DAY_SHORT,
  CONFLICT_TYPE_LABELS,
  SCHEDULE_STATUS,
} from "./constants";

/**
 * formatters.js
 * -------------
 * Display helpers for data coming from the backend.
 * All functions are pure — no side effects, no API calls.
 *
 * Covers:
 *   - Time formatting   (LocalTime from Timeslot)
 *   - Date formatting   (LocalDateTime from Schedule/ConflictLog)
 *   - Semester labels   (CourseSubject.Semester)
 *   - Day labels        (DayOfWeek from Timeslot)
 *   - School year       (e.g. "2024-2025")
 *   - Name helpers      (initials, truncation)
 *   - Status badges     (Schedule.ScheduleStatus)
 *   - Conflict types    (ConflictLog.ConflictType)
 *   - Section display   (matches Section.getDisplayLabel())
 *   - Year level        (e.g. "1st Year")
 */

// ── Time ──────────────────────────────────────────────────────────────────────

/**
 * Convert a 24-hour time string (from LocalTime.toString()) to 12-hour format.
 *
 * @param {string} time24 - e.g. "07:30" | "13:00" | "07:30:00"
 * @returns {string} e.g. "7:30 AM" | "1:00 PM"
 *
 * @example
 * formatTime("07:30")  // "7:30 AM"
 * formatTime("13:30")  // "1:30 PM"
 * formatTime(null)     // ""
 */
export const formatTime = (time24) => {
  if (!time24) return "";
  const [h, m] = time24.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = (h % 12) || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
};

/**
 * Format a time range from two 24-hour strings.
 *
 * @param {string} start - e.g. "07:30"
 * @param {string} end   - e.g. "09:00"
 * @returns {string} e.g. "7:30 – 9:00 AM"
 *
 * @example
 * formatTimeRange("07:30", "09:00") // "7:30 – 9:00 AM"
 */
export const formatTimeRange = (start, end) => {
  if (!start || !end) return "";
  return `${formatTime(start)} – ${formatTime(end)}`;
};

/**
 * Format a timeslot label showing day + time range.
 *
 * @param {string} day   - e.g. "MONDAY"
 * @param {string} start - e.g. "07:30"
 * @param {string} end   - e.g. "09:00"
 * @param {boolean} [short=false] - use short day label
 * @returns {string} e.g. "Monday 7:30 – 9:00 AM"
 *
 * @example
 * formatTimeslot("MONDAY", "07:30", "09:00")        // "Monday 7:30 – 9:00 AM"
 * formatTimeslot("MONDAY", "07:30", "09:00", true)  // "Mon 7:30 – 9:00 AM"
 */
export const formatTimeslot = (day, start, end, short = false) => {
  const dayLabel = short ? (DAY_SHORT[day] ?? day) : (DAY_LABELS[day] ?? day);
  return `${dayLabel} ${formatTimeRange(start, end)}`;
};

// ── Date / DateTime ───────────────────────────────────────────────────────────

/**
 * Format a LocalDateTime string from the backend.
 *
 * @param {string} dateTimeStr - ISO string e.g. "2024-08-01T10:30:00"
 * @param {object} [options]   - Intl.DateTimeFormat options
 * @returns {string}
 *
 * @example
 * formatDateTime("2024-08-01T10:30:00")
 * // "Aug 1, 2024, 10:30 AM"
 */
export const formatDateTime = (dateTimeStr, options = {}) => {
  if (!dateTimeStr) return "";
  const defaults = {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true,
  };
  return new Date(dateTimeStr).toLocaleString("en-US", { ...defaults, ...options });
};

/**
 * Format a date only (no time).
 *
 * @param {string} dateTimeStr
 * @returns {string} e.g. "Aug 1, 2024"
 */
export const formatDate = (dateTimeStr) => {
  if (!dateTimeStr) return "";
  return new Date(dateTimeStr).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
};

/**
 * Returns a relative time string (e.g. "2 hours ago").
 *
 * @param {string} dateTimeStr
 * @returns {string}
 */
export const formatRelativeTime = (dateTimeStr) => {
  if (!dateTimeStr) return "";
  const diff = Date.now() - new Date(dateTimeStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days  = Math.floor(hours / 24);
  if (mins  <  1) return "Just now";
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

// ── Semester / Term ───────────────────────────────────────────────────────────

/**
 * Convert a semester enum value to a human-readable label.
 *
 * @param {string} semester - "FIRST" | "SECOND" | "SUMMER"
 * @returns {string} e.g. "1st Semester"
 */
export const formatSemester = (semester) =>
  SEMESTER_LABELS[semester] ?? semester ?? "—";

/**
 * Format a full term label combining semester and school year.
 *
 * @param {string} semester   - "FIRST" | "SECOND" | "SUMMER"
 * @param {string} schoolYear - e.g. "2024-2025"
 * @returns {string} e.g. "1st Semester 2024-2025"
 */
export const formatTerm = (semester, schoolYear) =>
  `${formatSemester(semester)} ${schoolYear ?? ""}`.trim();

/**
 * Generate a list of school year strings for dropdowns.
 *
 * @param {number} [range=5] - how many years to include
 * @returns {string[]} e.g. ["2022-2023", "2023-2024", "2024-2025", ...]
 */
export const getSchoolYearOptions = (range = 5) => {
  const current = new Date().getFullYear();
  return Array.from({ length: range }, (_, i) => {
    const y = current - 1 + i;
    return `${y}-${y + 1}`;
  });
};

/**
 * Returns the current default term based on today's month.
 * Jun–Oct → FIRST semester; otherwise → SECOND.
 *
 * @returns {{ semester: string, schoolYear: string }}
 */
export const getCurrentTerm = () => {
  const now   = new Date();
  const month = now.getMonth() + 1;
  const year  = now.getFullYear();
  return {
    semester:   month >= 6 && month <= 10 ? "FIRST" : "SECOND",
    schoolYear: `${year}-${year + 1}`,
  };
};

// ── Day of week ───────────────────────────────────────────────────────────────

/**
 * Convert a DayOfWeek enum value to a full label.
 * @param {string} day - e.g. "MONDAY"
 * @returns {string} e.g. "Monday"
 */
export const formatDay = (day) => DAY_LABELS[day] ?? day ?? "—";

/**
 * Convert a DayOfWeek enum value to a short label.
 * @param {string} day - e.g. "MONDAY"
 * @returns {string} e.g. "Mon"
 */
export const formatDayShort = (day) => DAY_SHORT[day] ?? day ?? "—";

// ── Year level ────────────────────────────────────────────────────────────────

/**
 * Format a numeric year level as an ordinal string.
 *
 * @param {number} level - 1–5
 * @returns {string} e.g. "1st Year" | "2nd Year"
 *
 * @example
 * formatYearLevel(1) // "1st Year"
 * formatYearLevel(3) // "3rd Year"
 */
export const formatYearLevel = (level) => {
  if (!level) return "—";
  const suffixes = ["th", "st", "nd", "rd"];
  const suffix = suffixes[level] ?? "th";
  return `${level}${suffix} Year`;
};

// ── Section display ───────────────────────────────────────────────────────────

/**
 * Format a section display label — mirrors Section.getDisplayLabel() on the backend.
 *
 * @param {object} section - { courseCode, yearLevel, sectionName, semester, schoolYear }
 * @returns {string} e.g. "BSIT 1-A 1st Sem 2024-2025"
 *
 * @example
 * formatSectionLabel({ courseCode:"BSIT", yearLevel:1, sectionName:"A", semester:"FIRST", schoolYear:"2024-2025" })
 * // "BSIT 1-A 1st Sem 2024-2025"
 */
export const formatSectionLabel = ({ courseCode, yearLevel, sectionName, semester, schoolYear } = {}) => {
  const sem = semester === "FIRST" ? "1st Sem" : semester === "SECOND" ? "2nd Sem" : "Summer";
  return `${courseCode ?? "?"} ${yearLevel ?? "?"}-${sectionName ?? "?"} ${sem} ${schoolYear ?? ""}`.trim();
};

// ── Schedule status ───────────────────────────────────────────────────────────

/**
 * Returns CSS class name for a schedule status badge.
 * Matches the .status-* classes defined in App.css.
 *
 * @param {string} status - "DRAFT" | "PUBLISHED" | "CONFLICTED"
 * @returns {string} CSS class name
 */
export const getStatusClass = (status) => {
  switch (status) {
    case SCHEDULE_STATUS.PUBLISHED:  return "status-published";
    case SCHEDULE_STATUS.CONFLICTED: return "status-conflicted";
    case SCHEDULE_STATUS.DRAFT:      return "status-draft";
    default:                         return "status-draft";
  }
};

// ── Conflict type ─────────────────────────────────────────────────────────────

/**
 * Convert a ConflictType enum to a human-readable label.
 *
 * @param {string} type - e.g. "TEACHER_DOUBLE_BOOKED"
 * @returns {string} e.g. "Teacher Double-Booked"
 */
export const formatConflictType = (type) =>
  CONFLICT_TYPE_LABELS[type] ?? type ?? "—";

// ── Names ─────────────────────────────────────────────────────────────────────

/**
 * Extract initials from a full name (max 2 characters).
 *
 * @param {string} fullName - e.g. "Juan dela Cruz"
 * @returns {string} e.g. "JC"
 */
export const getInitials = (fullName) => {
  if (!fullName) return "?";
  return fullName
    .split(" ")
    .filter(Boolean)
    .map(w => w[0].toUpperCase())
    .slice(0, 2)
    .join("");
};

/**
 * Truncate a string to a max length, appending "…" if needed.
 *
 * @param {string} str
 * @param {number} [max=40]
 * @returns {string}
 */
export const truncate = (str, max = 40) => {
  if (!str) return "";
  return str.length > max ? str.slice(0, max) + "…" : str;
};

// ── Numbers ───────────────────────────────────────────────────────────────────

/**
 * Format a percentage from a numerator and denominator.
 *
 * @param {number} value
 * @param {number} total
 * @param {number} [decimals=0]
 * @returns {string} e.g. "75%"
 */
export const formatPercent = (value, total, decimals = 0) => {
  if (!total || total === 0) return "0%";
  return `${((value / total) * 100).toFixed(decimals)}%`;
};