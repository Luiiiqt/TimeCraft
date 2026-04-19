-- ============================================================
-- V4.5: Subjects and Course Subjects
-- ============================================================

CREATE TABLE subjects (
    id                      BIGSERIAL       PRIMARY KEY,
    department_id           BIGINT          REFERENCES departments(id) ON DELETE RESTRICT,
    code                    VARCHAR(30)     NOT NULL UNIQUE,
    name                    VARCHAR(150)    NOT NULL,
    units                   SMALLINT        NOT NULL DEFAULT 3,
    hours_per_week          SMALLINT        NOT NULL DEFAULT 3,
    session_type            VARCHAR(15)     NOT NULL DEFAULT 'LECTURE'
                                            CHECK (session_type IN ('LECTURE', 'LABORATORY', 'BOTH')),
    is_shared               BOOLEAN         NOT NULL DEFAULT FALSE,
    is_active               BOOLEAN         NOT NULL DEFAULT TRUE,
    prerequisite_subject_id BIGINT          REFERENCES subjects(id) ON DELETE SET NULL,
    created_at              TIMESTAMP       NOT NULL DEFAULT NOW()
);

CREATE TABLE course_subjects (
    id          BIGSERIAL   PRIMARY KEY,
    course_id   BIGINT      NOT NULL REFERENCES courses(id)   ON DELETE CASCADE,
    subject_id  BIGINT      NOT NULL REFERENCES subjects(id)  ON DELETE CASCADE,
    year_level  SMALLINT    NOT NULL CHECK (year_level BETWEEN 1 AND 5),
    semester    VARCHAR(20) NOT NULL CHECK (semester IN ('1st','2nd','Summer')),
    is_shared   BOOLEAN     NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_course_subject UNIQUE (course_id, subject_id, year_level, semester)
);