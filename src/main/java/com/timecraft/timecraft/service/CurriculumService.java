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
@Transactional(readOnly = true)
public class CurriculumService {

    private final CurriculumRepository curriculumRepository;
    private final CourseRepository courseRepository;
    private final SubjectRepository subjectRepository;
    private final CourseSubjectRepository courseSubjectRepository;
    private final UserRepository userRepository;

    public List<Curriculum> getByCourse(Long courseId) {
        return curriculumRepository.findByCourseId(courseId);
    }

    @Transactional
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
    //                   subjectType (MAJOR/MINOR), sessionType (LECTURE/LABORATORY), hasLab (true/false)
    private void importCsv(InputStream is, Course course,
            Curriculum curriculum) throws Exception {
        try (CSVReader reader = new CSVReader(new InputStreamReader(is))) {
            List<String[]> rows = reader.readAll();
            if (rows.isEmpty()) return;
            rows.remove(0); // skip header
            for (String[] row : rows) {
                if (row.length < 7) continue;
                String subjectType = row.length > 6 ? row[6].trim() : "MINOR";
                String sessionType = row.length > 7 ? row[7].trim() : "LECTURE";
                boolean hasLab     = row.length > 8 && "true".equalsIgnoreCase(row[8].trim());
                processRow(row[0].trim(), row[1].trim(),
                        parseUnits(row[2]), row[3].trim(),
                        parseYear(row[4]), parseSemester(row[5]),
                        course, curriculum, subjectType, sessionType, hasLab);
            }
        }
    }

    // ── Excel import ──────────────────────────────────────────────────────────
    // Expected columns (0-based): 0=code,1=name,2=units,3=prerequisite,4=yearLevel,
    //   5=semester,6=subjectType,7=sessionType,8=hasLab
    private void importExcel(InputStream is, Course course,
            Curriculum curriculum) throws Exception {
        try (Workbook wb = new XSSFWorkbook(is)) {
            Sheet sheet = wb.getSheetAt(0);
            boolean first = true;
            for (Row row : sheet) {
                if (first) { first = false; continue; } // skip header
                if (row == null) continue;
                String subjectType = cellStr(row, 6).isBlank() ? "MINOR" : cellStr(row, 6);
                String sessionType = cellStr(row, 7).isBlank() ? "LECTURE" : cellStr(row, 7);
                boolean hasLab     = "true".equalsIgnoreCase(cellStr(row, 8));
                Cell unitsCell = row.getCell(2);
                Cell yearCell  = row.getCell(4);
                if (unitsCell == null || yearCell == null) continue;
                processRow(
                        cellStr(row, 0), cellStr(row, 1),
                        (int) unitsCell.getNumericCellValue(),
                        cellStr(row, 3),
                        (short) yearCell.getNumericCellValue(),
                        parseSemester(cellStr(row, 5)),
                        course, curriculum, subjectType, sessionType, hasLab);  
                            }
        }
    }

    // ── Row processor ─────────────────────────────────────────────────────────
    @Transactional
    protected void processRow(String code, String name, int units,
            String prerequisite, short yearLevel,
            Semester semester, Course course,
            Curriculum curriculum,
            String subjectTypeStr, String sessionTypeStr, boolean hasLab) {
        Subject subject = subjectRepository.findByCode(code).orElseGet(() -> {
            Subject.SubjectType sType = Subject.SubjectType.MINOR;
            Subject.SessionType sessType = Subject.SessionType.LECTURE;
            try { sType = Subject.SubjectType.valueOf(subjectTypeStr.toUpperCase()); } catch (Exception ignored) {}
            try { sessType = Subject.SessionType.valueOf(sessionTypeStr.toUpperCase()); } catch (Exception ignored) {}
            Subject s = Subject.builder()
                    .code(code)
                    .name(name)
                    .units((short) units)
                    .subjectType(sType)
                    .sessionType(sessType)
                    .hasLab(hasLab)
                    .build();
            return subjectRepository.save(s);
        });

        if (!courseSubjectRepository.existsByCourseIdAndSubjectId(
                course.getId(), subject.getId())) {
            courseSubjectRepository.save(CourseSubject.builder()
                    .course(course)
                    .subject(subject)
                    .yearLevel(yearLevel)
                    .semester(semester)
                    .curriculum(curriculum)
                    .build());
        }
        log.info("Imported subject {} into curriculum {}", code, curriculum.getName());
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    private String cellStr(Row row, int col) {
        Cell cell = row.getCell(col);
        return cell == null ? "" : cell.toString().trim();
    }

    private int parseUnits(String val) {
        try { return Integer.parseInt(val); } catch (Exception e) { return 3; }
    }

    private short parseYear(String val) {
        try { return Short.parseShort(val); } catch (Exception e) { return 1; }
    }

    private Semester parseSemester(String val) {
        try { return Semester.from(val); }
        catch (Exception e) { return Semester.FIRST; }
    }
}