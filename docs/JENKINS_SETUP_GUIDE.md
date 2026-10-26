# Jenkins CI/CD Setup & Execution Guide (B.Tech CSE Lab CO2)

This guide provides step-by-step instructions to configure, run, and verify **Continuous Integration and Continuous Delivery (CI/CD)** pipelines for the **Smart Citizen Complaint Management Portal** on Windows.

---

## 1. Prerequisites and Installation Options

### Option A: Running Jenkins on Windows via WAR (Recommended for Lab)
1. Download `jenkins.war` (LTS) from [jenkins.io](https://www.jenkins.io/download/).
2. Open PowerShell or Command Prompt and run on port 9090 (since port 8080 is occupied by Oracle and 8081 is used by Spring Boot):
   ```powershell
   java -jar jenkins.war --httpPort=9090
   ```
3. Open browser at `http://localhost:9090`.
4. Copy the initial administrator password displayed in terminal or at:
   `C:\Users\<YourUser>\.jenkins\secrets\initialAdminPassword`
5. Select **"Install Suggested Plugins"** and create your admin account.

### Option B: Running Jenkins via Docker
```powershell
docker run -d --name jenkins-server -p 9090:8080 -p 50000:50000 -v jenkins_home:/var/jenkins_home jenkins/jenkins:lts
```

---

## 2. Required Jenkins Plugins

Navigate to **Manage Jenkins** -> **Plugins** -> **Available Plugins** and install:
1. **Git Plugin** (usually installed by default)
2. **Pipeline** (workflow-aggregator)
3. **NodeJS Plugin** (for managing Node.js versions in pipelines)
4. **HTML Publisher Plugin** (for publishing test reports)
5. **Docker Pipeline** (optional, for Docker build steps)

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

### C. Maven Configuration
- Click **Add Maven**
- **Name:** `Maven-3.9`
- Select *Install automatically* or point to your local Maven directory.

Click **Save**.

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
   - **Branches to build:** `*/master`
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
   - Select **Git** (same repository URL and branch `*/master`).
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
   - Select **Git** (same repository URL and branch `*/master`).
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

---

## 5. Declarative Pipeline Execution (`Jenkinsfile`)

1. Click **New Item** -> Name: `ComplaintPortal-Declarative-Pipeline` -> Select **Pipeline** -> Click **OK**.
2. Scroll to the **Pipeline** section:
   - **Definition:** Select *Pipeline script from SCM*.
   - **SCM:** Select *Git*.
   - **Repository URL:** Enter your repository URL.
   - **Script Path:** `Jenkinsfile` (or `jenkins/Jenkinsfile`).
3. Click **Save**.
4. Click **Build with Parameters** -> Check/uncheck `BUILD_DOCKER_IMAGES` -> Click **Build**.
5. Observe the Stage View displaying:
   `Checkout SCM` -> `Validate Environment` -> `Build Frontend` -> `Test Frontend` -> `Build & Test Spring Boot Backend` -> `Package Application`.

---

## 6. Scripted Pipeline Execution (`scripted-pipeline.groovy`)

1. Click **New Item** -> Name: `ComplaintPortal-Scripted-Pipeline` -> Select **Pipeline** -> Click **OK**.
2. Scroll to the **Pipeline** section:
   - **Definition:** Select *Pipeline script from SCM*.
   - **SCM:** Select *Git*.
   - **Script Path:** `jenkins/scripted-pipeline.groovy`.
3. Click **Save** and click **Build Now**.
4. Verify the build console log executes all stages inside the `node { ... }` block with `try-catch-finally` error handling.
