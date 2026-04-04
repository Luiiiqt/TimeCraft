CREATE TABLE section_config (
    id          BIGSERIAL    PRIMARY KEY,
    course_id   BIGINT       NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    year_level  SMALLINT     NOT NULL CHECK (year_level BETWEEN 1 AND 4),
    section_count SMALLINT   NOT NULL DEFAULT 1 CHECK (section_count >= 1),
    semester    VARCHAR(20)  NOT NULL,
    school_year VARCHAR(15)  NOT NULL,
    created_by  BIGINT       REFERENCES users(id),
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_section_config UNIQUE (course_id, year_level, semester, school_year)
);