# Docker Containerization & Compose Manual (B.Tech CSE Lab CO4)

This comprehensive guide covers container lifecycle management, multi-stage Docker builds, persistent volume storage, and multi-service orchestration with **Docker Compose** for the **Smart Citizen Complaint Management Portal**.

---

## 1. Container Architecture

```
+--------------------------------------------------------------------------------------------------+
|                                    Docker Host (Bridge Network)                                  |
|                                                                                                  |
|   +--------------------------+       +------------------------------+     +------------------+   |
|   |   React Frontend (Web)   | ----> |     Spring Boot Backend      |     |  Flask Syllabus  |   |
|   |     (Nginx Alpine)       | /api/ | (Eclipse Temurin 21 JRE)     |     |   Microservice   |   |
|   |       Port: 3000         |       |         Port: 8080           |     |    Port: 5000    |   |
|   +--------------------------+       +------------------------------+     +------------------+   |
|                                                      |                              |            |
|                                                      v                              v            |
|                                             +------------------+          +------------------+   |
|                                             | smartcitizen-    |          | smartcitizen-    |   |
|                                             | h2-data (Volume) |          | flask-data (Vol) |   |
|                                             +------------------+          +------------------+   |
+--------------------------------------------------------------------------------------------------+
```

---

## 2. Essential Docker CLI Command Reference

| Command | Purpose / Lab Demonstration |
|---|---|
| `docker pull eclipse-temurin:21-jre-alpine` | Downloads an official base image from Docker Hub. |
| `docker images` | Lists all locally cached Docker images with tags and sizes. |
| `docker build -t <image-name>:<tag> .` | Builds an optimized Docker image from the current directory `Dockerfile`. |
| `docker run -d -p 8080:8080 --name backend-app <image>` | Instantiates and executes a container in detached background mode with port forwarding. |
| `docker ps` | Displays all currently active (running) containers. |
| `docker ps -a` | Displays all containers including stopped/exited containers. |
| `docker logs -f <container-id>` | Streams live container runtime standard output and log messages. |
| `docker exec -it <container-id> sh` | Opens an interactive terminal session inside a running container. |
| `docker stop <container-id>` | Sends `SIGTERM` followed by `SIGKILL` to cleanly halt a container. |
| `docker start <container-id>` | Restarts an existing stopped container without recreating it. |
| `docker rm <container-id>` | Deletes a stopped container from the local engine. |
| `docker rmi <image-id>` | Removes an unused Docker image from disk. |

---

## 3. Individual Container Build & Run Instructions

### A. Spring Boot Backend
```powershell
# 1. Build the multi-stage image
docker build -t smartcitizen/springboot-backend:1.0.0 -f springboot-app/Dockerfile springboot-app

# 2. Run container with persistent local volume
docker run -d `
  -p 8080:8080 `
  --name springboot-portal-backend `
  -v smartcitizen-h2-data:/app/data `
  smartcitizen/springboot-backend:1.0.0

# 3. Check logs and health status
docker ps
docker logs -f springboot-portal-backend
```

### B. React Frontend
```powershell
# 1. Build the production React + Nginx image
docker build -t smartcitizen/react-frontend:1.0.0 -f frontend/Dockerfile frontend

# 2. Run container
docker run -d `
  -p 3000:80 `
  --name react-portal-frontend `
  smartcitizen/react-frontend:1.0.0

# 3. Access in browser
# http://localhost:3000
```

### C. Python Flask Syllabus Service
```powershell
# 1. Build Flask image
docker build -t smartcitizen/flask-service:1.0.0 -f flask-app/Dockerfile flask-app

# 2. Run container
docker run -d `
  -p 5000:5000 `
  --name flask-portal-service `
  -v smartcitizen-flask-data:/app/data `
  smartcitizen/flask-service:1.0.0

# 3. Verify health
# http://localhost:5000/health
```

---

## 4. Multi-Service Orchestration with Docker Compose

Docker Compose coordinates building, linking, volume provisioning, and healthcheck dependencies with a single command.

### Start All Services:
```powershell
docker compose up --build -d
```

### Inspect Container Cluster Status:
```powershell
docker compose ps
```

### View Aggregated Streaming Logs:
```powershell
docker compose logs -f
```

### Stop Services Gracefully:
```powershell
docker compose down
```

### Stop Services and Purge Database Volumes:
```powershell
docker compose down -v
```

---

## 5. Persistent Storage & Volume Durability

Container storage is ephemeral by default. To safeguard civic grievance records across container lifecycle restarts:
- Spring Boot uses the named volume `smartcitizen-h2-data` mapped to `/app/data/complaintsdb.mv.db`.
- Flask uses `smartcitizen-flask-data` mapped to `/app/data/complaints_flask.db`.

```powershell
# List Docker volumes
docker volume ls

# Inspect volume metadata
docker volume inspect smartcitizen-h2-data
```
