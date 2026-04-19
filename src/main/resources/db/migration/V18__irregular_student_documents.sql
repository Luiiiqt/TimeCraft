-- ============================================================
-- V18: Irregular Student Registration Documents & Status
--
--  Tracks uploaded TOR, COG, transfer credentials.
--  Adds application_status to student_profiles.
-- ============================================================

ALTER TABLE student_profiles
    ADD COLUMN IF NOT EXISTS application_status VARCHAR(20) NOT NULL DEFAULT 'APPROVED'
        CHECK (application_status IN ('PENDING', 'FOR_INTERVIEW', 'APPROVED', 'REJECTED')),
    ADD COLUMN IF NOT EXISTS reviewed_by  BIGINT REFERENCES users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS reviewed_at  TIMESTAMP,
    ADD COLUMN IF NOT EXISTS notes        TEXT;

CREATE TABLE irregular_student_documents (
    id              BIGSERIAL       PRIMARY KEY,
    student_id      BIGINT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    document_type   VARCHAR(30)     NOT NULL
                        CHECK (document_type IN ('TOR', 'COG', 'TRANSFER_CREDENTIALS', 'OTHER')),
    file_path       TEXT            NOT NULL,
    original_name   VARCHAR(255)    NOT NULL,
    uploaded_at     TIMESTAMP       NOT NULL DEFAULT NOW(),
    verified        BOOLEAN         NOT NULL DEFAULT FALSE,
    verified_by     BIGINT          REFERENCES users(id) ON DELETE SET NULL,
    verified_at     TIMESTAMP
);

CREATE INDEX idx_isd_student_id    ON irregular_student_documents (student_id);
CREATE INDEX idx_isd_document_type ON irregular_student_documents (document_type);
CREATE INDEX idx_sp_app_status     ON student_profiles (application_status)
    WHERE application_status IN ('PENDING', 'FOR_INTERVIEW');

COMMENT ON TABLE irregular_student_documents IS 'Uploaded documents for irregular student registration — TOR, COG, transfer credentials';
COMMENT ON COLUMN student_profiles.application_status IS 'PENDING → FOR_INTERVIEW → APPROVED/REJECTED flow for irregular students';