pipeline {
    agent any

    tools {
        jdk 'JDK-21'
        nodejs 'NodeJS-24'
    }

    parameters {
        booleanParam(
            name: 'BUILD_DOCKER_IMAGES',
            defaultValue: false,
            description: 'Build and validate Docker images and Compose configuration'
        )
        booleanParam(
            name: 'DEPLOY_TO_KUBERNETES',
            defaultValue: false,
            description: 'Deploy the built Spring Boot API and React portal to the selected local cluster'
        )
        choice(
            name: 'KUBERNETES_PROVIDER',
            choices: ['docker-desktop', 'minikube'],
            description: 'Expected kubectl context when Kubernetes deployment is enabled'
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
        FRONTEND_TEST_RESULT = 'NOT_RUN'
        SPRING_TEST_RESULT = 'NOT_RUN'
        FLASK_TEST_RESULT = 'NOT_RUN'
        DOCKER_RESULT = 'NOT_REQUESTED'
        KUBERNETES_RESULT = 'NOT_VALIDATED'
        CI_IMAGE_TAG = "ci-${BUILD_NUMBER}"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                script {
                    env.CHECKED_OUT_COMMIT = bat(
                        script: '@echo off\r\ngit rev-parse HEAD',
                        returnStdout: true
                    ).trim()
                    env.CHECKED_OUT_BRANCH = env.BRANCH_NAME ?: bat(
                        script: '@echo off\r\ngit rev-parse --abbrev-ref HEAD',
                        returnStdout: true
                    ).trim()
                    echo "Branch: ${env.CHECKED_OUT_BRANCH}"
                    echo "Commit: ${env.CHECKED_OUT_COMMIT}"
                }
            }
        }

        stage('Verify Environment') {
            steps {
                bat '''
                    @echo off
                    echo === Node.js ===
                    node --version || exit /b 1
                    echo === npm ===
                    npm --version || exit /b 1
                    echo === Java ===
                    java -version || exit /b 1
                    echo === Python ===
                    python --version || exit /b 1
                    echo === Maven Wrapper ===
                    call springboot-app\\mvnw.cmd --version
                    if errorlevel 1 exit /b 1
                    echo === Git ===
                    git --version || exit /b 1
                '''
            }
        }

        stage('Build Frontend') {
            steps {
                dir('frontend') {
                    bat 'call npm ci'
                    bat 'call npm run build'
                    bat 'if not exist dist\\index.html exit /b 1'
                    echo 'Frontend bundle verified at frontend/dist/index.html'
                }
            }
        }

        stage('Test Frontend') {
            steps {
                dir('frontend') {
                    script {
                        def testScript = bat(
                            script: '@echo off\r\nnode -e "const p=require(\'./package.json\'); process.stdout.write((p.scripts && p.scripts.test) || \'\')"',
                            returnStdout: true
                        ).trim()

                        if (testScript) {
                            echo "Running configured frontend test script: ${testScript}"
                            bat 'if not exist target\\ci-reports mkdir target\\ci-reports'
                            bat 'call npm test -- --reporter=default --reporter=junit --outputFile=target/ci-reports/frontend-results.xml'
                            env.FRONTEND_TEST_RESULT = 'PASSED'
                        } else {
                            env.FRONTEND_TEST_RESULT = 'NO_TEST_SCRIPT'
                            echo 'No frontend test script is configured in frontend/package.json; no frontend tests were run.'
                        }
                    }
                }
            }
            post {
                failure {
                    script { env.FRONTEND_TEST_RESULT = 'FAILED' }
                }
                always {
                    junit testResults: 'frontend/target/ci-reports/frontend-results.xml', allowEmptyResults: true
                }
            }
        }

        stage('Test Spring Boot') {
            steps {
                dir('springboot-app') {
                    bat 'call mvnw.cmd test'
                    bat 'if not exist target\\surefire-reports\\*.xml exit /b 1'
                    env.SPRING_TEST_RESULT = 'PASSED'
                }
            }
            post {
                failure {
                    script { env.SPRING_TEST_RESULT = 'FAILED' }
                }
                always {
                    junit testResults: 'springboot-app/target/surefire-reports/*.xml', allowEmptyResults: true
                }
            }
        }

        stage('Package Spring Boot') {
            steps {
                dir('springboot-app') {
                    bat 'call mvnw.cmd package -DskipTests'
                    bat 'if not exist target\\smart-citizen-complaint-portal-1.0.0.jar exit /b 1'
                    bat 'echo Generated JAR files: & dir /b target\\*.jar'
                    echo 'Executable JAR: springboot-app/target/smart-citizen-complaint-portal-1.0.0.jar'
                }
            }
        }

        stage('Test Flask') {
            steps {
                script {
                    env.FLASK_VENV = "${env.WORKSPACE}@tmp\\flask-ci-${env.BUILD_NUMBER}"
                }
                dir('flask-app') {
                    bat 'python --version'
                    bat 'python -m venv "%FLASK_VENV%"'
                    bat '"%FLASK_VENV%\\Scripts\\python.exe" -m pip install --disable-pip-version-check -r requirements.txt'
                    bat '"%FLASK_VENV%\\Scripts\\python.exe" -c "import ast,pathlib; [ast.parse(p.read_text(encoding=\'utf-8\'), filename=str(p)) for p in map(pathlib.Path, (\'app.py\', \'test_app.py\'))]"'
                    bat 'if not exist target\\ci-reports mkdir target\\ci-reports'
                    bat '"%FLASK_VENV%\\Scripts\\python.exe" -m pytest -q test_app.py --junitxml=target/ci-reports/flask-results.xml'
                    env.FLASK_TEST_RESULT = 'PASSED'
                }
            }
            post {
                failure {
                    script { env.FLASK_TEST_RESULT = 'FAILED' }
                }
                always {
                    script {
                        if (env.FLASK_VENV) {
                            bat "if exist \"%FLASK_VENV%\" rmdir /s /q \"%FLASK_VENV%\""
                        }
                    }
                    junit testResults: 'flask-app/target/ci-reports/flask-results.xml', allowEmptyResults: true
                }
            }
        }

        stage('Build Docker Images') {
            when {
                expression { params.BUILD_DOCKER_IMAGES || params.DEPLOY_TO_KUBERNETES }
            }
            steps {
                bat 'docker info'
                bat '''
                    @echo off
                    set "JWT_SECRET=ci-compose-validation-secret-not-for-authentication"
                    docker compose config --quiet
                '''
                bat "docker build -t smartcitizen/springboot-backend:${env.CI_IMAGE_TAG} -f springboot-app/Dockerfile springboot-app"
                bat "docker build -t smartcitizen/react-frontend:${env.CI_IMAGE_TAG} -f frontend/Dockerfile frontend"
                bat "docker build -t smartcitizen/flask-service:${env.CI_IMAGE_TAG} -f flask-app/Dockerfile flask-app"
                bat "docker image inspect smartcitizen/springboot-backend:${env.CI_IMAGE_TAG} smartcitizen/react-frontend:${env.CI_IMAGE_TAG} smartcitizen/flask-service:${env.CI_IMAGE_TAG}"
                script { env.DOCKER_RESULT = 'PASSED' }
            }
            post {
                failure {
                    script { env.DOCKER_RESULT = 'FAILED' }
                }
            }
        }

        stage('Validate Kubernetes Manifests') {
            steps {
                script {
                    def kubectlAvailable = bat(
                        script: '@echo off\r\nwhere kubectl >nul 2>nul',
                        returnStatus: true
                    ) == 0

                    if (!kubectlAvailable) {
                        env.KUBERNETES_RESULT = 'SKIPPED: kubectl is not installed on this agent'
                        echo env.KUBERNETES_RESULT
                    } else {
                        def contextStatus = bat(
                            script: '@echo off\r\nkubectl config current-context >nul 2>nul',
                            returnStatus: true
                        )
                        if (contextStatus != 0) {
                            env.KUBERNETES_RESULT = 'SKIPPED: no Kubernetes context is configured'
                            echo env.KUBERNETES_RESULT
                        } else {
                            def currentContext = bat(
                                script: '@echo off\r\nkubectl config current-context',
                                returnStdout: true
                            ).trim()
                            echo "Current Kubernetes context: ${currentContext}"
                            bat 'kubectl apply --dry-run=client --validate=false -f k8s/'
                            env.KUBERNETES_RESULT = 'MANIFESTS_VALIDATED'
                        }
                    }
                }
            }
            post {
                failure {
                    script { env.KUBERNETES_RESULT = 'VALIDATION_FAILED' }
                }
            }
        }

        stage('Deploy to Kubernetes') {
            when {
                expression { params.DEPLOY_TO_KUBERNETES }
            }
            steps {
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
            post {
                failure {
                    script { env.KUBERNETES_RESULT = 'DEPLOYMENT_FAILED' }
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
            echo "Branch: ${env.CHECKED_OUT_BRANCH ?: 'not checked out'}"
            echo "Commit: ${env.CHECKED_OUT_COMMIT ?: 'not checked out'}"
            echo "Frontend tests: ${env.FRONTEND_TEST_RESULT}"
            echo "Spring Boot tests: ${env.SPRING_TEST_RESULT}"
            echo "Flask tests: ${env.FLASK_TEST_RESULT}"
            echo "Docker: ${env.DOCKER_RESULT}"
            echo "Kubernetes: ${env.KUBERNETES_RESULT}"
            echo 'Frontend bundle: frontend/dist/'
            echo 'Spring Boot JAR: springboot-app/target/smart-citizen-complaint-portal-1.0.0.jar'
            echo '===================================================='
        }
        success {
            echo 'SUCCESS: CI stages completed. Optional Docker/Kubernetes stages are reported above.'
        }
        failure {
            echo 'FAILURE: Review the failed stage and test reports above; no failed stage is treated as successful.'
        }
    }
}
