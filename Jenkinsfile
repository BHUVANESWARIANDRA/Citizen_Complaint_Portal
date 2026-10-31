pipeline {
    agent any

    tools {
        jdk 'JDK-21'
        nodejs 'NodeJS-24'
    }

    parameters {
        booleanParam(
            name: 'DEPLOY_TO_KUBERNETES',
            defaultValue: false,
            description: 'Optional: deploy to the configured local Kubernetes cluster'
        )
        choice(
            name: 'KUBERNETES_PROVIDER',
            choices: ['docker-desktop', 'minikube'],
            description: 'Kubernetes context used only when deployment is explicitly enabled'
        )
    }

    options {
        skipDefaultCheckout(true)
        timeout(time: 90, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '10', artifactNumToKeepStr: '5'))
        disableConcurrentBuilds()
        timestamps()
    }

    environment {
        CHECKOUT_RESULT = 'NOT_RUN'
        ENVIRONMENT_RESULT = 'NOT_RUN'
        FRONTEND_INSTALL_RESULT = 'NOT_RUN'
        FRONTEND_BUILD_RESULT = 'NOT_RUN'
        FRONTEND_TEST_RESULT = 'NOT_RUN'
        SPRING_TEST_RESULT = 'NOT_RUN'
        FLASK_TEST_RESULT = 'NOT_RUN'
        DOCKER_RESULT = 'NOT_RUN'
        KUBERNETES_RESULT = 'NOT_REQUESTED'
        GIT_EXE = 'C:\\Program Files\\Git\\bin\\git.exe'
        PYTHON_EXE = 'C:\\Users\\BHUVANESWARI\\AppData\\Local\\Python\\bin\\python.exe'
        DOCKER_EXE = 'C:\\Users\\BHUVANESWARI\\AppData\\Local\\Programs\\DockerDesktop\\resources\\bin\\docker.exe'
        CI_TOOL_PATHS = 'C:\\Program Files\\Git\\bin;C:\\Users\\BHUVANESWARI\\AppData\\Local\\Python\\bin;C:\\Users\\BHUVANESWARI\\AppData\\Local\\Programs\\DockerDesktop\\resources\\bin'
        CI_IMAGE_TAG = "ci-${BUILD_NUMBER}"
    }

    stages {
        stage('Git Checkout and Environment Verification') {
            steps {
                withEnv(["PATH+CI_TOOLS=${env.CI_TOOL_PATHS};${env.SystemRoot ?: 'C:\\Windows'}\\System32"]) {
                    checkout scm
                    script { env.CHECKOUT_RESULT = 'PASSED' }
                    bat '''
                        @echo off
                        echo === Jenkins service account ===
                        if exist "%SystemRoot%\\System32\\whoami.exe" ("%SystemRoot%\\System32\\whoami.exe") else echo WARNING: whoami.exe not found; continuing without account-name diagnostic.
                        echo === Effective PATH ===
                        set PATH
                        echo === Required files ===
                        if not exist frontend\\package.json (echo ERROR: frontend\\package.json is missing.& exit /b 1)
                        if not exist frontend\\package-lock.json (echo ERROR: frontend\\package-lock.json is missing.& exit /b 1)
                        if not exist springboot-app\\pom.xml (echo ERROR: springboot-app\\pom.xml is missing.& exit /b 1)
                        if not exist springboot-app\\mvnw.cmd (echo ERROR: Maven Wrapper is missing.& exit /b 1)
                        if not exist springboot-app\\.mvn\\wrapper\\maven-wrapper.properties (echo ERROR: Maven Wrapper properties are missing.& exit /b 1)
                        if not exist flask-app\\app.py (echo ERROR: Flask app.py is missing.& exit /b 1)
                        if not exist flask-app\\test_app.py (echo ERROR: Flask test_app.py is missing.& exit /b 1)
                        if not exist flask-app\\requirements.txt (echo ERROR: Flask requirements.txt is missing.& exit /b 1)
                        if not exist springboot-app\\Dockerfile (echo ERROR: Spring Boot Dockerfile is missing.& exit /b 1)
                        if not exist frontend\\Dockerfile (echo ERROR: frontend Dockerfile is missing.& exit /b 1)
                        if not exist flask-app\\Dockerfile (echo ERROR: Flask Dockerfile is missing.& exit /b 1)
                        if not exist docker-compose.yml (echo ERROR: docker-compose.yml is missing.& exit /b 1)
                        echo === Git ===
                        echo Executable: "%GIT_EXE%"
                        if not exist "%GIT_EXE%" (echo ERROR: Git executable is not accessible at "%GIT_EXE%".& exit /b 1)
                        "%GIT_EXE%" --version
                        if errorlevel 1 exit /b 1
                        echo === Node.js ===
                        where node
                        if errorlevel 1 (echo ERROR: Node.js is not available on the effective PATH.& exit /b 1)
                        node --version
                        if errorlevel 1 exit /b 1
                        echo === npm ===
                        where npm
                        if errorlevel 1 (echo ERROR: npm is not available on the effective PATH.& exit /b 1)
                        call npm.cmd --version
                        if errorlevel 1 exit /b 1
                        echo === Java ===
                        where java
                        if errorlevel 1 (echo ERROR: Java is not available on the effective PATH.& exit /b 1)
                        java -version
                        if errorlevel 1 exit /b 1
                        echo === Python ===
                        echo Executable: "%PYTHON_EXE%"
                        if not exist "%PYTHON_EXE%" (echo ERROR: Python executable is not accessible at "%PYTHON_EXE%".& exit /b 1)
                        "%PYTHON_EXE%" --version
                        if errorlevel 1 exit /b 1
                        echo === Maven Wrapper ===
                        call springboot-app\\mvnw.cmd --version
                        if errorlevel 1 exit /b 1
                        echo === Docker CLI and daemon ===
                        echo Executable: "%DOCKER_EXE%"
                        if not exist "%DOCKER_EXE%" (echo ERROR: Docker CLI is not accessible at "%DOCKER_EXE%".& exit /b 1)
                        "%DOCKER_EXE%" --version
                        if errorlevel 1 exit /b 1
                        "%DOCKER_EXE%" compose version
                        if errorlevel 1 (echo ERROR: Docker Compose is not available to the Jenkins service account.& exit /b 1)
                        "%DOCKER_EXE%" compose config --quiet --no-interpolate
                        if errorlevel 1 (echo ERROR: docker-compose.yml failed Compose configuration validation.& exit /b 1)
                        "%DOCKER_EXE%" info -f {{.ServerVersion}}
                        if errorlevel 1 (echo ERROR: Docker CLI is present, but the Jenkins service account cannot access the Docker daemon.& exit /b 1)
                    '''
                    script { env.ENVIRONMENT_RESULT = 'PASSED' }
                    script {
                        env.CHECKED_OUT_COMMIT = bat(
                            script: '@echo off\r\n"%GIT_EXE%" rev-parse HEAD',
                            returnStdout: true
                        ).trim()
                        env.CHECKED_OUT_BRANCH = env.BRANCH_NAME ?: (env.GIT_BRANCH ?: bat(
                            script: '@echo off\r\n"%GIT_EXE%" rev-parse --abbrev-ref HEAD',
                            returnStdout: true
                        ).trim())
                        echo "Branch: ${env.CHECKED_OUT_BRANCH}"
                        echo "Commit: ${env.CHECKED_OUT_COMMIT}"
                    }
                }
            }
            post {
                failure {
                    script {
                        if (env.CHECKOUT_RESULT != 'PASSED') {
                            env.CHECKOUT_RESULT = 'FAILED'
                        } else {
                            env.ENVIRONMENT_RESULT = 'FAILED'
                        }
                    }
                }
            }
        }

        stage('Application CI') {
            parallel {
                stage('Frontend CI') {
                    stages {
                        stage('Frontend Install') {
                            steps {
                                withEnv(["PATH+CI_TOOLS=${env.CI_TOOL_PATHS};${env.SystemRoot ?: 'C:\\Windows'}\\System32"]) {
                                    dir('frontend') {
                                        bat 'call npm ci --prefer-offline --no-audit --no-fund'
                                    }
                                    script { env.FRONTEND_INSTALL_RESULT = 'PASSED' }
                                }
                            }
                            post {
                                failure {
                                    script { env.FRONTEND_INSTALL_RESULT = 'FAILED' }
                                }
                            }
                        }

                        stage('Frontend Build') {
                            steps {
                                withEnv(["PATH+CI_TOOLS=${env.CI_TOOL_PATHS};${env.SystemRoot ?: 'C:\\Windows'}\\System32"]) {
                                    dir('frontend') {
                                        bat 'call npm run build'
                                        bat 'if not exist dist\\index.html exit /b 1'
                                        echo 'Frontend bundle verified at frontend/dist/index.html'
                                    }
                                    script { env.FRONTEND_BUILD_RESULT = 'PASSED' }
                                }
                            }
                            post {
                                failure {
                                    script { env.FRONTEND_BUILD_RESULT = 'FAILED' }
                                }
                            }
                        }

                        stage('Frontend Tests') {
                            steps {
                                withEnv(["PATH+CI_TOOLS=${env.CI_TOOL_PATHS};${env.SystemRoot ?: 'C:\\Windows'}\\System32"]) {
                                    dir('frontend') {
                                        bat 'if not exist target\\ci-reports mkdir target\\ci-reports'
                                        bat 'call npm test -- --reporter=default --reporter=junit --outputFile=target/ci-reports/frontend-results.xml'
                                    }
                                    script { env.FRONTEND_TEST_RESULT = 'PASSED' }
                                }
                            }
                            post {
                                failure {
                                    script { env.FRONTEND_TEST_RESULT = 'FAILED' }
                                }
                            }
                        }
                    }
                }

                stage('Spring Boot Build and Tests') {
                    steps {
                        withEnv(["PATH+CI_TOOLS=${env.CI_TOOL_PATHS};${env.SystemRoot ?: 'C:\\Windows'}\\System32"]) {
                            dir('springboot-app') {
                                bat 'call mvnw.cmd clean verify'
                                bat 'if not exist target\\surefire-reports\\*.xml exit /b 1'
                                bat 'if not exist target\\smart-citizen-complaint-portal-1.0.0.jar exit /b 1'
                                script {
                                    env.SPRING_TEST_RESULT = 'PASSED'
                                }
                            }
                        }
                    }
                    post {
                        failure {
                            script { env.SPRING_TEST_RESULT = 'FAILED' }
                        }
                    }
                }

                stage('Flask Tests') {
                    steps {
                        withEnv(["PATH+CI_TOOLS=${env.CI_TOOL_PATHS};${env.SystemRoot ?: 'C:\\Windows'}\\System32"]) {
                            script {
                                env.FLASK_VENV = "${env.WORKSPACE}\\flask-app\\.venv"
                            }
                            dir('flask-app') {
                                bat '"%PYTHON_EXE%" --version'
                                bat 'if not exist "%FLASK_VENV%\\Scripts\\python.exe" "%PYTHON_EXE%" -m venv "%FLASK_VENV%"'
                                bat '"%FLASK_VENV%\\Scripts\\python.exe" -m pip install --disable-pip-version-check --prefer-binary -r requirements.txt'
                                bat '"%FLASK_VENV%\\Scripts\\python.exe" -m py_compile app.py test_app.py'
                                bat 'if not exist target\\ci-reports mkdir target\\ci-reports'
                                bat '"%FLASK_VENV%\\Scripts\\python.exe" -m pytest -q test_app.py --junitxml=target/ci-reports/flask-results.xml'
                                script {
                                    env.FLASK_TEST_RESULT = 'PASSED'
                                }
                            }
                        }
                    }
                    post {
                        failure {
                            script { env.FLASK_TEST_RESULT = 'FAILED' }
                        }
                    }
                }
            }
        }

        stage('Docker Build') {
            steps {
                withEnv(["PATH+CI_TOOLS=${env.CI_TOOL_PATHS};${env.SystemRoot ?: 'C:\\Windows'}\\System32"]) {
                    bat '"%DOCKER_EXE%" info -f {{.ServerVersion}}'
                    bat '"%DOCKER_EXE%" build -t smartcitizen/springboot-backend:%CI_IMAGE_TAG% -f springboot-app/Dockerfile springboot-app'
                    bat '"%DOCKER_EXE%" build -t smartcitizen/react-frontend:%CI_IMAGE_TAG% -f frontend/Dockerfile frontend'
                    bat '"%DOCKER_EXE%" build -t smartcitizen/flask-service:%CI_IMAGE_TAG% -f flask-app/Dockerfile flask-app'
                    bat '"%DOCKER_EXE%" image inspect --format "{{.Id}}" smartcitizen/springboot-backend:%CI_IMAGE_TAG% smartcitizen/react-frontend:%CI_IMAGE_TAG% smartcitizen/flask-service:%CI_IMAGE_TAG%'
                    script { env.DOCKER_RESULT = 'PASSED' }
                }
            }
            post {
                failure {
                    script { env.DOCKER_RESULT = 'FAILED' }
                }
            }
        }

        stage('Deploy to Kubernetes') {
            when {
                expression { params.DEPLOY_TO_KUBERNETES }
            }
            steps {
                withEnv(["PATH+CI_TOOLS=${env.CI_TOOL_PATHS};${env.SystemRoot ?: 'C:\\Windows'}\\System32"]) {
                    script {
                        if (env.DOCKER_RESULT != 'PASSED') {
                            error('Kubernetes deployment requires the Docker image build stage to succeed.')
                        }

                        def expectedContext = params.KUBERNETES_PROVIDER == 'minikube' ? 'minikube' : 'docker-desktop'
                        def currentContext = bat(
                            script: '@echo off\r\nkubectl config current-context',
                            returnStdout: true
                        ).trim()
                        if (currentContext != expectedContext) {
                            error("Refusing deployment: active kubectl context '${currentContext}' does not match '${expectedContext}'.")
                        }
                        bat 'kubectl cluster-info'
                        if (params.KUBERNETES_PROVIDER == 'minikube') {
                            bat "minikube image load smartcitizen/springboot-backend:${env.CI_IMAGE_TAG}"
                            bat "minikube image load smartcitizen/react-frontend:${env.CI_IMAGE_TAG}"
                        }

                        bat 'kubectl apply -f k8s/00-namespace.yaml'
                        bat 'kubectl apply -f k8s/01-configmap.yaml -f k8s/02-pvc.yaml -f k8s/04-backend-service.yaml -f k8s/06-frontend-service.yaml'

                        withCredentials([
                            string(credentialsId: 'smart-citizen-jwt-secret', variable: 'JWT_SECRET'),
                            string(credentialsId: 'smart-citizen-admin-provision-key', variable: 'ADMIN_PROVISION_KEY')
                        ]) {
                            bat '''
                                @echo off
                                kubectl create secret generic smart-citizen-secrets --namespace=smart-citizen --from-literal=JWT_SECRET="%JWT_SECRET%" --from-literal=ADMIN_PROVISION_KEY="%ADMIN_PROVISION_KEY%" --dry-run=client -o yaml | kubectl apply -f -
                            '''
                        }

                        def backendManifest = readFile('k8s/03-backend-deployment.yaml')
                            .replace('image: smartcitizen/springboot-backend:1.0.0', "image: smartcitizen/springboot-backend:${env.CI_IMAGE_TAG}")
                        def frontendManifest = readFile('k8s/05-frontend-deployment.yaml')
                            .replace('image: smartcitizen/react-frontend:1.0.0', "image: smartcitizen/react-frontend:${env.CI_IMAGE_TAG}")
                        if (!backendManifest.contains("image: smartcitizen/springboot-backend:${env.CI_IMAGE_TAG}")
                            || !frontendManifest.contains("image: smartcitizen/react-frontend:${env.CI_IMAGE_TAG}")) {
                            error('Failed to apply the CI image tag to the Kubernetes deployment manifests.')
                        }

                        def deploymentManifestPath = "k8s/ci-deployment-${env.BUILD_NUMBER}.yaml"
                        try {
                            writeFile file: deploymentManifestPath, text: "${backendManifest}\n---\n${frontendManifest}"
                            bat "kubectl apply -f ${deploymentManifestPath}"
                            bat 'kubectl rollout status deployment/springboot-backend -n smart-citizen --timeout=180s'
                            bat 'kubectl rollout status deployment/react-frontend -n smart-citizen --timeout=180s'
                            bat 'kubectl get all -n smart-citizen'
                        } finally {
                            if (fileExists(deploymentManifestPath)) {
                                bat "del /q ${deploymentManifestPath}"
                            }
                        }

                        env.KUBERNETES_RESULT = 'DEPLOYED'
                        echo params.KUBERNETES_PROVIDER == 'minikube'
                            ? 'Deployment succeeded. Run: minikube service react-frontend -n smart-citizen'
                            : 'Deployment succeeded. Portal URL: http://localhost:30080'
                    }
                }
            }
            post {
                failure {
                    script { env.KUBERNETES_RESULT = 'DEPLOYMENT_FAILED' }
                }
            }
        }

        stage('Final Pipeline Validation') {
            steps {
                withEnv(["PATH+CI_TOOLS=${env.CI_TOOL_PATHS};${env.SystemRoot ?: 'C:\\Windows'}\\System32"]) {
                    bat '''
                        @echo off
                        if not exist frontend\\dist\\index.html exit /b 1
                        if not exist frontend\\target\\ci-reports\\frontend-results.xml exit /b 1
                        if not exist springboot-app\\target\\smart-citizen-complaint-portal-1.0.0.jar exit /b 1
                        if not exist springboot-app\\target\\surefire-reports\\*.xml exit /b 1
                        if not exist flask-app\\target\\ci-reports\\flask-results.xml exit /b 1
                    '''
                    bat '"%DOCKER_EXE%" image inspect --format "{{.Id}}" smartcitizen/springboot-backend:%CI_IMAGE_TAG% smartcitizen/react-frontend:%CI_IMAGE_TAG% smartcitizen/flask-service:%CI_IMAGE_TAG%'
                    echo 'All configured tests, build artifacts, and Docker images are present.'
                }
            }
        }
    }

    post {
        always {
            junit testResults: 'frontend/target/ci-reports/*.xml,springboot-app/target/surefire-reports/*.xml,flask-app/target/ci-reports/*.xml',
                allowEmptyResults: true
            archiveArtifacts artifacts: 'frontend/dist/**,frontend/target/ci-reports/*.xml,springboot-app/target/*.jar,springboot-app/target/surefire-reports/*.xml,flask-app/target/ci-reports/*.xml',
                allowEmptyArchive: true,
                fingerprint: true
            echo '================ CI/CD FINAL REPORT ================'
            echo "Pipeline result: ${currentBuild.currentResult}"
            echo "Git checkout: ${env.CHECKOUT_RESULT}"
            echo "Environment verification: ${env.ENVIRONMENT_RESULT}"
            echo "Branch: ${env.CHECKED_OUT_BRANCH ?: 'not checked out'}"
            echo "Commit: ${env.CHECKED_OUT_COMMIT ?: 'not checked out'}"
            echo "Frontend installation: ${env.FRONTEND_INSTALL_RESULT}"
            echo "Frontend build: ${env.FRONTEND_BUILD_RESULT}"
            echo "Frontend tests: ${env.FRONTEND_TEST_RESULT}"
            echo "Spring Boot tests: ${env.SPRING_TEST_RESULT}"
            echo "Flask tests: ${env.FLASK_TEST_RESULT}"
            echo "Docker: ${env.DOCKER_RESULT}"
            echo "Kubernetes deployment: ${env.KUBERNETES_RESULT}"
            echo 'Frontend bundle: frontend/dist/'
            echo 'Spring Boot JAR: springboot-app/target/smart-citizen-complaint-portal-1.0.0.jar'
            echo '===================================================='
        }
        success {
            echo 'SUCCESS: All configured CI stages passed; Kubernetes deployment was optional.'
        }
        failure {
            echo 'FAILURE: Review the failed stage and test reports above; no failed stage is treated as successful.'
        }
    }
}
