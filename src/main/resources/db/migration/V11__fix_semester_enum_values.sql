UPDATE schedules         SET semester = 'FIRST'  WHERE semester = '1st';
UPDATE schedules         SET semester = 'SECOND' WHERE semester = '2nd';
UPDATE schedules         SET semester = 'SUMMER' WHERE semester = 'Summer';

UPDATE sections          SET semester = 'FIRST'  WHERE semester = '1st';
UPDATE sections          SET semester = 'SECOND' WHERE semester = '2nd';
UPDATE sections          SET semester = 'SUMMER' WHERE semester = 'Summer';

UPDATE course_subjects   SET semester = 'FIRST'  WHERE semester = '1st';
UPDATE course_subjects   SET semester = 'SECOND' WHERE semester = '2nd';
UPDATE course_subjects   SET semester = 'SUMMER' WHERE semester = 'Summer';

UPDATE teacher_subject_preferences SET semester = 'FIRST'  WHERE semester = '1st';
UPDATE teacher_subject_preferences SET semester = 'SECOND' WHERE semester = '2nd';
UPDATE teacher_subject_preferences SET semester = 'SUMMER' WHERE semester = 'Summer';

UPDATE subject_assignments SET semester = 'FIRST'  WHERE semester = '1st';
UPDATE subject_assignments SET semester = 'SECOND' WHERE semester = '2nd';
UPDATE subject_assignments SET semester = 'SUMMER' WHERE semester = 'Summer';

-- Fix constraints to match new enum values
ALTER TABLE schedules DROP CONSTRAINT IF EXISTS schedules_semester_check;
ALTER TABLE schedules ADD CONSTRAINT schedules_semester_check
    CHECK (semester IN ('FIRST','SECOND','SUMMER'));

ALTER TABLE sections DROP CONSTRAINT IF EXISTS sections_semester_check;
ALTER TABLE sections ADD CONSTRAINT sections_semester_check
    CHECK (semester IN ('FIRST','SECOND','SUMMER'));

ALTER TABLE course_subjects DROP CONSTRAINT IF EXISTS course_subjects_semester_check;
ALTER TABLE course_subjects ADD CONSTRAINT course_subjects_semester_check
    CHECK (semester IN ('FIRST','SECOND','SUMMER'));

ALTER TABLE teacher_subject_preferences DROP CONSTRAINT IF EXISTS chk_tsp_semester;
ALTER TABLE teacher_subject_preferences ADD CONSTRAINT chk_tsp_semester
    CHECK (semester IN ('FIRST','SECOND','SUMMER'));

ALTER TABLE subject_assignments DROP CONSTRAINT IF EXISTS subject_assignments_semester_check;
ALTER TABLE subject_assignments ADD CONSTRAINT subject_assignments_semester_check
    CHECK (semester IN ('FIRST','SECOND','SUMMER'));

ALTER TABLE merged_sections DROP CONSTRAINT IF EXISTS merged_sections_semester_check;
ALTER TABLE merged_sections ADD CONSTRAINT merged_sections_semester_check
    CHECK (semester IN ('FIRST','SECOND','SUMMER'));

ALTER TABLE student_checklists DROP CONSTRAINT IF EXISTS student_checklists_semester_check;
ALTER TABLE student_checklists ADD CONSTRAINT student_checklists_semester_check
    CHECK (semester IN ('FIRST','SECOND','SUMMER'));