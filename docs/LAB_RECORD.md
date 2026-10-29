# B.Tech CSE Lab Record: Continuous Integration and Continuous Delivery Using DevOps

**Course Title:** Continuous Integration and Continuous Delivery Using DevOps  
**Degree Program:** Bachelor of Technology in Computer Science & Engineering (B.Tech CSE)  
**Academic Year:** 2026–2027  
**Project Title:** Smart Citizen Complaint Management Portal Using DevOps CI/CD  

---

## 1. Title
**Design and Implementation of an End-to-End CI/CD Pipeline and Cloud-Native Container Orchestration for a Smart Citizen Complaint Management Portal.**

---

## 2. Aim
To design, develop, containerize, and continuously deploy a full-stack civic governance web application (**Smart Citizen Complaint Management Portal**) incorporating Git version control, Jenkins CI/CD automation, Java Spring Boot microservice engineering, multi-stage Docker containerization, and Kubernetes cluster orchestration.

---

## 3. Problem Statement
Municipal corporations and urban local bodies receive thousands of daily civic grievances regarding road damage, water contamination, streetlight blackouts, electricity surges, and overflowing garbage bins. Manual grievance handling leads to:
1. Lack of transparency and inability for citizens to track complaint resolution status.
2. Delayed engineering dispatches and untracked administrative field notes.
3. Slow, error-prone manual software release cycles that risk application downtime.

This project addresses both the civic grievance challenge and the software delivery challenge by engineering a modern civic portal backed by an automated DevOps CI/CD pipeline.

---

## 4. Objectives
- **CO1 (Version Control):** Establish Git repository hygiene, feature branching (`feature/complaint-form`), commit logging, merge strategies, and remote GitHub synchronization.
- **CO2 (Continuous Integration & Delivery):** Implement 3 sequential Jenkins Freestyle jobs and automated Declarative/Scripted Jenkins pipelines for building, testing, and packaging.
- **CO3 (Backend, Security & Persistence):** Develop an enterprise-grade REST API using Java 21, Spring Boot 3, Maven Wrapper, H2 persistent storage, stateless JWT authentication with salted PBKDF2 password hashing, role-based access control (RBAC), and automated JUnit 5 unit/integration tests (37 tests).
- **CO4 (Containerization):** Construct multi-stage Docker containers for the Spring Boot backend, React Nginx frontend, and a supplementary Python Flask microservice (syllabus requirement), orchestrated via Docker Compose.
- **CO5 (Orchestration):** Author declarative Kubernetes manifests (Namespace, ConfigMap, Deployment, Service, PVC) ensuring zero-downtime rolling updates and disaster rollback.

---

## 5. Software and Hardware Requirements

### Software Requirements
- **Operating System:** Windows 10/11 (64-bit) or Linux / macOS
- **JDK:** Oracle OpenJDK / Eclipse Temurin Java 21 LTS
- **Build Tool:** Apache Maven 3.9+ (or self-contained Maven Wrapper `mvnw.cmd`)
- **Node.js & npm:** Node.js v20+ / v24+ and npm 10+
- **Python:** Python 3.10+ / 3.12+ (for Flask syllabus exercise)
- **Version Control:** Git 2.40+ and GitHub
- **CI/CD Server:** Jenkins LTS 2.450+
- **Container Engine:** Docker Desktop 26+ / 29+ (WSL 2 backend) & Docker Compose v2+
- **Orchestration:** Kubernetes v1.28+ (`kubectl`, Docker Desktop Kubernetes or Minikube)
- **Web Browser:** Google Chrome / Mozilla Firefox / Microsoft Edge

### Hardware Requirements
- **Processor:** Intel Core i5/i7 (8th Gen or higher) / AMD Ryzen 5 or Apple Silicon
- **RAM:** Minimum 8 GB (16 GB recommended for running Docker + Jenkins simultaneously)
- **Disk Space:** Minimum 20 GB free SSD storage

---

## 6. Architecture Diagram

```mermaid
graph TD
    subgraph ClientLayer["Client & Web Layer"]
        CitizenBrowser["Citizen Web Browser<br/>(/citizen/login, /citizen/dashboard)"]
        AdminBrowser["Administrator Console<br/>(/admin/login, /admin/dashboard)"]
        TrackBrowser["Public Grievance Tracker<br/>(/track with Phone/Email Auth)"]
    end

    subgraph IngressLayer["Routing & Static Assets"]
        NginxServer["Nginx Alpine Web Server<br/>Host Port: 3000 / Internal: 80"]
        ReactSPA["React 18 + Vite SPA<br/>(Civic Branding & Responsive UI)"]
    end

    subgraph SecurityLayer["Security & RBAC Tier"]
        AuthInterceptor["Spring AuthInterceptor<br/>(Bearer JWT Token Inspector)"]
        SecContext["ThreadLocal SecurityContext<br/>(ROLE_CITIZEN / ROLE_ADMIN)"]
    end

    subgraph ServiceLayer["Application Microservices"]
        SpringBootAPI["Spring Boot 3 REST API (Java 21 LTS)<br/>Host Port: 8083 / Container: 8081<br/>(Auth, Complaints, Audit Logs)"]
        FlaskMicroservice["Python Flask API<br/>(Syllabus Exercise)<br/>Port: 5000"]
    end

    subgraph StorageLayer["Persistence Tier"]
        H2Storage[("Persistent H2 Database<br/>(data/complaintsdb.mv.db)")]
        SQLiteStorage[("SQLite3 Database<br/>(complaints_flask.db)")]
    end

    CitizenBrowser -->|HTTP / SPA Navigation| NginxServer
    AdminBrowser -->|HTTP / SPA Navigation| NginxServer
    TrackBrowser -->|HTTP / SPA Navigation| NginxServer
    NginxServer --> ReactSPA
    ReactSPA -->|Reverse Proxy /api/* with JWT| AuthInterceptor
    AuthInterceptor --> SecContext
    SecContext --> SpringBootAPI
    ReactSPA -.->|Optional Route| FlaskMicroservice

    SpringBootAPI -->|Spring Data JPA| H2Storage
    FlaskMicroservice -->|sqlite3 driver| SQLiteStorage
```

---

## 7. DevOps CI/CD Lifecycle Diagram

```mermaid
flowchart LR
    subgraph SCM["1. Plan & Code (CO1)"]
        Dev["Developer"] -->|git commit| LocalGit["Local Git (.git)"]
        LocalGit -->|git push| GitHub["GitHub Remote Repo"]
    end

    subgraph CI["2. Continuous Integration (CO2 & CO3)"]
        GitHub -->|Webhook / Poll SCM| Jenkins["Jenkins CI Server"]
        Jenkins --> Checkout["Stage: Checkout"]
        Checkout --> EnvCheck["Stage: Validate Toolchain"]
        EnvCheck --> BuildFrontend["Stage: Build Frontend (npm)"]
        BuildFrontend --> TestFrontend["Stage: Test Frontend (Vitest)"]
        TestFrontend --> BuildBackend["Stage: Build Backend (Java 21)"]
        BuildBackend --> TestBackend["Stage: Test Backend (JUnit 5)"]
        TestBackend --> PackageJAR["Stage: Package Executable JAR"]
    end

    subgraph CD["3. Containerize & Deploy (CO4 & CO5)"]
        PackageJAR --> DockerBuild["Stage: Build Docker Images"]
        DockerBuild --> DockerCompose["Local Deployment<br/>(docker-compose.yml)"]
        DockerBuild --> K8sDeploy["Cluster Deployment<br/>(kubectl apply -f k8s/)"]
        K8sDeploy --> Verification["Automated Health Probes<br/>(/actuator/health)"]
    end
```

---

## 8. Procedure for Course Outcomes (CO1 through CO5)

### Course Outcome 1 (CO1) — Version Control with Git & GitHub
1. **Initialize Git Repository:**
   ```powershell
   git init
   ```
2. **Configure Exclusions:**
   Create `.gitignore` to prevent tracking of `node_modules/`, `target/`, `*.jar`, database files (`*.mv.db`), and system files.
3. **Stage and Commit Initial Project:**
   ```powershell
   git add .
   git commit -m "feat: initial commit of Smart Citizen Complaint Management Portal"
   git branch -M master
   ```
4. **Demonstrate Feature Branching and Merging:**
   ```powershell
   git switch -c feature/complaint-form
   # Make changes to ComplaintForm or documentation
   git commit -am "feat: implement responsive complaint submission validation"
   git switch master
   git merge feature/complaint-form --no-ff -m "merge: integrate feature/complaint-form into master"
   ```
5. **Verify Commit Topology:**
   ```powershell
   git log --oneline --graph -n 5
   ```
6. **Connect to Remote GitHub Repository:**
   ```powershell
   git remote add origin https://github.com/<USERNAME>/smart-citizen-complaint-portal.git
   git push -u origin master
   ```

---

### Course Outcome 2 (CO2) — Continuous Integration & Delivery with Jenkins
1. **Install Jenkins:** Run `java -jar jenkins.war --httpPort=9090` and complete setup wizard.
2. **Configure Tools in Global Tool Configuration:**
   - JDK: `JDK-21` -> `C:\Program Files\Java\jdk-21.0.10`
   - NodeJS: `NodeJS-24`
   - Maven: `Maven-3.9`
3. **Execute 3 Chained Freestyle Jobs:**
   - **Job 1 (`ComplaintPortal-Checkout`):** Git clone and environment inspection. Upstream trigger for Job 2.
   - **Job 2 (`ComplaintPortal-Build-Test`):** Runs `npm test` and `mvnw.cmd clean test`. Publishes JUnit XML test reports (`springboot-app/target/surefire-reports/*.xml`). Upstream trigger for Job 3.
   - **Job 3 (`ComplaintPortal-Package`):** Runs `npm run build` and `mvnw.cmd package -DskipTests=true`. Archives artifacts (`springboot-app/target/*.jar`).
4. **Execute Declarative Pipeline:**
   Create pipeline project pointing to `Jenkinsfile`. Observe the Stage View across Checkout, Environment Check, Frontend Build, Frontend Test, Spring Boot Compile & Test, and Package Application.
5. **Execute Scripted Pipeline:**
   Execute `jenkins/scripted-pipeline.groovy` demonstrating Groovy script execution with `try-catch-finally` and automated build notifications.

---

### Course Outcome 3 (CO3) — Spring Boot Backend, Security & Persistence
1. **Layered Architecture Implementation:**
   - `model/`: `Complaint.java`, `User.java`, `Role.java` (`ROLE_CITIZEN`, `ROLE_ADMIN`), `ComplaintAuditLog.java`, `ComplaintStatus.java` (`SUBMITTED`, `UNDER_REVIEW`, `IN_PROGRESS`, `RESOLVED`, `REJECTED`).
   - `security/`: `PasswordUtil.java` (PBKDF2WithHmacSHA256, 16-byte random salt, 65,536 iterations), `JwtService.java` (stateless RFC 7519 HMAC-SHA256 token generation & validation), `UserPrincipal.java`, `SecurityContext.java` (ThreadLocal context), `AuthInterceptor.java` (`HandlerInterceptor` inspecting `Authorization: Bearer <token>`).
   - `dto/`: `RegisterRequest.java`, `LoginRequest.java`, `AdminRegisterRequest.java`, `AuthResponse.java`, `UserProfileResponse.java`, `CreateComplaintRequest.java`, `UpdateStatusRequest.java`, `ComplaintResponse.java`, `ComplaintStatsResponse.java`, `AuditLogResponse.java`, `TrackComplaintRequest.java`.
   - `repository/`: `UserRepository.java`, `ComplaintRepository.java` (with custom citizen/status queries), `ComplaintAuditLogRepository.java`.
   - `service/`: `AuthService.java` / `AuthServiceImpl.java` (citizen registration, login, protected admin onboarding), `ComplaintService.java` / `ComplaintServiceImpl.java` (complaint submission, tracking, audit logging, admin status workflow).
   - `controller/`: `AuthController.java` (`/api/auth/*`), `ComplaintController.java` (`/api/complaints/*`).
   - `exception/`: `GlobalExceptionHandler.java` handling 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict.
2. **H2 Persistent Storage Configuration:**
   In `application.properties`:
   `spring.datasource.url=jdbc:h2:file:./data/complaintsdb;DB_CLOSE_ON_EXIT=FALSE;AUTO_RECONNECT=TRUE`
3. **Automated Testing Suite (37 Unit and Integration Tests):**
   Run tests using Maven Wrapper:
   ```powershell
   cd springboot-app
   .\mvnw.cmd clean test
   ```
   *Result:* 37 tests executed with 0 failures, 0 errors, 100% success rate across Authentication, JWT, Password Hashing, Complaint Services, REST Controllers, and JPA Repositories.
4. **Produce Executable Production JAR:**
   ```powershell
   .\mvnw.cmd package -DskipTests=true
   ```
   *Artifact:* `springboot-app/target/smart-citizen-complaint-portal-1.0.0.jar` (~51.5 MB).
5. **Run Standalone JAR on Port 8083 (Avoiding Oracle 8080 and Jenkins 8081):**
   ```powershell
   java -jar target/smart-citizen-complaint-portal-1.0.0.jar --server.port=8083
   ```

---

### Course Outcome 4 (CO4) — Docker Containerization & Flask Microservice
1. **Multi-Stage Spring Boot Container:**
   - Stage 1: Build stage compiles and packages JAR using Eclipse Temurin 21 JDK.
   - Stage 2: Runtime stage executes JAR using lightweight Alpine JRE, running as non-root user `appuser`.
2. **Multi-Stage React Frontend Container:**
   - Stage 1: Node 22 compiles production static assets (`npm run build`).
   - Stage 2: Nginx Alpine serves static files and reverse-proxies `/api/` to `springboot-backend:8081`.
3. **Python Flask Microservice (Lab Syllabus):**
   - Independent microservice with SQLite database (`complaints_flask.db`).
   - Pytest automated test suite passing 5 test cases (`pytest -v`).
4. **Multi-Service Docker Compose Orchestration:**
   ```powershell
   # Build and start all three containers in background
   docker compose up --build -d

   # Verify container health status
   docker compose ps

   # View live logs
   docker compose logs -f
   ```

---

### Course Outcome 5 (CO5) — Kubernetes Cluster Orchestration
1. **Start Cluster:** Enable Kubernetes in Docker Desktop or execute `minikube start --driver=docker`.
2. **Apply Manifests:**
   ```powershell
   kubectl apply -f k8s/
   ```
3. **Inspect Cluster State:**
   ```powershell
   kubectl get all -n smart-citizen
   kubectl get pvc,pv -n smart-citizen
   ```
4. **Access Web Application via Port-Forward:**
   ```powershell
   kubectl port-forward svc/react-frontend 3000:80 -n smart-citizen
   ```
5. **Demonstrate Horizontal Pod Scaling:**
   ```powershell
   kubectl scale deployment react-frontend --replicas=3 -n smart-citizen
   kubectl get pods -l app=react-frontend -n smart-citizen
   ```
6. **Demonstrate Rolling Update & Rollback:**
   ```powershell
   kubectl rollout restart deployment/react-frontend -n smart-citizen
   kubectl rollout status deployment/react-frontend -n smart-citizen
   kubectl rollout undo deployment/react-frontend -n smart-citizen
   ```

---

## 9. Important Commands Summary Table

| Category | Command | Functionality |
|---|---|---|
| **Git** | `git status` | Check working tree and staged files |
| **Git** | `git commit -am "message"` | Commit tracked modified files |
| **Git** | `git switch -c feature/name` | Create and switch to new branch |
| **Git** | `git merge <branch> --no-ff` | Merge branch creating explicit merge commit |
| **Git** | `git log --oneline --graph` | Visualize commit graph |
| **Maven** | `.\mvnw.cmd clean test` | Compile and run Spring Boot JUnit 5 test suite |
| **Maven** | `.\mvnw.cmd clean package` | Build executable production JAR |
| **Java** | `java -jar target/*.jar` | Run Spring Boot application directly |
| **Node.js** | `npm install` | Install frontend dependencies |
| **Node.js** | `npm test` | Run Vitest frontend test suite |
| **Node.js** | `npm run dev` | Start local Vite development server |
| **Node.js** | `npm run build` | Produce optimized production bundle in `dist/` |
| **Python** | `pytest -v` | Run Flask microservice automated tests |
| **Docker** | `docker compose up --build -d` | Build images and start container network |
| **Docker** | `docker compose ps` | Check container statuses and health |
| **Docker** | `docker compose logs -f` | Stream multi-service logs |
| **Docker** | `docker compose down` | Halt containers and tear down network |
| **Kubernetes** | `kubectl apply -f k8s/` | Create all resources in `smart-citizen` namespace |
| **Kubernetes** | `kubectl get all -n smart-citizen` | Display all pods, services, and deployments |
| **Kubernetes** | `kubectl logs -f deployment/springboot-backend -n smart-citizen` | Stream backend pod logs |
| **Kubernetes** | `kubectl port-forward svc/react-frontend 3000:80 -n smart-citizen` | Forward service port to local workstation |
| **Kubernetes** | `kubectl rollout restart deployment/<name> -n smart-citizen` | Trigger zero-downtime rolling update |
| **Kubernetes** | `kubectl rollout undo deployment/<name> -n smart-citizen` | Roll back to previous deployment revision |

---

## 10. Test Cases and Expected Results

| Test Case ID | Module Tested | Scenario / Test Case Description | Input Data | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|---|
| **TC-BE-01** | Spring Boot Context | Verify Spring application context loads | Application startup | Context loads without throwing exceptions | Context loaded in 3.15s | **PASS** |
| **TC-BE-02** | Complaint Service | Create complaint with auto-generated ID | Title, Category, Description, Location | ID formatted `CMP-YYYY-XXXXX`, status `SUBMITTED` | Unique ID generated; saved to H2 | **PASS** |
| **TC-BE-03** | REST Controller | `POST /api/complaints` validation check | Missing title and invalid email | HTTP `400 Bad Request` with field error map | Received 400 with validation error map | **PASS** |
| **TC-BE-04** | REST Controller | `GET /api/complaints` list complaints | Query params: none | HTTP `200 OK` with JSON array of complaints | Received 200 with 5 seeded complaints | **PASS** |
| **TC-BE-05** | REST Controller | `GET /api/complaints/{id}` missing record | `id: CMP-MISSING` | HTTP `404 Not Found` with structured error JSON | Received 404 with error description | **PASS** |
| **TC-BE-06** | REST Controller | `PUT /api/complaints/{id}/status` | `status: RESOLVED`, remark string | HTTP `200 OK` with updated status, remark & audit log | Status updated to RESOLVED with audit entry | **PASS** |
| **TC-BE-07** | REST Controller | `DELETE /api/complaints/{id}` | Existing complaint ID | HTTP `204 No Content` | Record deleted from repository | **PASS** |
| **TC-BE-08** | REST Controller | `GET /api/complaints/stats` aggregate counts | None | HTTP `200 OK` with total, submitted, under-review, in-progress, resolved, rejected | Received exact counts from H2 DB | **PASS** |
| **TC-BE-09** | Auth Service | Citizen registration (`POST /api/auth/register`) | Name, unique email, phone, password | HTTP `201 Created` with JWT token and `ROLE_CITIZEN` | Created citizen user with salted hash | **PASS** |
| **TC-BE-10** | Auth Service | Citizen login (`POST /api/auth/login`) | Registered email & password | HTTP `200 OK` with valid JWT token | Authenticated and token returned | **PASS** |
| **TC-BE-11** | Security / Crypto | Password hashing (`PasswordUtil`) | Raw password string | PBKDF2WithHmacSHA256, 16-byte salt, 65,536 iterations | Generated unique salt-hash pair; verified | **PASS** |
| **TC-BE-12** | Security / JWT | Token generation & verification (`JwtService`) | User principal & claims | Valid RFC 7519 HMAC-SHA256 token string | Verified token claims & role extraction | **PASS** |
| **TC-BE-13** | Auth Service | Admin provisioning (`POST /api/auth/admin/register`) | Admin info + `ADMIN_PROVISION_KEY` | HTTP `201 Created` with `ROLE_ADMIN` JWT | Created administrator account | **PASS** |
| **TC-BE-14** | Complaint Service | Privacy-protected tracking (`POST /api/complaints/track`) | Reference ID + matching email/phone | HTTP `200 OK` with complaint detail & full audit log | Verified contact info; returned timeline | **PASS** |
| **TC-FE-01** | React Component | Render `StatusBadge` for SUBMITTED | `status="SUBMITTED"` | Badge text "Submitted" with amber styling | Rendered badge with Clock icon | **PASS** |
| **TC-FE-02** | React Component | Render `CategoryBadge` for Roads | `category="ROADS_AND_POTHOLES"` | Badge text "Roads and potholes" with icon | Rendered label with AlertTriangle icon | **PASS** |
| **TC-FE-03** | React Build | Vite production build compilation | `npm run build` | Assets generated in `dist/` without errors | Built in 4.00s (`dist/index.html` created) | **PASS** |
| **TC-PY-01** | Flask Microservice | Health endpoint check | `GET /health` | HTTP `200 OK` with `status: UP` | Received 200 with JSON status | **PASS** |
| **TC-PY-02** | Flask Microservice | Create complaint in SQLite | Valid complaint JSON | HTTP `201 Created` with `CMP-FLASK-XXXX` | Received 201 with generated ID | **PASS** |

---

## 11. Output Screenshots Checklist

Use this checklist to capture output screenshots during your lab viva or practical examination:

- [ ] **Screenshot 1: Git Branching & Commit Graph**  
  *Command to show:* `git log --oneline --graph -n 5`  
  *What to show:* The merge commit showing `feature/complaint-form` merged into `master`.

- [ ] **Screenshot 2: Maven Test Suite Success (37 Tests Passed)**  
  *Command to show:* `cd springboot-app; .\mvnw.cmd clean test`  
  *What to show:* `Tests run: 37, Failures: 0, Errors: 0, Skipped: 0` and `BUILD SUCCESS`.

- [ ] **Screenshot 3: Spring Boot Executable JAR Output**  
  *Command to show:* `Get-Item springboot-app\target\*.jar`  
  *What to show:* `smart-citizen-complaint-portal-1.0.0.jar` (~51.5 MB).

- [ ] **Screenshot 4: React Frontend Vitest Test Results (8 Tests Passed)**  
  *Command to show:* `cd frontend; npm test`  
  *What to show:* `Test Files 2 passed, Tests 8 passed`.

- [ ] **Screenshot 5: Python Flask Pytest Results**  
  *Command to show:* `cd flask-app; pytest -v`  
  *What to show:* 5 passed test cases in ~1.2s.

- [ ] **Screenshot 6: Modern Civic Landing Page (`/`)**  
  *URL:* `http://localhost:5173` (or `http://localhost:3000`)  
  *What to show:* Clean navy-blue & teal design, "Make Your Community Better.", 3-step process (Submit → Track → Resolve), real dynamic database stats, and civic footer without technical/DevOps labels.

- [ ] **Screenshot 7: Citizen Registration & Login Pages**  
  *URLs:* `http://localhost:5173/citizen/register` and `http://localhost:5173/citizen/login`  
  *What to show:* Form validations, secure registration with confirmation, clean login card.

- [ ] **Screenshot 8: Citizen Dashboard (`/citizen/dashboard`)**  
  *What to show:* Welcome banner, "My Complaints" list displaying only the logged-in citizen's grievances, search/category filter, and "Report a Complaint" modal.

- [ ] **Screenshot 9: Privacy-Protected Grievance Tracker (`/track`)**  
  *What to show:* Reference ID and email/phone verification input, displaying complete chronological audit trail.

- [ ] **Screenshot 10: Administrator Portal Dashboard (`/admin/dashboard`)**  
  *What to show:* 6 real-time status metric counters (Total, Submitted, Under Review, In Progress, Resolved, Rejected), master management table, status update dialog with admin remarks, and delete confirmation modal.

- [ ] **Screenshot 11: Jenkins CI Pipeline Execution**  
  *URL:* `http://localhost:9090` (configured on port 9090 to avoid collisions)  
  *What to show:* Jenkins Declarative Pipeline Stage View with green blocks across all stages.

- [ ] **Screenshot 12: Docker Containers Running (`docker compose ps`)**  
  *Command to show:* `docker compose ps`  
  *What to show:* `springboot-backend` (port 8083:8081), `react-frontend` (port 3000:80), and `flask-service` (port 5000:5000) with `healthy` status.

- [ ] **Screenshot 13: Kubernetes Pods and Services (`kubectl get all`)**  
  *Command to show:* `kubectl get all -n smart-citizen`  
  *What to show:* Running pods for Spring Boot and React, ClusterIP service, and NodePort service.

---

## 12. Results
1. A fully functional, responsive full-stack civic portal was constructed with Java 21 Spring Boot 3, React 18, and Vite.
2. The Spring Boot backend successfully passed all **37 unit and integration tests**, achieving 100% pass rate for data persistence, JWT security, password hashing, and API endpoints on port 8081.
3. The React frontend was completely purged of technical/DevOps labels ("DevOps Lab Specs", "API Online"), redesigned with a professional navy-blue & teal aesthetic, verified through automated component tests (8/8 passed), and compiled into an optimized Nginx production container with proxy to port 8081.
4. An auxiliary Python Flask microservice was verified with 5 pytest test cases to satisfy the syllabus exercise.
5. Continuous Integration and Continuous Delivery were automated using both Declarative and Scripted Jenkins pipeline syntaxes alongside a 3-stage Freestyle job chain.
6. The entire application was containerized via multi-stage Docker builds and deployed to a local Kubernetes cluster with zero-downtime rolling update capabilities.
6. The entire application was containerized via multi-stage Docker builds and deployed to a local Kubernetes cluster with zero-downtime rolling update capabilities.

---

## 13. Conclusion
The **Smart Citizen Complaint Management Portal** successfully demonstrates the complete DevOps engineering lifecycle as prescribed by the B.Tech CSE syllabus. By combining modern source control hygiene, automated CI testing, multi-stage Docker containerization, and declarative Kubernetes orchestration, the project eliminates manual deployment friction and establishes a highly reliable civic software delivery pipeline.

---

## 14. Troubleshooting Guide

| Issue / Error Observed | Root Cause | Resolution Step |
|---|---|---|
| `Port 8080 was already in use` | Oracle Database Listener (`TNSLSNR.EXE`) or another system service is bound to port 8080. | Spring Boot is configured to use port 8081 (`server.port=8081` in `application.properties`). Vite proxy in `vite.config.js` forwards `/api` and `/actuator` to `http://localhost:8081`. Do not terminate or kill the Oracle service. |
| `'powershell' is not recognized` in `mvnw.cmd` | Windows environment PATH was stripped or missing SystemRoot PowerShell path. | Prepend `@SET "PATH=%SystemRoot%\System32\WindowsPowerShell\v1.0;%PATH%"` at top of `mvnw.cmd` (already fixed in this codebase). |
| `H2 Database file locked` | Multiple processes attempting to open `complaintsdb.mv.db` in file mode. | Ensure only one instance of Spring Boot is running locally. In Kubernetes, ensure `replicas: 1` for the backend deployment. |
| `Docker daemon not connecting` | Docker Desktop is not started on the workstation. | Launch **Docker Desktop** from the Windows Start menu and wait until the status indicator turns green. |
| `Kubernetes pods stuck in ContainerCreating` | PVC storage class cannot provision or image not present. | Run `kubectl describe pod <pod-name> -n smart-citizen` to view events. If image is missing, run `docker build` first. |
| CORS errors in browser | Frontend trying to access backend from different origin without proxy. | Use the Vite proxy `/api` or ensure `@CrossOrigin(origins = "*")` is enabled in `ComplaintController.java`. |
