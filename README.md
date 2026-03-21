# ⏰ TimeCraft — College Timetabling Management System

> **Automated, conflict-free college scheduling powered by Java Spring Boot, React JSX, PostgreSQL, and Flyway.**

[![Java](https://img.shields.io/badge/Java-17+-orange?style=flat-square&logo=openjdk)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.x-brightgreen?style=flat-square&logo=spring)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18.x-blue?style=flat-square&logo=react)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-336791?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Flyway](https://img.shields.io/badge/Flyway-Migration-red?style=flat-square&logo=flyway)](https://flywaydb.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

---

## 📋 Table of Contents

1. [Project Overview](#-project-overview)
2. [Tech Stack](#-tech-stack)
3. [Project Structure](#-project-structure)
   - [Root Layout](#root-layout)
   - [Backend — Spring Boot](#backend--spring-boot)
   - [Frontend — React JSX](#frontend--react-jsx)
4. [Spring Boot Dependencies](#-spring-boot-dependencies)
5. [Database Migration (Flyway)](#-database-migration-flyway)
6. [System Architecture](#-system-architecture)
7. [Database Design](#-database-design)
8. [Feature Modules](#-feature-modules)
9. [Scheduling Logic](#-scheduling-logic)
10. [Frontend Structure](#-frontend-structure)
11. [Best Practices & Suggestions](#-best-practices--suggestions)
12. [Find & Replace Reference](#-find--replace-reference)

---

## 🎯 Project Overview

**TimeCraft** is a full-stack web application that automates the college timetabling process — eliminating manual scheduling errors, detecting conflicts in real-time, and giving students, teachers, and admins a clear view of their schedules.

### Problems Solved

| Problem | TimeCraft Solution |
|---|---|
| Manual scheduling inefficiency | Automated timetable generation engine |
| Teacher/room/subject conflicts | Real-time conflict detection service |
| Poor communication of changes | Instant schedule updates per role |
| Lack of academic planning data | Built-in reporting and analytics |

### User Roles

| Role | Capabilities |
|---|---|
| **Admin** (Registrar) | Manage rooms, departments, generate schedules, approve changes, view all reports |
| **Teacher** | Input subjects, set availability/preferences, view personal schedule |
| **Student** | View assigned timetable by section/department |

---

## 🛠 Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Backend | Java 17 + Spring Boot 3.x | REST API, business logic, security |
| Frontend | React 18 + JSX (Vite) | User interface, all three dashboards |
| Database | PostgreSQL 15+ | Persistent data storage |
| Migration | Flyway | Versioned database schema management |
| Auth | Spring Security + JWT | Role-based access control |
| ORM | Spring Data JPA + Hibernate | Java ↔ PostgreSQL mapping |

---

## 📁 Project Structure

### Root Layout

```
timecraft/
├── backend/                  # Spring Boot application
├── frontend/                 # React JSX application
├── database/                 # Supplemental DB docs/scripts
├── docs/                     # API docs, diagrams, meeting notes
├── .env.example              # Environment variable template
├── docker-compose.yml        # Run all services together
└── README.md
```

---

### Backend — Spring Boot

```
backend/
├── src/
│   ├── main/
│   │   ├── java/com/timecraft/
│   │   │   │
│   │   │   ├── controller/               # REST endpoints — handle HTTP requests
│   │   │   │   ├── AuthController.java
│   │   │   │   ├── ScheduleController.java
│   │   │   │   ├── SubjectController.java
│   │   │   │   ├── RoomController.java
│   │   │   │   ├── TeacherController.java
│   │   │   │   ├── DepartmentController.java
│   │   │   │   └── ReportController.java
│   │   │   │
│   │   │   ├── service/                  # Business logic layer
│   │   │   │   ├── AuthService.java
│   │   │   │   ├── ScheduleService.java           ← timetable generation engine
│   │   │   │   ├── ConflictDetectionService.java  ← conflict checker
│   │   │   │   ├── SubjectService.java
│   │   │   │   ├── RoomService.java
│   │   │   │   ├── TeacherService.java
│   │   │   │   ├── DepartmentService.java
│   │   │   │   └── ReportService.java
│   │   │   │
│   │   │   ├── repository/               # Spring Data JPA — DB queries
│   │   │   │   ├── UserRepository.java
│   │   │   │   ├── ScheduleRepository.java
│   │   │   │   ├── SubjectRepository.java
│   │   │   │   ├── RoomRepository.java
│   │   │   │   ├── TeacherRepository.java
│   │   │   │   └── DepartmentRepository.java
│   │   │   │
│   │   │   ├── model/                    # JPA entity classes — map to DB tables
│   │   │   │   ├── User.java
│   │   │   │   ├── Schedule.java
│   │   │   │   ├── Subject.java
│   │   │   │   ├── Room.java
│   │   │   │   ├── Teacher.java
│   │   │   │   ├── Department.java
│   │   │   │   └── TeacherAvailability.java
│   │   │   │
│   │   │   ├── dto/                      # Data Transfer Objects — API shapes
│   │   │   │   ├── request/
│   │   │   │   │   ├── LoginRequest.java
│   │   │   │   │   ├── RegisterRequest.java
│   │   │   │   │   └── ScheduleGenerateRequest.java
│   │   │   │   └── response/
│   │   │   │       ├── AuthResponse.java
│   │   │   │       ├── ScheduleResponse.java
│   │   │   │       └── ApiResponse.java          ← generic wrapper
│   │   │   │
│   │   │   ├── config/                   # Spring configuration
│   │   │   │   ├── SecurityConfig.java           ← JWT + role-based access
│   │   │   │   ├── CorsConfig.java               ← allow React frontend calls
│   │   │   │   └── FlywayConfig.java             ← migration override (optional)
│   │   │   │
│   │   │   ├── exception/
│   │   │   │   ├── GlobalExceptionHandler.java
│   │   │   │   └── ScheduleConflictException.java
│   │   │   │
│   │   │   ├── security/
│   │   │   │   ├── JwtUtil.java
│   │   │   │   ├── JwtAuthFilter.java
│   │   │   │   └── UserDetailsServiceImpl.java
│   │   │   │
│   │   │   └── TimeCraftApplication.java         ← main entry point
│   │   │
│   │   └── resources/
│   │       ├── application.yml                   ← DB, server, JWT config
│   │       ├── application-dev.yml
│   │       ├── application-prod.yml
│   │       └── db/
│   │           └── migration/                    ← Flyway SQL scripts (auto-run)
│   │               ├── V1__create_users_table.sql
│   │               ├── V2__create_departments_table.sql
│   │               ├── V3__create_rooms_table.sql
│   │               ├── V4__create_subjects_table.sql
│   │               ├── V5__create_teachers_table.sql
│   │               ├── V6__create_teacher_availability.sql
│   │               ├── V7__create_schedules_table.sql
│   │               └── V8__seed_initial_data.sql
│   │
│   └── test/
│       └── java/com/timecraft/
│           ├── service/
│           └── controller/
│
└── pom.xml                               ← Maven dependencies
```

---

### Frontend — React JSX

```
frontend/
├── public/                               # Static assets, index.html
├── src/
│   ├── pages/                            # One folder per user role
│   │   ├── auth/
│   │   │   ├── LoginPage.jsx
│   │   │   └── RegisterPage.jsx
│   │   ├── admin/
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── ManageRooms.jsx
│   │   │   ├── ManageDepartments.jsx
│   │   │   ├── GenerateSchedule.jsx      ← triggers the scheduling engine
│   │   │   └── Reports.jsx
│   │   ├── teacher/
│   │   │   ├── TeacherDashboard.jsx
│   │   │   ├── SetAvailability.jsx       ← teacher inputs free time slots
│   │   │   └── ViewMySchedule.jsx
│   │   └── student/
│   │       ├── StudentDashboard.jsx
│   │       └── ViewTimetable.jsx
│   │
│   ├── components/                       # Shared reusable components
│   │   ├── layout/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── ProtectedRoute.jsx        ← role-based route guard
│   │   ├── schedule/
│   │   │   ├── TimetableGrid.jsx         ← main weekly grid view
│   │   │   ├── ConflictAlert.jsx
│   │   │   └── ScheduleSlot.jsx
│   │   └── ui/
│   │       ├── Button.jsx
│   │       ├── Modal.jsx
│   │       └── Table.jsx
│   │
│   ├── services/                         # All Axios API call functions
│   │   ├── api.js                        ← Axios base instance + interceptors
│   │   ├── authService.js
│   │   ├── scheduleService.js
│   │   ├── subjectService.js
│   │   ├── roomService.js
│   │   └── reportService.js
│   │
│   ├── hooks/                            # Custom React hooks
│   │   ├── useAuth.js
│   │   ├── useSchedule.js
│   │   └── useConflict.js
│   │
│   ├── context/
│   │   └── AuthContext.jsx               ← global auth state (role, token)
│   │
│   ├── router/
│   │   └── AppRouter.jsx                 ← React Router v6, role-based routes
│   │
│   ├── utils/
│   │   ├── formatters.js
│   │   └── constants.js
│   │
│   ├── App.jsx
│   └── main.jsx                          ← Vite entry point
│
├── .env                                  ← VITE_API_BASE_URL=http://localhost:8080/api
└── package.json
```

---

## 📦 Spring Boot Dependencies

Add these in **Spring Initializr** (`start.spring.io`):
- Project: **Maven**
- Language: **Java**
- Spring Boot: **3.x**
- Java: **17+**
- Packaging: **Jar**

### Required Dependencies

| Dependency | Group ID / Artifact | Why it's needed |
|---|---|---|
| **Spring Web** | `spring-boot-starter-web` | Builds REST controllers — handles all HTTP from the React frontend |
| **Spring Data JPA** | `spring-boot-starter-data-jpa` | ORM via Hibernate — maps Java entities to PostgreSQL tables automatically |
| **PostgreSQL Driver** | `postgresql` | JDBC driver to connect Spring Boot to your PostgreSQL database |
| **Spring Security** | `spring-boot-starter-security` | Secures all endpoints — used with JWT for ADMIN / TEACHER / STUDENT roles |
| **Validation** | `spring-boot-starter-validation` | Validates request bodies using `@NotBlank`, `@Email`, `@Size`, etc. |
| **Flyway Core** | `flyway-core` | Runs versioned SQL migration scripts automatically on every startup |
| **Lombok** | `lombok` | Generates getters/setters/constructors — replaces boilerplate with `@Data`, `@Builder` |
| **Spring Boot Test** | `spring-boot-starter-test` | JUnit 5 + Mockito for unit and integration testing |

### Additional Dependencies (add manually in `pom.xml`)

| Dependency | Why it's needed |
|---|---|
| `jjwt-api` + `jjwt-impl` + `jjwt-jackson` | JWT token generation and validation for stateless auth |
| `flyway-database-postgresql` | Flyway PostgreSQL dialect support (Spring Boot 3.x) |

### Optional but Recommended

| Dependency | Why it's needed |
|---|---|
| `spring-boot-devtools` | Hot reload during development — restarts automatically on save |
| `springdoc-openapi-starter-webmvc-ui` | Auto-generates Swagger UI at `/swagger-ui.html` |
| `mapstruct` | Auto-maps between Entity and DTO — reduces repetitive conversion code |

### `pom.xml` snippet

```xml
<dependencies>

    <!-- Core Web -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>

    <!-- Database -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>
    <dependency>
        <groupId>org.postgresql</groupId>
        <artifactId>postgresql</artifactId>
        <scope>runtime</scope>
    </dependency>

    <!-- Security -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-security</artifactId>
    </dependency>

    <!-- Validation -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-validation</artifactId>
    </dependency>

    <!-- Flyway Migration -->
    <dependency>
        <groupId>org.flywaydb</groupId>
        <artifactId>flyway-core</artifactId>
    </dependency>
    <dependency>
        <groupId>org.flywaydb</groupId>
        <artifactId>flyway-database-postgresql</artifactId>
    </dependency>

    <!-- Lombok -->
    <dependency>
        <groupId>org.projectlombok</groupId>
        <artifactId>lombok</artifactId>
        <optional>true</optional>
    </dependency>

    <!-- JWT -->
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-api</artifactId>
        <version>0.12.3</version>
    </dependency>
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-impl</artifactId>
        <version>0.12.3</version>
        <scope>runtime</scope>
    </dependency>
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-jackson</artifactId>
        <version>0.12.3</version>
        <scope>runtime</scope>
    </dependency>

    <!-- Testing -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-test</artifactId>
        <scope>test</scope>
    </dependency>

    <!-- Optional: Swagger UI -->
    <dependency>
        <groupId>org.springdoc</groupId>
        <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
        <version>2.3.0</version>
    </dependency>

</dependencies>
```

---

## ✈ Database Migration (Flyway)

### Why Flyway?

Flyway is recommended over Liquibase for TimeCraft because:
- ✅ Uses plain `.sql` files — no XML or YAML to learn
- ✅ Simple to set up with Spring Boot (auto-configured)
- ✅ Easy to debug — you can read the migration files directly
- ✅ Widely used in Java/Spring Boot projects

### How It Works

```
App starts
    │
    ▼
Flyway checks flyway_schema_history table in PostgreSQL
    │
    ▼
Runs any V*.sql files not yet applied (in version order)
    │
    ▼
App finishes loading — DB schema is always up to date
```

### Migration File Location

```
src/main/resources/db/migration/
```

> ⚠️ **Never edit a migration file after it has been applied.** Flyway checksums each file — modifying an applied file will cause the app to refuse to start. Always create a new versioned file for changes.

### Naming Convention

```
V{version}__{description}.sql
```

| File | Purpose |
|---|---|
| `V1__create_users_table.sql` | Creates `users` table with roles, email, password hash |
| `V2__create_departments_table.sql` | Creates `departments` table |
| `V3__create_rooms_table.sql` | Creates `rooms` table with capacity and type |
| `V4__create_subjects_table.sql` | Creates `subjects` table with units and department FK |
| `V5__create_teachers_table.sql` | Creates `teachers` table linking to users |
| `V6__create_teacher_availability.sql` | Stores teacher day/time slot preferences |
| `V7__create_schedules_table.sql` | Creates central `schedules` table with all foreign keys |
| `V8__seed_initial_data.sql` | Inserts default admin user and sample departments |

### Rules

- Version numbers must be **unique** and **ascending** (`V1`, `V2`, `V3` …)
- Use **double underscore** `__` between version and description
- Descriptions use **underscores** for spaces
- Keep each file focused on **one concern** (one table per file)

---

## 🏗 System Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                  REACT JSX FRONTEND  (:3000)                     │
│                                                                  │
│   pages/admin/        pages/teacher/       pages/student/        │
│   GenerateSchedule    SetAvailability      ViewTimetable         │
│         │                   │                   │                │
│         └───────────────────┴───────────────────┘                │
│                             │                                    │
│                  services/scheduleService.js                     │
│                  Axios — JWT in Authorization header             │
└─────────────────────────────┬────────────────────────────────────┘
                              │
                   REST API (JSON over HTTP)
                   GET  /api/schedules
                   POST /api/schedules/generate
                   POST /api/auth/login
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                SPRING BOOT BACKEND  (:8080)                      │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Security Layer — JwtAuthFilter                            │  │
│  │  Validates JWT token on every protected request            │  │
│  └───────────────────────────┬───────────────────────────────┘  │
│                              │                                  │
│  ┌───────────────────────────▼───────────────────────────────┐  │
│  │  Controllers  (REST endpoints)                             │  │
│  │  ScheduleController · AuthController · RoomController      │  │
│  └───────────────────────────┬───────────────────────────────┘  │
│                              │                                  │
│  ┌───────────────────────────▼───────────────────────────────┐  │
│  │  Services  (business logic)                                │  │
│  │  ScheduleService · ConflictDetectionService                │  │
│  └───────────────────────────┬───────────────────────────────┘  │
│                              │                                  │
│  ┌───────────────────────────▼───────────────────────────────┐  │
│  │  Repositories  (Spring Data JPA)                           │  │
│  │  ScheduleRepository · RoomRepository · TeacherRepository   │  │
│  └───────────────────────────┬───────────────────────────────┘  │
└─────────────────────────────┬────────────────────────────────────┘
                              │  JDBC / Hibernate ORM
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                 POSTGRESQL DATABASE  (:5432)                     │
│                                                                  │
│   users · departments · rooms · subjects ·                       │
│   teachers · teacher_availability · schedules                    │
│                                                                  │
│   Schema managed automatically by Flyway migrations             │
└──────────────────────────────────────────────────────────────────┘
```

### How React Talks to Spring Boot

- All API calls go through `services/api.js` (shared Axios instance)
- JWT token is automatically attached to every request via an Axios **request interceptor**
- Base URL is stored in `.env` as `VITE_API_BASE_URL`
- **401 Unauthorized** responses trigger automatic logout via an Axios **response interceptor**

---

## 🗄 Database Design

### Main Tables

| Table | Key Fields | Notes |
|---|---|---|
| `users` | `id`, `email`, `password_hash`, `role` (ADMIN/TEACHER/STUDENT), `is_active`, `created_at` | All three user types share this table |
| `departments` | `id`, `name`, `code`, `head_teacher_id` | FK to teachers |
| `rooms` | `id`, `room_code`, `name`, `capacity`, `type` (LAB/LECTURE/SEMINAR), `building` | Type determines which subjects can be assigned |
| `subjects` | `id`, `code`, `name`, `units`, `hours_per_week`, `department_id`, `year_level` | FK to departments |
| `teachers` | `id`, `user_id`, `employee_id`, `department_id`, `max_hours_per_week` | FK to users and departments |
| `teacher_availability` | `id`, `teacher_id`, `day_of_week`, `start_time`, `end_time`, `is_preferred` | Multiple rows per teacher |
| `schedules` | `id`, `subject_id`, `teacher_id`, `room_id`, `section`, `day_of_week`, `start_time`, `end_time`, `semester`, `academic_year`, `status` | Central conflict table — FKs to all |

### Relationships

```
departments  ──< subjects         (1 department has many subjects)
departments  ──< teachers         (1 department has many teachers)
users        ──  teachers         (1 user has 1 teacher profile)
teachers     ──< teacher_availability  (1 teacher has many availability slots)
subjects     ──< schedules        (1 subject appears in many schedule slots)
teachers     ──< schedules        (1 teacher has many schedule slots)
rooms        ──< schedules        (1 room used in many schedule slots)
```

### Conflict Rules

> The `schedules` table enforces these constraints at the application layer:

- ❌ A **teacher** cannot have two slots at the same `day_of_week` + `start_time`
- ❌ A **room** cannot have two slots at the same `day_of_week` + `start_time`
- ❌ A **section** cannot have two subjects at the same `day_of_week` + `start_time`
- ❌ A teacher's total scheduled hours cannot exceed `max_hours_per_week`

---

## 🧩 Feature Modules

### Module 1 — Authentication & Users

Handles login, registration, JWT issuance, and role-based access.

- **Controllers:** `AuthController`
- **Services:** `AuthService`, `UserDetailsServiceImpl`
- **Security:** `JwtUtil`, `JwtAuthFilter`
- **Key endpoints:**
  - `POST /api/auth/login`
  - `POST /api/auth/register`
  - `POST /api/auth/refresh`

---

### Module 2 — Scheduling Engine

The core of TimeCraft. Accepts constraints and generates a conflict-free timetable.

- **Services:** `ScheduleService`, `ConflictDetectionService`
- **Algorithm:** Greedy assignment with backtracking (upgradeable to OptaPlanner)
- **Key endpoints:**
  - `POST /api/schedules/generate`
  - `GET  /api/schedules`
  - `GET  /api/schedules?teacher={id}`
  - `GET  /api/schedules?room={id}`
  - `GET  /api/schedules?section={section}`

---

### Module 3 — Subject & Teacher Management

Admin manages subjects, rooms, departments. Teachers set availability.

- **Controllers:** `SubjectController`, `TeacherController`, `RoomController`, `DepartmentController`
- **Key endpoints:**
  - `CRUD /api/subjects`
  - `CRUD /api/rooms`
  - `CRUD /api/departments`
  - `POST /api/teachers/{id}/availability`

---

### Module 4 — Reporting

Generates teaching load summaries, room usage, and department overviews.

- **Controllers:** `ReportController`
- **Services:** `ReportService`
- **Key endpoints:**
  - `GET /api/reports/teaching-load`
  - `GET /api/reports/room-usage`
  - `GET /api/reports/department-summary`

---

## ⚙ Scheduling Logic

### How Timetable Generation Works (Conceptual)

The scheduling engine lives in `ScheduleService.java` and runs when the Admin triggers **"Generate Schedule."**

#### Phase 1 — Collect Inputs

- All subjects for the semester
- Teacher availability slots from `teacher_availability`
- Room list with capacity + type
- Existing fixed schedule constraints

#### Phase 2 — Assignment Algorithm

```
FOR each subject in subjects:
  FOR each available time_slot:
    teacher = findAvailableTeacher(subject, time_slot)
    room    = findAvailableRoom(subject.capacity, time_slot)

    IF teacher != null AND room != null:
      IF !hasConflict(teacher, room, section, time_slot):
        assign(subject, teacher, room, time_slot)   ← success
        BREAK
      ELSE:
        log conflict, try next slot                 ← backtrack

  IF subject still unassigned after all slots tried:
    → throw ScheduleConflictException (notify admin)

Output: List<Schedule> saved to database
```

#### Phase 3 — Conflict Checks

| Check | Condition |
|---|---|
| Teacher conflict | Teacher already assigned at same `day` + `time` |
| Room conflict | Room already booked at same `day` + `time` |
| Section conflict | Section already has a subject at same `day` + `time` |
| Load limit | Teacher's weekly hours would exceed `max_hours_per_week` |

> **Algorithm Recommendation:** Start with a **Greedy algorithm** for simplicity. If conflicts are too frequent on large datasets, upgrade to **[OptaPlanner](https://www.optaplanner.org/)** — a Constraint Satisfaction Problem solver that integrates natively with Spring Boot.

---

## ⚛ Frontend Structure

### Routing Strategy (React Router v6)

```
/login                → public (no auth required)
/register             → public
/admin/*              → ADMIN role only   → ProtectedRoute
/teacher/*            → TEACHER role only → ProtectedRoute
/student/*            → STUDENT role only → ProtectedRoute
```

### API Services Pattern

> Components **never** call Axios directly. All API calls go through `services/`.

```javascript
// services/api.js — base instance used by all services
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

// Auto-attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-logout on 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### Key Components

| Component | Used By | Purpose |
|---|---|---|
| `TimetableGrid.jsx` | All roles | Renders schedule as a weekly grid — columns = days, rows = time slots |
| `ConflictAlert.jsx` | Admin | Displays conflict list returned by the scheduling engine |
| `SetAvailability.jsx` | Teacher | Calendar UI for teachers to mark available time slots |
| `GenerateSchedule.jsx` | Admin | Triggers `POST /api/schedules/generate` and shows progress/result |
| `ProtectedRoute.jsx` | Router | Checks user role from `AuthContext` — redirects if unauthorized |
| `AuthContext.jsx` | Global | Stores JWT, user role, `login()` and `logout()` functions |

---
