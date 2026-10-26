/**
 * Smart Citizen Complaint Management Portal
 * Scripted Pipeline Implementation (jenkins/scripted-pipeline.groovy)
 * B.Tech CSE DevOps Lab - Course Outcome 2 (CI/CD Using Jenkins)
 */

node {
    def buildStatus = 'SUCCESS'
    def imageTag = env.IMAGE_TAG ?: '1.0.0'
    def shouldBuildDocker = (env.BUILD_DOCKER_IMAGES ?: 'false').toBoolean()

    try {
        stage('Checkout SCM') {
            echo ">>> [Stage 1] Checking out source code from Git repository..."
            checkout scm
            if (isUnix()) {
                sh 'git log -1 --oneline'
            } else {
                bat 'git log -1 --oneline'
            }
        }

        stage('Validate Toolchain') {
            echo ">>> [Stage 2] Inspecting compiler and runtime versions..."
            if (isUnix()) {
                sh 'java -version'
                sh 'node -v'
                sh 'npm -v'
                sh 'git --version'
            } else {
                bat 'java -version'
                bat 'node -v'
                bat 'npm -v'
                bat 'git --version'
            }
        }

        stage('Frontend Build & Test') {
            echo ">>> [Stage 3] Building React application & running Vitest unit tests..."
            dir('frontend') {
                if (isUnix()) {
                    sh 'npm install'
                    sh 'npm test'
                    sh 'npm run build'
                } else {
                    bat 'npm install'
                    bat 'npm test'
                    bat 'npm run build'
                }
            }
        }

        stage('Backend Compilation & Tests') {
            echo ">>> [Stage 4] Compiling Spring Boot & running JUnit 5 integration tests..."
            dir('springboot-app') {
                if (isUnix()) {
                    sh 'chmod +x mvnw || true'
                    sh './mvnw clean test'
                } else {
                    bat 'mvnw.cmd clean test'
                }
            }
            // Archive test results
            junit testResults: 'springboot-app/target/surefire-reports/*.xml', allowEmptyResults: true
        }

        stage('Package Application') {
            echo ">>> [Stage 5] Packaging executable Spring Boot JAR..."
            dir('springboot-app') {
                if (isUnix()) {
                    sh './mvnw package -DskipTests=true'
                } else {
                    bat 'mvnw.cmd package -DskipTests=true'
                }
            }
            archiveArtifacts artifacts: 'springboot-app/target/*.jar', fingerprint: true
        }

        stage('Docker Containerization') {
            if (shouldBuildDocker) {
                echo ">>> [Stage 6] Building multi-container Docker images..."
                if (isUnix()) {
                    sh "docker build -t smartcitizen/springboot-backend:${imageTag} -f springboot-app/Dockerfile springboot-app"
                    sh "docker build -t smartcitizen/react-frontend:${imageTag} -f frontend/Dockerfile frontend"
                    sh "docker build -t smartcitizen/flask-service:${imageTag} -f flask-app/Dockerfile flask-app"
                } else {
                    bat "docker build -t smartcitizen/springboot-backend:${imageTag} -f springboot-app/Dockerfile springboot-app"
                    bat "docker build -t smartcitizen/react-frontend:${imageTag} -f frontend/Dockerfile frontend"
                    bat "docker build -t smartcitizen/flask-service:${imageTag} -f flask-app/Dockerfile flask-app"
                }
            } else {
                echo ">>> [Stage 6 Skipped] BUILD_DOCKER_IMAGES is false. Skipping container builds on this agent."
            }
        }

    } catch (Exception ex) {
        buildStatus = 'FAILURE'
        currentBuild.result = 'FAILURE'
        echo "ERROR: Pipeline failed during execution with exception: ${ex.getMessage()}"
        throw ex

    } finally {
        stage('Pipeline Notification & Teardown') {
            echo "========================================================"
            echo "Scripted Pipeline Complete. Final Status: ${buildStatus}"
            echo "Build URL: ${env.BUILD_URL}"
            echo "========================================================"
        }
    }
}
