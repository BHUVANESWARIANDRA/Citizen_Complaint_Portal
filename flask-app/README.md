# Python Flask Microservice — Citizen Complaint API (Lab Syllabus Exercise)

> **Important Syllabus Clarification:**
> This Flask service is implemented specifically to satisfy the **Python Flask microservice containerization requirement** for the B.Tech CSE DevOps lab syllabus.
> The primary full-stack production backend for the **Smart Citizen Complaint Management Portal** is implemented in **Java 21 + Spring Boot 3** under `springboot-app/`.

---

## 🛠️ Technology Stack
- **Framework:** Python Flask (v3.1)
- **CORS:** Flask-CORS
- **Database:** SQLite3 (`complaints_flask.db`)
- **Testing:** Pytest (5 automated test cases)
- **Containerization:** Docker (`Dockerfile`)

---

## 📡 REST API Endpoints

| HTTP Method | Route | Description |
|---|---|---|
| `GET` | `/health` | Health check endpoint returning service status and timestamp |
| `GET` | `/api/complaints` | Retrieve all grievances (supports `?category=` and `?status=`) |
| `GET` | `/api/complaints/<id>` | Retrieve grievance by ID or complaint tracking string |
| `POST` | `/api/complaints` | Create a new complaint with automatic ID generation |
| `PUT` | `/api/complaints/<id>/status` | Update resolution status and administrator remark |

---

## 💻 Local Execution Guide

### 1. Activate Virtual Environment
```powershell
cd flask-app
.\venv\Scripts\Activate.ps1
```

### 2. Run Test Suite
```powershell
pytest -v
```

### 3. Start Local Development Server
```powershell
python app.py
```
- Base URL: `http://localhost:5000`
- Health check: `http://localhost:5000/health`
- Grievance list: `http://localhost:5000/api/complaints`
