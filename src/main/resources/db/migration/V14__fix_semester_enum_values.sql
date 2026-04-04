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