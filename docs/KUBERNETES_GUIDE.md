# Kubernetes Deployment & Operations Manual (B.Tech CSE Lab CO5)

This guide documents the container orchestration workflow for the **Smart Citizen Complaint Management Portal** on Kubernetes (Minikube / Docker Desktop).

---

## 1. Kubernetes Cluster Architecture

```
+--------------------------------------------------------------------------------------------------+
|                                    Kubernetes Cluster                                            |
|  Namespace: smart-citizen                                                                        |
|                                                                                                  |
|   +------------------------------------+          +------------------------------------------+   |
|   | Service: react-frontend (NodePort) |          | Service: springboot-backend (ClusterIP)  |   |
|   | Port: 80 -> NodePort: 30080        |          | Port: 8081 -> TargetPort: 8081           |   |
|   +------------------------------------+          +------------------------------------------+   |
|                     |                                                   |                        |
|                     v                                                   v                        |
|        +-------------------------+                         +-------------------------+           |
|        | Pod: react-frontend-xxx |                         | Pod: springboot-app-xxx |           |
|        | (Nginx + React Bundle)  |                         | (Java 21 Spring Boot)   |           |
|        +-------------------------+                         +-------------------------+           |
|                                                                         |                        |
|                                                                         v                        |
|                                                            +-------------------------+           |
|                                                            | PVC: h2-data-pvc (1Gi)  |           |
|                                                            | Mount: /app/data        |           |
|                                                            +-------------------------+           |
+--------------------------------------------------------------------------------------------------+
```

---

## 2. Cluster Prerequisites & Startup

You can use either **Docker Desktop Kubernetes** or **Minikube**.

### Option A: Docker Desktop Kubernetes (Easiest on Windows)
1. Open Docker Desktop Settings.
2. Navigate to **Kubernetes** tab.
3. Check **Enable Kubernetes** and click **Apply & Restart**.
4. Confirm cluster is active:
   ```powershell
   kubectl cluster-info
   kubectl get nodes
   ```

### Option B: Minikube
```powershell
minikube start --driver=docker
```

---

## 3. Loading Local Images into Cluster

When running Kubernetes locally without a public remote container registry:

### If using Docker Desktop:
Images built locally with `docker build` or `docker compose build` are automatically accessible because Docker Desktop shares its daemon with Kubernetes.

### If using Minikube:
```powershell
minikube image load smartcitizen/springboot-backend:1.0.0
minikube image load smartcitizen/react-frontend:1.0.0
minikube image load smartcitizen/flask-service:1.0.0
```

---

## 4. Deploying Manifests

Apply the entire manifest bundle sequentially or as a directory:

```powershell
# Apply all manifests inside the k8s folder
kubectl apply -f k8s/
```

Expected output:
```
namespace/smart-citizen created
configmap/smart-citizen-config created
persistentvolumeclaim/h2-data-pvc created
persistentvolumeclaim/flask-data-pvc created
deployment.apps/springboot-backend created
service/springboot-backend created
deployment.apps/react-frontend created
service/react-frontend created
deployment.apps/flask-service created
service/flask-service created
```

---

## 5. Verification & Inspection Commands

### Check All Resources in the Namespace:
```powershell
kubectl get all -n smart-citizen
```

### Inspect Pods with Wide IP & Node Details:
```powershell
kubectl get pods -n smart-citizen -o wide
```

### Describe Pod Events (Troubleshooting):
```powershell
kubectl describe pod -l app=springboot-backend -n smart-citizen
```

### Stream Live Pod Logs:
```powershell
# Spring Boot backend logs
kubectl logs -f deployment/springboot-backend -n smart-citizen

# React frontend Nginx logs
kubectl logs -f deployment/react-frontend -n smart-citizen
```

---

## 6. Accessing the Application

### Method 1: Kubernetes Port-Forwarding (Universal & Reliable)
```powershell
# Forward React Frontend to localhost:3000
kubectl port-forward svc/react-frontend 3000:80 -n smart-citizen

# In a separate terminal, forward Spring Boot Backend to localhost:8081
kubectl port-forward svc/springboot-backend 8081:8081 -n smart-citizen
```
Access the web portal in your browser at: `http://localhost:3000`

### Method 2: NodePort Access
If using Docker Desktop: `http://localhost:30080`
If using Minikube:
```powershell
minikube service react-frontend -n smart-citizen
```

---

## 7. Scaling Deployments

The React Frontend is stateless and can be scaled horizontally without constraint:

```powershell
# Scale frontend to 3 replicas
kubectl scale deployment react-frontend --replicas=3 -n smart-citizen

# Verify 3 running pods
kubectl get pods -l app=react-frontend -n smart-citizen
```

> **Architectural Note on Backend Scaling with Embedded H2:**
> The Spring Boot deployment is configured with `replicas: 1` and `strategy: Recreate`.
> Because H2 runs in embedded file mode (`/app/data/complaintsdb.mv.db`), file-level locking prevents multiple pod replicas from opening the same database file simultaneously.
> In production environments requiring horizontal scaling (`replicas: 3+`), a centralized database (such as PostgreSQL, MySQL, or Amazon RDS / Cloud SQL) is used.

---

## 8. Zero-Downtime Rolling Updates & Rollback

### Step 1: Perform a Rolling Update
```powershell
# Trigger a rolling update
kubectl rollout restart deployment/react-frontend -n smart-citizen

# Monitor rollout progression in real time
kubectl rollout status deployment/react-frontend -n smart-citizen
```

### Step 2: Rollback Deployment to Previous Revision
```powershell
# Undo rollout and restore previous revision
kubectl rollout undo deployment/react-frontend -n smart-citizen

# Inspect rollout revision history
kubectl rollout history deployment/react-frontend -n smart-citizen
```

---

## 9. Teardown / Cleanup
```powershell
kubectl delete -f k8s/
```
