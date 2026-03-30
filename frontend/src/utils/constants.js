                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               /**
 * constants.js
 * ------------
 * App-wide constants derived strictly from the backend models and enums.
 *
 * Sources:
 *   - CourseSubject.Semester (enum)
 *   - Schedule.ScheduleStatus (enum)
 *   - Subject.SubjectType (enum)
 *   - Subject.SessionType (enum)
 *   - Room.RoomType (enum)
 *   - User.UserType (enum)
 *   - StudentSchedule.AssignmentType (enum)
 *   - ConflictLog.ConflictType (enum)
 *   - Course.DegreeLevel (enum)
 */

// ── API ───────────────────────────────────────────────────────────────────────

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080/api/v1";

// ── Roles (User.UserType) ─────────────────────────────────────────────────────

export const ROLES = {
  ADMIN:   "ADMIN",
  TEACHER: "TEACHER",
  STUDENT: "STUDENT",
};

// ── Semesters (CourseSubject.Semester) ────────────────────────────────────────

export const SEMESTERS = {
  FIRST:  "FIRST",
  SECOND: "SECOND",
  SUMMER: "SUMMER",
};

/** Human-readable labels for semester values */
export const SEMESTER_LABELS = {
  FIRST:  "1st Semester",
  SECOND: "2nd Semester",
  SUMMER: "Summer",
};

/** Ordered array for dropdowns */
export const SEMESTER_OPTIONS = [
  { value: "FIRST",  label: "1st Semester" },
  { value: "SECOND", label: "2nd Semester" },
  { value: "SUMMER", label: "Summer" },
];

// ── Schedule status (Schedule.ScheduleStatus) ─────────────────────────────────

export const SCHEDULE_STATUS = {
  DRAFT:      "DRAFT",
  PUBLISHED:  "PUBLISHED",
  CONFLICTED: "CONFLICTED",
};

// ── Subject types (Subject.SubjectType) ───────────────────────────────────────

export const SUBJECT_TYPE = {
  MAJOR: "MAJOR",
  MINOR: "MINOR",
};

export const SUBJECT_TYPE_OPTIONS = [
  { value: "MAJOR", label: "Major" },
  { value: "MINOR", label: "Minor" },
];

// ── Session types (Subject.SessionType) ───────────────────────────────────────

export const SESSION_TYPE = {
  LECTURE:    "LECTURE",
  LABORATORY: "LABORATORY",
};

export const SESSION_TYPE_OPTIONS = [
  { value: "LECTURE",    label: "Lecture" },
  { value: "LABORATORY", label: "Laboratory" },
];

// ── Room types (Room.RoomType) ────────────────────────────────────────────────

export const ROOM_TYPE = {
  LECTURE:    "LECTURE",
  LABORATORY: "LABORATORY",
};

export const ROOM_TYPE_OPTIONS = [
  { value: "LECTURE",    label: "Lecture Room" },
  { value: "LABORATORY", label: "Laboratory" },
];

// ── Assignment types (StudentSchedule.AssignmentType) ─────────────────────────

export const ASSIGNMENT_TYPE = {
  REGULAR:   "REGULAR",
  IRREGULAR: "IRREGULAR",
};

// ── Conflict types (ConflictLog.ConflictType) ─────────────────────────────────

export const CONFLICT_TYPE = {
  TEACHER_DOUBLE_BOOKED: "TEACHER_DOUBLE_BOOKED",
  ROOM_DOUBLE_BOOKED:    "ROOM_DOUBLE_BOOKED",
  STUDENT_TIME_CONFLICT: "STUDENT_TIME_CONFLICT",
  TEACHER_UNAVAILABLE:   "TEACHER_UNAVAILABLE",
  WRONG_ROOM_TYPE:       "WRONG_ROOM_TYPE",
  WRONG_CAMPUS:          "WRONG_CAMPUS",
  WRONG_DEPARTMENT:      "WRONG_DEPARTMENT",
};

/** Human-readable conflict type labels */
export const CONFLICT_TYPE_LABELS = {
  TEACHER_DOUBLE_BOOKED: "Teacher Double-Booked",
  ROOM_DOUBLE_BOOKED:    "Room Double-Booked",
  STUDENT_TIME_CONFLICT: "Student Time Conflict",
  TEACHER_UNAVAILABLE:   "Teacher Unavailable",
  WRONG_ROOM_TYPE:       "Wrong Room Type",
  WRONG_CAMPUS:          "Wrong Campus",
  WRONG_DEPARTMENT:      "Wrong Department",
};

// ── Degree levels (Course.DegreeLevel) ───────────────────────────────────────

export const DEGREE_LEVEL = {
  BACHELOR:  "BACHELOR",
  MASTER:    "MASTER",
  ASSOCIATE: "ASSOCIATE",
};

// ── Days of week (Timeslot.dayOfWeek — Java DayOfWeek) ────────────────────────

export const DAYS = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

export const DAY_LABELS = {
  MONDAY:    "Monday",
  TUESDAY:   "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY:  "Thursday",
  FRIDAY:    "Friday",
  SATURDAY:  "Saturday",
};

export const DAY_SHORT = {
  MONDAY:    "Mon",
  TUESDAY:   "Tue",
  WEDNESDAY: "Wed",
  THURSDAY:  "Thu",
  FRIDAY:    "Fri",
  SATURDAY:  "Sat",
};

// ── Local storage keys (matches AuthContext.jsx) ──────────────────────────────

export const STORAGE_KEYS = {
  TOKEN: "tc_token",
  USER:  "tc_user",
};

// ── Schedule generation defaults ──────────────────────────────────────────────

export const GENERATION_DEFAULTS = {
  clearDraftsFirst: true,
  autoPublish:      false,
};

// ── Subject duration (enforced by backend CHECK constraint) ───────────────────

export const SUBJECT_DURATION_MINS    = 90;
export const SUBJECT_SESSIONS_PER_WEEK = 2;
export const DEFAULT_UNITS             = 3;
export const DEFAULT_MAX_STUDENTS      = 45;                                                                                                                                         