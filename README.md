# Smart Citizen Complaint Management Portal (DevOps CI/CD)

An enterprise-ready, beginner-friendly, full-stack civic governance portal engineered for the B.Tech CSE lab: **Continuous Integration and Continuous Delivery Using DevOps**.

---

## 🏛️ Project Overview

The **Smart Citizen Complaint Management Portal** empowers citizens to submit civic grievances (roads & potholes, water supply, electricity, garbage collection, drainage, streetlights, and other civic issues) and track their resolution in real time. It equips civic administrators with a comprehensive dashboard to review, update status, add official remarks, and manage complaints effectively.

> **Lab Verification Note:** This feature branch (`feature/complaint-form`) demonstrates Git branching and merge workflows for CO1.

---

## 🏗️ Technology Stack

| Layer | Technology | Version / Details |
|---|---|---|
| **Frontend** | React 18 + Vite | Modern responsive UI, Blue & Teal theme, Axios |
| **Backend (Primary)** | Java 21 + Spring Boot 3 | Maven, Spring Data JPA, Hibernate, Bean Validation, Actuator |
| **Backend (Secondary / Syllabus)** | Python 3 + Flask | SQLite3, REST API, lightweight syllabus requirement |
| **Local Database** | H2 Database | Persistent file-based storage (`data/complaintsdb`) & H2 Web Console |
| **Testing** | JUnit 5, Mockito, Spring Boot Test | Automated unit and integration testing suite |
| **Version Control** | Git & GitHub | Feature branching, commit hygiene, merge strategies |
| **CI/CD** | Jenkins | Freestyle Jobs (Chain), Declarative Pipeline, Scripted Pipeline |
| **Containerization** | Docker & Docker Compose | Multi-stage Dockerfiles for Frontend, Spring Boot, and Flask |
| **Orchestration** | Kubernetes | Namespaces, ConfigMaps, Deployments, Services, PVC |

---

## 📁 Repository Structure

```
smart-citizen-complaint-portal/
├── frontend/                  # React + Vite Citizen & Admin Web Portal
│   ├── src/
│   │   ├── components/        # Reusable UI components (Navbar, Stats, ComplaintCard, etc.)
│   │   ├── services/          # REST API client (Axios)
│   │   ├── App.jsx            # Main portal with tabs (Citizen / Admin / Demo Info)
│   │   └── index.css          # Modern Tailwind/CSS variables styling
│   ├── package.json
│   ├── vite.config.js
│   └── Dockerfile
├── springboot-app/            # Spring Boot REST API
│   ├── src/
│   │   ├── main/java/com/smartcitizen/complaints/
│   │   │   ├── controller/    # REST API endpoints (/api/complaints)
│   │   │   ├── model/         # JPA Entities and Enums
│   │   │   ├── dto/           # Request & Response DTOs
│   │   │   ├── repository/    # Spring Data JPA Repository
│   │   │   ├── service/       # Business logic layer
│   │   │   └── exception/     # Global exception handling
│   │   └── test/              # JUnit 5 Unit & MockMvc Integration Tests
│   ├── pom.xml
│   ├── mvnw / mvnw.cmd        # Maven Wrapper
│   └── Dockerfile
├── flask-app/                 # Python Flask Alternative REST API (Lab Syllabus)
│   ├── app.py
│   ├── requirements.txt
│   └── Dockerfile
├── docker/                    # Centralized Dockerfiles
├── k8s/                       # Kubernetes manifests (Namespace, Deployment, Service, PVC)
├── jenkins/
│   ├── Jenkinsfile            # Declarative CI/CD pipeline
│   └── scripted-pipeline.groovy # Scripted CI/CD pipeline
├── docs/
│   └── LAB_RECORD.md          # Comprehensive B.Tech CSE Lab Record
├── screenshots/               # Manual verification screenshot evidence placeholders
├── docker-compose.yml         # Multi-container orchestration
├── .gitignore
└── README.md
```

---

## 🚀 Quick Start Guide (Local Development)

### 1. Run Spring Boot Backend
```powershell
cd springboot-app
.\mvnw.cmd spring-boot:run
```
- API Base URL: `http://localhost:8081/api/complaints`
- Health Endpoint: `http://localhost:8081/actuator/health`
- H2 Web Console: `http://localhost:8081/h2-console` (JDBC URL: `jdbc:h2:file:./data/complaintsdb`)

### 2. Run React Frontend
```powershell
cd frontend
npm install
npm run dev
```
- Web Portal: `http://localhost:5173`
- Vite development proxy routes `/api` and `/actuator` to `http://localhost:8081`.

### Account access and complaint privacy

- Citizens register and sign in through the citizen pages. Municipal officers use a separate, setup-key-protected officer provisioning page and receive the `ROLE_OFFICER` role; administrator accounts remain separate.
- Officer/admin credentials are required to view the complete complaint list, update or delete complaints, and access persistent officer notifications. Citizens can view their own complaints; public tracking requires the complaint reference plus its registered email or phone.
- Citizen and officer dashboards refresh complaint status automatically while open. New complaint notifications and their read state are stored in the H2 database and survive application restarts.
- The production Nginx configuration falls back to the React app entry point for client-side routes, so direct navigation and refreshes under routes such as `/citizen/login` continue to serve the frontend.

### 3. Run with Docker Compose
```powershell
docker compose up --build -d
```
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8083` (container port `8081`)
- Flask Service: `http://localhost:5000`

### 4. Deploy publicly with Render

The root `render.yaml` defines a Render Blueprint with a public React site and
Spring Boot API. The API uses generated secrets and a 1 GB persistent disk for
the H2 complaint database; the persistent disk requires a paid Render web
service plan. The optional Flask lab service is not part of the public portal.

1. Push this repository, including `render.yaml`, to the Git branch you want to
   deploy.
2. In Render, choose **New → Blueprint**, connect the repository, and select
   that branch.
3. Review the two services and confirm the paid API plan and persistent disk
   before applying the Blueprint.
4. After both services report **Live**, open the `smart-citizen-portal` URL
   shown in Render. The portal obtains the API hostname from the Blueprint;
   Render generates the JWT and admin-provisioning secrets.

The Render URL is the shareable public link; `http://localhost:3000` remains
available only on the computer running Docker Compose.

---

## 📋 Course Outcomes (CO) Coverage

- **CO1 (Git & GitHub):** Repository initialization, commit workflow, feature branching (`feature/complaint-form`), merging, and remote GitHub synchronization.
- **CO2 (Jenkins CI/CD):** 3 Chained Freestyle jobs (`Checkout` -> `Build-Test` -> `Package`), Declarative Pipeline with multi-stage automated build & test, Scripted Pipeline with error recovery.
- **CO3 (Java, Maven, Spring Boot):** Java 21 LTS, Spring Boot 3, clean layered architecture (Controller, Service, Repository, DTO), comprehensive JUnit 5 and MockMvc tests, Maven Wrapper packaging.
- **CO4 (Docker & Flask):** Optimized multi-stage Docker builds, health checks, environment configuration, Python Flask microservice syllabus demonstration, Docker Compose service orchestration.
- **CO5 (Kubernetes):** Declarative YAML manifests, persistent volumes, pod scheduling, zero-downtime rolling updates, and rollback procedures.
