CREATE TABLE student_checklists (
    id            BIGINT       NOT NULL GENERATED ALWAYS AS IDENTITY,
    student_id    BIGINT       NOT NULL,
    subject_id    BIGINT       NOT NULL,
    semester      VARCHAR(20)  NOT NULL,
    academic_year VARCHAR(10)  NOT NULL,
    enrolled_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE (student_id, subject_id, semester, academic_year),
    CONSTRAINT fk_sc_student FOREIGN KEY (student_id) REFERENCES users(id)    ON DELETE CASCADE,
    CONSTRAINT fk_sc_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
);