package com.timecraft.timecraft.service;

import java.io.InputStream;
import java.io.InputStreamReader;
import java.time.LocalDateTime;
import java.util.List;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.opencsv.CSVReader;
import com.timecraft.timecraft.exception.ResourceNotFoundException;
import com.timecraft.timecraft.model.Course;
import com.timecraft.timecraft.model.CourseSubject;
import com.timecraft.timecraft.model.CourseSubject.Semester;
import com.timecraft.timecraft.model.Curriculum;
import com.timecraft.timecraft.model.Subject;
import com.timecraft.timecraft.model.User;
import com.timecraft.timecraft.repository.CourseRepository;
import com.timecraft.timecraft.repository.CourseSubjectRepository;
import com.timecraft.timecraft.repository.CurriculumRepository;
import com.timecraft.timecraft.repository.SubjectRepository;
import com.timecraft.timecraft.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j

@Service
@RequiredArgsConstructor
@Transactional
public class CurriculumService {

    private final CurriculumRepository curriculumRepository;
    private final CourseRepository courseRepository;
    private final SubjectRepository subjectRepository;
    private final CourseSubjectRepository courseSubjectRepository;
    private final UserRepository userRepository;

    public List<Curriculum> getByCourse(Long courseId) {
        return curriculumRepository.findByCourseId(courseId);
    }

    public List<Curriculum> getAll() {
        return curriculumRepository.findAllWithCourse();
    }

    public List<java.util.Map<String, Object>> getAllCoursesWithCurricula() {
        List<com.timecraft.timecraft.model.Course> courses = courseRepository.findByIsActiveTrue();
        List<Curriculum> curricula = curriculumRepository.findAllWithCourse();

        java.util.Map<Long, List<Curriculum>> byCourse = curricula.stream()
            .collect(java.util.stream.Collectors.groupingBy(c -> c.getCourse().getId()));

        return courses.stream().map(course -> {
            java.util.Map<String, Object> row = new java.util.LinkedHashMap<>();
            row.put("courseId", course.getId());
            row.put("courseCode", course.getCode());
            row.put("courseName", course.getName());
            java.util.Map<String, Object> dept = new java.util.LinkedHashMap<>();
            dept.put("id", course.getDepartment().getId());
            dept.put("name", course.getDepartment().getName());
            row.put("department", dept);
            row.put("curricula", byCourse.getOrDefault(course.getId(), java.util.List.of()));
            return row;
        }).collect(java.util.stream.Collectors.toList());
    }

    public Curriculum importFile(Long courseId, String effectiveYear,
            String curriculumName, Long importedByUserId,
            MultipartFile file) throws Exception {

        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException(
                "Course not found: " + courseId));

        User importedBy = userRepository.findById(importedByUserId)
                .orElseThrow(() -> new ResourceNotFoundException(
                "User not found: " + importedByUserId));

        // Deactivate existing curriculum for same course+year
        curriculumRepository.findByCourseIdAndEffectiveYear(courseId, effectiveYear)
                .ifPresent(existing -> {
                    existing.setActive(false);
                    curriculumRepository.save(existing);
                });

        Curriculum curriculum = Curriculum.builder()
                .course(course)
                .name(curriculumName)
                .effectiveYear(effectiveYear)
                .isActive(true)
                .importedBy(importedBy)
                .importedAt(LocalDateTime.now())
                .build();
        curriculumRepository.save(curriculum);

        String filename = file.getOriginalFilename();
        if (filename != null && filename.endsWith(".csv")) {
            importCsv(file.getInputStream(), course, curriculum);
        } else {
            importExcel(file.getInputStream(), course, curriculum);
        }

        return curriculum;
    }

    // ── CSV import ────────────────────────────────────────────────────────────
    // Expected columns: code, name, units, prerequisite, yearLevel, semester,
    // subjectType (MAJOR/MINOR), sessionType (LECTURE/LABORATORY), hasLab
    // (true/false)
    private void importCsv(InputStream is, Course course,
            Curriculum curriculum) throws Exception {
        try (CSVReader reader = new CSVReader(new InputStreamReader(is))) {
            List<String[]> rows = reader.readAll();
            if (rows.isEmpty()) {
                return;
            }
            rows.remove(0); // skip header
            for (String[] row : rows) {
                if (row.length < 7) {
                    continue;
                }
                String subjectType = row.length > 9 ? row[9].trim() : "MINOR";
                String rawSession = row.length > 11 ? row[11].trim().toUpperCase() : "LECTURE";
                boolean hasLab = rawSession.contains("LABORATORY") || rawSession.contains("LAB")
                        || (row.length > 13 && "true".equalsIgnoreCase(row[13].trim()));
                String sessionType = "LECTURE";
                processRow(row[0].trim(), row[1].trim(),
                        parseUnits(row[5]), row[6].trim(),
                        parseYear(row[7]), parseSemester(row[8]),
                        course, curriculum, subjectType, sessionType, hasLab);
            }
        }
    }

    // ── Excel import ──────────────────────────────────────────────────────────
    // Expected columns (0-based): 0=code,1=name,2=units,3=prerequisite,4=yearLevel,
    // 5=semester,6=subjectType,7=sessionType,8=hasLab
    private void importExcel(InputStream is, Course course,
            Curriculum curriculum) throws Exception {
        try (Workbook wb = new XSSFWorkbook(is)) {
            Sheet sheet = wb.getSheetAt(0);
            boolean first = true;
            java.util.Map<String, String> prereqMap = new java.util.LinkedHashMap<>();
            for (Row row : sheet) {
                if (first) {
                    first = false;
                    continue;
                }
                if (row == null) {
                    continue;
                }
                String code = cellStr(row, 0);
                log.info("ROW {}: code='{}' units='{}' year='{}'",
                        row.getRowNum(), code, cellStr(row, 5), cellStr(row, 7));
                if (code.isBlank()) {
                    continue;
                }
                // Columns: A(0)=code, B-C merged(1)=name, F(5)=units, G(6)=prerequisite,
                //          H(7)=year_level, I(8)=semester, J(9)=subject_type, L(11)=session_type, N(13)=has_lab
                String unitsStr = cellStr(row, 5);
                String yearStr = cellStr(row, 7);
                if (unitsStr.isBlank() || yearStr.isBlank()) {
                    continue;
                }
                short yearLevel;
                int units;
                try {
                    yearLevel = (short) Double.parseDouble(yearStr);
                    units = (int) Double.parseDouble(unitsStr);
                } catch (Exception e) {
                    continue;
                }
                if (yearLevel < 1 || yearLevel > 5) {
                    continue;
                }
                String subjectType = cellStr(row, 9).isBlank() ? "MINOR" : cellStr(row, 9);
                String sessionType = cellStr(row, 11).isBlank() ? "LECTURE" : cellStr(row, 11);
                boolean hasLab = "true".equalsIgnoreCase(cellStr(row, 13));
                String prereqCode = cellStr(row, 6);
                if (!prereqCode.isBlank() && !prereqCode.equalsIgnoreCase("NONE")) {
                    prereqMap.put(cellStr(row, 0), prereqCode);
                }
                processRow(
                        cellStr(row, 0), cellStr(row, 1),
                        units,
                        cellStr(row, 6),
                        yearLevel,
                        parseSemester(cellStr(row, 8)),
                        course, curriculum, subjectType, sessionType, hasLab);
            }
            // Second pass: resolve prerequisites
            prereqMap.forEach((subjectCode, prereqCode) -> {
                subjectRepository.findByCode(subjectCode).ifPresent(subject -> {
                    subjectRepository.findByCode(prereqCode).ifPresent(prereq -> {
                        subject.setPrerequisite(prereq);
                        subjectRepository.save(subject);
                    });
                });
            });
        }
    }

    protected void processRow(String code, String name, int units,
            String prerequisite, short yearLevel,
            Semester semester, Course course,
            Curriculum curriculum,
            String subjectTypeStr, String sessionTypeStr, boolean hasLab) {
        Subject subject = subjectRepository.findByCode(code).orElseGet(() -> {
            Subject.SubjectType sType = Subject.SubjectType.MINOR;
            Subject.SessionType sessType = Subject.SessionType.LECTURE;
            try {
                sType = Subject.SubjectType.valueOf(subjectTypeStr.toUpperCase());
            } catch (Exception ignored) {
            }
            try {
                sessType = Subject.SessionType.valueOf(sessionTypeStr.toUpperCase());
            } catch (Exception ignored) {
            }
            Subject prereq = (prerequisite != null && !prerequisite.isBlank() && !prerequisite.equalsIgnoreCase("NONE"))
                    ? subjectRepository.findByCode(prerequisite).orElse(null)
                    : null;
            Subject s = Subject.builder()
                    .code(code)
                    .name(name)
                    .units((short) units)
                    .subjectType(sType)
                    .sessionType(sessType)
                    .hasLab(hasLab)
                    .prerequisite(prereq)
                    .build();
            return subjectRepository.saveAndFlush(s);
        });

        if (subject.getId() == null) {
            log.warn("Subject {} has null ID, skipping CourseSubject insert", code);
            return;
        }

        boolean alreadyLinked = courseSubjectRepository
                .existsByCourseIdAndSubjectId(course.getId(), subject.getId());
        if (!alreadyLinked) {
            // Check if this subject is already used by another course — mark as shared
            boolean usedByOtherCourse = courseSubjectRepository
                    .findBySubjectId(subject.getId()).stream()
                    .anyMatch(existing -> !existing.getCourse().getId().equals(course.getId()));
            if (usedByOtherCourse) {
                // Mark all existing CourseSubject entries for this subject as shared
                courseSubjectRepository.findBySubjectId(subject.getId()).forEach(existing -> {
                    existing.setShared(true);
                    courseSubjectRepository.save(existing);
                });
            }
            CourseSubject cs = CourseSubject.builder()
                    .course(course)
                    .subject(subject)
                    .yearLevel(yearLevel)
                    .semester(semester)
                    .curriculum(curriculum)
                    .isShared(usedByOtherCourse)
                    .build();
            courseSubjectRepository.saveAndFlush(cs);
            log.info("Saved CourseSubject for subject {} yearLevel {} sem {} shared={}", code, yearLevel, semester, usedByOtherCourse);
        } else {
            log.warn("CourseSubject already exists for course {} subject {}", course.getId(), subject.getId());
        }
        log.info("Imported subject {} into curriculum {}", code, curriculum.getName());
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    private String cellStr(Row row, int col) {
        Cell cell = row.getCell(col);
        return cell == null ? "" : cell.toString().trim();
    }

    private int parseUnits(String val) {
        try {
            return Integer.parseInt(val);
        } catch (Exception e) {
            return 3;
        }
    }

    private short parseYear(String val) {
        try {
            return Short.parseShort(val);
        } catch (Exception e) {
            return 1;
        }
    }

    private Semester parseSemester(String val) {
        try {
            return Semester.from(val);
        } catch (Exception e) {
            return Semester.FIRST;
        }
    }

    // ── Soft delete (archive) ─────────────────────────────────────────────────
    @Transactional
    public void softDelete(Long curriculumId, String deletedBy) {
        Curriculum c = curriculumRepository.findById(curriculumId)
                .orElseThrow(() -> new com.timecraft.timecraft.exception.ResourceNotFoundException(
                "Curriculum not found: " + curriculumId));
        c.setActive(false);
        c.setDeletedAt(java.time.LocalDateTime.now());
        c.setDeletedBy(deletedBy);
        curriculumRepository.save(c);
    }

    public List<Curriculum> getDeletedByCourse(Long courseId) {
        return curriculumRepository.findByCourseIdAndDeletedAtIsNotNull(courseId);
    }
}
