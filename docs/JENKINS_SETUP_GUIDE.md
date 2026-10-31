# Jenkins CI/CD Setup & Execution Guide (B.Tech CSE Lab CO2)

This guide provides step-by-step instructions to configure, run, and verify **Continuous Integration and Continuous Delivery (CI/CD)** pipelines for the **Smart Citizen Complaint Management Portal** on Windows.

---

## 1. Prerequisites and Installation Options

### Option A: Existing Jenkins on Windows

If Jenkins is already running, open its existing URL (in this environment:
`http://localhost:8081/`) and sign in with your Jenkins account. Jenkins may use
a different port on other machines; do not start a second Jenkins instance if
the current server is available.

### Option B: Running Jenkins on Windows via WAR
1. Download `jenkins.war` (LTS) from [jenkins.io](https://www.jenkins.io/download/).
2. Open PowerShell or Command Prompt and choose an unused port, for example 9090:
   ```powershell
   java -jar jenkins.war --httpPort=9090
   ```
3. Open browser at `http://localhost:9090`.
4. Copy the initial administrator password displayed in terminal or at:
   `C:\Users\<YourUser>\.jenkins\secrets\initialAdminPassword`
5. Select **"Install Suggested Plugins"** and create your admin account.

### Option C: Running Jenkins via Docker
```powershell
docker run -d --name jenkins-server -p 9090:8080 -p 50000:50000 -v jenkins_home:/var/jenkins_home jenkins/jenkins:lts
```

---

## 2. Required Jenkins Plugins

Navigate to **Manage Jenkins** -> **Plugins** -> **Available Plugins** and install:
1. **Git Plugin** (usually installed by default)
2. **Pipeline** (workflow-aggregator)
3. **NodeJS Plugin** (for managing Node.js versions in pipelines)
4. **Credentials Binding Plugin** (only required when deploying to Kubernetes)
5. Docker CLI and Docker Compose on the Jenkins agent (required for Docker builds)
6. `kubectl` on the Jenkins agent (required for manifest validation/deployment)

Restart Jenkins after plugin installation completes.

---

## 3. Global Tool Configuration

Navigate to **Manage Jenkins** -> **Tools** (Global Tool Configuration):

### A. JDK Configuration
- Click **Add JDK**
- **Name:** `JDK-21`
- Uncheck *Install automatically*
- **JAVA_HOME:** `C:\Program Files\Java\jdk-21.0.10`

### B. NodeJS Configuration
- Click **Add NodeJS**
- **Name:** `NodeJS-24`
- Select version: `NodeJS 24.x` (or choose *Install automatically*)

The pipeline uses the repository's Maven Wrapper (`springboot-app/mvnw.cmd`),
so a global Maven installation is not required. Click **Save**.

---

## 4. Freestyle Jobs Implementation (Chained Architecture)

You will configure 3 sequential Freestyle jobs demonstrating upstream/downstream build triggers.

```
+---------------------------+       +------------------------------+       +--------------------------+
| ComplaintPortal-Checkout  | ----> | ComplaintPortal-Build-Test   | ----> | ComplaintPortal-Package  |
| (SCM Clone & Validation)  |       | (Frontend & Backend Testing) |       | (JAR & Asset Packaging)  |
+---------------------------+       +------------------------------+       +--------------------------+
```

### Job 1: `ComplaintPortal-Checkout`
1. Click **New Item** -> Name: `ComplaintPortal-Checkout` -> Select **Freestyle project** -> Click **OK**.
2. **Source Code Management:**
   - Select **Git**
   - **Repository URL:** Your GitHub repo URL or local path `file:///C:/Users/BHUVANESWARI/OneDrive/Desktop/DWDM casestudy`
   - **Branches to build:** `*/main`
3. **Build Triggers:**
   - Check **Poll SCM** -> Schedule: `H/5 * * * *` (polls every 5 minutes for new commits).
4. **Build Steps:**
   - Add build step -> **Execute Windows batch command**:
     ```bat
     git log -1 --stat
     java -version
     node -v
     npm -v
     ```
5. **Post-build Actions:**
   - Add post-build action -> **Build other projects**
   - **Projects to build:** `ComplaintPortal-Build-Test`
   - **Trigger only if build is stable.**
6. Click **Save**.

---

### Job 2: `ComplaintPortal-Build-Test`
1. Click **New Item** -> Name: `ComplaintPortal-Build-Test` -> Select **Freestyle project** -> Click **OK**.
2. **Source Code Management:**
   - Select **Git** (same repository URL and branch `*/main`).
3. **Build Triggers:**
   - Check **Build after other projects are built**
   - **Projects to watch:** `ComplaintPortal-Checkout`
4. **Build Steps:**
   - Add build step -> **Execute Windows batch command**:
     ```bat
     echo ===================================================
     echo STEP 1: Building and Testing Frontend (Vitest)
     echo ===================================================
     cd frontend
     call npm install
     call npm test

     echo ===================================================
     echo STEP 2: Compiling and Testing Spring Boot (JUnit 5)
     echo ===================================================
     cd ..\springboot-app
     call mvnw.cmd clean test
     ```
5. **Post-build Actions:**
   - Add post-build action -> **Publish JUnit test result report**
     - **Test report XMLs:** `springboot-app/target/surefire-reports/*.xml`
   - Add post-build action -> **Build other projects**
     - **Projects to build:** `ComplaintPortal-Package`
6. Click **Save**.

---

### Job 3: `ComplaintPortal-Package`
1. Click **New Item** -> Name: `ComplaintPortal-Package` -> Select **Freestyle project** -> Click **OK**.
2. **Source Code Management:**
   - Select **Git** (same repository URL and branch `*/main`).
3. **Build Triggers:**
   - Check **Build after other projects are built**
   - **Projects to watch:** `ComplaintPortal-Build-Test`
4. **Build Steps:**
   - Add build step -> **Execute Windows batch command**:
     ```bat
     echo ===================================================
     echo STEP 1: Packaging Production Frontend Assets
     echo ===================================================
     cd frontend
     call npm run build

     echo ===================================================
     echo STEP 2: Packaging Executable Spring Boot JAR
     echo ===================================================
     cd ..\springboot-app
     call mvnw.cmd package -DskipTests=true
     ```
5. **Post-build Actions:**
   - Add post-build action -> **Archive the artifacts**
     - **Files to archive:** `springboot-app/target/*.jar, frontend/dist/**`
6. Click **Save**.

Each Freestyle job has a separate workspace. Job 3 cannot consume the files
created in Job 2 just because it checks out the same Git branch; generated
`dist/` and `target/` folders are not source-controlled. Keep these existing
jobs, but use the single-workspace `SmartCitizen-CI-CD` Pipeline in section 5
for an end-to-end build. If the Freestyle package job must be retained, install
the **Copy Artifact** plugin and configure Job 2 to archive its outputs, then
configure Job 3's Copy Artifacts build step to copy from the latest successful
`ComplaintPortal-Build-Test` build before packaging.

---

## 5. Declarative Pipeline Execution (`Jenkinsfile`)

1. Click **New Item** -> Name: `SmartCitizen-CI-CD` -> Select **Pipeline** -> Click **OK**. Keep the existing three Freestyle jobs; this pipeline builds, tests, and packages in one workspace so Job 3 does not depend on files from another job's workspace.
2. Scroll to the **Pipeline** section:
   - **Definition:** Select *Pipeline script from SCM*.
   - **SCM:** Select *Git*.
   - **Repository URL:** `https://github.com/BHUVANESWARIANDRA/Citizen_Complaint_Portal.git`
   - **Branch specifier:** `*/main`
   - **Script Path:** `Jenkinsfile`.
3. Click **Save**.
4. Click **Build Now** for the first CI run. The default run builds and tests the project without building Docker images or deploying to Kubernetes.
5. When it completes, use **Build with Parameters** to enable `BUILD_DOCKER_IMAGES` for Docker image builds, or enable `DEPLOY_TO_KUBERNETES` for deployment. Kubernetes deployment also requires the credentials and cluster setup in section 7.
6. Stage order: `Checkout` -> `Verify Environment` -> `Build Frontend` -> `Test Frontend` -> `Test Spring Boot` -> `Package Spring Boot` -> `Test Flask` -> optional `Build Docker Images` -> `Validate Kubernetes Manifests` -> optional `Deploy to Kubernetes`.
7. Jenkins archives frontend files, test reports, and the executable JAR from this same build workspace.

---

## 6. Scripted Pipeline Execution (`scripted-pipeline.groovy`)

1. Click **New Item** -> Name: `ComplaintPortal-Scripted-Pipeline` -> Select **Pipeline** -> Click **OK**.
2. Scroll to the **Pipeline** section:
   - **Definition:** Select *Pipeline script from SCM*.
   - **SCM:** Select *Git*.
   - **Script Path:** `jenkins/scripted-pipeline.groovy`.
3. Click **Save** and run once to register the pipeline parameters. Then use **Build with Parameters** if enabling an optional deployment.
4. Configure the Kubernetes credentials and agent prerequisites in section 7.
5. Leave `DEPLOY_TO_KUBERNETES` enabled to deploy, or disable it for CI-only validation.
6. Verify the build console log executes all stages inside the `node { ... }` block with `try-catch-finally` error handling.

---

## 7. Local Kubernetes Deployment from Jenkins

The root declarative pipeline can optionally build and deploy the Spring Boot
API and React portal to a local Kubernetes context. Deployment is disabled by
default; the optional Flask lab service is not deployed by this workflow.

### Prepare the agent and cluster

1. Install Docker CLI and `kubectl` on the Jenkins agent and make sure the agent
   can access the Docker daemon.
2. Start Docker Desktop Kubernetes, or start Minikube with
   `minikube start --driver=docker`.
3. Run `kubectl config current-context` as the Jenkins agent account and verify
   that it prints `docker-desktop` or `minikube`, matching the pipeline option. A Windows Jenkins service must
   use an account whose Docker and Kubernetes configuration can access that
   cluster.
4. For Minikube, install the `minikube` CLI on the agent as well. The pipeline
   loads the newly built images into Minikube before applying the deployments.
   Docker Desktop Kubernetes uses the local Docker images directly.

### Add Jenkins secrets (deployment only)

In **Manage Jenkins -> Credentials -> System -> Global credentials**, add two
**Secret text** credentials:

| Secret text | ID |
|---|---|
| Random JWT signing secret (at least 32 bytes) | `smart-citizen-jwt-secret` |
| Random administrator provisioning key | `smart-citizen-admin-provision-key` |

Do not put either value in source control or pipeline parameters. Jenkins
creates/updates the Kubernetes Secret `smart-citizen-secrets` from these
credentials during deployment.

### Run and verify deployment

1. Use **Build with Parameters** and keep `DEPLOY_TO_KUBERNETES` enabled.
2. Choose `docker-desktop` or `minikube` as `KUBERNETES_PROVIDER`. Leave
   `IMAGE_TAG` blank for a unique `build-<number>` tag.
3. The pipeline builds the images, applies the namespace/configuration/storage
   and service manifests, updates the secret, deploys the two application
   workloads, and waits for both rollouts to finish. A failed rollout fails the
   Jenkins build.
4. For Docker Desktop, open `http://localhost:30080`. For Minikube, run
   `minikube service react-frontend -n smart-citizen` on the agent host.
5. Verify the pods with `kubectl get pods -n smart-citizen` and inspect a
   failure with `kubectl describe pod` or `kubectl logs` in that namespace.

Disable `DEPLOY_TO_KUBERNETES` to run the build and test stages without
requiring Docker or a Kubernetes cluster. Persistent H2 complaint data remains
on the `h2-data-pvc`; deployment does not delete the namespace or its volumes.
